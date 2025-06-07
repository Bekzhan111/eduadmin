'use client';

import { useState } from 'react';
import { BookStructure, BookSection } from '@/components/ui/book-structure';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Download, Upload } from 'lucide-react';

export default function TestStructurePage() {
  const [sections, setSections] = useState<BookSection[]>([
    {
      id: 'chapter1',
      title: 'Глава 1: Введение',
      type: 'chapter',
      order: 1,
      isVisible: true,
      isExpanded: true,
      children: [
        {
          id: 'section1_1',
          title: '1.1 Основные понятия',
          type: 'section',
          order: 1,
          parentId: 'chapter1',
          isVisible: true,
          isExpanded: false,
          children: [
            {
              id: 'subsection1_1_1',
              title: '1.1.1 Определения',
              type: 'subsection',
              order: 1,
              parentId: 'section1_1',
              isVisible: true,
              isExpanded: false,
              content: 'Содержимое подраздела с определениями...'
            },
            {
              id: 'subsection1_1_2',
              title: '1.1.2 Примеры',
              type: 'subsection',
              order: 2,
              parentId: 'section1_1',
              isVisible: true,
              isExpanded: false,
              content: 'Практические примеры...'
            }
          ]
        },
        {
          id: 'section1_2',
          title: '1.2 История развития',
          type: 'section',
          order: 2,
          parentId: 'chapter1',
          isVisible: true,
          isExpanded: false,
          content: 'Исторический обзор...'
        }
      ]
    },
    {
      id: 'chapter2',
      title: 'Глава 2: Практическое применение',
      type: 'chapter',
      order: 2,
      isVisible: true,
      isExpanded: false,
      children: [
        {
          id: 'section2_1',
          title: '2.1 Методы и подходы',
          type: 'section',
          order: 1,
          parentId: 'chapter2',
          isVisible: true,
          isExpanded: false,
          content: 'Различные методы применения...'
        }
      ]
    }
  ]);

  const [selectedSection, setSelectedSection] = useState<BookSection | null>(null);

  const exportStructure = () => {
    const dataStr = JSON.stringify(sections, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'book-structure.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importStructure = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setSections(imported);
        } catch (error) {
          alert('Ошибка при импорте файла');
        }
      };
      reader.readAsText(file);
    }
  };

  const generateTableOfContents = () => {
    const generateTOC = (sectionList: BookSection[], level: number = 0): string => {
      return sectionList
        .filter(section => section.isVisible)
        .map(section => {
          const indent = '  '.repeat(level);
          const prefix = section.type === 'chapter' ? 
            `${section.order}.` : 
            section.type === 'section' ? 
              `${section.order}.${section.order}` : 
              `${section.order}.${section.order}.${section.order}`;
          
          let result = `${indent}${prefix} ${section.title}\n`;
          
          if (section.children && section.children.length > 0) {
            result += generateTOC(section.children, level + 1);
          }
          
          return result;
        })
        .join('');
    };

    return generateTOC(sections);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Тест Структуры Книги</h1>
        <p className="text-gray-600">
          Проверка компонента управления структурой книги с главами, разделами и подразделами
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Structure Editor */}
        <div className="lg:col-span-2">
          <BookStructure
            sections={sections}
            onSectionsChange={setSections}
            onSectionSelect={setSelectedSection}
            selectedSectionId={selectedSection?.id}
          />
        </div>

        {/* Section Details */}
        <div className="space-y-6">
          {/* Selected Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Выбранный Раздел
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSection ? (
                <div className="space-y-3">
                  <div>
                    <strong>Название:</strong> {selectedSection.title}
                  </div>
                  <div>
                    <strong>Тип:</strong> {
                      selectedSection.type === 'chapter' ? 'Глава' :
                      selectedSection.type === 'section' ? 'Раздел' : 'Подраздел'
                    }
                  </div>
                  <div>
                    <strong>Порядок:</strong> {selectedSection.order}
                  </div>
                  <div>
                    <strong>Видимость:</strong> {selectedSection.isVisible ? 'Видимый' : 'Скрытый'}
                  </div>
                  {selectedSection.content && (
                    <div>
                      <strong>Содержимое:</strong>
                      <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                        {selectedSection.content}
                      </div>
                    </div>
                  )}
                  {selectedSection.children && selectedSection.children.length > 0 && (
                    <div>
                      <strong>Подразделы:</strong> {selectedSection.children.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Выберите раздел для просмотра деталей
                </div>
              )}
            </CardContent>
          </Card>

          {/* Table of Contents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Оглавление
              </CardTitle>
              <CardDescription>
                Автоматически сгенерированное оглавление
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">
                {generateTableOfContents() || 'Структура пуста'}
              </pre>
            </CardContent>
          </Card>

          {/* Import/Export */}
          <Card>
            <CardHeader>
              <CardTitle>Импорт/Экспорт</CardTitle>
              <CardDescription>
                Сохранение и загрузка структуры книги
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={exportStructure}
                className="w-full flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Экспорт JSON</span>
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importStructure}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button 
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Импорт JSON</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Всего глав:</span>
                  <span>{sections.filter(s => s.type === 'chapter').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Всего разделов:</span>
                  <span>{sections.reduce((acc, s) => acc + (s.children?.filter(c => c.type === 'section').length || 0), 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Всего подразделов:</span>
                  <span>{sections.reduce((acc, s) => acc + (s.children?.reduce((acc2, c) => acc2 + (c.children?.filter(sc => sc.type === 'subsection').length || 0), 0) || 0), 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Скрытых элементов:</span>
                  <span>{sections.filter(s => !s.isVisible).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 