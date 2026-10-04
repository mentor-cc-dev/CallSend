import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger('TrackingService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async getLandingData(shortCode: string, ip?: string, userAgent?: string) {
    const messageLog = await this.prisma.messageLog.findUnique({
      where: { shortCode },
      include: {
        organization: true,
        branch: true,
        template: true,
        customer: true,
      },
    });

    if (!messageLog) {
      throw new NotFoundException('Sahifa topilmadi yoki havola eskirgan');
    }

    const isFirstOpen = !messageLog.openedAt;

    // Update MessageLog opened timestamp
    if (isFirstOpen) {
      await this.prisma.messageLog.update({
        where: { id: messageLog.id },
        data: {
          status: 'OPENED',
          openedAt: new Date(),
        },
      });

      // Record first page view event
      await this.prisma.customerEvent.create({
        data: {
          messageLogId: messageLog.id,
          eventType: 'PAGE_VIEW',
          ipAddress: ip || null,
          userAgent: userAgent || null,
        },
      });

      // Advance CRM deal stage: If in stage 0 (Yangi Lead), move to stage 1 (Havola Ochildi)
      const openDeal = await this.prisma.deal.findFirst({
        where: { customerId: messageLog.customerId, status: 'OPEN' },
        include: { stage: true },
      });

      if (openDeal && openDeal.stage.orderIndex === 0) {
        const nextStage = await this.prisma.pipelineStage.findFirst({
          where: { organizationId: messageLog.organizationId, orderIndex: 1 },
        });
        if (nextStage) {
          await this.prisma.deal.update({
            where: { id: openDeal.id },
            data: { stageId: nextStage.id },
          });
        }
      }

      // REAL-TIME RADAR SIGNAL: Emit to Operator
      this.eventsGateway.emitCustomerOpenedLink(
        messageLog.organizationId,
        messageLog.branchId,
        {
          messageLogId: messageLog.id,
          shortCode: messageLog.shortCode,
          phoneNumber: messageLog.customer.phoneNumber,
          customerName: messageLog.customer.fullName || 'Mijoz',
          userAgent: userAgent ? this.simplifyUserAgent(userAgent) : 'Mobil qurilma',
          openedAt: new Date(),
        },
      );

      this.logger.log(`Radar trigger: Customer ${messageLog.customer.phoneNumber} opened landing ${shortCode}`);
    }

    return {
      id: messageLog.id,
      shortCode: messageLog.shortCode,
      organization: {
        id: messageLog.organization.id,
        name: messageLog.organization.name,
      },
      branch: messageLog.branch
        ? {
            id: messageLog.branch.id,
            name: messageLog.branch.name,
            address: messageLog.branch.address,
            latitude: messageLog.branch.latitude,
            longitude: messageLog.branch.longitude,
            phoneNumbers: messageLog.branch.phoneNumbers,
          }
        : null,
      customer: {
        name: messageLog.customer.fullName || null,
        phoneNumber: messageLog.customer.phoneNumber,
      },
      content: {
        title: messageLog.template?.cardTitle || messageLog.organization.name,
        description: messageLog.template?.cardDescription || 'Bizning maxsus taklifimiz va xizmatlarimiz',
        imageUrl: messageLog.template?.cardImageUrl || null,
        price: messageLog.template?.price || null,
        ctaTelegramLink: messageLog.template?.ctaTelegramLink || null,
        ctaMapsLink: messageLog.template?.ctaMapsLink || null,
      },
    };
  }

  async recordEvent(shortCode: string, eventType: string, payload?: any, ip?: string, userAgent?: string) {
    const messageLog = await this.prisma.messageLog.findUnique({
      where: { shortCode },
      include: { customer: true },
    });

    if (!messageLog) {
      throw new NotFoundException('Havola topilmadi');
    }

    const event = await this.prisma.customerEvent.create({
      data: {
        messageLogId: messageLog.id,
        eventType,
        metadata: payload ? JSON.stringify(payload) : null,
        ipAddress: ip || null,
        userAgent: userAgent || null,
      },
    });

    // Notify Operator HUD
    this.eventsGateway.emitCustomerEvent(
      messageLog.organizationId,
      messageLog.branchId,
      {
        messageLogId: messageLog.id,
        phoneNumber: messageLog.customer.phoneNumber,
        eventType,
        payload,
        timestamp: event.createdAt,
      },
    );

    return { success: true };
  }

  async createPublicOrder(shortCode: string, itemsSummary: string, customerNote?: string) {
    const messageLog = await this.prisma.messageLog.findUnique({
      where: { shortCode },
      include: { customer: true, template: true },
    });

    if (!messageLog) {
      throw new NotFoundException('Havola topilmadi');
    }

    const order = await this.prisma.order.create({
      data: {
        organizationId: messageLog.organizationId,
        branchId: messageLog.branchId,
        customerId: messageLog.customerId,
        messageLogId: messageLog.id,
        status: 'NEW',
        totalAmount: messageLog.template?.price || 0,
        itemsSummary: itemsSummary || messageLog.template?.cardTitle || 'Yangi buyurtma',
      },
      include: {
        customer: true,
      },
    });

    // Advance CRM Deal to Order stage (orderIndex = 3 or isWon = true)
    const openDeal = await this.prisma.deal.findFirst({
      where: { customerId: messageLog.customerId, status: 'OPEN' },
    });
    if (openDeal) {
      const orderStage = await this.prisma.pipelineStage.findFirst({
        where: { organizationId: messageLog.organizationId, orderIndex: 3 },
      });
      if (orderStage) {
        await this.prisma.deal.update({
          where: { id: openDeal.id },
          data: {
            stageId: orderStage.id,
            amount: order.totalAmount,
          },
        });
      }
    }

    // Update customer stats
    await this.prisma.customer.update({
      where: { id: messageLog.customerId },
      data: {
        totalOrders: { increment: 1 },
        totalSpent: { increment: order.totalAmount },
      },
    });

    // Notify Operator HUD
    this.eventsGateway.emitNewOrder(
      messageLog.organizationId,
      messageLog.branchId,
      {
        orderId: order.id,
        phoneNumber: messageLog.customer.phoneNumber,
        customerName: messageLog.customer.fullName || 'Mijoz',
        amount: order.totalAmount,
        itemsSummary: order.itemsSummary,
        createdAt: order.createdAt,
      },
    );

    return {
      success: true,
      orderId: order.id,
      message: 'Buyurtmangiz qabul qilindi! Tez orada operatorimiz siz bilan bog‘lanadi.',
    };
  }

  private simplifyUserAgent(ua: string): string {
    if (ua.includes('iPhone')) return 'iPhone (Safari)';
    if (ua.includes('Android')) return 'Android Phone';
    if (ua.includes('Macintosh')) return 'Mac (Desktop)';
    if (ua.includes('Windows')) return 'Windows PC';
    return 'Mobil brauzer';
  }
}
