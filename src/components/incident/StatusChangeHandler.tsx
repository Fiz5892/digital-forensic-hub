import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { logAudit } from '@/lib/auditLogger';
import { Incident, IncidentStatus } from '@/lib/types';
import { statusLabels } from '@/lib/mockData';

interface StatusChangeHandlerProps {
  incident: Incident;
  onSuccess?: () => void;
}

export default function StatusChangeHandler({ incident, onSuccess }: StatusChangeHandlerProps) {
  const { updateIncident } = useData();
  const { user: currentUser } = useAuth();
  const { notifyStatusChanged } = useNotifications();

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    if (newStatus === incident.status) {
      return; // No change
    }

    const oldStatus = incident.status;

    try {
      // Update incident
      const updatedIncident: Incident = {
        ...incident,
        status: newStatus,
        updated_at: new Date().toISOString(),
        // Set closed_at if status is closed
        closed_at: newStatus === 'closed' ? new Date().toISOString() : incident.closed_at,
        timeline: [
          ...incident.timeline,
          {
            timestamp: new Date().toISOString(),
            title: `Status Changed: ${statusLabels[oldStatus]} → ${statusLabels[newStatus]}`,
            description: `Status updated by ${currentUser?.name}`,
            user: currentUser?.name || 'System',
          }
        ]
      };

      // Save to database
      await updateIncident(updatedIncident);

      // Collect recipients for notification
      const recipients: string[] = [];
      
      // Add reporter
      if (incident.reporter.email) {
        recipients.push(incident.reporter.email);
      }
      
      // Add assignee if exists and different from reporter
      if (incident.assigned_to?.email && 
          incident.assigned_to.email !== incident.reporter.email) {
        recipients.push(incident.assigned_to.email);
      }

      // Send notifications to all interested parties
      if (recipients.length > 0) {
        await notifyStatusChanged(
          incident.id,
          incident.title,
          statusLabels[oldStatus],
          statusLabels[newStatus],
          recipients,
          false // Show toast notification
        );
      }

      // Log audit trail
      await logAudit({
        action: 'update',
        entity_type: 'incident',
        entity_id: incident.id,
        details: {
          action: 'status_change',
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: currentUser?.email,
          notification_sent_to: recipients,
        },
      });

      toast.success('Status updated successfully', {
        description: recipients.length > 0 
          ? `${recipients.length} notification(s) sent`
          : 'Status changed'
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      
      // Log failed attempt
      await logAudit({
        action: 'update',
        entity_type: 'incident',
        entity_id: incident.id,
        details: {
          action: 'status_change_failed',
          error: 'Failed to update status',
          attempted_old_status: oldStatus,
          attempted_new_status: newStatus,
          attempted_by: currentUser?.email,
        },
      });

      toast.error('Failed to update status', {
        description: 'Please try again or contact support'
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Status:</span>
      <Select value={incident.status} onValueChange={(v) => handleStatusChange(v as IncidentStatus)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">🆕 New</SelectItem>
          <SelectItem value="triage">🔍 Triage</SelectItem>
          <SelectItem value="investigation">🕵️ Investigation</SelectItem>
          <SelectItem value="contained">🛡️ Contained</SelectItem>
          <SelectItem value="resolved">✅ Resolved</SelectItem>
          <SelectItem value="closed">🔒 Closed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}