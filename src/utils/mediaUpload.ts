import { createClient } from './supabase';

export type MediaType = 'image' | 'video' | 'audio';
export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
  progress?: number;
};

export type UploadProgressCallback = (progress: number) => void;

// Supported file types
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi', 'video/mkv'];
const SUPPORTED_AUDIO_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/flac', 'audio/x-m4a'];

// File size limits (in bytes) - уменьшенные лимиты для Supabase
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

// Функция сжатия изображений
const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Вычисляем новые размеры с сохранением пропорций
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Рисуем сжатое изображение
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Конвертируем в blob
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file); // Возвращаем оригинал если сжатие не удалось
        }
      }, 'image/jpeg', quality);
    };
    
    img.onerror = () => resolve(file); // Возвращаем оригинал при ошибке
    img.src = URL.createObjectURL(file);
  });
};

export const validateFile = (file: File, type: MediaType): { valid: boolean; error?: string } => {
  console.log(`Validating ${type} file:`, {
    name: file.name,
    type: file.type,
    size: file.size,
    extension: file.name.toLowerCase().split('.').pop()
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

  // Check by MIME type first
  const isValidMimeType = supportedTypes.includes(file.type);
  
  // If MIME type check fails, check by file extension as fallback
  let isValidExtension = false;
  if (!isValidMimeType) {
    const fileName = file.name.toLowerCase();
    const supportedExtensions = {
      image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
      video: ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'],
      audio: ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac']
    };
    
    const extensions = supportedExtensions[type] || [];
    isValidExtension = extensions.some(ext => fileName.endsWith(ext));
  }
  
  if (!isValidMimeType && !isValidExtension) {
    const supportedFormats = type === 'audio' ? 'mp3, wav, ogg, aac, m4a, flac' : 
                            supportedTypes.map(t => t.split('/')[1]).join(', ');
    return {
      valid: false,
      error: `Неподдерживаемый формат ${type}. Поддерживаемые форматы: ${supportedFormats}`
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

// Enhanced upload function with progress tracking
export const uploadMedia = async (
  file: File, 
  type: MediaType, 
  onProgress?: UploadProgressCallback
): Promise<UploadResult> => {
  console.log(`Starting ${type} upload:`, {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });

  try {
    // Initialize progress
    onProgress?.(0);

    // Сжимаем изображение если оно слишком большое
    let processedFile = file;
    if (type === 'image' && file.size > MAX_IMAGE_SIZE && file.type !== 'image/svg+xml') {
      console.log('Compressing image...');
      onProgress?.(10);
      processedFile = await compressImage(file);
      console.log('Image compressed:', {
        originalSize: file.size,
        compressedSize: processedFile.size,
        reduction: ((file.size - processedFile.size) / file.size * 100).toFixed(1) + '%'
      });
      onProgress?.(25);
    } else {
      onProgress?.(25);
    }

    // Validate processed file
    const validation = validateFile(processedFile, type);
    if (!validation.valid) {
      console.error('File validation failed:', validation.error);
      return {
        success: false,
        error: validation.error
      };
    }

    onProgress?.(30);

    const supabase = createClient();
    
    // Generate unique filename 
    const fileExt = processedFile.name.split('.').pop()?.toLowerCase() || 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${type}s/${fileName}`;

    console.log('Uploading to path:', filePath);

    onProgress?.(40);

    // Use the original file type since all types are now supported in the bucket
    const contentType = processedFile.type;
    console.log('Content type for upload:', contentType);

    // Upload file to Supabase storage (bucket должен уже существовать)
    const uploadResult = await supabase.storage
      .from('media')
      .upload(filePath, processedFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType
      });

    const { data: uploadData, error: uploadError } = uploadResult;

    console.log('Upload result:', { uploadData, uploadError });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
      
      // Handle specific errors
      if (uploadError.message && uploadError.message.includes('already exists')) {
        // Try with different filename
        const retryFileName = `retry-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const retryFilePath = `${type}s/${retryFileName}`;
        
        onProgress?.(50);
        
        const { data: _retryData, error: retryError } = await supabase.storage
          .from('media')
          .upload(retryFilePath, processedFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: contentType
          });

        if (retryError) {
          return {
            success: false,
            error: `Ошибка загрузки: ${retryError.message}`
          };
        }

        onProgress?.(80);

        // Get public URL for retry
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(retryFilePath);

        onProgress?.(100);

        return {
          success: true,
          url: urlData.publicUrl,
          fileName: retryFileName,
          fileSize: processedFile.size,
          progress: 100
        };
      }

      return {
        success: false,
        error: `Ошибка загрузки: ${uploadError.message}`
      };
    }

    onProgress?.(80);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    onProgress?.(100);

    console.log('Upload successful:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
      fileName,
      fileSize: processedFile.size,
      progress: 100
    };

  } catch (error) {
    console.error('Upload error:', error);
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
