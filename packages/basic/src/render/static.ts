import type { Root } from 'mdast'
import type { Section } from '@weave-md/core'
import { extractNodeLinks } from '@weave-md/validate'
import { toHtml } from './index.js'
import { renderTemplate } from './template.js'

export interface StaticHtmlOptions {
  /** Document title */
  title?: string
  /** Entry section ID - only render this section and its references */
  entry?: string
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
  const { title = 'Weave Document', entry } = options
  
  // Build sections lookup
  const sectionsMap: Record<string, Section> = {}
  for (const section of sections) {
    sectionsMap[section.id] = section
  }
  
  // If entry is specified, filter to only include entry and its transitive references
  let filteredSections = sections
  if (entry) {
    const includedIds = new Set<string>()
    const queue = [entry]
    
    // BFS to find all referenced sections
    while (queue.length > 0) {
      const id = queue.shift()!
      if (includedIds.has(id)) continue
      includedIds.add(id)
      
      const tree = trees instanceof Map ? trees.get(id) : trees[id]
      if (tree) {
        const findRefs = (node: any) => {
          if (node.type === 'weaveNodeLink' && node.targetId) {
            if (!includedIds.has(node.targetId)) {
              queue.push(node.targetId)
            }
          }
          if (node.children) node.children.forEach(findRefs)
        }
        findRefs(tree)
      }
    }
    
    filteredSections = sections.filter(s => includedIds.has(s.id))
  }
  
  // Collect all referenced node IDs and categorize by display mode
  // Use recursive approach to find nested references (e.g., references inside footnote content)
  const referencedNodeIds = new Set<string>()
  const overlayNodeIds = new Set<string>()
  const inlineNodeIds = new Set<string>()
  const footnoteNodeIds = new Set<string>()
  
  const findNodeRefs = (node: any) => {
    if (node.type === 'weaveNodeLink') {
      const display = node.display || 'footnote'
      if (display === 'inline' || display === 'overlay' || display === 'footnote') {
        referencedNodeIds.add(node.targetId)
      }
      if (display === 'overlay') overlayNodeIds.add(node.targetId)
      if (display === 'inline') inlineNodeIds.add(node.targetId)
      if (display === 'footnote') footnoteNodeIds.add(node.targetId)
    }
    if (node.children) {
      node.children.forEach(findNodeRefs)
    }
  }
  
  // First pass: scan filtered sections to find direct references
  for (const section of filteredSections) {
    const tree = trees instanceof Map ? trees.get(section.id) : trees[section.id]
    if (tree) {
      findNodeRefs(tree)
    }
  }
  
  // Second pass: recursively find references in referenced sections
  // Keep scanning until no new references are found
  let prevSize = 0
  while (referencedNodeIds.size > prevSize) {
    prevSize = referencedNodeIds.size
    for (const refId of referencedNodeIds) {
      const tree = trees instanceof Map ? trees.get(refId) : trees[refId]
      if (tree) {
        findNodeRefs(tree)
      }
    }
  }
  
  // Collect footnotes only from main sections (not from inline/overlay content)
  const allFootnoteNodeIds: string[] = []
  const seenFootnoteIds = new Set<string>()
  
  for (const section of filteredSections) {
    if (referencedNodeIds.has(section.id)) continue
    const { links } = extractNodeLinks(section.body, section.id)
    for (const link of links) {
      const display = link.ref.display || 'footnote'
      if (display === 'footnote' && !seenFootnoteIds.has(link.ref.id)) {
        seenFootnoteIds.add(link.ref.id)
        allFootnoteNodeIds.push(link.ref.id)
      }
    }
  }
  
  // Build global footnote map with pre-assigned numbers
  const globalFootnoteMap = new Map<string, number>()
  const globalFootnotes: Array<{ id: string; content: string }> = []
  
  for (const nodeId of allFootnoteNodeIds) {
    const num = globalFootnotes.length + 1
    globalFootnoteMap.set(nodeId, num)
    const section = sectionsMap[nodeId]
    globalFootnotes.push({
      id: nodeId,
      content: section?.peek || section?.body?.slice(0, 200) || `[${nodeId}]`
    })
  }
  
  // Track reference instances for unique IDs
  const globalFootnoteRefCount = new Map<number, number>()
  
  // Helper to get footnote number (already assigned)
  const getFootnoteNum = (nodeId: string): number | undefined => {
    return globalFootnoteMap.get(nodeId)
  }
  
  // Helper to get reference instance number
  const getRefInstance = (footnoteNum: number): number => {
    const current = globalFootnoteRefCount.get(footnoteNum) || 0
    const instance = current + 1
    globalFootnoteRefCount.set(footnoteNum, instance)
    return instance
  }
  
  // nodeLinksHandler for main sections (supports footnotes)
  // Heroicons SVG icons (outline/24px)
  const iconPlusCircle = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="weave-icon weave-icon-plus"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="weave-icon weave-icon-minus"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`
  const iconInformationCircle = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="weave-icon"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>`

