import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module'; // 1. Import AuthModule

@Module({
  imports: [
    ConfigModule, 
    DatabaseModule, 
    AuthModule // 2. Add AuthModule to imports
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}