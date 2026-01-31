# @weave-md/weave-link

Lightweight utilities for rendering Weave node links in chat interfaces.

## Why This Exists

Weave's `node:` links parse as standard markdown—but chat interfaces need to *render* them. This package handles that:

```markdown
[see details](node:details?display=overlay)
```

When an LLM generates Weave content in a chat interface, the host app needs to:
1. Parse these `node:` URLs to understand what's being referenced
2. Extract sections from the streamed output (which may contain multiple stacked sections)
3. Render the links appropriately

This package provides zero-dependency utilities to do exactly that.

React is an optional peer dependency (only needed for the React component).

## How It Differs from `@weave-md/parse`

| | @weave-md/weave-link | @weave-md/parse |
|---|---|---|
| **Purpose** | Chat interface embedding | Full Weave tooling |
| **Input** | Single stream with stacked sections | One file per section |
| **Output** | `{ id, title, content }[]` | Full AST with positions, diagnostics |
| **Validation** | None (trusts LLM output) | Strict (errors on missing id, duplicates) |
| **Dependencies** | Zero | unified, remark, micromark, etc. |

This package provides a lightweight alternative that supports stacked sections in a single stream—ideal for LLM output.

## Installation

```bash
npm install @weave-md/weave-link
```

## Usage

### Parse Node URLs

```ts
import { parseNodeUrl } from '@weave-md/weave-link'

const parsed = parseNodeUrl('node:intro?display=overlay')
// { id: 'intro', display: 'overlay' }

// Returns null for non-node URLs
parseNodeUrl('https://example.com') // null
```

### Extract Sections from LLM Output

```ts
import { splitSections } from '@weave-md/weave-link'

const markdown = `
---
id: intro
title: Introduction
---

This is the intro. See [details](node:details).

---
id: details
title: Details
---

Here are the details.
`

const sections = splitSections(markdown)
// [
//   { id: 'intro', title: 'Introduction', content: 'This is the intro...' },
//   { id: 'details', title: 'Details', content: 'Here are the details.' }
// ]
```

The `content` field contains the raw markdown body with frontmatter stripped.

**Streaming behavior:** When called on incomplete streamed content:
- Returns all complete sections found so far
- The last section's `content` may be incomplete (still being streamed)
- Re-call `splitSections()` as more content arrives

**Graceful degradation:** Node links render immediately as styled text, even before their target section exists. Once the target section is parsed, the link becomes interactive (clickable, shows preview, etc.).

### React Integration (ChatGPT)

```tsx
import { parseNodeUrl, WeaveLink, createDisplayConfig } from '@weave-md/weave-link/react'
import ReactMarkdown from 'react-markdown'

// Configure display fallbacks for narrow viewports
const displayConfig = createDisplayConfig({
  supported: ['inline', 'overlay', 'footnote'],
  fallbacks: {
    sidenote: 'footnote',
    margin: 'footnote',
    panel: 'overlay',
    stretch: 'overlay',
  }
})

function ChatMessage({ content, sections }) {
  return (
    <ReactMarkdown
      components={{
        a: ({ href, children }) => {
          const parsed = parseNodeUrl(href)
          if (parsed) {
            return (
              <WeaveLink
                {...parsed}
                resolveSection={(id) => sections.find(s => s.id === id)}
                displayConfig={displayConfig}
                onClick={(id, display) => handleNodeClick(id, display)}
              >
                {children}
              </WeaveLink>
            )
          }
          return <a href={href}>{children}</a>
        }
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
```

Or render your own way:

```tsx
a: ({ href, children }) => {
  const parsed = parseNodeUrl(href)
  if (parsed) {
    return <span className="weave-link" data-target={parsed.id}>{children}</span>
  }
  return <a href={href}>{children}</a>
}
```

### markdown-it Integration (Cursor)

```ts
import MarkdownIt from 'markdown-it'
import { weaveLinkPlugin } from '@weave-md/weave-link/markdown-it'

const md = new MarkdownIt()
md.use(weaveLinkPlugin)

md.render('[see intro](node:intro?display=overlay)')
// <span class="weave-link" data-target="intro" data-display="overlay">see intro</span>
```

## API Reference

### `parseNodeUrl(href: string): ParsedNodeUrl | null`

Parses a `node:` URL and extracts its components.

```ts
interface ParsedNodeUrl {
  id: string
  display?: 'inline' | 'overlay' | 'footnote' | 'sidenote' | 'margin' | 'stretch' | 'panel'
  export?: 'appendix' | 'inline' | 'omit'
}
```

Returns `null` if the URL doesn't start with `node:`.

### `splitSections(markdown: string): Section[]`

Extracts sections from markdown with stacked frontmatter.

```ts
interface Section {
  id: string
  title?: string
  peek?: string
  content: string  // Raw markdown body (frontmatter stripped)
}
```

