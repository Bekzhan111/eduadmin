import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Check, X, Move, ArrowUp, ArrowDown } from 'lucide-react';
import { CanvasElement, FillInBlankCorrectAnswerType, FILL_IN_BLANK_ANSWER_TYPES } from './types';

type AssignmentOptionsEditorProps = {
  element: CanvasElement;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onClose: () => void;
};

export function AssignmentOptionsEditor({ element, onUpdate, onClose }: AssignmentOptionsEditorProps) {
  const assignmentData = element.properties.assignmentData;
  const assignmentType = element.properties.assignmentType;
  
  if (!assignmentData) return null;

  const updateAssignmentData = (newData: any) => {
    onUpdate({
      properties: {
        ...element.properties,
        assignmentData: {
          ...assignmentData,
          ...newData
        }
      }
    });
  };

  const renderMultipleChoiceOptions = () => {
    const options = assignmentData.options || [];

    const addOption = () => {
      const newOption = {
        id: `opt${Date.now()}`,
        text: `Новый вариант ${options.length + 1}`,
        isCorrect: false
      };
      updateAssignmentData({
        options: [...options, newOption]
      });
    };

    const removeOption = (optionId: string) => {
      updateAssignmentData({
        options: options.filter(opt => opt.id !== optionId)
      });
    };

    const updateOption = (optionId: string, updates: any) => {
      updateAssignmentData({
        options: options.map(opt => 
          opt.id === optionId ? { ...opt, ...updates } : opt
        )
      });
    };

    const moveOption = (optionId: string, direction: 'up' | 'down') => {
      const index = options.findIndex(opt => opt.id === optionId);
      if ((direction === 'up' && index > 0) || (direction === 'down' && index < options.length - 1)) {
        const newOptions = [...options];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newOptions[index], newOptions[targetIndex]] = [newOptions[targetIndex], newOptions[index]];
        updateAssignmentData({ options: newOptions });
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Варианты ответов</h3>
          <Button onClick={addOption} size="sm" className="flex items-center gap-1">
            <Plus className="w-4 h-4" />
            Добавить вариант
          </Button>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2 p-3 border rounded-lg">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveOption(option.id, 'up')}
                  disabled={index === 0}
                  className="p-1 h-6 w-6"
                >
                  <ArrowUp className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveOption(option.id, 'down')}
                  disabled={index === options.length - 1}
                  className="p-1 h-6 w-6"
                >
                  <ArrowDown className="w-3 h-3" />
                </Button>
              </div>
              
              <div className="flex-1">
                <Input
                  value={option.text}
                  onChange={(e) => updateOption(option.id, { text: e.target.value })}
                  placeholder={`Вариант ${index + 1}`}
                  className="text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type={assignmentType === 'multiple-select' ? 'checkbox' : 'radio'}
                    name={assignmentType === 'multiple-select' ? undefined : 'correct-answer'}
                    checked={option.isCorrect}
                    onChange={(e) => {
                      if (assignmentType === 'multiple-select') {
                        updateOption(option.id, { isCorrect: e.target.checked });
                      } else {
                        // For single choice, uncheck all others
                        updateAssignmentData({
                          options: options.map(opt => ({
                            ...opt,
                            isCorrect: opt.id === option.id ? e.target.checked : false
                          }))
                        });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  Правильный
                </label>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(option.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  disabled={options.length <= 2}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFillInBlankEditor = () => {
    const textWithBlanks = assignmentData.textWithBlanks || '';
    const blanks = assignmentData.blanks || [];
    const correctAnswerType = assignmentData.correctAnswerType || 'SINGLE';

    const updateText = (newText: string) => {
      // Count blanks in the new text
      const blankCount = (newText.match(/____/g) || []).length;
      
      // Update blanks array to match
      const newBlanks = Array.from({ length: blankCount }, (_, index) => {
        const existingBlank = blanks[index];
        return existingBlank || {
          id: `blank${index + 1}`,
          position: index,
          answer: '',
          caseSensitive: false
        };
      });

      updateAssignmentData({
        textWithBlanks: newText,
        blanks: newBlanks,
        correctAnswers: newBlanks.map(blank => blank.answer)
      });
    };

    const updateBlank = (index: number, updates: any) => {
      const newBlanks = blanks.map((blank, i) => 
        i === index ? { ...blank, ...updates } : blank
      );
      updateAssignmentData({
        blanks: newBlanks,
        correctAnswers: newBlanks.map(blank => blank.answer)
      });
    };

    const updateCorrectAnswerType = (newType: FillInBlankCorrectAnswerType) => {
      updateAssignmentData({
        correctAnswerType: newType
      });
    };

    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-semibold">Текст с пропусками</Label>
          <p className="text-xs text-gray-500 mb-2">
            Используйте ____ (4 подчеркивания) для обозначения пропусков
          </p>
          <textarea
            value={textWithBlanks}
            onChange={(e) => updateText(e.target.value)}
            className="w-full h-24 p-2 border rounded-md text-sm"
            placeholder="Введите текст с пропусками. Например: В году есть ____ месяцев и ____ времени года."
          />
        </div>

        {/* Выпадающий список для типа правильного ответа */}
        <div>
          <Label className="text-sm font-semibold">Тип правильного ответа</Label>
          <Select value={correctAnswerType} onValueChange={updateCorrectAnswerType}>
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Выберите тип правильного ответа" />
            </SelectTrigger>
            <SelectContent>
              {FILL_IN_BLANK_ANSWER_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {blanks.length > 0 && (
          <div>
            <Label className="text-sm font-semibold">Правильные ответы для пропусков</Label>
            <div className="space-y-2 mt-2">
              {blanks.map((blank, index) => (
                <div key={blank.id} className="flex items-center gap-2 p-2 border rounded">
                  <span className="text-sm font-medium w-20">Пропуск {index + 1}:</span>
                  <Input
                    value={blank.answer}
                    onChange={(e) => updateBlank(index, { answer: e.target.value })}
                    placeholder="Правильный ответ"
                    className="flex-1 text-sm"
                  />
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={!blank.caseSensitive}
                      onChange={(e) => updateBlank(index, { caseSensitive: !e.target.checked })}
                      className="w-3 h-3"
                    />
                    Игнорировать регистр
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHotspotsEditor = () => {
    const hotspots = assignmentData.hotspots || [];

    const addHotspot = () => {
      const newHotspot = {
        id: `spot${Date.now()}`,
        x: 100,
        y: 100,
        radius: 20,
        label: `Элемент ${hotspots.length + 1}`,
        feedback: 'Правильно!',
        isCorrect: true
      };
      updateAssignmentData({
        hotspots: [...hotspots, newHotspot]
      });
    };

    const updateHotspot = (hotspotId: string, updates: any) => {
      updateAssignmentData({
        hotspots: hotspots.map(spot => 
          spot.id === hotspotId ? { ...spot, ...updates } : spot
        )
      });
    };

    const removeHotspot = (hotspotId: string) => {
      updateAssignmentData({
        hotspots: hotspots.filter(spot => spot.id !== hotspotId)
      });
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Интерактивные области</h3>
          <Button onClick={addHotspot} size="sm" className="flex items-center gap-1">
            <Plus className="w-4 h-4" />
            Добавить область
          </Button>
        </div>

        <div>
          <Label className="text-sm font-semibold">URL изображения</Label>
          <Input
            value={assignmentData.imageUrl || ''}
            onChange={(e) => updateAssignmentData({ imageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
            className="mt-1"
          />
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {hotspots.map((hotspot, index) => (
            <div key={hotspot.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Область {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeHotspot(hotspot.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Название</Label>
                  <Input
                    value={hotspot.label}
                    onChange={(e) => updateHotspot(hotspot.id, { label: e.target.value })}
                    className="text-sm"
                    placeholder="Название элемента"
                  />
                </div>
                <div>
                  <Label className="text-xs">Обратная связь</Label>
                  <Input
                    value={hotspot.feedback}
                    onChange={(e) => updateHotspot(hotspot.id, { feedback: e.target.value })}
                    className="text-sm"
                    placeholder="Сообщение при клике"
                  />
                </div>
                <div>
                  <Label className="text-xs">X позиция</Label>
                  <Input
                    type="number"
                    value={hotspot.x}
                    onChange={(e) => updateHotspot(hotspot.id, { x: Number(e.target.value) })}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y позиция</Label>
                  <Input
                    type="number"
                    value={hotspot.y}
                    onChange={(e) => updateHotspot(hotspot.id, { y: Number(e.target.value) })}
                    className="text-sm"
                  />
                </div>
              </div>
              
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hotspot.isCorrect}
                  onChange={(e) => updateHotspot(hotspot.id, { isCorrect: e.target.checked })}
                  className="w-4 h-4"
                />
                Правильная область
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderConnectPairsEditor = () => {
    const leftItems = assignmentData.leftItems || [];
    const rightItems = assignmentData.rightItems || [];

    const addPair = () => {
      const newId = Date.now();
      const leftId = `left${newId}`;
      const rightId = `right${newId}`;
      
      updateAssignmentData({
        leftItems: [...leftItems, { id: leftId, content: `Понятие ${leftItems.length + 1}`, type: 'text' }],
        rightItems: [...rightItems, { id: rightId, content: `Определение ${rightItems.length + 1}`, type: 'text', matchWith: leftId }]
      });
    };

    const updateLeftItem = (itemId: string, content: string) => {
      updateAssignmentData({
        leftItems: leftItems.map(item => 
          item.id === itemId ? { ...item, content } : item
        )
      });
    };

    const updateRightItem = (itemId: string, content: string) => {
      updateAssignmentData({
        rightItems: rightItems.map(item => 
          item.id === itemId ? { ...item, content } : item
        )
      });
    };

    const removePair = (leftId: string) => {
      const rightItem = rightItems.find(item => item.matchWith === leftId);
      updateAssignmentData({
        leftItems: leftItems.filter(item => item.id !== leftId),
        rightItems: rightItems.filter(item => item.id !== rightItem?.id)
      });
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Пары для соединения</h3>
          <Button onClick={addPair} size="sm" className="flex items-center gap-1">
            <Plus className="w-4 h-4" />
            Добавить пару
          </Button>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {leftItems.map((leftItem, index) => {
            const rightItem = rightItems.find(item => item.matchWith === leftItem.id);
            return (
              <div key={leftItem.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Пара {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePair(leftItem.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    disabled={leftItems.length <= 2}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Понятие (левый столбец)</Label>
                    <Input
                      value={leftItem.content}
                      onChange={(e) => updateLeftItem(leftItem.id, e.target.value)}
                      className="text-sm"
                      placeholder="Понятие"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Определение (правый столбец)</Label>
                    <Input
                      value={rightItem?.content || ''}
                      onChange={(e) => updateRightItem(rightItem?.id || '', e.target.value)}
                      className="text-sm"
                      placeholder="Определение"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderConceptMapEditor = () => {
    const conceptMap = assignmentData.conceptMap || { cells: [], connections: [], rows: 3, cols: 3 };
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Настройка карты понятий</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold">Строки</Label>
            <Input
              type="number"
              value={conceptMap.rows}
              onChange={(e) => updateAssignmentData({
                conceptMap: { ...conceptMap, rows: Number(e.target.value) }
              })}
              min={2}
              max={10}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-semibold">Столбцы</Label>
            <Input
              type="number"
              value={conceptMap.cols}
              onChange={(e) => updateAssignmentData({
                conceptMap: { ...conceptMap, cols: Number(e.target.value) }
              })}
              min={2}
              max={10}
              className="mt-1"
            />
          </div>
        </div>
        
        <div>
          <Label className="text-sm font-semibold">Содержимое ячеек</Label>
          <p className="text-xs text-gray-500 mb-2">Добавьте текст для ячеек карты понятий</p>
          <div className="space-y-2">
            {Array.from({ length: conceptMap.rows * conceptMap.cols }, (_, index) => {
              const row = Math.floor(index / conceptMap.cols);
              const col = index % conceptMap.cols;
              const existingCell = conceptMap.cells.find(c => c.row === row && c.col === col);
              
              return (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm w-16">({row + 1},{col + 1})</span>
                  <Input
                    placeholder="Содержимое ячейки"
                    value={existingCell?.content || ''}
                    onChange={(e) => {
                      const newCells = conceptMap.cells.filter(c => !(c.row === row && c.col === col));
                      if (e.target.value.trim()) {
                        newCells.push({ id: `cell-${row}-${col}`, row, col, content: e.target.value });
                      }
                      updateAssignmentData({
                        conceptMap: { ...conceptMap, cells: newCells }
                      });
                    }}
                    className="flex-1"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDragToPointEditor = () => {
    const dragItems = assignmentData.dragItems || [];
    const dropZones = assignmentData.dropZones || [];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Настройка перетаскивания</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-sm mb-2">Элементы для перетаскивания</h4>
            <div className="space-y-2">
              {dragItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Input
                    value={item.content}
                    onChange={(e) => {
                      const newItems = [...dragItems];
                      newItems[index] = { ...item, content: e.target.value };
                      updateAssignmentData({ dragItems: newItems });
                    }}
                    placeholder="Содержимое элемента"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newItems = dragItems.filter((_, i) => i !== index);
                      updateAssignmentData({ dragItems: newItems });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => {
                  const newItem = { id: `item${Date.now()}`, content: `Элемент ${dragItems.length + 1}` };
                  updateAssignmentData({ dragItems: [...dragItems, newItem] });
                }}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Добавить элемент
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm mb-2">Зоны для размещения</h4>
            <div className="space-y-2">
              {dropZones.map((zone, index) => (
                <div key={zone.id} className="border rounded p-3 space-y-2">
                  <Input
                    value={zone.label}
                    onChange={(e) => {
                      const newZones = [...dropZones];
                      newZones[index] = { ...zone, label: e.target.value };
                      updateAssignmentData({ dropZones: newZones });
                    }}
                    placeholder="Название зоны"
                  />
                  <select
                    value={zone.correctAnswer || ''}
                    onChange={(e) => {
                      const newZones = [...dropZones];
                      newZones[index] = { ...zone, correctAnswer: e.target.value };
                      updateAssignmentData({ dropZones: newZones });
                    }}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Выберите правильный ответ</option>
                    {dragItems.map(item => (
                      <option key={item.id} value={item.id}>{item.content}</option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newZones = dropZones.filter((_, i) => i !== index);
                      updateAssignmentData({ dropZones: newZones });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => {
                  const newZone = { id: `zone${Date.now()}`, label: `Зона ${dropZones.length + 1}`, correctAnswer: '' };
                  updateAssignmentData({ dropZones: [...dropZones, newZone] });
                }}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Добавить зону
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWordGridEditor = () => {
    const hiddenWords = assignmentData.hiddenWords || [];
    const gridSize = assignmentData.gridSize || 10;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Настройка сетки слов</h3>
        </div>
        
        <div>
          <Label className="text-sm font-semibold">Размер сетки</Label>
          <Input
            type="number"
            value={gridSize}
            onChange={(e) => updateAssignmentData({ gridSize: Number(e.target.value) })}
            min={5}
            max={20}
            className="mt-1 w-24"
          />
        </div>
        
        <div>
          <Label className="text-sm font-semibold">Слова для поиска</Label>
          <div className="space-y-2 mt-2">
            {hiddenWords.map((word, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={word}
                  onChange={(e) => {
                    const newWords = [...hiddenWords];
                    newWords[index] = e.target.value;
                    updateAssignmentData({ hiddenWords: newWords });
                  }}
                  placeholder="Введите слово"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newWords = hiddenWords.filter((_, i) => i !== index);
                    updateAssignmentData({ hiddenWords: newWords });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              onClick={() => {
                updateAssignmentData({ hiddenWords: [...hiddenWords, ''] });
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Добавить слово
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderNumbersOnImageEditor = () => {
    const options = assignmentData.options || [];
    const numberPoints = assignmentData.numberPoints || [];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Настройка чисел на изображении</h3>
        </div>
        
        <div>
          <Label className="text-sm font-semibold">URL изображения</Label>
          <Input
            value={assignmentData.imageUrl || ''}
            onChange={(e) => updateAssignmentData({ imageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
            className="mt-1"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-sm mb-2">Варианты ответов</h4>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <span className="text-sm w-8">{index + 1}.</span>
                  <Input
                    value={option.text}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[index] = { ...option, text: e.target.value };
                      updateAssignmentData({ options: newOptions });
                    }}
                    placeholder="Текст варианта"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newOptions = options.filter((_, i) => i !== index);
                      updateAssignmentData({ options: newOptions });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => {
                  const newOption = { id: `opt${Date.now()}`, text: `Вариант ${options.length + 1}` };
                  updateAssignmentData({ options: [...options, newOption] });
                }}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Добавить вариант
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm mb-2">Точки на изображении</h4>
            <div className="space-y-2">
              {numberPoints.map((point, index) => (
                <div key={point.id} className="border rounded p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">X позиция</Label>
                      <Input
                        type="number"
                        value={point.x}
                        onChange={(e) => {
                          const newPoints = [...numberPoints];
                          newPoints[index] = { ...point, x: Number(e.target.value) };
                          updateAssignmentData({ numberPoints: newPoints });
                        }}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y позиция</Label>
                      <Input
                        type="number"
                        value={point.y}
                        onChange={(e) => {
                          const newPoints = [...numberPoints];
                          newPoints[index] = { ...point, y: Number(e.target.value) };
                          updateAssignmentData({ numberPoints: newPoints });
                        }}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Правильный ответ</Label>
                    <select
                      value={point.correctAnswer || ''}
                      onChange={(e) => {
                        const newPoints = [...numberPoints];
                        newPoints[index] = { ...point, correctAnswer: e.target.value };
                        updateAssignmentData({ numberPoints: newPoints });
                      }}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value="">Выберите правильный ответ</option>
                      {options.map(option => (
                        <option key={option.id} value={option.id}>{option.text}</option>
                      ))}
                    </select>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newPoints = numberPoints.filter((_, i) => i !== index);
                      updateAssignmentData({ numberPoints: newPoints });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => {
                  const newPoint = { id: `point${Date.now()}`, x: 100, y: 100, label: `Точка ${numberPoints.length + 1}`, correctAnswer: '' };
                  updateAssignmentData({ numberPoints: [...numberPoints, newPoint] });
                }}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Добавить точку
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGroupingEditor = () => {
    const items = assignmentData.items || [];
    const groups = assignmentData.groups || [];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Настройка группировки</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-sm mb-2">Элементы для группировки</h4>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Input
                    value={item.content}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index] = { ...item, content: e.target.value };
                      updateAssignmentData({ items: newItems });
                    }}
                    placeholder="Содержимое элемента"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newItems = items.filter((_, i) => i !== index);
                      updateAssignmentData({ items: newItems });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => {
                  const newItem = { id: `item${Date.now()}`, content: `Элемент ${items.length + 1}`, type: 'text' };
                  updateAssignmentData({ items: [...items, newItem] });
                }}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Добавить элемент
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm mb-2">Группы</h4>
            <div className="space-y-2">
              {groups.map((group, index) => (
                <div key={group.id} className="border rounded p-3 space-y-2">
                  <Input
                    value={group.name}
                    onChange={(e) => {
                      const newGroups = [...groups];
                      newGroups[index] = { ...group, name: e.target.value };
                      updateAssignmentData({ groups: newGroups });
                    }}
                    placeholder="Название группы"
                  />
                  <div>
                    <Label className="text-xs">Правильные элементы (выберите несколько)</Label>
                    <div className="space-y-1 mt-1">
                      {items.map(item => (
                        <label key={item.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={group.correctItems?.includes(item.id) || false}
                            onChange={(e) => {
                              const newGroups = [...groups];
                              const currentItems = newGroups[index].correctItems || [];
                              if (e.target.checked) {
                                newGroups[index].correctItems = [...currentItems, item.id];
                              } else {
                                newGroups[index].correctItems = currentItems.filter(id => id !== item.id);
                              }
                              updateAssignmentData({ groups: newGroups });
                            }}
                            className="w-4 h-4"
                          />
                          {item.content}
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newGroups = groups.filter((_, i) => i !== index);
                      updateAssignmentData({ groups: newGroups });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => {
                  const newGroup = { id: `group${Date.now()}`, name: `Группа ${groups.length + 1}`, correctItems: [] };
                  updateAssignmentData({ groups: [...groups, newGroup] });
                }}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Добавить группу
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrderingEditor = () => {
    const items = assignmentData.items || [];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Настройка упорядочивания</h3>
        </div>
        
        <div>
          <h4 className="font-semibold text-sm mb-2">Элементы для упорядочивания</h4>
          <p className="text-xs text-gray-500 mb-2">Расположите элементы в правильном порядке</p>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="text-sm w-8">{index + 1}.</span>
                <Input
                  value={item.content}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index] = { ...item, content: e.target.value };
                    updateAssignmentData({ items: newItems });
                  }}
                  placeholder="Содержимое элемента"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveItem(index, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveItem(index, 'down')}
                  disabled={index === items.length - 1}
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newItems = items.filter((_, i) => i !== index);
                    updateAssignmentData({ items: newItems });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              onClick={() => {
                const newItem = { id: `item${Date.now()}`, content: `Элемент ${items.length + 1}`, type: 'text' };
                updateAssignmentData({ items: [...items, newItem] });
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Добавить элемент
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderCrosswordEditor = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Настройка кроссворда</h3>
        </div>
        
        <div className="text-center text-gray-500 py-8">
          <p>Редактор кроссворда находится в разработке.</p>
          <p className="text-sm mt-1">Используйте стандартные настройки в панели свойств.</p>
        </div>
      </div>
    );
  };

  const renderHighlightWordsEditor = () => {
    const wordsToHighlight = assignmentData.wordsToHighlight || [];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Настройка выделения слов</h3>
        </div>
        
        <div>
          <Label className="text-sm font-semibold">Текст для анализа</Label>
          <textarea
            value={assignmentData.textContent || ''}
            onChange={(e) => updateAssignmentData({ textContent: e.target.value })}
            className="w-full h-32 p-2 border rounded-md text-sm mt-1"
            placeholder="Введите текст, в котором нужно выделить слова"
          />
        </div>
        
        <div>
          <Label className="text-sm font-semibold">Слова для выделения</Label>
          <div className="space-y-2 mt-2">
            {wordsToHighlight.map((word, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={word}
                  onChange={(e) => {
                    const newWords = [...wordsToHighlight];
                    newWords[index] = e.target.value;
                    updateAssignmentData({ wordsToHighlight: newWords });
                  }}
                  placeholder="Слово для выделения"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newWords = wordsToHighlight.filter((_, i) => i !== index);
                    updateAssignmentData({ wordsToHighlight: newWords });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              onClick={() => {
                updateAssignmentData({ wordsToHighlight: [...wordsToHighlight, ''] });
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Добавить слово
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderTextEditingEditor = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Настройка редактирования текста</h3>
        </div>
        
        <div>
          <Label className="text-sm font-semibold">Исходный текст</Label>
          <textarea
            value={assignmentData.originalText || ''}
            onChange={(e) => updateAssignmentData({ originalText: e.target.value })}
            className="w-full h-32 p-2 border rounded-md text-sm mt-1"
            placeholder="Введите текст, который нужно отредактировать"
          />
        </div>
        
        <div>
          <Label className="text-sm font-semibold">Инструкции по редактированию</Label>
          <textarea
            value={assignmentData.editingInstructions || ''}
            onChange={(e) => updateAssignmentData({ editingInstructions: e.target.value })}
            className="w-full h-24 p-2 border rounded-md text-sm mt-1"
            placeholder="Укажите, что нужно исправить в тексте"
          />
        </div>
        
        <div>
          <Label className="text-sm font-semibold">Ожидаемый результат</Label>
          <textarea
            value={assignmentData.expectedResult || ''}
            onChange={(e) => updateAssignmentData({ expectedResult: e.target.value })}
            className="w-full h-32 p-2 border rounded-md text-sm mt-1"
            placeholder="Введите правильно отредактированный текст"
          />
        </div>
      </div>
    );
  };

  const renderTextHighlightingEditor = () => {
    const correctHighlights = assignmentData.correctHighlights || [];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Настройка выделения текста</h3>
        </div>
        
        <div>
          <Label className="text-sm font-semibold">Текст для выделения</Label>
          <textarea
            value={assignmentData.textContent || ''}
            onChange={(e) => updateAssignmentData({ textContent: e.target.value })}
            className="w-full h-32 p-2 border rounded-md text-sm mt-1"
            placeholder="Введите текст для выделения"
          />
        </div>
        
        <div>
          <Label className="text-sm font-semibold">Инструкции</Label>
          <textarea
            value={assignmentData.highlightInstructions || ''}
            onChange={(e) => updateAssignmentData({ highlightInstructions: e.target.value })}
            className="w-full h-20 p-2 border rounded-md text-sm mt-1"
            placeholder="Укажите, что нужно выделить в тексте"
          />
        </div>
        
        <div>
          <Label className="text-sm font-semibold">Правильные выделения</Label>
          <div className="space-y-2 mt-2">
            {correctHighlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={highlight}
                  onChange={(e) => {
                    const newHighlights = [...correctHighlights];
                    newHighlights[index] = e.target.value;
                    updateAssignmentData({ correctHighlights: newHighlights });
                  }}
                  placeholder="Фраза для выделения"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newHighlights = correctHighlights.filter((_, i) => i !== index);
                    updateAssignmentData({ correctHighlights: newHighlights });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              onClick={() => {
                updateAssignmentData({ correctHighlights: [...correctHighlights, ''] });
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Добавить выделение
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderHintEditor = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Настройка подсказки</h3>
        </div>
        
        <div>
          <Label className="text-sm font-semibold">Текст подсказки</Label>
          <textarea
            value={assignmentData.hintText || ''}
            onChange={(e) => updateAssignmentData({ hintText: e.target.value })}
            className="w-full h-24 p-2 border rounded-md text-sm mt-1"
            placeholder="Введите текст подсказки"
          />
        </div>
        
        <div>
          <Label className="text-sm font-semibold">Вопрос после подсказки (необязательно)</Label>
          <textarea
            value={assignmentData.followUpQuestion || ''}
            onChange={(e) => updateAssignmentData({ followUpQuestion: e.target.value })}
            className="w-full h-20 p-2 border rounded-md text-sm mt-1"
            placeholder="Введите вопрос, который появится после показа подсказки"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={assignmentData.showHint || false}
            onChange={(e) => updateAssignmentData({ showHint: e.target.checked })}
            className="w-4 h-4"
          />
          <Label className="text-sm">Показывать подсказку сразу (без кнопки)</Label>
        </div>
      </div>
    );
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const items = assignmentData.items || [];
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < items.length - 1)) {
      const newItems = [...items];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      updateAssignmentData({ items: newItems });
    }
  };

  const renderEditor = () => {
    switch (assignmentType) {
      case 'multiple-choice':
      case 'single-select':
      case 'multiple-select':
      case 'dropdown-select':
        return renderMultipleChoiceOptions();
      case 'fill-in-blank':
        return renderFillInBlankEditor();
      case 'image-hotspots':
        return renderHotspotsEditor();
      case 'connect-pairs':
        return renderConnectPairsEditor();
      case 'concept-map':
        return renderConceptMapEditor();
      case 'drag-to-point':
        return renderDragToPointEditor();
      case 'numbers-on-image':
        return renderNumbersOnImageEditor();
      case 'grouping':
        return renderGroupingEditor();
      case 'ordering':
        return renderOrderingEditor();
      case 'word-grid':
        return renderWordGridEditor();
      case 'crossword':
        return renderCrosswordEditor();
      case 'highlight-words':
        return renderHighlightWordsEditor();
      case 'text-editing':
        return renderTextEditingEditor();
      case 'text-highlighting':
        return renderTextHighlightingEditor();
      case 'hint':
        return renderHintEditor();
      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <p>Редактор для типа "{assignmentType}" пока не реализован</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Редактор задания</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {renderEditor()}
        </div>
        
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={onClose}>
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}