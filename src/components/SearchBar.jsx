"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [docsIndex, setDocsIndex] = useState([]);
  const router = useRouter();
  const searchRef = useRef(null);

  useEffect(() => {
    // Load docs index for search
    fetch('/docs-index.json')
      .then(res => res.json())
      .then(data => setDocsIndex(data))
      .catch(err => console.error('Error loading docs index:', err));

    // Close search on outside click
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = (searchQuery) => {
    if (!searchQuery.trim() || docsIndex.length === 0) {
      setResults([]);
      return;
    }

    const lowercaseQuery = searchQuery.toLowerCase();
    const searchResults = docsIndex.filter(doc => {
      const titleMatch = doc.title?.toLowerCase().includes(lowercaseQuery);
      const excerptMatch = doc.excerpt?.toLowerCase().includes(lowercaseQuery);
      const categoryMatch = doc.category?.toLowerCase().includes(lowercaseQuery);
      const tagsMatch = doc.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery));
      
      return titleMatch || excerptMatch || categoryMatch || tagsMatch;
    }).slice(0, 8); // Limit to 8 results

    setResults(searchResults);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
    performSearch(value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md mx-auto">
      <form onSubmit={handleSearch}>
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search documentation..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
          <div className="absolute left-3 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                setResults([]);
              }}
              className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.map((doc) => (
            <Link
              key={doc.slug}
              href={`/entries/${doc.slug}`}
              onClick={handleResultClick}
              className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {doc.excerpt}
                  </p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                      {doc.category}
                    </span>
                    {doc.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {query && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={handleSearch}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all results for "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
