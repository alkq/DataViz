import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../../common/decorators/auth.decorators';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  async liveness() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe with dependency checks' })
  async readiness() {
    const health = await this.healthService.checkAll();
    return health;
  }

  @Public()
  @Get('postgres')
  @ApiOperation({ summary: 'PostgreSQL health check' })
  async postgres() {
    return this.healthService.checkPostgres();
  }

  @Public()
  @Get('clickhouse')
  @ApiOperation({ summary: 'ClickHouse health check' })
  async clickhouse() {
    return this.healthService.checkClickHouse();
  }
}