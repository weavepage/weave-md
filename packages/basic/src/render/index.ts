import { toHast } from 'mdast-util-to-hast'
import { toHtml as hastToHtml } from 'hast-util-to-html'
import { visit, SKIP } from 'unist-util-visit'
import type { Root } from 'mdast'
import type { Root as HastRoot } from 'hast'
import { formatNodeUrl } from '@weave-md/core'
import type { NodeRef, Section, DisplayType } from '@weave-md/core'
import katex from 'katex'
import { parseMdast } from '@weave-md/parse'

export interface ToHtmlOptions {
  /** Render math using KaTeX (default: true) */
  renderMath?: boolean
  /** Custom handler for node links */
  nodeLinksHandler?: (ref: NodeRef, text: string, footnoteNumber?: number, refInstance?: number) => string
  /** 
   * Default display mode for node links without explicit display param.
   * 'footnote' is recommended for email-friendly output.
   */
  defaultDisplay?: DisplayType
  /** Section content lookup for rendering footnotes/inline content */
  sections?: Map<string, Section> | Record<string, Section>
  /** Skip rendering footnotes section at bottom (for inline/overlay content) */
  skipFootnotesSection?: boolean
}

/**
 * Convert mdast tree to HTML string.
 * Handles Weave-specific node types (weaveNodeLink, weaveMathBlock, weaveMediaBlock, etc.)
 */
