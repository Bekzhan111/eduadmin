'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  BarChart3, Users, Eye, Clock, Download, Star, 
  Smartphone, Monitor, Tablet,
  RefreshCw, FileText, Target, MessageCircle, Share2, Heart
} from 'lucide-react';

// Types for analytics data
export interface BookAnalytics {
  bookId: string;
  bookTitle: string;
  totalViews: number;
  uniqueViews: number;
  totalReads: number;
  completionRate: number;
  averageReadTime: number;
  totalComments: number;
  totalRatings: number;
  averageRating: number;
  totalShares: number;
  totalDownloads: number;
  engagementScore: number;
  growthRate: number;
}

export interface ViewsData {
  date: string;
  views: number;
  uniqueViews: number;
  reads: number;
}

export interface GeographicData {
  country: string;
  views: number;
  percentage: number;
}

export interface DeviceData {
  device: string;
  views: number;
  percentage: number;
  icon: React.ComponentType<any>;
}

export interface TrafficSource {
  source: string;
  views: number;
  percentage: number;
}

export interface ReaderBehavior {
  avgTimeOnPage: number;
  bounceRate: number;
  pagesPerSession: number;
  returnVisitorRate: number;
}

interface BookAnalyticsProps {
  bookId: string;
  bookTitle: string;
  dateRange?: string;
  className?: string;
}

