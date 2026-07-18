import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import { ParsedDataset } from './dataset-parser.service';

export interface DatasetRow {
  id: string;
  tenant_id: string;
  name: string;
  source_type: 'csv' | 'excel';
  original_filename: string;
  columns: { name: string; type: string }[];
  row_count: number;
  created_at: Date;
}

@Injectable()
export class DatasetsService {
  constructor(@Inject('PG_POOL') private pool: Pool) {}

  async create(
    tenantId: string,
    input: { name: string; sourceType: 'csv' | 'excel'; originalFilename: string; parsed: ParsedDataset },
  ): Promise<DatasetRow> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // Establish RLS context for this tenant for the duration of the tx.
      await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);

      const insertRes: QueryResult<DatasetRow> = await client.query(
        `INSERT INTO datasets (tenant_id, name, source_type, original_filename, columns, row_count)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          tenantId,
          input.name,
          input.sourceType,
          input.originalFilename,
          JSON.stringify(input.parsed.columns),
          input.parsed.rows.length,
        ],
      );
      const dataset = insertRes.rows[0];

      // Batch-insert rows.
      if (input.parsed.rows.length > 0) {
        // Insert rows in chunks to stay under Postgres's per-statement
        // parameter limit (~65535). Each row = 4 params, so 100 rows/statement.
        const CHUNK = 100;
        for (let i = 0; i < input.parsed.rows.length; i += CHUNK) {
          const slice = input.parsed.rows.slice(i, i + CHUNK);
          const placeholders: string[] = [];
          const values: unknown[] = [];
          let p = 1;
          slice.forEach((row, j) => {
            const idx = i + j;
            placeholders.push(`($${p++}, $${p++}, $${p++}, $${p++})`);
            values.push(dataset.id, tenantId, idx, JSON.stringify(row));
          });
          await client.query(
            `INSERT INTO dataset_rows (dataset_id, tenant_id, row_index, data)
             VALUES ${placeholders.join(', ')}`,
            values,
          );
        }
      }

      await client.query('COMMIT');
      return dataset;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findAll(tenantId: string): Promise<DatasetRow[]> {
    const res = await this.pool.query<DatasetRow>(
      `SELECT * FROM datasets WHERE tenant_id = $1 ORDER BY created_at DESC`,
      [tenantId],
    );
    return res.rows;
  }

  async findOne(tenantId: string, id: string): Promise<DatasetRow> {
    const res = await this.pool.query<DatasetRow>(
      `SELECT * FROM datasets WHERE tenant_id = $1 AND id = $2`,
      [tenantId, id],
    );
    if (res.rows.length === 0) {
      throw new NotFoundException('Dataset not found');
    }
    return res.rows[0];
  }

  async getRows(
    tenantId: string,
    id: string,
    limit = 200,
    offset = 0,
  ): Promise<Record<string, unknown>[]> {
    // Ensure ownership first.
    await this.findOne(tenantId, id);
    const res = await this.pool.query<{ data: Record<string, unknown> }>(
      `SELECT data FROM dataset_rows WHERE tenant_id = $1 AND dataset_id = $2
       ORDER BY row_index
       LIMIT $3 OFFSET $4`,
      [tenantId, id, limit, offset],
    );
    return res.rows.map((r) => r.data);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id); // ownership check
    const res = await this.pool.query(
      `DELETE FROM datasets WHERE tenant_id = $1 AND id = $2 RETURNING id`,
      [tenantId, id],
    );
    if (res.rows.length === 0) {
      throw new NotFoundException('Dataset not found');
    }
  }
}
