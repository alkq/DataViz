import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { config } from '@platform/db';
import { dbPool } from '@platform/db';

@Global()
@Module({
  providers: [
    {
      provide: 'PG_POOL',
      useValue: dbPool,
    },
  ],
  exports: ['PG_POOL'],
})
export class DatabaseModule {}