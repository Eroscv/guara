
-- 1) Enums
CREATE TYPE public.content_status AS ENUM ('draft', 'published');
CREATE TYPE public.job_status AS ENUM ('draft', 'open', 'closed');

-- 2) Posts: status, scheduled_at, views
ALTER TABLE public.posts
  ADD COLUMN status content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN scheduled_at timestamptz,
  ADD COLUMN views integer NOT NULL DEFAULT 0;

UPDATE public.posts SET status = 'published';

-- 3) Articles: status, scheduled_at, views
ALTER TABLE public.articles
  ADD COLUMN status content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN scheduled_at timestamptz,
  ADD COLUMN views integer NOT NULL DEFAULT 0;

UPDATE public.articles SET status = 'published';

-- 4) Jobs: status (mantém is_open por compat, sincronizado via trigger)
ALTER TABLE public.jobs
  ADD COLUMN status job_status NOT NULL DEFAULT 'draft',
  ADD COLUMN scheduled_at timestamptz;

UPDATE public.jobs SET status = CASE WHEN is_open THEN 'open'::job_status ELSE 'closed'::job_status END;

CREATE OR REPLACE FUNCTION public.sync_job_is_open()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.is_open = (NEW.status = 'open');
  RETURN NEW;
END $$;

CREATE TRIGGER sync_job_is_open_trg
BEFORE INSERT OR UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.sync_job_is_open();

-- 5) Reescrever policies públicas para filtrar conteúdo agendado/rascunho
DROP POLICY IF EXISTS "Public can read posts" ON public.posts;
DROP POLICY IF EXISTS "Public can read articles" ON public.articles;
DROP POLICY IF EXISTS "Public can read jobs" ON public.jobs;

CREATE POLICY "Public can read published posts" ON public.posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND (scheduled_at IS NULL OR scheduled_at <= now()));

CREATE POLICY "Admins can read all posts" ON public.posts
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read published articles" ON public.articles
  FOR SELECT TO anon, authenticated
  USING (status = 'published' AND (scheduled_at IS NULL OR scheduled_at <= now()));

CREATE POLICY "Admins can read all articles" ON public.articles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read open jobs" ON public.jobs
  FOR SELECT TO anon, authenticated
  USING (status = 'open' AND (scheduled_at IS NULL OR scheduled_at <= now()));

CREATE POLICY "Admins can read all jobs" ON public.jobs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 6) Função para incrementar views
CREATE OR REPLACE FUNCTION public.increment_post_views(_slug text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.posts SET views = views + 1 WHERE slug = _slug AND status = 'published';
$$;

CREATE OR REPLACE FUNCTION public.increment_article_views(_slug text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.articles SET views = views + 1 WHERE slug = _slug AND status = 'published';
$$;

GRANT EXECUTE ON FUNCTION public.increment_post_views(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_article_views(text) TO anon, authenticated;

-- 7) Tabela de candidaturas
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  linkedin text,
  message text,
  resume_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT INSERT ON public.applications TO anon;
GRANT ALL ON public.applications TO service_role;

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can apply" ON public.applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can read applications" ON public.applications
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update applications" ON public.applications
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete applications" ON public.applications
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 8) Audit log
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  entity_title text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_action text;
  v_id uuid;
  v_title text;
  v_email text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create'; v_id := NEW.id; v_title := NEW.title;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update'; v_id := NEW.id; v_title := NEW.title;
  ELSE
    v_action := 'delete'; v_id := OLD.id; v_title := OLD.title;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.admin_audit_log (user_id, user_email, action, entity, entity_id, entity_title)
  VALUES (auth.uid(), v_email, v_action, TG_TABLE_NAME, v_id, v_title);

  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER audit_posts AFTER INSERT OR UPDATE OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();
CREATE TRIGGER audit_jobs AFTER INSERT OR UPDATE OR DELETE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();
CREATE TRIGGER audit_articles AFTER INSERT OR UPDATE OR DELETE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();
