import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Crop, Square, Circle, Scissors, Move } from 'lucide-react';

interface SmartCropProps {
  element: {
    properties: {
      imageUrl?: string;
      cropX?: number;
      cropY?: number;
      cropWidth?: number;
      cropHeight?: number;
    };
  };
  onUpdate: (updates: any) => void;
}

export function SmartCrop({ element, onUpdate }: SmartCropProps) {
  const [cropMode, setCropMode] = React.useState<'free' | 'square' | 'circle' | '16:9' | '4:3'>('free');
  const [_isDragging, _setIsDragging] = React.useState(false);

  const cropPresets = [
    { ratio: null, name: 'Свободно', icon: Crop },
    { ratio: 1, name: 'Квадрат', icon: Square },
    { ratio: 16/9, name: '16:9', icon: Square },
    { ratio: 4/3, name: '4:3', icon: Square },
    { ratio: 3/2, name: '3:2', icon: Square },
  ];

  const applyCrop = (cropType: string) => {
    const updates = { properties: { ...element.properties } };
    
    switch (cropType) {
      case 'center':
        updates.properties.cropX = 25;
        updates.properties.cropY = 25;
        updates.properties.cropWidth = 50;
        updates.properties.cropHeight = 50;
        break;
      case 'face':
        // Simulate smart face detection crop
        updates.properties.cropX = 20;
        updates.properties.cropY = 10;
        updates.properties.cropWidth = 60;
        updates.properties.cropHeight = 70;
        break;
      case 'object':
        // Simulate smart object detection crop
        updates.properties.cropX = 15;
        updates.properties.cropY = 15;
        updates.properties.cropWidth = 70;
        updates.properties.cropHeight = 70;
        break;
      case 'reset':
        updates.properties.cropX = 0;
        updates.properties.cropY = 0;
        updates.properties.cropWidth = 100;
        updates.properties.cropHeight = 100;
        break;
    }
    
    onUpdate(updates);
  };

  const getCropStyle = () => {
    const { cropX = 0, cropY = 0, cropWidth = 100, cropHeight = 100 } = element.properties;
    return {
      clipPath: `inset(${cropY}% ${100 - cropX - cropWidth}% ${100 - cropY - cropHeight}% ${cropX}%)`
    };
  };

  if (!element.properties.imageUrl) {
    return (
      <div className="space-y-3">
        <Label className="text-xs font-medium">Умная обрезка</Label>
        <div className="text-xs text-gray-500 text-center py-4">
          Сначала добавьте изображение
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium">Умная обрезка</Label>
      
      {/* Crop mode selector */}
      <div>
        <Label className="text-xs mb-2 block">Пропорции</Label>
        <div className="grid grid-cols-3 gap-1">
          {cropPresets.map((preset, index) => (
            <Button
              key={index}
              variant={cropMode === (preset.ratio ? `${preset.ratio}` : 'free') ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCropMode(preset.ratio ? `${preset.ratio}` as any : 'free')}
              className="text-xs p-2 h-auto flex flex-col items-center space-y-1"
            >
              <preset.icon className="h-3 w-3" />
              <span>{preset.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Smart crop suggestions */}
      <div>
        <Label className="text-xs mb-2 block">Умные предложения</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyCrop('center')}
            className="text-xs flex items-center space-x-1"
          >
            <Move className="h-3 w-3" />
            <span>По центру</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyCrop('face')}
            className="text-xs flex items-center space-x-1"
          >
            <Circle className="h-3 w-3" />
            <span>Лицо</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyCrop('object')}
            className="text-xs flex items-center space-x-1"
          >
            <Square className="h-3 w-3" />
            <span>Объект</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyCrop('reset')}
            className="text-xs flex items-center space-x-1"
          >
            <Scissors className="h-3 w-3" />
            <span>Сброс</span>
          </Button>
        </div>
      </div>

      {/* Preview */}
      {element.properties.imageUrl && (
        <div>
          <Label className="text-xs mb-2 block">Предварительный просмотр</Label>
          <div className="relative w-full h-24 bg-gray-100 rounded border overflow-hidden">
            <img
              src={element.properties.imageUrl}
              alt="Crop preview"
              className="w-full h-full object-cover"
              style={getCropStyle()}
            />
            {/* Crop overlay */}
            <div className="absolute inset-0 border-2 border-dashed border-blue-500 opacity-50"></div>
          </div>
        </div>
      )}

      {/* Manual crop controls */}
      <div>
        <Label className="text-xs mb-2 block">Ручная настройка (%)</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">X позиция</Label>
            <input
              type="range"
              min="0"
              max="50"
              value={element.properties.cropX || 0}
              onChange={(e) => {
                onUpdate({
                  properties: {
                    ...element.properties,
                    cropX: Number(e.target.value)
                  }
                });
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <Label className="text-xs">Y позиция</Label>
            <input
              type="range"
              min="0"
              max="50"
              value={element.properties.cropY || 0}
              onChange={(e) => {
                onUpdate({
                  properties: {
                    ...element.properties,
                    cropY: Number(e.target.value)
                  }
                });
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <Label className="text-xs">Ширина</Label>
            <input
              type="range"
              min="10"
              max="100"
              value={element.properties.cropWidth || 100}
              onChange={(e) => {
                onUpdate({
                  properties: {
                    ...element.properties,
                    cropWidth: Number(e.target.value)
                  }
                });
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <Label className="text-xs">Высота</Label>
            <input
              type="range"
              min="10"
              max="100"
              value={element.properties.cropHeight || 100}
              onChange={(e) => {
                onUpdate({
                  properties: {
                    ...element.properties,
                    cropHeight: Number(e.target.value)
                  }
                });
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 