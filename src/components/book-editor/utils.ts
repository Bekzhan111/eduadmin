import { Book, CanvasElement, CanvasSettings } from './types';

// Generate unique ID
export const generateId = (): string => 
  `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to generate HTML from elements for export
export const generateHTMLFromElements = (elements: CanvasElement[], settings: CanvasSettings, book: Book): string => {
  const pages = Array.from({ length: settings.totalPages }, (_, i) => i + 1);
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${book.title}</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
        .book-container { max-width: ${settings.canvasWidth * 3.7795}px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .page { position: relative; width: ${settings.canvasWidth * 3.7795}px; height: ${settings.canvasHeight * 3.7795}px; margin: 20px 0; page-break-after: always; overflow: hidden; }
        .element { position: absolute; }
        .text-element { display: flex; align-items: center; justify-content: center; }
        .paragraph-element { padding: 8px; white-space: pre-wrap; }
        .shape-element { }
        .image-element { background-size: cover; background-position: center; }
        @media print { body { background: white; padding: 0; } .page { margin: 0; box-shadow: none; } }
    </style>
</head>
<body>
    <div class="book-container">
        <h1 style="text-align: center; padding: 20px; margin: 0; border-bottom: 1px solid #ddd;">${book.title}</h1>
        ${pages.map(pageNum => {
          const pageElements = elements.filter(el => el.page === pageNum);
          return `
        <div class="page" data-page="${pageNum}">
            ${pageElements.map(el => {
              const style = `
                left: ${el.x}px;
                top: ${el.y}px;
                width: ${el.width}px;
                height: ${el.height}px;
                transform: rotate(${el.rotation}deg);
                opacity: ${el.opacity};
                z-index: ${el.zIndex};
                ${el.properties.fontSize ? `font-size: ${el.properties.fontSize}px;` : ''}
                ${el.properties.fontFamily ? `font-family: ${el.properties.fontFamily};` : ''}
                ${el.properties.fontWeight ? `font-weight: ${el.properties.fontWeight};` : ''}
                ${el.properties.color ? `color: ${el.properties.color};` : ''}
                ${el.properties.backgroundColor ? `background-color: ${el.properties.backgroundColor};` : ''}
                ${el.properties.textAlign ? `text-align: ${el.properties.textAlign};` : ''}
                ${el.properties.borderRadius ? `border-radius: ${el.properties.borderRadius}px;` : ''}
              `;
              
              return `<div class="element ${el.type}-element" style="${style}">${el.content || ''}</div>`;
            }).join('')}
        </div>`;
        }).join('')}
    </div>
</body>
</html>`;
  
  return htmlContent;
};

