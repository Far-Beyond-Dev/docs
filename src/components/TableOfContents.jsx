"use client";

import { useState, useEffect } from 'react';

export default function TableOfContents({ content }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [showOnMobile, setShowOnMobile] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(64);

  useEffect(() => {
    if (!content) return;

    // Wait for the markdown to render, then find the actual headings in the DOM
    const findRenderedHeadings = () => {
      const renderedHeadings = [];
      // Look for headings specifically within the main article content area
      const articleElement = document.querySelector('article.prose, .prose, .markdown-content');
      const headingElements = articleElement ? 
        articleElement.querySelectorAll('h1, h2, h3, h4, h5, h6') :
        document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      headingElements.forEach(element => {
        if (element.id && element.textContent?.trim()) {
          const level = parseInt(element.tagName.charAt(1));
          renderedHeadings.push({
            id: element.id,
            text: element.textContent.trim(),
            level,
          });
        }
      });
      
      if (renderedHeadings.length > 0) {
        setHeadings(renderedHeadings);
      }
    };

    // Try multiple times to ensure we catch the headings after markdown renders
    const timeouts = [100, 300, 500];
    const timeoutIds = timeouts.map(delay => 
      setTimeout(findRenderedHeadings, delay)
    );

    // Also set up a mutation observer to catch dynamic content changes
    const observer = new MutationObserver(() => {
      setTimeout(findRenderedHeadings, 50);
    });

    // Start observing for heading changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id']
    });

    return () => {
      timeoutIds.forEach(clearTimeout);
      observer.disconnect();
    };
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
        rootMargin: '-96px 0% -70% 0%', // Account for header height
        threshold: 0.1,
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
      // Get the main scroll container
      const mainElement = document.querySelector('main');
      if (mainElement) {
        // Calculate offset for the header (64px + extra padding)
        const headerOffset = 96;
        const elementRect = element.getBoundingClientRect();
        const mainRect = mainElement.getBoundingClientRect();
        const scrollTop = mainElement.scrollTop;
        const targetPosition = scrollTop + (elementRect.top - mainRect.top) - headerOffset;
        
        console.log('Scrolling main container to position:', targetPosition);
        
        mainElement.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      } else {
        // Fallback to window scroll
        const headerOffset = 96;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        console.log('Fallback - scrolling window to position:', offsetPosition);
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
      
      // Update active ID immediately for better UX
      setActiveId(id);
    } else {
      console.warn('Element not found with ID:', id);
    }
  };

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setShowOnMobile(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (headings.length === 0 || !showOnMobile) {
    return null;
  }

  return (
    <div className="sticky top-0 w-72 border-l border-gray-800 bg-black/50 backdrop-blur-sm transition-all duration-300 ease-in-out overflow-hidden" 
         style={{ height: 'calc(100vh - 4rem)' }}>
      <div className="h-full overflow-y-auto overscroll-contain">
        <div className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-track-gray-800 pr-2">
          <div className="p-4">
            <div className="text-sm font-semibold text-white mb-4 pb-2 border-b border-gray-700/50">
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
                      block w-full text-left py-2 px-3 rounded-md text-sm transition-all duration-200 border-l-2
                      ${activeId === heading.id
                        ? 'bg-blue-600/20 text-blue-300 font-medium border-blue-500 shadow-sm'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800/50 border-transparent hover:border-gray-600'
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
    </div>
  );
}