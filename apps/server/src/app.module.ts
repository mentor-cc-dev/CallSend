import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './modules/gateway/events.module';
import { MessagesModule } from './modules/messages/messages.module';
import { TelephonyModule } from './modules/telephony/telephony.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { CrmModule } from './modules/crm/crm.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    EventsModule,
    MessagesModule,
    TelephonyModule,
    TrackingModule,
    TemplatesModule,
    OrganizationsModule,
    CrmModule,
  ],
})
export class AppModule {}
