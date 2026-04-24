
-- ============================================================
-- LATEN: LEGAL & SAFETY COMPLIANCE BACKBONE (additive only)
-- Sections 1-12. Never drops or alters existing policies.
-- ============================================================

-- ---------- SECTION 1: CONTENT REPORTING (extend existing) ----------
-- content_reports already exists. Just add missing optional fields.
ALTER TABLE public.content_reports
  ADD COLUMN IF NOT EXISTS resolution_notes text,
  ADD COLUMN IF NOT EXISTS auto_flagged boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_user ON public.content_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON public.content_reports(content_type, content_id);

-- ---------- SECTION 2: USER BLOCKING ----------
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own blocks" ON public.user_blocks;
CREATE POLICY "Users can view their own blocks" ON public.user_blocks
  FOR SELECT USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can create their own blocks" ON public.user_blocks;
CREATE POLICY "Users can create their own blocks" ON public.user_blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can delete their own blocks" ON public.user_blocks;
CREATE POLICY "Users can delete their own blocks" ON public.user_blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- Helper function: is there a block in either direction between two users?
CREATE OR REPLACE FUNCTION public.is_blocked_either_way(_user_a uuid, _user_b uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _user_a AND blocked_id = _user_b)
       OR (blocker_id = _user_b AND blocked_id = _user_a)
  );
$$;

-- ---------- SECTION 4 + 5: DATA RETENTION & DMCA ----------
CREATE TABLE IF NOT EXISTS public.dmca_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claimant_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimant_name text NOT NULL,
  claimant_email text NOT NULL,
  claimant_address text,
  copyrighted_work_description text NOT NULL,
  infringing_content_url text NOT NULL,
  infringing_content_id uuid,
  infringing_content_type text,
  good_faith_statement boolean NOT NULL DEFAULT false,
  accuracy_statement boolean NOT NULL DEFAULT false,
  electronic_signature text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dmca_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can submit DMCA claims" ON public.dmca_claims;
CREATE POLICY "Anyone authenticated can submit DMCA claims" ON public.dmca_claims
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = claimant_user_id OR claimant_user_id IS NULL);

DROP POLICY IF EXISTS "Users see their own DMCA claims" ON public.dmca_claims;
CREATE POLICY "Users see their own DMCA claims" ON public.dmca_claims
  FOR SELECT USING (auth.uid() = claimant_user_id OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage DMCA claims" ON public.dmca_claims;
CREATE POLICY "Admins manage DMCA claims" ON public.dmca_claims
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- ---------- SECTION 6: MINOR PROTECTIONS / PARENTAL CONSENT ----------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS minor_consent_acknowledged boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS minor_consent_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS parent_email text,
  ADD COLUMN IF NOT EXISTS parent_verified boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.parental_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_email text NOT NULL,
  consent_method text NOT NULL DEFAULT 'self_attested',
  attested_at timestamptz NOT NULL DEFAULT now(),
  parent_verified_at timestamptz,
  ip_address inet,
  user_agent text,
  UNIQUE(user_id)
);

ALTER TABLE public.parental_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own parental consent" ON public.parental_consents;
CREATE POLICY "Users view own parental consent" ON public.parental_consents
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users insert own parental consent" ON public.parental_consents;
CREATE POLICY "Users insert own parental consent" ON public.parental_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---------- SECTION 7: TERMS ACCEPTANCE TRACKING ----------
CREATE TABLE IF NOT EXISTS public.terms_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_type text NOT NULL,
  version text NOT NULL,
  content_url text,
  effective_at timestamptz NOT NULL DEFAULT now(),
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(consent_type, version)
);

ALTER TABLE public.terms_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read terms versions" ON public.terms_versions;
CREATE POLICY "Anyone can read terms versions" ON public.terms_versions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage terms versions" ON public.terms_versions;
CREATE POLICY "Admins manage terms versions" ON public.terms_versions
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  UNIQUE(user_id, consent_type, version)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON public.user_consents(user_id, consent_type);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own consents" ON public.user_consents;
CREATE POLICY "Users view own consents" ON public.user_consents
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users record own consents" ON public.user_consents;
CREATE POLICY "Users record own consents" ON public.user_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed current versions (idempotent)
INSERT INTO public.terms_versions (consent_type, version, content_url, is_current)
VALUES
  ('terms', '1.0', 'https://latenapp.com/terms', true),
  ('privacy', '1.0', 'https://latenapp.com/privacy', true),
  ('community_guidelines', '1.0', 'https://latenapp.com/guidelines', true)
