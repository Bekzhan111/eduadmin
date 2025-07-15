// Enhanced Book type with version control and collaboration
export interface Book {
  id: string;
  title: string;
  base_url: string;
  description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  canvas_elements?: string;
  canvas_settings?: string;
  structure?: string;
  user_id?: string;
  author_id?: string;
  // Добавляем поля для дополнительной информации о книге
  cover_image?: string;
  author?: string;
  language?: string;
  is_published?: boolean;
  visibility?: 'public' | 'private' | 'unlisted';
  category?: string;
  tags?: string[];
}

// Book version for version history
export interface BookVersion {
  id: string;
  name: string;
  description?: string;
  timestamp: string;
  elements: CanvasElement[];
  userName: string;
  userId: string;
}

// Book export data structure
export interface BookExportData {
  version: string;
  exportDate: string;
  book: {
    title: string;
    description: string;
    language: string;
    author: string;
    cover_image: string;
    tags: string[];
    category: string;
  };
  settings: {
    canvasWidth: number;
    canvasHeight: number;
    totalPages: number;
    zoom: number;
    backgroundColor: string;
    gridSize: number;
    showGrid: boolean;
  };
  elements: CanvasElement[];
}

// Enhanced Canvas Element with grouping, animations, and filters
export interface CanvasElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'line' | 'paragraph' | 'video' | 'audio' | 'math' | 'icon' | 'table' | 'chart' | 'assignment' | 'arrow';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
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
    // Text properties
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: string;
    verticalAlign?: string;
    borderRadius?: number;
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: string;

    // Shape properties
    shapeType?: string;

    // Media properties
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    autoplay?: boolean;
    muted?: boolean;
    controls?: boolean;
    loop?: boolean;

    // Media metadata properties
    caption?: string;
    altText?: string;
    sourceInfo?: string;
    sourceUrl?: string;
    author?: string;
    license?: string;
    isUploading?: boolean;
    uploadProgress?: number;
    
    // Image cropping properties
    cropX?: number;
    cropY?: number;
    cropWidth?: number;
    cropHeight?: number;
    originalWidth?: number;
    originalHeight?: number;
    aspectRatio?: number;
    preserveAspectRatio?: boolean;

    // Line properties
    lineThickness?: number;
    arrowType?: string;

    // Math properties
    mathFormula?: string;
    mathDisplay?: string;
    mathSize?: string;
    mathFontSize?: number;
    mathColor?: string;

    // Table properties
    tableData?: {
      rows: number;
      columns: number;
      cells: Array<Array<{ content: string; style?: any }>>;
      headerRow?: boolean;
      headerColumn?: boolean;
      borderCollapse?: boolean;
      cellPadding?: number;
      cellSpacing?: number;
      borderColor?: string;
      borderWidth?: number;
      backgroundColor?: string;
    };

    // Chart properties
    chartType?: string;
    chartData?: any;
    chartOptions?: any;

    // Icon properties
    iconType?: string;

    // Assignment properties
    assignmentType?: string;
    assignmentData?: any;

    // Padding properties
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;

    // Default properties
    defaultWidth?: number;
    defaultHeight?: number;

    // Additional properties for customization
    [key: string]: any;
  };
}

// Canvas settings type
export interface CanvasSettings {
  canvasWidth: number;
  canvasHeight: number;
  totalPages: number;
  zoom: number;
  backgroundColor?: string;
  gridSize?: number;
  showGrid?: boolean;
}

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

// Enhanced Collaboration types for the new system
export type CollaboratorRole = 'owner' | 'editor' | 'reviewer' | 'viewer';

export type CollaboratorPermissions = {
  canEdit: boolean;
  canReview: boolean;
  canInvite: boolean;
  canDelete: boolean;
  canPublish: boolean;
};

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export type BookCollaborator = {
  id: string;
  book_id: string;
  user_id: string;
  role: CollaboratorRole;
  permissions: CollaboratorPermissions;
  invited_by: string;
  joined_at: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    display_name?: string;
    role?: string;
  };
};

export type CollaborationInvitation = {
  id: string;
  book_id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_id?: string;
  role: CollaboratorRole;
  permissions: CollaboratorPermissions;
  status: InvitationStatus;
  message?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  inviter?: {
    id: string;
    email: string;
    display_name?: string;
  };
  book?: {
    id: string;
    title: string;
    base_url: string;
  };
};

