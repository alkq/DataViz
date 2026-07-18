import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { sanitizeDashboardConfig } from '@platform/shared';

export interface DashboardConfig {
  widgets: Array<{
    id: string;
    type: 'line-chart' | 'bar-chart' | 'gauge' | 'table';
    title: string;
    deviceId: string;
    metricName: string;
    position: { x: number; y: number; w: number; h: number };
    config: Record<string, unknown>;
  }>;
  layout: {
    columns: number;
    rowHeight: number;
    margin: [number, number];
  };
  theme: 'light' | 'dark';
}

export interface Dashboard {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  config: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDashboardDto {
  name: string;
  config: DashboardConfig;
  is_default?: boolean;
}

export interface UpdateDashboardDto {
  name?: string;
  config?: DashboardConfig;
  is_default?: boolean;
}

@Injectable()
export class DashboardsService {
  constructor(@Inject('PG_POOL') private pool: Pool) {}

  async findAll(tenantId: string, userId: string): Promise<Dashboard[]> {
    const result = await this.pool.query<Dashboard>(
      'SELECT * FROM dashboards WHERE tenant_id = $1 AND user_id = $2 ORDER BY updated_at DESC',
      [tenantId, userId]
    );
    return result.rows;
  }

  async findById(tenantId: string, userId: string, id: string): Promise<Dashboard> {
    const result = await this.pool.query<Dashboard>(
      'SELECT * FROM dashboards WHERE tenant_id = $1 AND user_id = $2 AND id = $3',
      [tenantId, userId, id]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException('Dashboard not found');
    }
    return result.rows[0];
  }

  async getDefault(tenantId: string, userId: string): Promise<Dashboard | null> {
    const result = await this.pool.query<Dashboard>(
      'SELECT * FROM dashboards WHERE tenant_id = $1 AND user_id = $2 AND is_default = true LIMIT 1',
      [tenantId, userId]
    );
    return result.rows[0] || null;
  }

  async create(tenantId: string, userId: string, dto: CreateDashboardDto): Promise<Dashboard> {
    const sanitizedConfig = sanitizeDashboardConfig(JSON.stringify(dto.config));
    
    const result = await this.pool.query<Dashboard>(
      `INSERT INTO dashboards (tenant_id, user_id, name, config, is_default)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tenantId, userId, dto.name, sanitizedConfig, dto.is_default || false]
    );
    
    if (dto.is_default) {
      await this.unsetOtherDefaults(tenantId, userId, result.rows[0].id);
    }
    
    return result.rows[0];
  }

  async update(tenantId: string, userId: string, id: string, dto: UpdateDashboardDto): Promise<Dashboard> {
    const setClause: string[] = [];
    const params: unknown[] = [tenantId, userId, id];
    let paramIndex = 4;

    if (dto.name !== undefined) {
      setClause.push(`name = $${paramIndex++}`);
      params.push(dto.name);
    }
    if (dto.config !== undefined) {
      const sanitizedConfig = sanitizeDashboardConfig(JSON.stringify(dto.config));
      setClause.push(`config = $${paramIndex++}`);
      params.push(sanitizedConfig);
    }
    if (dto.is_default !== undefined) {
      setClause.push(`is_default = $${paramIndex++}`);
      params.push(dto.is_default);
    }

    if (setClause.length === 0) {
      throw new ForbiddenException('No updates provided');
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await this.pool.query<Dashboard>(
      `UPDATE dashboards SET ${setClause.join(', ')} WHERE tenant_id = $1 AND user_id = $2 AND id = $3 RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Dashboard not found');
    }

    if (dto.is_default) {
      await this.unsetOtherDefaults(tenantId, userId, id);
    }

    return result.rows[0];
  }

  async delete(tenantId: string, userId: string, id: string): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM dashboards WHERE tenant_id = $1 AND user_id = $2 AND id = $3 RETURNING id',
      [tenantId, userId, id]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException('Dashboard not found');
    }
  }

  private async unsetOtherDefaults(tenantId: string, userId: string, excludeId: string): Promise<void> {
    await this.pool.query(
      'UPDATE dashboards SET is_default = false WHERE tenant_id = $1 AND user_id = $2 AND id != $3',
      [tenantId, userId, excludeId]
    );
  }
}