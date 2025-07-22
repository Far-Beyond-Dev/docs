import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const DOCS_DIRECTORY = path.join(process.cwd(), 'public/docs');
const DOCS_INDEX_PATH = path.join(process.cwd(), 'public/docs-index.json');

function parseDocuments() {
  // Ensure the docs directory exists
  if (!fs.existsSync(DOCS_DIRECTORY)) {
    fs.mkdirSync(DOCS_DIRECTORY, { recursive: true });
  }

  // Get all markdown files from the docs directory
  const fileNames = fs.readdirSync(DOCS_DIRECTORY)
    .filter(fileName => /\.md$/.test(fileName));

  // Parse each markdown file
  const documents = fileNames.map(fileName => {
    const filePath = path.join(DOCS_DIRECTORY, fileName);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Extract metadata and content
    const { data, content } = matter(fileContents);
    
    // Create a slug from the file name
    const slug = fileName.replace(/\.md$/, '');
    
    return {
      slug,
      ...data,
      excerpt: data.excerpt || content.slice(0, 150) + '...',
      // Calculate reading time (avg reading speed: 200 words per minute)
      readingTime: Math.ceil(content.split(/\s+/).length / 200),
      fileName,
      category: data.category || 'General',
      order: data.order || 999,
    };
  });

  // Sort by category and order
  documents.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.order - b.order;
  });
  
  // Write the index to a JSON file
  fs.writeFileSync(
    DOCS_INDEX_PATH,
    JSON.stringify(documents, null, 2)
  );

  console.log(`✅ Generated docs index with ${documents.length} documents`);
  return documents;
}

export { parseDocuments };
