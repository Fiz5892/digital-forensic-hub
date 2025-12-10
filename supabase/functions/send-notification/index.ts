import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  recipientEmail: string;
  subject: string;
  body: string;
  notificationType: string;
  relatedEntityId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { recipientEmail, subject, body, notificationType, relatedEntityId }: NotificationRequest = await req.json();

    console.log(`Sending notification to ${recipientEmail}: ${subject}`);

    // Store the notification in the database
    const { data: notification, error: dbError } = await supabase
      .from("email_notifications")
      .insert({
        recipient_email: recipientEmail,
        subject,
        body,
        notification_type: notificationType,
        related_entity_id: relatedEntityId || null,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Failed to store notification: ${dbError.message}`);
    }

    // In a production environment, you would send the actual email here
    // using a service like Resend, SendGrid, or AWS SES
    console.log("Notification stored successfully:", notification);

    // Simulate email sending (for demo purposes)
    const emailSimulation = {
      id: notification.id,
      to: recipientEmail,
      subject,
      body,
      status: "sent",
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify({ success: true, notification: emailSimulation }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-notification function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
