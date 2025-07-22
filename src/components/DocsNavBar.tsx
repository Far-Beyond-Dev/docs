"use client";

import React from 'react';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';

interface DocsNavBarProps {
  onMenuToggle?: () => void;
}

export const DocsNavBar = ({ onMenuToggle }: DocsNavBarProps) => {
  return (
    <nav className="bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Left: Mobile Menu Button + Docs Title */}
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              onClick={onMenuToggle}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <span className="font-semibold text-lg text-gray-900 dark:text-white">Documentation</span>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-sm mx-8">
            <SearchBar />
          </div>

          {/* Right: Theme Toggle */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <SearchBar />
        </div>
      </div>
    </nav>
  );
};

export default DocsNavBar;