import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DashboardsService, Dashboard, CreateDashboardDto, UpdateDashboardDto, DashboardConfig } from './dashboards.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenantId, CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('dashboards')
@Controller('dashboards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardsController {
  constructor(private dashboardsService: DashboardsService) {}

  @Get()
  @ApiOperation({ summary: 'List all dashboards for current user' })
  async findAll(
    @CurrentTenantId() tenantId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<Dashboard[]> {
    return this.dashboardsService.findAll(tenantId, userId);
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default dashboard for current user' })
  async getDefault(
    @CurrentTenantId() tenantId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<Dashboard | null> {
    return this.dashboardsService.getDefault(tenantId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dashboard by ID' })
  @ApiParam({ name: 'id', description: 'Dashboard UUID' })
  async findOne(
    @CurrentTenantId() tenantId: string,
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ): Promise<Dashboard> {
    return this.dashboardsService.findById(tenantId, userId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new dashboard' })
  async create(
    @CurrentTenantId() tenantId: string,
    @CurrentUser('sub') userId: string,
    @Body() createDashboardDto: CreateDashboardDto,
  ): Promise<Dashboard> {
    return this.dashboardsService.create(tenantId, userId, createDashboardDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update dashboard' })
  @ApiParam({ name: 'id', description: 'Dashboard UUID' })
  async update(
    @CurrentTenantId() tenantId: string,
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() updateDashboardDto: UpdateDashboardDto,
  ): Promise<Dashboard> {
    return this.dashboardsService.update(tenantId, userId, id, updateDashboardDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete dashboard' })
  @ApiParam({ name: 'id', description: 'Dashboard UUID' })
  async delete(
    @CurrentTenantId() tenantId: string,
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.dashboardsService.delete(tenantId, userId, id);
  }
}