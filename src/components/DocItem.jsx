import Link from 'next/link';
import { formatDate } from '../utils/date-formatter';

export default function DocItem({ doc }) {
  return (
    <Link href={`/entries/${doc.slug}`} className="block group">
      <div className="h-full p-6 bg-white dark:bg-gray-950 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow duration-200">
        <h2 className="text-xl font-bold mb-3 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
          {doc.title}
        </h2>
        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <span>Updated {formatDate(doc.lastUpdated)}</span>
          {doc.category && <span>{doc.category}</span>}
          {doc.difficulty && <span className="capitalize">{doc.difficulty}</span>}
        </div>
        {doc.tags && (
          <div className="flex flex-wrap gap-2 mb-4">
            {doc.tags.slice(0, 3).map(tag => (
              <span 
                key={tag} 
                className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
            {doc.tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500">
                +{doc.tags.length - 3} more
              </span>
            )}
          </div>
        )}
        <p className="text-gray-700 dark:text-gray-300 mb-4 overflow-hidden" style={{
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical'
        }}>
          {doc.description}
        </p>
        <div className="mt-4 text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
          View documentation →
        </div>
      </div>
    </Link>
  );
}