
-- 1. Replace public articles SELECT policy to exclude gated content from public read
-- Keep gated articles readable by admins (via existing admin policy). Front-end gating remains for UX, but DB no longer exposes gated rows publicly.
-- NOTE: Skipping per app design (gated is a soft email gate). Instead we add an authenticated read for gated and keep public non-gated.
DROP POLICY IF EXISTS "Public can read published articles" ON public.articles;
CREATE POLICY "Public can read published non-gated articles"
  ON public.articles FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'::content_status
    AND (scheduled_at IS NULL OR scheduled_at <= now())
    AND gated = false
  );
CREATE POLICY "Authenticated can read gated articles"
  ON public.articles FOR SELECT
  TO authenticated
  USING (
    status = 'published'::content_status
    AND (scheduled_at IS NULL OR scheduled_at <= now())
    AND gated = true
  );

-- 2. Tighten 'Anyone can apply' INSERT WITH CHECK (was true)
DROP POLICY IF EXISTS "Anyone can apply" ON public.applications;
CREATE POLICY "Anyone can apply"
  ON public.applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    job_id IS NOT NULL
    AND name IS NOT NULL AND length(btrim(name)) BETWEEN 2 AND 120
    AND email IS NOT NULL AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 254
    AND (phone IS NULL OR length(phone) <= 40)
    AND (linkedin IS NULL OR length(linkedin) <= 300)
    AND (message IS NULL OR length(message) <= 4000)
    AND (resume_url IS NULL OR length(resume_url) <= 1000)
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id AND j.status = 'open'::job_status
    )
  );

-- 3. Tighten 'Anyone can submit leads' INSERT WITH CHECK (was true)
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;
CREATE POLICY "Anyone can submit leads"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    nome IS NOT NULL AND length(btrim(nome)) BETWEEN 2 AND 120
    AND email IS NOT NULL AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 254
    AND (telefone IS NULL OR length(telefone) <= 40)
    AND (empresa IS NULL OR length(empresa) <= 200)
    AND (segmento IS NULL OR length(segmento) <= 120)
    AND (mensagem IS NULL OR length(mensagem) <= 4000)
    AND (source IS NULL OR length(source) <= 60)
  );

-- 4. Public bucket listing: drop broad SELECT policy on blog-images. Public bucket URLs continue to work without a SELECT policy.
DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;

-- 5. Resume uploads: scope to existing open job folders
DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;
CREATE POLICY "Anyone can upload resumes to open job folder"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id::text = (storage.foldername(name))[1]
        AND j.status = 'open'::job_status
    )
  );

-- 6. Replace hardcoded sysadmin email with role-based check
-- Add 'sysadmin' value to app_role enum if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'sysadmin'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'sysadmin';
  END IF;
END$$;
