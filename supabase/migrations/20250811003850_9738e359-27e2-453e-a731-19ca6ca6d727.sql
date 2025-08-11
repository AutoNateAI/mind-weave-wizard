-- Fix the RLS policy for courses table to properly check admin access
-- Drop the existing policy and create a new one that uses auth.jwt()

DROP POLICY IF EXISTS "Admin can manage courses" ON public.courses;

-- Create new policy that checks user email from JWT token
CREATE POLICY "Admin can manage courses" 
ON public.courses 
FOR ALL 
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'email')::text, '') = 'admin@gmail.com'
);

-- Also fix the admin_chat_sessions policy
DROP POLICY IF EXISTS "Admin can manage chat sessions" ON public.admin_chat_sessions;

CREATE POLICY "Admin can manage chat sessions" 
ON public.admin_chat_sessions 
FOR ALL 
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'email')::text, '') = 'admin@gmail.com'
);

-- Fix sessions_dynamic policy
DROP POLICY IF EXISTS "Admin can manage sessions" ON public.sessions_dynamic;

CREATE POLICY "Admin can manage sessions" 
ON public.sessions_dynamic 
FOR ALL 
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'email')::text, '') = 'admin@gmail.com'
);

-- Fix lectures_dynamic policy
DROP POLICY IF EXISTS "Admin can manage lectures" ON public.lectures_dynamic;

CREATE POLICY "Admin can manage lectures" 
ON public.lectures_dynamic 
FOR ALL 
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'email')::text, '') = 'admin@gmail.com'
);

-- Fix lecture_slides policy
DROP POLICY IF EXISTS "Admin can manage slides" ON public.lecture_slides;

CREATE POLICY "Admin can manage slides" 
ON public.lecture_slides 
FOR ALL 
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'email')::text, '') = 'admin@gmail.com'
);

-- Fix generation_workflows policy
DROP POLICY IF EXISTS "Admin can manage workflows" ON public.generation_workflows;

CREATE POLICY "Admin can manage workflows" 
ON public.generation_workflows 
FOR ALL 
TO authenticated
USING (
  COALESCE((auth.jwt() ->> 'email')::text, '') = 'admin@gmail.com'
);