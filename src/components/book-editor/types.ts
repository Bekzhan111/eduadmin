// Enhanced Book type with version control and collaboration
export type Book = {
  id: string;
  base_url: string;
  title: string;
  description: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  canvas_elements?: string;
  canvas_settings?: string;
  status?: 'Draft' | 'Moderation' | 'Approved' | 'Active' | 'Rejected';
  version?: number;
  collaborators?: string[];
  auto_save_enabled?: boolean;
  last_auto_save?: string;
};

// Enhanced Canvas Element with grouping, animations, and filters
export type CanvasElement = {
  id: string;
  type: 'text' | 'shape' | 'image' | 'line' | 'paragraph' | 'arrow' | 'icon' | 'video' | 'audio' | 'group' | 'table' | 'math' | 'chart' | 'assignment';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  page: number;
  zIndex: number;
  rotation: number;
  opacity: number;
  locked?: boolean;
  visible?: boolean;
  // Grouping support
  groupId?: string;
  isGroup?: boolean;
  children?: string[];
  // Animation properties
  animations?: {
    entrance?: 'fadeIn' | 'slideInLeft' | 'slideInRight' | 'slideInUp' | 'slideInDown' | 'zoomIn' | 'bounceIn';
    exit?: 'fadeOut' | 'slideOutLeft' | 'slideOutRight' | 'slideOutUp' | 'slideOutDown' | 'zoomOut' | 'bounceOut';
    duration?: number;
    delay?: number;
    iteration?: number;
  };
  // Enhanced properties
  properties: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    borderStyle?: string;
    textAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    shapeType?: 'rectangle' | 'circle' | 'triangle' | 'star' | 'heart';
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    lineThickness?: number;
    arrowType?: 'single' | 'double' | 'none';
    iconType?: string;
    shadow?: boolean;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    autoplay?: boolean;
    muted?: boolean;
    controls?: boolean;
    loop?: boolean;
    animation?: string;
    gradient?: {
      type: 'linear' | 'radial';
      colors: string[];
      direction?: number;
    };
    // Math formula properties
    mathFormula?: string;  // MathML content
    mathDisplay?: 'inline' | 'block';  // Display mode for math formulas
    mathSize?: 'small' | 'normal' | 'large';  // Size of the formula
    // Chart properties
    chartType?: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'scatter' | 'bubble';
    chartData?: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string;
        borderWidth?: number;
        fill?: boolean;
        tension?: number;
      }>;
    };
    chartOptions?: {
      title?: string;
      showLegend?: boolean;
      legendPosition?: 'top' | 'right' | 'bottom' | 'left';
      xAxisTitle?: string;
      yAxisTitle?: string;
      stacked?: boolean;
      beginAtZero?: boolean;
      aspectRatio?: number;
    };
    // Table properties
    tableData?: {
      rows: number;
      columns: number;
      cells: {
        [key: string]: {
          content: string;
          rowSpan?: number;
          colSpan?: number;
          backgroundColor?: string;
          textAlign?: 'left' | 'center' | 'right';
          verticalAlign?: 'top' | 'middle' | 'bottom';
          borderTop?: boolean;
          borderRight?: boolean;
          borderBottom?: boolean;
          borderLeft?: boolean;
          borderColor?: string;
          borderWidth?: number;
          fontWeight?: string;
          fontStyle?: string;
          textDecoration?: string;
          color?: string;
          padding?: number;
          isMerged?: boolean;
          mergedTo?: string;
        }
      };
      headerRow?: boolean;
      headerColumn?: boolean;
      borderCollapse?: boolean;
      cellPadding?: number;
      cellSpacing?: number;
      borderColor?: string;
      borderWidth?: number;
      alternateRowColors?: boolean;
      alternateRowColor?: string;
      backgroundColor?: string;
      borderRadius?: number;
    };
    // Assignment properties
    assignmentType?: 'multiple-choice' | 'open-question' | 'true-false' | 'matching' | 'quiz';
    assignmentData?: {
      question: string;
      instructions?: string;
      // Multiple choice specific
      options?: Array<{
        id: string;
        text: string;
        isCorrect?: boolean;
      }>;
      // True/False specific
      correctAnswer?: boolean;
      // Matching specific
      leftItems?: Array<{
        id: string;
        content: string;
      }>;
      rightItems?: Array<{
        id: string;
        content: string;
        matchWith: string; // id of left item
      }>;
      // Open question specific
      expectedAnswer?: string;
      answerLength?: 'short' | 'medium' | 'long';
      // Quiz specific
      quizQuestions?: Array<{
        id: string;
        question: string;
        type: 'multiple-choice' | 'true-false' | 'open';
        options?: Array<{
          id: string;
          text: string;
          isCorrect?: boolean;
        }>;
        correctAnswer?: boolean | string;
        points?: number;
      }>;
      // General settings
      points?: number;
      timeLimit?: number; // in minutes
      allowRetries?: boolean;
      showCorrectAnswer?: boolean;
      shuffleOptions?: boolean;
      difficultyLevel?: 1 | 2 | 3 | 4 | 5; // Звездная шкала сложности (1-5 звезд)
    };
    // Filters and effects
    filters?: {
      blur?: number;
      brightness?: number;
      contrast?: number;
      saturate?: number;
      sepia?: number;
      hueRotate?: number;
      invert?: boolean;
      grayscale?: number;
    };
    // Transform properties
    skewX?: number;
    skewY?: number;
    scaleX?: number;
    scaleY?: number;
    // Default size for scaling calculations
    defaultWidth?: number;
    defaultHeight?: number;
  };
};

