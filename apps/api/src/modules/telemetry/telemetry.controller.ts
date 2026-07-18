import { Controller, Get, Post, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenantId, CurrentUser } from '../../common/decorators/current-user.decorator';
import { MetricQuerySchema, MetricQuery } from '@platform/shared';

@ApiTags('telemetry')
@Controller('telemetry')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TelemetryController {
  constructor(private telemetryService: TelemetryService) {}

  @Post('ingest')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Ingest telemetry data points' })
  async ingest(
    @CurrentTenantId() tenantId: string,
    @Body() telemetry: Array<{
      timestamp: string;
      device_id: string;
      metric_name: string;
      metric_value: number;
    }>,
  ): Promise<{ accepted: number }> {
    const telemetryWithTenant = telemetry.map(t => ({
      ...t,
      tenant_id: tenantId,
    }));
    await this.telemetryService.ingestTelemetry(telemetryWithTenant);
    return { accepted: telemetry.length };
  }

  @Get('query')
  @ApiOperation({ summary: 'Query telemetry data with validation' })
  @ApiQuery({ name: 'deviceId', required: true, description: 'Device UUID' })
  @ApiQuery({ name: 'metricName', required: true, enum: ['temperature', 'pressure', 'flow_rate', 'amperage'] })
  @ApiQuery({ name: 'startDate', required: true, description: 'ISO 8601 datetime' })
  @ApiQuery({ name: 'endDate', required: true, description: 'ISO 8601 datetime' })
  @ApiQuery({ name: 'resolution', required: true, enum: ['1s', '1m', '5m', '1h', '1d'] })
  async query(
    @CurrentTenantId() tenantId: string,
    @Query() query: MetricQuery,
  ): Promise<unknown[]> {
    const validated = MetricQuerySchema.parse(query);
    return this.telemetryService.queryTelemetry(tenantId, validated);
  }

  @Get('devices/metadata')
  @ApiOperation({ summary: 'Get device metadata for tenant' })
  async getDevicesMetadata(
    @CurrentTenantId() tenantId: string,
  ): Promise<unknown[]> {
    return this.telemetryService.getDevicesMetadata(tenantId);
  }
}