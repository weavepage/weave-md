# @weave-md/basic

CLI and exporter for Weave Markdown.

## Installation

```bash
npm install @weave-md/basic
```

## CLI

```bash
weave-md-basic validate              # Check for errors
weave-md-basic validate --strict     # Exit 1 on errors
weave-md-basic validate --json       # JSON output

weave-md-basic export html           # Export to HTML
weave-md-basic export html --out=./build
weave-md-basic export ast            # Export to JSON AST

weave-md-basic help
```

## Programmatic Usage

```typescript
import { loadWorkspace, exportToStaticHtml, parseToMdast } from '@weave-md/basic';

// Load sections from directory
const { sections, rawContent } = await loadWorkspace('./content');

// Parse to mdast trees
const trees = new Map();
for (const section of sections) {
  const content = rawContent.get(section.id);
  if (content) {
    const { tree } = parseToMdast(content);
    trees.set(section.id, tree);
  }
}

// Export to static HTML
const html = exportToStaticHtml(sections, trees, { title: 'My Document' });
```

## API

### `loadWorkspace(path, options?)`

Load sections from `.md` files with valid frontmatter.

- `options.files` - Load specific files only
- `options.extensions` - File extensions (default: `['.md']`)
- `options.exclude` - Directories to skip (default: `['node_modules', '.git']`)

Returns `{ sections, filePaths, rawContent }`.

### `exportToStaticHtml(sections, trees, options?)`

Generate a complete HTML document with footnotes and overlay support.

- `options.title` - Document title

## Display Modes

- **footnote** (default) - Numbered references at bottom
- **overlay** - Hover/click to show modal preview

Other display modes are not supported in static export.

## License

MIT
