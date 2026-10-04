import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { TasksService, CreateTaskDto } from './tasks.service';

@Controller('api/v1/crm/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get(':organizationId')
  async getTasks(
    @Param('organizationId') organizationId: string,
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
  ) {
    return this.tasksService.getTasks(organizationId, branchId, status);
  }

  @Post()
  async createTask(@Body() dto: CreateTaskDto) {
    return this.tasksService.createTask(dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'PENDING' | 'COMPLETED' | 'CANCELLED',
  ) {
    return this.tasksService.updateTaskStatus(id, status);
  }
}