// Enhanced Canvas Settings with guides and performance options
export type CanvasSettings = {
  zoom: number;
  currentPage: number;
  totalPages: number;
  canvasWidth: number;
  canvasHeight: number;
  showGrid: boolean;
  twoPageView: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showRulers: boolean;
  showGuides: boolean;
  // Smart guides
  smartGuides: boolean;
  snapToElements: boolean;
  snapDistance: number;
  // Performance settings
  renderQuality: 'draft' | 'normal' | 'high';
  enableAnimations: boolean;
  maxUndoSteps: number;
  // Auto-save settings
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
};

// Template system
export type Template = {
  id: string;
  name: string;
  preview: string;
  elements: CanvasElement[];
  category: 'basic' | 'business' | 'creative' | 'education' | 'presentation' | 'book' | 'magazine';
  tags: string[];
  author: string;
  downloads: number;
  premium: boolean;
};

// Collaboration types
export type _Comment = {
  id: string;
  elementId?: string;
  x: number;
  y: number;
  page: number;
  content: string;
  author: string;
  timestamp: Date;
  resolved: boolean;
  replies?: _Comment[];
};

// Enhanced tool definitions with more elements and categories
export const TOOLS = [
  // Content tools
  { id: 'text', name: 'Текст', label: 'Текст', icon: 'Type', category: 'content', needsFileUpload: false, hotkey: 'T' },
  { id: 'paragraph', name: 'Абзац', label: 'Абзац', icon: 'AlignLeft', category: 'content', needsFileUpload: false, hotkey: 'P' },
  { id: 'math', name: 'Формула', label: 'Формула', icon: 'Sigma', category: 'content', needsFileUpload: false, hotkey: 'M' },
  
  // Media tools
  { id: 'image', name: 'Изображение', label: 'Изображение', icon: 'ImageIcon', category: 'media', needsFileUpload: true, accepts: 'image/*', hotkey: 'I' },
  { id: 'video', name: 'Видео', label: 'Видео', icon: 'Video', category: 'media', needsFileUpload: true, accepts: 'video/*', hotkey: 'V' },
  { id: 'audio', name: 'Аудио', label: 'Аудио', icon: 'Volume2', category: 'media', needsFileUpload: true, accepts: 'audio/*', hotkey: 'U' },
  
  // Shape tools
  { id: 'rectangle', name: 'Прямоугольник', label: 'Прямоугольник', icon: 'Square', category: 'shapes', needsFileUpload: false, hotkey: 'R' },
  { id: 'circle', name: 'Круг', label: 'Круг', icon: 'Circle', category: 'shapes', needsFileUpload: false, hotkey: 'C' },
  { id: 'triangle', name: 'Треугольник', label: 'Треугольник', icon: 'Triangle', category: 'shapes', needsFileUpload: false, hotkey: '' },
  { id: 'star', name: 'Звезда', label: 'Звезда', icon: 'Star', category: 'shapes', needsFileUpload: false, hotkey: '' },
  { id: 'heart', name: 'Сердце', label: 'Сердце', icon: 'Heart', category: 'shapes', needsFileUpload: false, hotkey: '' },
  
  // Drawing tools
  { id: 'line', name: 'Линия', label: 'Линия', icon: 'Minus', category: 'drawing', needsFileUpload: false, hotkey: 'L' },
  { id: 'arrow', name: 'Стрелка', label: 'Стрелка', icon: 'ArrowRight', category: 'drawing', needsFileUpload: false, hotkey: 'A' },
  
  // Chart tools
  { id: 'bar-chart', name: 'Столбчатая диаграмма', label: 'Столбчатая', icon: 'BarChart', category: 'charts', needsFileUpload: false, hotkey: 'B' },
  { id: 'line-chart', name: 'Линейная диаграмма', label: 'Линейная', icon: 'LineChart', category: 'charts', needsFileUpload: false, hotkey: 'N' },
  { id: 'pie-chart', name: 'Круговая диаграмма', label: 'Круговая', icon: 'PieChart', category: 'charts', needsFileUpload: false, hotkey: 'G' },
] as const;

