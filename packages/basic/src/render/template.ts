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

    h1 {
      font-size: 2.25rem;
      font-weight: 700;
    }

    h2 {
      margin-top: 1.5rem;
      margin-bottom: 1rem;
      font-size: 1.75rem;
      font-weight: 600;
    }

    h3 {
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      font-size: 1.25rem;
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
    .weave-icon {
      width: 1.2em;
      height: 1.2em;
      vertical-align: middle;
    }

    .weave-overlay-anchor,
    .weave-inline-anchor {
      display: inline;
      color: #0066cc;
      cursor: pointer;
    }

    /* Plus/minus toggle for inline anchors */
    .weave-inline-anchor .weave-icon-minus {
      display: none;
    }

    .weave-inline-anchor.expanded .weave-icon-plus {
      display: none;
    }

    .weave-inline-anchor.expanded .weave-icon-minus {
      display: inline;
    }

    .weave-overlay-anchor:hover,
    .weave-inline-anchor:hover {
      color: #0052a3;
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
      background: #e8f4ff;
      border-bottom: 2px solid #0066cc;
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

    /* Text-linked footnote references */
    .weave-footnote-link {
      color: #0066cc;
      text-decoration: none;
    }

    .weave-footnote-link-text {
      border-bottom: 1px solid #0066cc;
    }

    .weave-footnote-link:hover {
      background: #f0f7ff;
    }

    .weave-footnote-link sup {
      font-size: 0.75em;
      margin-left: 0.1em;
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
      display: grid;
      grid-template-columns: 2.5em 1fr;
      margin-bottom: 1rem;
    }

    .weave-footnote-marker {
      text-align: left;
    }

    .weave-footnote-backref {
      text-decoration: none;
      color: #0066cc;
    }

    .weave-footnote-content {
      min-width: 0;
    }

    .weave-footnote-content p:first-child {
      display: inline;
    }

    .weave-footnote-content p + p {
      margin-top: 0.5rem;
    }

    /* Overlay - bigfoot-style tooltip */
    .weave-overlay {
      position: fixed;
      z-index: 10000;
      box-sizing: border-box;
      max-width: min(22rem, calc(100vw - 20px));
      display: inline-block;
      background: #fafafa;
      border-radius: 0.5em;
      border: 1px solid #c3c3c3;
      box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.3);
      opacity: 0;
      transform: scale(0.1) translateZ(0);
      transform-origin: 50% 0;
      transition: opacity 0.25s ease, transform 0.25s ease;
      pointer-events: none;
    }

    .weave-overlay.active {
      opacity: 0.97;
      transform: scale(1) translateZ(0);
      pointer-events: auto;
    }

    .weave-overlay.above {
      transform-origin: 50% 100%;
    }

    /* Tooltip arrow */
    .weave-overlay-tooltip {
      position: absolute;
      width: 0;
      height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
    }

    .weave-overlay.below .weave-overlay-tooltip {
      top: -10px;
      border-bottom: 10px solid #c3c3c3;
    }

    .weave-overlay.below .weave-overlay-tooltip::after {
      content: '';
      position: absolute;
      top: 2px;
      left: -9px;
      border-left: 9px solid transparent;
      border-right: 9px solid transparent;
      border-bottom: 9px solid #fafafa;
    }

    .weave-overlay.above .weave-overlay-tooltip {
      bottom: -10px;
      border-top: 10px solid #c3c3c3;
    }

    .weave-overlay.above .weave-overlay-tooltip::after {
      content: '';
      position: absolute;
      bottom: 2px;
      left: -9px;
      border-left: 9px solid transparent;
      border-right: 9px solid transparent;
      border-top: 9px solid #fafafa;
    }

    .weave-overlay-content {
      position: relative;
    }

    .weave-overlay-main-wrapper {
      max-height: 15em;
      overflow: auto;
    }

    .weave-overlay-body {
      padding: 0.6em 0.8em;
      line-height: 1.5;
      font-size: 0.95em;
      color: #333;
    }

    .weave-overlay-body p {
      margin: 0;
    }

    .weave-overlay-body p + p {
      margin-top: 0.5em;
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
    .weave-media video,
    .weave-media iframe {
      max-width: 100%;
      width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }

    .weave-media video {
      background: #000;
    }

    .weave-media iframe {
      background: #000;
    }

    /* Fallback aspect ratio for embeds without explicit width/height */
    .weave-media iframe:not([width]):not([height]) {
      aspect-ratio: 16 / 9;
    }

    .weave-media figcaption {
      margin-top: 0.5rem;
      font-size: 0.9em;
      color: #666;
      font-style: italic;
    }

    /* Gallery Carousel */
    .weave-gallery {
      position: relative;
      overflow: hidden;
    }

    .weave-gallery figure {
      display: none;
      margin: 0;
    }

    .weave-gallery figure.active {
      display: block;
    }

    .weave-gallery img {
      border-radius: 4px;
    }

    .weave-gallery-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0,0,0,0.5);
      color: white;
      border: none;
      padding: 0.75rem;
      cursor: pointer;
      font-size: 1.25rem;
      border-radius: 4px;
      z-index: 10;
    }

    .weave-gallery-nav:hover {
      background: rgba(0,0,0,0.7);
    }

    .weave-gallery-prev { left: 0.5rem; }
    .weave-gallery-next { right: 0.5rem; }

    .weave-gallery-dots {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .weave-gallery-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ccc;
      border: none;
      cursor: pointer;
      padding: 0;
    }

    .weave-gallery-dot.active {
      background: #0066cc;
    }

    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 0.5rem 0.75rem;
      text-align: left;
    }

    th {
      background: #f5f5f5;
      font-weight: 600;
    }

    tr:nth-child(even) {
      background: #fafafa;
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

    /* Preformatted - preserves spacing, matches paragraph spacing */
    .weave-preformatted {
      white-space: pre-wrap;
      margin-bottom: 1rem;
    }

    /* Mobile */
    @media (max-width: 640px) {
      body {
        padding: 1rem 0.75rem;
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
    <div class="weave-overlay-main-wrapper">
      <div class="weave-overlay-body" id="weave-overlay-body"></div>
    </div>
    <div class="weave-overlay-tooltip" id="weave-overlay-tooltip"></div>
  </div>

  <script>
    // Section content lookup
    const sections = {{SECTIONS_DATA}};

    // Overlay handling
    const overlay = document.getElementById('weave-overlay');
    const overlayBody = document.getElementById('weave-overlay-body');

    let currentTrigger = null;

    const overlayTooltip = document.getElementById('weave-overlay-tooltip');

    function positionOverlay() {
      if (!currentTrigger) return;
      
      // Use getClientRects() to handle wrapped inline elements
      // Pick the last rect (end of link) for better UX
      const rects = currentTrigger.getClientRects();
      const rect = rects.length > 0 ? rects[rects.length - 1] : currentTrigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Use content container bounds instead of viewport for horizontal positioning
      // This keeps overlay within content area, leaving margins free for side notes
      const container = document.querySelector('.weave-document');
      const containerRect = container.getBoundingClientRect();
      
      const overlayHeight = overlay.offsetHeight;
      const overlayWidth = overlay.offsetWidth;
      
      // Trigger center is the anchor - arrow MUST point here
      const triggerCenterX = rect.left + (rect.width / 2);
      
      // Check space above and below
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const showBelow = spaceBelow >= overlayHeight + 15 || spaceBelow > spaceAbove;
      
      const arrowMinEdge = 15; // min distance from arrow center to overlay edge
      const screenEdgePadding = 8; // minimum distance from screen edge for shadow visibility
      
      // Bounds: prefer container, but always keep minimum distance from screen edges
      const boundsLeft = Math.max(screenEdgePadding, containerRect.left);
      const boundsRight = Math.min(window.innerWidth - screenEdgePadding, containerRect.right);
      
      // Position overlay so arrow can reach the trigger
      // Arrow must be at triggerCenterX, and arrow must be within [arrowMinEdge, overlayWidth - arrowMinEdge]
      let leftMin = triggerCenterX - (overlayWidth - arrowMinEdge);
      let leftMax = triggerCenterX - arrowMinEdge;
      
      // Start centered on trigger
      let left = triggerCenterX - (overlayWidth / 2);
      
      // Ensure arrow can reach trigger (clamp to valid range)
      left = Math.max(leftMin, Math.min(leftMax, left));
      
      // Now clamp to container bounds
      // Clamp right first, then left (left takes priority so shadow is visible)
      if (left + overlayWidth > boundsRight) {
        left = boundsRight - overlayWidth;
      }
      if (left < boundsLeft) {
        left = boundsLeft;
      }
      
      overlay.style.left = left + 'px';
      
      // Arrow position = trigger center relative to overlay left edge
      const arrowLeftPx = triggerCenterX - left;
      overlayTooltip.style.left = arrowLeftPx + 'px';
      overlayTooltip.style.transform = 'translateX(-50%)';
      
      // Position vertically
      overlay.classList.remove('above', 'below');
      if (showBelow) {
        overlay.style.top = (rect.bottom + 10) + 'px';
        overlay.classList.add('below');
      } else {
        overlay.style.top = (rect.top - overlayHeight - 10) + 'px';
        overlay.classList.add('above');
      }
    }

    function openOverlay(sectionId, triggerElement) {
      const section = sections[sectionId];
      if (!section) return;

      overlayBody.innerHTML = section.html;
      currentTrigger = triggerElement;
      
      overlay.classList.add('active');
      positionOverlay();
    }

    // Reposition on scroll/resize to keep arrow attached
    window.addEventListener('scroll', () => {
      if (overlay.classList.contains('active')) {
        positionOverlay();
      }
    }, true);
    
    window.addEventListener('resize', () => {
      if (overlay.classList.contains('active')) {
        positionOverlay();
      }
    });

    function closeOverlay() {
      overlay.classList.remove('active');
      currentTrigger = null;
    }

    // Click handlers
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
      const trigger = e.target.closest('.weave-inline-trigger, .weave-inline-anchor');
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

    // Footnote backlink tracking - remember which reference was clicked
    document.addEventListener('click', (e) => {
      const link = e.target.closest('.weave-footnote-ref a, a.weave-footnote-link');
      if (!link) return;
      
      const refId = link.id;
      if (!refId) return;
      
      // Extract footnote number from the href (e.g., #fn-3 -> 3)
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#fn-')) return;
      const fnNum = href.replace('#fn-', '');
      
      // Find the backref link in the footnote and update it
      const backref = document.querySelector('#fn-' + fnNum + ' .weave-footnote-backref');
      if (backref) {
        backref.setAttribute('href', '#' + refId);
      }
      
      // Navigate to the footnote
      e.preventDefault();
      const footnoteId = 'fn-' + fnNum;
      const footnote = document.getElementById(footnoteId);
      if (footnote) {
        footnote.scrollIntoView({ behavior: 'smooth' });
        // Update URL fragment without triggering navigation
        history.pushState(null, '', '#' + footnoteId);
      }
    });

    // Backref click - scroll and clear hash
    document.addEventListener('click', (e) => {
      const backref = e.target.closest('.weave-footnote-backref');
      if (!backref) return;
      
      e.preventDefault();
      const href = backref.getAttribute('href');
      if (!href) return;
      
      const target = document.getElementById(href.replace('#', ''));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        history.pushState(null, '', window.location.pathname + window.location.search);
      }
    });

    // Video start time handling
    document.querySelectorAll('video[data-start]').forEach(video => {
      const startTime = parseFloat(video.dataset.start);
      if (!isNaN(startTime)) {
        video.currentTime = startTime;
        video.addEventListener('loadedmetadata', () => {
          video.currentTime = startTime;
        }, { once: true });
      }
    });

    // Gallery carousel initialization
    document.querySelectorAll('.weave-gallery').forEach(gallery => {
      const figures = gallery.querySelectorAll('figure');
      if (figures.length <= 1) return;
      
      // Set first figure as active
      figures[0].classList.add('active');
      
      // Create navigation buttons
      const prevBtn = document.createElement('button');
      prevBtn.className = 'weave-gallery-nav weave-gallery-prev';
      prevBtn.innerHTML = '&#10094;';
      prevBtn.setAttribute('aria-label', 'Previous');
      
      const nextBtn = document.createElement('button');
      nextBtn.className = 'weave-gallery-nav weave-gallery-next';
      nextBtn.innerHTML = '&#10095;';
      nextBtn.setAttribute('aria-label', 'Next');
      
      gallery.insertBefore(prevBtn, gallery.firstChild);
      gallery.insertBefore(nextBtn, gallery.querySelector('figcaption') || null);
      
      // Create dots
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'weave-gallery-dots';
      figures.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'weave-gallery-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.dataset.index = i;
        dotsContainer.appendChild(dot);
      });
      const caption = gallery.querySelector('figcaption');
      if (caption) {
        gallery.insertBefore(dotsContainer, caption);
      } else {
        gallery.appendChild(dotsContainer);
      }
      
      let current = 0;
      
      const showSlide = (index) => {
        figures.forEach((f, i) => f.classList.toggle('active', i === index));
        dotsContainer.querySelectorAll('.weave-gallery-dot').forEach((d, i) => 
          d.classList.toggle('active', i === index)
        );
        current = index;
      };
      
      prevBtn.addEventListener('click', () => {
        showSlide((current - 1 + figures.length) % figures.length);
      });
      
      nextBtn.addEventListener('click', () => {
        showSlide((current + 1) % figures.length);
      });
      
      dotsContainer.addEventListener('click', (e) => {
        const dot = e.target.closest('.weave-gallery-dot');
        if (dot) showSlide(parseInt(dot.dataset.index));
      });
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
