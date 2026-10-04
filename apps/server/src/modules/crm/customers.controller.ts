import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { Customer360Service } from './customers.service';

@Controller('api/v1/crm/customers')
export class CustomersController {
  constructor(private readonly customerService: Customer360Service) {}

  @Get(':id/timeline')
  async getTimeline(@Param('id') id: string) {
    return this.customerService.getCustomer360(id);
  }

  @Post(':id/notes')
  async addNote(
    @Param('id') id: string,
    @Body('content') content: string,
    @Body('userId') userId?: string,
  ) {
    return this.customerService.addNote(id, content, userId);
  }

  @Patch(':id')
  async updateCustomer(
    @Param('id') id: string,
    @Body() body: { fullName?: string; companyName?: string; address?: string; tags?: string },
  ) {
    return this.customerService.updateCustomer(id, body);
  }
}
