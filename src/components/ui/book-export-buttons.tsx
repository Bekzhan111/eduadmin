'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Settings, Download } from 'lucide-react';

interface BookExportButtonsProps {
  book: any;
  bookData: any;
  authorInfo?: any;
}

export function BookExportButtons({ book, bookData, authorInfo }: BookExportButtonsProps) {
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generatePublicHTML = (book: any, bookData: any): string => {
    const chaptersHTML = bookData.chapters?.map((chapter: any) => `
      <div class="chapter" id="chapter-${chapter.id}">
        <h2>${chapter.title}</h2>
        <div class="chapter-content">
          ${chapter.content}
        </div>
      </div>
    `).join('') || '';

    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${book.title}</title>
    <style>
        body { 
            font-family: Georgia, serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            background: #f9f9f9; 
        }
        .book-header { 
            text-align: center; 
            margin-bottom: 2em; 
            padding: 2em; 
            background: white; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .book-title { 
            font-size: 2.5em; 
            margin-bottom: 0.5em; 
            color: #2c3e50; 
        }
        .book-meta { 
            color: #7f8c8d; 
            margin-bottom: 1em; 
        }
        .chapter { 
            background: white; 
            margin: 2em 0; 
            padding: 2em; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .chapter h2 { 
            color: #2c3e50; 
            border-bottom: 2px solid #3498db; 
            padding-bottom: 0.5em; 
        }
        .chapter-content { 
            margin-top: 1.5em; 
        }
        .chapter-content h1, .chapter-content h2, .chapter-content h3 { 
            color: #2c3e50; 
        }
        .chapter-content blockquote { 
            border-left: 4px solid #3498db; 
            margin: 1.5em 0; 
            padding-left: 1em; 
            color: #7f8c8d; 
            font-style: italic; 
        }
        .chapter-content ul, .chapter-content ol { 
            margin: 1em 0; 
            padding-left: 2em; 
        }
        @media print { 
            body { background: white; } 
            .chapter { box-shadow: none; border: 1px solid #ddd; } 
        }
    </style>
</head>
<body>
    <div class="book-header">
        <h1 class="book-title">${book.title}</h1>
        <div class="book-meta">
            ${book.description ? `<p><strong>Описание:</strong> ${book.description}</p>` : ''}
            ${book.grade_level ? `<p><strong>Класс:</strong> ${book.grade_level}</p>` : ''}
            ${book.category ? `<p><strong>Категория:</strong> ${book.category}</p>` : ''}
            <p><strong>Дата создания:</strong> ${new Date(book.created_at).toLocaleDateString('ru-RU')}</p>
        </div>
    </div>
    
    <div class="book-content">
        ${chaptersHTML}
    </div>
    
    <div style="text-align: center; margin-top: 3em; padding: 2em; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="color: #7f8c8d; font-style: italic;">
            Книга сгенерирована системой EduAdmin<br>
            ${new Date().toLocaleDateString('ru-RU')}
        </p>
    </div>
</body>
</html>`;
  };

  const generateBookText = (book: any, bookData: any): string => {
    const chaptersText = bookData.chapters?.map((chapter: any) => {
      // Remove HTML tags for plain text
      const plainContent = chapter.content
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
      
      return `
========================================
${chapter.title}
========================================

${plainContent}

`;
    }).join('\n') || '';

    return `
${book.title}
${'='.repeat(book.title.length)}

${book.description ? `Описание: ${book.description}\n` : ''}
${book.grade_level ? `Класс: ${book.grade_level}\n` : ''}
${book.category ? `Категория: ${book.category}\n` : ''}
Дата создания: ${new Date(book.created_at).toLocaleDateString('ru-RU')}

${chaptersText}

----------------------------------------
Книга сгенерирована системой EduAdmin
${new Date().toLocaleDateString('ru-RU')}
----------------------------------------`;
  };

  return (
    <div className="hidden md:flex items-center space-x-2 border-l border-gray-300 pl-4">
      <span className="text-xs text-gray-600 font-medium">Скачать:</span>
      <Button
        variant="outline"
        size="sm"
        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
        title="Скачать как HTML"
        onClick={() => {
          const htmlContent = generatePublicHTML(book, bookData);
          downloadFile(htmlContent, `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`, 'text/html');
        }}
      >
        <FileText className="h-4 w-4 mr-2" />
        HTML
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
        title="Скачать как JSON"
        onClick={() => {
          const jsonContent = JSON.stringify({
            book: {
              title: book.title,
              description: book.description,
              author: authorInfo?.display_name || authorInfo?.email || 'Автор неизвестен',
              created_at: book.created_at,
              grade_level: book.grade_level,
              category: book.category,
              course: book.course,
              language: book.language
            },
            chapters: bookData.chapters
          }, null, 2);
          downloadFile(jsonContent, `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`, 'application/json');
        }}
      >
        <Settings className="h-4 w-4 mr-2" />
        JSON
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
        title="Скачать всю книгу"
        onClick={() => {
          const textContent = generateBookText(book, bookData);
          downloadFile(textContent, `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`, 'text/plain');
        }}
      >
        <Download className="h-4 w-4 mr-2" />
        TXT
      </Button>
    </div>
  );
} 