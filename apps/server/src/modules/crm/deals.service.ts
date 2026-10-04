import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';

export interface CreateDealDto {
  organizationId: string;
  branchId?: string;
  customerId: string;
  stageId?: string;
  assignedUserId?: string;
  title: string;
  amount?: number;
}

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async getPipeline(organizationId: string, branchId?: string) {
    const stages = await this.prisma.pipelineStage.findMany({
      where: { organizationId },
      orderBy: { orderIndex: 'asc' },
      include: {
        deals: {
          where: {
            branchId: branchId || undefined,
          },
          include: {
            customer: true,
            assignedUser: true,
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    // Compute summaries
    const pipelineData = stages.map((stage) => {
      const totalAmount = stage.deals.reduce((sum, d) => sum + d.amount, 0);
      return {
        id: stage.id,
        name: stage.name,
        orderIndex: stage.orderIndex,
        color: stage.color,
        isWon: stage.isWon,
        isLost: stage.isLost,
        dealCount: stage.deals.length,
        totalAmount,
        deals: stage.deals,
      };
    });

    const totalDeals = pipelineData.reduce((acc, s) => acc + s.dealCount, 0);
    const totalPipelineValue = pipelineData.reduce((acc, s) => acc + s.totalAmount, 0);

    return {
      stages: pipelineData,
      summary: {
        totalDeals,
        totalPipelineValue,
      },
    };
  }

  async createDeal(dto: CreateDealDto) {
    // If no stage provided, put into first stage
    let stageId = dto.stageId;
    if (!stageId) {
      const firstStage = await this.prisma.pipelineStage.findFirst({
        where: { organizationId: dto.organizationId },
        orderBy: { orderIndex: 'asc' },
      });
      if (!firstStage) throw new NotFoundException('Voronka bosqichlari topilmadi');
      stageId = firstStage.id;
    }

    const deal = await this.prisma.deal.create({
      data: {
        organizationId: dto.organizationId,
        branchId: dto.branchId || null,
        customerId: dto.customerId,
        stageId,
        assignedUserId: dto.assignedUserId || null,
        title: dto.title,
        amount: dto.amount || 0,
        status: 'OPEN',
      },
      include: {
        customer: true,
        stage: true,
        assignedUser: true,
      },
    });

    this.eventsGateway.emitCustomerEvent(dto.organizationId, dto.branchId || null, {
      type: 'CRM_DEAL_CREATED',
      deal,
    });

    return deal;
  }

  async updateDealStage(dealId: string, targetStageId: string) {
    const stage = await this.prisma.pipelineStage.findUnique({
      where: { id: targetStageId },
    });
    if (!stage) throw new NotFoundException('Bosqich topilmadi');

    let status = 'OPEN';
    if (stage.isWon) status = 'WON';
    if (stage.isLost) status = 'LOST';

    const updated = await this.prisma.deal.update({
      where: { id: dealId },
      data: {
        stageId: targetStageId,
        status,
      },
      include: {
        customer: true,
        stage: true,
        assignedUser: true,
      },
    });

    this.eventsGateway.emitCustomerEvent(updated.organizationId, updated.branchId, {
      type: 'CRM_DEAL_MOVED',
      deal: updated,
    });

    return updated;
  }

  async updateDeal(dealId: string, data: { title?: string; amount?: number; assignedUserId?: string }) {
    return this.prisma.deal.update({
      where: { id: dealId },
      data,
      include: {
        customer: true,
        stage: true,
        assignedUser: true,
      },
    });
  }
}