ON CONFLICT (consent_type, version) DO NOTHING;

-- Helper: does the current user need to re-accept any consent?
CREATE OR REPLACE FUNCTION public.needs_consent_reacceptance()
RETURNS TABLE(consent_type text, current_version text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT tv.consent_type, tv.version
  FROM public.terms_versions tv
  WHERE tv.is_current = true
    AND auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.user_consents uc
      WHERE uc.user_id = auth.uid()
        AND uc.consent_type = tv.consent_type
        AND uc.version = tv.version
    );
$$;

-- ---------- SECTION 8: COMMUNITY GUIDELINES — VIOLATION TRACKING ----------
CREATE TABLE IF NOT EXISTS public.user_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  violation_type text NOT NULL,
  severity text NOT NULL DEFAULT 'minor',
  related_report_id uuid REFERENCES public.content_reports(id) ON DELETE SET NULL,
  action_taken text NOT NULL DEFAULT 'warning',
  notes text,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_violations_user ON public.user_violations(user_id);

ALTER TABLE public.user_violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own violations" ON public.user_violations;
CREATE POLICY "Users view own violations" ON public.user_violations
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage violations" ON public.user_violations;
CREATE POLICY "Admins manage violations" ON public.user_violations
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.moderation_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  violation_id uuid REFERENCES public.user_violations(id) ON DELETE SET NULL,
  appeal_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.moderation_appeals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own appeals" ON public.moderation_appeals;
CREATE POLICY "Users view own appeals" ON public.moderation_appeals
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users submit own appeals" ON public.moderation_appeals;
CREATE POLICY "Users submit own appeals" ON public.moderation_appeals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins update appeals" ON public.moderation_appeals;
CREATE POLICY "Admins update appeals" ON public.moderation_appeals
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- ---------- SECTION 9: SAFETY DISCLAIMER DISMISSALS ----------
CREATE TABLE IF NOT EXISTS public.safety_disclaimer_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disclaimer_type text NOT NULL,
  view_count integer NOT NULL DEFAULT 1,
  dismissed boolean NOT NULL DEFAULT false,
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, disclaimer_type)
);

ALTER TABLE public.safety_disclaimer_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own disclaimer views" ON public.safety_disclaimer_views;
CREATE POLICY "Users manage own disclaimer views" ON public.safety_disclaimer_views
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- SECTION 10: DATA EXPORT REQUESTS (GDPR) ----------
CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  download_url text,
  expires_at timestamptz,
  error_message text
);

CREATE INDEX IF NOT EXISTS idx_data_export_user ON public.data_export_requests(user_id, status);

ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own export requests" ON public.data_export_requests;
CREATE POLICY "Users view own export requests" ON public.data_export_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own export requests" ON public.data_export_requests;
CREATE POLICY "Users create own export requests" ON public.data_export_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---------- SECTIONS 11 + 12: ANALYTICS & PUSH CONSENT ----------
CREATE TABLE IF NOT EXISTS public.user_privacy_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  analytics_enabled boolean NOT NULL DEFAULT true,
  analytics_decided_at timestamptz,
  push_notifications_enabled boolean,
  push_decided_at timestamptz,
  marketing_emails_enabled boolean NOT NULL DEFAULT false,
  marketing_decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_privacy_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own privacy prefs" ON public.user_privacy_preferences;
CREATE POLICY "Users manage own privacy prefs" ON public.user_privacy_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reuse existing public.update_updated_at_column trigger function if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = 'public'::regnamespace) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_privacy_preferences_updated_at') THEN
      EXECUTE 'CREATE TRIGGER update_user_privacy_preferences_updated_at
        BEFORE UPDATE ON public.user_privacy_preferences
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
    END IF;
  END IF;
END $$;
