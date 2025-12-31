-- Assign dev role to aronpeterszabo@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('09a39866-ca19-4472-9874-e31c2203c476', 'dev')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create a function to check if user has dev role (bypasses age verification)
CREATE OR REPLACE FUNCTION public.is_dev_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'dev'
  )
$$;