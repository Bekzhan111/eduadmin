'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Settings, BookOpen } from 'lucide-react';

interface UserInfoProps {
  variant?: 'header' | 'footer' | 'compact';
  showRole?: boolean;
  className?: string;
}

export function UserInfo({ 
  variant = 'footer', 
  showRole = true, 
  className = '' 
}: UserInfoProps) {
  const { user, userProfile, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse flex space-x-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          <div className="w-16 h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  // User is not logged in
  if (!user || !userProfile) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {variant === 'compact' ? (
          <>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm">
                Войти
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="sm" className="text-sm">
                Регистрация
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700">
              Войти
            </Link>
            <span className="text-sm text-gray-400">•</span>
            <Link href="/register" className="text-sm text-blue-600 hover:text-blue-700">
              Регистрация
            </Link>
          </>
        )}
      </div>
    );
  }

  // User is logged in
  const displayName = userProfile.display_name || userProfile.email;
  const roleTranslation = {
    'super_admin': 'Супер-админ',
    'school_admin': 'Админ школы',
    'teacher': 'Учитель',
    'student': 'Ученик',
    'author': 'Автор'
  };
  const roleLabel = roleTranslation[userProfile.role as keyof typeof roleTranslation] || userProfile.role;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">{displayName}</span>
            {showRole && (
              <Badge variant="secondary" className="text-xs">
                {roleLabel}
              </Badge>
            )}
          </div>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="text-xs">
            <Settings className="h-3 w-3 mr-1" />
            Панель
          </Button>
        </Link>
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">{displayName}</span>
              {showRole && (
                <Badge variant="secondary" className="text-xs">
                  {roleLabel}
                </Badge>
              )}
            </div>
            <span className="text-xs text-gray-500">{userProfile.email}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Панель управления
            </Button>
          </Link>
          <Link href="/dashboard/books">
            <Button variant="ghost" size="sm">
              <BookOpen className="h-4 w-4 mr-2" />
              Мои книги
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={async () => {
              await logout();
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>
    );
  }

  // Default footer variant
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm text-gray-600">
          Добро пожаловать, <span className="font-medium">{displayName}</span>
        </span>
        {showRole && (
          <Badge variant="outline" className="text-xs">
            {roleLabel}
          </Badge>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
          Панель управления
        </Link>
        <span className="text-sm text-gray-400">•</span>
        <button 
          onClick={async () => {
            await logout();
          }}
          className="text-sm text-gray-600 hover:text-gray-700"
        >
          Выйти
        </button>
      </div>
    </div>
  );
} 