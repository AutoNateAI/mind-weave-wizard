-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images', 'generated-images', true);

-- Create RLS policies for the generated images bucket
CREATE POLICY "Generated images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'generated-images');

CREATE POLICY "Admin can upload generated images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'generated-images' AND (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text));

CREATE POLICY "Admin can update generated images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'generated-images' AND (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text));

CREATE POLICY "Admin can delete generated images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'generated-images' AND (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text));