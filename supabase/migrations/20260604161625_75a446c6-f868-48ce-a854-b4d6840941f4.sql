-- Profiles table for account approval workflow
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by uuid,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Sysadmin helper (eros is the single sysadmin)
CREATE OR REPLACE FUNCTION public.is_sysadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id AND lower(email) = 'eros@guaramedia.com.br'
  )
$$;

-- RLS: users read/insert their own profile; sysadmin manages all
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sysadmin reads all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_sysadmin(auth.uid()));

CREATE POLICY "Sysadmin updates profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_sysadmin(auth.uid()))
  WITH CHECK (public.is_sysadmin(auth.uid()));

CREATE POLICY "Sysadmin deletes profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_sysadmin(auth.uid()));

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Backfill existing users
INSERT INTO public.profiles (user_id, email, status, approved_at)
SELECT
  u.id,
  u.email,
  CASE
    WHEN lower(u.email) = 'eros@guaramedia.com.br' THEN 'approved'
    WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin') THEN 'approved'
    ELSE 'pending'
  END,
  CASE
    WHEN lower(u.email) = 'eros@guaramedia.com.br'
      OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin')
    THEN now()
    ELSE NULL
  END
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

-- Ensure eros has admin role if the account already exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE lower(email) = 'eros@guaramedia.com.br'
ON CONFLICT DO NOTHING;