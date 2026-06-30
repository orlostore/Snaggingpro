/**
 * Canonical state schema for SnaggingPro v2.
 * Zod-validated, versioned, photos-by-reference (blobs live in IndexedDB).
 */

import { z } from 'zod';
import { DISCIPLINES } from '@/domain/disciplines';
import { SEVERITIES } from '@/domain/snags';

export const STATE_VERSION = 1 as const;

const DisciplineZ = z.enum(DISCIPLINES);
const SeverityZ = z.enum(SEVERITIES);

const PropTypeZ = z.enum(['apartment', 'villa']);
const ReportTypeZ = z.enum(['original', 'follow-up']);
const StatusZ = z.enum(['pending', 'pass', 'issue', 'na']);
const RectificationZ = z.enum(['fixed', 'open', 'new']);

export const ObservationZ = z.object({
  id: z.string(),
  text: z.string(),
  severity: SeverityZ.optional(),
  photoIds: z.array(z.string()).default([]),
  rectification: z
    .object({
      status: RectificationZ,
      note: z.string().default(''),
      photoIds: z.array(z.string()).default([]),
    })
    .optional(),
});

export const ItemZ = z.object({
  key: z.string(),
  label: z.string(),
  disc: DisciplineZ,
  status: StatusZ,
  severity: SeverityZ.optional(),
  note: z.string().default(''),
  observations: z.array(ObservationZ).default([]),
  dbNum: z.number().int().positive().optional(),
});

export const DbInstanceZ = z.object({
  num: z.number().int().positive(),
  location: z.string().default(''),
});

export const RoomStateZ = z.object({
  id: z.string(),
  label: z.string(),
  clKey: z.string(),
  icon: z.string(),
  discs: z.array(DisciplineZ),
  custom: z.boolean().default(false),
  excluded: z.boolean().default(false),
  overviewPhotoId: z.string().nullable().default(null),
  items: z.record(z.string(), ItemZ).default({}),
  dbInstances: z.array(DbInstanceZ).optional(),
});

export const JobZ = z.object({
  ref: z.string(),
  date: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  reportType: ReportTypeZ.default('original'),
  parentReportId: z.string().nullable().default(null),
  status: z.enum(['draft', 'completed']).default('draft'),
  /** Quote ref this inspection was started from, if any. */
  sourceQuoteRef: z.string().nullable().default(null),
});

export const ClientZ = z.object({
  name: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().default(''),
});

export const PropertyZ = z.object({
  type: PropTypeZ,
  developer: z.string().default(''),
  community: z.string().default(''),
  unit: z.string().default(''),
  floor: z.string().default(''),
  bua: z.number().nonnegative().default(0),
  bedrooms: z.number().int().nonnegative().default(0),
  price: z.number().nonnegative().default(0),
});

export const StateZ = z.object({
  version: z.literal(STATE_VERSION),
  job: JobZ,
  client: ClientZ,
  property: PropertyZ,
  coverPhotoIds: z.array(z.string().nullable()).length(3).default([null, null, null]),
  rooms: z.record(z.string(), RoomStateZ).default({}),
  roomOrder: z.array(z.string()).default([]),
  discLabels: z.record(z.string(), z.string()).default({}),
});

export type Observation = z.infer<typeof ObservationZ>;
export type Item = z.infer<typeof ItemZ>;
export type DbInstance = z.infer<typeof DbInstanceZ>;
export type RoomState = z.infer<typeof RoomStateZ>;
export type Job = z.infer<typeof JobZ>;
export type Client = z.infer<typeof ClientZ>;
export type Property = z.infer<typeof PropertyZ>;
export type State = z.infer<typeof StateZ>;
export type ReportType = z.infer<typeof ReportTypeZ>;
export type ItemStatus = z.infer<typeof StatusZ>;

/** Summary row stored in the Reports library (independent of full STATE). */
export const ReportSummaryZ = z.object({
  id: z.string(),
  jobRef: z.string(),
  reportType: ReportTypeZ,
  parentReportId: z.string().nullable(),
  clientName: z.string(),
  developer: z.string(),
  community: z.string(),
  unit: z.string(),
  propertyType: PropTypeZ,
  date: z.string(),
  createdAt: z.number(),
  totalSnags: z.number(),
  criticalSnags: z.number(),
  status: z.enum(['draft', 'completed']),
});

export type ReportSummary = z.infer<typeof ReportSummaryZ>;
