import { createClient } from './supabase';

export type MediaType = 'image' | 'video';
export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
};

// Supported file types
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi'];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export const validateFile = (file: File, type: MediaType): { valid: boolean; error?: string } => {
  // Check file type
  const supportedTypes = type === 'image' ? SUPPORTED_IMAGE_TYPES : SUPPORTED_VIDEO_TYPES;
  if (!supportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported ${type} format. Supported formats: ${supportedTypes.join(', ')}`
    };
  }

  // Check file size
  const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size too large. Maximum size: ${maxSizeMB}MB`
    };
  }

  return { valid: true };
};

export const uploadMedia = async (file: File, type: MediaType): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = validateFile(file, type);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const supabase = createClient();
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;

    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return {
        success: false,
        error: 'Failed to get public URL for uploaded file'
      };
    }

    return {
      success: true,
      url: urlData.publicUrl
    };

  } catch (error) {
    console.error('Media upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
};

export const uploadMediaFromUrl = async (url: string, type: MediaType): Promise<UploadResult> => {
  try {
    // Fetch the media from URL
    const response = await fetch(url);
    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to fetch media from URL'
      };
    }

    // Convert to blob
    const blob = await response.blob();
    
    // Get filename from URL or generate one
    const urlParts = url.split('/');
    const originalName = urlParts[urlParts.length - 1];
    const extension = originalName.includes('.') ? originalName.split('.').pop() : (type === 'image' ? 'jpg' : 'mp4');
    
    // Create file object
    const file = new File([blob], `imported-${Date.now()}.${extension}`, { type: blob.type });
    
    // Upload using existing upload function
    return await uploadMedia(file, type);
    
  } catch (error) {
    console.error('URL media upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import media from URL'
    };
  }
};

export const deleteMedia = async (url: string): Promise<boolean> => {
  try {
    const supabase = createClient();
    
    // Extract file path from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const mediaType = url.includes('/images/') ? 'images' : 'videos';
    const filePath = `${mediaType}/${fileName}`;

    const { error } = await supabase.storage
      .from('media')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Media delete error:', error);
    return false;
  }
}; 