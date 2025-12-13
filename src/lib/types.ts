// lib/types.ts
export type UserRole = 'admin' | 'manager' | 'investigator' | 'first_responder' | 'reporter';

export type IncidentType = 
  | 'Website Defacement'
  | 'SQL Injection'
  | 'Data Breach'
  | 'DDoS Attack'
  | 'Malware Infection'
  | 'Phishing'
  | 'Unauthorized Access'
  | 'Credential Stuffing'
  | 'XSS Attack'
  | 'Other';

export type IncidentStatus = 
  | 'new'
  | 'triage'
  | 'investigation'
  | 'contained'
  | 'resolved'
  | 'closed';

export type IncidentPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type AnalysisStatus = 
  | 'pending'
  | 'analyzing'
  | 'analyzed'
  | 'archived';

export type IntegrityStatus = 
  | 'verified'
  | 'tampered'
  | 'unknown';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

export interface Reporter {
  id: string;
  name: string;
  email: string;
}

export interface Assignee {
  id: string;
  name: string;
}

export interface ImpactAssessment {
  confidentiality: number; // 1-5
  integrity: number; // 1-5
  availability: number; // 1-5
  business_impact: string;
}

export interface TechnicalDetails {
  target_url?: string;
  ip_address?: string;
  server_os?: string;
  web_server?: string;
  cms?: string;
  database?: string;
  attack_vector?: string;
  vulnerabilities?: string[];
  [key: string]: any;
}

export interface TimelineEvent {
  timestamp: string;
  title: string;
  description: string;
  user?: string;
}

export interface Note {
  id: string;
  author: string;
  timestamp: string;
  content: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  type: IncidentType;
  status: IncidentStatus;
  priority: IncidentPriority;
  reporter: Reporter;
  assigned_to?: Assignee;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  impact_assessment: ImpactAssessment;
  technical_details: TechnicalDetails;
  timeline: TimelineEvent[];
  evidence_ids: string[];
  notes: Note[];
  regulatory_requirements: string[];
}

export interface CollectedBy {
  id: string;
  name: string;
}

export interface Custodian {
  id: string;
  name: string;
}

export interface CustodyTransfer {
  from: string;
  to: string;
  timestamp: string;
  reason: string;
  location: string;
}

export interface Evidence {
  id: string;
  incident_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  hash_md5: string;
  hash_sha256: string;
  collected_by: CollectedBy;
  collected_at: string;
  current_custodian: Custodian;
  storage_location: string;
  analysis_status: AnalysisStatus;
  integrity_status: IntegrityStatus;
  description?: string;
  tags: string[];
  analysis_results?: any;
  chain_of_custody: CustodyTransfer[];
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
}