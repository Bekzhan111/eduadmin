import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Check, X, Move, ArrowUp, ArrowDown } from 'lucide-react';
import { CanvasElement } from './types';

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