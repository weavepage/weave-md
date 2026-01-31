/**
 * Minimal panel display component for streaming chat interfaces.
 * Shows content in a slide-in side panel.
 */

import { useEffect, type ReactNode } from 'react'

export interface PanelProps {
  /** Whether the panel is visible */
  open: boolean
  /** Called when panel should close */
  onClose: () => void
  /** Section title */
  title?: string
  /** Content to display */
  children: ReactNode
  /** Panel position */
  position?: 'left' | 'right'
  /** Additional class name */
  className?: string
}

/**
 * Side panel for node link content (like VS Code's peek).
 * 
 * @example
 * const [open, setOpen] = useState(false)
 * const [section, setSection] = useState<Section | null>(null)
 * 
 * <WeaveLink onClick={(id) => { setSection(sections.get(id)); setOpen(true) }}>
 *   See details
 * </WeaveLink>
 * 
 * <Panel open={open} onClose={() => setOpen(false)} title={section?.title}>
 *   <Markdown>{section?.content}</Markdown>
 * </Panel>
 */
export function Panel({ 
  open, 
  onClose, 
  title, 
  children, 
  position = 'right',
  className = '' 
}: PanelProps) {
  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div 
        className="weave-panel-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside 
        className={`weave-panel weave-panel--${position} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'weave-panel-title' : undefined}
      >
        <header className="weave-panel-header">
          {title && <h2 id="weave-panel-title" className="weave-panel-title">{title}</h2>}
          <button 
            className="weave-panel-close" 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="weave-panel-content">
          {children}
        </div>
      </aside>
    </>
  )
}
