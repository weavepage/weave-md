import { toHast } from 'mdast-util-to-hast'
import { toHtml as hastToHtml } from 'hast-util-to-html'
import { visit, SKIP } from 'unist-util-visit'
import type { Root } from 'mdast'
import type { Root as HastRoot } from 'hast'
import { formatNodeUrl } from '@weave-md/core'
import type { NodeRef, Section, DisplayType } from '@weave-md/core'
import katex from 'katex'

export interface ToHtmlOptions {
  /** Render math using KaTeX (default: true) */
  renderMath?: boolean
  /** Custom handler for node links */
  nodeLinksHandler?: (ref: NodeRef, text: string, footnoteNumber?: number) => string
  /** 
   * Default display mode for node links without explicit display param.
   * 'footnote' is recommended for email-friendly output.
   */
  defaultDisplay?: DisplayType
  /** Section content lookup for rendering footnotes/inline content */
  sections?: Map<string, Section> | Record<string, Section>
}

/**
 * Convert mdast tree to HTML string.
 * Handles Weave-specific node types (weaveNodeLink, weaveMathBlock, weaveMediaBlock, etc.)
 */
export function toHtml(tree: Root, options: ToHtmlOptions = {}): string {
  const { renderMath = true, nodeLinksHandler, defaultDisplay, sections } = options
  
  // Clone tree to avoid mutating original
  const workingTree = JSON.parse(JSON.stringify(tree)) as Root
  
  // Collect footnotes for footnote-style rendering
  const footnotes: Array<{ ref: NodeRef; text: string; content?: string }> = []
  
  // Transform Weave nodes to HTML nodes before hast conversion
  transformWeaveNodesToHtml(workingTree, { 
    renderMath, 
    nodeLinksHandler, 
    defaultDisplay,
    sections,
    footnotes
  })
  
  // Convert mdast to hast
  const hast = toHast(workingTree, {
    allowDangerousHtml: true
  })
  
  // Convert hast to HTML
  let html = hastToHtml(hast as HastRoot, {
    allowDangerousHtml: true
  })
  
  // Append footnotes section if any were collected
  if (footnotes.length > 0) {
    html += renderFootnotesSection(footnotes, sections)
  }
  
  return html
}

/**
 * Transform Weave nodes to HTML nodes for hast conversion
 */
function transformWeaveNodesToHtml(
  tree: Root, 
  options: { 
    renderMath: boolean
    nodeLinksHandler?: (ref: NodeRef, text: string, footnoteNumber?: number) => string
    defaultDisplay?: DisplayType
    sections?: Map<string, Section> | Record<string, Section>
    footnotes: Array<{ ref: NodeRef; text: string; content?: string }>
  }
): void {
  // Transform weaveNodeLink to standard link or HTML
  visit(tree, 'weaveNodeLink', (node: any, index, parent) => {
    if (index === undefined || !parent) return
    
    const ref: NodeRef = {
      id: node.targetId,
      ...(node.display && { display: node.display }),
      ...(node.exportHint && { export: node.exportHint }),
      ...node.unknownParams
    }
    
    // Get text content from children
    const text = getTextContent(node.children)
    
    // Determine display mode
    const display = ref.display || options.defaultDisplay
    
    // Handle footnote display mode
    if (display === 'footnote') {
      const footnoteNum = options.footnotes.length + 1
      const section = getSection(options.sections, ref.id)
      options.footnotes.push({ 
        ref, 
        text, 
        content: section?.peek || section?.body?.slice(0, 200) 
      })
      
      if (options.nodeLinksHandler) {
        parent.children[index] = {
          type: 'html',
          value: options.nodeLinksHandler(ref, text, footnoteNum)
        } as any
      } else {
        // Render as footnote reference: text[1]
        // For empty anchor [ ], don't render the space
        const displayText = text.trim() === '' ? '' : escapeHtml(text)
        parent.children[index] = {
          type: 'html',
          value: `${displayText}<sup class="weave-footnote-ref"><a href="#weave-fn-${footnoteNum}" id="weave-fnref-${footnoteNum}">[${footnoteNum}]</a></sup>`
        } as any
      }
      return SKIP
    }
    
    if (options.nodeLinksHandler) {
      parent.children[index] = {
        type: 'html',
        value: options.nodeLinksHandler(ref, text)
      } as any
    } else {
      // Convert to standard link node
      parent.children[index] = {
        type: 'link',
        url: formatNodeUrl(ref),
        children: node.children,
        data: {
          hProperties: {
            className: ['weave-node-link'],
            'data-node-id': ref.id,
            ...(ref.display && { 'data-display': ref.display }),
            ...(ref.export && { 'data-export': ref.export })
          }
        }
      } as any
    }
    return SKIP
  })
  
  // Transform weaveMathBlock to HTML
  visit(tree, 'weaveMathBlock', (node: any, index, parent) => {
    if (index === undefined || !parent) return
    
    let html: string
    if (options.renderMath) {
      html = `<div class="weave-math-block">${renderKatex(node.value, true)}</div>`
    } else {
      const escaped = escapeHtml(node.value)
      html = `<pre class="weave-math-block"><code>${escaped}</code></pre>`
    }
    
    parent.children[index] = { type: 'html', value: html } as any
    return SKIP
  })
  
  // Transform weaveMediaBlock to HTML
  visit(tree, 'weaveMediaBlock', (node: any, index, parent) => {
    if (index === undefined || !parent) return
    
    const html = createMediaHtml(node.mediaType, node.config)
    parent.children[index] = { type: 'html', value: html } as any
    return SKIP
  })
  
  // Transform weavePreformatted to HTML
  visit(tree, 'weavePreformatted', (node: any, index, parent) => {
    if (index === undefined || !parent) return
    
    const escaped = escapeHtml(node.value)
    parent.children[index] = {
      type: 'html',
      value: `<pre class="weave-preformatted">${escaped}</pre>`
    } as any
    return SKIP
  })
  
  // Transform inlineMath to HTML
  visit(tree, 'inlineMath', (node: any, index, parent) => {
    if (index === undefined || !parent) return
    
    let html: string
    if (options.renderMath) {
      html = renderKatex(node.value, false)
    } else {
      const escaped = escapeHtml(node.value)
      html = `<code class="weave-inline-math">${escaped}</code>`
    }
    
    parent.children[index] = { type: 'html', value: html } as any
    return SKIP
  })
}

