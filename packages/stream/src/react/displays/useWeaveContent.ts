/**
 * useWeaveContent - Hook that encapsulates all Weave content handling logic.
 * 
 * Handles:
 * - Section parsing from markdown content
 * - Footnote collection (auto-adds when sections become available)
 * - Inline expansion state
 * - Display config resolution
 * - Node click handling
 * 
 * @example
 * const {
 *   sections,
 *   footnotes,
 *   footnoteNumberMap,
 *   expandedInline,
 *   overlaySection,
 *   panelSection,
 *   handleNodeClick,
 *   closeOverlay,
 *   closePanel,
 *   renderMarkdown,
 * } = useWeaveContent({
 *   content: streamingMarkdown,
 *   displayConfig: { supported: ['inline', 'overlay', 'footnote', 'panel'] }
 * })
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import MarkdownIt from 'markdown-it'
import { weaveLinkPlugin } from '../../markdown-it/index.js'
import { splitSections, type Section } from '../../splitSections.js'
import { type DisplayType } from '../../parseNodeUrl.js'
import { createDisplayConfig, type DisplayConfigOptions } from '../../displayConfig.js'
import type { FootnoteEntry } from './Footnotes.js'

export interface UseWeaveContentOptions {
  /** Markdown content (can be streaming) */
  content: string
  /** Display configuration options */
  displayConfig?: DisplayConfigOptions
}

export interface UseWeaveContentResult {
  /** Parsed sections from content */
  sections: Section[]
  /** Map of section ID to section */
  sectionMap: Map<string, Section>
  /** Collected footnotes */
  footnotes: FootnoteEntry[]
  /** Map of section ID to footnote number */
  footnoteNumberMap: Map<string, number>
  /** Set of expanded inline section IDs */
  expandedInline: Set<string>
  /** Currently displayed overlay section (null if closed) */
  overlaySection: Section | null
  /** Currently displayed panel section (null if closed) */
  panelSection: Section | null
  /** Ref to attach to trigger element for overlay positioning */
  triggerRef: React.MutableRefObject<HTMLElement | null>
  /** Handle node link click - call this from your rendered links */
  handleNodeClick: (id: string, display: DisplayType, event?: React.MouseEvent | React.KeyboardEvent) => void
  /** Close the overlay */
  closeOverlay: () => void
  /** Close the panel */
  closePanel: () => void
  /** Resolve a section for WeaveLink (returns title/peek) */
  resolveSection: (id: string) => { title?: string; peek?: string } | null
  /** The display config instance */
  displayConfig: ReturnType<typeof createDisplayConfig>
  /** Render markdown to HTML */
  renderMarkdown: (markdown: string) => string
  /** Get display content (strips section definitions) */
  getDisplayContent: (content: string) => string
}

