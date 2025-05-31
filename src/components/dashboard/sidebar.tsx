'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  UserCog,
  KeyRound,
  School,
  GraduationCap
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  role?: string[];
}

interface SidebarProps {
  userRole?: string;
}

export default function DashboardSidebar({ userRole = 'student' }: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { 
      name: 'Панель управления', 
      href: '/dashboard', 
      icon: <LayoutDashboard className="h-5 w-5" /> 
    },
    { 
      name: 'Регистрация роли', 
      href: '/register', 
      icon: <UserCog className="h-5 w-5" /> 
    },
    { 
      name: 'Управление пользователями', 
      href: '/dashboard/users', 
      icon: <Users className="h-5 w-5" />,
      role: ['super_admin', 'school']
    },
    { 
      name: 'Управление ключами', 
      href: '/dashboard/keys', 
      icon: <KeyRound className="h-5 w-5" />,
      role: ['super_admin', 'school']
    },
    { 
      name: 'Школы', 
      href: '/dashboard/schools', 
      icon: <School className="h-5 w-5" />,
      role: ['super_admin']
    },
    { 
      name: 'Контент', 
      href: '/dashboard/content', 
      icon: <FileText className="h-5 w-5" />,
      role: ['author', 'moderator']
    },
    { 
      name: 'Студенты', 
      href: '/dashboard/students', 
      icon: <GraduationCap className="h-5 w-5" />,
      role: ['school', 'teacher']
    },
    { 
      name: 'Настройки', 
      href: '/dashboard/settings', 
      icon: <Settings className="h-5 w-5" /> 
    },
  ];

  const filteredNavItems = navItems.filter(
    item => !item.role || item.role.includes(userRole)
  );

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex min-h-0 flex-1 flex-col border-r bg-white dark:bg-slate-900">
        <div className="flex h-16 items-center border-b px-6">
          <span className="font-semibold text-lg">Админ Панель</span>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <nav className="flex-1 space-y-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  pathname === item.href
                    ? 'bg-gray-100 dark:bg-slate-800 text-black dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-black dark:hover:text-white',
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
                )}
              >
                <div className={cn(
                  "mr-3 flex-shrink-0",
                  pathname === item.href
                    ? "text-black dark:text-white"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white"
                )}>
                  {item.icon}
                </div>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
} 