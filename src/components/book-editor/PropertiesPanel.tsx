import React from 'react';
import { X, Upload, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CanvasElement } from './types';
import { uploadMedia } from '@/utils/mediaUpload';

type PropertiesPanelProps = { 
  selectedElement: CanvasElement | null;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onClose: () => void;
};

// Компонент звездной шкалы для панели свойств
const StarRatingControl = ({ 
  rating = 1, 
  onRatingChange 
}: { 
  rating: number; 
  onRatingChange: (rating: 1 | 2 | 3 | 4 | 5) => void; 
}) => {
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={20}
            className={`cursor-pointer transition-colors ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 hover:text-yellow-400'
            }`}
            onClick={() => onRatingChange(star as 1 | 2 | 3 | 4 | 5)}
          />
        ))}
      </div>
    </div>
  );
};

export function PropertiesPanel({ 
  selectedElement, 
  onUpdate, 
  onClose 
}: PropertiesPanelProps) {
  if (!selectedElement) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Свойства</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center text-gray-500 py-8">
          Выберите элемент для редактирования
        </div>
      </div>
    );
  }

  const updateProperty = (key: string, value: string | number | boolean) => {
    onUpdate({
      properties: {
        ...selectedElement.properties,
        [key]: value,
      },
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Свойства</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Position & Size */}
        <div>
          <h4 className="text-sm font-medium mb-3">Позиция и размер</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">X</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ x: Number(e.target.value) });
                }}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Y</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ y: Number(e.target.value) });
                }}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Ширина</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ width: Number(e.target.value) });
                }}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Высота</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ height: Number(e.target.value) });
                }}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Text Properties */}
        {(selectedElement.type === 'text' || selectedElement.type === 'paragraph') && (
          <div>
            <h4 className="text-sm font-medium mb-3">Текст</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Содержание</Label>
                {selectedElement.type === 'paragraph' ? (
                  <textarea
                    value={selectedElement.content}
                    onChange={(e) => {
                      e.preventDefault();
                      onUpdate({ content: e.target.value });
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm h-20 resize-none"
                  />
                ) : (
                  <Input
                    value={selectedElement.content}
                    onChange={(e) => {
                      e.preventDefault();
                      onUpdate({ content: e.target.value });
                    }}
                    className="h-8"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Размер шрифта</Label>
                  <Input
                    type="number"
                    value={selectedElement.properties.fontSize || 16}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('fontSize', Number(e.target.value));
                    }}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Цвет текста</Label>
                  <div className="flex space-x-1">
                    <Input
                      type="color"
                      value={selectedElement.properties.color || '#000000'}
                      onChange={(e) => {
                        e.preventDefault();
                        updateProperty('color', e.target.value);
                      }}
                      className="h-8 w-12 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={selectedElement.properties.color || '#000000'}
                      onChange={(e) => {
                        e.preventDefault();
                        updateProperty('color', e.target.value);
                      }}
                      placeholder="#000000"
                      className="h-8 flex-1 text-xs"
                    />
                  </div>
                </div>
              </div>
              
              {/* Color Presets */}
              <div>
                <Label className="text-xs mb-2 block">Быстрые цвета</Label>
                <div className="grid grid-cols-8 gap-1">
                  {[
                    '#000000', '#ffffff', '#ff0000', '#00ff00', 
                    '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
                    '#800000', '#008000', '#000080', '#808000',
                    '#800080', '#008080', '#c0c0c0', '#808080'
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => updateProperty('color', color)}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-xs">Цвет фона</Label>
                <div className="flex space-x-1">
                  <Input
                    type="color"
                    value={selectedElement.properties.backgroundColor || '#ffffff'}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('backgroundColor', e.target.value);
                    }}
                    className="h-8 w-12 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={selectedElement.properties.backgroundColor || '#ffffff'}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('backgroundColor', e.target.value);
                    }}
                    placeholder="#ffffff"
                    className="h-8 flex-1 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateProperty('backgroundColor', 'transparent')}
                    className="h-8 px-2 text-xs"
                  >
                    Прозрачный
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Семейство шрифта</Label>
                  <select
                    value={selectedElement.properties.fontFamily || 'Arial'}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('fontFamily', e.target.value);
                    }}
                    className="w-full h-8 border border-gray-300 rounded text-sm"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Выравнивание</Label>
                  <select
                    value={selectedElement.properties.textAlign || 'left'}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('textAlign', e.target.value);
                    }}
                    className="w-full h-8 border border-gray-300 rounded text-sm"
                  >
                    <option value="left">Слева</option>
                    <option value="center">По центру</option>
                    <option value="right">Справа</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={selectedElement.properties.fontWeight === 'bold' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    updateProperty('fontWeight', 
                      selectedElement.properties.fontWeight === 'bold' ? 'normal' : 'bold'
                    );
                  }}
                  className="flex-1"
                >
                  <span className="font-bold">Ж</span>
                </Button>
                <Button
                  variant={selectedElement.properties.fontStyle === 'italic' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    updateProperty('fontStyle', 
                      selectedElement.properties.fontStyle === 'italic' ? 'normal' : 'italic'
                    );
                  }}
                  className="flex-1"
                >
                  <span className="italic">К</span>
                </Button>
                <Button
                  variant={selectedElement.properties.textDecoration === 'underline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    updateProperty('textDecoration', 
                      selectedElement.properties.textDecoration === 'underline' ? 'none' : 'underline'
                    );
                  }}
                  className="flex-1"
                >
                  <span className="underline">Ч</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Line/Arrow Properties */}
        {(selectedElement.type === 'line' || selectedElement.type === 'arrow') && (
          <div>
            <h4 className="text-sm font-medium mb-3">Линия</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Толщина линии</Label>
                <Input
                  type="number"
                  min="1"
                  value={selectedElement.properties.lineThickness || 2}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('lineThickness', Number(e.target.value));
                  }}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Цвет линии</Label>
                <Input
                  type="color"
                  value={selectedElement.properties.color || '#000000'}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('color', e.target.value);
                  }}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        )}

        {/* Image Properties */}
        {selectedElement.type === 'image' && (
          <div>
            <h4 className="text-sm font-medium mb-3">Изображение</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">URL изображения</Label>
                <Input
                  value={selectedElement.properties.imageUrl || ''}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('imageUrl', e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="h-8"
                />
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        try {
                          const result = await uploadMedia(file, 'image');
                          if (result.success && result.url) {
                            updateProperty('imageUrl', result.url);
                            alert('Изображение успешно загружено!');
                          } else {
                            alert('Ошибка загрузки изображения: ' + result.error);
                          }
                        } catch (error) {
                          alert('Ошибка загрузки изображения');
                          console.error('Image upload error:', error);
                        }
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Загрузить изображение
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Video Properties */}
        {selectedElement.type === 'video' && (
          <div>
            <h4 className="text-sm font-medium mb-3">Видео</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">URL видео</Label>
                <Input
                  value={selectedElement.properties.videoUrl || ''}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('videoUrl', e.target.value);
                  }}
                  placeholder="https://example.com/video.mp4"
                  className="h-8"
                />
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'video/*';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        try {
                          const result = await uploadMedia(file, 'video');
                          if (result.success && result.url) {
                            updateProperty('videoUrl', result.url);
                            alert('Видео успешно загружено!');
                          } else {
                            alert('Ошибка загрузки видео: ' + result.error);
                          }
                        } catch (error) {
                          alert('Ошибка загрузки видео');
                          console.error('Video upload error:', error);
                        }
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Загрузить видео
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedElement.properties.controls !== false}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('controls', e.target.checked);
                    }}
                    className="rounded"
                  />
                  <span className="text-xs">Элементы управления</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedElement.properties.autoplay || false}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('autoplay', e.target.checked);
                    }}
                    className="rounded"
                  />
                  <span className="text-xs">Автовоспроизведение</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedElement.properties.muted !== false}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('muted', e.target.checked);
                    }}
                    className="rounded"
                  />
                  <span className="text-xs">Без звука</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedElement.properties.loop || false}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('loop', e.target.checked);
                    }}
                    className="rounded"
                  />
                  <span className="text-xs">Повтор</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Audio Properties */}
        {selectedElement.type === 'audio' && (
          <div>
            <h4 className="text-sm font-medium mb-3">Аудио</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">URL аудио</Label>
                <Input
                  value={selectedElement.properties.audioUrl || ''}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('audioUrl', e.target.value);
                  }}
                  placeholder="https://example.com/audio.mp3"
                  className="h-8"
                />
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'audio/*';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        try {
                          const result = await uploadMedia(file, 'audio');
                          if (result.success && result.url) {
                            updateProperty('audioUrl', result.url);
                            alert('Аудио успешно загружено!');
                          } else {
                            alert('Ошибка загрузки аудио: ' + result.error);
                          }
                        } catch (error) {
                          alert('Ошибка загрузки аудио');
                          console.error('Audio upload error:', error);
                        }
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Загрузить аудио
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedElement.properties.autoplay || false}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('autoplay', e.target.checked);
                    }}
                    className="rounded"
                  />
                  <span className="text-xs">Автовоспроизведение</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedElement.properties.muted !== false}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('muted', e.target.checked);
                    }}
                    className="rounded"
                  />
                  <span className="text-xs">Без звука</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedElement.properties.loop || false}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('loop', e.target.checked);
                    }}
                    className="rounded"
                  />
                  <span className="text-xs">Повтор</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Table Properties */}
        {selectedElement.type === 'table' && (
          <div>
            <h4 className="text-sm font-medium mb-3">Фон и границы</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Цвет фона</Label>
                <div className="flex space-x-1">
                  <Input
                    type="color"
                    value={selectedElement.properties.tableData?.backgroundColor || '#ffffff'}
                    onChange={(e) => {
                      e.preventDefault();
                      const tableData = selectedElement.properties.tableData || {};
                      onUpdate({
                        properties: {
                          ...selectedElement.properties,
                          tableData: {
                            ...tableData,
                            backgroundColor: e.target.value
                          }
                        }
                      });
                    }}
                    className="h-8 w-12 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={selectedElement.properties.tableData?.backgroundColor || '#ffffff'}
                    onChange={(e) => {
                      e.preventDefault();
                      const tableData = selectedElement.properties.tableData || {};
                      onUpdate({
                        properties: {
                          ...selectedElement.properties,
                          tableData: {
                            ...tableData,
                            backgroundColor: e.target.value
                          }
                        }
                      });
                    }}
                    placeholder="#ffffff"
                    className="h-8 flex-1 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const tableData = selectedElement.properties.tableData || {};
                      onUpdate({
                        properties: {
                          ...selectedElement.properties,
                          tableData: {
                            ...tableData,
                            backgroundColor: 'transparent'
                          }
                        }
                      });
                    }}
                    className="h-8 px-2 text-xs"
                  >
                    Прозрачный
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Толщина границы</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={selectedElement.properties.tableData?.borderWidth || 1}
                    onChange={(e) => {
                      e.preventDefault();
                      const tableData = selectedElement.properties.tableData || {};
                      const newBorderWidth = Number(e.target.value);
                      
                      // Update table border width and all cell borders
                      const updatedCells = { ...tableData.cells };
                      Object.keys(updatedCells).forEach(cellKey => {
                        updatedCells[cellKey] = {
                          ...updatedCells[cellKey],
                          borderWidth: newBorderWidth
                        };
                      });
                      
                      onUpdate({
                        properties: {
                          ...selectedElement.properties,
                          tableData: {
                            ...tableData,
                            borderWidth: newBorderWidth,
                            cells: updatedCells
                          }
                        }
                      });
                    }}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Цвет границы</Label>
                  <Input
                    type="color"
                    value={selectedElement.properties.tableData?.borderColor || '#cccccc'}
                    onChange={(e) => {
                      e.preventDefault();
                      const tableData = selectedElement.properties.tableData || {};
                      const newBorderColor = e.target.value;
                      
                      // Update table border color and all cell borders
                      const updatedCells = { ...tableData.cells };
                      Object.keys(updatedCells).forEach(cellKey => {
                        updatedCells[cellKey] = {
                          ...updatedCells[cellKey],
                          borderColor: newBorderColor
                        };
                      });
                      
                      onUpdate({
                        properties: {
                          ...selectedElement.properties,
                          tableData: {
                            ...tableData,
                            borderColor: newBorderColor,
                            cells: updatedCells
                          }
                        }
                      });
                    }}
                    className="h-8 w-full p-1 border rounded"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-xs">Стиль границы</Label>
                <select
                  value={selectedElement.properties.tableData?.borderCollapse ? 'сплошная' : 'раздельная'}
                  onChange={(e) => {
                    e.preventDefault();
                    const tableData = selectedElement.properties.tableData || {};
                    onUpdate({
                      properties: {
                        ...selectedElement.properties,
                        tableData: {
                          ...tableData,
                          borderCollapse: e.target.value === 'сплошная'
                        }
                      }
                    });
                  }}
                  className="w-full h-8 border border-gray-300 rounded text-sm"
                >
                  <option value="сплошная">Сплошная</option>
                  <option value="раздельная">Раздельная</option>
                </select>
              </div>
              
              <div>
                <Label className="text-xs">Радиус границы</Label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={selectedElement.properties.tableData?.borderRadius || 0}
                  onChange={(e) => {
                    e.preventDefault();
                    const tableData = selectedElement.properties.tableData || {};
                    onUpdate({
                      properties: {
                        ...selectedElement.properties,
                        tableData: {
                          ...tableData,
                          borderRadius: Number(e.target.value)
                        }
                      }
                    });
                  }}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        )}

        {/* Transform */}
        <div>
          <h4 className="text-sm font-medium mb-3">Трансформация</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Поворот (°)</Label>
              <Input
                type="number"
                value={selectedElement.rotation || 0}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ rotation: Number(e.target.value) });
                }}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Прозрачность (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={Math.round((selectedElement.opacity || 1) * 100)}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ opacity: Number(e.target.value) / 100 });
                }}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Media Properties */}
        {(selectedElement.type === 'image' || selectedElement.type === 'video' || selectedElement.type === 'audio') && (
          <div>
            <h4 className="text-sm font-medium mb-3">Медиа</h4>
            {/* Media properties here */}
          </div>
        )}

        {/* Math Properties */}
        {selectedElement.type === 'math' && (
          <div>
            <h4 className="text-sm font-medium mb-3">Математическая формула</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Режим отображения</Label>
                <select
                  value={selectedElement.properties.mathDisplay || 'block'}
                  onChange={(e) => {
                    updateProperty('mathDisplay', e.target.value);
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="inline">Встроенный (inline)</option>
                  <option value="block">Блочный (block)</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Размер формулы</Label>
                <select
                  value={selectedElement.properties.mathSize || 'normal'}
                  onChange={(e) => {
                    updateProperty('mathSize', e.target.value);
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="small">Маленький</option>
                  <option value="normal">Обычный</option>
                  <option value="large">Большой</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Размер шрифта (px)</Label>
                <Input
                  type="number"
                  min="8"
                  max="72"
                  value={selectedElement.properties.mathFontSize || 16}
                  onChange={(e) => {
                    updateProperty('mathFontSize', Number(e.target.value));
                  }}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Цвет формулы</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={selectedElement.properties.mathColor || '#000000'}
                    onChange={(e) => {
                      updateProperty('mathColor', e.target.value);
                    }}
                    className="w-10 h-8 p-0 border-0 bg-transparent cursor-pointer"
                    style={{ backgroundColor: 'transparent' }}
                  />
                  <Input
                    type="text"
                    value={selectedElement.properties.mathColor || '#000000'}
                    onChange={(e) => {
                      updateProperty('mathColor', e.target.value);
                    }}
                    className="h-8 text-xs font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Редактировать MathML</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded">
                  <p className="text-xs text-gray-600 mb-2">
                    Кликните по формуле на холсте для открытия редактора
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Properties */}
        {selectedElement.type === 'assignment' && (
          <div>
            <h4 className="text-sm font-medium mb-3">Настройки задания</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Тип задания</Label>
                <select
                  value={selectedElement.properties.assignmentType || 'multiple-choice'}
                  onChange={(e) => {
                    onUpdate({
                      properties: {
                        ...selectedElement.properties,
                        assignmentType: e.target.value as 'multiple-choice' | 'open-question' | 'true-false' | 'matching' | 'quiz'
                      }
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="multiple-choice">Множественный выбор</option>
                  <option value="open-question">Открытый вопрос</option>
                  <option value="true-false">Верно/Неверно</option>
                  <option value="matching">Сопоставление</option>
                  <option value="quiz">Викторина</option>
                </select>
              </div>

              <div>
                <Label className="text-xs">Вопрос</Label>
                <textarea
                  value={selectedElement.properties.assignmentData?.question || ''}
                  onChange={(e) => {
                    const currentData = selectedElement.properties.assignmentData || {};
                    onUpdate({
                      properties: {
                        ...selectedElement.properties,
                        assignmentData: {
                          ...currentData,
                          question: e.target.value
                        }
                      }
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm h-20 resize-none"
                  placeholder="Введите текст вопроса..."
                />
              </div>

              <div>
                <Label className="text-xs">Инструкции</Label>
                <textarea
                  value={selectedElement.properties.assignmentData?.instructions || ''}
                  onChange={(e) => {
                    const currentData = selectedElement.properties.assignmentData || {};
                    onUpdate({
                      properties: {
                        ...selectedElement.properties,
                        assignmentData: {
                          ...currentData,
                          instructions: e.target.value
                        }
                      }
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded text-sm h-16 resize-none"
                  placeholder="Дополнительные инструкции..."
                />
              </div>

              <div>
                <Label className="text-xs">Уровень сложности</Label>
                <StarRatingControl
                  rating={selectedElement.properties.assignmentData?.difficultyLevel || 3}
                  onRatingChange={(rating) => {
                    const currentData = selectedElement.properties.assignmentData || {};
                    onUpdate({
                      properties: {
                        ...selectedElement.properties,
                        assignmentData: {
                          ...currentData,
                          difficultyLevel: rating
                        }
                      }
                    });
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Баллы</Label>
                  <Input
                    type="number"
                    min="0"
                    value={selectedElement.properties.assignmentData?.points || 1}
                    onChange={(e) => {
                      const currentData = selectedElement.properties.assignmentData || {};
                      onUpdate({
                        properties: {
                          ...selectedElement.properties,
                          assignmentData: {
                            ...currentData,
                            points: Number(e.target.value)
                          }
                        }
                      });
                    }}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Время (мин)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={selectedElement.properties.assignmentData?.timeLimit || 0}
                    onChange={(e) => {
                      const currentData = selectedElement.properties.assignmentData || {};
                      onUpdate({
                        properties: {
                          ...selectedElement.properties,
                          assignmentData: {
                            ...currentData,
                            timeLimit: Number(e.target.value)
                          }
                        }
                      });
                    }}
                    className="h-8"
                    placeholder="0 = без лимита"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedElement.properties.assignmentData?.showCorrectAnswer || false}
                  onChange={(e) => {
                    const currentData = selectedElement.properties.assignmentData || {};
                    onUpdate({
                      properties: {
                        ...selectedElement.properties,
                        assignmentData: {
                          ...currentData,
                          showCorrectAnswer: e.target.checked
                        }
                      }
                    });
                  }}
                  className="w-4 h-4"
                />
                <Label className="text-xs">Показывать правильные ответы</Label>
              </div>

              {selectedElement.properties.assignmentType === 'multiple-choice' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedElement.properties.assignmentData?.shuffleOptions || false}
                    onChange={(e) => {
                      const currentData = selectedElement.properties.assignmentData || {};
                      onUpdate({
                        properties: {
                          ...selectedElement.properties,
                          assignmentData: {
                            ...currentData,
                            shuffleOptions: e.target.checked
                          }
                        }
                      });
                    }}
                    className="w-4 h-4"
                  />
                  <Label className="text-xs">Перемешивать варианты ответов</Label>
                </div>
              )}

              {/* Assignment Type Specific Options */}
              {selectedElement.properties.assignmentType === 'multiple-choice' && (
                <div>
                  <Label className="text-xs">Варианты ответов</Label>
                  <div className="space-y-2">
                    {(selectedElement.properties.assignmentData?.options || []).map((option, index) => (
                      <div key={option.id} className="flex items-center gap-2 p-2 border rounded">
                        <input
                          type="radio"
                          name={`correct-${selectedElement.id}`}
                          checked={option.isCorrect || false}
                          onChange={() => {
                            const currentData = selectedElement.properties.assignmentData || {};
                            const updatedOptions = (currentData.options || []).map((opt, idx) => ({
                              ...opt,
                              isCorrect: idx === index
                            }));
                            onUpdate({
                              properties: {
                                ...selectedElement.properties,
                                assignmentData: {
                                  ...currentData,
                                  options: updatedOptions
                                }
                              }
                            });
                          }}
                          className="w-4 h-4"
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => {
                            const currentData = selectedElement.properties.assignmentData || {};
                            const updatedOptions = (currentData.options || []).map((opt, idx) => 
                              idx === index ? { ...opt, text: e.target.value } : opt
                            );
                            onUpdate({
                              properties: {
                                ...selectedElement.properties,
                                assignmentData: {
                                  ...currentData,
                                  options: updatedOptions
                                }
                              }
                            });
                          }}
                          className="flex-1 p-1 text-xs border border-gray-300 rounded"
                          placeholder={`Вариант ${index + 1}`}
                        />
                        <button
                          onClick={() => {
                            const currentData = selectedElement.properties.assignmentData || {};
                            const updatedOptions = (currentData.options || []).filter((_, idx) => idx !== index);
                            onUpdate({
                              properties: {
                                ...selectedElement.properties,
                                assignmentData: {
                                  ...currentData,
                                  options: updatedOptions
                                }
                              }
                            });
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Удалить вариант"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const currentData = selectedElement.properties.assignmentData || {};
                        const newOption = {
                          id: `opt-${Date.now()}`,
                          text: `Вариант ${(currentData.options?.length || 0) + 1}`,
                          isCorrect: false
                        };
                        onUpdate({
                          properties: {
                            ...selectedElement.properties,
                            assignmentData: {
                              ...currentData,
                              options: [...(currentData.options || []), newOption]
                            }
                          }
                        });
                      }}
                      className="w-full p-2 text-xs border-2 border-dashed border-gray-300 rounded hover:border-gray-400"
                    >
                      + Добавить вариант
                    </button>
                  </div>
                </div>
              )}

              {selectedElement.properties.assignmentType === 'true-false' && (
                <div>
                  <Label className="text-xs">Правильный ответ</Label>
                  <div className="flex gap-2 mt-1">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`tf-correct-${selectedElement.id}`}
                        checked={selectedElement.properties.assignmentData?.correctAnswer === true}
                        onChange={() => {
                          const currentData = selectedElement.properties.assignmentData || {};
                          onUpdate({
                            properties: {
                              ...selectedElement.properties,
                              assignmentData: {
                                ...currentData,
                                correctAnswer: true
                              }
                            }
                          });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-xs">Верно</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`tf-correct-${selectedElement.id}`}
                        checked={selectedElement.properties.assignmentData?.correctAnswer === false}
                        onChange={() => {
                          const currentData = selectedElement.properties.assignmentData || {};
                          onUpdate({
                            properties: {
                              ...selectedElement.properties,
                              assignmentData: {
                                ...currentData,
                                correctAnswer: false
                              }
                            }
                          });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-xs">Неверно</span>
                    </label>
                  </div>
                </div>
              )}

              {selectedElement.properties.assignmentType === 'open-question' && (
                <div>
                  <Label className="text-xs">Ожидаемый ответ</Label>
                  <textarea
                    value={selectedElement.properties.assignmentData?.expectedAnswer || ''}
                    onChange={(e) => {
                      const currentData = selectedElement.properties.assignmentData || {};
                      onUpdate({
                        properties: {
                          ...selectedElement.properties,
                          assignmentData: {
                            ...currentData,
                            expectedAnswer: e.target.value
                          }
                        }
                      });
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm h-16 resize-none"
                    placeholder="Введите ожидаемый ответ..."
                  />
                  <div className="mt-2">
                    <Label className="text-xs">Длина ответа</Label>
                    <select
                      value={selectedElement.properties.assignmentData?.answerLength || 'medium'}
                      onChange={(e) => {
                        const currentData = selectedElement.properties.assignmentData || {};
                        onUpdate({
                          properties: {
                            ...selectedElement.properties,
                            assignmentData: {
                              ...currentData,
                              answerLength: e.target.value as 'short' | 'medium' | 'long'
                            }
                          }
                        });
                      }}
                      className="w-full p-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="short">Короткий</option>
                      <option value="medium">Средний</option>
                      <option value="long">Длинный</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedElement.properties.assignmentType === 'matching' && (
                <div>
                  <Label className="text-xs">Элементы для сопоставления</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-600">Левый столбец</Label>
                      <div className="space-y-1">
                        {(selectedElement.properties.assignmentData?.leftItems || []).map((item, index) => (
                          <div key={item.id} className="flex gap-1">
                            <input
                              type="text"
                              value={item.content}
                              onChange={(e) => {
                                const currentData = selectedElement.properties.assignmentData || {};
                                const updatedItems = (currentData.leftItems || []).map((itm, idx) => 
                                  idx === index ? { ...itm, content: e.target.value } : itm
                                );
                                onUpdate({
                                  properties: {
                                    ...selectedElement.properties,
                                    assignmentData: {
                                      ...currentData,
                                      leftItems: updatedItems
                                    }
                                  }
                                });
                              }}
                              className="flex-1 p-1 text-xs border border-gray-300 rounded"
                              placeholder={`Элемент ${index + 1}`}
                            />
                            <button
                              onClick={() => {
                                const currentData = selectedElement.properties.assignmentData || {};
                                const updatedLeftItems = (currentData.leftItems || []).filter((_, idx) => idx !== index);
                                const updatedRightItems = (currentData.rightItems || []).filter(right => right.matchWith !== item.id);
                                onUpdate({
                                  properties: {
                                    ...selectedElement.properties,
                                    assignmentData: {
                                      ...currentData,
                                      leftItems: updatedLeftItems,
                                      rightItems: updatedRightItems
                                    }
                                  }
                                });
                              }}
                              className="text-red-600 text-xs hover:bg-red-50 px-1 rounded"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const currentData = selectedElement.properties.assignmentData || {};
                            const newItem = {
                              id: `left-${Date.now()}`,
                              content: `Элемент ${(currentData.leftItems?.length || 0) + 1}`
                            };
                            onUpdate({
                              properties: {
                                ...selectedElement.properties,
                                assignmentData: {
                                  ...currentData,
                                  leftItems: [...(currentData.leftItems || []), newItem]
                                }
                              }
                            });
                          }}
                          className="w-full p-1 text-xs border border-dashed border-gray-300 rounded hover:border-gray-400"
                        >
                          + Добавить
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Правый столбец</Label>
                      <div className="space-y-1">
                        {(selectedElement.properties.assignmentData?.rightItems || []).map((item, index) => (
                          <div key={item.id} className="flex gap-1">
                            <input
                              type="text"
                              value={item.content}
                              onChange={(e) => {
                                const currentData = selectedElement.properties.assignmentData || {};
                                const updatedItems = (currentData.rightItems || []).map((itm, idx) => 
                                  idx === index ? { ...itm, content: e.target.value } : itm
                                );
                                onUpdate({
                                  properties: {
                                    ...selectedElement.properties,
                                    assignmentData: {
                                      ...currentData,
                                      rightItems: updatedItems
                                    }
                                  }
                                });
                              }}
                              className="flex-1 p-1 text-xs border border-gray-300 rounded"
                              placeholder={`Соответствие ${index + 1}`}
                            />
                            <select
                              value={item.matchWith || ''}
                              onChange={(e) => {
                                const currentData = selectedElement.properties.assignmentData || {};
                                const updatedItems = (currentData.rightItems || []).map((itm, idx) => 
                                  idx === index ? { ...itm, matchWith: e.target.value } : itm
                                );
                                onUpdate({
                                  properties: {
                                    ...selectedElement.properties,
                                    assignmentData: {
                                      ...currentData,
                                      rightItems: updatedItems
                                    }
                                  }
                                });
                              }}
                              className="w-12 p-1 text-xs border border-gray-300 rounded"
                            >
                              <option value="">-</option>
                              {(selectedElement.properties.assignmentData?.leftItems || []).map((leftItem, leftIndex) => (
                                <option key={leftItem.id} value={leftItem.id}>
                                  {leftIndex + 1}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                const currentData = selectedElement.properties.assignmentData || {};
                                const updatedItems = (currentData.rightItems || []).filter((_, idx) => idx !== index);
                                onUpdate({
                                  properties: {
                                    ...selectedElement.properties,
                                    assignmentData: {
                                      ...currentData,
                                      rightItems: updatedItems
                                    }
                                  }
                                });
                              }}
                              className="text-red-600 text-xs hover:bg-red-50 px-1 rounded"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const currentData = selectedElement.properties.assignmentData || {};
                            const newItem = {
                              id: `right-${Date.now()}`,
                              content: `Соответствие ${(currentData.rightItems?.length || 0) + 1}`,
                              matchWith: ''
                            };
                            onUpdate({
                              properties: {
                                ...selectedElement.properties,
                                assignmentData: {
                                  ...currentData,
                                  rightItems: [...(currentData.rightItems || []), newItem]
                                }
                              }
                            });
                          }}
                          className="w-full p-1 text-xs border border-dashed border-gray-300 rounded hover:border-gray-400"
                        >
                          + Добавить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedElement.properties.assignmentType === 'quiz' && (
                <div>
                  <Label className="text-xs">Вопросы викторины</Label>
                  <div className="space-y-3">
                    {(selectedElement.properties.assignmentData?.quizQuestions || []).map((question, qIndex) => (
                      <div key={question.id} className="p-2 border rounded">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={question.question}
                            onChange={(e) => {
                              const currentData = selectedElement.properties.assignmentData || {};
                              const updatedQuestions = (currentData.quizQuestions || []).map((q, idx) => 
                                idx === qIndex ? { ...q, question: e.target.value } : q
                              );
                              onUpdate({
                                properties: {
                                  ...selectedElement.properties,
                                  assignmentData: {
                                    ...currentData,
                                    quizQuestions: updatedQuestions
                                  }
                                }
                              });
                            }}
                            className="flex-1 p-1 text-xs border border-gray-300 rounded"
                            placeholder={`Вопрос ${qIndex + 1}`}
                          />
                          <select
                            value={question.type}
                            onChange={(e) => {
                              const currentData = selectedElement.properties.assignmentData || {};
                              const updatedQuestions = (currentData.quizQuestions || []).map((q, idx) => 
                                idx === qIndex ? { ...q, type: e.target.value as 'multiple-choice' | 'true-false' | 'open' } : q
                              );
                              onUpdate({
                                properties: {
                                  ...selectedElement.properties,
                                  assignmentData: {
                                    ...currentData,
                                    quizQuestions: updatedQuestions
                                  }
                                }
                              });
                            }}
                            className="p-1 text-xs border border-gray-300 rounded"
                          >
                            <option value="multiple-choice">Выбор</option>
                            <option value="true-false">Да/Нет</option>
                            <option value="open">Открытый</option>
                          </select>
                          <button
                            onClick={() => {
                              const currentData = selectedElement.properties.assignmentData || {};
                              const updatedQuestions = (currentData.quizQuestions || []).filter((_, idx) => idx !== qIndex);
                              onUpdate({
                                properties: {
                                  ...selectedElement.properties,
                                  assignmentData: {
                                    ...currentData,
                                    quizQuestions: updatedQuestions
                                  }
                                }
                              });
                            }}
                            className="text-red-600 text-xs hover:bg-red-50 px-1 rounded"
                          >
                            ×
                          </button>
                        </div>
                        
                        {question.type === 'multiple-choice' && (
                          <div className="space-y-1">
                            {(question.options || []).map((option, oIndex) => (
                              <div key={option.id} className="flex items-center gap-1">
                                <input
                                  type="radio"
                                  name={`quiz-correct-${question.id}`}
                                  checked={option.isCorrect || false}
                                  onChange={() => {
                                    const currentData = selectedElement.properties.assignmentData || {};
                                    const updatedQuestions = (currentData.quizQuestions || []).map((q, qIdx) => 
                                      qIdx === qIndex ? {
                                        ...q,
                                        options: (q.options || []).map((opt, oIdx) => ({
                                          ...opt,
                                          isCorrect: oIdx === oIndex
                                        }))
                                      } : q
                                    );
                                    onUpdate({
                                      properties: {
                                        ...selectedElement.properties,
                                        assignmentData: {
                                          ...currentData,
                                          quizQuestions: updatedQuestions
                                        }
                                      }
                                    });
                                  }}
                                  className="w-3 h-3"
                                />
                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => {
                                    const currentData = selectedElement.properties.assignmentData || {};
                                    const updatedQuestions = (currentData.quizQuestions || []).map((q, qIdx) => 
                                      qIdx === qIndex ? {
                                        ...q,
                                        options: (q.options || []).map((opt, oIdx) => 
                                          oIdx === oIndex ? { ...opt, text: e.target.value } : opt
                                        )
                                      } : q
                                    );
                                    onUpdate({
                                      properties: {
                                        ...selectedElement.properties,
                                        assignmentData: {
                                          ...currentData,
                                          quizQuestions: updatedQuestions
                                        }
                                      }
                                    });
                                  }}
                                  className="flex-1 p-1 text-xs border border-gray-300 rounded"
                                  placeholder={`Вариант ${oIndex + 1}`}
                                />
                                <button
                                  onClick={() => {
                                    const currentData = selectedElement.properties.assignmentData || {};
                                    const updatedQuestions = (currentData.quizQuestions || []).map((q, qIdx) => 
                                      qIdx === qIndex ? {
                                        ...q,
                                        options: (q.options || []).filter((_, oIdx) => oIdx !== oIndex)
                                      } : q
                                    );
                                    onUpdate({
                                      properties: {
                                        ...selectedElement.properties,
                                        assignmentData: {
                                          ...currentData,
                                          quizQuestions: updatedQuestions
                                        }
                                      }
                                    });
                                  }}
                                  className="text-red-600 text-xs hover:bg-red-50 px-1 rounded"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const currentData = selectedElement.properties.assignmentData || {};
                                const newOption = {
                                  id: `qopt-${Date.now()}`,
                                  text: `Вариант ${((question.options?.length || 0) + 1)}`,
                                  isCorrect: false
                                };
                                const updatedQuestions = (currentData.quizQuestions || []).map((q, qIdx) => 
                                  qIdx === qIndex ? {
                                    ...q,
                                    options: [...(q.options || []), newOption]
                                  } : q
                                );
                                onUpdate({
                                  properties: {
                                    ...selectedElement.properties,
                                    assignmentData: {
                                      ...currentData,
                                      quizQuestions: updatedQuestions
                                    }
                                  }
                                });
                              }}
                              className="w-full p-1 text-xs border border-dashed border-gray-300 rounded hover:border-gray-400"
                            >
                              + Добавить вариант
                            </button>
                          </div>
                        )}

                        {question.type === 'true-false' && (
                          <div className="flex gap-2">
                            <label className="flex items-center gap-1">
                              <input
                                type="radio"
                                name={`quiz-tf-${question.id}`}
                                checked={question.correctAnswer === true}
                                onChange={() => {
                                  const currentData = selectedElement.properties.assignmentData || {};
                                  const updatedQuestions = (currentData.quizQuestions || []).map((q, qIdx) => 
                                    qIdx === qIndex ? { ...q, correctAnswer: true } : q
                                  );
                                  onUpdate({
                                    properties: {
                                      ...selectedElement.properties,
                                      assignmentData: {
                                        ...currentData,
                                        quizQuestions: updatedQuestions
                                      }
                                    }
                                  });
                                }}
                                className="w-3 h-3"
                              />
                              <span className="text-xs">Верно</span>
                            </label>
                            <label className="flex items-center gap-1">
                              <input
                                type="radio"
                                name={`quiz-tf-${question.id}`}
                                checked={question.correctAnswer === false}
                                onChange={() => {
                                  const currentData = selectedElement.properties.assignmentData || {};
                                  const updatedQuestions = (currentData.quizQuestions || []).map((q, qIdx) => 
                                    qIdx === qIndex ? { ...q, correctAnswer: false } : q
                                  );
                                  onUpdate({
                                    properties: {
                                      ...selectedElement.properties,
                                      assignmentData: {
                                        ...currentData,
                                        quizQuestions: updatedQuestions
                                      }
                                    }
                                  });
                                }}
                                className="w-3 h-3"
                              />
                              <span className="text-xs">Неверно</span>
                            </label>
                          </div>
                        )}

                        <div className="mt-2">
                          <input
                            type="number"
                            min="0"
                            value={question.points || 1}
                            onChange={(e) => {
                              const currentData = selectedElement.properties.assignmentData || {};
                              const updatedQuestions = (currentData.quizQuestions || []).map((q, qIdx) => 
                                qIdx === qIndex ? { ...q, points: Number(e.target.value) } : q
                              );
                              onUpdate({
                                properties: {
                                  ...selectedElement.properties,
                                  assignmentData: {
                                    ...currentData,
                                    quizQuestions: updatedQuestions
                                  }
                                }
                              });
                            }}
                            className="w-16 p-1 text-xs border border-gray-300 rounded"
                            placeholder="Баллы"
                          />
                          <span className="text-xs text-gray-500 ml-1">баллов</span>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const currentData = selectedElement.properties.assignmentData || {};
                        const newQuestion = {
                          id: `q-${Date.now()}`,
                          question: `Вопрос ${(currentData.quizQuestions?.length || 0) + 1}`,
                          type: 'multiple-choice' as const,
                          options: [
                            { id: `qopt1-${Date.now()}`, text: 'Вариант 1', isCorrect: true },
                            { id: `qopt2-${Date.now()}`, text: 'Вариант 2', isCorrect: false }
                          ],
                          points: 1
                        };
                        onUpdate({
                          properties: {
                            ...selectedElement.properties,
                            assignmentData: {
                              ...currentData,
                              quizQuestions: [...(currentData.quizQuestions || []), newQuestion]
                            }
                          }
                        });
                      }}
                      className="w-full p-2 text-xs border-2 border-dashed border-gray-300 rounded hover:border-gray-400"
                    >
                      + Добавить вопрос
                    </button>
                  </div>
                </div>
              )}

              {/* Save Assignment Button */}
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={async () => {
                    // Import the save function dynamically to avoid build issues
                    const { saveAssignmentToDatabase, validateAssignmentData } = await import('../../utils/assignments');
                    
                    const assignmentData = selectedElement.properties.assignmentData;
                    if (!assignmentData || !validateAssignmentData(assignmentData)) {
                      alert('Пожалуйста, заполните все обязательные поля задания');
                      return;
                    }

                    // Get book base_url from URL params
                    // Extract from URLs like /dashboard/books/[base_url]/edit
                    const pathParts = window.location.pathname.split('/');
                    const booksIndex = pathParts.indexOf('books');
                    const bookBaseUrl = booksIndex !== -1 && pathParts[booksIndex + 1] ? pathParts[booksIndex + 1] : null;
                    
                    // Debug logging
                    console.log('Current URL:', window.location.pathname);
                    console.log('Path parts:', pathParts);
                    console.log('Books index:', booksIndex);
                    console.log('Extracted bookBaseUrl:', bookBaseUrl);
                    console.log('Assignment data:', assignmentData);
                    console.log('Selected element ID:', selectedElement.id);
                    
                    if (!bookBaseUrl || bookBaseUrl === 'create') {
                      alert(`Не удалось определить ID книги. URL: ${window.location.pathname}, извлечено: ${bookBaseUrl}`);
                      return;
                    }

                    try {
                      const result = await saveAssignmentToDatabase(
                        bookBaseUrl,
                        selectedElement.id,
                        selectedElement.properties.assignmentType || 'multiple-choice',
                        assignmentData
                      );

                      if (result.success) {
                        alert('Задание успешно сохранено!');
                      } else {
                        alert(`Ошибка при сохранении: ${result.error}`);
                      }
                    } catch (error) {
                      console.error('Error saving assignment:', error);
                      alert(`Произошла ошибка при сохранении задания: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
                    }
                  }}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Сохранить задание
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shape Properties */}
        {selectedElement.type === 'shape' && (
          <div>
            <h4 className="text-sm font-medium mb-3">Настройки фигуры</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Тип фигуры</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-sm">
                  {selectedElement.properties.shapeType === 'rectangle' && 'Прямоугольник'}
                  {selectedElement.properties.shapeType === 'circle' && 'Круг'}
                  {selectedElement.properties.shapeType === 'triangle' && 'Треугольник'}
                  {selectedElement.properties.shapeType === 'star' && 'Звезда'}
                  {selectedElement.properties.shapeType === 'heart' && 'Сердце'}
                </div>
              </div>

              <div>
                <Label className="text-xs">Цвет заливки</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={selectedElement.properties.backgroundColor || '#e0e0e0'}
                    onChange={(e) => updateProperty('backgroundColor', e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedElement.properties.backgroundColor || '#e0e0e0'}
                    onChange={(e) => updateProperty('backgroundColor', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="#e0e0e0"
                  />
                  <button
                    onClick={() => updateProperty('backgroundColor', 'transparent')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded"
                    title="Прозрачный"
                  >
                    Прозр.
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs">Цвет границы</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={selectedElement.properties.borderColor || '#000000'}
                    onChange={(e) => updateProperty('borderColor', e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedElement.properties.borderColor || '#000000'}
                    onChange={(e) => updateProperty('borderColor', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Толщина границы</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={selectedElement.properties.borderWidth || 0}
                    onChange={(e) => updateProperty('borderWidth', Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs w-8 text-center">
                    {selectedElement.properties.borderWidth || 0}px
                  </span>
                </div>
              </div>

              {selectedElement.properties.shapeType === 'rectangle' && (
                <div>
                  <Label className="text-xs">Скругление углов</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={selectedElement.properties.borderRadius || 0}
                      onChange={(e) => updateProperty('borderRadius', Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs w-8 text-center">
                      {selectedElement.properties.borderRadius || 0}px
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Icon Properties */}
        {selectedElement.type === 'icon' && (
          <div>
            <h4 className="text-sm font-medium mb-3">Настройки иконки</h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Тип иконки</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-sm">
                  {selectedElement.properties.iconType?.replace('icon-', '').replace('-', ' ') || 'Не указано'}
                </div>
              </div>

              <div>
                <Label className="text-xs">Цвет иконки</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={selectedElement.properties.color || '#000000'}
                    onChange={(e) => updateProperty('color', e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedElement.properties.color || '#000000'}
                    onChange={(e) => updateProperty('color', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Цвет фона</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={selectedElement.properties.backgroundColor || 'transparent'}
                    onChange={(e) => updateProperty('backgroundColor', e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                    disabled={selectedElement.properties.backgroundColor === 'transparent'}
                  />
                  <input
                    type="text"
                    value={selectedElement.properties.backgroundColor || 'transparent'}
                    onChange={(e) => updateProperty('backgroundColor', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="transparent"
                  />
                  <button
                    onClick={() => updateProperty('backgroundColor', 'transparent')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded"
                    title="Прозрачный"
                  >
                    Прозр.
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs">Цвет границы</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={selectedElement.properties.borderColor || 'transparent'}
                    onChange={(e) => updateProperty('borderColor', e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                    disabled={selectedElement.properties.borderColor === 'transparent'}
                  />
                  <input
                    type="text"
                    value={selectedElement.properties.borderColor || 'transparent'}
                    onChange={(e) => updateProperty('borderColor', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="transparent"
                  />
                  <button
                    onClick={() => updateProperty('borderColor', 'transparent')}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded"
                    title="Прозрачный"
                  >
                    Прозр.
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs">Толщина границы</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={selectedElement.properties.borderWidth || 0}
                    onChange={(e) => updateProperty('borderWidth', Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs w-8 text-center">
                    {selectedElement.properties.borderWidth || 0}px
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs">Скругление углов</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={selectedElement.properties.borderRadius || 0}
                    onChange={(e) => updateProperty('borderRadius', Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs w-8 text-center">
                    {selectedElement.properties.borderRadius || 0}px
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
