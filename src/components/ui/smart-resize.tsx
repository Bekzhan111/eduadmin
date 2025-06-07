import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RectangleHorizontal, Lock, Unlock, Maximize2, Minimize2 } from 'lucide-react';

interface SmartResizeProps {
  element: {
    width: number;
    height: number;
    type: string;
  };
  onResize: (width: number, height: number) => void;
  onUpdate: (updates: any) => void;
}

export function SmartResize({ element, onResize, onUpdate }: SmartResizeProps) {
  const [locked, setLocked] = React.useState(false);
  const [aspectRatio, setAspectRatio] = React.useState(element.width / element.height);

  const handleResize = (newWidth: number, newHeight: number) => {
    if (locked) {
      // Maintain aspect ratio
      const currentRatio = aspectRatio;
      if (newWidth !== element.width) {
        newHeight = newWidth / currentRatio;
      } else if (newHeight !== element.height) {
        newWidth = newHeight * currentRatio;
      }
    }
    onResize(Math.round(newWidth), Math.round(newHeight));
  };

  const getSmartSizes = () => {
    const presets = [];
    
    switch (element.type) {
      case 'text':
        presets.push(
          { width: 100, height: 30, name: 'Маленький' },
          { width: 200, height: 40, name: 'Средний' },
          { width: 300, height: 50, name: 'Большой' }
        );
        break;
      case 'image':
        presets.push(
          { width: 100, height: 100, name: 'Квадрат S' },
          { width: 200, height: 200, name: 'Квадрат M' },
          { width: 300, height: 200, name: 'Прямоугольник' },
          { width: 400, height: 300, name: 'Большой' }
        );
        break;
      case 'video':
        presets.push(
          { width: 320, height: 180, name: 'HD малый' },
          { width: 640, height: 360, name: 'HD средний' },
          { width: 854, height: 480, name: 'HD большой' },
          { width: 1280, height: 720, name: 'Full HD' }
        );
        break;
      case 'audio':
        presets.push(
          { width: 200, height: 40, name: 'Компактный' },
          { width: 300, height: 60, name: 'Стандартный' },
          { width: 400, height: 80, name: 'Большой' }
        );
        break;
      default:
        presets.push(
          { width: 100, height: 100, name: 'Квадрат' },
          { width: 200, height: 100, name: 'Прямоугольник' },
          { width: 150, height: 150, name: 'Средний' }
        );
    }
    
    return presets;
  };

  const smartSizes = getSmartSizes();

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium">Умный ресайз</Label>
      
      {/* Aspect ratio controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant={locked ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setLocked(!locked);
            if (!locked) {
              setAspectRatio(element.width / element.height);
            }
          }}
          className="flex items-center space-x-1"
        >
          {locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          <span className="text-xs">
            {locked ? 'Зафиксировано' : 'Свободно'}
          </span>
        </Button>
        <div className="text-xs text-gray-500">
          {(element.width / element.height).toFixed(2)}:1
        </div>
      </div>

      {/* Size inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Ширина</Label>
          <Input
            type="number"
            value={element.width}
            onChange={(e) => {
              const newWidth = Number(e.target.value);
              handleResize(newWidth, element.height);
            }}
            className="h-8"
          />
        </div>
        <div>
          <Label className="text-xs">Высота</Label>
          <Input
            type="number"
            value={element.height}
            onChange={(e) => {
              const newHeight = Number(e.target.value);
              handleResize(element.width, newHeight);
            }}
            className="h-8"
          />
        </div>
      </div>

      {/* Smart size presets */}
      <div>
        <Label className="text-xs mb-2 block">Готовые размеры</Label>
        <div className="grid grid-cols-2 gap-1">
          {smartSizes.map((preset, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleResize(preset.width, preset.height)}
              className="text-xs p-2 h-auto flex flex-col items-center space-y-1"
            >
              <div className="font-medium">{preset.name}</div>
              <div className="text-gray-500">
                {preset.width}×{preset.height}
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Quick resize buttons */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleResize(element.width * 0.8, element.height * 0.8)}
          className="flex-1 flex items-center justify-center space-x-1"
          title="Уменьшить на 20%"
        >
          <Minimize2 className="h-3 w-3" />
          <span className="text-xs">-20%</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleResize(element.width * 1.2, element.height * 1.2)}
          className="flex-1 flex items-center justify-center space-x-1"
          title="Увеличить на 20%"
        >
          <Maximize2 className="h-3 w-3" />
          <span className="text-xs">+20%</span>
        </Button>
      </div>

      {/* Fit content for text */}
      {element.type === 'text' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Smart text sizing based on content length
            const content = (element as any).content || '';
            const charCount = content.length;
            const newWidth = Math.max(100, Math.min(400, charCount * 8));
            const newHeight = Math.max(30, Math.ceil(charCount / 25) * 25);
            handleResize(newWidth, newHeight);
          }}
          className="w-full flex items-center justify-center space-x-1"
        >
          <RectangleHorizontal className="h-3 w-3" />
          <span className="text-xs">По содержимому</span>
        </Button>
      )}
    </div>
  );
} 