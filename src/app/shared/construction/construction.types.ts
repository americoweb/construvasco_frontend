export interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  total?: number;
  per_page?: number;
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

export interface ApiDataResponse<T> {
  data: T;
}

export interface ProjectRequestUser {
  id: number;
  name?: string;
  identifier?: string;
  email?: string;
}

export interface ProjectDocument {
  id: number;
  document_type?: string;
  file_path?: string;
  original_name?: string;
  created_at?: string;
}

export interface Quote {
  id: number;
  project_request_id: number;
  quote_type?: string;
  total_amount_mt: number | string;
  delivery_days?: number;
  conditions?: string;
  status?: string;
  sent_at?: string;
  responded_at?: string;
  expires_at?: string;
  rejection_reason?: string;
  breakdown?: Record<string, unknown>;
  project_request?: ProjectRequest;
}

export interface ProjectRequestClient {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
}

export interface ProjectRequestProjectSummary {
  id: number;
  name?: string;
  contract_phase?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectRequest {
  id: number;
  reference_code?: string;
  user_id: number;
  project_type?: string;
  tipologia?: string;
  title?: string;
  description?: string;
  localizacao?: string;
  status?: string;
  briefing_data?: Record<string, unknown>;
  approved_ai_generation_id?: number | null;
  area_m2?: number | string | null;
  num_pisos?: number | null;
  estilo_arquitectonico?: string;
  paleta_acabamento?: string;
  submitted_at?: string;
  reviewed_at?: string;
  converted_project_id?: number | null;
  whatsapp?: string;
  user?: ProjectRequestUser;
  client?: ProjectRequestClient;
  quotes?: Quote[];
  documents?: ProjectDocument[];
  ai_generations?: AiGenerationRecord[];
  approved_ai_generation?: AiGenerationRecord | null;
  projects?: ProjectRequestProjectSummary[];
}

export interface ConstructionProject {
  id: number;
  name?: string;
  status?: string;
  project_type?: string;
  location?: string;
  current_phase?: string;
  budget?: number | string;
  target_budget?: number | string;
  updated_at?: string;
  client?: { id?: number; name?: string; identifier?: string };
  assignments?: {
    id?: number;
    assigned_to?: number;
    assignment_role?: string;
    assigned_user?: { id: number; name?: string };
  }[];
  milestones?: { id: number; title?: string; status?: string }[];
  quote?: Quote;
}

export interface AssignableUser {
  id: number;
  name: string;
  identifier?: string;
}

export interface StoreQuotePayload {
  total_amount_mt: number;
  delivery_days: number;
  conditions?: string;
  valid_until?: string;
  quote_type?: 'architecture';
  breakdown?: Record<string, unknown>;
}

export interface CustomerDashboard {
  credits_balance?: number;
  project_requests_count: number;
  pending_quotes: number;
}

export interface AiGenerationRecord {
  id: number;
  project_request_id?: number | null;
  type: string;
  prompt?: string | null;
  status: string;
  image_url?: string | null;
  parent_generation_id?: number | null;
  created_at?: string;
}

export interface StudioState {
  draft: ProjectRequest;
  has_meaningful_content: boolean;
  credits_balance: number;
  cost_per_generation: number;
  generations: AiGenerationRecord[];
  disclaimer: string;
}
