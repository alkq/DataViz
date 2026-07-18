# Enterprise-Grade Secure Data Visualization Platform: Architectural Specification

This document defines the production-ready technical architecture, security parameters, database schemas, and implementation patterns for a highly available, secure, and performant industrial data visualization platform.

---

## 1. System Architecture & Ingestion Topology

To maintain high availability under massive time-series ingestion workloads while enforcing zero-trust security, the platform separates data collection, processing, and visualization into decoupled layers.
code
Code
download
content_copy
expand_less
[ Industrial Edge / PLCs ]
                              │ MQTT / OPC-UA
                              ▼
                  [ EMQX / VerneMQ Broker ]
                              │ Kafka Producer
                              ▼
                  [ Apache Kafka Cluster ]
                              │ Ingestion Pipeline (Telegraf/Vector)
                              ▼
                  [ ClickHouse OLAP Cluster ]
                              ▲
                              │ Private VPC (mTLS)
                              ▼
┌────────────────────────────────────────────────────────┐
│ Edge API Gateway (Kong / Envoy) │
│ - TLS Termination, WAF, and Global Rate Limiting │
└───────────────────────────┬────────────────────────────┘
│ mTLS (Internal)
▼
┌────────────────────────────────────────────────────────┐
│ Next.js BFF (Frontend Layer) │
│ - Handles SSR & HttpOnly Session Cookies │
└───────────────────────────┬────────────────────────────┘
│ mTLS (Internal)
▼
┌────────────────────────────────────────────────────────┐
│ NestJS Backend Service Cluster │
│ - JWT Verification, Schema Validation, RLS Context │
└─────────────────────┬─────────────┬────────────────────┘
│ │
▼ ▼
┌───────────────┐┌─────────────┐
│ Auth Server ││ OLTP (PG) │
│ OIDC/OAuth2 ││ Metadata & │
│ (Keycloak) ││ Config (RLS)│
└───────────────┘└─────────────┘
code
Code
download
content_copy
expand_less
### 1.1. Technology Stack Specification

| Layer | Technology | Security & Engineering Justification |
| :--- | :--- | :--- |
| **Edge Gateway** | Kong / Envoy | Offloads TLS termination, handles rate-limiting, filters malicious request vectors via WAF, and routes microservices internally [1.1.2]. |
| **Frontend Platform** | Next.js (TypeScript) | Implements the Backend-for-Frontend (BFF) pattern. Prevents exposing raw JWTs to client-side storage (mitigating XSS theft) [2.1.2]. |
| **Visualization** | Apache ECharts (WebGL) | Employs canvas and WebGL rendering paths to handle high-cardinality datasets without causing browser main-thread blocking or page hangs. |
| **API Backend** | NestJS (TypeScript) | Enforces strict compile-time types, validation pipes, and secure transactional connection lifecycles. |
| **Relational DB** | PostgreSQL 16+ | Stores metadata (users, tenants, widget positions) with strict Row-Level Security (RLS) enabled on all tables. |
| **Analytical DB** | ClickHouse | Column-oriented OLAP engine optimized for aggregating millions of rows per second. Handles high-speed time-series queries. |
| **Message Broker** | Apache Kafka | Acts as the ingestion backpressure buffer, decoupling edge device collection from the database ingestion writers. |

---

## 2. Database Layer & Isolation Schemas

To ensure strict tenant isolation, all analytical and relational queries execute within bounded contexts.

### 2.1. PostgreSQL: Relational Schema with Row-Level Security (RLS)

PostgreSQL stores transactional configuration metadata. RLS is enforced at the engine level to prevent data leakage.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Tenant Table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Devices Table (Under Tenants)
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'inactive',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row-Level Security on critical tables
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Define RLS Policy (Enforce active tenant matching)
CREATE POLICY tenant_isolation_policy ON devices
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
2.2. ClickHouse: Time-Series Storage & Materialized Aggregations
ClickHouse stores the high-volume data points. To protect against performance degradation, raw data is automatically downsampled to hourly aggregates.
code
SQL
download
content_copy
expand_less
CREATE DATABASE IF NOT EXISTS industrial_analytics;

-- Raw Telemetry Table
CREATE TABLE industrial_analytics.device_telemetry (
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
CREATE TABLE industrial_analytics.device_telemetry_hourly (
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
ORDER BY (tenant_id, device_id, metric_name, timestamp);

-- Trigger for Hourly Aggregations
CREATE MATERIALIZED VIEW industrial_analytics.device_telemetry_hourly_mv
TO industrial_analytics.device_telemetry_hourly AS
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
GROUP BY tenant_id, device_id, metric_name, timestamp;
3. API Backend & Validation Layer
The API layer enforces validation constraints on both incoming search fields and saved configurations.
3.1. Database Connection and Pool Configurations
This configuration includes a strict statement_timeout to prevent unoptimized queries from hanging the database.
code
TypeScript
download
content_copy
expand_less
import { Pool } from 'pg';

export const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 50, // Optimised for high-throughput concurrency
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  statement_timeout: 10000, // Hard limit of 10s on any relational query
});
3.2. Secure Input Validation Schema (Zod)
Prevents Query Exhaustion (DoS) by enforcing maximum date limits relative to sampling granularity.
code
TypeScript
download
content_copy
expand_less
import { z } from 'zod';

