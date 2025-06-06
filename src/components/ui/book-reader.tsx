'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  List, 
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

interface BookReaderProps {
  bookData: {
    id: string;
    title: string;
    content?: string;
    chapters?: Array<{
      id: string;
      title: string;
      content: string;
      order: number;
    }>;
    styles?: string;
  };
  className?: string;
}

interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia';
  textAlign: 'left' | 'justify' | 'center';
}

const defaultSettings: ReaderSettings = {
  fontSize: 16,
  fontFamily: 'Georgia, serif',
  lineHeight: 1.6,
  theme: 'light',
  textAlign: 'justify'
};

const BookReader: React.FC<BookReaderProps> = ({ bookData, className = '' }) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);

  // Получаем список глав или создаем одну главу из контента
  const chapters = bookData.chapters || [
    {
      id: 'main',
      title: bookData.title,
      content: bookData.content || 'Содержимое книги не найдено.',
      order: 1
    }
  ];

  const currentChapterData = chapters[currentChapter];

  // Функции навигации
  const goToNextChapter = () => {
    if (currentChapter < chapters.length - 1) {
      setCurrentChapter(currentChapter + 1);
    }
  };

  const goToPreviousChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
    }
  };

  const goToChapter = (index: number) => {
    setCurrentChapter(index);
    setShowTableOfContents(false);
  };

  // Настройки чтения
  const increaseFontSize = () => {
    setSettings(prev => ({ ...prev, fontSize: Math.min(prev.fontSize + 2, 24) }));
  };

  const decreaseFontSize = () => {
    setSettings(prev => ({ ...prev, fontSize: Math.max(prev.fontSize - 2, 12) }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  // Стили для контента
  const getContentStyles = (): React.CSSProperties => {
    const themeStyles = {
      light: {
        backgroundColor: '#ffffff',
        color: '#1f2937'
      },
      dark: {
        backgroundColor: '#1f2937',
        color: '#f9fafb'
      },
      sepia: {
        backgroundColor: '#f7f3e9',
        color: '#3c2415'
      }
    };

    return {
      fontSize: `${settings.fontSize}px`,
      fontFamily: settings.fontFamily,
      lineHeight: settings.lineHeight,
      textAlign: settings.textAlign,
      ...themeStyles[settings.theme],
      padding: '2rem',
      minHeight: '600px'
    };
  };

  // CSS стили для книги (как в Project Gutenberg)
  const bookStyles = `
    .book-content {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .book-content h1 {
      font-size: 2.5em;
      text-align: center;
      margin: 1em 0;
      font-weight: normal;
      letter-spacing: 0.05em;
    }
    
    .book-content h2 {
      font-size: 1.8em;
      text-align: center;
      margin: 1.5em 0 1em 0;
      font-weight: normal;
    }
    
    .book-content h3 {
      font-size: 1.4em;
      margin: 1em 0 0.5em 0;
      font-weight: normal;
    }
    
    .book-content p {
      text-indent: 2em;
      margin: 0.5em 0;
      text-align: ${settings.textAlign};
    }
    
    .book-content p.no-indent {
      text-indent: 0;
    }
    
    .book-content .chapter-title {
      text-align: center;
      font-size: 1.5em;
      margin: 2em 0 1em 0;
      text-indent: 0;
    }
    
    .book-content blockquote {
      margin: 1em 2em;
      font-style: italic;
      border-left: 3px solid #ccc;
      padding-left: 1em;
    }
    
    .book-content hr {
      width: 50%;
      margin: 2em auto;
      border: none;
      border-top: 1px solid #ccc;
    }
    
    .book-content .poetry {
      text-align: center;
      text-indent: 0;
      font-style: italic;
      margin: 1em 0;
    }
  `;

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg ${className}`}>
      {/* Панель управления */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b rounded-t-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTableOfContents(!showTableOfContents)}
            >
              <List className="h-4 w-4 mr-2" />
              Содержание
            </Button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Глава {currentChapter + 1} из {chapters.length}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={decreaseFontSize}
              disabled={settings.fontSize <= 12}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">{settings.fontSize}px</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={increaseFontSize}
              disabled={settings.fontSize >= 24}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Настройки */}
        {showSettings && (
          <div className="border-t bg-white dark:bg-gray-800 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Тема</label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as any }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="light">Светлая</option>
                  <option value="dark">Тёмная</option>
                  <option value="sepia">Сепия</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Шрифт</label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => setSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Times, serif">Times</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Выравнивание</label>
                <select
                  value={settings.textAlign}
                  onChange={(e) => setSettings(prev => ({ ...prev, textAlign: e.target.value as any }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="justify">По ширине</option>
                  <option value="left">По левому краю</option>
                  <option value="center">По центру</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={resetSettings}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Сбросить
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Оглавление */}
        {showTableOfContents && (
          <div className="w-80 border-r bg-gray-50 dark:bg-gray-800 p-4">
            <h3 className="font-semibold mb-4 flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              Содержание
            </h3>
            <div className="space-y-2">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => goToChapter(index)}
                  className={`w-full text-left p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                    index === currentChapter 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                      : ''
                  }`}
                >
                  <div className="text-sm font-medium truncate">
                    {chapter.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    Глава {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Содержимое книги */}
        <div className="flex-1">
          <style dangerouslySetInnerHTML={{ __html: bookStyles }} />
          <div style={getContentStyles()}>
            <div className="book-content">
              <h1 className="chapter-title">{currentChapterData.title}</h1>
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: currentChapterData.content 
                }} 
              />
            </div>
          </div>

          {/* Навигация по главам */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50 dark:bg-gray-800">
            <Button
              variant="outline"
              onClick={goToPreviousChapter}
              disabled={currentChapter === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Предыдущая глава
            </Button>
            
            <div className="flex items-center space-x-2">
              {chapters.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToChapter(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === currentChapter
                      ? 'bg-blue-600'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              onClick={goToNextChapter}
              disabled={currentChapter === chapters.length - 1}
            >
              Следующая глава
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookReader; 