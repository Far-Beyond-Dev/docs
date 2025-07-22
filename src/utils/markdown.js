// src/utils/markdown.js
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const docsDirectory = path.join(process.cwd(), 'public/docs');

/**
 * Gets all documentation slugs from the docs directory
 * @returns {Promise<string[]>} Array of slugs
 */
export async function getDocSlugs() {
  try {
    const files = await fs.readdir(docsDirectory);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace(/\.md$/, ''));
  } catch (error) {
    console.error('Error getting doc slugs:', error);
    return [];
  }
}

/**
 * Gets a documentation by its slug
 * @param {string} slug - The documentation slug
 * @returns {Promise<Object|null>} Documentation data or null if not found
 */
export async function getDocBySlug(slug) {
  try {
    const fullPath = path.join(docsDirectory, `${slug}.md`);
    
    // Read the file
    const fileContents = await fs.readFile(fullPath, 'utf8');
    
    // Parse the front matter
    const { data, content, excerpt } = matter(fileContents, {
      excerpt: true,
      excerpt_separator: '<!-- excerpt -->'
    });
    
    // Generate excerpt if not explicitly provided
    let postExcerpt = data.excerpt;
    if (!postExcerpt) {
      if (excerpt) {
        postExcerpt = excerpt.trim();
      } else {
        postExcerpt = content.slice(0, 150).trim() + '...';
      }
    }
    
    // Calculate reading time (average 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    
    // Get file stats for additional metadata
    const stats = await fs.stat(fullPath);
    
    return {
      slug,
      content,
      title: data.title || 'Untitled',
      date: data.date || stats.birthtime.toISOString(),
      updated: data.updated || stats.mtime.toISOString(), 
      tags: data.tags || [],
      excerpt: postExcerpt,
      readingTime,
      category: data.category || 'General',
      order: data.order || 999,
      ...data, // Include all frontmatter data
    };
  } catch (error) {
    console.error(`Error getting doc for slug ${slug}:`, error);
    return null;
  }
}

/**
 * Gets all documentation
 * @returns {Promise<Object[]>} Array of documentation
 */
export async function getAllDocs() {
  try {
    const slugs = await getDocSlugs();
    const docs = await Promise.all(slugs.map(slug => getDocBySlug(slug)));
    
    // Filter out any null values (failed loads)
    const validDocs = docs.filter(doc => doc !== null);
    
    // Sort by category and order
    return validDocs.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.order - b.order;
    });
  } catch (error) {
    console.error('Error getting all docs:', error);
    return [];
  }
}

/**
 * Gets all tags from all documentation
 * @returns {Promise<string[]>} Array of unique tags
 */
export async function getAllTags() {
  try {
    const docs = await getAllDocs();
    const tags = new Set();
    
    docs.forEach(doc => {
      if (doc.tags) {
        doc.tags.forEach(tag => tags.add(tag));
      }
    });
    
    return Array.from(tags);
  } catch (error) {
    console.error('Error getting all tags:', error);
    return [];
  }
}

/**
 * Gets documentation by tag
 * @param {string} tag - The tag to filter by
 * @returns {Promise<Object[]>} Array of documentation with the specified tag
 */
export async function getDocsByTag(tag) {
  try {
    const docs = await getAllDocs();
    return docs.filter(doc => doc.tags && doc.tags.includes(tag));
  } catch (error) {
    console.error(`Error getting docs by tag ${tag}:`, error);
    return [];
  }
}

/**
 * Gets all categories from all documentation
 * @returns {Promise<string[]>} Array of unique categories
 */
export async function getAllCategories() {
  try {
    const docs = await getAllDocs();
    const categories = new Set();
    
    docs.forEach(doc => {
      if (doc.category) {
        categories.add(doc.category);
      }
    });
    
    return Array.from(categories);
  } catch (error) {
    console.error('Error getting all categories:', error);
    return [];
  }
}