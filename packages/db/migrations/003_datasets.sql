-- Migration: 003_datasets.sql
-- File-upload datasets: user-uploaded CSV/Excel turned into visualizable tables.
-- Row-Level Security is enforced per tenant via app.current_tenant_id
-- (set by the API on every request, see packages/db).

-- Uploaded datasets (one row per uploaded file)
CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(16) NOT NULL CHECK (source_type IN ('csv', 'excel')),
    original_filename VARCHAR(512) NOT NULL,
    columns JSONB NOT NULL DEFAULT '[]'::jsonb,
    row_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Individual parsed rows. Stored as JSONB so arbitrary column sets work.
CREATE TABLE IF NOT EXISTS dataset_rows (
    id BIGSERIAL PRIMARY KEY,
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    row_index INTEGER NOT NULL,
    data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dataset_rows_dataset ON dataset_rows (dataset_id, row_index);

-- Row-Level Security (tenant isolation)
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON datasets
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_policy ON dataset_rows
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
