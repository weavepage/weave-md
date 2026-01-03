import { NodeRef, DisplayType } from '../types';

export type ParseNodeUrlResult = 
  | { success: true; ref: NodeRef }
  | { success: false; error: string };

export function parseNodeUrl(href: string): ParseNodeUrlResult {
  try {
    if (!href.startsWith('node:')) {
      return { success: false, error: 'URL must start with "node:"' };
    }

    const urlStr = href.slice(5);
    const [id, queryString] = urlStr.split('?');

    if (!id) {
      return { success: false, error: 'Node ID is required' };
    }

    const ref: NodeRef = { id };

    if (queryString) {
      const params = new URLSearchParams(queryString);
      
      // Check for duplicate display parameters
      if (params.getAll('display').length > 1) {
        return { success: false, error: 'Multiple display parameters not allowed' };
      }
      
      // Check for duplicate export parameters
      if (params.getAll('export').length > 1) {
        return { success: false, error: 'Multiple export parameters not allowed' };
      }
      
      const display = params.get('display');
      if (display) {
        if (['footnote', 'sidenote', 'margin', 'overlay', 'inline', 'stretch', 'panel'].includes(display)) {
          ref.display = display as DisplayType;
        } else {
          return { success: false, error: `Invalid display value: ${display}. Must be one of: footnote, sidenote, margin, overlay, inline, stretch, panel` };
        }
      }

      const exportParam = params.get('export');
      if (exportParam) {
        if (exportParam === 'appendix' || exportParam === 'inline' || exportParam === 'omit') {
          ref.export = exportParam;
        } else {
          return { success: false, error: `Invalid export value: ${exportParam}. Must be one of: appendix, inline, omit` };
        }
      }

      // Spread unknown params directly onto ref (matches schema additionalProperties)
      params.forEach((value: string, key: string) => {
        if (key !== 'display' && key !== 'export') {
          // Empty string values are treated as boolean true
          (ref as any)[key] = value === '' ? true : value;
        }
      });
    }

    return { success: true, ref };
  } catch (error) {
    return { success: false, error: `Failed to parse node URL: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export function formatNodeUrl(ref: NodeRef): string {
  const params = new URLSearchParams();

  if (ref.display) {
    params.set('display', ref.display);
  }

  if (ref.export) {
    params.set('export', ref.export);
  }

  // Handle unknown params spread directly on ref
  const knownKeys = new Set(['id', 'display', 'export']);
  Object.keys(ref).forEach(key => {
    if (!knownKeys.has(key)) {
      const value = ref[key];
      if (typeof value === 'string') {
        params.set(key, value);
      } else if (value === true) {
        params.set(key, '');
      }
    }
  });

  const queryString = params.toString();
  return `node:${ref.id}${queryString ? `?${queryString}` : ''}`;
}
