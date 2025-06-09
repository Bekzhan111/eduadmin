'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Menu, X } from 'lucide-react';
import { UserInfo } from '@/components/ui/user-info';

export default function MarketplaceHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              EduBooks
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/marketplace" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Книги
            </Link>
            <Link 
              href="/school-registration" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Школы
            </Link>
            <Link 
              href="/bulk-purchase" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Оптовые Заказы
            </Link>
          </nav>

          {/* Right Side Actions - Desktop */}
          <div className="hidden md:flex">
            <UserInfo variant="header" />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/marketplace" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Книги
              </Link>
              <Link 
                href="/school-registration" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Школы
              </Link>
              <Link 
                href="/bulk-purchase" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Оптовые Заказы
              </Link>
              <div className="pt-4 border-t border-gray-200">
                <UserInfo variant="compact" />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 