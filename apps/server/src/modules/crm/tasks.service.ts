import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';

export interface CreateTaskDto {
  organizationId: string;
  branchId?: string;
  customerId?: string;
  assignedUserId?: string;
  title: string;
  dueDate: string;
  priority?: string;
}

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async getTasks(organizationId: string, branchId?: string, status?: string) {
    return this.prisma.crmTask.findMany({
      where: {
        organizationId,
        branchId: branchId || undefined,
        status: status || undefined,
      },
      orderBy: { dueDate: 'asc' },
      include: {
        customer: true,
        assignedUser: true,
      },
    });
  }

  async createTask(dto: CreateTaskDto) {
    const task = await this.prisma.crmTask.create({
      data: {
        organizationId: dto.organizationId,
        branchId: dto.branchId || null,
        customerId: dto.customerId || null,
        assignedUserId: dto.assignedUserId || null,
        title: dto.title,
        dueDate: new Date(dto.dueDate),
        priority: dto.priority || 'MEDIUM',
        status: 'PENDING',
      },
      include: {
        customer: true,
        assignedUser: true,
      },
    });

    this.eventsGateway.emitCustomerEvent(dto.organizationId, dto.branchId || null, {
      type: 'CRM_TASK_CREATED',
      task,
    });

    return task;
  }

  async updateTaskStatus(taskId: string, status: 'PENDING' | 'COMPLETED' | 'CANCELLED') {
    const task = await this.prisma.crmTask.update({
      where: { id: taskId },
      data: { status },
      include: { customer: true },
    });

    this.eventsGateway.emitCustomerEvent(task.organizationId, task.branchId, {
      type: 'CRM_TASK_UPDATED',
      task,
    });

    return task;
  }
}
