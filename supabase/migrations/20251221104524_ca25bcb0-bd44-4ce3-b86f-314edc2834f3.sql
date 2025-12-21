-- Create audit logs table for super admin actions
CREATE TABLE public.super_admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.super_admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view logs
CREATE POLICY "Super admins can view audit logs"
ON public.super_admin_audit_logs
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Only super admins can insert logs
CREATE POLICY "Super admins can insert audit logs"
ON public.super_admin_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_audit_logs_created_at ON public.super_admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.super_admin_audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.super_admin_audit_logs(action);