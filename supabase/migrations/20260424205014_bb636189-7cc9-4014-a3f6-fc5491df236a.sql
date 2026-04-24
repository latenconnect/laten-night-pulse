
-- 1. CHECK_INS: remove public read, restrict to owner + friends + admin
DROP POLICY IF EXISTS "Anyone can view check-ins" ON public.check_ins;

CREATE POLICY "Users can view own check-ins"
ON public.check_ins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Friends can view check-ins"
ON public.check_ins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_connections uc
    WHERE uc.status = 'active'
      AND (
        (uc.follower_id = auth.uid() AND uc.following_id = check_ins.user_id)
        OR (uc.following_id = auth.uid() AND uc.follower_id = check_ins.user_id)
      )
  )
);

CREATE POLICY "Admins can view all check-ins"
ON public.check_ins
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. DJ_BOOKING_REQUESTS: drop overly broad authenticated SELECT
DROP POLICY IF EXISTS "dj_booking_requests_select" ON public.dj_booking_requests;
-- Remaining scoped policies "Users can view own booking requests" and
-- "DJs can view booking requests for their profile" already provide proper access.

-- 3. STORAGE: replace permissive update policies on photos and stories
DROP POLICY IF EXISTS "photos_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "stories_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update event photos" ON storage.objects;

CREATE POLICY "photos_storage_update_owner"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'photos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "stories_storage_update_owner"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'stories'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'stories'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
