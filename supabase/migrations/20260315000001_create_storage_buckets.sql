-- Create storage buckets for product and category images
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('products', 'products', true),
  ('categories', 'categories', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read (public bucket)
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('products', 'categories'));

-- Allow authenticated admins to upload
-- Uses public.is_admin() (SECURITY DEFINER) to avoid RLS recursion on profiles
CREATE POLICY "Admin upload access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('products', 'categories')
    AND public.is_admin()
  );

-- Allow authenticated admins to update
CREATE POLICY "Admin update access" ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('products', 'categories')
    AND public.is_admin()
  );

-- Allow authenticated admins to delete
CREATE POLICY "Admin delete access" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('products', 'categories')
    AND public.is_admin()
  );
