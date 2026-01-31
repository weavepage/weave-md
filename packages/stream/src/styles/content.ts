/**
 * Content styles for weave-link
 * Styles for node link triggers and inline expanded content in body text.
 */

export const contentStyles = `
/* Node link triggers */
.weave-link {
  color: var(--weave-link-color, #0066cc);
  font-family: var(--weave-link-font-family, inherit);
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
  cursor: default;
  border-radius: 2px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.weave-link--pending {
  opacity: var(--weave-link-pending-opacity, 0.7);
  cursor: default;
}

.weave-link--resolved {
  cursor: pointer;
  text-decoration-style: dotted;
}

.weave-link--resolved:hover {
  color: var(--weave-link-hover-color, var(--weave-link-color, #0066cc));
  background-color: var(--weave-link-hover-bg, rgba(0, 102, 204, 0.1));
}

.weave-link--resolved:focus {
  outline: 2px solid var(--weave-link-focus-color, #0066cc);
  outline-offset: 1px;
}

.weave-link--resolved:active {
  background-color: var(--weave-link-active-bg, rgba(0, 102, 204, 0.2));
}

/* Footnote/sidenote indicators */
.weave-link[data-display="footnote"]::after,
.weave-link[data-display="sidenote"]::after {
  content: " *";
  font-size: 0.75em;
  opacity: 0.6;
}

/* Inline trigger (same styling as .weave-link) */
.weave-inline-trigger {
  color: var(--weave-link-color, #0066cc);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
}

.weave-inline-trigger:hover {
  background-color: var(--weave-link-hover-bg, rgba(0, 102, 204, 0.1));
}

/* Inline expanded content */
.weave-inline-content {
  display: block;
  margin: 0.5em 0 0.5em 0;
  padding: 0.5em 0.75em;
  border-left: 2px solid var(--weave-inline-border, #0066cc);
  background: var(--weave-inline-bg, #f9f9f9);
}

.weave-inline-content p {
  margin: 0.5em 0;
}

.weave-inline-content p:first-child {
  margin-top: 0;
}

.weave-inline-content p:last-child {
  margin-bottom: 0;
}

.weave-inline-content ul,
.weave-inline-content ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.weave-inline-content li {
  margin: 0.25em 0;
}
`.trim()
