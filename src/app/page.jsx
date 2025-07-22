import fs from 'fs';
import path from 'path';
import DocItem from '../components/DocItem';
import Link from 'next/link';

export default function Home() {
  // Read the docs index
  let docs = [];
  const indexPath = path.join(process.cwd(), 'public/docs-index.json');
  
  try {
    if (fs.existsSync(indexPath)) {
      const indexData = fs.readFileSync(indexPath, 'utf8');
      docs = JSON.parse(indexData);
    }
  } catch (error) {
    console.error('Error reading docs index:', error);
  }

  // Group docs by category
  const categorizedDocs = docs.reduce((acc, doc) => {
    const category = doc.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {});

  // Sort categories and limit featured docs
  const featuredDocs = docs.slice(0, 6);
  const categories = Object.keys(categorizedDocs).sort();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 rounded-2xl">
        <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
          Documentation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Comprehensive guides, tutorials, and technical documentation to help you get started and master Horizon.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/entries/getting-started">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              Get Started
            </button>
          </Link>
          <Link href="/entries/api-reference">
            <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors">
              API Reference
            </button>
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600 dark:text-green-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Get up and running in minutes with our step-by-step guide.
          </p>
          <Link href="/entries/getting-started" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
            Start building →
          </Link>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600 dark:text-blue-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">API Reference</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Complete API documentation with examples and code samples.
          </p>
          <Link href="/entries/api-reference" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
            Explore API →
          </Link>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600 dark:text-purple-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Tutorials</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Learn with hands-on tutorials and real-world examples.
          </p>
          <Link href="/entries/tutorials" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
            Browse tutorials →
          </Link>
        </div>
      </div>

      {/* Documentation by Category */}
      {categories.length > 0 && (
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Browse by Category</h2>
          
          {categories.map(category => (
            <div key={category} className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorizedDocs[category].slice(0, 6).map((doc) => (
                  <DocItem key={doc.slug} doc={doc} />
                ))}
              </div>
              {categorizedDocs[category].length > 6 && (
                <div className="text-center">
                  <Link 
                    href={`/?category=${encodeURIComponent(category)}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    View all {category} documentation →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {docs.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Documentation Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Add some markdown files to the <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">/public/docs</code> directory to get started.
          </p>
        </div>
      )}
    </div>
  );
}