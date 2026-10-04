import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';

@Controller('api/v1/organizations')
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Get('active/default')
  async getDefault() {
    return this.orgService.getDefaultOrganization();
  }

  @Get(':id')
  async getDetails(@Param('id') id: string) {
    return this.orgService.getDetails(id);
  }

  @Patch(':id/settings')
  async updateSettings(
    @Param('id') id: string,
    @Body() body: { autoPilotEnabled?: boolean; autoPilotDelaySec?: number },
  ) {
    return this.orgService.updateSettings(id, body);
  }

  @Get(':id/calls')
  async getCallLogs(
    @Param('id') id: string,
    @Query('branchId') branchId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.orgService.getCallLogs(id, branchId, limit ? parseInt(limit, 10) : 30);
  }

  @Get(':id/orders')
  async getOrders(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.orgService.getOrders(id, limit ? parseInt(limit, 10) : 30);
  }
}
