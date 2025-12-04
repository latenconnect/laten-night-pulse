-- Grant admin role to aronpeterszabo@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('09a39866-ca19-4472-9874-e31c2203c476', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;