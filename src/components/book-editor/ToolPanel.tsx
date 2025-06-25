import React from 'react';
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, DragOverEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { 
  Type, Square, Circle, Image as ImageIcon, Minus, AlignLeft, Triangle, Star, Heart, Video, Volume2, ArrowRight, LucideIcon, Sigma, BarChart, LineChart, PieChart, Table, HelpCircle, ListChecks, Edit3, Target, CheckSquare,
  // Icons category imports
  Home, User, Settings, Search, Mail, Phone, Calendar, Clock, Map, Camera, Music, File, Folder, Download, Upload, Save, Copy, Trash, Plus, X, Check, Menu, Bell, AlertCircle, Info, Shield, Lock, Eye, ThumbsUp, MessageCircle, Share, Link, Zap, Award, Gift, Briefcase, Flag, Sun, Moon, Lightbulb, Battery, Wifi, Globe, Database, Code, Monitor, Smartphone, PlayCircle, Volume, Palette, Bookmark, Filter, RefreshCw
} from 'lucide-react';

import { DraggableTool } from './DraggableTool';
import { CanvasSettings, CanvasElement } from './types';

// Define Tool type
type Tool = {
  id: string;
  name: string;
  label: string;
  icon: LucideIcon;
  category: string;
  needsFileUpload: boolean;
  accepts?: string;
  hotkey: string;
};

// Define Category type
type Category = {
  id: string;
  label: string;
  icon: LucideIcon;
};

