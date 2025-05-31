'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Star, Users } from 'lucide-react';
import Image from 'next/image';

interface Book {
  id: string;
  title: string;
  description: string;
  grade_level: string;
  course: string;
  category: string;
  price: number;
  cover_image: string;
  language: string;
  pages_count: number;
  schools_purchased: number;
  downloads_count: number;
  created_at: string;
}

export default function FeaturedBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      const supabase = createClient();
      
      try {
        const { data: books, error } = await supabase
          .from('books')
          .select('*')
          .eq('status', 'Active')
          .order('schools_purchased', { ascending: false })
          .limit(6);

        if (error) {
          console.error('Error fetching featured books:', error);
          return;
        }

        setBooks(books || []);
      } catch (error) {
        console.error('Error fetching featured books:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Книги пока недоступны
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Загляните позже за новым образовательным контентом!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {books.map((book) => (
        <Card key={book.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            {book.cover_image ? (
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
                <Image
                  src={book.cover_image || "/placeholder-book.jpg"}
                  alt={book.title}
                  width={200}
                  height={280}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-4 flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-white" />
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {book.grade_level && (
                  <Badge variant="secondary" className="text-xs">
                    {book.grade_level}
                  </Badge>
                )}
                {book.category && (
                  <Badge variant="outline" className="text-xs">
                    {book.category}
                  </Badge>
                )}
              </div>
              
              <CardTitle className="text-lg line-clamp-2">
                {book.title}
              </CardTitle>
              
              {book.course && (
                <CardDescription className="text-sm text-blue-600 dark:text-blue-400">
                  {book.course}
                </CardDescription>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col justify-between">
            <div className="space-y-3 mb-4">
              {book.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                  {book.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                {book.pages_count && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {book.pages_count} стр.
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {book.schools_purchased} школ
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  ${book.price || 'Бесплатно'}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {book.language === 'English' ? 'Английский' : book.language || 'Русский'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Link href={`/marketplace/books/${book.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Подробнее
                </Button>
              </Link>
              <Link href={`/marketplace/books/${book.id}/purchase`}>
                <Button size="sm" className="w-full">
                  Купить Книгу
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 