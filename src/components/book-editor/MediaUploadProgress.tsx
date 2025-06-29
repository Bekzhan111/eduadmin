import React from 'react';
import { Progress } from '@/components/ui/progress';
import { X, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaUploadProgressProps {
  isVisible: boolean;
  progress: number;
  fileName?: string;
  error?: string;
  onCancel?: () => void;
  onDismiss?: () => void;
}

export function MediaUploadProgress({
  isVisible,
  progress,
  fileName,
  error,
  onCancel,
  onDismiss,
}: MediaUploadProgressProps) {
  if (!isVisible) return null;

  const isComplete = progress >= 100;
  const hasError = !!error;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {hasError ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <Upload className={`h-5 w-5 ${isComplete ? 'text-green-500' : 'text-blue-500'}`} />
          )}
          <h3 className="font-medium text-sm">
            {hasError ? 'Ошибка загрузки' : isComplete ? 'Загрузка завершена' : 'Загрузка медиа...'}
          </h3>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={hasError || isComplete ? onDismiss : onCancel}
          className="h-6 w-6 p-0 -mt-1 -mr-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {fileName && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 truncate">
          {fileName}
        </div>
      )}

      {hasError ? (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border">
          {error}
        </div>
      ) : (
        <>
          <Progress value={progress} className="h-2 mb-2" />
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{Math.round(progress)}%</span>
            {!isComplete && (
              <span className="text-gray-400">Загружается...</span>
            )}
            {isComplete && (
              <span className="text-green-600 font-medium">Готово!</span>
            )}
          </div>
        </>
      )}

      {isComplete && !hasError && (
        <div className="mt-2 text-xs text-green-600 dark:text-green-400">
          Медиафайл успешно добавлен в книгу
        </div>
      )}
    </div>
  );
} 
