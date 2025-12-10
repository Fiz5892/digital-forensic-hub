import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

interface AuditLogParams {
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export function useAuditLog() {
  const logAction = async ({ action, entityType, entityId, details }: AuditLogParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('audit_logs').insert([{
        user_id: user?.id || null,
        user_email: user?.email || null,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: (details || null) as Json,
        ip_address: null,
      }]);

      if (error) {
        console.error('Failed to log audit action:', error);
      }
    } catch (err) {
      console.error('Audit log error:', err);
    }
  };

  return { logAction };
}
