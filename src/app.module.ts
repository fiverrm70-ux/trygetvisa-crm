import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { AuthModule } from './auth/auth.module';
import { LeadsModule } from './leads/leads.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { HolidaysModule } from './holidays/holidays.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    LeadsModule,
    ActivityLogModule,
    ReportsModule,
    ClientsModule,
    HolidaysModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
