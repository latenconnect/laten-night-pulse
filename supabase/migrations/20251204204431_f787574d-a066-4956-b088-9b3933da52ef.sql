-- Allow admins to view all reports
CREATE POLICY "Admins can view all reports"
ON public.reports
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update reports (resolve/dismiss)
CREATE POLICY "Admins can update reports"
ON public.reports
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all hosts (including pending)
CREATE POLICY "Admins can view all hosts"
ON public.hosts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update hosts (approve/reject)
CREATE POLICY "Admins can update hosts"
ON public.hosts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any event (activate/deactivate, feature)
CREATE POLICY "Admins can update all events"
ON public.events
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view inactive events
CREATE POLICY "Admins can view all events"
ON public.events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage user roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));