**Heuristic:** A new section starts when `---` appears after a blank line, followed by a line starting with `id:`.

### `createDisplayConfig(options): DisplayConfig`

Configures which display types are supported and their fallbacks.

```ts
type DisplayType = 'inline' | 'overlay' | 'footnote' | 'sidenote' | 'margin' | 'stretch' | 'panel'

interface DisplayConfigOptions {
  // Which display types this environment supports
  supported?: DisplayType[]
  // Fallback for each unsupported type (defaults to 'overlay')
  fallbacks?: Partial<Record<DisplayType, DisplayType>>
}

// Returns resolved display type given the requested type
interface DisplayConfig {
  resolve: (requested: DisplayType | undefined) => DisplayType
}
```

**Example: Narrow viewport config**

```ts
import { createDisplayConfig } from '@weave-md/weave-link'

const narrowConfig = createDisplayConfig({
  supported: ['inline', 'overlay', 'footnote'],
  fallbacks: {
    sidenote: 'footnote',  // sidenote → footnote
    margin: 'footnote',    // margin → footnote  
    panel: 'overlay',      // panel → overlay
    stretch: 'overlay',    // stretch → overlay
  }
})

narrowConfig.resolve('sidenote')  // → 'footnote'
narrowConfig.resolve('overlay')   // → 'overlay'
narrowConfig.resolve(undefined)   // → 'inline' (default)
```

**Example: Wide viewport config**

```ts
const wideConfig = createDisplayConfig({
  supported: ['inline', 'overlay', 'footnote', 'sidenote', 'margin', 'panel'],
  fallbacks: {
    stretch: 'panel',  // stretch not supported, use panel
  }
})
```

**Example: Responsive config with React**

```tsx
function useDisplayConfig() {
  const isNarrow = useMediaQuery('(max-width: 768px)')
  
  return useMemo(() => createDisplayConfig(
    isNarrow
      ? { supported: ['inline', 'overlay', 'footnote'], fallbacks: { sidenote: 'footnote', margin: 'footnote', panel: 'overlay' } }
      : { supported: ['inline', 'overlay', 'footnote', 'sidenote', 'margin', 'panel'] }
  ), [isNarrow])
}
```

### `WeaveLink` (React component)

```tsx
interface WeaveLinkProps {
  id: string
  display?: string
  children: ReactNode
  resolveSection?: (id: string) => { title?: string; peek?: string } | null
  displayConfig?: DisplayConfig  // Resolves display type with fallbacks
  onClick?: (id: string, display: DisplayType) => void  // Only fires when resolved
}
```

The component automatically determines resolved state from `resolveSection`:
- If `resolveSection` returns a section object → resolved, interactive
- If `resolveSection` returns `null` or is not provided → pending, non-interactive

When `displayConfig` is provided, the effective display type is resolved before rendering and passed to `onClick`.

### `weaveLinkPlugin` (markdown-it plugin)

Transforms `node:` links into styled spans with data attributes.

### Display Components

Minimal React components for rendering node link content:

```tsx
import { 
  Overlay, 
  Panel, 
  Footnotes, 
  FootnoteRef, 
  InlineExpand 
} from '@weave-md/weave-link/react'
```

#### `Overlay`

Floating modal panel for content.

```tsx
const triggerRef = useRef<HTMLSpanElement>(null)

<Overlay open={isOpen} onClose={() => setOpen(false)} triggerRef={triggerRef}>
  <Markdown>{section.content}</Markdown>
</Overlay>
```

#### `Panel`

Slide-in side panel (like VS Code peek).

```tsx
<Panel open={isOpen} onClose={() => setOpen(false)} title="Details" position="right">
  <Markdown>{section.content}</Markdown>
</Panel>
```

#### `Footnotes` & `FootnoteRef`

Collected footnotes at bottom with inline references.

```tsx
// Inline reference
<FootnoteRef id="intro" number={1} text="see details" onClick={() => scrollTo('#fn-intro')} />

// Footnotes section
<Footnotes footnotes={[
  { id: 'intro', number: 1, title: 'Introduction', content: <Markdown>...</Markdown> }
]} />
```

#### `InlineExpand`

Expandable inline content.

```tsx
<InlineExpand 
  expanded={isExpanded} 
  onToggle={() => setExpanded(!isExpanded)}
  trigger="See more"
>
  <Markdown>{section.content}</Markdown>
</InlineExpand>
```

These are **minimal implementations** for chat interfaces.

## Component Behavior

In chat contexts, node links can't navigate to a separate page. The components:

1. Render as **styled inline elements** (not hyperlinks)
2. Display the link text with optional visual indicator
3. Include `data-target` and `data-display` attributes for custom handling
4. Accept an optional `resolveSection` callback for apps that can show previews

