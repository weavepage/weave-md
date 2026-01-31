import type { ReactNode, MouseEvent, KeyboardEvent } from 'react'
import type { DisplayType } from '../parseNodeUrl.js'
import type { DisplayConfig } from '../displayConfig.js'

export interface ResolvedSection {
  title?: string
  peek?: string
}

export interface WeaveLinkProps {
  id: string
  display?: DisplayType
  children: ReactNode
  resolveSection?: (id: string) => ResolvedSection | null
  displayConfig?: DisplayConfig
  onClick?: (id: string, display: DisplayType, event?: MouseEvent | KeyboardEvent) => void
  className?: string
}

/**
 * React component for rendering Weave node links.
 * 
 * Renders as a styled inline element with data attributes.
 * When `resolveSection` returns a section, the link becomes interactive.
 * 
 * @example
 * <WeaveLink
 *   id="intro"
 *   display="overlay"
 *   resolveSection={(id) => sections.find(s => s.id === id)}
 *   onClick={(id, display) => handleNodeClick(id, display)}
 * >
 *   See introduction
 * </WeaveLink>
 */
export function WeaveLink({
  id,
  display,
  children,
  resolveSection,
  displayConfig,
  onClick,
  className = ''
}: WeaveLinkProps) {
  const section = resolveSection?.(id) ?? null
  const isResolved = section !== null
  
  const resolvedDisplay = displayConfig 
    ? displayConfig.resolve(display) 
    : (display ?? 'inline')

  const handleClick = (e: MouseEvent) => {
    if (isResolved && onClick) {
      e.preventDefault()
      onClick(id, resolvedDisplay, e)
    }
  }

  const baseClass = 'weave-link'
  const classes = [
    baseClass,
    isResolved ? `${baseClass}--resolved` : `${baseClass}--pending`,
    className
  ].filter(Boolean).join(' ')

  return (
    <span
      className={classes}
      data-target={id}
      data-display={resolvedDisplay}
      data-resolved={isResolved ? 'true' : 'false'}
      onClick={handleClick}
      role={isResolved ? 'button' : undefined}
      tabIndex={isResolved ? 0 : undefined}
      onKeyDown={isResolved ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(id, resolvedDisplay, e)
        }
      } : undefined}
      title={section?.peek ?? section?.title}
    >
      {children}
    </span>
  )
}
