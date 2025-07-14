import React from 'react';
import { 
  Home, User, Settings, Search, Mail, Phone, Calendar, Clock, Map, Camera, Music, File, Folder, Download, Upload, Save, Copy, Trash, Plus, X, Check, Menu, Bell, AlertCircle, Info, Shield, Lock, Eye, ThumbsUp, MessageCircle, Share, Link, Zap, Award, Gift, Briefcase, Flag, Sun, Moon, Lightbulb, Battery, Wifi, Globe, Database, Code, Monitor, Smartphone, PlayCircle, Volume, Palette, Bookmark, Filter, RefreshCw
} from 'lucide-react';
import { EducationalIcon } from './EducationalIcon';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const iconMap = {
  'icon-home': Home,
  'icon-user': User,
  'icon-settings': Settings,
  'icon-search': Search,
  'icon-mail': Mail,
  'icon-phone': Phone,
  'icon-calendar': Calendar,
  'icon-clock': Clock,
  'icon-map': Map,
  'icon-camera': Camera,
  'icon-music': Music,
  'icon-file': File,
  'icon-folder': Folder,
  'icon-download': Download,
  'icon-upload': Upload,
  'icon-save': Save,
  'icon-copy': Copy,
  'icon-trash': Trash,
  'icon-plus': Plus,
  'icon-x': X,
  'icon-check': Check,
  'icon-menu': Menu,
  'icon-bell': Bell,
  'icon-alert': AlertCircle,
  'icon-info': Info,
  'icon-shield': Shield,
  'icon-lock': Lock,
  'icon-eye': Eye,
  'icon-thumbs-up': ThumbsUp,
  'icon-message': MessageCircle,
  'icon-share': Share,
  'icon-link': Link,
  'icon-zap': Zap,
  'icon-award': Award,
  'icon-gift': Gift,
  'icon-briefcase': Briefcase,
  'icon-flag': Flag,
  'icon-sun': Sun,
  'icon-moon': Moon,
  'icon-lightbulb': Lightbulb,
  'icon-battery': Battery,
  'icon-wifi': Wifi,
  'icon-globe': Globe,
  'icon-database': Database,
  'icon-code': Code,
  'icon-monitor': Monitor,
  'icon-smartphone': Smartphone,
  'icon-play': PlayCircle,
  'icon-volume': Volume,
  'icon-palette': Palette,
  'icon-bookmark': Bookmark,
  'icon-filter': Filter,
  'icon-refresh': RefreshCw,
};

// SVG icon mapping for educational icons
const svgIconMap = {
  'icon-analysis': 'KG Анализ',
  'icon-ae': 'KG АӘ',
  'icon-attention': 'KG Внимание',
  'icon-speaking': 'KG Говорение',
  'icon-disk': 'KG Диск',
  'icon-homework': 'KG Домашняя работа',
  'icon-other-level': 'KG Другой уровень',
  'icon-ask-question': 'KG Задай вопрос',
  'icon-game': 'KG Игра',
  'icon-game-1': 'KG Игра_1',
  'icon-game-2': 'KG Игра_2',
  'icon-internet': 'KG Интернет',
  'icon-draw': 'KG Нарисуй',
  'icon-circle': 'KG Обведи',
  'icon-check-mark': 'KG Отметь галочкой',
  'icon-puzzle': 'KG Пазл',
  'icon-singing': 'KG Пение',
  'icon-writing': 'KG Письмо',
  'icon-show': 'KG Покажи',
  'icon-check-yourself': 'KG Проверь себя',
  'icon-individual-work': 'KG Работа Индивидуальная',
  'icon-group-work': 'KG Работа в Группе',
  'icon-pair-work': 'KG Работа в Паре',
  'icon-color': 'KG Раскрась',
  'icon-conclusion': 'KG Сделай вывод',
  'icon-listening': 'KG Слушание',
  'icon-connect': 'KG Соедини',
  'icon-save': 'KG Сохрани',
  'icon-functional-literacy': 'KG Функциональная грамотность',
  'icon-reading': 'KG Чтение',
  'icon-video': 'KG видео',
  'icon-video-library': 'KG видеотека',
  'icon-kite': 'KG воз._змей',
  'icon-globe': 'KG глобус',
  'icon-monitor': 'KG монитор',
  'icon-initial-program-white': 'KG на. программу_белый',
  'icon-initial-program': 'KG нап. программу',
  'icon-pen-test': 'KG проба пера',
  'icon-reflection': 'KG рефлексия',
  'icon-construct': 'KG сконструируй',
  'icon-artistic-taste': 'KG художественный вкус',
  'icon-goal': 'KG цель'
};

export function renderIcon(iconType: string, props: IconProps = {}) {
  // Check if it's a custom SVG icon first
  const svgFileName = svgIconMap[iconType as keyof typeof svgIconMap];
  if (svgFileName) {
    return (
      <EducationalIcon 
        svgFileName={svgFileName}
        className={props.className || ''}
        style={{
          width: props.size || 24,
          height: props.size || 24,
          filter: props.color && props.color !== 'currentColor' ? `hue-rotate(${getHueRotation(props.color)}deg)` : undefined
        }}
      />
    );
  }
  
  // Fall back to regular Lucide icons
  const IconComponent = iconMap[iconType as keyof typeof iconMap];
  
  if (!IconComponent) {
    return (
      <div 
        className={`flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-500 ${props.className || ''}`}
        style={{ 
          width: props.size || 24, 
          height: props.size || 24,
          fontSize: Math.max(8, (props.size || 24) * 0.3)
        }}
      >
        ?
      </div>
    );
  }
  
  return (
    <IconComponent 
      size={props.size || 24}
      color={props.color || 'currentColor'}
      className={props.className || ''}
    />
  );
}

// Helper function to convert color to hue rotation (simplified)
function getHueRotation(color: string): number {
  // This is a simplified color-to-hue conversion
  // For a more robust solution, you'd want a proper color library
  const colorMap: { [key: string]: number } = {
    'red': 0,
    'orange': 30,
    'yellow': 60,
    'green': 120,
    'blue': 240,
    'purple': 270,
    'pink': 330
  };
  
  return colorMap[color.toLowerCase()] || 0;
}

export { iconMap }; 
