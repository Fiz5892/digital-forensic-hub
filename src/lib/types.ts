export type UserRole = 'reporter' | 'first_responder' | 'investigator' | 'manager' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}

export type IncidentStatus = 'new' | 'triage' | 'investigation' | 'contained' | 'resolved' | 'closed';
export type IncidentPriority = 'critical' | 'high' | 'medium' | 'low';
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

export interface ImpactAssessment {
  confidentiality: number;
  integrity: number;
  availability: number;
  business_impact: string;
}

export interface TechnicalDetails {
  target_url: string;
  ip_address: string;
  server_os: string;
  web_server: string;
  cms: string;
  database: string;
}

export interface TimelineEvent {
  id: number;
  timestamp: string;
  event: string;
  type: 'detection' | 'report' | 'assignment' | 'evidence' | 'analysis' | 'containment' | 'reporting' | 'closure';
  user?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  type: IncidentType;
  status: IncidentStatus;
  priority: IncidentPriority;
  reporter: { id: number; name: string; email: string };
  assigned_to?: { id: number; name: string };
  created_at: string;
  updated_at: string;
  closed_at?: string;
  impact_assessment: ImpactAssessment;
  technical_details: TechnicalDetails;
  timeline: TimelineEvent[];
  evidence_ids: string[];
  notes: IncidentNote[];
  regulatory_requirements: string[];
}

export interface IncidentNote {
  id: number;
  content: string;
  category: 'hypothesis' | 'finding' | 'action_item' | 'question';
  created_by: { id: number; name: string };
  created_at: string;
}

export interface CustodyTransfer {
  sequence: number;
  from: string;
  to: string;
  timestamp: string;
  reason: string;
  hash_verified: boolean;
  witness?: string;
}

export interface Evidence {
  id: string;
  incident_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  hash_md5: string;
  hash_sha256: string;
  collected_by: { id: number; name: string };
  collected_at: string;
  current_custodian: { id: number; name: string };
  storage_location: string;
  analysis_status: 'pending' | 'analyzing' | 'analyzed' | 'archived';
  integrity_status: 'verified' | 'tampered' | 'unknown';
  custody_chain: CustodyTransfer[];
  description?: string;
}
