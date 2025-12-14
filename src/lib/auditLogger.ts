// lib/auditLogger.ts
import { supabase } from '@/integrations/supabase/client';

interface AuditLogParams {
  action: 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'export' | 'assign' | 'transfer' | 'update_status' | 'add_note' | 'delete_note' | 'add_timeline_event' | 'transfer_custody' | 'upload_evidence' | 'quick_triage';
  entity_type: 'incident' | 'evidence' | 'user' | 'report' | 'auth' | 'custody';
  entity_id?: string;
  details?: Record<string, unknown>;
}

/**
 * Log aktivitas pengguna ke tabel audit_logs
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    // Dapatkan user yang sedang login
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('No authenticated user for audit log');
      return;
    }

    // Dapatkan IP address (simplified - dalam production gunakan API)
    let ip_address = 'unknown';
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json', { 
        signal: AbortSignal.timeout(2000) 
      });
      const ipData = await ipResponse.json();
      ip_address = ipData.ip;
    } catch {
      // Ignore IP fetch errors
    }

    // Insert ke audit_logs
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        user_email: user.email,
        action: params.action,
        entity_type: params.entity_type,
        entity_id: params.entity_id || null,
        details: params.details || {},
        ip_address
      });

    if (error) {
      console.error('Failed to log audit:', error);
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}

/**
 * Helper khusus untuk log auth events
 */
export async function logAuthEvent(
  action: 'login' | 'logout', 
  userEmail: string, 
  userId?: string
): Promise<void> {
  try {
    let ip_address = 'unknown';
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json', { 
        signal: AbortSignal.timeout(2000) 
      });
      const ipData = await ipResponse.json();
      ip_address = ipData.ip;
    } catch {
      // Ignore IP fetch errors
    }

    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId || null,
        user_email: userEmail,
        action,
        entity_type: 'auth',
        entity_id: userId || null,
        details: { 
          timestamp: new Date().toISOString(),
          action_type: action 
        },
        ip_address
      });
  } catch (err) {
    console.error('Auth audit logging error:', err);
  }
}
