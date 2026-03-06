
-- Security definer function to check if user is owner
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND is_owner = true
  )
$$;

-- Allow owners to delete any post
CREATE POLICY "Owners can delete any post"
ON public.community_posts
FOR DELETE
TO authenticated
USING (public.is_owner(auth.uid()));

-- Allow owners to delete any comment
CREATE POLICY "Owners can delete any comment"
ON public.comments
FOR DELETE
TO authenticated
USING (public.is_owner(auth.uid()));

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
