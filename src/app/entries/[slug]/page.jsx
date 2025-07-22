import { getDocSlugs, getDocBySlug } from '../../../utils/markdown';
import Markdown from '../../../components/Markdown';
import { formatDate } from '../../../utils/date-formatter';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '../../../components/Breadcrumbs';
import TableOfContents from '../../../components/TableOfContents';

// This function gets called at build time to generate static paths
export async function generateStaticParams() {
  try {
    const slugs = await getDocSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// This function generates metadata for the page
export async function generateMetadata({ params }) {
  try {
    // Always await params in Next.js App Router
    const awaitedParams = await params;
    const { slug } = awaitedParams;
    const doc = await getDocBySlug(slug);
    
    if (!doc) {
      return {
        title: 'Document Not Found',
        description: 'The requested documentation could not be found.'
      };
    }
    
    return {
      title: doc.title,
      description: doc.excerpt || (doc.content ? doc.content.slice(0, 150) + '...' : 'No description available'),
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error',
      description: 'There was an error loading this post'
    };
  }
}

// The main documentation page component
export default async function DocPage({ params }) {
  try {
    // Always await params in Next.js App Router
    const awaitedParams = await params;
    const { slug } = awaitedParams;
    const doc = await getDocBySlug(slug);
    
    if (!doc) {
      // Use Next.js notFound function to show 404 page
      notFound();
    }
    
    // Calculate reading time if not already provided
    const readingTime = doc.readingTime || 
      (doc.content ? Math.ceil(doc.content.split(/\s+/).length / 200) : 1);
    
    return (
      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 max-w-4xl">
          <Breadcrumbs currentDoc={doc} />
          
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{doc.title}</h1>
            
            <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
              {doc.date && <span className="mr-4">{formatDate(doc.date)}</span>}
              <span>{readingTime} min read</span>
              {doc.category && <span className="ml-4 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-sm">{doc.category}</span>}
            </div>
            
            {doc.tags && doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {doc.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <article className="prose prose-lg max-w-none dark:prose-invert">
            <Markdown content={doc.content} />
          </article>
          
          {/* Previous/Next Navigation */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div>
              {/* Previous doc logic would go here */}
            </div>
            <div>
              {/* Next doc logic would go here */}
            </div>
          </div>
        </div>

        
        {/* Table of Contents Sidebar */}
        <div className="hidden lg:block lg:w-72 lg:flex-shrink-0">
          <TableOfContents content={doc.content} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering documentation:', error);
    // Handle any errors gracefully
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Error Loading Documentation</h1>
        <p className="mb-6">Sorry, we couldn't load this documentation. Please try again later.</p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Return to Documentation
        </Link>
      </div>
    );
  }
}