/**
 * Get plain text content from mdast children
 */
function getTextContent(children: any[]): string {
  if (!children) return ''
  return children.map((child: any) => {
    if (child.type === 'text') return child.value
    if (child.children) return getTextContent(child.children)
    return ''
  }).join('')
}

/**
 * Get section from Map or Record
 */
function getSection(
  sections: Map<string, Section> | Record<string, Section> | undefined,
  id: string
): Section | undefined {
  if (!sections) return undefined
  if (sections instanceof Map) {
    return sections.get(id)
  }
  return sections[id]
}

/**
 * Render footnotes section at end of document
 */
function renderFootnotesSection(
  footnotes: Array<{ ref: NodeRef; text: string; content?: string }>,
  sections?: Map<string, Section> | Record<string, Section>
): string {
  if (footnotes.length === 0) return ''
  
  const items = footnotes.map((fn, i) => {
    const num = i + 1
    const content = fn.content ? escapeHtml(fn.content) : `[${escapeHtml(fn.ref.id)}]`
    return `<li id="weave-fn-${num}" class="weave-footnote">
      <p><a href="#weave-fnref-${num}" class="weave-footnote-backref">[${num}]</a> ${content}</p>
    </li>`
  }).join('\n')
  
  return `
<hr class="weave-footnotes-separator">
<section class="weave-footnotes">
  <ol class="weave-footnotes-list">
    ${items}
  </ol>
</section>`
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Create HTML string for media blocks
 */
function createMediaHtml(mediaType: string, config: Record<string, unknown>): string {
  const esc = escapeHtml
  
  switch (mediaType) {
    case 'image': {
      const src = esc(String(config.src || ''))
      const alt = esc(String(config.alt || ''))
      const caption = config.caption ? `<figcaption>${esc(String(config.caption))}</figcaption>` : ''
      return `<figure class="weave-media weave-image"><img src="${src}" alt="${alt}">${caption}</figure>`
    }
    
    case 'gallery': {
      const files = (config.files as any[]) || []
      const images = files.map(f => 
        `<figure><img src="${esc(String(f.src || ''))}" alt="${esc(String(f.alt || ''))}"></figure>`
      ).join('')
      return `<div class="weave-media weave-gallery">${images}</div>`
    }
    
    case 'audio': {
      const src = esc(String(config.src || ''))
      return `<figure class="weave-media weave-audio"><audio src="${src}" controls></audio></figure>`
    }
    
    case 'video': {
      const src = esc(String(config.src || ''))
      const poster = config.poster ? ` poster="${esc(String(config.poster))}"` : ''
      return `<figure class="weave-media weave-video"><video src="${src}"${poster} controls></video></figure>`
    }
    
    case 'embed': {
      const url = esc(String(config.url || ''))
      return `<figure class="weave-media weave-embed"><iframe src="${url}" frameborder="0" allowfullscreen></iframe></figure>`
    }
    
    case 'voiceover': {
      const src = esc(String(config.src || ''))
      return `<aside class="weave-media weave-voiceover"><audio src="${src}" controls></audio></aside>`
    }
    
    default:
      return `<div class="weave-media weave-${esc(mediaType)}">[${esc(mediaType)}]</div>`
  }
}

/**
 * Render LaTeX to HTML using KaTeX
 */
function renderKatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: 'html'
    })
  } catch (e) {
    // Fallback if KaTeX fails
    const escaped = escapeHtml(latex)
    if (displayMode) {
      return `<div class="weave-math-block weave-math-error"><pre>${escaped}</pre></div>`
    }
    return `<code class="weave-inline-math weave-math-error">${escaped}</code>`
  }
}

