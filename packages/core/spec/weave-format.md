# Weave Format

Weave Format extends CommonMark with rich content capabilities for writing.

## Extension Categories

Extensions are organized into three categories based on their syntax:

### 1. GFM Features
Standard GitHub Flavored Markdown extensions for enhanced text formatting:
- Strikethrough, tables, autolink literals, task lists

### 2. Directives
Inline constructs using `:name[...]` syntax:
- `:math[...]` — Inline LaTeX expressions
- `:sub[...]{...}` — Expandable inline substitution

### 3. Fenced Blocks
Block-level constructs using fenced code block syntax with optional YAML configuration:
- `math` — Block LaTeX expressions
- `pre` — Preformatted text with preserved whitespace
- Media blocks: `image`, `gallery`, `audio`, `video`, `embed`, `voiceover`

## GFM Features

### Strikethrough

Use double tildes for strikethrough text:

```markdown
~~This text is struck through~~
```

**Implementation**: GFM-compatible / markdown-it / remark-gfm

### Tables

Use pipe characters to create tables with optional alignment:

```markdown
| Header 1 | Header 2 | Header 3 |
|----------|:--------:|---------:|
| Left     | Center   | Right    |
| aligned  | aligned  | aligned  |
```

**Implementation**: GFM-compatible / markdown-it / remark-gfm

**Behavior**:
- First row defines headers
- Second row defines column alignment (`:---` left, `:---:` center, `---:` right)
- Subsequent rows contain table data
- Outer pipes are optional

### Autolink Literals

Automatically convert URLs and email addresses to clickable links:

```markdown
Visit https://example.com or email user@example.com
```

**Implementation**: GFM-compatible / markdown-it / remark-gfm

**Behavior**:
- URLs starting with `http://` or `https://` are automatically linked
- Email addresses in the format `user@domain.com` are automatically linked
- No explicit link syntax required

### Task Lists

Create interactive checklists using bracket syntax in list items:

```markdown
- [ ] Unchecked item
- [x] Checked item
- [X] Also checked (uppercase works)
```

**Implementation**: GFM-compatible / markdown-it / remark-gfm

**Behavior**: Renders as semantic checkboxes. Interactivity is implementation-defined.

## Directives

### Inline Math

Use the `:math[...]` syntax for inline mathematical expressions:

```markdown
The formula :math[E = mc^2] shows the relationship.
```

**Note on Syntax Choice**: We use `:math[...]` for inline math rather than the `$...$` syntax common in LaTeX because single dollar signs can conflict with currency notation and other content. The `:math[...]` syntax provides explicit delimiters that integrate cleanly with Markdown parsing.

### Inline Substitution

Use the `:sub[INITIAL]{REPLACEMENT}` syntax for inline substitution:

```markdown
The :sub[TL;DR]{full explanation that appears after activation} summarizes the point.
```

**Behavior**:
- Initially renders `INITIAL`; on activation, replaces the span with `REPLACEMENT`
- After activation, the element is no longer interactive (one-way)
- Nested `:sub` inside `REPLACEMENT` is allowed

**Note (Non-Normative)**: Implementations MAY allow collapsing a revealed `:sub` back to its initial state as a UI convenience.

## Fenced Blocks (Block-Level Constructs)

Fenced blocks use standard Markdown fenced code block syntax with language identifiers and optional YAML frontmatter for configuration.

### Block Math

Use fenced code blocks with `math` language:

````markdown
```math
E = mc^2
```
````

**Note on Syntax Choice**: We use fenced code blocks with `math` language rather than the `$$...$$` delimiters common in LaTeX because `$$` delimiters can be ambiguous in Markdown and don't integrate well with standard Markdown parsers. Fenced code blocks provide clear boundaries and better tooling support.

**Rendering**: KaTeX or MathJax-based renderers recommended

### Preformatted Text

Preserve exact spacing and line breaks using the `pre` language:

````markdown
```pre
Roses are red,
  Violets are blue,
    Spacing matters,
      In poetry too.
```
````

**Behavior**: Whitespace and line breaks are preserved exactly as written.

---

**Media blocks** use YAML structure inside fenced code blocks to specify their properties. Required fields must be present for valid parsing, while optional fields provide additional configuration.

**Unknown Fields**: Implementations MUST preserve unknown YAML fields in media blocks. This allows renderer-specific extensions and custom configuration without breaking conformance. Implementations MAY emit info-level messages for unknown fields.

### Image

Display a single image with optional caption and layout metadata:
````markdown
```image
file: https://example.com/image.jpg
alt: Optional alternative text
caption: Optional caption text
width: normal
```
````

**Image Fields**:
- `file` (required) — Image URL or file reference
- `alt` — Alternative text for accessibility (optional)
- `caption` — Caption displayed with the image (optional)
- `width` — Display width hint (optional). Common values include `normal`, `wide`, `full`, but implementations MAY accept any string value.

**Behavior**:
- Renders as a semantic image block
- If caption is present, it SHOULD be rendered as a caption
- If alt is omitted, implementations MAY emit a warning but MUST still render

### Gallery

Display multiple images as a grouped collection:

````markdown
```gallery
files:
  - https://example.com/image1.jpg
  - https://example.com/image2.jpg
  - https://example.com/image3.jpg
alt: Optional alternative text for the gallery
caption: Optional caption for the gallery
```
````

**Gallery Fields**:
- `files` (required) — List of image URLs or file references (MUST contain at least one entry)
- `alt` — Alternative text describing the gallery as a whole (optional)
- `caption` — Caption displayed with the gallery (optional)

**Behavior**:
- Renders as a grouped visual unit
- Layout (grid, carousel, etc.) is implementation-defined
- If alt is omitted, implementations MAY emit a warning but MUST still render

### Audio

Embed audio files with playback controls:

````markdown
```audio
file: https://example.com/audio.mp3
autoplay: false
controls: true
loop: false
```
````

**Audio Fields**:
- `file` (required) — Audio file URL or file reference
- `autoplay` — Auto-play on load (optional, default: false)
- `controls` — Show playback controls (optional, default: true)
- `loop` — Loop playback (optional, default: false)

### Video

Embed video files with advanced controls:

````markdown
```video
file: https://example.com/video.mp4
poster: https://example.com/poster.jpg
start: 12
autoplay: false
controls: true
loop: false
```
````

**Video Fields**:
- `file` (required) — Video file URL or file reference
- `poster` — Thumbnail image URL (optional)
- `start` — Start time in seconds (optional, default: 0)
- `autoplay` — Auto-play on load (optional, default: false)
- `controls` — Show playback controls (optional, default: true)
- `loop` — Loop playback (optional, default: false)

### Embed

Embed external content (iframes, widgets):

````markdown
```embed
url: https://example.com/widget
```
````

**Embed Fields**:
- `url` (required) — URL of the content to embed

**Behavior**:
- Creates an iframe or appropriate embed container for the URL

### Voiceover

Embed voiceover audio narration:

````markdown
```voiceover
file: https://example.com/voiceover.mp3
```
````

**Voiceover Fields**:
- `file` (required) — Audio file URL or file reference for the voiceover

**Behavior**:
- Embeds pre-recorded voiceover audio narration
