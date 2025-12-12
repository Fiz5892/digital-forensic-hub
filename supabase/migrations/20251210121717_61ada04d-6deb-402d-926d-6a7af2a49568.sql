-- =============================================
-- DFIR-MANAGER COMPLETE DATABASE MIGRATION
-- FOR CLEAN SUPABASE PROJECT (FIXED ORDER)
-- =============================================

-- ============================================
-- PART 1: ENUMS
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

-- ============================================
-- PART 2: USER MANAGEMENT TABLES (MOVED UP)
-- ============================================

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'reporter',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PART 3: CORE FUNCTIONS (MOVED AFTER TABLES)
-- ============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to check user role (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- ============================================
-- PART 4: AUDIT & NOTIFICATION TABLES
-- ============================================

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

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
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PART 5: INCIDENT MANAGEMENT TABLES
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  impact_assessment JSONB DEFAULT '{"confidentiality": 1, "integrity": 1, "availability": 1, "business_impact": ""}'::jsonb,
  technical_details JSONB DEFAULT '{}'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  evidence_ids TEXT[] DEFAULT '{}',
  notes JSONB DEFAULT '[]'::jsonb,
  regulatory_requirements TEXT[] DEFAULT '{}'
);

-- Evidence table
CREATE TABLE public.evidence (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  hash_md5 TEXT,
  hash_sha256 TEXT,
  collected_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  collected_by_name TEXT,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_custodian_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  current_custodian_name TEXT,
  storage_location TEXT,
  analysis_status analysis_status NOT NULL DEFAULT 'pending',
  integrity_status integrity_status NOT NULL DEFAULT 'unknown',
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  analysis_results JSONB,
  chain_of_custody JSONB DEFAULT '[]'::jsonb
);

-- ============================================
-- PART 6: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 7: RLS POLICIES - PROFILES
-- ============================================

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage profiles"
ON public.profiles FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- PART 8: RLS POLICIES - USER ROLES
-- ============================================

CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- PART 9: RLS POLICIES - AUDIT LOGS
-- ============================================

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- PART 10: RLS POLICIES - EMAIL NOTIFICATIONS
-- ============================================

CREATE POLICY "Admins can view notifications"
ON public.email_notifications FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "System can insert notifications"
ON public.email_notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- PART 11: RLS POLICIES - INCIDENTS
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
  reporter_id = auth.uid()
);

CREATE POLICY "Admins can delete incidents"
ON public.incidents FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- PART 12: RLS POLICIES - EVIDENCE
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
  has_role(auth.uid(), 'investigator')
);

CREATE POLICY "Admins can delete evidence"
ON public.evidence FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- PART 13: TRIGGERS
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

-- ============================================
-- PART 14: AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  
  -- Assign default role (reporter)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'reporter');
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PART 15: REALTIME SUBSCRIPTIONS
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.evidence;

-- ============================================
-- PART 16: INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incidents_priority ON public.incidents(priority);
CREATE INDEX idx_incidents_reporter_id ON public.incidents(reporter_id);
CREATE INDEX idx_incidents_created_at ON public.incidents(created_at DESC);
CREATE INDEX idx_evidence_incident_id ON public.evidence(incident_id);
CREATE INDEX idx_evidence_collected_by ON public.evidence(collected_by_id);