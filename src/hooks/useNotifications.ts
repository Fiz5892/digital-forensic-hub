import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendNotificationParams {
  recipientEmail: string;
  subject: string;
  body: string;
  notificationType: 'incident_created' | 'incident_assigned' | 'status_changed' | 'evidence_uploaded' | 'comment_added';
  relatedEntityId?: string;
}

export function useNotifications() {
  const sendNotification = async ({
    recipientEmail,
    subject,
    body,
    notificationType,
    relatedEntityId,
  }: SendNotificationParams) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          recipientEmail,
          subject,
          body,
          notificationType,
          relatedEntityId,
        },
      });

      if (error) {
        console.error('Failed to send notification:', error);
        toast.error('Failed to send notification');
        return { success: false, error };
      }

      console.log('Notification sent:', data);
      return { success: true, data };
    } catch (err) {
      console.error('Notification error:', err);
      return { success: false, error: err };
    }
  };

  const notifyIncidentCreated = async (incidentId: string, incidentTitle: string, assigneeEmail?: string) => {
    if (assigneeEmail) {
      await sendNotification({
        recipientEmail: assigneeEmail,
        subject: `New Incident Assigned: ${incidentId}`,
        body: `You have been assigned to a new incident: "${incidentTitle}". Please review and begin investigation.`,
        notificationType: 'incident_created',
        relatedEntityId: incidentId,
      });
    }
  };

  const notifyStatusChanged = async (
    incidentId: string,
    oldStatus: string,
    newStatus: string,
    recipientEmail: string
  ) => {
    await sendNotification({
      recipientEmail,
      subject: `Incident ${incidentId} Status Updated`,
      body: `The status of incident ${incidentId} has been changed from "${oldStatus}" to "${newStatus}".`,
      notificationType: 'status_changed',
      relatedEntityId: incidentId,
    });
  };

  const notifyEvidenceUploaded = async (
    incidentId: string,
    evidenceId: string,
    evidenceName: string,
    recipientEmail: string
  ) => {
    await sendNotification({
      recipientEmail,
      subject: `New Evidence Added to ${incidentId}`,
      body: `New evidence "${evidenceName}" (${evidenceId}) has been uploaded to incident ${incidentId}.`,
      notificationType: 'evidence_uploaded',
      relatedEntityId: incidentId,
    });
  };

  return {
    sendNotification,
    notifyIncidentCreated,
    notifyStatusChanged,
    notifyEvidenceUploaded,
  };
}
