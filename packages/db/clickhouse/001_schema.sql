-- ClickHouse Schema: industrial_analytics database
-- Time-Series Storage & Materialized Aggregations for DoS Mitigation

CREATE DATABASE IF NOT EXISTS industrial_analytics;

-- Raw Telemetry Table
-- Partitioned by month for efficient time-range queries
-- Ordered by (tenant_id, device_id, metric_name, timestamp) for tenant isolation and compression
CREATE TABLE IF NOT EXISTS industrial_analytics.device_telemetry (
    timestamp DateTime64(3, 'UTC'),
    tenant_id UUID,
    device_id UUID,
    metric_name LowCardinality(String),
    metric_value Float64
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (tenant_id, device_id, metric_name, timestamp)
SETTINGS index_granularity = 8192;

-- Hourly Materialized Target Table (DoS Mitigation)
-- Pre-aggregated data for fast dashboard queries at coarser resolutions
-- SummingMergeTree automatically merges rows with same ORDER BY key
CREATE TABLE IF NOT EXISTS industrial_analytics.device_telemetry_hourly (
    timestamp DateTime64(0, 'UTC'),
    tenant_id UUID,
    device_id UUID,
    metric_name LowCardinality(String),
    avg_value Float64,
    max_value Float64,
    min_value Float64,
    count_records UInt32
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (tenant_id, device_id, metric_name, timestamp);

-- Materialized View for Hourly Aggregations
-- Automatically populates hourly table from raw telemetry
CREATE MATERIALIZED VIEW IF NOT EXISTS industrial_analytics.device_telemetry_hourly_mv
TO industrial_analytics.device_telemetry_hourly
AS
SELECT
    toDateTime(toStartOfHour(timestamp)) AS timestamp,
    tenant_id,
    device_id,
    metric_name,
    avg(metric_value) AS avg_value,
    max(metric_value) AS max_value,
    min(metric_value) AS min_value,
    count() AS count_records
FROM industrial_analytics.device_telemetry
GROUP BY
    tenant_id,
    device_id,
    metric_name,
    timestamp;

-- Daily Materialized Target Table (for longer retention queries)
CREATE TABLE IF NOT EXISTS industrial_analytics.device_telemetry_daily (
    timestamp DateTime64(0, 'UTC'),
    tenant_id UUID,
    device_id UUID,
    metric_name LowCardinality(String),
    avg_value Float64,
    max_value Float64,
    min_value Float64,
    count_records UInt32
)
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (tenant_id, device_id, metric_name, timestamp);

-- Materialized View for Daily Aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS industrial_analytics.device_telemetry_daily_mv
TO industrial_analytics.device_telemetry_daily
AS
SELECT
    toDateTime(toStartOfDay(timestamp)) AS timestamp,
    tenant_id,
    device_id,
    metric_name,
    avg(metric_value) AS avg_value,
    max(metric_value) AS max_value,
    min(metric_value) AS min_value,
    count() AS count_records
FROM industrial_analytics.device_telemetry
GROUP BY
    tenant_id,
    device_id,
    metric_name,
    timestamp;

-- Device metadata table for JOIN operations
CREATE TABLE IF NOT EXISTS industrial_analytics.device_metadata (
    device_id UUID,
    tenant_id UUID,
    name String,
    status String,
    location String,
    tags Map(String, String),
    updated_at DateTime64(3, 'UTC')
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY (tenant_id, device_id);

-- Alert rules table
CREATE TABLE IF NOT EXISTS industrial_analytics.alert_rules (
    id UUID,
    tenant_id UUID,
    device_id UUID,
    metric_name LowCardinality(String),
    condition String,
    threshold Float64,
    severity LowCardinality(String),
    enabled UInt8 DEFAULT 1,
    created_at DateTime64(3, 'UTC')
)
ENGINE = MergeTree()
PARTITION BY tenant_id
ORDER BY (tenant_id, device_id, metric_name);

-- Alert events table
CREATE TABLE IF NOT EXISTS industrial_analytics.alert_events (
    id UUID,
    tenant_id UUID,
    device_id UUID,
    metric_name LowCardinality(String),
    rule_id UUID,
    value Float64,
    threshold Float64,
    severity LowCardinality(String),
    message String,
    acknowledged UInt8 DEFAULT 0,
    acknowledged_by UUID,
    acknowledged_at DateTime64(3, 'UTC'),
    created_at DateTime64(3, 'UTC')
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (tenant_id, created_at);

-- TTL for raw telemetry (keep 30 days, aggregates forever)
ALTER TABLE industrial_analytics.device_telemetry
MODIFY TTL toDateTime(timestamp) + INTERVAL 30 DAY;

-- Create users and roles for application access
CREATE USER IF NOT EXISTS dataviz_app IDENTIFIED WITH sha256_password BY 'dataviz_clickhouse_password';
CREATE ROLE IF NOT EXISTS analytics_reader;

GRANT SELECT ON industrial_analytics.* TO analytics_reader;
GRANT analytics_reader TO dataviz_app;

-- Insert sample device metadata for demo
INSERT INTO industrial_analytics.device_metadata (device_id, tenant_id, name, status, location, tags, updated_at) VALUES
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Temperature Sensor A1', 'active', 'Building A - Floor 1', {'type': 'temperature', 'unit': 'celsius'}, now()),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Pressure Transducer B2', 'active', 'Building B - Floor 2', {'type': 'pressure', 'unit': 'psi'}, now()),
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Flow Meter C3', 'maintenance', 'Building C - Floor 1', {'type': 'flow', 'unit': 'lpm'}, now()),
    ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'Amperage Monitor D4', 'active', 'Building D - Floor 3', {'type': 'amperage', 'unit': 'amps'}, now());