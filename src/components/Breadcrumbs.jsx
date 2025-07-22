"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Breadcrumbs({ currentDoc }) {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  useEffect(() => {
    const crumbs = [
      { href: '/', label: 'Documentation', isActive: false }
    ];

    if (currentDoc) {
      if (currentDoc.category && currentDoc.category !== 'General') {
        crumbs.push({
          href: `/?category=${encodeURIComponent(currentDoc.category)}`,
          label: currentDoc.category,
          isActive: false
        });
      }
      
      crumbs.push({
        href: pathname,
        label: currentDoc.title,
        isActive: true
      });
    }

    setBreadcrumbs(crumbs);
  }, [pathname, currentDoc]);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center">
          {index > 0 && (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor" 
              className="w-4 h-4 mx-2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          )}
          {crumb.isActive ? (
            <span className="text-gray-900 dark:text-white font-medium">
              {crumb.label}
            </span>
          ) : (
            <Link 
              href={crumb.href}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}