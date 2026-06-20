/**
 * Shared types for SnaggingPro Cloudflare Pages Functions.
 * Mirror of the relevant client schema — copy/pasted instead of imported
 * so the functions runtime stays a standalone bundle.
 */

export interface Env {
  /** D1 database binding — set in Pages → Settings → Bindings. */
  DB: D1Database;
  /** R2 bucket binding for photo blobs — set in Pages → Settings → Bindings. */
  PHOTOS: R2Bucket;
  /** Shared secret the client must send in X-SP-Secret. Set in Pages → Variables. */
  API_SECRET: string;
}

export interface ReportRow {
  id: string;
  job_ref: string;
  report_type: 'original' | 'follow-up';
  parent_report_id: string | null;
  client_name: string;
  developer: string;
  community: string;
  unit: string;
  property_type: string;
  date: string;
  created_at: number;
  updated_at: number;
  total_snags: number;
  critical_snags: number;
  status: 'draft' | 'completed';
  state_json: string;
}

export interface ReportSummaryDto {
  id: string;
  jobRef: string;
  reportType: 'original' | 'follow-up';
  parentReportId: string | null;
  clientName: string;
  developer: string;
  community: string;
  unit: string;
  propertyType: string;
  date: string;
  createdAt: number;
  updatedAt: number;
  totalSnags: number;
  criticalSnags: number;
  status: 'draft' | 'completed';
}

export function rowToSummary(r: ReportRow): ReportSummaryDto {
  return {
    id: r.id,
    jobRef: r.job_ref,
    reportType: r.report_type,
    parentReportId: r.parent_report_id,
    clientName: r.client_name,
    developer: r.developer,
    community: r.community,
    unit: r.unit,
    propertyType: r.property_type,
    date: r.date,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    totalSnags: r.total_snags,
    criticalSnags: r.critical_snags,
    status: r.status,
  };
}

export function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init.headers ?? {}),
    },
  });
}

export function err(status: number, message: string): Response {
  return json({ error: message }, { status });
}

export interface AcknowledgementRow {
  id: string;
  job_ref: string;
  client_name: string;
  unit: string;
  typed_name: string;
  signature_key: string | null;
  eid_front_key: string | null;
  eid_back_key: string | null;
  ip_address: string | null;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  acknowledged_at: number;
}

export interface AcknowledgementDto {
  id: string;
  jobRef: string;
  clientName: string;
  unit: string;
  typedName: string;
  signatureKey: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  acknowledgedAt: number;
}

export function rowToAck(r: AcknowledgementRow): AcknowledgementDto {
  return {
    id: r.id,
    jobRef: r.job_ref,
    clientName: r.client_name,
    unit: r.unit,
    typedName: r.typed_name,
    signatureKey: r.signature_key,
    ipAddress: r.ip_address,
    userAgent: r.user_agent,
    country: r.country,
    city: r.city,
    acknowledgedAt: r.acknowledged_at,
  };
}
