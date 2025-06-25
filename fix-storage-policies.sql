-- Fix storage policies for media bucket
-- Drop existing policies
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;

-- Create or update media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  allowed_mime_types = ARRAY[
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm', 
    'video/ogg',
    'video/mov',
    'video/avi',
    'video/mkv',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/m4a',
    'audio/flac'
  ],
  file_size_limit = 52428800; -- 50MB

-- Create simple RLS policies
CREATE POLICY "Anyone can view media files" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update media files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete media files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 
