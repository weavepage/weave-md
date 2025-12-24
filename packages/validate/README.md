# @weave-md/validate

Format conformance validator for Weave Markdown - lightweight for editor/CI use.

## What It Does

`@weave-md/validate` validates Weave Markdown documents against the format specification:

- **Format conformance** - Validates Weave extended syntax and structure
- **Schema validation** - Checks YAML frontmatter and block content schemas
- **Extended block validation** - Validates Weave code blocks with YAML content:
  - `image` blocks (requires `file`, warns about missing `alt`, validates `width` options)
  - `gallery` blocks (requires `files` array, warns about missing `alt`)
  - `audio` blocks (requires `file`, validates boolean `autoplay`, `controls`, `loop`)
  - `video` blocks (requires `file`, validates `start` number and boolean options)
  - `embed` blocks (requires `url`)
  - `voiceover` blocks (requires `file`)
  - `math` blocks (validates non-empty content)
  - `pre` blocks (warns about empty content)
- **Frontmatter validation** - Validates YAML frontmatter with required `id` field and optional `title`, `peek`
- **Node link extraction** - Extracts `node:` URLs from markdown links and validates URL format
- **Section validation** - Validates section IDs are present, non-empty, and unique across documents
- **Reference validation** - Detects broken references to non-existent section IDs
- **Inline math validation** - Validates `:math[...]` syntax for proper bracket closure and non-empty content
- **Diagnostic formatting** - Outputs errors and warnings in text or JSON format with LSP-compatible positioning

## What It Doesn't Do

This package intentionally does **not**:

- Render HTML or other output formats
- Provide a full Markdown parser
- Include heavy dependencies

It's designed to be fast and lightweight for use in editors and CI pipelines.

## Installation

```bash
npm install @weave-md/validate
```

## CLI Usage

```bash
# Validate a workspace
weave-md-validate ./path/to/content

# Output JSON for CI integration
weave-md-validate ./path/to/content --format json
```

*Note: CLI tool is planned but not yet implemented*

## Programmatic Usage

```typescript
import { 
  parseFrontmatter, 
  extractNodeLinks, 
  validateSections, 
  validateWeaveBlocks,
  validateInlineSyntax,
  validateReferences,
  formatDiagnostics
} from '@weave-md/validate';

const content = `---
id: intro
title: Introduction
---

See [next section](node:next).

\`\`\`image
file: photo.jpg
alt: A photo
width: wide
\`\`\`

:math[ x^2 + y^2 = z^2 ]
`;

// Parse and validate frontmatter
const { frontmatter, body, diagnostics: fmDiagnostics } = parseFrontmatter(content);

// Extract and validate node links
const { links, errors: linkErrors } = extractNodeLinks(body);

// Validate Weave blocks
const blockDiagnostics = validateWeaveBlocks(content);

// Validate inline syntax
const inlineDiagnostics = validateInlineSyntax(content);

// Format all diagnostics
const allDiagnostics = [...fmDiagnostics, ...linkErrors, ...blockDiagnostics, ...inlineDiagnostics];
console.log(formatDiagnostics(allDiagnostics));
```

## Dependencies

- `@weave-md/core` - Core types and helpers
- `yaml` - YAML parsing

## License

MIT
