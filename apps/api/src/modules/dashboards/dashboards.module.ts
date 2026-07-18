import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule

@Module({
  imports: [
    ConfigModule, 
    DatabaseModule, 
    AuthModule // Add AuthModule to imports
  ],
  controllers: [DashboardsController],
  providers: [DashboardsService],
  exports: [DashboardsService],
})
export class DashboardsModule {}