export type EditingSession = {
  id: string;
  book_id: string;
  user_id: string;
  section_id: string; // page number, element id, or section identifier
  section_type: 'page' | 'element' | 'chapter';
  locked_at: string;
  last_activity: string;
  cursor_position?: {
    x?: number;
    y?: number;
    selection?: any;
  };
  user?: {
    id: string;
    email: string;
    display_name?: string;
  };
};

export type UserPresence = {
  id: string;
  book_id: string;
  user_id: string;
  last_seen: string;
  is_online: boolean;
  current_section?: string;
  metadata?: {
    viewport?: any;
    cursor?: any;
    [key: string]: any;
  };
  user?: {
    id: string;
    email: string;
    display_name?: string;
  };
};

export type BookComment = {
  id: string;
  book_id: string;
  user_id: string;
  section_id: string;
  content: string;
  position_start?: number;
  position_end?: number;
  comment_type: 'comment' | 'suggestion' | 'question' | 'approval';
  status: 'open' | 'resolved' | 'closed';
  parent_id?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    display_name?: string;
  };
  replies?: BookComment[];
};

// Legacy comment type for backward compatibility
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

// Real-time collaboration events
export type CollaborationEvent = {
  type: 'presence_update' | 'editing_session_start' | 'editing_session_end' | 
        'comment_added' | 'comment_updated' | 'collaborator_joined' | 'collaborator_left';
  userId: string;
  bookId: string;
  data: any;
  timestamp: string;
};

// Collaboration context types
export type CollaborationContextType = {
  collaborators: BookCollaborator[];
  invitations: CollaborationInvitation[];
  presence: UserPresence[];
  editingSessions: EditingSession[];
  comments: BookComment[];
  currentUser: BookCollaborator | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  inviteCollaborator: (email: string, role: CollaboratorRole, message?: string) => Promise<void>;
  removeCollaborator: (collaboratorId: string) => Promise<void>;
  changeCollaboratorRole: (collaboratorId: string, newRole: CollaboratorRole) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  rejectInvitation: (invitationId: string) => Promise<void>;
  startEditingSession: (sectionId: string, sectionType: EditingSession['section_type']) => Promise<void>;
  endEditingSession: (sectionId: string) => Promise<void>;
  updatePresence: (currentSection?: string, metadata?: any) => Promise<void>;
  addComment: (sectionId: string, content: string, commentType?: BookComment['comment_type'], positionStart?: number, positionEnd?: number) => Promise<void>;
  updateComment: (commentId: string, content: string, status?: BookComment['status']) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
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

// Assignment types for CanvasElement.properties.assignmentType
export type AssignmentType =
  | 'multiple-choice'
  | 'open-question'
  | 'true-false'
  | 'matching'
  | 'quiz'
  | 'fill-in-blank'
  | 'multiple-select'
  | 'single-select'
  | 'dropdown-select'
  | 'image-hotspots'
  | 'connect-pairs'
  // Новые типы:
  | 'concept-map'         // Карта понятий
  | 'drag-to-point'       // Перетаскивание
  | 'numbers-on-image'    // Числа на изображении
  | 'grouping'            // Сгруппировать
  | 'ordering'            // Упорядочить
  | 'word-grid'           // Сетка слов
  | 'crossword'           // Кроссворд
  | 'highlight-words'     // Выделить слова
  | 'text-editing'        // Редактирование текста
  | 'text-highlighting'   // Выделение текста
  | 'hint';               // Подсказка

// Типы правильных ответов для заданий с пропусками
export type FillInBlankCorrectAnswerType = 
  | 'SINGLE'              // Один правильный ответ
  | 'MULTIPLE'            // Несколько правильных ответов
  | 'RANGE'               // Правильный ответ в диапазоне
  | 'NONE'                // Нет единого правильного ответа
  | 'EMPTY_IS_CORRECT'    // Незаполненный пропуск — правильный ответ
  | 'GROUP';              // Правильный ответ входит в группу

// Варианты для отображения в UI
export const FILL_IN_BLANK_ANSWER_TYPES = [
  { value: 'SINGLE', label: 'Один правильный ответ' },
  { value: 'MULTIPLE', label: 'Несколько правильных ответов' },
  { value: 'RANGE', label: 'Правильный ответ в диапазоне' },
  { value: 'NONE', label: 'Нет единого правильного ответа' },
  { value: 'EMPTY_IS_CORRECT', label: 'Незаполненный пропуск — правильный ответ' },
  { value: 'GROUP', label: 'Правильный ответ входит в группу' }
] as const; 
