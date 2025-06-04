-- Create media storage bucket for images and videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true);

-- Set up RLS policies for the media bucket
CREATE POLICY "Public can view media" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own media" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update bucket to allow specific file types
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/gif', 
  'image/webp',
  'video/mp4',
  'video/webm', 
  'video/ogg',
  'video/mov',
  'video/avi'
],
file_size_limit = 104857600 -- 100MB
WHERE id = 'media'; 