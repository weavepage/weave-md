import type { Root } from 'mdast'
import type { Section } from '@weave-md/core'
import { toHtml } from './index.js'
import { renderTemplate } from './template.js'

export interface StaticHtmlOptions {
  /** Document title */
  title?: string
}

/**
 * Export sections to a static HTML file with footnote and overlay support.
 * 
 * Features:
 * - Footnote-style references with backlinks
 * - Overlay previews for display=overlay links
 * - No server required - works as static file
 * - Mobile-friendly
 */
export function exportToStaticHtml(
  sections: Section[],
  trees: Map<string, Root> | Record<string, Root>,
  options: StaticHtmlOptions = {}
): string {
  const { title = 'Weave Document' } = options
  
  // Build sections lookup
  const sectionsMap: Record<string, Section> = {}
  for (const section of sections) {
    sectionsMap[section.id] = section
  }
  
  // Collect all referenced node IDs to filter out from top-level rendering
  const referencedNodeIds = new Set<string>()
  for (const section of sections) {
    const tree = trees instanceof Map ? trees.get(section.id) : trees[section.id]
    if (tree) {
      // Find all node references in this section
      const findNodeRefs = (node: any) => {
        if (node.type === 'weaveNodeLink') {
          // Filter out sections that are only referenced inline, overlay, or footnote
          if (node.display === 'inline' || node.display === 'overlay' || node.display === 'footnote') {
            referencedNodeIds.add(node.targetId)
          }
        }
        if (node.children) {
          node.children.forEach(findNodeRefs)
        }
      }
      findNodeRefs(tree)
    }
  }
  
  // Build sectionsData for ALL sections (for overlay/inline rendering)
  const sectionsData: Record<string, { title?: string; html: string }> = {}
  for (const section of sections) {
    const tree = trees instanceof Map ? trees.get(section.id) : trees[section.id]
    if (tree) {
      const sectionHtml = toHtml(tree, {
        renderMath: true,
        sections: sectionsMap
      })
      sectionsData[section.id] = {
        title: section.title,
        html: sectionHtml
      }
    }
  }
  
  // Render each section with mixed display modes
  const renderedSections: string[] = []
  
  for (const section of sections) {
    // Skip sections that are only referenced inline or as overlays
    if (referencedNodeIds.has(section.id)) {
      continue
    }
    
    const tree = trees instanceof Map ? trees.get(section.id) : trees[section.id]
    if (!tree) {
      renderedSections.push(`<section class="weave-section" id="${escapeHtml(section.id)}">
        <h2>${escapeHtml(section.title || section.id)}</h2>
        <p><em>Content not available</em></p>
      </section>`)
      continue
    }
    
    // Render with only footnote and overlay support
    const html = toHtml(tree, { 
      renderMath: true,
      defaultDisplay: 'footnote',
      sections: sectionsMap,
      nodeLinksHandler: (ref, text, footnoteNum) => {
        // Handle inline display mode
        if (ref.display === 'inline') {
          const targetSection = sectionsMap[ref.id]
          if (targetSection) {
            // Keep trigger inline, content will be dynamically inserted by JS
            return `<span class="weave-inline-trigger" data-inline-id="${escapeHtml(ref.id)}">${escapeHtml(text)}</span>`
          }
        }
        
        // Handle overlay display mode
        if (ref.display === 'overlay') {
          // Empty text: render as icon
          if (!text || text.trim() === '') {
            return `<span class="weave-overlay-anchor" data-display="overlay" data-node-id="${escapeHtml(ref.id)}" title="View ${escapeHtml(ref.id)}">i</span>`
          }
          // With text: render as hoverable link
          return `<a href="#" class="weave-node-link" data-display="overlay" data-node-id="${escapeHtml(ref.id)}">${escapeHtml(text)}</a>`
        }
        
        // Default: footnote style (or explicit display=footnote)
        if (footnoteNum !== undefined) {
          // For empty anchor [ ], don't render the space
          const displayText = text.trim() === '' ? '' : escapeHtml(text)
          return `${displayText}<sup class="weave-footnote-ref"><a href="#weave-fn-${footnoteNum}" id="weave-fnref-${footnoteNum}">[${footnoteNum}]</a></sup>`
        }
        
        // Unsupported display modes: render as plain text with warning
        return `<span class="weave-unsupported" title="Display mode '${ref.display}' not supported in static export">${escapeHtml(text)}</span>`
      }
    })
    
    renderedSections.push(`<section class="weave-section" id="${escapeHtml(section.id)}">
      ${section.title ? `<h2>${escapeHtml(section.title)}</h2>` : ''}
      ${html}
    </section>`)
  }
  
  const content = renderedSections.join('\n\n')
  
  return renderTemplate({
    title,
    content,
    sectionsData
  })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