  const mainNodeLinksHandler = (ref: any, text: string) => {
    // Handle inline display mode
    if (ref.display === 'inline') {
      const targetSection = sectionsMap[ref.id]
      if (targetSection) {
        if (!text || text.trim() === '') {
          return `<span class="weave-inline-anchor" data-inline-id="${escapeHtml(ref.id)}" title="Expand">${iconPlusCircle}</span>`
        }
        return `<span class="weave-inline-trigger" data-inline-id="${escapeHtml(ref.id)}">${escapeHtml(text)}</span>`
      }
    }
    
    // Handle overlay display mode
    if (ref.display === 'overlay') {
      if (!text || text.trim() === '') {
        return `<span class="weave-overlay-anchor" data-display="overlay" data-node-id="${escapeHtml(ref.id)}" title="View ${escapeHtml(ref.id)}">${iconInformationCircle}</span>`
      }
      return `<span class="weave-node-link" data-display="overlay" data-node-id="${escapeHtml(ref.id)}">${escapeHtml(text)}</span>`
    }
    
    // Handle footnote display mode (or default)
    const footnoteNum = getFootnoteNum(ref.id)
    if (footnoteNum === undefined) {
      // Footnote not found - render as plain text
      return `<span class="weave-unsupported">${escapeHtml(text || ref.id)}</span>`
    }
    const refInstance = getRefInstance(footnoteNum)
    const refId = refInstance === 1 ? `fnref-${footnoteNum}` : `fnref-${footnoteNum}-${refInstance}`
    
    if (!text || text.trim() === '') {
      return `<sup class="weave-footnote-ref"><a href="#fn-${footnoteNum}" id="${refId}">[${footnoteNum}]</a></sup>`
    }
    return `<a href="#fn-${footnoteNum}" id="${refId}" class="weave-footnote-link"><span class="weave-footnote-link-text">${escapeHtml(text)}</span><sup>[${footnoteNum}]</sup></a>`
  }
  
  // nodeLinksHandler for footnote/inline content (only overlays allowed, no further nesting)
  const nestedNodeLinksHandler = (ref: any, text: string) => {
    const targetSection = sectionsMap[ref.id]
    if (!targetSection) {
      return `<span class="weave-unsupported">${escapeHtml(text || ref.id)}</span>`
    }
    // All display modes become overlays in footnote/inline content
    if (!text || text.trim() === '') {
      return `<span class="weave-overlay-anchor" data-display="overlay" data-node-id="${escapeHtml(ref.id)}" title="View ${escapeHtml(ref.id)}">${iconInformationCircle}</span>`
    }
    return `<span class="weave-node-link" data-display="overlay" data-node-id="${escapeHtml(ref.id)}">${escapeHtml(text)}</span>`
  }
  
  // nodeLinksHandler for overlay content (no nesting allowed)
  const noNestingHandler = (ref: any, text: string) => {
    // Render as plain text - no interactive elements inside overlays
    return escapeHtml(text || ref.id)
  }
  
  // Render main sections first (to establish footnote order)
  const renderedSections: string[] = []
  
  for (const section of filteredSections) {
    // Skip sections that are only referenced inline or as overlays
    if (referencedNodeIds.has(section.id)) {
      continue
    }
    
    const tree = trees instanceof Map ? trees.get(section.id) : trees[section.id]
    if (!tree) {
      renderedSections.push(`<section class="weave-section" id="${escapeHtml(section.id)}">
        <p><em>Content not available</em></p>
      </section>`)
      continue
    }
    
    const html = toHtml(tree, { 
      renderMath: true,
      defaultDisplay: 'footnote',
      sections: sectionsMap,
      skipFootnotesSection: true,
      nodeLinksHandler: mainNodeLinksHandler
    })
    
    renderedSections.push(`<section class="weave-section" id="${escapeHtml(section.id)}">
      ${html}
    </section>`)
  }
  
  // Build sectionsData for inline/overlay rendering
  // - Footnote/inline content: allows overlays only
  // - Overlay content: no nesting allowed
  const sectionsData: Record<string, { title?: string; html: string }> = {}
  for (const section of filteredSections) {
    const tree = trees instanceof Map ? trees.get(section.id) : trees[section.id]
    if (tree) {
      // Use noNestingHandler for sections used as overlays
      const handler = overlayNodeIds.has(section.id) ? noNestingHandler : nestedNodeLinksHandler
      const sectionHtml = toHtml(tree, {
        renderMath: true,
        sections: sectionsMap,
        skipFootnotesSection: true,
        nodeLinksHandler: handler
      })
      sectionsData[section.id] = {
        title: section.title,
        html: sectionHtml
      }
    }
  }
  
  // Render global footnotes section (node links become overlays only)
  let footnotesHtml = ''
  if (globalFootnotes.length > 0) {
    const items = globalFootnotes.map((fn, i) => {
      const num = i + 1
      const fnTree = trees instanceof Map ? trees.get(fn.id) : trees[fn.id]
      let fnContentHtml: string
      if (fnTree) {
        fnContentHtml = toHtml(fnTree, {
          renderMath: true,
          sections: sectionsMap,
          skipFootnotesSection: true,
          nodeLinksHandler: nestedNodeLinksHandler
        })
      } else {
        fnContentHtml = escapeHtml(fn.content)
      }
      return `<li id="fn-${num}" class="weave-footnote">
        <span class="weave-footnote-marker"><a href="#fnref-${num}" class="weave-footnote-backref">[${num}]</a></span>
        <div class="weave-footnote-content">${fnContentHtml}</div>
      </li>`
    }).join('\n')
    
    footnotesHtml = `
<hr class="weave-footnotes-separator">
<section class="weave-footnotes">
  <ol class="weave-footnotes-list">
    ${items}
  </ol>
</section>`
  }
  
  const content = renderedSections.join('\n\n') + footnotesHtml
  
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