// Enhanced tool definitions with more elements and categories
const TOOLS: Tool[] = [
  // Content tools
  { id: 'text', name: 'Текст', label: 'Текст', icon: Type, category: 'content', needsFileUpload: false, hotkey: 'T' },
  { id: 'paragraph', name: 'Абзац', label: 'Абзац', icon: AlignLeft, category: 'content', needsFileUpload: false, hotkey: 'P' },
  { id: 'math', name: 'Формула', label: 'Формула', icon: Sigma, category: 'content', needsFileUpload: false, hotkey: 'M' },
  
  // Media tools
  { id: 'image', name: 'Изображение', label: 'Изображение', icon: ImageIcon, category: 'media', needsFileUpload: true, accepts: 'image/*', hotkey: 'I' },
  { id: 'video', name: 'Видео', label: 'Видео', icon: Video, category: 'media', needsFileUpload: true, accepts: 'video/*', hotkey: 'V' },
  { id: 'audio', name: 'Аудио', label: 'Аудио', icon: Volume2, category: 'media', needsFileUpload: true, accepts: 'audio/*', hotkey: 'U' },
  
  // Shape tools
  { id: 'rectangle', name: 'Прямоугольник', label: 'Прямоугольник', icon: Square, category: 'shapes', needsFileUpload: false, hotkey: 'R' },
  { id: 'circle', name: 'Круг', label: 'Круг', icon: Circle, category: 'shapes', needsFileUpload: false, hotkey: 'C' },
  { id: 'triangle', name: 'Треугольник', label: 'Треугольник', icon: Triangle, category: 'shapes', needsFileUpload: false, hotkey: '' },
  { id: 'star', name: 'Звезда', label: 'Звезда', icon: Star, category: 'shapes', needsFileUpload: false, hotkey: '' },
  { id: 'heart', name: 'Сердце', label: 'Сердце', icon: Heart, category: 'shapes', needsFileUpload: false, hotkey: '' },
  
  // Drawing tools
  { id: 'line', name: 'Линия', label: 'Линия', icon: Minus, category: 'drawing', needsFileUpload: false, hotkey: 'L' },
  { id: 'arrow', name: 'Стрелка', label: 'Стрелка', icon: ArrowRight, category: 'drawing', needsFileUpload: false, hotkey: 'A' },
  
  // Chart tools
  { id: 'bar-chart', name: 'Столбчатая диаграмма', label: 'Столбчатая', icon: BarChart, category: 'charts', needsFileUpload: false, hotkey: 'B' },
  { id: 'line-chart', name: 'Линейная диаграмма', label: 'Линейная', icon: LineChart, category: 'charts', needsFileUpload: false, hotkey: 'N' },
  { id: 'pie-chart', name: 'Круговая диаграмма', label: 'Круговая', icon: PieChart, category: 'charts', needsFileUpload: false, hotkey: 'G' },
  
  // Table tools
  { id: 'table', name: 'Таблица', label: 'Таблица', icon: Table, category: 'tables', needsFileUpload: false, hotkey: 'D' },
  
  // Assignment tools
  { id: 'multiple-choice', name: 'Множественный выбор', label: 'Выбор ответа', icon: ListChecks, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'open-question', name: 'Открытый вопрос', label: 'Открытый вопрос', icon: Edit3, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'true-false', name: 'Верно/Неверно', label: 'Верно/Неверно', icon: CheckSquare, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'matching', name: 'Сопоставление', label: 'Сопоставление', icon: Target, category: 'assignments', needsFileUpload: false, hotkey: '' },
  { id: 'quiz', name: 'Викторина', label: 'Викторина', icon: HelpCircle, category: 'assignments', needsFileUpload: false, hotkey: '' },

  // Icon tools - Popular icons
  { id: 'icon-home', name: 'Иконка Дом', label: 'Дом', icon: Home, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-user', name: 'Иконка Пользователь', label: 'Пользователь', icon: User, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-settings', name: 'Иконка Настройки', label: 'Настройки', icon: Settings, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-search', name: 'Иконка Поиск', label: 'Поиск', icon: Search, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-mail', name: 'Иконка Почта', label: 'Почта', icon: Mail, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-phone', name: 'Иконка Телефон', label: 'Телефон', icon: Phone, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-calendar', name: 'Иконка Календарь', label: 'Календарь', icon: Calendar, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-clock', name: 'Иконка Часы', label: 'Часы', icon: Clock, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-map', name: 'Иконка Карта', label: 'Карта', icon: Map, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-camera', name: 'Иконка Камера', label: 'Камера', icon: Camera, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-music', name: 'Иконка Музыка', label: 'Музыка', icon: Music, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-file', name: 'Иконка Файл', label: 'Файл', icon: File, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-folder', name: 'Иконка Папка', label: 'Папка', icon: Folder, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-download', name: 'Иконка Скачать', label: 'Скачать', icon: Download, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-upload', name: 'Иконка Загрузить', label: 'Загрузить', icon: Upload, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-save', name: 'Иконка Сохранить', label: 'Сохранить', icon: Save, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-copy', name: 'Иконка Копировать', label: 'Копировать', icon: Copy, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-trash', name: 'Иконка Корзина', label: 'Корзина', icon: Trash, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-plus', name: 'Иконка Плюс', label: 'Плюс', icon: Plus, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-x', name: 'Иконка Крестик', label: 'Крестик', icon: X, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-check', name: 'Иконка Галочка', label: 'Галочка', icon: Check, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-menu', name: 'Иконка Меню', label: 'Меню', icon: Menu, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-bell', name: 'Иконка Уведомления', label: 'Звонок', icon: Bell, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-alert', name: 'Иконка Предупреждение', label: 'Внимание', icon: AlertCircle, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-info', name: 'Иконка Информация', label: 'Инфо', icon: Info, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-warning', name: 'Иконка Осторожно', label: 'Осторожно', icon: AlertCircle, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-shield', name: 'Иконка Защита', label: 'Щит', icon: Shield, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-lock', name: 'Иконка Замок', label: 'Замок', icon: Lock, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-eye', name: 'Иконка Глаз', label: 'Глаз', icon: Eye, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-thumbs-up', name: 'Иконка Лайк', label: 'Лайк', icon: ThumbsUp, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-message', name: 'Иконка Сообщение', label: 'Сообщение', icon: MessageCircle, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-share', name: 'Иконка Поделиться', label: 'Поделиться', icon: Share, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-link', name: 'Иконка Ссылка', label: 'Ссылка', icon: Link, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-zap', name: 'Иконка Молния', label: 'Молния', icon: Zap, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-award', name: 'Иконка Награда', label: 'Награда', icon: Award, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-gift', name: 'Иконка Подарок', label: 'Подарок', icon: Gift, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-briefcase', name: 'Иконка Портфель', label: 'Портфель', icon: Briefcase, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-flag', name: 'Иконка Флаг', label: 'Флаг', icon: Flag, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-sun', name: 'Иконка Солнце', label: 'Солнце', icon: Sun, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-moon', name: 'Иконка Луна', label: 'Луна', icon: Moon, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-lightbulb', name: 'Иконка Лампочка', label: 'Лампочка', icon: Lightbulb, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-battery', name: 'Иконка Батарея', label: 'Батарея', icon: Battery, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-wifi', name: 'Иконка WiFi', label: 'WiFi', icon: Wifi, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-globe', name: 'Иконка Глобус', label: 'Глобус', icon: Globe, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-database', name: 'Иконка База данных', label: 'БД', icon: Database, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-code', name: 'Иконка Код', label: 'Код', icon: Code, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-monitor', name: 'Иконка Монитор', label: 'Монитор', icon: Monitor, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-smartphone', name: 'Иконка Смартфон', label: 'Телефон', icon: Smartphone, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-play', name: 'Иконка Воспроизведение', label: 'Играть', icon: PlayCircle, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-volume', name: 'Иконка Громкость', label: 'Громкость', icon: Volume, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-palette', name: 'Иконка Палитра', label: 'Палитра', icon: Palette, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-bookmark', name: 'Иконка Закладка', label: 'Закладка', icon: Bookmark, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-filter', name: 'Иконка Фильтр', label: 'Фильтр', icon: Filter, category: 'icons', needsFileUpload: false, hotkey: '' },
  { id: 'icon-refresh', name: 'Иконка Обновить', label: 'Обновить', icon: RefreshCw, category: 'icons', needsFileUpload: false, hotkey: '' },
];

