import { Controller, Get, Post, Param, Body, Req, Headers, Ip } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { Request } from 'express';

@Controller('api/v1/public')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('landing/:shortCode')
  async getLanding(
    @Param('shortCode') shortCode: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.trackingService.getLandingData(shortCode, ip, userAgent);
  }

  @Post('tracking/event')
  async recordEvent(
    @Body() body: { shortCode: string; eventType: string; payload?: any },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.trackingService.recordEvent(body.shortCode, body.eventType, body.payload, ip, userAgent);
  }

  @Post('orders')
  async createOrder(
    @Body() body: { shortCode: string; itemsSummary: string; customerNote?: string },
  ) {
    return this.trackingService.createPublicOrder(body.shortCode, body.itemsSummary, body.customerNote);
  }
}
