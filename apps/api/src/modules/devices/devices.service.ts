import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Pool, PoolClient, QueryResult } from 'pg';
import { CurrentTenantId } from '../../common/decorators/current-user.decorator';

export interface Device {
  id: string;
  tenant_id: string;
  name: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDeviceDto {
  name: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateDeviceDto {
  name?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class DevicesService {
  constructor(@Inject('PG_POOL') private pool: Pool) {}

  async findAll(tenantId: string): Promise<Device[]> {
    const result = await this.pool.query<Device>(
      'SELECT * FROM devices WHERE tenant_id = $1 ORDER BY name',
      [tenantId]
    );
    return result.rows;
  }

  async findById(tenantId: string, id: string): Promise<Device> {
    const result = await this.pool.query<Device>(
      'SELECT * FROM devices WHERE tenant_id = $1 AND id = $2',
      [tenantId, id]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException('Device not found');
    }
    return result.rows[0];
  }

  async create(tenantId: string, dto: CreateDeviceDto): Promise<Device> {
    const result = await this.pool.query<Device>(
      `INSERT INTO devices (tenant_id, name, status, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [tenantId, dto.name, dto.status || 'inactive', JSON.stringify(dto.metadata || {})]
    );
    return result.rows[0];
  }

  async update(tenantId: string, id: string, dto: UpdateDeviceDto): Promise<Device> {
    const setClause: string[] = [];
    const params: unknown[] = [tenantId, id];
    let paramIndex = 3;

    if (dto.name !== undefined) {
      setClause.push(`name = $${paramIndex++}`);
      params.push(dto.name);
    }
    if (dto.status !== undefined) {
      setClause.push(`status = $${paramIndex++}`);
      params.push(dto.status);
    }
    if (dto.metadata !== undefined) {
      setClause.push(`metadata = $${paramIndex++}, updated_at = CURRENT_TIMESTAMP`);
      params.push(JSON.stringify(dto.metadata));
    }

    if (setClause.length === 0) {
      throw new ForbiddenException('No updates provided');
    }

    const result = await this.pool.query<Device>(
      `UPDATE devices SET ${setClause.join(', ')} WHERE tenant_id = $1 AND id = $2 RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Device not found');
    }
    return result.rows[0];
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM devices WHERE tenant_id = $1 AND id = $2 RETURNING id',
      [tenantId, id]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException('Device not found');
    }
  }
}