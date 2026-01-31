/**
 * Minimal inline display component for streaming chat interfaces.
 * Expands content inline when triggered.
 */

import type { ReactNode } from 'react'

export interface InlineExpandProps {
  /** Whether the content is expanded */
  expanded: boolean
  /** Called when expand/collapse is toggled */
  onToggle: () => void
  /** Trigger text */
  trigger: ReactNode
  /** Content to show when expanded */
  children: ReactNode
  /** Trailing punctuation to keep with trigger (prevents orphaning after expanded content) */
  trailingPunctuation?: string
  /** Additional class name */
  className?: string
}

/**
 * Inline expandable content for node links.
 * 
 * @example
 * const [expanded, setExpanded] = useState(false)
 * 
 * <InlineExpand
 *   expanded={expanded}
 *   onToggle={() => setExpanded(!expanded)}
 *   trigger="See details"
 * >
 *   <Markdown>{section.content}</Markdown>
 * </InlineExpand>
 */
export function InlineExpand({ 
  expanded, 
  onToggle, 
  trigger, 
  children, 
  trailingPunctuation,
  className = '' 
}: InlineExpandProps) {
  return (
    <>
      <span className={`weave-inline-wrapper ${className}`}>
        <span 
          className={`weave-inline-trigger ${expanded ? 'weave-inline-trigger--expanded' : ''}`}
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onToggle()
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
        >
          {trigger}
        </span>
        {trailingPunctuation}
      </span>
      {expanded && (
        <div className="weave-inline-content">
          {children}
        </div>
      )}
    </>
  )
}