export const TOOL_CATEGORIES = [
  { id: 'content', label: 'Текст', icon: 'Type' },
  { id: 'shapes', label: 'Фигуры', icon: 'Square' },
  { id: 'media', label: 'Медиа', icon: 'ImageIcon' },
  { id: 'drawing', label: 'Рисование', icon: 'Minus' },
  { id: 'charts', label: 'Диаграммы', icon: 'BarChart' },
  { id: 'tables', label: 'Таблицы', icon: 'Table' },
];

// Predefined templates
export const _TEMPLATES: Template[] = [
  {
    id: 'title-page',
    name: 'Титульная страница',
    preview: '/templates/title-page.svg',
    category: 'basic',
    tags: ['заголовок', 'титул', 'обложка'],
    author: 'EduAdmin',
    downloads: 0,
    premium: false,
    elements: [
      {
        id: 'template-title',
        type: 'text',
        x: 50,
        y: 100,
        width: 400,
        height: 80,
        content: 'НАЗВАНИЕ КНИГИ',
        page: 1,
        zIndex: 1,
        rotation: 0,
        opacity: 1,
        properties: {
          fontSize: 48,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          color: '#2c3e50',
          textAlign: 'center',
        },
      },
      {
        id: 'template-subtitle',
        type: 'text',
        x: 50,
        y: 200,
        width: 400,
        height: 40,
        content: 'Подзаголовок или описание',
        page: 1,
        zIndex: 2,
        rotation: 0,
        opacity: 1,
        properties: {
          fontSize: 18,
          fontFamily: 'Arial',
          color: '#7f8c8d',
          textAlign: 'center',
        },
      },
      {
        id: 'template-author',
        type: 'text',
        x: 50,
        y: 350,
        width: 400,
        height: 30,
        content: 'Автор: Ваше имя',
        page: 1,
        zIndex: 3,
        rotation: 0,
        opacity: 1,
        properties: {
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#34495e',
          textAlign: 'center',
        },
      },
    ],
  },
  // Add more templates...
];

// Quick actions for selected elements
export const _QUICK_ACTIONS = [
  { id: 'duplicate', label: 'Дублировать', icon: 'Copy', hotkey: 'Ctrl+D' },
  { id: 'delete', label: 'Удалить', icon: 'Trash2', hotkey: 'Del' },
  { id: 'copy', label: 'Копировать', icon: 'Clipboard', hotkey: 'Ctrl+C' },
  { id: 'lock', label: 'Заблокировать', icon: 'Lock', hotkey: '' },
  { id: 'bring-front', label: 'На передний план', icon: 'ArrowUp', hotkey: '' },
  { id: 'rotate', label: 'Повернуть', icon: 'RotateCw', hotkey: 'R' },
  { id: 'align-center', label: 'Центрировать', icon: 'Target', hotkey: '' },
  { id: 'flip-h', label: 'Отразить по горизонтали', icon: 'FlipHorizontal', hotkey: '' },
];

// Export type for the tool component
export type ToolType = {
  id: string;
  name: string;
  label: string;
  icon: string;  // Changed from component reference to string
  category: string;
  needsFileUpload: boolean;
  accepts?: string;
  hotkey: string;
};

export type MediaType = 'image' | 'video' | 'audio';

export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
}; 
