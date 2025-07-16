import React, { useState } from 'react';
import { X, Upload, Star, Bold, Italic, Underline, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CanvasElement, getFillInBlankAnswerTypeLabel, isPointsSystemEnabled } from './types';
import { uploadMedia } from '@/utils/mediaUpload';
import { AssignmentOptionsEditor } from './AssignmentOptionsEditor';

type PropertiesPanelProps = { 
  selectedElement: CanvasElement | null;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onClose: () => void;
};

export function PropertiesPanel({ 
  selectedElement, 
  onUpdate, 
  onClose 
}: PropertiesPanelProps) {
  const [isAssignmentEditorOpen, setIsAssignmentEditorOpen] = useState(false);
  
  if (!selectedElement) return null;

  const updateProperty = (key: string, value: string | number | boolean) => {
    onUpdate({
      properties: {
        ...selectedElement.properties,
        [key]: value,
      },
    });
  };

  return (
    <>
    <div className="w-full bg-white border border-gray-200 rounded-md p-3 overflow-auto">
      <div className="flex flex-wrap items-start gap-4">
        {/* Position & Size Section */}
        <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Позиция:</span>
          <div className="flex items-center gap-1">
            <div className="w-16">
              <Input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ x: Number(e.target.value) });
                }}
                className="h-6 text-xs"
                placeholder="X"
              />
            </div>
            <div className="w-16">
              <Input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ y: Number(e.target.value) });
                }}
                className="h-6 text-xs"
                placeholder="Y"
              />
            </div>
          </div>
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Размер:</span>
          <div className="flex items-center gap-1">
            <div className="w-16">
              <Input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ width: Number(e.target.value) });
                }}
                className="h-6 text-xs"
                placeholder="Ш"
              />
            </div>
            <div className="w-16">
              <Input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => {
                  e.preventDefault();
                  onUpdate({ height: Number(e.target.value) });
                }}
                className="h-6 text-xs"
                placeholder="В"
              />
            </div>
          </div>
        </div>

        {/* Text Properties */}
        {(selectedElement.type === 'text' || selectedElement.type === 'paragraph') && (
          <>
            {/* Content Section */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Текст:</span>
              {selectedElement.type === 'paragraph' ? (
                <textarea
                  value={selectedElement.content}
                  onChange={(e) => {
                    e.preventDefault();
                    onUpdate({ content: e.target.value });
                  }}
                  className="w-32 h-6 p-1 border border-gray-300 rounded text-xs resize-none"
                  placeholder="Содержание"
                />
              ) : (
                <Input
                  value={selectedElement.content}
                  onChange={(e) => {
                    e.preventDefault();
                    onUpdate({ content: e.target.value });
                  }}
                  className="h-6 text-xs w-32"
                  placeholder="Содержание"
                />
              )}
            </div>
              
            {/* Font Section */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Шрифт:</span>
              <div className="w-32">
                <Select 
                  value={selectedElement.properties.fontFamily || 'Arial, sans-serif'}
                  onValueChange={(value) => updateProperty('fontFamily', value)}
                >
                  <SelectTrigger className="h-6 text-xs">
                    <SelectValue placeholder="Шрифт" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                    <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                    <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                    <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                    <SelectItem value="'Comic Sans MS', cursive">Comic Sans MS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
              
            {/* Text Style Section */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Стиль:</span>
              <div className="flex gap-1">
                <Button
                  variant={selectedElement.properties.fontWeight === 'bold' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newWeight = selectedElement.properties.fontWeight === 'bold' ? 'normal' : 'bold';
                    updateProperty('fontWeight', newWeight);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Bold className="h-3 w-3" />
                </Button>
                <Button
                  variant={selectedElement.properties.fontStyle === 'italic' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newStyle = selectedElement.properties.fontStyle === 'italic' ? 'normal' : 'italic';
                    updateProperty('fontStyle', newStyle);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Italic className="h-3 w-3" />
                </Button>
                <Button
                  variant={selectedElement.properties.textDecoration === 'underline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newDecoration = selectedElement.properties.textDecoration === 'underline' ? 'none' : 'underline';
                    updateProperty('textDecoration', newDecoration);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Underline className="h-3 w-3" />
                </Button>
              </div>
            </div>
              
            {/* Font Size and Color Section */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Размер:</span>
              <div className="w-16">
                <Input
                  type="number"
                  value={selectedElement.properties.fontSize || 16}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('fontSize', Number(e.target.value));
                  }}
                  className="h-6 text-xs"
                  placeholder="16"
                />
              </div>
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Цвет:</span>
              <div className="flex gap-1">
                <Input
                  type="color"
                  value={selectedElement.properties.color || '#000000'}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('color', e.target.value);
                  }}
                  className="h-6 w-8 p-0 border rounded"
                />
                <Input
                  type="text"
                  value={selectedElement.properties.color || '#000000'}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('color', e.target.value);
                  }}
                  placeholder="#000000"
                  className="h-6 w-20 text-xs"
                />
              </div>
            </div>
              
            {/* Background Color Section */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Фон:</span>
              <div className="flex gap-1">
                <Input
                  type="color"
                  value={selectedElement.properties.backgroundColor || '#ffffff'}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('backgroundColor', e.target.value);
                  }}
                  className="h-6 w-8 p-0 border rounded"
                />
                <Input
                  type="text"
                  value={selectedElement.properties.backgroundColor || '#ffffff'}
                  onChange={(e) => {
                    e.preventDefault();
                    updateProperty('backgroundColor', e.target.value);
                  }}
                  placeholder="#ffffff"
                  className="h-6 w-20 text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateProperty('backgroundColor', 'transparent')}
                  className="h-6 px-2 text-xs"
                >
                  Прозрачный
                </Button>
              </div>
            </div>

            {/* Padding Section - Only for paragraphs */}
            {selectedElement.type === 'paragraph' && (
              <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Отступы:</span>
                <div className="flex gap-1">
                  <div className="w-16">
                    <Input
                      type="number"
                      value={selectedElement.properties.paddingLeft || 8}
                      onChange={(e) => {
                        e.preventDefault();
                        updateProperty('paddingLeft', Number(e.target.value));
                      }}
                      className="h-6 text-xs"
                      placeholder="Л"
                      min="0"
                    />
                  </div>
                  <div className="w-16">
                    <Input
                      type="number"
                      value={selectedElement.properties.paddingRight || 8}
                      onChange={(e) => {
                        e.preventDefault();
                        updateProperty('paddingRight', Number(e.target.value));
                      }}
                      className="h-6 text-xs"
                      placeholder="П"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Border Radius Section - Only for paragraphs */}
            {selectedElement.type === 'paragraph' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Углы:</span>
                <div className="w-16">
                  <Input
                    type="number"
                    value={selectedElement.properties.borderRadius || 0}
                    onChange={(e) => {
                      e.preventDefault();
                      updateProperty('borderRadius', Number(e.target.value));
                    }}
                    className="h-6 text-xs"
                    placeholder="0"
                    min="0"
                    max="50"
                  />
                </div>
                <span className="text-xs text-gray-500">px</span>
              </div>
            )}
          </>
        )}

        {/* Shape Properties */}
        {selectedElement.type === 'shape' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Цвет:</span>
            <div className="flex gap-1">
              <Input
                type="color"
                value={selectedElement.properties.backgroundColor || '#e0e0e0'}
                onChange={(e) => {
                  e.preventDefault();
                  updateProperty('backgroundColor', e.target.value);
                }}
                className="h-6 w-8 p-0 border rounded"
              />
              <Input
                type="text"
                value={selectedElement.properties.backgroundColor || '#e0e0e0'}
                onChange={(e) => {
                  e.preventDefault();
                  updateProperty('backgroundColor', e.target.value);
                }}
                className="h-6 w-20 text-xs"
                placeholder="#e0e0e0"
              />
            </div>
          </div>
        )}

        {/* Assignment Properties */}
        {selectedElement.type === 'assignment' && selectedElement.properties.assignmentData && (
          <>
            {/* Question Section */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Вопрос:</span>
              <textarea
                value={selectedElement.properties.assignmentData.question || ''}
                onChange={(e) => {
                  e.preventDefault();
                  const newData = {
                    ...selectedElement.properties.assignmentData,
                    question: e.target.value
                  };
                  onUpdate({
                    properties: {
                      ...selectedElement.properties,
                      assignmentData: newData
                    }
                  });
                }}
                className="w-48 h-12 p-1 border border-gray-300 rounded text-xs resize-none"
                placeholder="Введите вопрос"
              />
            </div>

            {/* Instructions Section */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Инструкция:</span>
              <textarea
                value={selectedElement.properties.assignmentData.instructions || ''}
                onChange={(e) => {
                  e.preventDefault();
                  const newData = {
                    ...selectedElement.properties.assignmentData,
                    instructions: e.target.value
                  };
                  onUpdate({
                    properties: {
                      ...selectedElement.properties,
                      assignmentData: newData
                    }
                  });
                }}
                className="w-48 h-12 p-1 border border-gray-300 rounded text-xs resize-none"
                placeholder="Введите инструкцию"
              />
            </div>

            {/* Points System Section */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Система баллов:</span>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={isPointsSystemEnabled(selectedElement.properties.assignmentData)}
                  onChange={(e) => {
                    e.stopPropagation();
                    const isEnabled = e.target.checked;
                    console.log('Points system toggle:', {
                      isEnabled,
                      currentState: selectedElement.properties.assignmentData.pointsEnabled,
                      currentPoints: selectedElement.properties.assignmentData.points
                    });
                    const newData = {
                      ...selectedElement.properties.assignmentData,
                      pointsEnabled: isEnabled,
                      // Если отключаем систему баллов, устанавливаем points в null
                      points: isEnabled ? (selectedElement.properties.assignmentData.points || 1) : null
                    };
                    console.log('New assignment data:', newData);
                    onUpdate({
                      properties: {
                        ...selectedElement.properties,
                        assignmentData: newData
                      }
                    });
                  }}
                  className="w-3 h-3"
                />
                <span className="text-xs">Включить</span>
              </label>
              
              {isPointsSystemEnabled(selectedElement.properties.assignmentData) && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Баллы:</span>
                  <div className="w-16">
                    <Input
                      type="number"
                      value={selectedElement.properties.assignmentData.points || ''}
                      onChange={(e) => {
                        e.preventDefault();
                        const value = e.target.value;
                        const newData = {
                          ...selectedElement.properties.assignmentData,
                          points: value === '' ? null : Number(value)
                        };
                        onUpdate({
                          properties: {
                            ...selectedElement.properties,
                            assignmentData: newData
                          }
                        });
                      }}
                      onBlur={(e) => {
                        // При потере фокуса, если поле пустое, устанавливаем 1 как минимальное значение
                        if (e.target.value === '' || Number(e.target.value) < 0) {
                          const newData = {
                            ...selectedElement.properties.assignmentData,
                            points: 1
                          };
                          onUpdate({
                            properties: {
                              ...selectedElement.properties,
                              assignmentData: newData
                            }
                          });
                        }
                      }}
                      className="h-6 text-xs"
                      min="0"
                      max="100"
                      placeholder="1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Difficulty Level Section */}
            {selectedElement.properties.assignmentData.difficultyLevel !== undefined && (
              <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Сложность:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={`cursor-pointer transition-colors ${
                        star <= (selectedElement.properties.assignmentData.difficultyLevel || 1)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                      onClick={() => {
                        const newData = {
                          ...selectedElement.properties.assignmentData,
                          difficultyLevel: star
                        };
                        onUpdate({
                          properties: {
                            ...selectedElement.properties,
                            assignmentData: newData
                          }
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Time Limit Section */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Время (мин):</span>
              <div className="w-16">
                <Input
                  type="number"
                  value={selectedElement.properties.assignmentData.timeLimit || ''}
                  onChange={(e) => {
                    e.preventDefault();
                    const newData = {
                      ...selectedElement.properties.assignmentData,
                      timeLimit: e.target.value ? Number(e.target.value) : null
                    };
                    onUpdate({
                      properties: {
                        ...selectedElement.properties,
                        assignmentData: newData
                      }
                    });
                  }}
                  className="h-6 text-xs"
                  placeholder="∞"
                  min="1"
                />
              </div>
            </div>

            {/* Show Correct Answer Toggle */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Показать ответы:</span>
              <input
                type="checkbox"
                checked={selectedElement.properties.assignmentData.showCorrectAnswer || false}
                onChange={(e) => {
                  e.preventDefault();
                  const newData = {
                    ...selectedElement.properties.assignmentData,
                    showCorrectAnswer: e.target.checked
                  };
                  onUpdate({
                    properties: {
                      ...selectedElement.properties,
                      assignmentData: newData
                    }
                  });
                }}
                className="w-4 h-4"
              />
            </div>

            {/* Advanced Options Editor Button */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsAssignmentEditorOpen(true)}
                className="flex items-center gap-1 h-6 px-2 text-xs"
              >
                <Edit className="w-3 h-3" />
                Редактировать задание
              </Button>
            </div>

            {/* Quick preview of options */}
            {selectedElement.properties.assignmentData.options && (
              <div className="col-span-full border-t border-gray-200 pt-2 mt-2">
                <span className="text-xs font-medium text-gray-700">Варианты ответов:</span>
                <div className="text-xs text-gray-600 mt-1 max-w-full overflow-hidden">
                  {selectedElement.properties.assignmentData.options.slice(0, 3).map((option, index) => (
                    <span key={option.id} className="inline-block mr-2">
                      {index + 1}. {option.text.length > 20 ? option.text.substring(0, 20) + '...' : option.text}
                      {option.isCorrect && ' ✓'}
                    </span>
                  ))}
                  {selectedElement.properties.assignmentData.options.length > 3 && (
                    <span className="text-gray-400">и ещё {selectedElement.properties.assignmentData.options.length - 3}...</span>
                  )}
                </div>
              </div>
            )}

            {/* Quick preview for fill-in-blank */}
            {selectedElement.properties.assignmentType === 'fill-in-blank' && selectedElement.properties.assignmentData.textWithBlanks && (
              <div className="col-span-full border-t border-gray-200 pt-2 mt-2">
                <span className="text-xs font-medium text-gray-700">Текст с пропусками:</span>
                <div className="text-xs text-gray-600 mt-1 max-w-full overflow-hidden">
                  {selectedElement.properties.assignmentData.textWithBlanks.length > 60 
                    ? selectedElement.properties.assignmentData.textWithBlanks.substring(0, 60) + '...'
                    : selectedElement.properties.assignmentData.textWithBlanks}
                </div>
                {selectedElement.properties.assignmentData.correctAnswerType && (
                  <div className="text-xs text-gray-500 mt-1">
                    Тип ответа: {getFillInBlankAnswerTypeLabel(selectedElement.properties.assignmentData.correctAnswerType)}
                  </div>
                )}
              </div>
            )}
            
            {/* Color Settings for Assignment */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Фон:</span>
              <input
                type="color"
                value={selectedElement.properties.backgroundColor || '#ffffff'}
                onChange={(e) => {
                  onUpdate({
                    properties: {
                      ...selectedElement.properties,
                      backgroundColor: e.target.value
                    }
                  });
                }}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                title="Цвет фона"
              />
            </div>
            
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Текст:</span>
              <input
                type="color"
                value={selectedElement.properties.color || '#000000'}
                onChange={(e) => {
                  onUpdate({
                    properties: {
                      ...selectedElement.properties,
                      color: e.target.value
                    }
                  });
                }}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                title="Цвет текста"
              />
            </div>
            
            {/* Reset Colors Button */}
            <button
              onClick={() => {
                onUpdate({
                  properties: {
                    ...selectedElement.properties,
                    backgroundColor: '#ffffff',
                    color: '#000000'
                  }
                });
              }}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
              title="Сбросить цвета"
            >
              Сброс
            </button>
          </>
        )}
      </div>
    </div>
    
    {/* Assignment Options Editor Modal */}
    {isAssignmentEditorOpen && selectedElement.type === 'assignment' && (
      <AssignmentOptionsEditor
        element={selectedElement}
        onUpdate={onUpdate}
        onClose={() => setIsAssignmentEditorOpen(false)}
      />
    )}
  </>
  );
}