# @weave-md/parse

AST generation and serialization for Weave Markdown - parse markdown strings to WeaveAst and stringify back to Markdown.

## What It Does

`@weave-md/parse` provides the core parsing functionality for Weave Markdown:

- **Full AST parsing** (micromark + mdast-util) - Generate canonical AST matching `weave-ast.schema.json`
- **Parse-time validation** - Produces diagnostics embedded in AST nodes:
  - Invalid node URLs
  - Invalid YAML in media blocks
  - Missing/invalid frontmatter
  - Unknown frontmatter fields
  - Media config validation (required fields, accessibility warnings)
- **Stringify** (mdast-util-to-markdown) - Round-trip Markdown output

## What It Doesn't Do

This package intentionally does **not**:

- Provide a CLI (use `@weave-md/basic` for that)
- Access the filesystem (string in, AST out)
- Render HTML or other output formats (use `@weave-md/basic` for that)
- Perform document-level validation (use `@weave-md/validate` for that)

## Installation

```bash
npm install @weave-md/parse @weave-md/core
```

## Usage

### Sync vs Async Parsing

This package provides two parsing functions:

- **`parseWeaveDocument(markdown)`** - Fast synchronous parser for simple use cases. Does not support extensions or plugins.
- **`parseWeaveDocumentAsync(markdown, options)`** - Full-featured async parser that supports custom syntax extensions and remark plugins (which may perform async operations).

Use the sync version when you just need to parse standard Weave Markdown. Use the async version when you need custom extensions, plugins, or strict mode.

### Parse to WeaveAst

```typescript
import { parseWeaveDocument } from '@weave-md/parse'

const markdown = `---
id: intro
title: Introduction
---

See [next section](node:next).
`

const ast = parseWeaveDocument(markdown)
console.log(ast.sections) // [{ id: 'intro', title: 'Introduction', body: '...' }]
console.log(ast.links)    // [{ ref: { id: 'next' }, sourceId: 'intro', ... }]
```

### Parse to mdast for Custom Processing

```typescript
import { parseToMdast } from '@weave-md/parse'

const { tree, frontmatter, diagnostics } = parseToMdast(markdown)

// tree is an mdast Root with Weave node types (weaveNodeLink, weaveMathBlock, etc.)
// frontmatter is { id, title?, peek? }
// diagnostics contains any parse-time warnings/errors
```

### Stringify Back to Markdown

```typescript
import { parseToMdast, stringifyWeaveDocument } from '@weave-md/parse'

const { tree, frontmatter } = parseToMdast(markdown)

// Modify the tree...

const output = stringifyWeaveDocument({ tree, frontmatter })
```

### Async Parsing with Extensions

```typescript
import { parseWeaveDocumentAsync } from '@weave-md/parse'

const ast = await parseWeaveDocumentAsync(markdown, {
  extensions: [myCustomExtension],
  plugins: [myRemarkPlugin],
  strict: true // throws on errors
})
```

## Parse-time vs Document-level Validation

`@weave-md/parse` performs **parse-time validation** - checking syntax and structure as it parses:
- Is the frontmatter valid YAML?
- Does it have a required `id` field?
- Are node URLs well-formed?
- Are media block configs valid?

For **document-level validation** (broken references, duplicate IDs across files), use `@weave-md/validate`.

## Dependencies

- `@weave-md/core` - Core types and helpers (peer dependency)
- `micromark` + `mdast-util-from-markdown` - Markdown parsing
- `mdast-util-to-markdown` - Markdown stringification
- Various micromark/mdast extensions for GFM, frontmatter, math

## License

MIT
