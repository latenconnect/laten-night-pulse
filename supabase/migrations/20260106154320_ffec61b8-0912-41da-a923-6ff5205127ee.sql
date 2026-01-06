-- Add admin role to Apple reviewer demo account
INSERT INTO public.user_roles (user_id, role)
VALUES ('dd27db96-8d3f-4119-b8f5-b9072c9de81d', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;