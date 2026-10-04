import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import { ISmsProvider } from './providers/sms-provider.interface';
import { MockSmsProvider } from './providers/mock-sms.provider';
import { EskizSmsProvider } from './providers/eskiz.provider';
import { nanoid } from 'nanoid';

export interface DispatchMessageDto {
  organizationId: string;
  branchId?: string;
  phoneNumber: string;
  templateId?: string;
  callLogId?: string;
  customText?: string;
}

@Injectable()
export class MessagesService {
  private readonly logger = new Logger('MessagesService');
  private smsProvider: ISmsProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly configService: ConfigService,
  ) {
    const isMock = this.configService.get<string>('ESKIZ_MOCK_MODE') === 'true';
    const eskizEmail = this.configService.get<string>('ESKIZ_EMAIL');
    const eskizPassword = this.configService.get<string>('ESKIZ_PASSWORD');

    if (!isMock && eskizEmail && eskizPassword) {
      this.smsProvider = new EskizSmsProvider(eskizEmail, eskizPassword);
      this.logger.log('Active SMS Provider: Eskiz.uz Production');
    } else {
      this.smsProvider = new MockSmsProvider();
      this.logger.log('Active SMS Provider: Mock Sandbox (Logs to console)');
    }
  }

  async dispatchMessage(dto: DispatchMessageDto) {
    // 1. Fetch organization & check balance
    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });
    if (!org) {
      throw new BadRequestException('Organization not found');
    }
    if (org.smsBalance <= 0) {
      throw new BadRequestException('SMS balansi tugagan. Iltimos hisobingizni to‘ldiring.');
    }

    // 2. Fetch or create Customer
    let customer = await this.prisma.customer.findUnique({
      where: {
        organizationId_phoneNumber: {
          organizationId: dto.organizationId,
          phoneNumber: dto.phoneNumber,
        },
      },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          organizationId: dto.organizationId,
          phoneNumber: dto.phoneNumber,
        },
      });
    }

    // 3. Select Template
    let template = null;
    if (dto.templateId) {
      template = await this.prisma.template.findUnique({
        where: { id: dto.templateId },
      });
    } else {
      // Default auto-pilot template or first available template
      template = await this.prisma.template.findFirst({
        where: {
          organizationId: dto.organizationId,
          isAutoPilotDefault: true,
        },
      });
      if (!template) {
        template = await this.prisma.template.findFirst({
          where: { organizationId: dto.organizationId },
        });
      }
    }

    // 4. Generate unique short code for micro-landing
    const shortCode = nanoid(7);
    const landingBaseUrl = this.configService.get<string>('PUBLIC_LANDING_URL') || 'http://localhost:3000/m';
    const dynamicLink = `${landingBaseUrl}/${shortCode}`;

    // 5. Build message text
    let messageBody = dto.customText;
    if (!messageBody && template) {
      messageBody = template.messageText;
    }
    if (!messageBody) {
      messageBody = `Salom! Biz bilan bog'langaningiz uchun tashakkur. Katalog va narxlar: {link}`;
    }

    // Replace placeholder
    if (messageBody.includes('{link}')) {
      messageBody = messageBody.replace('{link}', dynamicLink);
    } else {
      messageBody = `${messageBody}\n${dynamicLink}`;
    }

    // 6. Create MessageLog in Database
    const messageLog = await this.prisma.messageLog.create({
      data: {
        organizationId: dto.organizationId,
        branchId: dto.branchId || null,
        customerId: customer.id,
        callLogId: dto.callLogId || null,
        templateId: template?.id || null,
        channel: 'SMS',
        status: 'PENDING',
        shortCode,
        cost: 1.0,
      },
      include: {
        template: true,
        customer: true,
      },
    });

    // 7. Dispatch through SMS Provider
    const result = await this.smsProvider.sendSms({
      phoneNumber: dto.phoneNumber,
      message: messageBody,
    });

    // 8. Update log status & deduct balance
    const updatedLog = await this.prisma.messageLog.update({
      where: { id: messageLog.id },
      data: {
        status: result.success ? 'SENT' : 'FAILED',
      },
      include: {
        template: true,
        customer: true,
      },
    });

    if (result.success) {
      await this.prisma.organization.update({
        where: { id: dto.organizationId },
        data: {
          smsBalance: { decrement: 1 },
        },
      });
    }

    // 9. Notify Operator HUD in real-time
    this.eventsGateway.emitCustomerEvent(dto.organizationId, dto.branchId || null, {
      type: 'SMS_SENT',
      messageLog: updatedLog,
      phoneNumber: dto.phoneNumber,
      shortCode,
      dynamicLink,
    });

    return {
      success: result.success,
      shortCode,
      dynamicLink,
      messageLog: updatedLog,
      error: result.error,
    };
  }

  async getLogs(organizationId: string, limit: number = 50) {
    return this.prisma.messageLog.findMany({
      where: { organizationId },
      orderBy: { sentAt: 'desc' },
      take: limit,
      include: {
        template: true,
        customer: true,
        events: true,
      },
    });
  }
}
