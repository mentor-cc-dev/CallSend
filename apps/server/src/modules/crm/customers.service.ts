import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class Customer360Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async getCustomer360(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        assignedUser: true,
        organization: true,
        deals: {
          include: { stage: true },
          orderBy: { createdAt: 'desc' },
        },
        callLogs: {
          orderBy: { startedAt: 'desc' },
          take: 20,
        },
        messageLogs: {
          include: { template: true, events: true },
          orderBy: { sentAt: 'desc' },
          take: 20,
        },
        notes: {
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          include: { assignedUser: true },
          orderBy: { dueDate: 'asc' },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) throw new NotFoundException('Mijoz topilmadi');

    // Build unified chronological timeline
    const timeline: any[] = [];

    customer.callLogs.forEach((c) => {
      timeline.push({
        id: `call_${c.id}`,
        type: 'CALL',
        timestamp: c.startedAt,
        title: `Kiruvchi qo‘ng‘iroq: ${c.status}`,
        description: `Davomiyligi: ${c.duration} soniya (${c.direction})`,
        metadata: { callId: c.id, status: c.status, duration: c.duration },
      });
    });

    customer.messageLogs.forEach((m) => {
      timeline.push({
        id: `msg_${m.id}`,
        type: 'SMS',
        timestamp: m.sentAt,
        title: `SMS yuborildi: ${m.status}`,
        description: m.template ? `Shablon: "${m.template.title}"` : 'Maxsus xabar',
        metadata: {
          shortCode: m.shortCode,
          openedAt: m.openedAt,
          eventsCount: m.events.length,
        },
      });

      if (m.openedAt) {
        timeline.push({
          id: `open_${m.id}`,
          type: 'LINK_OPENED',
          timestamp: m.openedAt,
          title: 'Mijoz havolani ochdi (Micro-Landing)',
          description: `clls.nd/${m.shortCode} sahifasi ko‘rildi`,
          metadata: { shortCode: m.shortCode },
        });
      }
    });

    customer.notes.forEach((n) => {
      timeline.push({
        id: `note_${n.id}`,
        type: 'NOTE',
        timestamp: n.createdAt,
        title: `Operator izohi (${n.user?.fullName || 'Operator'})`,
        description: n.content,
        metadata: { author: n.user?.fullName },
      });
    });

    customer.orders.forEach((o) => {
      timeline.push({
        id: `order_${o.id}`,
        type: 'ORDER',
        timestamp: o.createdAt,
        title: `Yangi buyurtma: ${o.status}`,
        description: `${o.itemsSummary} — ${Number(o.totalAmount).toLocaleString('uz-UZ')} so‘m`,
        metadata: { orderId: o.id, amount: o.totalAmount },
      });
    });

    // Sort timeline descending by timestamp
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      customer: {
        id: customer.id,
        fullName: customer.fullName || 'Noma‘lum mijoz',
        phoneNumber: customer.phoneNumber,
        companyName: customer.companyName,
        address: customer.address,
        tags: customer.tags ? customer.tags.split(',').map((t) => t.trim()) : [],
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        leadSource: customer.leadSource,
        assignedUser: customer.assignedUser?.fullName || null,
        createdAt: customer.createdAt,
      },
      activeDeal: customer.deals[0] || null,
      tasks: customer.tasks,
      timeline,
    };
  }

  async addNote(customerId: string, content: string, userId?: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('Mijoz topilmadi');

    const note = await this.prisma.customerNote.create({
      data: {
        organizationId: customer.organizationId,
        customerId,
        userId: userId || null,
        content,
      },
      include: { user: true },
    });

    this.eventsGateway.emitCustomerEvent(customer.organizationId, null, {
      type: 'CRM_NOTE_ADDED',
      customerId,
      note,
    });

    return note;
  }

  async updateCustomer(
    customerId: string,
    data: { fullName?: string; companyName?: string; address?: string; tags?: string; assignedUserId?: string },
  ) {
    return this.prisma.customer.update({
      where: { id: customerId },
      data,
    });
  }
}