export function toHtml(tree: Root, options: ToHtmlOptions = {}): string {
  const { renderMath = true, nodeLinksHandler, defaultDisplay, sections, skipFootnotesSection = false } = options
  
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
  
  // Append footnotes section if any were collected (unless skipped for inline/overlay content)
  if (footnotes.length > 0 && !skipFootnotesSection) {
    html += renderFootnotesSection(footnotes)
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
    nodeLinksHandler?: (ref: NodeRef, text: string, footnoteNumber?: number, refInstance?: number) => string
    defaultDisplay?: DisplayType
    sections?: Map<string, Section> | Record<string, Section>
    footnotes: Array<{ ref: NodeRef; text: string; content?: string }>
    footnoteMap?: Map<string, number>
    footnoteRefCount?: Map<number, number>
  }
): void {
  // Track which nodes have already been assigned footnote numbers
  if (!options.footnoteMap) {
    options.footnoteMap = new Map()
  }
  // Track reference instance count per footnote number
  if (!options.footnoteRefCount) {
    options.footnoteRefCount = new Map()
  }
  
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
      // Check if this node already has a footnote number
      let footnoteNum = options.footnoteMap!.get(ref.id)
      
      if (footnoteNum === undefined) {
        // New footnote - assign next number
        footnoteNum = options.footnotes.length + 1
        options.footnoteMap!.set(ref.id, footnoteNum)
        const section = getSection(options.sections, ref.id)
        options.footnotes.push({ 
          ref, 
          text, 
          content: section?.peek || section?.body?.slice(0, 200) 
        })
      }
      
      // Track reference instance for unique IDs
      const currentCount = options.footnoteRefCount!.get(footnoteNum) || 0
      const refInstance = currentCount + 1
      options.footnoteRefCount!.set(footnoteNum, refInstance)
      
      if (options.nodeLinksHandler) {
        parent.children[index] = {
          type: 'html',
          value: options.nodeLinksHandler(ref, text, footnoteNum, refInstance)
        } as any
      } else {
        // Render as footnote reference: text[1]
        // For empty anchor [ ], don't render the space
        const displayText = text.trim() === '' ? '' : escapeHtml(text)
        const refId = refInstance === 1 ? `fnref-${footnoteNum}` : `fnref-${footnoteNum}-${refInstance}`
        parent.children[index] = {
          type: 'html',
          value: `${displayText}<sup class="weave-footnote-ref"><a href="#fn-${footnoteNum}" id="${refId}">[${footnoteNum}]</a></sup>`
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
  // Uses div instead of pre so markdown can be processed, CSS handles whitespace
  visit(tree, 'weavePreformatted', (node: any, index, parent) => {
    if (index === undefined || !parent) return
    
    // For now, preserve as text with spacing - markdown processing would require parser changes
    const escaped = escapeHtml(node.value)
    parent.children[index] = {
      type: 'html',
      value: `<div class="weave-preformatted">${escaped}</div>`
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
  
  // Transform sub (inline substitution) to HTML
  visit(tree, 'sub', (node: any, index, parent) => {
    if (index === undefined || !parent) return
    
    const rawInitial = node.data?.rawInitial ?? ''
    const rawReplacement = node.data?.rawReplacement ?? ''
    
    // Parse and render both initial and replacement content to support :math
    const initialHtml = renderInlineContent(rawInitial, options)
    const replacementHtml = renderInlineContent(rawReplacement, options)
    // Base64 encode to avoid quote escaping issues with nested content
    const encodedReplacement = Buffer.from(replacementHtml).toString('base64')
    
    // Detect redacted text (black block characters)
    const isRedacted = /^[█▓▒░■□▪▫]+$/.test(rawInitial.trim())
    const className = isRedacted ? 'weave-sub weave-sub-redacted' : 'weave-sub'
    
    const html = `<span class="${className}" data-replacement-b64="${encodedReplacement}">${initialHtml}</span>`
    
    parent.children[index] = { type: 'html', value: html } as any
    return SKIP
  })
}

/**
 * Parse and render inline content (for :sub replacement text)
 */
function renderInlineContent(content: string, options: { renderMath?: boolean }): string {
  if (!content) return ''
  
  // Parse the content as mdast
  const tree = parseMdast(content)
  
  // Transform any sub/math nodes in the parsed tree
  transformWeaveNodesToHtml(tree, { renderMath: options.renderMath ?? true, footnotes: [] })
  
  // Convert to hast and then to HTML
  const hast = toHast(tree, { allowDangerousHtml: true })
  if (!hast) return escapeHtml(content)
  
  // Get the inner HTML (skip the wrapping paragraph if present)
  const html = hastToHtml(hast as HastRoot, { allowDangerousHtml: true })
  
  // Strip wrapping <p> tags if present (since this is inline content)
  return html.replace(/^<p>/, '').replace(/<\/p>\s*$/, '')
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
  footnotes: Array<{ ref: NodeRef; text: string; content?: string }>
): string {
  if (footnotes.length === 0) return ''
  
  const items = footnotes.map((fn, i) => {
    const num = i + 1
    const content = fn.content ? escapeHtml(fn.content) : `[${escapeHtml(fn.ref.id)}]`
    return `<li id="fn-${num}" class="weave-footnote">
      <p><a href="#fnref-${num}" class="weave-footnote-backref">[${num}]</a> ${content}</p>
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
  // Support both 'file' (spec) and 'src' (legacy) field names
  const getFile = () => esc(String(config.file || config.src || ''))
  
  switch (mediaType) {
    case 'image': {
      const src = getFile()
      const alt = esc(String(config.alt || ''))
      const caption = config.caption ? `<figcaption>${esc(String(config.caption))}</figcaption>` : ''
      return `<figure class="weave-media weave-image"><img src="${src}" alt="${alt}">${caption}</figure>`
    }
    
    case 'gallery': {
      const files = (config.files as any[]) || []
      // Support both URL strings and {file/src:} objects
      const images = files.map(f => {
        const src = typeof f === 'string' ? esc(f) : esc(String(f.file || f.src || ''))
        const alt = typeof f === 'string' ? '' : esc(String(f.alt || ''))
        return `<figure><img src="${src}" alt="${alt}"></figure>`
      }).join('')
      const caption = config.caption ? `<figcaption>${esc(String(config.caption))}</figcaption>` : ''
      return `<div class="weave-media weave-gallery">${images}${caption}</div>`
    }
    
    case 'audio': {
      const src = getFile()
      const autoplay = config.autoplay ? ' autoplay' : ''
      const loop = config.loop ? ' loop' : ''
      const controls = config.controls !== false ? ' controls' : ''
      return `<figure class="weave-media weave-audio"><audio src="${src}"${controls}${autoplay}${loop}></audio></figure>`
    }
    
    case 'video': {
      const src = getFile()
      const poster = config.poster ? ` poster="${esc(String(config.poster))}"` : ''
      const autoplay = config.autoplay ? ' autoplay' : ''
      const loop = config.loop ? ' loop' : ''
      const controls = config.controls !== false ? ' controls' : ''
      const start = config.start ? ` data-start="${esc(String(config.start))}"` : ''
      return `<figure class="weave-media weave-video"><video src="${src}"${poster}${controls}${autoplay}${loop}${start}></video></figure>`
    }
    
    case 'embed': {
      const url = esc(String(config.url || ''))
      const width = config.width ? ` width="${esc(String(config.width))}"` : ''
      const height = config.height ? ` height="${esc(String(config.height))}"` : ''
      return `<figure class="weave-media weave-embed"><iframe src="${url}"${width}${height} frameborder="0" allowfullscreen></iframe></figure>`
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
