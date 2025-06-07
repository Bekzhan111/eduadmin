import { createClient } from './supabase';

export type MediaType = 'image' | 'video' | 'audio';
export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
};

// Supported file types
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi', 'video/mkv'];
const SUPPORTED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/flac'];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

export const validateFile = (file: File, type: MediaType): { valid: boolean; error?: string } => {
  console.log(`Validating ${type} file:`, {
    name: file.name,
    type: file.type,
    size: file.size
  });

  // Check file type
  let supportedTypes: string[];
  switch (type) {
    case 'image':
      supportedTypes = SUPPORTED_IMAGE_TYPES;
      break;
    case 'video':
      supportedTypes = SUPPORTED_VIDEO_TYPES;
      break;
    case 'audio':
      supportedTypes = SUPPORTED_AUDIO_TYPES;
      break;
    default:
      return { valid: false, error: 'Неподдерживаемый тип медиа' };
  }

  if (!supportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Неподдерживаемый формат ${type}. Поддерживаемые форматы: ${supportedTypes.map(t => t.split('/')[1]).join(', ')}`
    };
  }

  // Check file size
  let maxSize: number;
  switch (type) {
    case 'image':
      maxSize = MAX_IMAGE_SIZE;
      break;
    case 'video':
      maxSize = MAX_VIDEO_SIZE;
      break;
    case 'audio':
      maxSize = MAX_AUDIO_SIZE;
      break;
    default:
      maxSize = MAX_IMAGE_SIZE;
  }

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `Размер файла слишком большой. Максимальный размер: ${maxSizeMB}MB`
    };
  }

  return { valid: true };
};

export const uploadMedia = async (file: File, type: MediaType): Promise<UploadResult> => {
  console.log(`Starting ${type} upload:`, {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });

  try {
    // Validate file
    const validation = validateFile(file, type);
    if (!validation.valid) {
      console.error('File validation failed:', validation.error);
      return {
        success: false,
        error: validation.error
      };
    }

    const supabase = createClient();
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;

    console.log('Uploading to path:', filePath);

    // Test Supabase connection first
    try {
      const { data: testData, error: testError } = await supabase.storage.listBuckets();
      console.log('Storage buckets test:', { testData, testError });
      
      if (testError) {
        console.error('Storage connection test failed:', testError);
        return {
          success: false,
          error: `Ошибка подключения к хранилищу: ${testError.message}`
        };
      }
    } catch (connectionError) {
      console.error('Storage connection error:', connectionError);
      return {
        success: false,
        error: 'Не удается подключиться к системе хранения файлов'
      };
    }

    // Create bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const mediaAccountBucket = buckets?.find(bucket => bucket.name === 'media');
    
    if (!mediaAccountBucket) {
      console.log('Media bucket not found, creating...');
      const { error: createError } = await supabase.storage.createBucket('media', {
        public: true,
        allowedMimeTypes: [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES, ...SUPPORTED_AUDIO_TYPES],
        fileSizeLimit: MAX_VIDEO_SIZE
      });

      if (createError) {
        console.error('Failed to create media bucket:', createError);
        return {
          success: false,
          error: `Ошибка создания хранилища: ${createError.message}`
        };
      }
    }

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    console.log('Upload result:', { uploadData, uploadError });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      // Handle specific errors
      if (uploadError.message.includes('already exists')) {
        // Try with different filename
        const retryFileName = `retry-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const retryFilePath = `${type}s/${retryFileName}`;
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from('media')
          .upload(retryFilePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

        if (retryError) {
          return {
            success: false,
            error: `Ошибка загрузки: ${retryError.message}`
          };
        }

        // Get public URL for retry
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(retryFilePath);

        return {
          success: true,
          url: urlData.publicUrl,
          fileName: retryFileName,
          fileSize: file.size
        };
      }
      
      return {
        success: false,
        error: `Ошибка загрузки: ${uploadError.message}`
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    console.log('Public URL data:', urlData);

    if (!urlData?.publicUrl) {
      return {
        success: false,
        error: 'Не удалось получить ссылку на загруженный файл'
      };
    }

    console.log('Upload successful:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
      fileName: fileName,
      fileSize: file.size
    };

  } catch (error) {
    console.error('Media upload error (catch):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка загрузки'
    };
  }
};

export const uploadMediaFromUrl = async (url: string, type: MediaType): Promise<UploadResult> => {
  console.log(`Starting ${type} upload from URL:`, url);

  try {
    // Validate URL
    if (!url.trim()) {
      return {
        success: false,
        error: 'URL не может быть пустым'
      };
    }

    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      return {
        success: false,
        error: 'Неверный формат URL'
      };
    }

    // Fetch the media from URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'EduAdmin Media Fetcher 1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `Не удалось загрузить файл по URL: ${response.status} ${response.statusText}`
      };
    }

    // Convert to blob
    const blob = await response.blob();
    
    console.log('Fetched blob:', {
      size: blob.size,
      type: blob.type
    });

    // Determine file extension from content type or URL
    let extension = 'bin';
    if (blob.type) {
      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/ogg': 'ogv',
        'audio/mp3': 'mp3',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg'
      };
      extension = mimeToExt[blob.type] || blob.type.split('/')[1] || 'bin';
    } else {
      // Try to get extension from URL
      const urlPath = validUrl.pathname;
      const urlExt = urlPath.split('.').pop();
      if (urlExt && urlExt.length <= 5) {
        extension = urlExt;
      }
    }
    
    // Create file object
    const fileName = `imported-${Date.now()}.${extension}`;
    const file = new File([blob], fileName, { type: blob.type });
    
    // Upload using existing upload function
    return await uploadMedia(file, type);
    
  } catch (error) {
    console.error('URL media upload error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Время ожидания загрузки истекло (30 секунд)'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка загрузки файла по URL'
    };
  }
};

export const deleteMedia = async (url: string): Promise<boolean> => {
  try {
    const supabase = createClient();
    
    // Extract file path from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    // Determine folder based on URL pattern
    let folder = 'images';
    if (url.includes('/videos/')) {
      folder = 'videos';
    } else if (url.includes('/audios/')) {
      folder = 'audios';
    }
    
    const filePath = `${folder}/${fileName}`;

    console.log('Deleting media:', filePath);

    const { error } = await supabase.storage
      .from('media')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    console.log('Media deleted successfully');
    return true;
  } catch (error) {
    console.error('Media delete error:', error);
    return false;
  }
}; 