export function useWeaveContent(options: UseWeaveContentOptions): UseWeaveContentResult {
  const { content, displayConfig: displayConfigOptions } = options

  // Display state
  const [overlaySection, setOverlaySection] = useState<Section | null>(null)
  const [panelSection, setPanelSection] = useState<Section | null>(null)
  const [expandedInline, setExpandedInline] = useState<Set<string>>(new Set())
  
  // Footnote state
  const [pendingFootnoteIds, setPendingFootnoteIds] = useState<string[]>([])
  const [footnotes, setFootnotes] = useState<FootnoteEntry[]>([])
  
  // Ref for overlay positioning
  const triggerRef = useRef<HTMLElement | null>(null)

  // Create markdown-it instance (memoized to avoid recreation)
  const md = useMemo(() => {
    const instance = new MarkdownIt({ html: true })
    instance.use(weaveLinkPlugin as any)
    return instance
  }, [])

  // Create display config
  const displayConfig = useMemo(() => 
    createDisplayConfig(displayConfigOptions ?? {
      supported: ['inline', 'overlay', 'footnote', 'panel'],
      fallbacks: {
        sidenote: 'footnote',
        margin: 'footnote',
        stretch: 'inline',
      }
    }), 
    [displayConfigOptions]
  )

  // Parse sections from content
  const sections = useMemo(() => splitSections(content), [content])

  const sectionMap = useMemo(() => {
    const map = new Map<string, Section>()
    for (const section of sections) {
      map.set(section.id, section)
    }
    return map
  }, [sections])

  // Resolve section for WeaveLink component
  const resolveSection = useCallback((id: string) => {
    const section = sectionMap.get(id)
    if (!section) return null
    return {
      title: section.title,
      peek: section.peek ?? (section.content.slice(0, 100) + (section.content.length > 100 ? '...' : ''))
    }
  }, [sectionMap])

  // Scan content for footnote links
  useEffect(() => {
    const seenIds = new Set<string>()
    const displayContent = content.replace(/\n---\n[\s\S]*$/g, '').trim()
    const html = md.render(displayContent)
    
    const spanRegex = /<span class="weave-link[^"]*" data-target="([^"]+)" data-display="([^"]+)"[^>]*>/g
    let match
    
    while ((match = spanRegex.exec(html)) !== null) {
      const id = match[1]
      const display = match[2] as DisplayType
      const resolvedDisplay = displayConfig.resolve(display)
      
      if (resolvedDisplay === 'footnote') {
        seenIds.add(id)
      }
    }
    
    setPendingFootnoteIds(Array.from(seenIds))
  }, [content, displayConfig, md])

  // Build footnotes in document order when sections become available
  useEffect(() => {
    const newFootnotes: FootnoteEntry[] = []
    let number = 1
    
    for (const id of pendingFootnoteIds) {
      const section = sectionMap.get(id)
      if (section) {
        newFootnotes.push({
          id,
          number: number++,
          title: section.title,
          content: section.content // Raw content - consumer renders it
        })
      }
    }
    
    setFootnotes(newFootnotes)
  }, [pendingFootnoteIds, sectionMap])

  // Map from section id to footnote number
  const footnoteNumberMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const fn of footnotes) {
      map.set(fn.id, fn.number)
    }
    return map
  }, [footnotes])

  // Handle node click
  const handleNodeClick = useCallback((id: string, display: DisplayType, event?: React.MouseEvent | React.KeyboardEvent) => {
    const section = sectionMap.get(id)
    if (!section) return

    if (event?.currentTarget) {
      triggerRef.current = event.currentTarget as HTMLElement
    }

    switch (display) {
      case 'overlay':
        // Toggle: close if clicking the same section that's already open
        setOverlaySection(prev => prev?.id === section.id ? null : section)
        break
      case 'panel':
        // Toggle: close if clicking the same section that's already open
        setPanelSection(prev => prev?.id === section.id ? null : section)
        break
      case 'footnote': {
        const fnNumber = footnoteNumberMap.get(id)
        if (fnNumber) {
          document.getElementById(`fn-${fnNumber}`)?.scrollIntoView({ behavior: 'smooth' })
        }
        break
      }
      case 'inline':
        setExpandedInline(prev => {
          const next = new Set(prev)
          if (next.has(id)) {
            next.delete(id)
          } else {
            next.add(id)
          }
          return next
        })
        break
    }
  }, [sectionMap, footnoteNumberMap])

  const closeOverlay = useCallback(() => setOverlaySection(null), [])
  const closePanel = useCallback(() => setPanelSection(null), [])

  // Render markdown to HTML
  const renderMarkdown = useCallback((markdown: string) => md.render(markdown), [md])

  // Get display content (strips section definitions)
  const getDisplayContent = useCallback((content: string) => {
    return content.replace(/\n---\n[\s\S]*$/g, '').trim()
  }, [])

  return {
    sections,
    sectionMap,
    footnotes,
    footnoteNumberMap,
    expandedInline,
    overlaySection,
    panelSection,
    triggerRef,
    handleNodeClick,
    closeOverlay,
    closePanel,
    resolveSection,
    displayConfig,
    renderMarkdown,
    getDisplayContent,
  }
}
