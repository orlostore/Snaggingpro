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

export async function getSignatureUrl(ackId: string): Promise<string> {
  const blob = await apiGetBlob(`/signatures/${encodeURIComponent(ackId)}`);
  return URL.createObjectURL(blob);
}