// Helper function to generate PDF content (basic implementation)
export const generatePDFFromElements = (elements: CanvasElement[], settings: CanvasSettings, book: Book): string => {
  // This is a simplified PDF generation - in real implementation you'd use a library like jsPDF
  return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 ${settings.canvasWidth * 2.83} ${settings.canvasHeight * 2.83}]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(${book.title}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
338
%%EOF`;
};

// Helper function to generate editable source code
export const generateEditableSourceCode = (elements: CanvasElement[], settings: CanvasSettings, book: Book): string => {
  const pages = Array.from({ length: settings.totalPages }, (_, i) => i + 1);
  
  // Generate CSS classes for each element type
  const generateCSS = () => {
    const css = `
      /* ==============================================
         РЕДАКТИРУЕМЫЕ СТИЛИ КНИГИ: ${book.title}
         ============================================== */
      
      /* Основные стили страницы */
      body {
          margin: 0;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
      }
      
      .book-container {
          max-width: ${settings.canvasWidth * 3.7795}px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          border-radius: 8px;
          overflow: hidden;
      }
      
      .book-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 30px 20px;
          margin-bottom: 0;
      }
      
      .book-title {
          font-size: 2.5em;
          margin: 0;
          font-weight: 300;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      }
      
      .book-description {
          margin: 10px 0 0 0;
          font-size: 1.2em;
          opacity: 0.9;
      }
      
      .page {
          position: relative;
          width: ${settings.canvasWidth * 3.7795}px;
          height: ${settings.canvasHeight * 3.7795}px;
          margin: 0;
          page-break-after: always;
          overflow: hidden;
          background: #ffffff;
          border-bottom: 1px solid #e0e0e0;
      }
      
      .page:last-child {
          border-bottom: none;
      }
      
      .page-number {
          position: absolute;
          bottom: 10px;
          right: 20px;
          font-size: 12px;
          color: #888;
          background: rgba(255,255,255,0.8);
          padding: 5px 10px;
          border-radius: 15px;
      }
      
      /* Стили элементов */
      .element {
          position: absolute;
          transition: all 0.3s ease;
      }
      
      .element:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .text-element {
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 4px;
      }
      
      .paragraph-element {
          padding: 12px;
          white-space: pre-wrap;
          line-height: 1.6;
          border-radius: 8px;
          background: rgba(255,255,255,0.9);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .shape-element {
          border-radius: 4px;
          transition: all 0.3s ease;
      }
      
      .image-element {
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      }
      
      .line-element {
          background: #333;
      }
      
      .arrow-element {
          background: #333;
      }
      
      /* Адаптивные стили */
      @media screen and (max-width: 768px) {
          body { padding: 10px; }
          .book-container { margin: 0; }
          .book-title { font-size: 2em; }
      }
      
      @media print {
          body { 
              background: white !important; 
              padding: 0 !important; 
          }
          .book-container { 
              box-shadow: none !important; 
              border-radius: 0 !important; 
          }
          .page { 
              margin: 0 !important; 
              box-shadow: none !important; 
              border: none !important; 
          }
          .element:hover {
              transform: none !important;
              box-shadow: none !important;
          }
      }
      
      /* Кастомные стили для редактирования */
      .editable-text {
          border: 2px dashed transparent;
          transition: border-color 0.3s ease;
      }
      
      .editable-text:hover {
          border-color: #007bff;
          background: rgba(0,123,255,0.05);
      }
      
      .highlight-important {
          background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%) !important;
          padding: 8px 12px;
          border-radius: 6px;
          font-weight: 500;
      }
      
      .call-to-action {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
          padding: 15px 25px;
          border-radius: 25px;
          text-align: center;
          font-weight: bold;
          box-shadow: 0 6px 20px rgba(102,126,234,0.4);
      }
    `;
    
    return css;
  };
  
  // Generate HTML structure
  const htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${book.title} - Исходный код для редактирования</title>
    <style>
        ${generateCSS()}
    </style>
</head>
<body>
    <!-- ИНСТРУКЦИЯ ПО РЕДАКТИРОВАНИЮ -->
    <!-- 
    Этот файл содержит исходный код книги "${book.title}" для редактирования.
    
    КАК РЕДАКТИРОВАТЬ:
    1. Откройте этот файл в любом текстовом редакторе (VS Code, Sublime Text, Notepad++)
    2. Измените содержимое между тегами HTML
    3. Настройте стили в секции <style> выше
    4. Сохраните файл и откройте в браузере для просмотра
    
    СТРУКТУРА:
    - Секция <style> содержит все CSS стили
    - Каждая страница находится в элементе .page
    - Элементы книги имеют классы .element, .text-element, .paragraph-element и т.д.
    
    ПОЛЕЗНЫЕ КЛАССЫ:
    - .highlight-important - выделение важного текста
    - .call-to-action - кнопки призыва к действию
    - .editable-text - редактируемый текст с hover-эффектом
    -->
    
    <div class="book-container">
        <div class="book-header">
            <h1 class="book-title">${book.title}</h1>
            ${book.description ? `<p class="book-description">${book.description}</p>` : ''}
        </div>
        
        ${pages.map(pageNum => {
          const pageElements = elements.filter(el => el.page === pageNum);
          return `
        <!-- СТРАНИЦА ${pageNum} -->
        <div class="page" data-page="${pageNum}" id="page-${pageNum}">
            <div class="page-number">Страница ${pageNum}</div>
            ${pageElements.map((el, index) => {
              const style = `
                left: ${el.x}px;
                top: ${el.y}px;
                width: ${el.width}px;
                height: ${el.height}px;
                transform: rotate(${el.rotation}deg);
                opacity: ${el.opacity};
                z-index: ${el.zIndex};
                ${el.properties.fontSize ? `font-size: ${el.properties.fontSize}px;` : ''}
                ${el.properties.fontFamily ? `font-family: '${el.properties.fontFamily}', sans-serif;` : ''}
                ${el.properties.fontWeight ? `font-weight: ${el.properties.fontWeight};` : ''}
                ${el.properties.color ? `color: ${el.properties.color};` : ''}
                ${el.properties.backgroundColor ? `background-color: ${el.properties.backgroundColor};` : ''}
                ${el.properties.textAlign ? `text-align: ${el.properties.textAlign};` : ''}
                ${el.properties.borderRadius ? `border-radius: ${el.properties.borderRadius}px;` : ''}
                ${el.properties.borderColor ? `border: ${el.properties.borderWidth || 1}px solid ${el.properties.borderColor};` : ''}
              `.trim();
              
              const elementId = `element-${pageNum}-${index}`;
              const classes = `element ${el.type}-element ${el.type === 'text' || el.type === 'paragraph' ? 'editable-text' : ''}`;
              
              return `
            <!-- ЭЛЕМЕНТ: ${el.type.toUpperCase()} -->
            <div id="${elementId}" class="${classes}" style="${style}">
                ${el.content || ''}
            </div>`;
            }).join('')}
        </div>`;
        }).join('')}
        
        <!-- ФУТЕР С ИНФОРМАЦИЕЙ -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; border-top: 1px solid #dee2e6;">
            <p><strong>Исходный код книги:</strong> ${book.title}</p>
            <p>Экспортировано: ${new Date().toLocaleDateString('ru-RU')} в ${new Date().toLocaleTimeString('ru-RU')}</p>
            <p>Система: EduAdmin | Редактируемый HTML/CSS</p>
            <p style="margin-top: 15px; font-size: 14px;">
                💡 <strong>Совет:</strong> Используйте классы .highlight-important и .call-to-action для стилизации важных элементов
            </p>
        </div>
    </div>
    
    <!-- JAVASCRIPT ДЛЯ ИНТЕРАКТИВНОСТИ (ОПЦИОНАЛЬНО) -->
    <script>
        // Простая интерактивность для редактируемых элементов
        document.addEventListener('DOMContentLoaded', function() {
            const editableElements = document.querySelectorAll('.editable-text');
            
            editableElements.forEach(element => {
                element.addEventListener('click', function() {
                    this.classList.toggle('highlight-important');
                });
                
                element.addEventListener('dblclick', function() {
                    this.classList.toggle('call-to-action');
                });
            });
            
            // Логирование изменений
            console.log('📚 Исходный код книги "${book.title}" загружен');
            console.log('🔧 Для редактирования откройте этот файл в текстовом редакторе');
            console.log('✨ Клик по тексту - выделение важного, двойной клик - кнопка действия');
        });
    </script>
</body>
</html>`;
  
  return htmlContent;
};

