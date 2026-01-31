/**
 * Minimal footnotes display component for streaming chat interfaces.
 * Collects and renders footnotes at the bottom of content.
 */

import type { MouseEvent, ReactNode } from 'react'

export interface FootnoteEntry {
  id: string
  number: number
  title?: string
  content: ReactNode
}

export interface FootnotesProps {
  /** Array of footnote entries to display */
  footnotes: FootnoteEntry[]
  /** Additional class name */
  className?: string
}

/**
 * Renders collected footnotes as a numbered list.
 * 
 * @example
 * const [footnotes, setFootnotes] = useState<FootnoteEntry[]>([])
 * 
 * // When a footnote link is clicked, add to list
 * const addFootnote = (section: Section) => {
 *   if (footnotes.some(f => f.id === section.id)) return
 *   setFootnotes(prev => [...prev, {
 *     id: section.id,
 *     number: prev.length + 1,
 *     title: section.title,
 *     content: <Markdown>{section.content}</Markdown>
 *   }])
 * }
 * 
 * <Footnotes footnotes={footnotes} />
 */
export function Footnotes({ footnotes, className = '' }: FootnotesProps) {
  if (footnotes.length === 0) return null

  return (
    <section className={`weave-footnotes ${className}`}>
      <hr className="weave-footnotes-separator" />
      <ol className="weave-footnotes-list">
        {footnotes.map((fn) => (
          <li 
            key={fn.id} 
            id={`fn-${fn.id}`} 
            className="weave-footnote"
          >
            <span className="weave-footnote-marker">
              <a href={`#fnref-${fn.id}`} className="weave-footnote-backref">
                [{fn.number}]
              </a>
            </span>
            <div className="weave-footnote-content">
              {fn.title && <strong className="weave-footnote-title">{fn.title}</strong>}
              {fn.content}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export interface FootnoteRefProps {
  /** Unique footnote ID (used for linking) */
  id: string
  /** Footnote number (displayed to user) */
  number: number
  /** Link text (optional, renders before superscript) */
  text?: string
  /** Called when ref is clicked */
  onClick?: () => void
  /** Additional class name */
  className?: string
}

/**
 * Inline footnote reference (superscript number).
 * 
 * @example
 * <FootnoteRef id="msg-0-1" number={1} text="see details" onClick={() => scrollToFootnote('msg-0-1')} />
 * // Renders: see details[1]
 */
export function FootnoteRef({ id, number, text, onClick, className = '' }: FootnoteRefProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <span className={`weave-footnote-ref-wrapper ${className}`}>
      {text && <span className="weave-footnote-ref-text">{text}</span>}
      <sup className="weave-footnote-ref">
        <a 
          href={`#fn-${id}`} 
          id={`fnref-${id}`}
          onClick={handleClick}
        >
          [{number}]
        </a>
      </sup>
    </span>
  )
}
