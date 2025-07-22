"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ isOpen, onClose }) {
  const [docsIndex, setDocsIndex] = useState([]);
  const [categorizedDocs, setCategorizedDocs] = useState({});
  const pathname = usePathname();

  useEffect(() => {
    // Load docs index for sidebar
    fetch('/docs-index.json')
      .then(res => res.json())
      .then(data => {
        setDocsIndex(data);
        
        // Group docs by category
        const grouped = data.reduce((acc, doc) => {
          const category = doc.category || 'General';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(doc);
          return acc;
        }, {});

        // Sort categories and docs within categories
        const sortedGrouped = {};
        Object.keys(grouped)
          .sort()
          .forEach(category => {
            sortedGrouped[category] = grouped[category].sort((a, b) => a.order - b.order);
          });

        setCategorizedDocs(sortedGrouped);
      })
      .catch(err => console.error('Error loading docs index:', err));
  }, []);

  const isActivePage = (slug) => {
    return pathname === `/entries/${slug}`;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            Documentation
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <div className="space-y-6">
            {Object.entries(categorizedDocs).map(([category, docs]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                  {category}
                </h3>
                <ul className="space-y-1">
                  {docs.map((doc) => (
                    <li key={doc.slug}>
                      <Link
                        href={`/entries/${doc.slug}`}
                        onClick={onClose}
                        className={`
                          block px-3 py-2 rounded-md text-sm transition-colors duration-200
                          ${isActivePage(doc.slug)
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{doc.title}</span>
                          {doc.tags && doc.tags.length > 0 && (
                            <span className="ml-2 text-xs text-gray-400">
                              {doc.tags.length}
                            </span>
                          )}
                        </div>
                        {doc.excerpt && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {doc.excerpt.substring(0, 60)}...
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {docsIndex.length} documentation pages
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}