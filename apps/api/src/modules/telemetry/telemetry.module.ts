import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule

@Module({
  imports: [
    ConfigModule, 
    DatabaseModule, 
    AuthModule // Add AuthModule to imports
  ],
  controllers: [TelemetryController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}