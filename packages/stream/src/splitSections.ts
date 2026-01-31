export interface Section {
  id: string
  title?: string
  peek?: string
  content: string
}

interface FrontmatterData {
  id?: string
  title?: string
  peek?: string
  [key: string]: unknown
}

/**
 * Parse YAML-like frontmatter into an object.
 * Intentionally lenient for LLM output.
 */
function parseFrontmatter(frontmatter: string): FrontmatterData {
  const result: FrontmatterData = {}
  const lines = frontmatter.split('\n')
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    
    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()
    
    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    
    if (key && value) {
      result[key] = value
    }
  }
  
  return result
}

/**
 * Split markdown with stacked frontmatter into sections.
 * 
 * A new section starts when `---` appears after a blank line (or at start),
 * followed by a line containing `id:`. This is intentionally lenient for LLM output.
 * 
 * @example
 * const sections = splitSections(`
 * ---
 * id: intro
 * title: Introduction
 * ---
 * 
 * This is the intro.
 * 
 * ---
 * id: details
 * title: Details
 * ---
 * 
 * Here are the details.
 * `)
 * // [
 * //   { id: 'intro', title: 'Introduction', content: 'This is the intro.' },
 * //   { id: 'details', title: 'Details', content: 'Here are the details.' }
 * // ]
 */
export function splitSections(markdown: string): Section[] {
  if (!markdown || typeof markdown !== 'string') {
    return []
  }

  const sections: Section[] = []
  
  // Pattern: frontmatter block starting with --- and ending with ---
  // The frontmatter must contain an id: line
  const frontmatterPattern = /(?:^|\n\n|\r\n\r\n)---\r?\n([\s\S]*?)(?:\r?\n---(?:\r?\n|$))/g
  
  let lastIndex = 0
  let match: RegExpExecArray | null
  const matches: Array<{ frontmatter: string; startIndex: number; endIndex: number }> = []
  
  while ((match = frontmatterPattern.exec(markdown)) !== null) {
    const frontmatterContent = match[1]
    // Only consider it a section if it has an id: line
    if (/^id\s*:/m.test(frontmatterContent)) {
      matches.push({
        frontmatter: frontmatterContent,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      })
    }
  }
  
  // Process each match
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]
    const next = matches[i + 1]
    
    const data = parseFrontmatter(current.frontmatter)
    
    if (!data.id || typeof data.id !== 'string') {
      continue
    }
    
    // Content is from end of this frontmatter to start of next (or end of string)
    const contentStart = current.endIndex
    const contentEnd = next ? next.startIndex : markdown.length
    let content = markdown.slice(contentStart, contentEnd).trim()
    
    // Remove trailing blank lines before next section
    content = content.replace(/\n\n+$/, '')
    
    sections.push({
      id: data.id,
      title: typeof data.title === 'string' ? data.title : undefined,
      peek: typeof data.peek === 'string' ? data.peek : undefined,
      content
    })
  }
  
  return sections
}
