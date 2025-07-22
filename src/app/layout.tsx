'use client';

import './globals.css';
import Header from '../components/Header';
import DocsNavBar from '../components/DocsNavBar';
import Footer from '../components/Footer';
import { Inter } from 'next/font/google';
import { useEffect, useState } from 'react';
import mermaid from 'mermaid';

const inter = Inter({ subsets: ['latin'] });

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    const target = e.target as HTMLElement | null;

    if (
      target?.tagName === 'SCRIPT' &&
      (target as HTMLScriptElement).src?.includes('/_next/static/chunks')
    ) {
      console.warn('[ChunkLoadError] Reloading due to missing chunk:', (target as HTMLScriptElement).src);
      window.location.reload();
    }
  });
}

const metadata = {
  title: 'Docs - Horizon - Far Beyond',
  description: "Horizon game server documentation from Far Beyond",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Initialize theme based on localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && systemDark);
    
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
    });
  }, []);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <html lang="en" className={darkMode ? 'dark' : ''}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={metadata.description} />
        <title>{metadata.title}</title>
      </head>

      <body className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <div className="flex flex-col h-screen">
          {/* Original Header */}
          <Header />
          
          <div className="flex flex-1">
            
            {/* Main content area */}
            <div className="flex-1 flex flex-col lg:ml-0">
              {/* Secondary Navigation */}
              
              <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto px-4 py-8 max-w-6xl">
                  {children}
                </div>
              </main>
              
              <Footer />
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
