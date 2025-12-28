/**
 * Basic HTML/JS/CSS template for static export with footnote and overlay support
 */

export const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" crossorigin="anonymous">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 2rem 1rem;
    }

    .weave-document {
      max-width: 42rem;
      margin: 0 auto;
      position: relative;
    }

    .weave-section {
      margin-bottom: 3rem;
    }

    .weave-section h2 {
      margin-bottom: 1rem;
      font-size: 1.75rem;
      font-weight: 600;
    }

    p {
      margin-bottom: 1rem;
    }

    /* Node links */
    .weave-node-link {
      color: #0066cc;
      text-decoration: none;
      border-bottom: 1px solid #0066cc;
      cursor: pointer;
      position: relative;
    }

    .weave-node-link:hover {
      background: #f0f7ff;
    }

    /* Overlay anchor icon (for empty text links) */
    .weave-overlay-anchor {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.25em;
      height: 1.25em;
      border-radius: 50%;
      background: #0066cc;
      color: white;
      font-size: 0.75em;
      font-weight: 600;
      cursor: pointer;
      vertical-align: middle;
      margin: 0 0.15em;
    }

    .weave-overlay-anchor:hover {
      background: #0052a3;
    }

    /* Inline expandable content */
    .weave-inline-trigger {
      color: #0066cc;
      text-decoration: none;
      border-bottom: 1px solid #0066cc;
      cursor: pointer;
    }

    .weave-inline-trigger:hover {
      background: #f0f7ff;
    }

    .weave-inline-trigger.expanded {
      font-weight: 600;
    }

    .weave-inline-content {
      display: block;
      margin: 1rem 0;
      padding: 1rem;
      background: #f8f9fa;
      border-left: 3px solid #0066cc;
      border-radius: 4px;
    }

    .weave-inline-content.hidden {
      display: none;
    }

    .weave-inline-content p:last-child {
      margin-bottom: 0;
    }

    /* Footnote references */
    .weave-footnote-ref {
      font-size: 0.75em;
      vertical-align: super;
    }

    .weave-footnote-ref a {
      color: #0066cc;
      text-decoration: none;
    }

    .weave-footnote-ref a:hover {
      background: #f0f7ff;
    }

    /* Footnotes section */
    .weave-footnotes-separator {
      margin: 3rem 0 2rem;
      border: none;
      border-top: 1px solid #ddd;
    }

    .weave-footnotes {
      font-size: 0.9em;
      color: #666;
    }

    .weave-footnotes-list {
      list-style: none;
      padding: 0;
    }

    .weave-footnote {
      margin-bottom: 1rem;
      padding-left: 2em;
      position: relative;
    }

    .weave-footnote::before {
      content: attr(data-num);
      position: absolute;
      left: 0;
      font-weight: 600;
    }

    .weave-footnote-backref {
      margin-left: 0.5em;
      text-decoration: none;
      color: #0066cc;
    }

    /* Overlay */
    .weave-overlay {
      display: none;
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1rem;
      max-width: 24rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      margin-top: 0.5rem;
    }

    .weave-overlay.active {
      display: block;
    }

    .weave-overlay-content {
      position: relative;
    }

    .weave-overlay-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;
    }

    .weave-overlay-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .weave-overlay-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .weave-overlay-close:hover {
      background: #f0f0f0;
      color: #333;
    }

    .weave-overlay-body {
      line-height: 1.6;
    }

    /* Math blocks */
    .weave-math-block {
      margin: 1.5rem 0;
      overflow-x: auto;
    }

    /* Media */
    .weave-media {
      margin: 1.5rem auto;
      text-align: center;
    }

    .weave-media img,
    .weave-media video {
      max-width: 100%;
      width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }

    .weave-media video {
      background: #000;
    }

    .weave-media figcaption {
      margin-top: 0.5rem;
      font-size: 0.9em;
      color: #666;
      font-style: italic;
    }

    /* Code blocks */
    pre {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      margin: 1rem 0;
    }

    code {
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 0.9em;
    }

    /* Mobile */
    @media (max-width: 640px) {
      body {
        padding: 1rem 0.75rem;
      }

      .weave-overlay {
        padding: 1rem;
      }

      .weave-overlay-content {
        padding: 1.5rem;
        margin: 1rem auto;
      }
    }
  </style>
