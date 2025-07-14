import React from 'react';

type EducationalIconProps = {
  svgFileName: string;
  className?: string;
  style?: React.CSSProperties;
};

// Map of SVG file names to their display names
export const SVG_ICON_NAMES = {
  'KG Анализ': 'Анализ',
  'KG АӘ': 'АӘ',
  'KG Внимание': 'Внимание',
  'KG Говорение': 'Говорение',
  'KG Диск': 'Диск',
  'KG Домашняя работа': 'Домашняя работа',
  'KG Другой уровень': 'Другой уровень',
  'KG Задай вопрос': 'Задай вопрос',
  'KG Игра': 'Игра',
  'KG Игра_1': 'Игра 1',
  'KG Игра_2': 'Игра 2',
  'KG Интернет': 'Интернет',
  'KG Нарисуй': 'Нарисуй',
  'KG Обведи': 'Обведи',
  'KG Отметь галочкой': 'Отметь галочкой',
  'KG Пазл': 'Пазл',
  'KG Пение': 'Пение',
  'KG Письмо': 'Письмо',
  'KG Покажи': 'Покажи',
  'KG Проверь себя': 'Проверь себя',
  'KG Работа Индивидуальная': 'Работа индивидуально',
  'KG Работа в Группе': 'Работа в группе',
  'KG Работа в Паре': 'Работа в паре',
  'KG Раскрась': 'Раскрась',
  'KG Сделай вывод': 'Сделай вывод',
  'KG Слушание': 'Слушание',
  'KG Соедини': 'Соедини',
  'KG Сохрани': 'Сохрани',
  'KG Функциональная грамотность': 'Функциональная грамотность',
  'KG Чтение': 'Чтение',
  'KG видео': 'Видео',
  'KG видеотека': 'Видеотека',
  'KG воз._змей': 'Воздушный змей',
  'KG глобус': 'Глобус',
  'KG монитор': 'Монитор',
  'KG на. программу_белый': 'Начальная программа (белый)',
  'KG нап. программу': 'Начальная программа',
  'KG проба пера': 'Проба пера',
  'KG рефлексия': 'Рефлексия',
  'KG сконструируй': 'Сконструируй',
  'KG художественный вкус': 'Художественный вкус',
  'KG цель': 'Цель'
} as const;

// Icons with large viewBox dimensions (841.89 × 595.28) that need scaling compensation
const LARGE_VIEWBOX_ICONS = new Set([
  'KG Анализ',
  'KG Пазл', 
  'KG видео',
  'KG Функциональная грамотность',
  'KG глобус',
  'KG рефлексия',
  'KG цель',
  'KG АӘ',
  'KG Другой уровень',
  'KG воз._змей',
  'KG на. программу_белый',
  'KG нап. программу',
  'KG проба пера',
  'KG художественный вкус',
  // Added missing problematic icons
  'KG Игра_1',
  'KG Игра_2', 
  'KG видеотека',
  'KG монитор',
  'KG сконструируй'
]);

export function EducationalIcon({ svgFileName, className = '', style }: EducationalIconProps) {
  // Determine if this is being used in toolbar (small) or canvas (large)
  // Check both style props and CSS classes for toolbar size indicators
  const hasSmallStyleSize = style?.width && (typeof style.width === 'number' ? style.width <= 20 : style.width.includes('16px'));
  const hasSmallCssClass = className.includes('h-4') || className.includes('w-4') || className.includes('h-3') || className.includes('w-3') || className.includes('h-6') || className.includes('w-6');
  const isToolbarSize = hasSmallStyleSize || hasSmallCssClass;
  
  // Check if this icon has a large viewBox that needs scaling compensation
  const hasLargeViewBox = LARGE_VIEWBOX_ICONS.has(svgFileName);
  
  // For large viewBox icons, we need much more aggressive sizing
  if (hasLargeViewBox && !isToolbarSize) {
    return (
      <div
        className={className}
        style={{
          width: style?.width || '100%',
          height: style?.height || '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden', // Keep within bounds but scale content
          ...style
        }}
      >
        <img 
          src={`/Кокжиек иконки SVG/${svgFileName}.svg`}
          alt={SVG_ICON_NAMES[svgFileName as keyof typeof SVG_ICON_NAMES] || svgFileName}
          style={{
            width: '1400%', // Increased to 1400% for ideal visibility
            height: '1400%',
            objectFit: 'contain',
            display: 'block',
            transformOrigin: 'center',
            maxWidth: 'none',
            maxHeight: 'none'
          }}
          onError={(e) => {
            console.warn(`Could not load SVG icon: ${svgFileName}`);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
    );
  }
  
  // Enhanced sizing for toolbar icons - apply same aggressive strategy as canvas
  if (isToolbarSize) {
    return (
      <div
        className={className}
        style={{
          width: style?.width || '24px', // Increased from 16px to 24px
          height: style?.height || '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          ...style
        }}
      >
        <img 
          src={`/Кокжиек иконки SVG/${svgFileName}.svg`}
          alt={SVG_ICON_NAMES[svgFileName as keyof typeof SVG_ICON_NAMES] || svgFileName}
          style={{
            width: hasLargeViewBox ? '1400%' : '100%', // Increased to 1400% for ideal visibility
            height: hasLargeViewBox ? '1400%' : '100%',
            objectFit: 'contain',
            display: 'block',
            transformOrigin: 'center',
            maxWidth: 'none', // Allow image to exceed container bounds
            maxHeight: 'none'
          }}
          onError={(e) => {
            console.warn(`Could not load SVG icon: ${svgFileName}`);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
    );
  }
  
  // Normal sizing for canvas (non-toolbar) icons
  return (
    <div
      className={className}
      style={{
        width: style?.width || '100%',
        height: style?.height || '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style
      }}
    >
      <img 
        src={`/Кокжиек иконки SVG/${svgFileName}.svg`}
        alt={SVG_ICON_NAMES[svgFileName as keyof typeof SVG_ICON_NAMES] || svgFileName}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
        onError={(e) => {
          console.warn(`Could not load SVG icon: ${svgFileName}`);
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    </div>
  );
}