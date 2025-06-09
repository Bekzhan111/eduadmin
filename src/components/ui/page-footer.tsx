'use client';

import React from 'react';
import { UserInfo } from '@/components/ui/user-info';

interface PageFooterProps {
  bookTitle?: string;
  className?: string;
}

export function PageFooter({ bookTitle, className = '' }: PageFooterProps) {
  return (
    <footer className={`bg-white dark:bg-gray-800 border-t mt-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © 2024 Образовательная платформа.
            {bookTitle && (
              <> Книга &quot;{bookTitle}&quot; доступна для свободного чтения.</>
            )}
          </div>
          <UserInfo variant="footer" />
        </div>
      </div>
    </footer>
  );
} 