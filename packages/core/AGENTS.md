# Weave Markdown Syntax

Syntax reference for writing Weave Markdown content.

## Base: CommonMark

All [CommonMark](https://commonmark.org/) syntax is valid: headings, paragraphs, emphasis, links, images, blockquotes, lists, code, thematic breaks.

## From GFM

Tables, strikethrough (`~~text~~`), autolinks, and task lists are supported.

## Weave Extensions

### Section Frontmatter

Every section must begin with YAML frontmatter containing a unique `id` (must be unique across document/workspace, use kebab-case):

```markdown
---
id: unique-kebab-case-id
title: Optional Title
peek: Optional preview text
---

Content here.
```

### Node Links

Reference other sections with the `node:` URL scheme:

```markdown
[link text](node:section-id)
[link text](node:section-id?display=inline)
[ ](node:section-id?display=footnote)
```

`[ ]` (space) is anchor-only syntax — the renderer supplies the affordance.

**Display modes:** `footnote`, `sidenote`, `margin`, `overlay`, `inline`, `stretch`, `panel`

**Export hints:** `export=appendix`, `export=inline`, `export=omit`

### Math

Inline: `:math[E = mc^2]`

Block:
````markdown
```math
\int_0^\infty e^{-x^2} dx
```
````

### Inline Substitution

Use `:sub[INITIAL]{REPLACEMENT}` to define inline content that is replaced on activation.

```markdown
The :sub[TL;DR]{full explanation} summarizes the point.
```

### Preformatted Text

````markdown
```pre
Preserves exact whitespace.
```
````

### Media Blocks

All use fenced code blocks with YAML. Required field is `file:` (or `url:` for embed, `files:` for gallery).

````markdown
```image
file: https://example.com/photo.jpg
alt: Description
caption: Optional caption
width: normal
```

```gallery
files:
  - https://example.com/image1.jpg
  - https://example.com/image2.jpg
```

```audio
file: https://example.com/audio.mp3
```

```video
file: https://example.com/video.mp4
poster: https://example.com/poster.jpg
```

```embed
url: https://example.com/widget
```
````