// Функция для получения ширины по умолчанию для разных типов инструментов
export const getDefaultWidth = (toolId: string): number => {
  switch (toolId) {
    case 'text':
      return 200;
    case 'paragraph':
      return 400;
    case 'font-opensans':
    case 'font-helvetica':
    case 'font-roboto':
    case 'font-arial':
    case 'font-times':
    case 'text-bold':
    case 'text-italic':
    case 'text-underline':
      return 250;
    case 'rectangle':
    case 'circle':
    case 'triangle':
    case 'star':
    case 'heart':
      return 150;
    case 'image':
    case 'video':
      return 320;
    case 'audio':
      return 300;
    case 'line':
    case 'arrow':
      return 200;
    case 'math':
      return 250;
    case 'table':
      return 400;
    case 'bar-chart':
    case 'line-chart':
    case 'pie-chart':
      return 400;
    case 'multiple-choice':
    case 'open-question':
    case 'true-false':
    case 'matching':
    case 'quiz':
      return 500;
    // New OPIQ assignment types
    case 'fill-in-blank':
    case 'multiple-select':
      return 500;
    case 'single-select':
      return 450;
    case 'dropdown-select':
      return 400;
    case 'image-hotspots':
    case 'connect-pairs':
      return 600;
    // New assignment types
    case 'concept-map':
    case 'drag-to-point':
    case 'grouping':
      return 600;
    case 'numbers-on-image':
    case 'crossword':
      return 500;
    case 'ordering':
    case 'highlight-words':
    case 'text-editing':
    case 'text-highlighting':
      return 500;
    case 'word-grid':
      return 400;
    case 'hint':
      return 400;
    // Icon tools - smaller default size
    case 'icon-home':
    case 'icon-user':
    case 'icon-settings':
    case 'icon-search':
    case 'icon-mail':
    case 'icon-phone':
    case 'icon-calendar':
    case 'icon-clock':
    case 'icon-map':
    case 'icon-camera':
    case 'icon-music':
    case 'icon-file':
    case 'icon-folder':
    case 'icon-download':
    case 'icon-upload':
    case 'icon-copy':
    case 'icon-check':
    case 'icon-bell':
    case 'icon-alert':
    case 'icon-info':
    case 'icon-shield':
    case 'icon-lock':
    case 'icon-eye':
    case 'icon-thumbs-up':
    case 'icon-message':
    case 'icon-share':
    case 'icon-link':
    case 'icon-zap':
    case 'icon-award':
    case 'icon-gift':
    case 'icon-briefcase':
    case 'icon-flag':
    case 'icon-sun':
    case 'icon-moon':
    case 'icon-lightbulb':
    case 'icon-battery':
    case 'icon-wifi':
    case 'icon-globe':
    case 'icon-database':
    case 'icon-code':
    case 'icon-monitor':
    case 'icon-smartphone':
    case 'icon-play':
    case 'icon-volume':
    case 'icon-palette':
    case 'icon-bookmark':
    case 'icon-filter':
    case 'icon-refresh':
    // Educational SVG icons
    case 'icon-analysis':
    case 'icon-attention':
    case 'icon-speaking':
    case 'icon-homework':
    case 'icon-ask-question':
    case 'icon-game':
    case 'icon-game-1':
    case 'icon-game-2':
    case 'icon-internet':
    case 'icon-draw':
    case 'icon-circle':
    case 'icon-check-mark':
    case 'icon-puzzle':
    case 'icon-singing':
    case 'icon-writing':
    case 'icon-show':
    case 'icon-self-check':
    case 'icon-individual-work':
    case 'icon-group-work':
    case 'icon-pair-work':
    case 'icon-color':
    case 'icon-conclusion':
    case 'icon-listening':
    case 'icon-connect':
    case 'icon-functional-literacy':
    case 'icon-reading':
    case 'icon-video':
    case 'icon-video-library':
    case 'icon-globe-kg':
    case 'icon-monitor-kg':
    case 'icon-reflection':
    case 'icon-construct':
    case 'icon-goal':
    case 'icon-ae':
    case 'icon-disk':
    case 'icon-other-level':
    case 'icon-kite':
    case 'icon-initial-program-white':
    case 'icon-initial-program':
    case 'icon-pen-test':
    case 'icon-artistic-taste':
      return 80; // Default width for icons
    default:
      return 200;
  }
};

// Функция для получения высоты по умолчанию для разных типов инструментов
export const getDefaultHeight = (toolId: string): number => {
  switch (toolId) {
    case 'text':
      return 50;
    case 'paragraph':
      return 200;
    case 'font-opensans':
    case 'font-helvetica':
    case 'font-roboto':
    case 'font-arial':
    case 'font-times':
    case 'text-bold':
    case 'text-italic':
    case 'text-underline':
      return 60;
    case 'rectangle':
    case 'circle':
    case 'triangle':
    case 'star':
    case 'heart':
      return 150;
    case 'image':
    case 'video':
      return 240;
    case 'audio':
      return 80;
    case 'line':
    case 'arrow':
      return 2;
    case 'math':
      return 80;
    case 'table':
      return 300;
    case 'bar-chart':
    case 'line-chart':
      return 300;
    case 'pie-chart':
      return 350;
    case 'multiple-choice':
    case 'true-false':
      return 300;
    case 'open-question':
      return 200;
    case 'matching':
      return 400;
    case 'quiz':
      return 500;
    // New OPIQ assignment types
    case 'fill-in-blank':
      return 200;
    case 'multiple-select':
      return 300;
    case 'single-select':
      return 250;
    case 'dropdown-select':
      return 150;
    case 'image-hotspots':
      return 400;
    case 'connect-pairs':
      return 350;
    // New assignment types
    case 'concept-map':
    case 'drag-to-point':
    case 'grouping':
    case 'word-grid':
      return 400;
    case 'numbers-on-image':
      return 400;
    case 'ordering':
      return 300;
    case 'text-editing':
      return 300;
    case 'crossword':
      return 500;
    case 'highlight-words':
      return 200;
    case 'text-highlighting':
      return 250;
    case 'hint':
      return 200;
    // Icon tools - smaller default size (same as width for square icons)
    case 'icon-home':
    case 'icon-user':
    case 'icon-settings':
    case 'icon-search':
    case 'icon-mail':
    case 'icon-phone':
    case 'icon-calendar':
    case 'icon-clock':
    case 'icon-map':
    case 'icon-camera':
    case 'icon-music':
    case 'icon-file':
    case 'icon-folder':
    case 'icon-download':
    case 'icon-upload':
    case 'icon-copy':
    case 'icon-check':
    case 'icon-bell':
    case 'icon-alert':
    case 'icon-info':
    case 'icon-shield':
    case 'icon-lock':
    case 'icon-eye':
    case 'icon-thumbs-up':
    case 'icon-message':
    case 'icon-share':
    case 'icon-link':
    case 'icon-zap':
    case 'icon-award':
    case 'icon-gift':
    case 'icon-briefcase':
    case 'icon-flag':
    case 'icon-sun':
    case 'icon-moon':
    case 'icon-lightbulb':
    case 'icon-battery':
    case 'icon-wifi':
    case 'icon-globe':
    case 'icon-database':
    case 'icon-code':
    case 'icon-monitor':
    case 'icon-smartphone':
    case 'icon-play':
    case 'icon-volume':
    case 'icon-palette':
    case 'icon-bookmark':
    case 'icon-filter':
    case 'icon-refresh':
    // Educational SVG icons
    case 'icon-analysis':
    case 'icon-attention':
    case 'icon-speaking':
    case 'icon-homework':
    case 'icon-ask-question':
    case 'icon-game':
    case 'icon-game-1':
    case 'icon-game-2':
    case 'icon-internet':
    case 'icon-draw':
    case 'icon-circle':
    case 'icon-check-mark':
    case 'icon-puzzle':
    case 'icon-singing':
    case 'icon-writing':
    case 'icon-show':
    case 'icon-self-check':
    case 'icon-individual-work':
    case 'icon-group-work':
    case 'icon-pair-work':
    case 'icon-color':
    case 'icon-conclusion':
    case 'icon-listening':
    case 'icon-connect':
    case 'icon-functional-literacy':
    case 'icon-reading':
    case 'icon-video':
    case 'icon-video-library':
    case 'icon-globe-kg':
    case 'icon-monitor-kg':
    case 'icon-reflection':
    case 'icon-construct':
    case 'icon-goal':
    case 'icon-ae':
    case 'icon-disk':
    case 'icon-other-level':
    case 'icon-kite':
    case 'icon-initial-program-white':
    case 'icon-initial-program':
    case 'icon-pen-test':
    case 'icon-artistic-taste':
      return 80; // Default height for icons (square)
    default:
      return 100;
  }
};

