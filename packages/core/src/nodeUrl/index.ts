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
      
      const display = params.get('display');
      if (display) {
        if (['footnote', 'sidenote', 'margin', 'overlay', 'inline', 'stretch', 'page'].includes(display)) {
          ref.display = display as DisplayType;
        } else {
          return { success: false, error: `Invalid display value: ${display}. Must be one of: footnote, sidenote, margin, overlay, inline, stretch, page` };
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

      const otherParams: Record<string, string> = {};
      params.forEach((value: string, key: string) => {
        if (key !== 'display' && key !== 'export') {
          otherParams[key] = value;
        }
      });

      if (Object.keys(otherParams).length > 0) {
        ref.params = otherParams;
      }
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

  if (ref.params) {
    Object.entries(ref.params).forEach(([key, value]) => {
      params.set(key, value);
    });
  }

  const queryString = params.toString();
  return `node:${ref.id}${queryString ? `?${queryString}` : ''}`;
}
