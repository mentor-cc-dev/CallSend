import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TelephonyService, TelephonyEventDto } from './telephony.service';

@Controller('api/v1/telephony')
export class TelephonyController {
  constructor(private readonly telephonyService: TelephonyService) {}

  @Post('events')
  @HttpCode(HttpStatus.OK)
  async handleEvent(@Body() dto: TelephonyEventDto) {
    return this.telephonyService.handleCallEvent(dto);
  }

  @Post('devices/register')
  async registerDevice(
    @Body() body: { organizationId: string; branchId?: string; modelName: string },
  ) {
    return this.telephonyService.registerDevice(body.organizationId, body.branchId || null, body.modelName);
  }

  @Post('devices/heartbeat')
  @HttpCode(HttpStatus.OK)
  async heartbeat(@Body() body: { deviceToken: string; batteryLevel?: number }) {
    return this.telephonyService.recordHeartbeat(body.deviceToken, body.batteryLevel);
  }
}