// Функция для получения содержимого по умолчанию для разных типов элементов
export const getDefaultContent = (toolId: string): string => {
  switch (toolId) {
    case 'text':
      return 'Текст';
    case 'paragraph':
      return 'Абзац текста. Здесь вы можете написать более длинный текст с несколькими предложениями.';
    case 'font-opensans':
      return 'Open Sans Text';
    case 'font-helvetica':
      return 'Helvetica Text';
    case 'font-roboto':
      return 'Roboto Text';
    case 'font-arial':
      return 'Arial Text';
    case 'font-times':
      return 'Times New Roman Text';
    case 'text-bold':
      return 'Жирный текст';
    case 'text-italic':
      return 'Курсивный текст';
    case 'text-underline':
      return 'Подчеркнутый текст';
    case 'math':
      return '\\frac{a}{b} = \\frac{c}{d}';
    case 'bar-chart':
    case 'line-chart':
    case 'pie-chart':
      return '';
    case 'multiple-choice':
    case 'open-question':
    case 'true-false':
    case 'matching':
    case 'quiz':
      return 'Задание';
    // New OPIQ assignment types
    case 'fill-in-blank':
      return 'Пропуск (запись)';
    case 'multiple-select':
      return 'Несколько из списка';
    case 'single-select':
      return 'Один из списка';
    case 'dropdown-select':
      return 'Раскрывающийся список';
    case 'image-hotspots':
      return 'Элементы на изображении';
    case 'connect-pairs':
      return 'Соедините пары';
    // New assignment types
    case 'concept-map':
      return 'Карта понятий';
    case 'drag-to-point':
      return 'Перетаскивание';
    case 'numbers-on-image':
      return 'Числа на изображении';
    case 'grouping':
      return 'Сгруппировать';
    case 'ordering':
      return 'Упорядочить';
    case 'word-grid':
      return 'Сетка слов';
    case 'crossword':
      return 'Кроссворд';
    case 'highlight-words':
      return 'Выделить слова';
    case 'text-editing':
      return 'Редактирование текста';
    case 'text-highlighting':
      return 'Выделение текста';
    case 'hint':
      return 'Подсказка';
    default:
      return '';
  }
};

