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
    // Always use dark mode
    setDarkMode(true);
    document.documentElement.classList.add('dark');

    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
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
          
          <main className="flex-1 overflow-y-auto scroll-smooth">
            <div className="container mx-auto px-6 py-8 max-w-7xl relative">
              {children}
            </div>
            <Footer />
          </main>
        </div>
      </body>
    </html>
  );
}