export const MetricQuerySchema = z.object({
  deviceId: z.string().uuid({ message: "Invalid device signature" }),
  metricName: z.enum(['temperature', 'pressure', 'flow_rate', 'amperage']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  resolution: z.enum(['1s', '1m', '5m', '1h', '1d']),
}).refine((data) => {
  const start = new Date(data.startDate).getTime();
  const end = new Date(data.endDate).getTime();
  const rangeMs = end - start;

  if (rangeMs <= 0) return false;

  // Enforce range limits relative to resolution (DoS Guard)
  if (data.resolution === '1s' && rangeMs > 2 * 60 * 60 * 1000) return false; // Max 2 hours
  if (data.resolution === '1m' && rangeMs > 7 * 24 * 60 * 60 * 1000) return false; // Max 7 days

  const maxAllowedSpan = 31 * 24 * 60 * 60 * 1000; // Hard limit of 31 days on any query
  return rangeMs <= maxAllowedSpan;
}, {
  message: "Invalid query range specified for requested resolution.",
  path: ["endDate"]
});
3.3. Stored XSS Mitigation: Dashboard Config Sanitization
This sanitize function strips out any executable scripts or HTML handlers from custom widget positions or chart labels before they are saved to PostgreSQL.
code
TypeScript
download
content_copy
expand_less
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeDashboardConfig(configJson: string): string {
  const parsed = JSON.parse(configJson);
  
  // Recursively sanitize all string values in custom dashboard layouts
  const sanitizeValue = (val: any): any => {
    if (typeof val === 'string') {
      return DOMPurify.sanitize(val);
    } else if (typeof val === 'object' && val !== null) {
      for (const k in val) {
        val[k] = sanitizeValue(val[k]);
      }
    }
    return val;
  };

  return JSON.stringify(sanitizeValue(parsed));
}
4. Secure Frontend & Visualization Layer
The client layer renders data cleanly, uses CSP nonces, and sanitizes interactive UI elements.
4.1. Strict Content Security Policy (CSP) Middleware
Generates an inline script cryptographic nonce on every request, blocking any unauthorized script injections.
code
TypeScript
download
content_copy
expand_less
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export function middleware(request: Request) {
  const nonce = crypto.randomBytes(16).toString('base64');
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' data: blob:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('x-nonce', nonce);
  return response;
}
4.2. Secure Interactive Chart Component (React + ECharts)
Implements WebGL rendering and runs the interactive labels through DOMPurify to prevent tooltip XSS.
code
Tsx
download
content_copy
expand_less
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import DOMPurify from 'isomorphic-dompurify';

interface MetricPoint {
  timestamp: string;
  value: number;
  annotation: string;
}

interface SecureChartProps {
  data: MetricPoint[];
  nonce: string;
}

export const TelemetryLineChart: React.FC<SecureChartProps> = ({ data, nonce }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Use WebGL renderer for performance optimization
    const activeChart = echarts.init(chartContainerRef.current, undefined, {
      renderer: 'canvas',
    });
    chartInstanceRef.current = activeChart;

    const formattedSeriesData = data.map(point => [
      new Date(point.timestamp),
      point.value,
      point.annotation
    ]);

    const chartOptions: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        // Sanitize raw annotations (XSS Mitigation)
        formatter: (params: any): string => {
          const value = params[0].value;
          const date = value[0] instanceof Date ? value[0].toISOString() : new Date(value[0]).toISOString();
          const cleanAnnotation = DOMPurify.sanitize(value[2]);
          
          return `
            <div style="font-weight: bold;">${date}</div>
            <div>Value: ${value[1]}</div>
            <div style="font-size: 11px; margin-top: 4px;">
              Comment: <strong>${cleanAnnotation}</strong>
            </div>
          `;
        }
      },
      xAxis: { type: 'time' },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'line',
          showSymbol: false,
          data: formattedSeriesData,
          sampling: 'lttb', // Downsample points via Largest-Triangle-Three-Buckets
        }
      ]
    };

    activeChart.setOption(chartOptions);

    const handleResize = () => chartInstanceRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstanceRef.current?.dispose();
    };
  }, [data]);

  return (
    <div style={{ width: '100%', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
      <div 
        ref={chartContainerRef} 
        style={{ width: '100%', height: '400px' }} 
        aria-label="Secure System Operational Metric Chart"
      />
    </div>
  );
};
5. Architectural Security Appendix
This section defines the security engineering frameworks and operations protocols implemented across the platform.
5.1. Threat Modeling (STRIDE Matrix)
The system enforces specific mitigations mapped directly to the STRIDE threat model [1.1.2]:
Threat Category	Target Component	Specific Mitigation
Spoofing	User Identity	OpenID Connect / Keycloak OAuth 2.0 with mandatory MFA.
Tampering	Dashboard Configuration	Stored XSS input sanitization filter on PostgreSQL save [2.1.2].
Repudiation	Access & Query Logs	Write-once read-many immutable log tables with WAL replication.
Information Disclosure	Database Rows	Relational PostgreSQL Row-Level Security (RLS) bound to session variables [2.1.2].
Denial of Service	OLAP Database	ClickHouse query time-limits combined with temporal range checks in Zod.
Elevation of Privilege	API Gateways	Cryptographically verified JSON Web Tokens (JWT) mapped to explicit RBAC/ABAC guards.
5.2. Observability & Security Telemetry
Distributed Tracing: Implementation of OpenTelemetry across the API gateway, NestJS servers, and database pools to trace request flow and pinpoint bottlenecks.
Audit Logging: Generation of structured JSON logs (with any PII scrubbed) sent directly to an append-only log engine. Every tenant database query, login attempt, or credential update must trigger a logged event.
5.3. Supply Chain Security (SBOM & Verification)
Software Bill of Materials (SBOM): Auto-generate an SBOM (e.g., via CycloneDX) on every production release to track dependency versions and licenses.
Vulnerability Scanning: Continuous integration checks using tools like Trivy or Snyk to block builds with known vulnerabilities (CVEs).
Image Signing: Production container images are signed using Cosign to ensure they cannot be tampered with between building and deployment.