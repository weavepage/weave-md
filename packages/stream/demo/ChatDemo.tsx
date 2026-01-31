import React, { useState, useMemo } from 'react'
import { 
  Overlay, 
  Footnotes, 
  Panel, 
  useWeaveContent,
  type FootnoteEntry,
} from '../src/react/displays'
import {
  injectStyles,
  splitTrailingPunctuation,
  type DisplayType,
} from '../src/react'

// Inject all styles on load
injectStyles()

// Sample LLM response with Weave sections (YAML frontmatter format)
const SAMPLE_RESPONSE = `# Introduction to Weave

Weave is a document format that enables **non-linear reading** through node links.

For example, you can reference other sections like [the methodology](node:methodology?display=overlay) 
or add footnotes like [background context](node:background?display=footnote).

You can also expand content inline: [see the details here](node:details?display=inline).

For longer content, use a panel: [view full analysis](node:full-analysis?display=panel).

---
id: methodology
title: Methodology
peek: Our research methodology explained
---

This section explains our methodology. We use a combination of qualitative and quantitative approaches.

**Key steps:**
1. Data collection from multiple sources
2. Rigorous analysis using established frameworks
3. Synthesis into actionable insights

---
id: background
title: Background Context
peek: Historical context for this work
---

The background for this work comes from years of research in hypertext systems, starting with Ted Nelson's Xanadu project in the 1960s and continuing through modern wiki systems like Wikipedia.

Key influences include:
- Vannevar Bush's "Memex" concept (1945)
- Ted Nelson's Xanadu (1960s)
- Tim Berners-Lee's World Wide Web (1989)

---
id: details
title: Technical Details
peek: Format specifications
---

Here are the detailed specifications:

- **Format**: Markdown-based with extensions
- **Links**: Standard markdown links with \`node:\` URLs
- **Sections**: YAML frontmatter with \`id:\` field
- **Display types**: inline, overlay, footnote, panel, sidenote, margin, stretch

---
id: full-analysis
title: Full Analysis
peek: Comprehensive analysis document
---

This is a comprehensive analysis that would typically be too long for an overlay.

### Part 1: Historical Context

The history of hypertext dates back to the 1960s when Ted Nelson coined the term. His vision of interconnected documents influenced generations of researchers and eventually led to the World Wide Web.

### Part 2: Technical Implementation

Our implementation uses a custom parser built on micromark, the same foundation used by remark and other popular markdown tools. This ensures compatibility with existing markdown workflows.

### Part 3: Future Directions

We envision a future where documents are truly interconnected, where readers can explore ideas non-linearly, and where the boundaries between documents become fluid.
`

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: SAMPLE_RESPONSE }
  ])
  const [input, setInput] = useState('')

  // Combine all message content for the hook
  const allContent = messages.map(m => m.content).join('\n\n')

  // useWeaveContent handles all the Weave logic:
  // - Section parsing
  // - Inline expansion state
  // - Display config resolution
  // - Node click handling
  // Note: We handle footnotes per-message below, not globally
  const {
    sectionMap,
    expandedInline,
    overlaySection,
    panelSection,
    triggerRef,
    handleNodeClick,
    closeOverlay,
    closePanel,
    displayConfig,
    renderMarkdown,
    getDisplayContent,
  } = useWeaveContent({ content: allContent })

  // Collect footnotes per message (so each response has its own footnote numbering)
  const messageFootnotes = useMemo(() => {
    const result: Map<number, { footnotes: FootnoteEntry[], numberMap: Map<string, number> }> = new Map()
    
    messages.forEach((msg, msgIndex) => {
      if (msg.role !== 'assistant') return
      
      const footnotes: FootnoteEntry[] = []
      const numberMap = new Map<string, number>()
      const seenIds = new Set<string>()
      
      // Parse the display content to find footnote links
      const displayContent = getDisplayContent(msg.content)
      const html = renderMarkdown(displayContent)
      
      const spanRegex = /<span class="weave-link[^"]*" data-target="([^"]+)" data-display="([^"]+)"[^>]*>/g
      let match
      
      while ((match = spanRegex.exec(html)) !== null) {
        const id = match[1]
        const display = match[2] as DisplayType
        const resolvedDisplay = displayConfig.resolve(display)
        
        if (resolvedDisplay === 'footnote' && !seenIds.has(id)) {
          seenIds.add(id)
          const section = sectionMap.get(id)
          if (section) {
            const fnNumber = footnotes.length + 1
            numberMap.set(id, fnNumber)
            footnotes.push({
              id,
              number: fnNumber,
              title: section.title,
              content: section.content
            })
          }
        }
      }
      
      result.set(msgIndex, { footnotes, numberMap })
    })
    
    return result
  }, [messages, sectionMap, displayConfig, renderMarkdown, getDisplayContent])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    setMessages(prev => [
      ...prev,
      { role: 'user', content: input },
      { role: 'assistant', content: `You said: "${input}"\n\nHere's a link back to [the methodology](node:methodology?display=overlay).` }
    ])
    setInput('')
  }

  // Render markdown content with interactive Weave links
  // Uses event delegation to handle clicks on weave-link spans
  const renderContent = (content: string, messageIndex: number) => {
    const html = renderMarkdown(content)
    const msgFootnotes = messageFootnotes.get(messageIndex)
    const footnoteNumberMap = msgFootnotes?.numberMap ?? new Map<string, number>()
    
    // Update the HTML to mark resolved links, add footnote numbers, and handle inline expansion
    // Use splitTrailingPunctuation to properly extract punctuation that follows links
    let processedHtml = html.replace(
      /<span class="weave-link([^"]*)" data-target="([^"]+)" data-display="([^"]+)"([^>]*)>([\s\S]*?)<\/span>([^<]*)/g,
      (match, classes, id, display, attrs, text, afterSpan) => {
        // Extract trailing punctuation from text after the span
        const { punctuation: trailingPunct, rest: restAfter } = splitTrailingPunctuation(afterSpan)
        const resolvedDisplay = displayConfig.resolve(display as DisplayType)
        const section = sectionMap.get(id)
        const isResolved = !!section
        
        if (resolvedDisplay === 'footnote') {
          const fnNumber = footnoteNumberMap.get(id)
          if (fnNumber) {
            // Render as footnote reference with message-scoped IDs
            return `<span class="weave-footnote-ref-wrapper">${text}<sup class="weave-footnote-ref"><a href="#fn-${messageIndex}-${fnNumber}" id="fnref-${messageIndex}-${fnNumber}" data-fnref="${messageIndex}-${fnNumber}">[${fnNumber}]</a></sup></span>${trailingPunct}${restAfter}`
          }
        }
        
        if (resolvedDisplay === 'inline' && section) {
          const isExpanded = expandedInline.has(id)
          const triggerClass = isExpanded ? 'weave-inline-trigger weave-inline-trigger--expanded' : 'weave-inline-trigger'
          const expandedContent = isExpanded 
            ? `<div class="weave-inline-content">${renderMarkdown(section.content)}</div>`
            : ''
          // Keep trailing punctuation with the trigger, before expanded content
          return `<span class="weave-inline-wrapper"><span class="${triggerClass}" data-inline-target="${id}" role="button" tabindex="0">${text}</span>${trailingPunct}${expandedContent}</span>${restAfter}`
        }
        
        // Update class to show resolved state (keep trailing punctuation after)
        const resolvedClass = isResolved ? ' weave-link--resolved' : ' weave-link--pending'
        return `<span class="weave-link${resolvedClass}" data-target="${id}" data-display="${resolvedDisplay}" data-resolved="${isResolved}"${attrs}>${text}</span>${trailingPunct}${restAfter}`
      }
    )
    
    // Handle click events via delegation
    const handleContainerClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Check for inline trigger click
      const inlineTrigger = target.closest('[data-inline-target]') as HTMLElement
      if (inlineTrigger) {
        const id = inlineTrigger.dataset.inlineTarget
        if (id) {
          handleNodeClick(id, 'inline')
        }
        return
      }
      
      // Check for weave-link click
      const link = target.closest('.weave-link--resolved') as HTMLElement
      if (link) {
        const id = link.dataset.target
        const display = link.dataset.display as DisplayType
        if (id && display) {
          triggerRef.current = link
          handleNodeClick(id, display)
        }
        return
      }
      
      // Check for footnote ref click
      const fnRef = target.closest('[data-fnref]') as HTMLElement
      if (fnRef) {
        e.preventDefault()
        const fnId = fnRef.dataset.fnref
        if (fnId) {
          document.getElementById(`fn-${fnId}`)?.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
    
    return (
      <div 
        key={messageIndex}
        onClick={handleContainerClick}
        dangerouslySetInnerHTML={{ __html: processedHtml }} 
      />
    )
  }

  // Render footnotes for a specific message
  const renderMessageFootnotes = (messageIndex: number) => {
    const msgFootnotes = messageFootnotes.get(messageIndex)
    if (!msgFootnotes || msgFootnotes.footnotes.length === 0) return null
    
    const rendered = msgFootnotes.footnotes.map(fn => ({
      ...fn,
      // Use message-scoped IDs
      id: `${messageIndex}-${fn.number}`,
      content: typeof fn.content === 'string' 
        ? <div dangerouslySetInnerHTML={{ __html: renderMarkdown(fn.content) }} />
        : fn.content
    }))
    
    return <Footnotes footnotes={rendered} />
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>weave-link Demo</h1>
        <p style={styles.subtitle}>Click the colored links to see different display types</p>
      </header>

      <main style={styles.main}>
        <div style={styles.chat}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              ...styles.message,
              ...(msg.role === 'user' ? styles.userMessage : styles.assistantMessage)
            }}>
              <div style={styles.messageRole}>{msg.role}</div>
              <div style={styles.messageContent}>
                {renderContent(getDisplayContent(msg.content), i)}
              </div>
              {msg.role === 'assistant' && renderMessageFootnotes(i)}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={styles.inputForm}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Send</button>
        </form>
      </main>

      {/* Overlay display */}
      <Overlay
        open={overlaySection !== null}
        onClose={closeOverlay}
        triggerRef={triggerRef}
      >
        {overlaySection && (
          <>
            {overlaySection.title && <strong>{overlaySection.title}</strong>}
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(overlaySection.content) }} style={{ marginTop: 8 }} />
          </>
        )}
      </Overlay>

      {/* Panel display */}
      <Panel
        open={panelSection !== null}
        onClose={closePanel}
        title={panelSection?.title}
      >
        {panelSection && (
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(panelSection.content) }} />
        )}
      </Panel>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: 800,
    margin: '0 auto',
    padding: 20,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    marginBottom: 24,
    borderBottom: '1px solid #eee',
    paddingBottom: 16,
  },
  title: {
    margin: 0,
    fontSize: 24,
  },
  subtitle: {
    margin: '8px 0 0',
    color: '#666',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chat: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: 16,
  },
  message: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  userMessage: {
    backgroundColor: '#e3f2fd',
    marginLeft: 40,
  },
  assistantMessage: {
    backgroundColor: '#f5f5f5',
    marginRight: 40,
  },
  messageRole: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#666',
    marginBottom: 4,
  },
  messageContent: {
    lineHeight: 1.6,
  },
  inputForm: {
    display: 'flex',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    fontSize: 16,
    border: '1px solid #ddd',
    borderRadius: 6,
    outline: 'none',
  },
  button: {
    padding: '10px 20px',
    fontSize: 16,
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
}
