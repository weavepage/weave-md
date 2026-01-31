/**
 * Component styles for weave-link
 * Styles for Overlay, Panel, and Footnotes display components.
 */

export const componentStyles = `
/* Overlay component - bigfoot-style positioned tooltip */
.weave-overlay {
  position: fixed;
  z-index: 10000;
  box-sizing: border-box;
  max-width: min(22rem, calc(100vw - 20px));
  background: var(--weave-overlay-bg, #fafafa);
  border-radius: 0.5em;
  border: 1px solid var(--weave-overlay-border, #c3c3c3);
  box-shadow: var(--weave-overlay-shadow, 0px 0px 8px rgba(0, 0, 0, 0.3));
  opacity: 0;
  pointer-events: none;
}

.weave-overlay--visible {
  opacity: 0.97;
  pointer-events: auto;
}

.weave-overlay-content {
  padding: 0.6em 0.8em;
  line-height: 1.5;
  font-size: 0.95em;
  color: var(--weave-text-color, inherit);
  max-height: 15em;
  overflow: auto;
}

.weave-overlay-content p {
  margin: 0;
}

.weave-overlay-content p + p {
  margin-top: 0.5em;
}

/* Arrow - positioned via JS */
.weave-overlay-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  transform: translateX(-50%);
  pointer-events: none;
}

.weave-overlay--below .weave-overlay-arrow {
  top: -10px;
  border-bottom: 10px solid var(--weave-overlay-border, #c3c3c3);
}

.weave-overlay--below .weave-overlay-arrow::after {
  content: '';
  position: absolute;
  top: 2px;
  left: -9px;
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-bottom: 9px solid var(--weave-overlay-bg, #fafafa);
}

.weave-overlay--above .weave-overlay-arrow {
  bottom: -10px;
  border-top: 10px solid var(--weave-overlay-border, #c3c3c3);
}

.weave-overlay--above .weave-overlay-arrow::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: -9px;
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-top: 9px solid var(--weave-overlay-bg, #fafafa);
}

/* Panel component */
.weave-panel-backdrop {
  position: fixed;
  inset: 0;
  background: var(--weave-backdrop-bg, rgba(0, 0, 0, 0.3));
  z-index: 999;
}

.weave-panel {
  position: fixed;
  top: 0;
  bottom: 0;
  width: min(400px, 80vw);
  background: var(--weave-panel-bg, #fff);
  box-shadow: var(--weave-panel-shadow, -2px 0 10px rgba(0, 0, 0, 0.1));
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.weave-panel--right {
  right: 0;
}

.weave-panel--left {
  left: 0;
  box-shadow: var(--weave-panel-shadow-left, 2px 0 10px rgba(0, 0, 0, 0.1));
}

.weave-panel-close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  line-height: 1;
  color: var(--weave-panel-close-color, #666);
  border-radius: 3px;
  z-index: 1;
}

.weave-panel-close:hover {
  color: var(--weave-panel-close-hover, #333);
  background: var(--weave-button-hover-bg, rgba(0, 0, 0, 0.1));
}

.weave-panel--left .weave-panel-close {
  right: auto;
  left: 0.5rem;
}

.weave-panel-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--weave-panel-border, #eee);
  min-height: 3rem;
}

.weave-panel-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--weave-text-color, inherit);
  padding-right: 2rem;
}

.weave-panel-content {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
  color: var(--weave-text-color, inherit);
}

/* Footnotes component */
.weave-footnotes {
  margin-top: 2rem;
  font-size: 0.9em;
  color: var(--weave-footnote-color, #666);
}

.weave-footnotes-separator {
  border: none;
  border-top: 1px solid var(--weave-footnote-border, #ddd);
  margin: 1rem 0;
}

.weave-footnotes-list {
  padding-left: 0;
  list-style: none;
}

.weave-footnote {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.weave-footnote-marker {
  flex-shrink: 0;
}

.weave-footnote-backref {
  text-decoration: none;
  color: var(--weave-link-color, #0066cc);
}

.weave-footnote-content {
  flex: 1;
}

.weave-footnote-title {
  display: block;
  margin-bottom: 0.25rem;
}

.weave-footnote-ref {
  font-size: 0.8em;
  vertical-align: super;
}

.weave-footnote-ref a {
  color: var(--weave-link-color, #0066cc);
  text-decoration: none;
}

.weave-footnote-ref a:hover {
  text-decoration: underline;
}
`.trim()
