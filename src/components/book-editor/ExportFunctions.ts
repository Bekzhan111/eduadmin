import { Book, CanvasElement, CanvasSettings } from './types';

/**
 * Generates HTML from canvas elements
 */
export const generateHTMLFromElements = (
  elements: CanvasElement[], 
  settings: CanvasSettings, 
  book: Book
): string => {
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
  
  // Generate CSS for styling
  const css = `
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
    .page {
      position: relative;
      width: ${settings.canvasWidth}mm;
      height: ${settings.canvasHeight}mm;
      margin: 0 auto 20px;
      background: white;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      page-break-after: always;
    }
    .element {
      position: absolute;
    }
    .text {
      text-align: left;
      cursor: default;
    }
    .shape {
      border-radius: 0;
    }
    .shape.circle {
      border-radius: 50%;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
    }
  `;

  // Generate pages
  let pagesHtml = '';
  for (let i = 1; i <= settings.totalPages; i++) {
    const pageElements = sortedElements.filter(el => el.page === i);
    
    let elementsHtml = '';
    for (const element of pageElements) {
      if (!element.visible) continue;
      
      const style = `
        left: ${element.x}px;
        top: ${element.y}px;
        width: ${element.width}px;
        height: ${element.height}px;
        z-index: ${element.zIndex};
        transform: rotate(${element.rotation}deg);
        opacity: ${element.opacity};
        ${element.properties.backgroundColor ? `background-color: ${element.properties.backgroundColor};` : ''}
        ${element.properties.color ? `color: ${element.properties.color};` : ''}
        ${element.properties.fontSize ? `font-size: ${element.properties.fontSize}px;` : ''}
        ${element.properties.fontFamily ? `font-family: ${element.properties.fontFamily};` : ''}
        ${element.properties.fontWeight ? `font-weight: ${element.properties.fontWeight};` : ''}
        ${element.properties.fontStyle ? `font-style: ${element.properties.fontStyle};` : ''}
        ${element.properties.textDecoration ? `text-decoration: ${element.properties.textDecoration};` : ''}
        ${element.properties.borderWidth ? `border: ${element.properties.borderWidth}px ${element.properties.borderStyle || 'solid'} ${element.properties.borderColor || 'black'};` : ''}
        ${element.properties.borderRadius ? `border-radius: ${element.properties.borderRadius}px;` : ''}
        ${element.properties.shadow ? `box-shadow: ${element.properties.shadowOffsetX || 0}px ${element.properties.shadowOffsetY || 0}px ${element.properties.shadowBlur || 5}px ${element.properties.shadowColor || 'rgba(0,0,0,0.3)'};` : ''}
      `;
      
      let elementHtml = '';
      switch (element.type) {
        case 'text':
        case 'paragraph':
          elementHtml = `<div class="element text" style="${style}">${element.content}</div>`;
          break;
        case 'shape':
          const shapeClass = element.properties.shapeType === 'circle' ? 'shape circle' : 'shape';
          elementHtml = `<div class="element ${shapeClass}" style="${style}"></div>`;
          break;
        case 'image':
          if (element.properties.imageUrl) {
            elementHtml = `<div class="element" style="${style}"><img src="${element.properties.imageUrl}" alt="Изображение" style="width: 100%; height: 100%; object-fit: cover;" /></div>`;
          }
          break;
        case 'line':
          elementHtml = `<div class="element" style="${style}; height: ${element.properties.lineThickness || 1}px; background-color: ${element.properties.color || 'black'};"></div>`;
          break;
        case 'video':
          if (element.properties.videoUrl) {
            elementHtml = `
              <div class="element" style="${style}">
                <video 
                  src="${element.properties.videoUrl}" 
                  style="width: 100%; height: 100%;"
                  ${element.properties.controls ? 'controls' : ''}
                  ${element.properties.autoplay ? 'autoplay' : ''}
                  ${element.properties.muted ? 'muted' : ''}
                  ${element.properties.loop ? 'loop' : ''}>
                </video>
              </div>
            `;
          }
          break;
        case 'audio':
          if (element.properties.audioUrl) {
            elementHtml = `
              <div class="element" style="${style}">
                <audio 
                  src="${element.properties.audioUrl}" 
                  style="width: 100%;"
                  ${element.properties.controls ? 'controls' : ''}
                  ${element.properties.autoplay ? 'autoplay' : ''}
                  ${element.properties.loop ? 'loop' : ''}>
                </audio>
              </div>
            `;
          }
          break;
      }
      
      elementsHtml += elementHtml;
    }
    
    pagesHtml += `<div class="page">${elementsHtml}</div>`;
  }
  
  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${book.title}</title>
      <style>${css}</style>
    </head>
    <body>
      <h1 style="text-align: center; margin: 20px 0;">${book.title}</h1>
      ${pagesHtml}
    </body>
    </html>
  `;
};

/**
 * Generate PDF from canvas elements 
 * Note: This is a placeholder and would normally connect to a PDF generation service
 */
export const generatePDFFromElements = (
  elements: CanvasElement[], 
  settings: CanvasSettings, 
  book: Book
): string => {
  // This function would normally use a PDF library like jsPDF or call a backend service
  // For now, we'll return the HTML that could be converted to PDF
  const html = generateHTMLFromElements(elements, settings, book);
  
  // In a real implementation, you might use:
  // const pdf = await html2pdf().from(html).output();
  
  // For now, return the HTML with a note that it needs to be converted to PDF
  return html + `
    <!-- 
      NOTE: In a production environment, this HTML would be converted to PDF
      using a library like html2pdf or a server-side PDF generation service. 
    -->
  `;
};

/**
 * Generates editable source code from canvas elements
 */
export const generateEditableSourceCode = (
  elements: CanvasElement[], 
  settings: CanvasSettings, 
  book: Book
): string => {
  // Generate CSS for styling
  const generateCSS = () => {
    let css = `
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
      }
      
      .book-page {
        position: relative;
        width: ${settings.canvasWidth}mm;
        height: ${settings.canvasHeight}mm;
        margin: 0 auto 20px;
        background: white;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        page-break-after: always;
      }
      
      .book-element {
        position: absolute;
      }
      
      .book-text {
        text-align: left;
      }
      
      .book-shape {
        border-radius: 0;
      }
      
      .book-shape.circle {
        border-radius: 50%;
      }
      
      .book-image img {
        max-width: 100%;
        height: auto;
        display: block;
        object-fit: cover;
      }
    `;
    
    // Add custom styles for each element
    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    
    sortedElements.forEach((element, index) => {
      const elementId = `element-${index + 1}`;
      
      css += `
        #${elementId} {
          left: ${element.x}px;
          top: ${element.y}px;
          width: ${element.width}px;
          height: ${element.height}px;
          z-index: ${element.zIndex};
          transform: rotate(${element.rotation}deg);
          opacity: ${element.opacity};
          ${element.properties.backgroundColor ? `background-color: ${element.properties.backgroundColor};` : ''}
          ${element.properties.color ? `color: ${element.properties.color};` : ''}
          ${element.properties.fontSize ? `font-size: ${element.properties.fontSize}px;` : ''}
          ${element.properties.fontFamily ? `font-family: ${element.properties.fontFamily};` : ''}
          ${element.properties.fontWeight ? `font-weight: ${element.properties.fontWeight};` : ''}
          ${element.properties.fontStyle ? `font-style: ${element.properties.fontStyle};` : ''}
          ${element.properties.textDecoration ? `text-decoration: ${element.properties.textDecoration};` : ''}
          ${element.properties.borderWidth ? `border: ${element.properties.borderWidth}px ${element.properties.borderStyle || 'solid'} ${element.properties.borderColor || 'black'};` : ''}
          ${element.properties.borderRadius ? `border-radius: ${element.properties.borderRadius}px;` : ''}
          ${element.properties.shadow ? `box-shadow: ${element.properties.shadowOffsetX || 0}px ${element.properties.shadowOffsetY || 0}px ${element.properties.shadowBlur || 5}px ${element.properties.shadowColor || 'rgba(0,0,0,0.3)'};` : ''}
        }
      `;
    });
    
    return css;
  };

  // Generate HTML for the book
  let html = '';
  
  // Generate pages
  let pagesHtml = '';
  for (let i = 1; i <= settings.totalPages; i++) {
    const pageElements = elements.filter(el => el.page === i).sort((a, b) => a.zIndex - b.zIndex);
    
    let elementsHtml = '';
    pageElements.forEach((element, index) => {
      if (!element.visible) return;
      
      const elementId = `element-${index + 1}-page-${i}`;
      
      let elementHtml = '';
      switch (element.type) {
        case 'text':
        case 'paragraph':
          elementHtml = `<div id="${elementId}" class="book-element book-text">${element.content}</div>`;
          break;
        case 'shape':
          const shapeClass = element.properties.shapeType === 'circle' ? 'book-shape circle' : 'book-shape';
          elementHtml = `<div id="${elementId}" class="book-element ${shapeClass}"></div>`;
          break;
        case 'image':
          if (element.properties.imageUrl) {
            elementHtml = `<div id="${elementId}" class="book-element book-image"><img src="${element.properties.imageUrl}" alt="Изображение" /></div>`;
          }
          break;
        case 'line':
          elementHtml = `<div id="${elementId}" class="book-element book-line"></div>`;
          break;
        case 'video':
          if (element.properties.videoUrl) {
            elementHtml = `
              <div id="${elementId}" class="book-element book-video">
                <video 
                  src="${element.properties.videoUrl}" 
                  ${element.properties.controls ? 'controls' : ''}
                  ${element.properties.autoplay ? 'autoplay' : ''}
                  ${element.properties.muted ? 'muted' : ''}
                  ${element.properties.loop ? 'loop' : ''}>
                </video>
              </div>
            `;
          }
          break;
        case 'audio':
          if (element.properties.audioUrl) {
            elementHtml = `
              <div id="${elementId}" class="book-element book-audio">
                <audio 
                  src="${element.properties.audioUrl}" 
                  ${element.properties.controls ? 'controls' : ''}
                  ${element.properties.autoplay ? 'autoplay' : ''}
                  ${element.properties.loop ? 'loop' : ''}>
                </audio>
              </div>
            `;
          }
          break;
      }
      
      elementsHtml += elementHtml;
    });
    
    pagesHtml += `<div class="book-page" id="page-${i}">${elementsHtml}</div>`;
  }
  
  html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${book.title}</title>
      <style>
        ${generateCSS()}
      </style>
    </head>
    <body>
      <h1 style="text-align: center; margin: 20px 0;">${book.title}</h1>
      ${pagesHtml}
    </body>
    </html>
  `;
  
  return html;
}; 
