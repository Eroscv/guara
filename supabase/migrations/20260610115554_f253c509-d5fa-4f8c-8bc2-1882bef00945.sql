
-- Backfill: grant 'sysadmin' role to the existing eros user (if exists)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'sysadmin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'eros@guaramedia.com.br'
ON CONFLICT (user_id, role) DO NOTHING;

-- Redefine is_sysadmin to use the user_roles table instead of hardcoded email
CREATE OR REPLACE FUNCTION public.is_sysadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'sysadmin'::public.app_role
  )
$function$;
