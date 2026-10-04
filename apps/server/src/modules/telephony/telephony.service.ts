import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { MessagesService } from '../messages/messages.service';

export interface TelephonyEventDto {
  event: 'CALL_START' | 'CALL_END' | 'CALL_MISSED';
  caller_number: string;
  destination_number?: string;
  device_token?: string;
  duration?: number;
  timestamp?: string;
}

@Injectable()
export class TelephonyService {
  private readonly logger = new Logger('TelephonyService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly messagesService: MessagesService,
  ) {}

  async handleCallEvent(dto: TelephonyEventDto) {
    this.logger.log(`Telephony event received: ${dto.event} from ${dto.caller_number}`);

    // 1. Identify organization and branch by device token or destination number
    let device = null;
    let organizationId: string | null = null;
    let branchId: string | null = null;

    if (dto.device_token) {
      device = await this.prisma.device.findUnique({
        where: { deviceToken: dto.device_token },
      });
      if (device) {
        organizationId = device.organizationId;
        branchId = device.branchId;
        // Update heartbeat
        await this.prisma.device.update({
          where: { id: device.id },
          data: { lastHeartbeatAt: new Date() },
        });
      }
    }

    // Fallback: If no device token, use first active organization for demo/testing
    if (!organizationId) {
      const defaultOrg = await this.prisma.organization.findFirst({
        where: { subscriptionStatus: 'ACTIVE' },
        include: { branches: true },
      });
      if (!defaultOrg) {
        throw new NotFoundException('No active organization configured in system');
      }
      organizationId = defaultOrg.id;
      branchId = defaultOrg.branches[0]?.id || null;
    }

    // 2. Fetch or create Customer record
    let customer = await this.prisma.customer.findUnique({
      where: {
        organizationId_phoneNumber: {
          organizationId,
          phoneNumber: dto.caller_number,
        },
      },
      include: {
        orders: { take: 3, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          organizationId,
          phoneNumber: dto.caller_number,
          lastCallAt: new Date(),
        },
        include: { orders: true },
      });
    } else {
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { lastCallAt: new Date() },
      });
    }

    // 3. Process event types
    if (dto.event === 'CALL_START') {
      const callLog = await this.prisma.callLog.create({
        data: {
          organizationId,
          branchId,
          customerId: customer.id,
          deviceId: device?.id || null,
          callerNumber: dto.caller_number,
          destinationNumber: dto.destination_number || null,
          direction: 'INBOUND',
          status: 'RINGING',
        },
      });

      // Check or auto-create CRM Deal for this lead
      const existingDeal = await this.prisma.deal.findFirst({
        where: { customerId: customer.id, status: 'OPEN' },
      });

      if (!existingDeal) {
        const firstStage = await this.prisma.pipelineStage.findFirst({
          where: { organizationId },
          orderBy: { orderIndex: 'asc' },
        });
        if (firstStage) {
          await this.prisma.deal.create({
            data: {
              organizationId,
              branchId,
              customerId: customer.id,
              stageId: firstStage.id,
              title: `Murojaat: ${dto.caller_number}`,
              amount: 0,
              status: 'OPEN',
            },
          });
        }
      }

      // Emit incoming call modal to Operator HUD
      this.eventsGateway.emitIncomingCall(organizationId, branchId, {
        callId: callLog.id,
        callerNumber: dto.caller_number,
        customerId: customer.id,
        customerName: customer.fullName || 'Yangi mijoz',
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        branchId,
        startedAt: callLog.startedAt,
      });

      return { status: 'ringing_recorded', callLogId: callLog.id };
    }

    if (dto.event === 'CALL_END' || dto.event === 'CALL_MISSED') {
      // Find active call or create log
      const activeCall = await this.prisma.callLog.findFirst({
        where: {
          organizationId,
          callerNumber: dto.caller_number,
          endedAt: null,
        },
        orderBy: { startedAt: 'desc' },
      });

      let callLogId = activeCall?.id;
      if (activeCall) {
        await this.prisma.callLog.update({
          where: { id: activeCall.id },
          data: {
            status: dto.event === 'CALL_MISSED' ? 'MISSED' : 'ANSWERED',
            duration: dto.duration || 0,
            endedAt: new Date(),
          },
        });
      } else {
        const newLog = await this.prisma.callLog.create({
          data: {
            organizationId,
            branchId,
            customerId: customer.id,
            deviceId: device?.id || null,
            callerNumber: dto.caller_number,
            destinationNumber: dto.destination_number || null,
            status: dto.event === 'CALL_MISSED' ? 'MISSED' : 'ANSWERED',
            duration: dto.duration || 0,
            endedAt: new Date(),
          },
        });
        callLogId = newLog.id;
      }

      this.eventsGateway.emitCallEnded(organizationId, branchId, {
        callId: callLogId,
        callerNumber: dto.caller_number,
        duration: dto.duration || 0,
        status: dto.event === 'CALL_MISSED' ? 'MISSED' : 'ANSWERED',
      });

      // AUTO-PILOT EXECUTION
      const org = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (org && org.autoPilotEnabled) {
        this.logger.log(`Auto-Pilot triggered for ${dto.caller_number} (Org: ${org.name})`);
        
        // Asynchronously dispatch message without blocking response
        setTimeout(async () => {
          try {
            await this.messagesService.dispatchMessage({
              organizationId: org.id,
              branchId: branchId || undefined,
              phoneNumber: dto.caller_number,
              callLogId: callLogId,
            });
            this.logger.log(`Auto-Pilot SMS successfully queued for ${dto.caller_number}`);
          } catch (err) {
            this.logger.error(`Auto-Pilot dispatch failed: ${err.message}`);
          }
        }, (org.autoPilotDelaySec || 2) * 1000);
      }

      return { status: 'call_ended_processed', callLogId };
    }

    return { status: 'unknown_event' };
  }

  async registerDevice(organizationId: string, branchId: string | null, modelName: string) {
    const token = `dev_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    const device = await this.prisma.device.create({
      data: {
        organizationId,
        branchId,
        deviceToken: token,
        modelName,
        batteryLevel: 100,
      },
    });
    return device;
  }

  async recordHeartbeat(deviceToken: string, batteryLevel?: number) {
    return this.prisma.device.update({
      where: { deviceToken },
      data: {
        lastHeartbeatAt: new Date(),
        batteryLevel: batteryLevel ?? undefined,
      },
    });
  }
}
