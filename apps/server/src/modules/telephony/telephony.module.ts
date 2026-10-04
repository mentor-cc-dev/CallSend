import { Module } from '@nestjs/common';
import { TelephonyService } from './telephony.service';
import { TelephonyController } from './telephony.controller';
import { EventsModule } from '../gateway/events.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [EventsModule, MessagesModule],
  controllers: [TelephonyController],
  providers: [TelephonyService],
  exports: [TelephonyService],
})
export class TelephonyModule {}
