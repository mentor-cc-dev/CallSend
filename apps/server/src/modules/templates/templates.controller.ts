import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { TemplatesService, CreateTemplateDto } from './templates.service';

@Controller('api/v1/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get(':organizationId')
  async list(
    @Param('organizationId') organizationId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.templatesService.list(organizationId, branchId);
  }

  @Post()
  async create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.templatesService.delete(id);
  }
}
