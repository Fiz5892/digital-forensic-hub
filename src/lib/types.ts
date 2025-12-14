// src/lib/types.ts
import { Database } from '@/lib/supabase';

export type UserRole = Database['public']['Tables']['users']['Row']['role'];
export type IncidentType = Database['public']['Tables']['incidents']['Row']['type'];
export type IncidentStatus = Database['public']['Tables']['incidents']['Row']['status'];
export type IncidentPriority = Database['public']['Tables']['incidents']['Row']['priority'];
export type EvidenceStatus = Database['public']['Tables']['evidence']['Row']['analysis_status'];
export type IntegrityStatus = Database['public']['Tables']['evidence']['Row']['integrity_status'];

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
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
  technical_details?: {
    target_url?: string;
    ip_address?: string;
    server_os?: string;
    web_server?: string;
    cms?: string;
    database?: string;
  };
  impact_assessment?: {
    confidentiality: number;
    integrity: number;
    availability: number;
    business_impact?: string;
  };
  regulatory_requirements?: string[];
}

export interface CustodyChainEntry {
  from: { id: number; name: string };
  to: { id: number; name: string };
  transferred_at: string;
  reason: string;
  witness: { id: number; name: string } | null;
  location: string;
}

// Evidence interface yang sesuai dengan database schema
export interface Evidence {
  id: string;
  incident_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  hash_md5: string;
  hash_sha256: string;
  storage_path?: string | null;  // ✅
  storage_url?: string | null;   // ✅
  collected_by: { id: string; name: string };
  collected_at: string;
  current_custodian: { id: string; name: string };
  custody_chain?: CustodyChainEntry[]; // ✅
  storage_location: string;
  analysis_status: EvidenceStatus;
  integrity_status: IntegrityStatus;
  description: string;
  tags: string[];
  analysis_results?: any;
}