-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view subscribers from their church" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can manage subscribers from their church" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Users can manage their own subscription" ON public.newsletter_subscribers;

-- Create restrictive SELECT policy - users can ONLY view their own subscription
CREATE POLICY "Users can view their own subscription" ON public.newsletter_subscribers
FOR SELECT USING (
  auth.uid() = user_id
);

-- Super admins can view all for debugging/support purposes
CREATE POLICY "Super admins can view all subscribers" ON public.newsletter_subscribers
FOR SELECT USING (
  is_super_admin(auth.uid())
);

-- Users can update their own subscription (unsubscribe, etc)
CREATE POLICY "Users can update their own subscription" ON public.newsletter_subscribers
FOR UPDATE USING (
  auth.uid() = user_id
);

-- Admins can insert new subscribers (for adding members)
CREATE POLICY "Admins can insert subscribers" ON public.newsletter_subscribers
FOR INSERT WITH CHECK (
  user_belongs_to_church(auth.uid(), church_id) AND is_admin_of_own_church(auth.uid())
);

-- Admins can delete subscribers from their church
CREATE POLICY "Admins can delete subscribers" ON public.newsletter_subscribers
FOR DELETE USING (
  user_belongs_to_church(auth.uid(), church_id) AND is_admin_of_own_church(auth.uid())
);

-- Create a secure function to get subscriber count (not individual emails)
CREATE OR REPLACE FUNCTION public.get_newsletter_subscriber_count(_church_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.newsletter_subscribers
  WHERE church_id = _church_id AND is_subscribed = true
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_newsletter_subscriber_count(uuid) TO authenticated;

-- Add comment explaining the security model
COMMENT ON POLICY "Users can view their own subscription" ON public.newsletter_subscribers IS 
'Users can only view their own newsletter subscription status. Prevents email harvesting.';

COMMENT ON POLICY "Super admins can view all subscribers" ON public.newsletter_subscribers IS 
'Only super admins can view all subscribers for debugging/support. Regular church admins cannot bulk view emails.';

COMMENT ON FUNCTION public.get_newsletter_subscriber_count(_church_id uuid) IS 
'Returns subscriber count without exposing individual email addresses. Used for admin dashboard stats.';