// Функция для получения расширенных свойств для разных типов инструментов
export const getEnhancedPropertiesForTool = (toolId: string): Record<string, any> => {
  switch (toolId) {
    case 'text':
      return {
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#333333',
        backgroundColor: 'transparent',
        textAlign: 'center',
        verticalAlign: 'middle',
        defaultWidth: 200,
        defaultHeight: 50,
      };
    case 'paragraph':
      return {
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#333333',
        backgroundColor: 'transparent',
        textAlign: 'left',
        verticalAlign: 'top',
        borderRadius: 0,
        paddingLeft: 8,
        paddingRight: 8,
        defaultWidth: 300,
        defaultHeight: 100,
      };
    case 'rectangle':
      return {
        shapeType: 'rectangle',
        backgroundColor: '#e0e0e0',
        borderColor: '#000000',
        borderWidth: 0,
        borderRadius: 0,
        defaultWidth: 150,
        defaultHeight: 100,
      };
    case 'circle':
      return {
        shapeType: 'circle',
        backgroundColor: '#e0e0e0',
        borderColor: '#000000',
        borderWidth: 0,
        defaultWidth: 100,
        defaultHeight: 100,
      };
    case 'triangle':
      return {
        shapeType: 'triangle',
        backgroundColor: '#e0e0e0',
        borderColor: '#000000',
        borderWidth: 0,
        defaultWidth: 100,
        defaultHeight: 100,
      };
    case 'star':
      return {
        shapeType: 'star',
        backgroundColor: '#e0e0e0',
        borderColor: '#000000',
        borderWidth: 0,
        defaultWidth: 100,
        defaultHeight: 100,
      };
    case 'heart':
      return {
        shapeType: 'heart',
        backgroundColor: '#e0e0e0',
        borderColor: '#000000',
        borderWidth: 0,
        defaultWidth: 100,
        defaultHeight: 100,
      };
    case 'image':
      return {
        imageUrl: '',
        borderRadius: 0,
        borderColor: 'transparent',
        borderWidth: 0,
        preserveAspectRatio: true,
        defaultWidth: 200,
        defaultHeight: 150,
      };
    case 'video':
      return {
        videoUrl: '',
        autoplay: false,
        muted: true,
        controls: true,
        loop: false,
        preserveAspectRatio: true,
        defaultWidth: 300,
        defaultHeight: 200,
      };
    case 'audio':
      return {
        audioUrl: '',
        autoplay: false,
        controls: true,
        loop: false,
        defaultWidth: 300,
        defaultHeight: 50,
      };
    case 'line':
      return {
        color: '#000000',
        lineThickness: 2,
        defaultWidth: 200,
        defaultHeight: 2,
      };
    case 'arrow':
      return {
        color: '#000000',
        lineThickness: 2,
        arrowType: 'single',
        defaultWidth: 200,
        defaultHeight: 20,
      };
    case 'math':
      return {
        mathFormula: '',
        mathDisplay: 'block',
        mathSize: 'normal',
        color: '#000000',
        backgroundColor: 'transparent',
        defaultWidth: 200,
        defaultHeight: 100,
      };
    case 'table':
      return {
        tableData: {
          rows: 3,
          columns: 3,
          cells: createDefaultTableCells(3, 3),
          headerRow: true,
          headerColumn: false,
          borderCollapse: true,
          cellPadding: 8,
          cellSpacing: 0,
          borderColor: '#cccccc',
          borderWidth: 1,
          backgroundColor: '#ffffff',
        },
        defaultWidth: 300,
        defaultHeight: 200,
      };
    case 'bar-chart':
      return {
        chartType: 'bar',
        chartData: {
          labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
          datasets: [
            {
              label: 'Данные 1',
              data: [15, 20, 10, 18, 12, 16],
              backgroundColor: 'rgba(54, 162, 235, 0.8)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 2,
            },
          ],
        },
        chartOptions: {
          title: 'Столбчатая диаграмма',
          showLegend: true,
          legendPosition: 'top',
          xAxisTitle: 'Месяцы',
          yAxisTitle: 'Значения',
          stacked: false,
          beginAtZero: true,
          aspectRatio: 2,
        },
        defaultWidth: 400,
        defaultHeight: 300,
      };
    case 'line-chart':
      return {
        chartType: 'line',
        chartData: {
          labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
          datasets: [
            {
              label: 'Данные 1',
              data: [15, 20, 10, 18, 12, 16],
              backgroundColor: 'rgba(75, 192, 192, 0.4)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 3,
              tension: 0.4,
              fill: true,
              pointRadius: 5,
              pointBackgroundColor: 'rgba(75, 192, 192, 1)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
            },
          ],
        },
        chartOptions: {
          title: 'Линейная диаграмма',
          showLegend: true,
          legendPosition: 'top',
          xAxisTitle: 'Месяцы',
          yAxisTitle: 'Значения',
          stacked: false,
          beginAtZero: true,
          aspectRatio: 2,
        },
        defaultWidth: 400,
        defaultHeight: 300,
      };
    case 'pie-chart':
      return {
        chartType: 'pie',
        chartData: {
          labels: ['Красный', 'Синий', 'Желтый', 'Зеленый', 'Фиолетовый'],
          datasets: [
            {
              label: 'Данные',
              data: [15, 20, 10, 18, 12],
              backgroundColor: [
                'rgba(255, 99, 132, 0.9)',
                'rgba(54, 162, 235, 0.9)',
                'rgba(255, 206, 86, 0.9)',
                'rgba(75, 192, 192, 0.9)',
                'rgba(153, 102, 255, 0.9)',
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
              ],
              borderWidth: 2,
              hoverOffset: 15,
            },
          ],
        },
        chartOptions: {
          title: 'Круговая диаграмма',
          showLegend: true,
          legendPosition: 'right',
          aspectRatio: 2,
        },
        defaultWidth: 300,
        defaultHeight: 300,
      };
    case 'multiple-choice':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'multiple-choice',
        assignmentData: {
          question: 'Выберите правильный ответ:',
          instructions: 'Отметьте один из вариантов ответа',
          options: [
            { id: 'opt1', text: 'Вариант 1', isCorrect: true },
            { id: 'opt2', text: 'Вариант 2', isCorrect: false },
            { id: 'opt3', text: 'Вариант 3', isCorrect: false },
            { id: 'opt4', text: 'Вариант 4', isCorrect: false }
          ],
          points: 10,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true
        }
      };
    case 'open-question':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'open-question',
        assignmentData: {
          question: 'Ответьте на вопрос:',
          instructions: 'Напишите развернутый ответ',
          expectedAnswer: 'Пример ожидаемого ответа',
          answerLength: 'medium',
          points: 15,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: false
        }
      };
    case 'true-false':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'true-false',
        assignmentData: {
          question: 'Определите, верно ли утверждение:',
          instructions: 'Выберите "Верно" или "Неверно"',
          correctAnswer: true,
          points: 5,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true
        }
      };
    case 'matching':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'matching',
        assignmentData: {
          question: 'Сопоставьте элементы:',
          instructions: 'Соедините соответствующие элементы из левого и правого столбцов',
          leftItems: [
            { id: 'left1', content: 'Элемент 1' },
            { id: 'left2', content: 'Элемент 2' },
            { id: 'left3', content: 'Элемент 3' }
          ],
          rightItems: [
            { id: 'right1', content: 'Соответствие 1', matchWith: 'left1' },
            { id: 'right2', content: 'Соответствие 2', matchWith: 'left2' },
            { id: 'right3', content: 'Соответствие 3', matchWith: 'left3' }
          ],
          points: 20,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true
        }
      };
    case 'quiz':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'quiz',
        assignmentData: {
          question: 'Викторина',
          instructions: 'Ответьте на все вопросы викторины',
          quizQuestions: [
            {
              id: 'q1',
              type: 'multiple-choice',
              question: 'Вопрос 1:',
              options: [
                { id: 'q1opt1', text: 'Ответ 1', isCorrect: true },
                { id: 'q1opt2', text: 'Ответ 2', isCorrect: false }
              ],
              points: 5
            },
            {
              id: 'q2',
              type: 'true-false',
              question: 'Вопрос 2:',
              correctAnswer: false,
              points: 5
            }
          ],
          totalPoints: 10,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true
        }
      };
    // New OPIQ-style assignment types
    case 'fill-in-blank':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'fill-in-blank',
        assignmentData: {
          question: 'Заполните пропуски в тексте:',
          instructions: 'Введите подходящие слова в пустые поля',
          textWithBlanks: 'В году есть ____ месяцев и ____ времени года.',
          correctAnswers: ['двенадцать', 'четыре'],
          blanks: [
            { id: 'blank1', position: 13, answer: 'двенадцать', caseSensitive: false },
            { id: 'blank2', position: 31, answer: 'четыре', caseSensitive: false }
          ],
          correctAnswerType: 'SINGLE', // Default to single correct answer
          points: 1,
          pointsEnabled: true, // По умолчанию система баллов включена
          timeLimit: null,
          showCorrectAnswer: true
        },
        defaultWidth: 500,
        defaultHeight: 200
      };
    case 'multiple-select':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'multiple-select',
        assignmentData: {
          question: 'Выберите все правильные ответы:',
          instructions: 'Отметьте один или несколько вариантов ответа',
          options: [
            { id: 'opt1', text: 'Вариант 1', isCorrect: true },
            { id: 'opt2', text: 'Вариант 2', isCorrect: false },
            { id: 'opt3', text: 'Вариант 3', isCorrect: true },
            { id: 'opt4', text: 'Вариант 4', isCorrect: false }
          ],
          points: 15,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true,
          partialCredit: true
        },
        defaultWidth: 500,
        defaultHeight: 300
      };
    case 'single-select':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'single-select',
        assignmentData: {
          question: 'Выберите один правильный ответ:',
          instructions: 'Отметьте только один вариант ответа',
          options: [
            { id: 'opt1', text: 'Вариант 1', isCorrect: false },
            { id: 'opt2', text: 'Вариант 2', isCorrect: true },
            { id: 'opt3', text: 'Вариант 3', isCorrect: false }
          ],
          points: 10,
          timeLimit: null,
          showCorrectAnswer: true
        },
        defaultWidth: 450,
        defaultHeight: 250
      };
    case 'dropdown-select':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'dropdown-select',
        assignmentData: {
          question: 'Выберите правильный ответ из выпадающего списка:',
          instructions: 'Откройте список и выберите подходящий вариант',
          options: [
            { id: 'opt1', text: 'Выберите ответ...', isCorrect: false, isPlaceholder: true },
            { id: 'opt2', text: 'Вариант 1', isCorrect: false },
            { id: 'opt3', text: 'Правильный ответ', isCorrect: true },
            { id: 'opt4', text: 'Вариант 3', isCorrect: false }
          ],
          points: 8,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true
        },
        defaultWidth: 400,
        defaultHeight: 150
      };
    case 'image-hotspots':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'image-hotspots',
        assignmentData: {
          question: 'Найдите и отметьте элементы на изображении:',
          instructions: 'Нажмите на указанные области изображения',
          imageUrl: '',
          hotspots: [
            { 
              id: 'spot1', 
              x: 100, 
              y: 100, 
              radius: 20, 
              label: 'Элемент 1',
              feedback: 'Правильно! Это элемент 1.',
              isCorrect: true 
            },
            { 
              id: 'spot2', 
              x: 200, 
              y: 150, 
              radius: 25, 
              label: 'Элемент 2',
              feedback: 'Верно! Вы нашли элемент 2.',
              isCorrect: true 
            }
          ],
          points: 20,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true,
          allowMultipleAttempts: true
        },
        defaultWidth: 600,
        defaultHeight: 400
      };
    case 'connect-pairs':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'connect-pairs',
        assignmentData: {
          question: 'Соедините пары элементов:',
          instructions: 'Перетащите элементы из левого столбца к соответствующим элементам в правом столбце',
          leftItems: [
            { id: 'left1', content: 'Понятие 1', type: 'text' },
            { id: 'left2', content: 'Понятие 2', type: 'text' },
            { id: 'left3', content: 'Понятие 3', type: 'text' }
          ],
          rightItems: [
            { id: 'right1', content: 'Определение 1', type: 'text', matchWith: 'left1' },
            { id: 'right2', content: 'Определение 2', type: 'text', matchWith: 'left2' },
            { id: 'right3', content: 'Определение 3', type: 'text', matchWith: 'left3' }
          ],
          connections: [],
          points: 18,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true,
          allowPartialCredit: true
        },
        defaultWidth: 600,
        defaultHeight: 350
      };
    // New assignment types
    case 'concept-map':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'concept-map',
        assignmentData: {
          question: 'Заполните карту понятий:',
          instructions: 'Добавьте информацию в ячейки и создайте связи между понятиями',
          conceptMap: {
            rows: 3,
            cols: 3,
            cells: [
              { id: 'cell-0-0', row: 0, col: 0, content: 'Понятие 1' },
              { id: 'cell-1-1', row: 1, col: 1, content: 'Понятие 2' },
              { id: 'cell-2-2', row: 2, col: 2, content: 'Понятие 3' }
            ],
            connections: [
              { id: 'conn1', from: 'cell-0-0', to: 'cell-1-1', label: 'связь 1' },
              { id: 'conn2', from: 'cell-1-1', to: 'cell-2-2', label: 'связь 2' }
            ]
          },
          points: 20,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true
        },
        defaultWidth: 600,
        defaultHeight: 400
      };
    case 'drag-to-point':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'drag-to-point',
        assignmentData: {
          question: 'Перетащите элементы в правильные области:',
          instructions: 'Переместите каждый элемент в соответствующую зону',
          dragItems: [
            { id: 'item1', content: 'Элемент 1' },
            { id: 'item2', content: 'Элемент 2' },
            { id: 'item3', content: 'Элемент 3' }
          ],
          dropZones: [
            { id: 'zone1', label: 'Зона 1', correctAnswer: 'item1' },
            { id: 'zone2', label: 'Зона 2', correctAnswer: 'item2' },
            { id: 'zone3', label: 'Зона 3', correctAnswer: 'item3' }
          ],
          points: 15,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true
        },
        defaultWidth: 600,
        defaultHeight: 400
      };
    case 'numbers-on-image':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'numbers-on-image',
        assignmentData: {
          question: 'Разместите числа на изображении:',
          instructions: 'Перетащите пронумерованные элементы в правильные места на изображении',
          imageUrl: 'https://via.placeholder.com/400x300?text=Загрузите+изображение',
          options: [
            { id: 'opt1', text: 'Вариант 1' },
            { id: 'opt2', text: 'Вариант 2' },
            { id: 'opt3', text: 'Вариант 3' }
          ],
          numberPoints: [
            { id: 'point1', x: 100, y: 100, label: 'Точка 1', correctAnswer: 'opt1' },
            { id: 'point2', x: 200, y: 150, label: 'Точка 2', correctAnswer: 'opt2' },
            { id: 'point3', x: 150, y: 200, label: 'Точка 3', correctAnswer: 'opt3' }
          ],
          points: 22,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true
        },
        defaultWidth: 500,
        defaultHeight: 400
      };
    case 'grouping':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'grouping',
        assignmentData: {
          question: 'Распределите элементы по группам:',
          instructions: 'Перетащите каждый элемент в правильную группу',
          items: [
            { id: 'item1', content: 'Элемент 1', type: 'text' },
            { id: 'item2', content: 'Элемент 2', type: 'text' },
            { id: 'item3', content: 'Элемент 3', type: 'text' },
            { id: 'item4', content: 'Элемент 4', type: 'text' }
          ],
          groups: [
            { id: 'group1', name: 'Группа 1', correctItems: ['item1', 'item2'] },
            { id: 'group2', name: 'Группа 2', correctItems: ['item3', 'item4'] }
          ],
          points: 16,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true
        },
        defaultWidth: 600,
        defaultHeight: 400
      };
    case 'ordering':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'ordering',
        assignmentData: {
          question: 'Расположите элементы в правильном порядке:',
          instructions: 'Перетащите элементы, чтобы расположить их в правильной последовательности',
          items: [
            { id: 'item1', content: 'Первый элемент', type: 'text' },
            { id: 'item2', content: 'Второй элемент', type: 'text' },
            { id: 'item3', content: 'Третий элемент', type: 'text' },
            { id: 'item4', content: 'Четвертый элемент', type: 'text' }
          ],
          points: 12,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true
        },
        defaultWidth: 500,
        defaultHeight: 300
      };
    case 'word-grid':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'word-grid',
        assignmentData: {
          question: 'Найдите слова в сетке:',
          instructions: 'Нажмите на буквы, чтобы выделить скрытые слова',
          gridSize: 10,
          hiddenWords: ['СЛОВО', 'ТЕКСТ', 'ПОИСК'],
          grid: [
            ['С', 'Л', 'О', 'В', 'О', 'Х', 'Я', 'Ю', 'Ф', 'Д'],
            ['Ч', 'Ь', 'Г', 'Ы', 'Ъ', 'Т', 'Е', 'К', 'С', 'Т'],
            ['П', 'О', 'И', 'С', 'К', 'Н', 'Ш', 'Э', 'Ж', 'Б'],
            ['А', 'Р', 'Ы', 'В', 'Ф', 'Ц', 'И', 'Л', 'Щ', 'М'],
            ['Ж', 'Д', 'Е', 'Н', 'Г', 'Й', 'К', 'У', 'Х', 'З']
          ],
          gridWords: [
            { word: 'СЛОВО', startRow: 0, startCol: 0, direction: 'horizontal' },
            { word: 'ТЕКСТ', startRow: 1, startCol: 5, direction: 'horizontal' },
            { word: 'ПОИСК', startRow: 2, startCol: 0, direction: 'horizontal' }
          ],
          points: 15,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true
        },
        defaultWidth: 400,
        defaultHeight: 400
      };
    case 'crossword':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'crossword',
        assignmentData: {
          question: 'Решите кроссворд:',
          instructions: 'Введите ответы в соответствующие клетки',
          crosswordGrid: [
            [{ isBlack: true }, { isBlack: true }, { number: 1, isBlack: false }, { isBlack: false }, { isBlack: false }],
            [{ number: 2, isBlack: false }, { isBlack: false }, { isBlack: false }, { isBlack: false }, { isBlack: true }],
            [{ isBlack: false }, { isBlack: true }, { isBlack: false }, { isBlack: true }, { isBlack: true }],
            [{ isBlack: false }, { isBlack: true }, { isBlack: false }, { isBlack: true }, { isBlack: true }],
            [{ isBlack: false }, { isBlack: true }, { isBlack: false }, { isBlack: true }, { isBlack: true }]
          ],
          crosswordClues: {
            across: [
              { number: 1, clue: 'Вопрос по горизонтали 1', answer: 'СЛОВО' },
              { number: 2, clue: 'Вопрос по горизонтали 2', answer: 'ТЕКСТ' }
            ],
            down: [
              { number: 1, clue: 'Вопрос по вертикали 1', answer: 'СТИХ' },
              { number: 3, clue: 'Вопрос по вертикали 3', answer: 'ОКО' }
            ]
          },
          points: 24,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true
        },
        defaultWidth: 500,
        defaultHeight: 500
      };
    case 'highlight-words':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'highlight-words',
        assignmentData: {
          question: 'Выделите указанные слова в тексте:',
          instructions: 'Нажмите на слова, которые соответствуют заданию',
          textContent: 'Это пример текста для выделения определенных слов. Найдите и выделите ключевые слова в данном тексте.',
          wordsToHighlight: ['пример', 'текста', 'слова', 'ключевые'],
          points: 12,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true
        },
        defaultWidth: 500,
        defaultHeight: 200
      };
    case 'text-editing':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'text-editing',
        assignmentData: {
          question: 'Отредактируйте текст согласно инструкциям:',
          instructions: 'Исправьте грамматические ошибки и улучшите стиль текста',
          originalText: 'Этот текст содержит ошибки которые нужно исправить. Также можно улучшить стиль написания.',
          editingInstructions: 'Исправьте пунктуацию, добавьте запятые где необходимо, улучшите читаемость текста.',
          expectedResult: 'Этот текст содержит ошибки, которые нужно исправить. Также можно улучшить стиль написания.',
          points: 20,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true
        },
        defaultWidth: 600,
        defaultHeight: 300
      };
    case 'text-highlighting':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'text-highlighting',
        assignmentData: {
          question: 'Выделите важные части текста:',
          instructions: 'Нажмите на слова или фразы, которые являются ключевыми для понимания текста',
          textContent: 'Важная информация часто скрыта в тексте среди второстепенных деталей. Умение выделять главное - это ключевой навык для эффективного чтения.',
          highlightInstructions: 'Выделите фразы, которые содержат основную мысль текста',
          correctHighlights: ['Важная информация', 'Умение выделять главное', 'ключевой навык'],
          points: 15,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: true
        },
        defaultWidth: 600,
        defaultHeight: 250
      };
    case 'hint':
      return {
        backgroundColor: '#f8f9fa',
        borderColor: '#dee2e6',
        borderWidth: 1,
        borderRadius: 8,
        assignmentType: 'hint',
        assignmentData: {
          question: 'Подсказка',
          instructions: 'Нажмите кнопку, чтобы получить подсказку',
          hintText: 'Это подсказка, которая поможет вам в решении задачи. Используйте её мудро!',
          showHint: false,
          followUpQuestion: 'Теперь, когда вы получили подсказку, попробуйте решить задачу самостоятельно.',
          points: 5,
          pointsEnabled: true,
          timeLimit: null,
          showCorrectAnswer: false
        },
        defaultWidth: 400,
        defaultHeight: 200
      };
    // Icon cases - all icons have same basic properties
    case 'icon-home':
    case 'icon-user':
    case 'icon-settings':
    case 'icon-search':
    case 'icon-mail':
    case 'icon-phone':
    case 'icon-calendar':
    case 'icon-clock':
    case 'icon-map':
    case 'icon-camera':
    case 'icon-music':
    case 'icon-file':
    case 'icon-folder':
    case 'icon-download':
    case 'icon-upload':
    case 'icon-save':
    case 'icon-copy':
    case 'icon-trash':
    case 'icon-plus':
    case 'icon-x':
    case 'icon-check':
    case 'icon-menu':
    case 'icon-bell':
    case 'icon-alert':
    case 'icon-info':
    case 'icon-shield':
    case 'icon-lock':
    case 'icon-eye':
    case 'icon-thumbs-up':
    case 'icon-message':
    case 'icon-share':
    case 'icon-link':
    case 'icon-zap':
    case 'icon-award':
    case 'icon-gift':
    case 'icon-briefcase':
    case 'icon-flag':
    case 'icon-sun':
    case 'icon-moon':
    case 'icon-lightbulb':
    case 'icon-battery':
    case 'icon-wifi':
    case 'icon-globe':
    case 'icon-database':
    case 'icon-code':
    case 'icon-monitor':
    case 'icon-smartphone':
    case 'icon-play':
    case 'icon-volume':
    case 'icon-palette':
    case 'icon-bookmark':
    case 'icon-filter':
    case 'icon-refresh':
    // Educational SVG icons
    case 'icon-analysis':
    case 'icon-attention':
    case 'icon-speaking':
    case 'icon-homework':
    case 'icon-ask-question':
    case 'icon-game':
    case 'icon-game-1':
    case 'icon-game-2':
    case 'icon-internet':
    case 'icon-draw':
    case 'icon-circle':
    case 'icon-check-mark':
    case 'icon-puzzle':
    case 'icon-singing':
    case 'icon-writing':
    case 'icon-show':
    case 'icon-self-check':
    case 'icon-individual-work':
    case 'icon-group-work':
    case 'icon-pair-work':
    case 'icon-color':
    case 'icon-conclusion':
    case 'icon-listening':
    case 'icon-connect':
    case 'icon-functional-literacy':
    case 'icon-reading':
    case 'icon-video':
    case 'icon-video-library':
    case 'icon-globe-kg':
    case 'icon-monitor-kg':
    case 'icon-reflection':
    case 'icon-construct':
    case 'icon-goal':
    case 'icon-ae':
    case 'icon-disk':
    case 'icon-other-level':
    case 'icon-kite':
    case 'icon-initial-program-white':
    case 'icon-initial-program':
    case 'icon-pen-test':
    case 'icon-artistic-taste':
      return {
        iconType: toolId,
        color: '#000000',
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        defaultWidth: 80,
        defaultHeight: 80,
      };
    default:
      return {
        defaultWidth: 200,
        defaultHeight: 100,
      };
  }
};

// Helper function to create default table cells
export const createDefaultTableCells = (rows: number, columns: number) => {
  const cells: Record<string, any> = {};
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const cellKey = `${r}-${c}`;
      cells[cellKey] = {
        content: r === 0 ? `Заголовок ${c+1}` : `Ячейка ${r+1}-${c+1}`,
        backgroundColor: r === 0 ? '#f2f2f2' : 'transparent',
        textAlign: 'left',
        verticalAlign: 'middle',
        borderTop: true,
        borderRight: true,
        borderBottom: true,
        borderLeft: true,
        borderColor: '#cccccc',
        borderWidth: 1,
        fontWeight: r === 0 ? 'bold' : 'normal',
        padding: 8,
      };
    }
  }
  
  return cells;
}; 