</head>
<body>
  <main class="weave-document">
    {{CONTENT}}
  </main>

  <!-- Overlay container -->
  <div class="weave-overlay" id="weave-overlay">
    <div class="weave-overlay-content">
      <div class="weave-overlay-header">
        <h3 class="weave-overlay-title" id="weave-overlay-title"></h3>
        <button class="weave-overlay-close" id="weave-overlay-close" aria-label="Close">&times;</button>
      </div>
      <div class="weave-overlay-body" id="weave-overlay-body"></div>
    </div>
  </div>

  <script>
    // Section content lookup
    const sections = {{SECTIONS_DATA}};

    // Overlay handling
    const overlay = document.getElementById('weave-overlay');
    const overlayTitle = document.getElementById('weave-overlay-title');
    const overlayBody = document.getElementById('weave-overlay-body');
    const overlayClose = document.getElementById('weave-overlay-close');

    let currentTrigger = null;

    function openOverlay(sectionId, triggerElement) {
      const section = sections[sectionId];
      if (!section) return;

      overlayTitle.textContent = section.title || sectionId;
      overlayBody.innerHTML = section.html;
      overlay.classList.add('active');
      
      // Get the main document container bounds
      const container = document.querySelector('.weave-document');
      const containerRect = container.getBoundingClientRect();
      const rect = triggerElement.getBoundingClientRect();
      const overlayHeight = overlay.offsetHeight;
      const overlayWidth = overlay.offsetWidth;
      
      // Calculate positions relative to container
      const containerScrollTop = container.scrollTop || 0;
      const relativeTop = rect.top - containerRect.top + window.scrollY;
      const relativeLeft = rect.left - containerRect.left;
      
      // Check if there's more space above or below within container
      const spaceBelow = containerRect.bottom - rect.bottom;
      const spaceAbove = rect.top - containerRect.top;
      
      // Position horizontally - center in container, but ensure trigger is within overlay bounds
      const containerWidth = containerRect.width;
      const triggerCenter = relativeLeft + (rect.width / 2);
      
      // Try to center the overlay in the container
      let left = (containerWidth - overlayWidth) / 2;
      
      // Ensure the trigger element is within or near the overlay bounds
      const overlayLeft = left;
      const overlayRight = left + overlayWidth;
      
      // If trigger is to the left of overlay, shift overlay left
      if (triggerCenter < overlayLeft) {
        left = Math.max(0, triggerCenter - 20);
      }
      // If trigger is to the right of overlay, shift overlay right
      else if (triggerCenter > overlayRight) {
        left = Math.min(containerWidth - overlayWidth, triggerCenter - overlayWidth + 20);
      }
      
      // Final bounds check
      left = Math.max(0, Math.min(left, containerWidth - overlayWidth));
      
      overlay.style.left = left + 'px';
      
      // Position vertically (above or below based on space within container)
      if (spaceBelow >= overlayHeight + 10 || spaceBelow > spaceAbove) {
        // Position below
        overlay.style.top = (relativeTop + rect.height + 8) + 'px';
        overlay.style.bottom = 'auto';
      } else {
        // Position above
        overlay.style.top = (relativeTop - overlayHeight - 8) + 'px';
        overlay.style.bottom = 'auto';
      }
      
      currentTrigger = triggerElement;
    }

    function closeOverlay() {
      overlay.classList.remove('active');
      currentTrigger = null;
    }

    // Click handlers
    overlayClose.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOverlay();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closeOverlay();
      }
    });

    // Click to open overlay
    document.addEventListener('click', (e) => {
      const link = e.target.closest('.weave-node-link, .weave-overlay-anchor');
      
      // Close overlay if clicking outside
      if (!link && !e.target.closest('.weave-overlay')) {
        if (overlay.classList.contains('active')) {
          closeOverlay();
        }
        return;
      }
      
      if (!link) return;

      const display = link.dataset.display;
      const nodeId = link.dataset.nodeId;

      if (display === 'overlay' && nodeId) {
        e.preventDefault();
        
        // Toggle overlay if clicking same trigger
        if (overlay.classList.contains('active') && currentTrigger === link) {
          closeOverlay();
        } else {
          openOverlay(nodeId, link);
        }
      }
    });

    // Inline expand/collapse handling
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('.weave-inline-trigger');
      if (!trigger) return;

      e.preventDefault();
      
      const inlineId = trigger.dataset.inlineId;
      let content = document.getElementById('weave-inline-' + inlineId);
      
      // If content doesn't exist, create it
      if (!content) {
        const section = sections[inlineId];
        if (!section) return;
        
        content = document.createElement('div');
        content.id = 'weave-inline-' + inlineId;
        content.className = 'weave-inline-content';
        content.innerHTML = section.html;
        content.style.display = 'none';
        
        // Insert after the parent paragraph
        const paragraph = trigger.closest('p');
        if (paragraph && paragraph.parentNode) {
          paragraph.parentNode.insertBefore(content, paragraph.nextSibling);
        }
      }
      
      // Toggle visibility
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'block' : 'none';
      trigger.classList.toggle('expanded', isHidden);
    });
  </script>
</body>
</html>
`;

export function renderTemplate(options: {
  title: string
  content: string
  sectionsData: Record<string, { title?: string; html: string }>
}): string {
  return HTML_TEMPLATE
    .replace('{{TITLE}}', escapeHtml(options.title))
    .replace('{{CONTENT}}', options.content)
    .replace('{{SECTIONS_DATA}}', JSON.stringify(options.sectionsData));
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
