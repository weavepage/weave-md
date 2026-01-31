export type DisplayType = 'inline' | 'overlay' | 'footnote' | 'sidenote' | 'margin' | 'stretch' | 'panel'
export type ExportType = 'appendix' | 'inline' | 'omit'

export interface ParsedNodeUrl {
  id: string
  display?: DisplayType
  export?: ExportType
}

const VALID_DISPLAY_TYPES = new Set<string>(['inline', 'overlay', 'footnote', 'sidenote', 'margin', 'stretch', 'panel'])
const VALID_EXPORT_TYPES = new Set<string>(['appendix', 'inline', 'omit'])

/**
 * Parse a node: URL into its components.
 * 
 * @example
 * parseNodeUrl('node:intro?display=overlay')
 * // { id: 'intro', display: 'overlay', export: undefined }
 * 
 * parseNodeUrl('https://example.com')
 * // null (not a node URL)
 */
export function parseNodeUrl(href: string | undefined | null): ParsedNodeUrl | null {
  if (!href || typeof href !== 'string') {
    return null
  }

  if (!href.startsWith('node:')) {
    return null
  }

  const withoutScheme = href.slice(5) // Remove 'node:'
  const [id, queryString] = withoutScheme.split('?')

  if (!id) {
    return null
  }

  const result: ParsedNodeUrl = { id }

  if (queryString) {
    const params = new URLSearchParams(queryString)
    
    const display = params.get('display')
    if (display && VALID_DISPLAY_TYPES.has(display)) {
      result.display = display as DisplayType
    }

    const exportParam = params.get('export')
    if (exportParam && VALID_EXPORT_TYPES.has(exportParam)) {
      result.export = exportParam as ExportType
    }
  }

  return result
}
