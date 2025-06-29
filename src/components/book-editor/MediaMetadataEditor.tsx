import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CanvasElement } from './types';
import { X } from 'lucide-react';

interface MediaMetadataEditorProps {
  isOpen: boolean;
  onClose: () => void;
  element: CanvasElement | null;
  onUpdate: (updates: Partial<CanvasElement>) => void;
}

export function MediaMetadataEditor({
  isOpen,
  onClose,
  element,
  onUpdate,
}: MediaMetadataEditorProps) {
  const [metadata, setMetadata] = useState({
    caption: '',
    altText: '',
    sourceInfo: '',
    sourceUrl: '',
    author: '',
    license: '',
  });

  useEffect(() => {
    if (element && element.type === 'image') {
      setMetadata({
        caption: element.properties.caption || '',
        altText: element.properties.altText || '',
        sourceInfo: element.properties.sourceInfo || '',
        sourceUrl: element.properties.sourceUrl || '',
        author: element.properties.author || '',
        license: element.properties.license || '',
      });
    }
  }, [element]);

  const handleSave = () => {
    if (!element) return;

    onUpdate({
      properties: {
        ...element.properties,
        ...metadata,
      },
    });
    onClose();
  };

  const handleReset = () => {
    setMetadata({
      caption: '',
      altText: '',
      sourceInfo: '',
      sourceUrl: '',
      author: '',
      license: '',
    });
  };

  if (!element || element.type !== 'image') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Метаданные изображения
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Preview */}
          <div className="flex justify-center">
            {element.properties.imageUrl && (
              <img
                src={element.properties.imageUrl}
                alt="Preview"
                className="max-w-full max-h-32 object-contain rounded border"
              />
            )}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Подпись к изображению</Label>
            <Textarea
              id="caption"
              placeholder="Краткое описание изображения..."
              value={metadata.caption}
              onChange={(e) => setMetadata(prev => ({ ...prev, caption: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Alt Text */}
          <div className="space-y-2">
            <Label htmlFor="altText">Альтернативный текст</Label>
            <Input
              id="altText"
              placeholder="Текст для скринридеров и доступности..."
              value={metadata.altText}
              onChange={(e) => setMetadata(prev => ({ ...prev, altText: e.target.value }))}
            />
            <p className="text-xs text-gray-500">
              Используется для людей с нарушениями зрения и поисковых систем
            </p>
          </div>

          {/* Source Information */}
          <div className="space-y-2">
            <Label htmlFor="sourceInfo">Информация об источнике</Label>
            <Input
              id="sourceInfo"
              placeholder="Название источника, описание..."
              value={metadata.sourceInfo}
              onChange={(e) => setMetadata(prev => ({ ...prev, sourceInfo: e.target.value }))}
            />
          </div>

          {/* Source URL */}
          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Ссылка на источник</Label>
            <Input
              id="sourceUrl"
              type="url"
              placeholder="https://example.com/image-source"
              value={metadata.sourceUrl}
              onChange={(e) => setMetadata(prev => ({ ...prev, sourceUrl: e.target.value }))}
            />
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label htmlFor="author">Автор</Label>
            <Input
              id="author"
              placeholder="Имя автора или фотографа..."
              value={metadata.author}
              onChange={(e) => setMetadata(prev => ({ ...prev, author: e.target.value }))}
            />
          </div>

          {/* License */}
          <div className="space-y-2">
            <Label htmlFor="license">Лицензия</Label>
            <Input
              id="license"
              placeholder="CC BY 4.0, Rights Reserved и т.д."
              value={metadata.license}
              onChange={(e) => setMetadata(prev => ({ ...prev, license: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Очистить
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
