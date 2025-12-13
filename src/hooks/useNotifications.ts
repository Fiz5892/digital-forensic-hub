import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendNotificationParams {
  recipientEmail: string;
  subject: string;
  body: string;
  notificationType: 'incident_created' | 'incident_assigned' | 'status_changed' | 'evidence_uploaded' | 'comment_added';
  relatedEntityId?: string;
  skipToast?: boolean; // Opsi untuk skip toast notification
}

export function useNotifications() {
  const sendNotification = async ({
    recipientEmail,
    subject,
    body,
    notificationType,
    relatedEntityId,
    skipToast = false,
  }: SendNotificationParams) => {
    try {
      // Insert ke database notification
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_email: recipientEmail,
          type: notificationType,
          title: subject,
          message: body,
          entity_type: 'incident',
          entity_id: relatedEntityId,
          read: false,
        })
        .select()
        .single();

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
        if (!skipToast) {
          toast.error('Failed to create notification');
        }
        return { success: false, error: notificationError };
      }

      // Insert ke email notification queue
      const { data: emailData, error: emailError } = await supabase
        .from('email_notifications')
        .insert({
          recipient_email: recipientEmail,
          subject: subject,
          body: body,
          notification_type: notificationType,
          related_entity_id: relatedEntityId,
          status: 'pending',
        })
        .select()
        .single();

      if (emailError) {
        console.error('Failed to queue email notification:', emailError);
        // Email gagal tapi notifikasi in-app berhasil, tetap return success
      }

      console.log('Notification sent successfully:', notificationData);
      
      if (!skipToast) {
        toast.success('Notification sent');
      }
      
      return { 
        success: true, 
        data: { notification: notificationData, email: emailData } 
      };
    } catch (err) {
      console.error('Notification error:', err);
      if (!skipToast) {
        toast.error('Failed to send notification');
      }
      return { success: false, error: err };
    }
  };

  const notifyIncidentCreated = async (
    incidentId: string, 
    incidentTitle: string, 
    assigneeEmail?: string,
    skipToast = true // Default true untuk menghindari toast berlebihan
  ) => {
    if (!assigneeEmail) {
      console.log('No assignee email provided, skipping notification');
      return { success: false, error: 'No assignee email' };
    }

    return await sendNotification({
      recipientEmail: assigneeEmail,
      subject: `New Incident Assigned: ${incidentId}`,
      body: `You have been assigned to a new incident: "${incidentTitle}". Please review and begin investigation.`,
      notificationType: 'incident_assigned',
      relatedEntityId: incidentId,
      skipToast,
    });
  };

  const notifyStatusChanged = async (
    incidentId: string,
    incidentTitle: string,
    oldStatus: string,
    newStatus: string,
    recipientEmails: string[], // Array untuk multiple recipients
    skipToast = true
  ) => {
    if (!recipientEmails || recipientEmails.length === 0) {
      console.log('No recipients provided, skipping notification');
      return { success: false, error: 'No recipients' };
    }

    // Kirim ke semua recipients
    const results = await Promise.allSettled(
      recipientEmails.map(email =>
        sendNotification({
          recipientEmail: email,
          subject: `Incident ${incidentId} Status Updated`,
          body: `The status of incident "${incidentTitle}" (${incidentId}) has been changed from "${oldStatus}" to "${newStatus}".`,
          notificationType: 'status_changed',
          relatedEntityId: incidentId,
          skipToast,
        })
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Status change notifications sent: ${successCount}/${recipientEmails.length}`);

    return { 
      success: successCount > 0, 
      results,
      successCount,
      totalCount: recipientEmails.length 
    };
  };

  const notifyEvidenceUploaded = async (
    incidentId: string,
    evidenceId: string,
    evidenceName: string,
    recipientEmails: string[],
    skipToast = true
  ) => {
    if (!recipientEmails || recipientEmails.length === 0) {
      console.log('No recipients provided, skipping notification');
      return { success: false, error: 'No recipients' };
    }

    const results = await Promise.allSettled(
      recipientEmails.map(email =>
        sendNotification({
          recipientEmail: email,
          subject: `New Evidence Added to ${incidentId}`,
          body: `New evidence "${evidenceName}" (${evidenceId}) has been uploaded to incident ${incidentId}.`,
          notificationType: 'evidence_uploaded',
          relatedEntityId: incidentId,
          skipToast,
        })
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Evidence upload notifications sent: ${successCount}/${recipientEmails.length}`);

    return { 
      success: successCount > 0, 
      results,
      successCount,
      totalCount: recipientEmails.length 
    };
  };

  const notifyCommentAdded = async (
    incidentId: string,
    incidentTitle: string,
    commenterName: string,
    commentPreview: string,
    recipientEmails: string[],
    skipToast = true
  ) => {
    if (!recipientEmails || recipientEmails.length === 0) {
      console.log('No recipients provided, skipping notification');
      return { success: false, error: 'No recipients' };
    }

    const results = await Promise.allSettled(
      recipientEmails.map(email =>
        sendNotification({
          recipientEmail: email,
          subject: `New Comment on ${incidentId}`,
          body: `${commenterName} commented on incident "${incidentTitle}": ${commentPreview.substring(0, 100)}${commentPreview.length > 100 ? '...' : ''}`,
          notificationType: 'comment_added',
          relatedEntityId: incidentId,
          skipToast,
        })
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Comment notifications sent: ${successCount}/${recipientEmails.length}`);

    return { 
      success: successCount > 0, 
      results,
      successCount,
      totalCount: recipientEmails.length 
    };
  };

  return {
    sendNotification,
    notifyIncidentCreated,
    notifyStatusChanged,
    notifyEvidenceUploaded,
    notifyCommentAdded,
  };
}