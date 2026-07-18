import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DevicesService, CreateDeviceDto, UpdateDeviceDto, Device } from './devices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenantId } from '../../common/decorators/current-user.decorator';

@ApiTags('devices')
@Controller('devices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all devices for current tenant' })
  async findAll(@CurrentTenantId() tenantId: string): Promise<Device[]> {
    return this.devicesService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID' })
  @ApiParam({ name: 'id', description: 'Device UUID' })
  async findOne(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<Device> {
    return this.devicesService.findById(tenantId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new device' })
  async create(
    @CurrentTenantId() tenantId: string,
    @Body() createDeviceDto: CreateDeviceDto,
  ): Promise<Device> {
    return this.devicesService.create(tenantId, createDeviceDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update device' })
  @ApiParam({ name: 'id', description: 'Device UUID' })
  async update(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ): Promise<Device> {
    return this.devicesService.update(tenantId, id, updateDeviceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete device' })
  @ApiParam({ name: 'id', description: 'Device UUID' })
  async delete(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.devicesService.delete(tenantId, id);
  }
}