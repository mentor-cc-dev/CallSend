import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { DealsService, CreateDealDto } from './deals.service';

@Controller('api/v1/crm/deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get('pipeline/:organizationId')
  async getPipeline(
    @Param('organizationId') organizationId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.dealsService.getPipeline(organizationId, branchId);
  }

  @Post()
  async createDeal(@Body() dto: CreateDealDto) {
    return this.dealsService.createDeal(dto);
  }

  @Patch(':id/stage')
  async updateStage(
    @Param('id') id: string,
    @Body('stageId') stageId: string,
  ) {
    return this.dealsService.updateDealStage(id, stageId);
  }

  @Patch(':id')
  async updateDeal(
    @Param('id') id: string,
    @Body() body: { title?: string; amount?: number; assignedUserId?: string },
  ) {
    return this.dealsService.updateDeal(id, body);
  }
}
