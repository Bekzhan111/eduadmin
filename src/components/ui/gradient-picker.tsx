import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type GradientData = {
  type: 'linear' | 'radial';
  colors: string[];
  direction?: number;
};

interface GradientPickerProps {
  gradient?: GradientData | null;
  onChange: (gradient: GradientData | null) => void;
}

export function GradientPicker({ gradient, onChange }: GradientPickerProps) {
  const gradientPresets = [
    { colors: ['#667eea', '#764ba2'], name: 'Фиолетовый' },
    { colors: ['#f093fb', '#f5576c'], name: 'Розовый' },
    { colors: ['#4facfe', '#00f2fe'], name: 'Голубой' },
    { colors: ['#43e97b', '#38f9d7'], name: 'Зеленый' },
    { colors: ['#fa709a', '#fee140'], name: 'Закат' },
    { colors: ['#a8edea', '#fed6e3'], name: 'Нежный' },
    { colors: ['#ff9a9e', '#fecfef'], name: 'Персиковый' },
    { colors: ['#a1c4fd', '#c2e9fb'], name: 'Небесный' }
  ];

  const updateGradient = (updates: Partial<GradientData>) => {
    if (!gradient) return;
    onChange({ ...gradient, ...updates });
  };

  const updateColor = (index: number, color: string) => {
    if (!gradient) return;
    const newColors = [...gradient.colors];
    newColors[index] = color;
    updateGradient({ colors: newColors });
  };

  return (
    <div>
      <Label className="text-xs mb-2 block">Градиент</Label>
      <div className="space-y-2">
        {/* Gradient type buttons */}
        <div className="flex space-x-2">
          <Button
            variant={gradient?.type === 'linear' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange({
              type: 'linear',
              colors: ['#3498db', '#9b59b6'],
              direction: 45
            })}
            className="flex-1"
          >
            Линейный
          </Button>
          <Button
            variant={gradient?.type === 'radial' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange({
              type: 'radial',
              colors: ['#3498db', '#9b59b6']
            })}
            className="flex-1"
          >
            Радиальный
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(null)}
            className="px-2"
            title="Убрать градиент"
          >
            Очистить
          </Button>
        </div>

        {gradient && (
          <div className="space-y-2">
            {/* Color inputs */}
            <div>
              <Label className="text-xs">Цвета градиента</Label>
              <div className="flex space-x-1">
                {gradient.colors.map((color, index) => (
                  <Input
                    key={index}
                    type="color"
                    value={color}
                    onChange={(e) => updateColor(index, e.target.value)}
                    className="h-8 w-12 p-1 border rounded"
                  />
                ))}
                {gradient.colors.length < 4 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newColors = [...gradient.colors, '#e74c3c'];
                      updateGradient({ colors: newColors });
                    }}
                    className="h-8 px-2 text-xs"
                    title="Добавить цвет"
                  >
                    +
                  </Button>
                )}
              </div>
            </div>

            {/* Direction for linear gradients */}
            {gradient.type === 'linear' && (
              <div>
                <Label className="text-xs">Направление (градусы)</Label>
                <Input
                  type="number"
                  min="0"
                  max="360"
                  value={gradient.direction || 45}
                  onChange={(e) => updateGradient({ direction: Number(e.target.value) })}
                  className="h-8"
                />
              </div>
            )}

            {/* Preset gradients */}
            <div>
              <Label className="text-xs mb-2 block">Готовые градиенты</Label>
              <div className="grid grid-cols-4 gap-1">
                {gradientPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => onChange({
                      type: 'linear',
                      colors: preset.colors,
                      direction: 45
                    })}
                    className="w-full h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{
                      background: `linear-gradient(45deg, ${preset.colors.join(', ')})`
                    }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 