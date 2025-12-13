-- =============================================
-- DFIR-MANAGER COMPLETE DATABASE MIGRATION
-- PRODUCTION READY - FULL VERSION
-- Version: 2.0
-- Last Updated: 2024
-- =============================================

-- ============================================
-- PART 1: DROP EXISTING (IF RE-RUNNING)
-- ============================================

-- Drop tables first (in reverse order of dependencies)
-- This will automatically drop any dependent triggers and policies
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.evidence CASCADE;
DROP TABLE IF EXISTS public.incidents CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.email_notifications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions (CASCADE will handle dependencies)
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_incident_assignment() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.get_incident_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_activity(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.search_incidents(text) CASCADE;

-- Drop triggers on auth.users separately (since it's in auth schema)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop enums
DROP TYPE IF EXISTS public.notification_type CASCADE;
DROP TYPE IF EXISTS public.integrity_status CASCADE;
DROP TYPE IF EXISTS public.analysis_status CASCADE;
DROP TYPE IF EXISTS public.incident_priority CASCADE;
DROP TYPE IF EXISTS public.incident_status CASCADE;
DROP TYPE IF EXISTS public.incident_type CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- ============================================
-- PART 2: CREATE ENUMS
-- ============================================

-- User roles enum
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'manager',
  'investigator',
  'first_responder',
  'reporter'
);

-- Incident type enum
CREATE TYPE public.incident_type AS ENUM (
  'Website Defacement',
  'SQL Injection',
  'Data Breach',
  'DDoS Attack',
  'Malware Infection',
  'Phishing',
  'Unauthorized Access',
  'Credential Stuffing',
  'XSS Attack',
  'Other'
);

-- Incident status enum
CREATE TYPE public.incident_status AS ENUM (
  'new',
  'triage',
  'investigation',
  'contained',
  'resolved',
  'closed'
);

-- Incident priority enum
CREATE TYPE public.incident_priority AS ENUM (
  'critical',
  'high',
  'medium',
  'low'
);

-- Evidence analysis status enum
CREATE TYPE public.analysis_status AS ENUM (
  'pending',
  'analyzing',
  'analyzed',
  'archived'
);

-- Evidence integrity status enum
CREATE TYPE public.integrity_status AS ENUM (
  'verified',
  'tampered',
  'unknown'
);

-- Notification type enum
CREATE TYPE public.notification_type AS ENUM (
  'incident_created',
  'incident_assigned',
  'status_changed',
  'evidence_uploaded',
  'comment_added',
  'custody_transferred',
  'analysis_completed',
  'priority_changed'
);

-- ============================================
-- PART 3: CREATE USER MANAGEMENT TABLES
-- ============================================

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profile information';
COMMENT ON COLUMN public.profiles.is_active IS 'Whether user account is active';

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'reporter',
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.user_roles IS 'User role assignments for access control';

-- ============================================
-- PART 4: CREATE AUDIT & NOTIFICATION TABLES
-- ============================================

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.audit_logs IS 'Audit trail for all system activities';
COMMENT ON COLUMN public.audit_logs.details IS 'JSON object containing additional context';

-- Email notifications table
CREATE TABLE public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  notification_type TEXT NOT NULL,
  related_entity_id TEXT,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.email_notifications IS 'Email notification queue and history';
COMMENT ON COLUMN public.email_notifications.status IS 'pending, sent, failed';

-- In-app notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 'In-app notifications for real-time user alerts';
COMMENT ON COLUMN public.notifications.read IS 'Whether notification has been read by user';

-- ============================================
-- PART 5: CREATE INCIDENT MANAGEMENT TABLES
-- ============================================

-- Incidents table
CREATE TABLE public.incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type incident_type NOT NULL DEFAULT 'Other',
  status incident_status NOT NULL DEFAULT 'new',
  priority incident_priority NOT NULL DEFAULT 'medium',
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_name TEXT,
  reporter_email TEXT,
  assigned_to_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  assigned_to_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  impact_assessment JSONB DEFAULT '{"confidentiality": 1, "integrity": 1, "availability": 1, "business_impact": ""}'::jsonb,
  technical_details JSONB DEFAULT '{}'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  evidence_ids TEXT[] DEFAULT '{}',
  notes JSONB DEFAULT '[]'::jsonb,
  regulatory_requirements TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}'
);

COMMENT ON TABLE public.incidents IS 'Security incidents for investigation';
COMMENT ON COLUMN public.incidents.timeline IS 'JSON array of timeline events';
COMMENT ON COLUMN public.incidents.evidence_ids IS 'Array of evidence IDs linked to this incident';

