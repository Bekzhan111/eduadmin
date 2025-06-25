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
      return 60; // Smaller default width for icons
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
      return 60; // Smaller default height for icons (square)
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
              data: [12, 19, 3, 5, 2, 3],
              backgroundColor: 'rgba(54, 162, 235, 0.8)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
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
              data: [12, 19, 3, 5, 2, 3],
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true,
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
              data: [12, 19, 3, 5, 2],
              backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
                'rgba(153, 102, 255, 0.8)',
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
              ],
              borderWidth: 1,
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
          timeLimit: null,
          showCorrectAnswer: true
        }
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
      return {
        iconType: toolId,
        color: '#000000',
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 0,
        defaultWidth: 60,
        defaultHeight: 60,
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
