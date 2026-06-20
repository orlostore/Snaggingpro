/**
 * Reports library — persisted completed inspections + denormalised summaries.
 * Underlying store is IndexedDB; swap this whole module for a Cloudflare
 * Workers-backed adapter in Phase 2 and nothing else changes.
 */

import { getDB } from './idb';
import { collectSnags } from '@/domain/snags';
import { ENV } from '@/lib/env';
import { enqueue } from '@/sync/outbox';
import type { State, ReportSummary } from '@/state/schema';

export interface ReportsRepository {
  saveReport(state: State): Promise<void>;
  getReport(id: string): Promise<State | undefined>;
  listSummaries(): Promise<ReportSummary[]>;
  deleteReport(id: string): Promise<void>;
}

function summarise(state: State): ReportSummary {
  const snags = collectSnags(state);
  return {
    id: state.job.ref,
    jobRef: state.job.ref,
    reportType: state.job.reportType,
    parentReportId: state.job.parentReportId,
    clientName: state.client.name,
    developer: state.property.developer,
    community: state.property.community,
    unit: state.property.unit,
    propertyType: state.property.type,
    date: state.job.date,
    createdAt: state.job.createdAt,
    totalSnags: snags.length,
    criticalSnags: snags.filter((s) => s.severity === 'critical').length,
    status: state.job.status,
  };
}

class IDBReportsRepository implements ReportsRepository {
  async saveReport(state: State): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['reports', 'summaries'], 'readwrite');
    await tx.objectStore('reports').put(state);
    await tx.objectStore('summaries').put(summarise(state));
    await tx.done;
    if (ENV.cloudEnabled) {
      await enqueue({ type: 'saveReport', reportId: state.job.ref });
    }
  }

  async getReport(id: string): Promise<State | undefined> {
    const db = await getDB();
    return db.get('reports', id);
  }

  async listSummaries(): Promise<ReportSummary[]> {
    const db = await getDB();
    const all = await db.getAll('summaries');
    return all.sort((a, b) => b.createdAt - a.createdAt);
  }

  async deleteReport(id: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['reports', 'summaries'], 'readwrite');
    await tx.objectStore('reports').delete(id);
    await tx.objectStore('summaries').delete(id);
    await tx.done;
    if (ENV.cloudEnabled) {
      await enqueue({ type: 'deleteReport', reportId: id });
    }
  }
}

export const reportsRepo: ReportsRepository = new IDBReportsRepository();
