/**
 * Client wrapper for the /api/acknowledgements endpoint.
 * Used by ReportDetail to show the signed T&C record per job.
 */

import { apiGet, apiGetBlob } from './api';

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

export async function listAcknowledgements(jobRef: string): Promise<AcknowledgementDto[]> {
  const r = await apiGet<{ acknowledgements: AcknowledgementDto[] }>(
    `/acknowledgements?jobRef=${encodeURIComponent(jobRef)}`,
  );
  return r.acknowledgements;
}

/** Map of jobRef → most-recent ack timestamp (ms). Returns empty map if cloud is disabled or the call fails. */
export async function loadAckIndex(): Promise<Map<string, number>> {
  try {
    const r = await apiGet<{ acknowledgements: AcknowledgementDto[] }>('/acknowledgements');
    const m = new Map<string, number>();
    for (const a of r.acknowledgements) {
      const prev = m.get(a.jobRef) ?? 0;
      if (a.acknowledgedAt > prev) m.set(a.jobRef, a.acknowledgedAt);
    }
    return m;
  } catch {
    return new Map();
  }
}

export async function getSignatureUrl(ackId: string): Promise<string> {
  const blob = await apiGetBlob(`/signatures/${encodeURIComponent(ackId)}`);
  return URL.createObjectURL(blob);
}
