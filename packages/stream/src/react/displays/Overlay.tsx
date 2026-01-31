/**
 * Minimal overlay component - bigfoot-style positioned tooltip.
 * Positioning logic matches basic renderer's vanilla JS approach.
 */

import { useRef, useEffect, type ReactNode, type RefObject } from 'react'

export interface OverlayProps {
  /** Whether the overlay is visible */
  open: boolean
  /** Called when overlay should close */
  onClose: () => void
  /** Reference to the trigger element for positioning */
  triggerRef: RefObject<HTMLElement | null>
  /** Content to display */
  children: ReactNode
  /** Additional class name */
  className?: string
}

/**
 * Positioned tooltip overlay that appears near the trigger.
 */
export function Overlay({ open, onClose, triggerRef, children, className = '' }: OverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)

  // Position overlay and handle click-outside - all in one effect like vanilla JS
  useEffect(() => {
    if (!open) return

    const overlay = overlayRef.current
    const arrow = arrowRef.current
    const trigger = triggerRef.current
    if (!overlay || !arrow || !trigger) return

    // Position function - same logic as basic renderer
    function position() {
      const rects = trigger!.getClientRects()
      const rect = rects.length > 0 ? rects[rects.length - 1] : trigger!.getBoundingClientRect()
      
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const overlayHeight = overlay!.offsetHeight
      const overlayWidth = overlay!.offsetWidth
      
      const triggerCenterX = rect.left + (rect.width / 2)
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      const showBelow = spaceBelow >= overlayHeight + 15 || spaceBelow > spaceAbove
      
      // Horizontal positioning
      const arrowMinEdge = 15
      const padding = 8
      let left = triggerCenterX - (overlayWidth / 2)
      left = Math.max(triggerCenterX - (overlayWidth - arrowMinEdge), Math.min(triggerCenterX - arrowMinEdge, left))
      if (left + overlayWidth > viewportWidth - padding) left = viewportWidth - padding - overlayWidth
      if (left < padding) left = padding
      
      overlay!.style.left = left + 'px'
      overlay!.style.top = showBelow ? (rect.bottom + 10) + 'px' : (rect.top - overlayHeight - 10) + 'px'
      
      // Arrow
      const arrowLeft = triggerCenterX - left
      arrow!.style.left = arrowLeft + 'px'
      
      // Position class
      overlay!.classList.remove('weave-overlay--above', 'weave-overlay--below')
      overlay!.classList.add(showBelow ? 'weave-overlay--below' : 'weave-overlay--above')
    }

    // Initial position
    requestAnimationFrame(() => {
      position()
      overlay.classList.add('weave-overlay--visible')
    })

    // Reposition on scroll/resize (RAF to avoid layout thrashing)
    const reposition = () => requestAnimationFrame(position)
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)

    // Click outside to close
    const handleClick = (e: MouseEvent) => {
      if (!trigger.contains(e.target as Node) && !overlay.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)

    // Escape to close
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)

    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose, triggerRef])

  if (!open) return null

  return (
    <div ref={overlayRef} className={`weave-overlay ${className}`} role="tooltip">
      <div className="weave-overlay-content">{children}</div>
      <div ref={arrowRef} className="weave-overlay-arrow" />
    </div>
  )
}
