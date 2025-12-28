import * as fs from 'fs';
import * as path from 'path';
import { Section } from '@weave-md/core';
import { parseFrontmatter } from '@weave-md/validate';

export interface LoadOptions {
  /**
   * Specific files to load. If provided, only these files are loaded.
   * Paths can be absolute or relative to rootPath.
   */
  files?: string[];
  /**
   * File extensions to include when scanning directories. Default: ['.md']
   */
  extensions?: string[];
  /**
   * Directories to exclude when scanning. Default: ['node_modules', '.git']
   */
  exclude?: string[];
}

export interface LoadResult {
  sections: Section[];
  filePaths: Map<string, string>;
  /** Raw file content by section ID (for AST parsing) */
  rawContent: Map<string, string>;
}

/**
 * Load all Weave Markdown sections from a directory or specific files.
 * 
 * By default, recursively scans rootPath for all .md files with valid frontmatter.
 * File organization is flexible - use any structure that works for your project.
 * 
 * @param rootPath - Directory to scan, or base path for relative file paths
 * @param options - Loading options
 */
export async function loadWorkspace(rootPath: string, options: LoadOptions = {}): Promise<LoadResult> {
  const sections: Section[] = [];
  const filePaths = new Map<string, string>();
  const rawContent = new Map<string, string>();
  const extensions = options.extensions || ['.md'];
  const exclude = options.exclude || ['node_modules', '.git'];
  
  // If specific files provided, load only those
  if (options.files && options.files.length > 0) {
    for (const file of options.files) {
      const filePath = path.isAbsolute(file) ? file : path.join(rootPath, file);
      const result = loadSection(filePath);
      if (result) {
        sections.push(result.section);
        filePaths.set(result.section.id, filePath);
        rawContent.set(result.section.id, result.content);
      }
    }
    return { sections, filePaths, rawContent };
  }
  
  // Otherwise, scan directory recursively
  scanDirectory(rootPath, sections, filePaths, rawContent, extensions, exclude);
  
  return { sections, filePaths, rawContent };
}

/**
 * Load a single file and return the section if it has valid frontmatter.
 */
function loadSection(filePath: string): { section: Section; content: string } | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);
  
  if (!frontmatter?.id) {
    return null;
  }
  
  return {
    section: {
      id: frontmatter.id,
      title: frontmatter.title,
      peek: frontmatter.peek,
      body
    },
    content
  };
}

/**
 * Recursively scan a directory for markdown files.
 */
function scanDirectory(
  dirPath: string,
  sections: Section[],
  filePaths: Map<string, string>,
  rawContent: Map<string, string>,
  extensions: string[],
  exclude: string[]
): void {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      if (!exclude.includes(entry.name)) {
        scanDirectory(fullPath, sections, filePaths, rawContent, extensions, exclude);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        const result = loadSection(fullPath);
        if (result) {
          sections.push(result.section);
          filePaths.set(result.section.id, fullPath);
          rawContent.set(result.section.id, result.content);
        }
      }
    }
  }
}
