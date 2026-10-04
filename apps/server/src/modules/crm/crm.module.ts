import { Module } from '@nestjs/common';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { Customer360Service } from './customers.service';
import { CustomersController } from './customers.controller';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { EventsModule } from '../gateway/events.module';

@Module({
  imports: [EventsModule],
  controllers: [DealsController, CustomersController, TasksController],
  providers: [DealsService, Customer360Service, TasksService],
  exports: [DealsService, Customer360Service, TasksService],
})
export class CrmModule {}
