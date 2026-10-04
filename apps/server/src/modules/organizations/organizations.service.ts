import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDefaultOrganization() {
    const org = await this.prisma.organization.findFirst({
      include: {
        branches: true,
        devices: true,
      },
    });
    if (!org) throw new NotFoundException('Tashkilot topilmadi');
    return this.getDetails(org.id);
  }

  async getDetails(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        branches: true,
        devices: true,
      },
    });

    if (!org) {
      throw new NotFoundException('Tashkilot topilmadi');
    }

    const totalCalls = await this.prisma.callLog.count({ where: { organizationId: id } });
    const totalMessages = await this.prisma.messageLog.count({ where: { organizationId: id } });
    const openedMessages = await this.prisma.messageLog.count({
      where: { organizationId: id, status: 'OPENED' },
    });
    const totalOrders = await this.prisma.order.count({ where: { organizationId: id } });

    const openRate = totalMessages > 0 ? Math.round((openedMessages / totalMessages) * 100) : 0;

    return {
      organization: org,
      stats: {
        totalCalls,
        totalMessages,
        openedMessages,
        openRate,
        totalOrders,
      },
    };
  }

  async updateSettings(id: string, data: { autoPilotEnabled?: boolean; autoPilotDelaySec?: number }) {
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async getCallLogs(organizationId: string, branchId?: string, limit: number = 30) {
    return this.prisma.callLog.findMany({
      where: {
        organizationId,
        branchId: branchId || undefined,
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        customer: true,
        messageLogs: {
          take: 1,
          include: { events: true },
        },
      },
    });
  }

  async getOrders(organizationId: string, limit: number = 30) {
    return this.prisma.order.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { customer: true, branch: true },
    });
  }
}
