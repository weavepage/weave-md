import { parse } from 'yaml';
import { Diagnostic } from '@weave-md/core';

export interface ParsedFrontmatter {
  id?: string;
  title?: string;
  peek?: string;
  [key: string]: any;
}

export function parseFrontmatter(content: string): { frontmatter: ParsedFrontmatter | null; body: string; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  
  const fmRegex = /^---\s*\n([\s\S]*?)\n---\s*(?:\n([\s\S]*))?$/;
  const match = content.match(fmRegex);
  
  if (!match) {
    return { frontmatter: null, body: content, diagnostics };
  }
  
  const [, fmContent, body = ''] = match;
  
  try {
    const frontmatter = (parse(fmContent) ?? {}) as ParsedFrontmatter;
    
    if (!frontmatter.id) {
      diagnostics.push({
        severity: 'error',
        message: 'Section frontmatter must include an "id" field',
        code: 'missing-id'
      });
    } else if (typeof frontmatter.id !== 'string') {
      diagnostics.push({
        severity: 'error',
        message: 'Section frontmatter "id" field must be a string',
        code: 'invalid-id-type'
      });
    } else if (frontmatter.id.trim() === '') {
      diagnostics.push({
        severity: 'error',
        message: 'Section frontmatter "id" field cannot be empty',
        code: 'empty-id'
      });
    }
    
    if (frontmatter.title && typeof frontmatter.title !== 'string') {
      diagnostics.push({
        severity: 'error',
        message: 'Section frontmatter "title" field must be a string',
        code: 'invalid-title-type'
      });
    }
    
    if (frontmatter.peek && typeof frontmatter.peek !== 'string') {
      diagnostics.push({
        severity: 'error',
        message: 'Section frontmatter "peek" field must be a string',
        code: 'invalid-peek-type'
      });
    }
    
    const knownFields = new Set(['id', 'title', 'peek']);
    Object.keys(frontmatter).forEach(key => {
      if (!knownFields.has(key)) {
        diagnostics.push({
          severity: 'warning',
          message: `Unknown frontmatter field: ${key}`,
          code: 'unknown-field'
        });
      }
    });
    
    return { frontmatter, body, diagnostics };
  } catch (error) {
    diagnostics.push({
      severity: 'error',
      message: `Failed to parse frontmatter: ${error instanceof Error ? error.message : String(error)}`,
      code: 'invalid-yaml'
    });
    return { frontmatter: null, body, diagnostics };
  }
}
