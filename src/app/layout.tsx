import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Educational Platform',
  description: 'Role-based educational administration system',
};

// Компонент для обработки загрузки страницы
function PageLoadHandler() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          // Проверяем, полностью ли загружена страница
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
              document.documentElement.classList.add('page-loaded');
            });
          } else {
            document.documentElement.classList.add('page-loaded');
          }
          
          // Устанавливаем таймаут для принудительной загрузки, если что-то пошло не так
          setTimeout(function() {
            document.documentElement.classList.add('page-loaded');
          }, 2000);
        `,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <PageLoadHandler />
        <style dangerouslySetInnerHTML={{
          __html: `
            html:not(.page-loaded) body {
              visibility: hidden;
              opacity: 0;
            }
            html.page-loaded body {
              visibility: visible;
              opacity: 1;
              transition: opacity 0.3s ease;
            }
            .page-loader {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: white;
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 9999;
              transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            html.page-loaded .page-loader {
              opacity: 0;
              visibility: hidden;
            }
            .loader {
              width: 48px;
              height: 48px;
              border: 5px solid #3b82f6;
              border-bottom-color: transparent;
              border-radius: 50%;
              display: inline-block;
              box-sizing: border-box;
              animation: rotation 1s linear infinite;
            }
            @keyframes rotation {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />
      </head>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <div className="page-loader">
          <span className="loader"></span>
        </div>
        <Suspense fallback={<div className="page-loader"><span className="loader"></span></div>}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
