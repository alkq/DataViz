import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatasetsController } from './datasets.controller';
import { DatasetsService } from './datasets.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule],
  controllers: [DatasetsController],
  providers: [DatasetsService],
  exports: [DatasetsService],
})
export class DatasetsModule {}