**Streaming-safe rendering:** During streaming, node links may reference sections that don't exist yet. The component renders gracefully in both states:
- **Before section exists:** Renders as styled text (non-interactive, no click handler)
- **After section exists:** Becomes interactive (clickable, shows preview on hover, etc.)

This prevents broken UI during streaming while enabling full interactivity once content is complete.

The host app controls what happens on click (show overlay, scroll to section, etc.).

## Styling & Theming

### Quick Start

For simple use cases, import the static CSS:

```ts
import '@weave-md/weave-link/styles.css'
```

### Programmatic Theming (Mermaid-style)

For full control, use the theming API similar to Mermaid's approach:

```ts
import { getStyles, injectStyles } from '@weave-md/weave-link/react'

// Inject styles into document head
injectStyles({
  theme: 'default',  // 'default' | 'dark' | 'none'
  themeVariables: {
    linkColor: '#ff6600',
    linkHoverBg: 'rgba(255, 102, 0, 0.1)',
  },
  themeCSS: '.weave-link { font-weight: 500; }'
})
```

Or get the CSS string to inject yourself:

```ts
const css = getStyles({
  themeVariables: { linkColor: '#ff6600' }
})
// Insert into <style> tag, Shadow DOM, etc.
```

### Theme Variables

```ts
interface ThemeVariables {
  linkColor?: string        // Link text color
  linkHoverColor?: string   // Link text color on hover
  linkHoverBg?: string      // Background color on hover
  linkFocusColor?: string   // Focus outline color
  linkActiveBg?: string     // Background when active/pressed
  pendingOpacity?: string   // Opacity for unresolved links
  fontFamily?: string       // Font family for link text
}
```

### Predefined Themes

| Theme | Description |
|-------|-------------|
| `default` | Blue links, light backgrounds |
| `dark` | Light blue links, dark-friendly backgrounds |
| `none` | No base styles, only CSS variables |

### Custom CSS Injection

Append raw CSS after generated styles:

```ts
injectStyles({
  themeCSS: `
    .weave-link[data-display="overlay"]::after {
      content: " 🔗";
    }
  `
})
```

### Scoped Styles (Shadow DOM / Isolation)

```ts
import { getScopedStyles } from '@weave-md/weave-link/react'

const css = getScopedStyles('.my-chat-container', {
  themeVariables: { linkColor: '#ff6600' }
})
// Generates: .my-chat-container .weave-link { ... }
```

### Data Attributes

The components use the class `weave-link` with data attributes:
- `data-target` — The target section ID
- `data-display` — The display mode (if specified)
- `data-resolved` — Whether the target section exists (`"true"` or `"false"`)

### Manual CSS Example

If you prefer writing your own CSS:

```css
.weave-link {
  color: var(--weave-link-color, #0066cc);
  text-decoration: underline;
  text-decoration-style: dotted;
}

.weave-link[data-resolved="true"] {
  cursor: pointer;
}

.weave-link[data-resolved="true"]:hover {
  background-color: var(--weave-link-hover-bg, rgba(0, 102, 204, 0.1));
}

.weave-link[data-resolved="false"] {
  cursor: default;
  opacity: var(--weave-link-pending-opacity, 0.7);
}
```

## Guidance for LLM Prompting

**Important:** This package adapts Weave content for constrained environments—it should NOT influence how LLMs write Weave.

LLMs should write full Weave format using any display type that makes semantic sense:

```markdown
[see details](node:details?display=sidenote)  <!-- Use sidenote if it fits the content -->
```

The host app then adapts via `displayConfig`:
- Wide viewport: renders as sidenote
- Narrow viewport: falls back to footnote

### Recommended System Prompt Snippet

Include this (or similar) when prompting LLMs to generate node links:

```
When writing node links, use any display type that fits the content semantically:
- inline, overlay, sidenote, margin, panel, footnote, stretch
- The host environment will adapt display types as needed for its viewport
- Do not self-limit to what you think the chat interface supports
```

This ensures LLMs write semantically appropriate node links while hosts handle runtime adaptation.

> **Note:** For guidance on the full Weave format (`:math[...]`, media blocks, etc.), see the main Weave documentation. This package only handles node links.

---

## Weave Format Features (Not Included)

This package only handles node links. Other Weave format features are separate:

| Feature | Solution |
|---------|----------|
| `:math[...]` | Use `remark-math-inline` |
| `:sub[A]{B}` | Use `remark-substitute` |
| ` ```math ` blocks | Handle in your code component |
| Media blocks | Handle in your code component |
| GFM | Use `remark-gfm` |

**Recommended:** Add `remark-math-inline` and `remark-substitute` to your markdown pipeline so LLMs can stream full Weave syntax without the parser getting confused by unfamiliar constructs.

## License

MIT
