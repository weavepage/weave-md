# Demo

This demo shows how to implement display behaviors for Weave node links in a chat interface.

## Running the Demo

```bash
cd packages/weave-link
npm run demo
```

This starts a Vite dev server at http://localhost:3457.

## What's Demonstrated

[`ChatDemo.tsx`](./ChatDemo.tsx) shows:

- **`useWeaveContent` hook** — Section parsing, inline expansion state, overlay/panel state
- **`Overlay`** — Floating tooltip panel
- **`Panel`** — Side drawer for longer content
- **`Footnotes`** — Footnote list (per-message scoping)
- **`splitTrailingPunctuation`** — Keeps punctuation with inline triggers
- **HTML post-processing** — Transforming rendered markdown to add interactivity

## Key Pattern: useWeaveContent + Per-Message Footnotes

The `useWeaveContent` hook handles shared state:

```tsx
const {
  sectionMap,
  expandedInline,
  overlaySection,
  panelSection,
  triggerRef,
  handleNodeClick,
  closeOverlay,
  closePanel,
  displayConfig,
  renderMarkdown,
  getDisplayContent,
} = useWeaveContent({ content: allContent })
```

Footnotes are collected per-message in the demo (so each assistant response has its own `[1], [2]...` numbering):

```tsx
const messageFootnotes = useMemo(() => {
  // Scan each message for footnote links, collect with message-scoped IDs
}, [messages, sectionMap, displayConfig])
```

## Display Type Reference

| Display | Implementation |
|---------|---------------|
| `inline` | Expand content in place |
| `overlay` | `Overlay` — floating tooltip |
| `panel` | `Panel` — side drawer |
| `footnote` | `Footnotes` — superscript refs with list after each message |
| `sidenote` | Falls back to `footnote` |
| `margin` | Falls back to `footnote` |
| `stretch` | Falls back to `inline` |

## Dependencies

```bash
npm install @weave-md/weave-link react markdown-it
```
