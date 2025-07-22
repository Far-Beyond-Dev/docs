"use client";

import { useState, useEffect } from 'react';

export default function TableOfContents({ content }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!content) return;

    // Extract headings from markdown content
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const extractedHeadings = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      // Generate ID that matches what the markdown renderer creates
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
        .trim();

      extractedHeadings.push({
        id,
        text,
        level,
      });
    }

    setHeadings(extractedHeadings);
    
    // Also try to find headings that are actually rendered in the DOM
    setTimeout(() => {
      const renderedHeadings = [];
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      headingElements.forEach(element => {
        if (element.id) {
          const level = parseInt(element.tagName.charAt(1));
          renderedHeadings.push({
            id: element.id,
            text: element.textContent?.trim() || '',
            level,
          });
        }
      });
      
      if (renderedHeadings.length > 0) {
        setHeadings(renderedHeadings);
      }
    }, 100);
  }, [content]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0% -80% 0%',
      }
    );

    // Observe all heading elements
    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id) => {
    console.log('Attempting to scroll to:', id);
    const element = document.getElementById(id);
    console.log('Found element:', element);
    
    if (element) {
      // Calculate offset for the header (64px)
      const headerOffset = 80; // Account for the original header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      console.log('Scrolling to position:', offsetPosition);
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update active ID immediately for better UX
      setActiveId(id);
    } else {
      console.warn('Element not found with ID:', id);
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-16 right-0 w-64 h-[calc(100vh-4rem)] border-l border-gray-800 z-30">
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <div className="p-4">
          <div className="text-sm font-semibold text-white mb-4">
            On this page
          </div>
          <nav>
            <ul className="space-y-1">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('TOC clicked:', heading.id);
                      scrollToHeading(heading.id);
                    }}
                    className={`
                      block w-full text-left py-2 px-3 rounded text-sm transition-colors duration-200
                      ${activeId === heading.id
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }
                    `}
                    style={{
                      paddingLeft: `${(heading.level - 1) * 12 + 12}px`,
                    }}
                  >
                    <span className="block truncate">
                      {heading.text}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}