// ============================================================================
// Export Functions
// ============================================================================

export interface ExportOptions {
  /** Title for the HTML document */
  title?: string
  /** Include basic CSS styles (default: true) */
  includeStyles?: boolean
  /** Default display mode for node links (default: 'footnote' for email-friendly) */
  defaultDisplay?: DisplayType
}

/**
 * Export sections to a complete HTML document.
 * Uses footnote-style rendering by default for email compatibility.
 */
export function exportToHtml(
  sections: Section[],
  trees: Map<string, Root> | Record<string, Root>,
  options: ExportOptions = {}
): string {
  const { 
    title = 'Weave Document', 
    includeStyles = true,
    defaultDisplay = 'footnote'
  } = options
  
  // Build sections lookup
  const sectionsMap: Record<string, Section> = {}
  for (const section of sections) {
    sectionsMap[section.id] = section
  }
  
  // Render each section
  const renderedSections = sections.map(section => {
    const tree = trees instanceof Map ? trees.get(section.id) : trees[section.id]
    if (!tree) {
      return `<section class="weave-section" id="${escapeHtml(section.id)}">
        <h2>${escapeHtml(section.title || section.id)}</h2>
        <p><em>Content not available</em></p>
      </section>`
    }
    
    const html = toHtml(tree, { 
      renderMath: true,
      defaultDisplay,
      sections: sectionsMap
    })
    
    return `<section class="weave-section" id="${escapeHtml(section.id)}">
      ${section.title ? `<h2>${escapeHtml(section.title)}</h2>` : ''}
      ${html}
    </section>`
  }).join('\n\n')
  
  const styles = includeStyles ? `
<style>
  .weave-document { max-width: 800px; margin: 0 auto; padding: 2rem; font-family: system-ui, sans-serif; line-height: 1.6; }
  .weave-section { margin-bottom: 3rem; }
  .weave-footnote-ref { font-size: 0.8em; vertical-align: super; }
  .weave-footnotes { font-size: 0.9em; color: #666; }
  .weave-footnotes-separator { margin: 2rem 0; border: none; border-top: 1px solid #ddd; }
  .weave-footnotes-list { padding-left: 1.5rem; }
  .weave-footnote { margin-bottom: 0.5rem; }
  .weave-footnote-backref { text-decoration: none; margin-left: 0.25rem; }
  .weave-math-block { overflow-x: auto; margin: 1rem 0; }
  .weave-media { margin: 1rem 0; }
  .weave-media img { max-width: 100%; height: auto; }
  .weave-node-link { color: #0066cc; }
</style>` : ''
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${styles}
</head>
<body>
  <main class="weave-document">
    ${renderedSections}
  </main>
</body>
</html>`
}

/**
 * Export sections to a single Markdown appendix file.
 */
export function exportToAppendix(sections: Section[]): string {
  return sections.map(section => {
    const title = section.title || section.id
    return `# ${title}\n\n${section.body}\n\n---`
  }).join('\n\n')
}

// Re-export static HTML export
export { exportToStaticHtml } from './static.js'
export type { StaticHtmlOptions } from './static.js'
