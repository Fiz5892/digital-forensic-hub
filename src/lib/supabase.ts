import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tabyowzzrnedlfswaimn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhYnlvd3p6cm5lZGxmc3dhaW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNTAxMjMsImV4cCI6MjA4MDgyNjEyM30._vNvpglADD5QzN8m-aar4aTMRddeTODrQkvuoLjf4hg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          name: string
          email: string
          role: 'reporter' | 'first_responder' | 'investigator' | 'manager' | 'admin'
          department: string | null
          avatar: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          email: string
          role: 'reporter' | 'first_responder' | 'investigator' | 'manager' | 'admin'
          department?: string | null
          avatar?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string
          role?: 'reporter' | 'first_responder' | 'investigator' | 'manager' | 'admin'
          department?: string | null
          avatar?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      incidents: {
        Row: {
          id: string
          title: string
          description: string | null
          type: 'Website Defacement' | 'SQL Injection' | 'Data Breach' | 'DDoS Attack' | 'Malware Infection' | 'Phishing' | 'Unauthorized Access' | 'Credential Stuffing' | 'XSS Attack' | 'Other'
          status: 'new' | 'triage' | 'investigation' | 'contained' | 'resolved' | 'closed'
          priority: 'critical' | 'high' | 'medium' | 'low'
          reporter_id: number
          assigned_to_id: number | null
          created_at: string
          updated_at: string
          closed_at: string | null
        }
        Insert: {
          id: string
          title: string
          description?: string | null
          type: 'Website Defacement' | 'SQL Injection' | 'Data Breach' | 'DDoS Attack' | 'Malware Infection' | 'Phishing' | 'Unauthorized Access' | 'Credential Stuffing' | 'XSS Attack' | 'Other'
          status?: 'new' | 'triage' | 'investigation' | 'contained' | 'resolved' | 'closed'
          priority?: 'critical' | 'high' | 'medium' | 'low'
          reporter_id: number
          assigned_to_id?: number | null
          created_at?: string
          updated_at?: string
          closed_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: 'Website Defacement' | 'SQL Injection' | 'Data Breach' | 'DDoS Attack' | 'Malware Infection' | 'Phishing' | 'Unauthorized Access' | 'Credential Stuffing' | 'XSS Attack' | 'Other'
          status?: 'new' | 'triage' | 'investigation' | 'contained' | 'resolved' | 'closed'
          priority?: 'critical' | 'high' | 'medium' | 'low'
          reporter_id?: number
          assigned_to_id?: number | null
          created_at?: string
          updated_at?: string
          closed_at?: string | null
        }
      }
      evidence: {
        Row: {
          id: string
          incident_id: string
          filename: string
          file_type: string | null
          file_size: number | null
          hash_md5: string | null
          hash_sha256: string | null
          collected_by_id: number
          collected_at: string
          current_custodian_id: number
          storage_location: string | null
          analysis_status: 'pending' | 'analyzing' | 'analyzed' | 'archived'
          integrity_status: 'verified' | 'tampered' | 'unknown'
          description: string | null
        }
        Insert: {
          id: string
          incident_id: string
          filename: string
          file_type?: string | null
          file_size?: number | null
          hash_md5?: string | null
          hash_sha256?: string | null
          collected_by_id: number
          collected_at: string
          current_custodian_id: number
          storage_location?: string | null
          analysis_status?: 'pending' | 'analyzing' | 'analyzed' | 'archived'
          integrity_status?: 'verified' | 'tampered' | 'unknown'
          description?: string | null
        }
        Update: {
          id?: string
          incident_id?: string
          filename?: string
          file_type?: string | null
          file_size?: number | null
          hash_md5?: string | null
          hash_sha256?: string | null
          collected_by_id?: number
          collected_at?: string
          current_custodian_id?: number
          storage_location?: string | null
          analysis_status?: 'pending' | 'analyzing' | 'analyzed' | 'archived'
          integrity_status?: 'verified' | 'tampered' | 'unknown'
          description?: string | null
        }
      }
    }
  }
}
