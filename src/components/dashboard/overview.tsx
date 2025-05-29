'use client';

import { useState, useEffect } from 'react';

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    activeSessions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Simulating API response delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        setStats({
          totalUsers: 128,
          totalPosts: 543,
          activeSessions: 28,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard 
        title="Total Users" 
        value={stats.totalUsers} 
        isLoading={isLoading} 
        description="Active user accounts"
      />
      <StatCard 
        title="Total Posts" 
        value={stats.totalPosts} 
        isLoading={isLoading} 
        description="Published content"
      />
      <StatCard 
        title="Active Sessions" 
        value={stats.activeSessions} 
        isLoading={isLoading} 
        description="Currently online"
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  isLoading: boolean;
}

function StatCard({ title, value, description, isLoading }: StatCardProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        <div className="mt-6">
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          ) : (
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  );
} 