export function BookAnalytics({ 
  bookId, 
  bookTitle,
  dateRange = '30d',
  className = ''
}: BookAnalyticsProps) {
  const [analytics, setAnalytics] = useState<BookAnalytics | null>(null);
  const [viewsData, setViewsData] = useState<ViewsData[]>([]);
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [readerBehavior, setReaderBehavior] = useState<ReaderBehavior | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState(dateRange);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock analytics data
      const mockAnalytics: BookAnalytics = {
        bookId,
        bookTitle,
        totalViews: 15847,
        uniqueViews: 12134,
        totalReads: 8903,
        completionRate: 67.3,
        averageReadTime: 42,
        totalComments: 234,
        totalRatings: 156,
        averageRating: 4.3,
        totalShares: 89,
        totalDownloads: 445,
        engagementScore: 78.5,
        growthRate: 12.4
      };

      // Mock views data for chart
      const mockViewsData: ViewsData[] = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 800) + 200,
        uniqueViews: Math.floor(Math.random() * 600) + 150,
        reads: Math.floor(Math.random() * 400) + 100
      }));

      // Mock geographic data
      const mockGeographicData: GeographicData[] = [
        { country: 'Россия', views: 8934, percentage: 56.4 },
        { country: 'Украина', views: 2145, percentage: 13.5 },
        { country: 'Беларусь', views: 1678, percentage: 10.6 },
        { country: 'Казахстан', views: 1234, percentage: 7.8 },
        { country: 'США', views: 891, percentage: 5.6 },
        { country: 'Германия', views: 567, percentage: 3.6 },
        { country: 'Другие', views: 398, percentage: 2.5 }
      ];

      // Mock device data
      const mockDeviceData: DeviceData[] = [
        { device: 'Мобильные', views: 9508, percentage: 60.0, icon: Smartphone },
        { device: 'Компьютеры', views: 4754, percentage: 30.0, icon: Monitor },
        { device: 'Планшеты', views: 1585, percentage: 10.0, icon: Tablet }
      ];

      // Mock traffic sources
      const mockTrafficSources: TrafficSource[] = [
        { source: 'Прямые переходы', views: 6339, percentage: 40.0 },
        { source: 'Поисковые системы', views: 4754, percentage: 30.0 },
        { source: 'Социальные сети', views: 3169, percentage: 20.0 },
        { source: 'Реферальные ссылки', views: 1585, percentage: 10.0 }
      ];

      // Mock reader behavior
      const mockReaderBehavior: ReaderBehavior = {
        avgTimeOnPage: 8.5,
        bounceRate: 23.4,
        pagesPerSession: 3.7,
        returnVisitorRate: 45.2
      };

      setAnalytics(mockAnalytics);
      setViewsData(mockViewsData);
      setGeographicData(mockGeographicData);
      setDeviceData(mockDeviceData);
      setTrafficSources(mockTrafficSources);
      setReaderBehavior(mockReaderBehavior);
      setIsLoading(false);
    };

    loadAnalytics();
  }, [bookId, selectedDateRange]);

  const handleRefresh = () => {
    // Reload analytics data
    window.location.reload();
  };

  const handleExport = () => {
    // Export analytics data
    const data = {
      analytics,
      viewsData,
      geographicData,
      deviceData,
      trafficSources,
      readerBehavior,
      exportDate: new Date().toISOString(),
      dateRange: selectedDateRange
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${bookId}-${selectedDateRange}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка аналитики...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Аналитика книги</h2>
              <p className="text-gray-600">"{bookTitle}"</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-gray-600">Период:</Label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="7d">7 дней</option>
                <option value="30d">30 дней</option>
                <option value="90d">3 месяца</option>
                <option value="1y">1 год</option>
              </select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="text-gray-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="text-blue-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">Просмотры</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{formatNumber(analytics.totalViews)}</div>
            <div className="text-xs text-blue-600">
              {analytics.growthRate > 0 ? '+' : ''}{formatPercentage(analytics.growthRate)} за период
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">Уникальные</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{formatNumber(analytics.uniqueViews)}</div>
            <div className="text-xs text-green-600">
              {formatPercentage((analytics.uniqueViews / analytics.totalViews) * 100)} от общих
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-purple-700 font-medium">Прочтения</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{formatNumber(analytics.totalReads)}</div>
            <div className="text-xs text-purple-600">
              {formatPercentage(analytics.completionRate)} завершили
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-700 font-medium">Время чтения</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">{formatTime(analytics.averageReadTime)}</div>
            <div className="text-xs text-orange-600">среднее время</div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700 font-medium">Рейтинг</span>
            </div>
            <div className="text-2xl font-bold text-yellow-900">{analytics.averageRating.toFixed(1)}</div>
            <div className="text-xs text-yellow-600">{formatNumber(analytics.totalRatings)} оценок</div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700 font-medium">Вовлеченность</span>
            </div>
            <div className="text-2xl font-bold text-red-900">{formatPercentage(analytics.engagementScore)}</div>
            <div className="text-xs text-red-600">общий индекс</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Динамика просмотров</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Просмотры</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Уникальные</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Прочтения</span>
              </div>
            </div>
          </div>
          
          {/* Simple chart representation */}
          <div className="h-64 flex items-end space-x-1">
            {viewsData.slice(-7).map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '200px' }}>
                  <div 
                    className="absolute bottom-0 left-0 w-1/3 bg-blue-500 rounded-t"
                    style={{ height: `${(data.views / 800) * 100}%` }}
                  ></div>
                  <div 
                    className="absolute bottom-0 left-1/3 w-1/3 bg-green-500 rounded-t"
                    style={{ height: `${(data.uniqueViews / 600) * 100}%` }}
                  ></div>
                  <div 
                    className="absolute bottom-0 right-0 w-1/3 bg-purple-500 rounded-t"
                    style={{ height: `${(data.reads / 400) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(data.date).getDate()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">География читателей</h3>
          <div className="space-y-3">
            {geographicData.map((country, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{country.country}</span>
                    <span className="text-sm text-gray-600">{formatNumber(country.views)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${country.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {formatPercentage(country.percentage)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Устройства</h3>
          <div className="space-y-4">
            {deviceData.map((device, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <device.icon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{device.device}</span>
                    <span className="text-sm text-gray-600">{formatPercentage(device.percentage)}</span>
                  </div>
                  <div className="text-xs text-gray-500">{formatNumber(device.views)} просмотров</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Источники трафика</h3>
          <div className="space-y-4">
            {trafficSources.map((source, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{source.source}</span>
                    <span className="text-sm text-gray-600">{formatPercentage(source.percentage)}</span>
                  </div>
                  <div className="text-xs text-gray-500">{formatNumber(source.views)} переходов</div>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-1 rounded-full"
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reader Behavior */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Поведение читателей</h3>
          {readerBehavior && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Среднее время на странице</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatTime(readerBehavior.avgTimeOnPage)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Показатель отказов</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatPercentage(readerBehavior.bounceRate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Страниц за сессию</span>
                <span className="text-sm font-medium text-gray-900">
                  {readerBehavior.pagesPerSession.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Возвращающиеся читатели</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatPercentage(readerBehavior.returnVisitorRate)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Engagement Details */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Детали вовлеченности</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="p-3 bg-blue-100 rounded-lg w-12 h-12 flex items-center justify-center mx-auto mb-2">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalComments)}</div>
            <div className="text-sm text-gray-600">Комментарии</div>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-lg w-12 h-12 flex items-center justify-center mx-auto mb-2">
              <Share2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalShares)}</div>
            <div className="text-sm text-gray-600">Поделились</div>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-purple-100 rounded-lg w-12 h-12 flex items-center justify-center mx-auto mb-2">
              <Download className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalDownloads)}</div>
            <div className="text-sm text-gray-600">Скачиваний</div>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-orange-100 rounded-lg w-12 h-12 flex items-center justify-center mx-auto mb-2">
              <Heart className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalRatings)}</div>
            <div className="text-sm text-gray-600">Оценок</div>
          </div>
        </div>
      </div>
    </div>
  );
} 