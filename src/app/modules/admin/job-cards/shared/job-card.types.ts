// Job Card Types — mirrors backend JobCard resources

export enum JobCardStatus {
  DRAFT      = 'draft',
  BRIEFING   = 'briefing',
  DESIGN     = 'design',
  REVISION   = 'revision',
  APPROVAL   = 'approval',
  PRODUCTION = 'production',
  DONE       = 'done',
  CANCELLED  = 'cancelled'
}

export enum JobCardPriority {
  LOW    = 'low',
  MEDIUM = 'medium',
  HIGH   = 'high'
}

export enum ClientTier {
  VIP    = 'vip',
  NORMAL = 'normal',
  NEW    = 'new'
}

export enum JobCardFileType {
  BRIEFING  = 'briefing',
  REFERENCE = 'reference',
  DESIGN    = 'design',
  PREVIEW   = 'preview',
  FINAL     = 'final'
}

export enum FeedbackRole {
  COMERCIAL = 'comercial',
  DESIGNER  = 'designer',
  CLIENT    = 'client'
}

// -------------------------------------------------------------------------
// Nested types
// -------------------------------------------------------------------------

export interface JobCardUser {
  id: number;
  name: string;
  email?: string;
}

export interface JobCardItem {
  id: number;
  product_type: string;
  quantity: number;
  size?: string;
  material?: string;
  notes?: string;
  created_at?: string;
}

export interface JobCardFile {
  id: number;
  type: JobCardFileType;
  type_label: string;
  file_name: string;
  file_url: string;
  mime_type?: string;
  file_size?: number;
  version: number;
  notes?: string;
  // Google Drive mirror
  drive_synced: boolean;
  drive_link?: string;
  drive_download_link?: string;
  drive_synced_at?: string;
  uploaded_by?: JobCardUser;
  created_at?: string;
}

export interface JobCardFeedback {
  id: number;
  comment: string;
  role: FeedbackRole;
  role_label: string;
  version: number;
  is_approved: boolean;
  author?: JobCardUser;
  created_at?: string;
}

// -------------------------------------------------------------------------
// Main JobCard interface (detail)
// -------------------------------------------------------------------------

export interface JobCard {
  id: number;
  uuid: string;
  job_number: string;

  status: JobCardStatus;
  status_label: string;
  status_color: string;

  title: string;
  description?: string;
  objective?: string;
  deadline: string;
  is_overdue: boolean;
  notes?: string;

  priority: JobCardPriority;
  priority_label: string;
  priority_color: string;
  priority_override: boolean;
  priority_reason?: string;
  priority_score: number;

  client_tier: ClientTier;
  client_tier_label: string;

  revision_limit: number;
  revision_count: number;
  over_revision_limit: boolean;
  can_be_cancelled: boolean;

  client?: JobCardUser;
  creator?: JobCardUser;
  designer?: JobCardUser;

  order_id?: number;

  items?: JobCardItem[];
  files?: JobCardFile[];
  feedback?: JobCardFeedback[];

  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------------------------
// Request / payload types
// -------------------------------------------------------------------------

export interface CreateJobCardItemPayload {
  product_type: string;
  quantity: number;
  size?: string;
  material?: string;
  notes?: string;
}

export interface CreateJobCardPayload {
  client_id: number;
  assigned_designer_id?: number;
  title: string;
  description?: string;
  objective?: string;
  deadline: string;
  priority?: JobCardPriority;
  priority_override?: boolean;
  priority_reason?: string;
  client_tier?: ClientTier;
  revision_limit?: number;
  notes?: string;
  items?: CreateJobCardItemPayload[];
}

export interface UpdateJobCardStatusPayload {
  status: JobCardStatus;
  notes?: string;
}

export interface UpdatePriorityPayload {
  priority: JobCardPriority;
  priority_override?: boolean;
  priority_reason?: string;
}

export interface AddFeedbackPayload {
  comment: string;
  role: FeedbackRole;
  is_approved?: boolean;
}

// -------------------------------------------------------------------------
// Kanban board type
// -------------------------------------------------------------------------

export type JobCardKanbanBoard = {
  [key in JobCardStatus]?: JobCard[];
};

// -------------------------------------------------------------------------
// Status/Priority metadata helpers (used in templates)
// -------------------------------------------------------------------------

export const JOB_CARD_STATUS_LABELS: Record<JobCardStatus, string> = {
  [JobCardStatus.DRAFT]:      'Rascunho',
  [JobCardStatus.BRIEFING]:   'Briefing',
  [JobCardStatus.DESIGN]:     'Design',
  [JobCardStatus.REVISION]:   'Revisão',
  [JobCardStatus.APPROVAL]:   'Aprovação',
  [JobCardStatus.PRODUCTION]: 'Produção',
  [JobCardStatus.DONE]:       'Concluído',
  [JobCardStatus.CANCELLED]:  'Cancelado',
};

export const JOB_CARD_STATUS_COLORS: Record<JobCardStatus, string> = {
  [JobCardStatus.DRAFT]:      'gray',
  [JobCardStatus.BRIEFING]:   'blue',
  [JobCardStatus.DESIGN]:     'purple',
  [JobCardStatus.REVISION]:   'yellow',
  [JobCardStatus.APPROVAL]:   'orange',
  [JobCardStatus.PRODUCTION]: 'indigo',
  [JobCardStatus.DONE]:       'green',
  [JobCardStatus.CANCELLED]:  'red',
};

export const JOB_CARD_PRIORITY_LABELS: Record<JobCardPriority, string> = {
  [JobCardPriority.LOW]:    'Baixa',
  [JobCardPriority.MEDIUM]: 'Média',
  [JobCardPriority.HIGH]:   'Alta',
};

export const JOB_CARD_PRIORITY_COLORS: Record<JobCardPriority, string> = {
  [JobCardPriority.LOW]:    'green',
  [JobCardPriority.MEDIUM]: 'yellow',
  [JobCardPriority.HIGH]:   'red',
};

/** All status transitions allowed on the frontend (mirrors backend canTransitionTo) */
export const JOB_CARD_STATUS_TRANSITIONS: Record<JobCardStatus, JobCardStatus[]> = {
  [JobCardStatus.DRAFT]:      [JobCardStatus.BRIEFING, JobCardStatus.CANCELLED],
  [JobCardStatus.BRIEFING]:   [JobCardStatus.DESIGN, JobCardStatus.DRAFT, JobCardStatus.CANCELLED],
  [JobCardStatus.DESIGN]:     [JobCardStatus.REVISION, JobCardStatus.APPROVAL, JobCardStatus.CANCELLED],
  [JobCardStatus.REVISION]:   [JobCardStatus.DESIGN, JobCardStatus.APPROVAL, JobCardStatus.CANCELLED],
  [JobCardStatus.APPROVAL]:   [JobCardStatus.PRODUCTION, JobCardStatus.REVISION, JobCardStatus.CANCELLED],
  [JobCardStatus.PRODUCTION]: [JobCardStatus.DONE, JobCardStatus.CANCELLED],
  [JobCardStatus.DONE]:       [],
  [JobCardStatus.CANCELLED]:  [],
};

export function canTransitionTo(from: JobCardStatus, to: JobCardStatus): boolean {
  return JOB_CARD_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export const KANBAN_COLUMNS: JobCardStatus[] = [
  JobCardStatus.BRIEFING,
  JobCardStatus.DESIGN,
  JobCardStatus.REVISION,
  JobCardStatus.APPROVAL,
  JobCardStatus.PRODUCTION,
];
