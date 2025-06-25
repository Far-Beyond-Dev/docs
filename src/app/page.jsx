import fs from 'fs';
import path from 'path';
import DocItem from '../components/DocItem';

export default function Home() {
  // Read the docs index
  let docs = [];
  const indexPath = path.join(process.cwd(), 'public/blog-index.json');
  
  try {
    if (fs.existsSync(indexPath)) {
      const indexData = fs.readFileSync(indexPath, 'utf8');
      docs = JSON.parse(indexData);
    }
  } catch (error) {
    console.error('Error reading docs index:', error);
  }

  return (
    <div>
      <div className="mb-12 text-center">
        <br></br><br></br>
        <h1 className="text-4xl font-bold mb-4">Documentation</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Comprehensive guides, tutorials, and technical documentation
        </p>
      </div>

      {docs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
          {docs.map((doc) => (
            <DocItem key={doc.slug} doc={doc} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No documentation found. Add some markdown files to the /public/docs directory to get started.
          </p>
        </div>
      )}
    </div>
  );
}