-- Evidence table
CREATE TABLE public.evidence (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  hash_md5 TEXT,
  hash_sha256 TEXT,
  hash_sha512 TEXT,
  collected_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  collected_by_name TEXT,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_custodian_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  current_custodian_name TEXT,
  storage_location TEXT,
  storage_path TEXT,
  analysis_status analysis_status NOT NULL DEFAULT 'pending',
  integrity_status integrity_status NOT NULL DEFAULT 'unknown',
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  analysis_results JSONB DEFAULT '{}'::jsonb,
  chain_of_custody JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.evidence IS 'Digital evidence with chain of custody';
COMMENT ON COLUMN public.evidence.chain_of_custody IS 'JSON array of custody transfer records';
COMMENT ON COLUMN public.evidence.metadata IS 'Additional file metadata (EXIF, etc)';

-- Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id TEXT NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.comments IS 'Comments on incidents for collaboration';
COMMENT ON COLUMN public.comments.is_internal IS 'Internal notes not visible to reporters';

-- ============================================
-- PART 6: CREATE CORE FUNCTIONS
-- Tables must exist before functions that reference them
-- ============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check user role (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$func$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $func$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$func$;

-- ============================================
-- PART 7: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 8: CREATE RLS POLICIES - PROFILES
-- ============================================

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- PART 9: CREATE RLS POLICIES - USER ROLES
-- ============================================

CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================
-- PART 10: CREATE RLS POLICIES - AUDIT LOGS
-- ============================================

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- PART 11: CREATE RLS POLICIES - EMAIL NOTIFICATIONS
-- ============================================

CREATE POLICY "Admins can view email notifications"
ON public.email_notifications FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager')
);

CREATE POLICY "System can insert email notifications"
ON public.email_notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update email notifications"
ON public.email_notifications FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- PART 12: CREATE RLS POLICIES - IN-APP NOTIFICATIONS
-- ============================================

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (
  auth.uid() = user_id OR 
  auth.email() = user_email
);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (
  auth.uid() = user_id OR 
  auth.email() = user_email
)
WITH CHECK (
  auth.uid() = user_id OR 
  auth.email() = user_email
);

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (
  auth.uid() = user_id OR 
  auth.email() = user_email
);

-- ============================================
-- PART 13: CREATE RLS POLICIES - INCIDENTS
-- ============================================

CREATE POLICY "Authenticated users can view incidents"
ON public.incidents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create incidents"
ON public.incidents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can update incidents"
ON public.incidents FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'investigator') OR
  has_role(auth.uid(), 'first_responder') OR
  reporter_id = auth.uid() OR
  assigned_to_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'investigator') OR
  has_role(auth.uid(), 'first_responder') OR
  reporter_id = auth.uid() OR
  assigned_to_id = auth.uid()
);

CREATE POLICY "Admins can delete incidents"
ON public.incidents FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- PART 14: CREATE RLS POLICIES - EVIDENCE
-- ============================================

CREATE POLICY "Authenticated users can view evidence"
ON public.evidence FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authorized users can create evidence"
ON public.evidence FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'investigator') OR
  has_role(auth.uid(), 'first_responder')
);

CREATE POLICY "Authorized users can update evidence"
ON public.evidence FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'investigator') OR
  current_custodian_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'manager') OR 
  has_role(auth.uid(), 'investigator') OR
  current_custodian_id = auth.uid()
);

CREATE POLICY "Admins can delete evidence"
ON public.evidence FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- PART 15: CREATE RLS POLICIES - COMMENTS
-- ============================================

CREATE POLICY "Authenticated users can view comments"
ON public.comments FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL AND
  (NOT is_internal OR 
   has_role(auth.uid(), 'admin') OR 
   has_role(auth.uid(), 'manager') OR 
   has_role(auth.uid(), 'investigator'))
);

CREATE POLICY "Authenticated users can create comments"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own comments"
ON public.comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments or admins"
ON public.comments FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin')
);

-- ============================================
-- PART 16: CREATE TRIGGERS
-- ============================================

-- Auto-update updated_at for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at for incidents
CREATE TRIGGER update_incidents_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at for notifications
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at for comments
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PART 17: CREATE AUTO-PROFILE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  user_full_name TEXT;
BEGIN
  -- Get full name from metadata or use email
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, user_full_name, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Assign default role (reporter)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'reporter')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$func$;

-- Trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PART 18: CREATE AUTO-NOTIFICATION TRIGGERS
-- ============================================

