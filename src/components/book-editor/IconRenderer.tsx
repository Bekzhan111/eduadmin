import React from 'react';
import { 
  Home, User, Settings, Search, Mail, Phone, Calendar, Clock, Map, Camera, Music, File, Folder, Download, Upload, Save, Copy, Trash, Plus, X, Check, Menu, Bell, AlertCircle, Info, Shield, Lock, Eye, ThumbsUp, MessageCircle, Share, Link, Zap, Award, Gift, Briefcase, Flag, Sun, Moon, Lightbulb, Battery, Wifi, Globe, Database, Code, Monitor, Smartphone, PlayCircle, Volume, Palette, Bookmark, Filter, RefreshCw
} from 'lucide-react';

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

export function renderIcon(iconType: string, props: IconProps = {}) {
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

export { iconMap }; 
