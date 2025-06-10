'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Users, TrendingUp, Calendar, User, Clock } from 'lucide-react';
import { getRecentViewers as _getRecentViewers } from '@/utils/book-views';
import { createClient as _createClient } from '@/utils/supabase';

interface BookViewStats {
  total_views: number;
  unique_viewers: number;
  registered_viewers: number;
  anonymous_viewers: number;
  views_today: number;
  views_this_week: number;
  views_this_month: number;
}

interface RecentViewer {
  id: string;
  viewed_at: string;
  user_id: string;
  users: {
    display_name: string;
    email: string;
  } | null;
}

interface BookViewStatsComponentProps {
  bookId: string;
  showDetailedStats?: boolean;
  className?: string;
}

export default function BookViewStatsComponent({ 
  bookId, 
  showDetailedStats = false,
  className = '' 
}: BookViewStatsComponentProps) {
  const [stats, setStats] = useState<BookViewStats | null>(null);
  const [recentViewers, setRecentViewers] = useState<RecentViewer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showViewers, setShowViewers] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // For now, show placeholder data until migration is complete
        const placeholderStats: BookViewStats = {
          total_views: Math.floor(Math.random() * 1000) + 50,
          unique_viewers: Math.floor(Math.random() * 500) + 25,
          registered_viewers: Math.floor(Math.random() * 300) + 15,
          anonymous_viewers: Math.floor(Math.random() * 200) + 10,
          views_today: Math.floor(Math.random() * 50) + 5,
          views_this_week: Math.floor(Math.random() * 200) + 20,
          views_this_month: Math.floor(Math.random() * 500) + 50,
        };
        
        setStats(placeholderStats);
        
        // TODO: Replace with actual API call once migration is complete
        // const stats = await getBookViewStats(bookId);
        // setStats(stats);
        
        if (showDetailedStats) {
          // Placeholder recent viewers
          const placeholderViewers: RecentViewer[] = [
            {
              id: '1',
              viewed_at: new Date().toISOString(),
              user_id: 'user1',
              users: { display_name: 'Анна Иванова', email: 'anna@example.com' }
            },
            {
              id: '2', 
              viewed_at: new Date(Date.now() - 3600000).toISOString(),
              user_id: 'user2',
              users: { display_name: 'Петр Петров', email: 'petr@example.com' }
            }
          ];
          
          setRecentViewers(placeholderViewers);
          
          // TODO: Replace with actual API call
          // const viewers = await getRecentViewers(bookId);
          // setRecentViewers(viewers as unknown as RecentViewer[]);
        }
      } catch (error) {
        console.error('Error fetching book view stats:', error);
        // Set default stats on error
        setStats({
          total_views: 0,
          unique_viewers: 0,
          registered_viewers: 0,
          anonymous_viewers: 0,
          views_today: 0,
          views_this_week: 0,
          views_this_month: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [bookId, showDetailedStats]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  if (!showDetailedStats) {
    // Simple view for book cards/lists
    return (
      <div className={`flex items-center gap-4 text-sm text-gray-600 ${className}`}>
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          <span>{stats.total_views} просмотров</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{stats.unique_viewers} зрителей</span>
        </div>
      </div>
    );
  }

  // Detailed view for book pages
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Статистика просмотров
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total_views}
              </div>
              <div className="text-sm text-gray-600">
                Всего просмотров
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.unique_viewers}
              </div>
              <div className="text-sm text-gray-600">
                Уникальных зрителей
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.registered_viewers}
              </div>
              <div className="text-sm text-gray-600">
                Зарегистрированных
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.anonymous_viewers}
              </div>
              <div className="text-sm text-gray-600">
                Анонимных
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time-based Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Просмотры по времени
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="font-semibold text-blue-800">Сегодня</div>
                <div className="text-sm text-blue-600">За последние 24 часа</div>
              </div>
              <div className="text-xl font-bold text-blue-600">
                {stats.views_today}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="font-semibold text-green-800">Эта неделя</div>
                <div className="text-sm text-green-600">За последние 7 дней</div>
              </div>
              <div className="text-xl font-bold text-green-600">
                {stats.views_this_week}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <div className="font-semibold text-purple-800">Этот месяц</div>
                <div className="text-sm text-purple-600">За последние 30 дней</div>
              </div>
              <div className="text-xl font-bold text-purple-600">
                {stats.views_this_month}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Viewers */}
      {recentViewers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Недавние читатели
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowViewers(!showViewers)}
              >
                {showViewers ? 'Скрыть' : 'Показать'}
              </Button>
            </div>
          </CardHeader>
          {showViewers && (
            <CardContent>
              <div className="space-y-3">
                {recentViewers.map((viewer) => (
                  <div key={viewer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {viewer.users?.display_name || viewer.users?.email || 'Пользователь'}
                        </div>
                        {viewer.users?.email && viewer.users?.display_name && (
                          <div className="text-sm text-gray-500">
                            {viewer.users.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      {new Date(viewer.viewed_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
} 