-- Function to send notification on incident assignment
CREATE OR REPLACE FUNCTION public.notify_on_incident_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  assignee_email TEXT;
BEGIN
  -- Only notify if assigned_to changed and is not null
  IF (TG_OP = 'UPDATE' AND 
      NEW.assigned_to_id IS NOT NULL AND 
      (OLD.assigned_to_id IS NULL OR OLD.assigned_to_id != NEW.assigned_to_id)) THEN
    
    -- Get assignee email from profiles
    SELECT email INTO assignee_email
    FROM public.profiles
    WHERE user_id = NEW.assigned_to_id;
    
    -- If email not in profiles, use assigned_to_email from incident
    IF assignee_email IS NULL THEN
      assignee_email := NEW.assigned_to_email;
    END IF;
    
    IF assignee_email IS NOT NULL THEN
      -- Insert notification
      INSERT INTO public.notifications (
        user_id,
        user_email,
        type,
        title,
        message,
        entity_type,
        entity_id,
        read
      ) VALUES (
        NEW.assigned_to_id,
        assignee_email,
        'incident_assigned',
        'New Incident Assigned: ' || NEW.id,
        'You have been assigned to incident "' || NEW.title || '" with priority ' || NEW.priority,
        'incident',
        NEW.id,
        false
      );
      
      -- Also insert email notification
      INSERT INTO public.email_notifications (
        recipient_email,
        subject,
        body,
        notification_type,
        related_entity_id
      ) VALUES (
        assignee_email,
        'New Incident Assigned: ' || NEW.id,
        'You have been assigned to incident "' || NEW.title || '". Please review and begin investigation.',
        'incident_assigned',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the update
    RAISE WARNING 'Error in notify_on_incident_assignment: %', SQLERRM;
    RETURN NEW;
END;
$func$;

-- Trigger for incident assignment
CREATE TRIGGER on_incident_assigned
AFTER INSERT OR UPDATE ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_incident_assignment();

-- Function to notify on status change
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  assignee_email TEXT;
  recipients TEXT[];
BEGIN
  -- Only notify if status changed
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    
    -- Build recipients list
    recipients := ARRAY[]::TEXT[];
    
    -- Add reporter
    IF NEW.reporter_email IS NOT NULL THEN
      recipients := array_append(recipients, NEW.reporter_email);
    END IF;
    
    -- Add assignee
    IF NEW.assigned_to_id IS NOT NULL THEN
      SELECT email INTO assignee_email
      FROM public.profiles
      WHERE user_id = NEW.assigned_to_id;
      
      IF assignee_email IS NULL THEN
        assignee_email := NEW.assigned_to_email;
      END IF;
      
      IF assignee_email IS NOT NULL AND NOT (assignee_email = ANY(recipients)) THEN
        recipients := array_append(recipients, assignee_email);
      END IF;
    END IF;
    
    -- Send notifications to all recipients
    FOR i IN 1..array_length(recipients, 1) LOOP
      INSERT INTO public.notifications (
        user_id,
        user_email,
        type,
        title,
        message,
        entity_type,
        entity_id,
        read
      ) VALUES (
        CASE 
          WHEN recipients[i] = NEW.reporter_email THEN NEW.reporter_id
          WHEN recipients[i] = assignee_email THEN NEW.assigned_to_id
          ELSE NULL
        END,
        recipients[i],
        'status_changed',
        'Incident ' || NEW.id || ' Status Updated',
        'Status changed from "' || OLD.status || '" to "' || NEW.status || '" for incident "' || NEW.title || '"',
        'incident',
        NEW.id,
        false
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in notify_on_status_change: %', SQLERRM;
    RETURN NEW;
END;
$func$;

-- Trigger for status change
CREATE TRIGGER on_incident_status_changed
AFTER UPDATE ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_status_change();

-- ============================================
-- PART 19: ENABLE REALTIME SUBSCRIPTIONS
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.evidence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;

-- ============================================
-- PART 20: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_user_email ON public.audit_logs(user_email);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Email notifications indexes
CREATE INDEX idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX idx_email_notifications_created_at ON public.email_notifications(created_at DESC);
CREATE INDEX idx_email_notifications_recipient ON public.email_notifications(recipient_email);

-- In-app notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_email ON public.notifications(user_email);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_entity_id ON public.notifications(entity_id);

-- Incidents indexes
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incidents_priority ON public.incidents(priority);
CREATE INDEX idx_incidents_type ON public.incidents(type);
CREATE INDEX idx_incidents_reporter_id ON public.incidents(reporter_id);
CREATE INDEX idx_incidents_assigned_to_id ON public.incidents(assigned_to_id);
CREATE INDEX idx_incidents_created_at ON public.incidents(created_at DESC);
CREATE INDEX idx_incidents_updated_at ON public.incidents(updated_at DESC);

-- Evidence indexes
CREATE INDEX idx_evidence_incident_id ON public.evidence(incident_id);
CREATE INDEX idx_evidence_collected_by_id ON public.evidence(collected_by_id);
CREATE INDEX idx_evidence_current_custodian_id ON public.evidence(current_custodian_id);
CREATE INDEX idx_evidence_analysis_status ON public.evidence(analysis_status);
CREATE INDEX idx_evidence_integrity_status ON public.evidence(integrity_status);
CREATE INDEX idx_evidence_collected_at ON public.evidence(collected_at DESC);

-- Comments indexes
CREATE INDEX idx_comments_incident_id ON public.comments(incident_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX idx_comments_deleted_at ON public.comments(deleted_at);

-- ============================================
-- PART 21: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get incident statistics
CREATE OR REPLACE FUNCTION public.get_incident_stats()
RETURNS TABLE (
  total_incidents BIGINT,
  open_incidents BIGINT,
  critical_incidents BIGINT,
  high_priority_incidents BIGINT,
  incidents_this_month BIGINT,
  avg_resolution_time INTERVAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::BIGINT as total_incidents,
    COUNT(*) FILTER (WHERE status NOT IN ('closed', 'resolved'))::BIGINT as open_incidents,
    COUNT(*) FILTER (WHERE priority = 'critical')::BIGINT as critical_incidents,
    COUNT(*) FILTER (WHERE priority = 'high')::BIGINT as high_priority_incidents,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE))::BIGINT as incidents_this_month,
    AVG(closed_at - created_at) FILTER (WHERE closed_at IS NOT NULL) as avg_resolution_time
  FROM public.incidents;
$$;

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION public.get_user_activity(p_user_id UUID)
RETURNS TABLE (
  incidents_reported BIGINT,
  incidents_assigned BIGINT,
  evidence_collected BIGINT,
  comments_made BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.incidents WHERE reporter_id = p_user_id)::BIGINT,
    (SELECT COUNT(*) FROM public.incidents WHERE assigned_to_id = p_user_id)::BIGINT,
    (SELECT COUNT(*) FROM public.evidence WHERE collected_by_id = p_user_id)::BIGINT,
    (SELECT COUNT(*) FROM public.comments WHERE user_id = p_user_id)::BIGINT;
$$;

-- Function to search incidents
CREATE OR REPLACE FUNCTION public.search_incidents(search_query TEXT)
RETURNS SETOF public.incidents
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.incidents
  WHERE 
    title ILIKE '%' || search_query || '%' OR
    description ILIKE '%' || search_query || '%' OR
    id ILIKE '%' || search_query || '%'
  ORDER BY created_at DESC;
$$;

-- ============================================
-- PART 22: CREATE SAMPLE DATA (OPTIONAL)
-- ============================================

-- Uncomment below to insert sample data for testing

/*
-- Sample incident
INSERT INTO public.incidents (
  id, title, description, type, status, priority,
  reporter_name, reporter_email,
  created_at, updated_at
) VALUES (
  'INC-2024-001',
  'Sample Website Defacement',
  'Homepage was defaced with unauthorized content',
  'Website Defacement',
  'new',
  'high',
  'System Admin',
  'admin@example.com',
  now(),
  now()
);
*/

-- ============================================
-- PART 23: GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select on all tables to authenticated users (RLS will control access)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant insert/update/delete on tables (RLS will control access)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- ============================================
-- PART 24: DATABASE METADATA
-- ============================================

-- Add comments to database objects for documentation
COMMENT ON SCHEMA public IS 'DFIR Manager - Digital Forensics and Incident Response Management System';

COMMENT ON TYPE public.app_role IS 'User roles: admin (full access), manager (manage teams), investigator (investigate), first_responder (collect evidence), reporter (report only)';
COMMENT ON TYPE public.incident_status IS 'Incident lifecycle: new -> triage -> investigation -> contained -> resolved -> closed';
COMMENT ON TYPE public.incident_priority IS 'Priority levels based on business impact';
COMMENT ON TYPE public.notification_type IS 'Types of notifications sent to users';

COMMENT ON FUNCTION public.has_role(UUID, app_role) IS 'Check if user has specific role';
COMMENT ON FUNCTION public.get_user_role(UUID) IS 'Get user role';
COMMENT ON FUNCTION public.get_incident_stats() IS 'Get aggregate incident statistics';
COMMENT ON FUNCTION public.get_user_activity(UUID) IS 'Get activity summary for a user';
COMMENT ON FUNCTION public.search_incidents(TEXT) IS 'Full-text search across incidents';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these queries to verify migration success

-- Check all tables created
SELECT 
  schemaname, 
  tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check all enums created
SELECT 
  n.nspname AS schema,
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- Check all functions created
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Check all indexes created
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================
-- END OF MIGRATION
-- Database Version: 2.0
-- Ready for Production
-- =============================================