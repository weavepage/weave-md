# Node Links — Full Overview

This document defines a semantic reference mechanism for addressing structured content ("nodes") within Markdown documents. Node links use standard Markdown link syntax with a custom `node:` URL scheme and optional query parameters to control placement, expansion, and export behavior.

This specification extends CommonMark with additional semantics and validation rules.

---

## URL Format

```
node:<id>[?<params>]
```

Where:
- `<id>` is the target node identifier (required)
- `<params>` are optional query parameters

---

## Authoring Forms

### Anchor-only reference
Used when the node is attached to a **position** in the text.

```md
[ ](node:ID?display=...)
```

### Text-linked reference
Used when inline text is the **explicit affordance**.

```md
[Text](node:ID?display=...)
```

---

## Global Principles
- `[ ]` denotes an **anchor-only** reference (no author-supplied affordance).
- `[text]` denotes an **explicit affordance**.
- If interaction is required and `[ ]` is used, the **renderer MUST supply an affordance**.
- Numbering is **semantic and system-assigned**, never authored.
- Renderers MUST NOT render the space in `[ ]`.
- Empty `[]` is not valid CommonMark and MUST NOT be used unless explicitly supported as a parser extension.

---

## 1. Footnote Node

**Numbered reference optionally rendered at the bottom.**

```md
...sentence.[ ](node:fn1?display=footnote)
[This claim](node:fn1?display=footnote)
```

- Always numbered
- Text-linked form appends the number to the text
- Hover/click preview optional

---

## 2. Sidenote Node

**Numbered reference rendered in the margin.**

```md
...sentence.[ ](node:sn1?display=sidenote)
[This claim](node:sn1?display=sidenote)
```

- Always numbered
- Margin placement on desktop
- Click may highlight anchor location
- Mobile fallback: overlay

---

## 3. Margin Note Node

**Unnumbered annotation rendered in the margin.**

```md
...sentence.[ ](node:mn1?display=margin)
[context](node:mn1?display=margin)
```

- Never numbered
- Anchor-only margin notes may render with no inline marker
- Mobile fallback: inline at end of paragraph (unless disabled)

---

## 4. Overlay Node

**Content shown in a floating layer (popover / modal / tooltip).**

```md
[term](node:term?display=overlay)
[ ](node:aside?display=overlay)
```

- Trigger may be hover, click, focus, or tap (renderer-defined and device-appropriate)
- Renderer must supply an affordance for anchor-only references

---

## 5. Inline Node

**In-flow expandable content (single level).**

```md
[Show details](node:details?display=inline)
[ ](node:details?display=inline)
```

- Always collapsible / expandable
- Renderer must supply an affordance for anchor-only references
- Content participates in document flow

---

## 6. Stretch Node

**Nested, expandable explanation blocks (Nicky Case–style).**

```md
[Why?](node:why?display=stretch)
[ ](node:why?display=stretch)
```

- Always expandable / collapsible
- Supports nesting
- Renderer must supply an affordance for anchor-only references
- Mobile UI may vary, semantics unchanged

---

## 7. Page Node

**Node resolved as a full page or section view.**

```md
[Read more](node:topic?display=page)
[ ](node:topic?display=page)
```

- Renderer must supply a navigation affordance for anchor-only references
- May open as:
  - stacked / overlay page (Gwern-style)
  - same tab
  - new tab
- Semantics are “resolve as page,” not “navigate away”

---

## Summary Chart

| Display | Numbered | Anchor-only behavior (`[ ]`) | Primary Placement / Behavior |
|---------|----------|------------------------------|------------------------------|
| footnote | yes | Renderer renders number marker | Bottom/end footnote |
| sidenote | yes | Renderer renders number marker | Margin note (fallback overlay) |
| margin | no | Renderer only creates margin note | Margin note (fallback inline) |
| overlay | no | Renderer supplies trigger | Floating layer |
| inline | no | Renderer supplies expander | In-flow expandable block |
| stretch | no | Renderer supplies expander | Nested expandable block |
| page | no | Renderer supplies navigation | Page / stacked page view |

---

## Export Hints

The `export` parameter in node links provides hints to exporters:

- `appendix` - Prefer appendix placement
- `inline` - Prefer inline expansion
- `omit` - Exclude from export

**Note**: These are hints, not requirements. Exporters MAY ignore them based on context.

---

## Rendering Rules

When a `node:` link is encountered, implementations MUST:

1. Parse the node ID and query parameters
2. Treat the link as a **semantic directive**, not a hyperlink
3. Use the link location as a placement anchor
4. Render referenced content according to `display` and `export` parameters

Renderers MUST NOT emit invisible or empty hyperlinks.

---

## Unknown Parameters

- Implementations SHOULD emit an info-level message for unknown parameters
- Implementations MUST preserve unknown parameters
- Unknown parameters MUST NOT cause parsing failure

---

## Conformance

Implementations MUST:

1. Parse `node:` URLs and extract the node ID
2. Parse standard parameters (`display`, `export`)
3. Apply default behaviors when parameters are omitted
4. Preserve unknown parameters
5. Support `[ ]` as the canonical anchor-only syntax
6. Avoid emitting inaccessible or misleading HTML output

---

## Non-Goals

This specification does not define:

- Hover or interaction behavior (e.g., previews or peeks)
- UI controls, styling, or layout
- Animation or interaction mechanics

These are considered implementation-level concerns.