const TOOL_CATEGORIES: Category[] = [
  { id: 'content', label: 'Текст', icon: Type },
  { id: 'shapes', label: 'Фигуры', icon: Square },
  { id: 'media', label: 'Медиа', icon: ImageIcon },
  { id: 'drawing', label: 'Рисование', icon: Minus },
  { id: 'charts', label: 'Диаграммы', icon: BarChart },
  { id: 'tables', label: 'Таблицы', icon: Table },
  { id: 'assignments', label: 'Задания', icon: HelpCircle },
  { id: 'icons', label: 'Иконки', icon: Home },
];

interface ToolPanelProps {
  canvasSettings: CanvasSettings;
  activeCategory: string;
  onChangeCategory: (categoryId: string) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  activeElement: CanvasElement | null;
  onMediaUploaded?: (url: string, type: string) => void;
}

export function ToolPanel({
  canvasSettings,
  activeCategory,
  onChangeCategory,
  onDragStart,
  onDragEnd,
  onDragOver,
  activeElement,
  onMediaUploaded,
}: ToolPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  return (
    <div className="border-r w-64 flex flex-col bg-gray-50 dark:bg-gray-800">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Инструменты</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Tool categories */}
        <div className="p-2 grid grid-cols-2 gap-1 text-center min-h-fit">
          {TOOL_CATEGORIES.map(category => (
            <button
              key={category.id}
              className={`p-2 rounded-md flex flex-col items-center justify-center text-xs min-h-[60px] ${
                activeCategory === category.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              onClick={() => onChangeCategory(category.id)}
            >
              {<category.icon className="h-5 w-5 mb-1" />}
              {category.label}
            </button>
          ))}
        </div>
        
        {/* Tool items */}
        <div className="p-2">
          <DndContext 
            sensors={sensors} 
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
          >
            <div className="grid grid-cols-2 gap-2">
              {TOOLS.filter(tool => tool.category === activeCategory).map(tool => (
                <DraggableTool 
                  key={tool.id} 
                  tool={tool} 
                  canvasSettings={canvasSettings}
                  onMediaUploaded={onMediaUploaded}
                />
              ))}
            </div>
            
            <DragOverlay>
              {activeElement && (
                <div className="bg-white border shadow-lg p-2 rounded-md">
                  {activeElement.type === 'text' && (
                    <div style={{ fontFamily: activeElement.properties?.fontFamily || 'Arial' }}>
                      {activeElement.content}
                    </div>
                  )}
                  {activeElement.type === 'shape' && (
                    <div 
                      style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: activeElement.properties?.backgroundColor || '#e0e0e0',
                        borderRadius: activeElement.properties?.shapeType === 'circle' ? '50%' : '0',
                      }}
                    ></div>
                  )}
                  {activeElement.type === 'image' && (
                    <div style={{ width: '50px', height: '50px' }}>
                      <ImageIcon className="h-full w-full text-gray-400" />
                    </div>
                  )}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  );
} 
