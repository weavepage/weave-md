# Weave Markdown

A Markdown flavor for inline, expandable references between sections of content.

## Overview

Weave Markdown extends standard Markdown with:

- **Section frontmatter** - YAML metadata blocks defining section identity
- **Node links** - Special `node:` URL scheme for referencing sections
- **Graph semantics** - Well-defined behavior for reference expansion and cycles
- **Weave format** - Rich media (gallery, audio, video), math (LaTeX), preformatted text, embeds, and voiceover

This repository is a **spec-like monorepo** containing:

- `@weave-md/core` - Language contract (spec + schemas + types + pure helpers)
- `@weave-md/parse` - AST generation (markdown → WeaveAst)
- `@weave-md/validate` - Document-level validation (lightweight for editor/CI)
- `@weave-md/basic` - Reference implementation (CLI + renderer + exporter)
- `conformance/` - Normative test corpus
- `examples/` - Non-normative demos
- `tests/` - Internal tests

## Repository Layout

```
weave-md/
├── packages/
│   ├── core/          # @weave-md/core - spec, schemas, types
│   ├── parse/         # @weave-md/parse - AST generation
│   ├── validate/      # @weave-md/validate - validation
│   └── basic/         # @weave-md/basic - CLI + rendering + export
├── conformance/       # Normative conformance tests
├── examples/          # Non-normative examples
├── tests/             # Internal tests
└── README.md
```

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Build all packages
npm run build
```

### Run Tests

```bash
npm test
```

### Export a Document

```bash
# Export to HTML
weave-md-basic export html --entry=intro

# Export to JSON AST
weave-md-basic export ast
```

**HTML entry point:** If exactly one `.md` file exists in the root directory, `--entry` is auto-detected:

```bash
weave-md-basic export html
```

## Packages

### [@weave-md/core](./packages/core)

The language contract - pure helpers with no I/O:

```bash
npm install @weave-md/core
```

See [packages/core/README.md](./packages/core/README.md) and [spec/](./packages/core/spec/).

### [@weave-md/parse](./packages/parse)

AST generation for building custom renderers and tools:

```bash
npm install @weave-md/parse @weave-md/core
```

See [packages/parse/README.md](./packages/parse/README.md).

### [@weave-md/validate](./packages/validate)

Document-level validation for editors and CI:

```bash
npm install @weave-md/validate @weave-md/core
```

See [packages/validate/README.md](./packages/validate/README.md).

### [@weave-md/basic](./packages/basic)

Reference implementation with CLI, rendering, and export:

```bash
npm install @weave-md/basic
```

See [packages/basic/README.md](./packages/basic/README.md).

## Specification

The normative specification is in [packages/core/spec/](./packages/core/spec/):

- [Overview](./packages/core/spec/index.md)
- [Node Links](./packages/core/spec/node-links.md)
- [Frontmatter](./packages/core/spec/frontmatter.md)
- [Weave Format](./packages/core/spec/weave-format.md)
- [Conformance](./packages/core/spec/conformance.md)

## Conformance

Conformance tests in `conformance/` define correct behavior. See [packages/core/spec/conformance.md](./packages/core/spec/conformance.md) for details.

## Ecosystem

**Public OSS (this repo):**
- `@weave-md/core`
- `@weave-md/parse`
- `@weave-md/validate`
- `@weave-md/basic`

**Separate repos:**
- `vscode-weave-md` - VS Code extension

## Stability

This is version **0.1.0-alpha** - APIs and spec are subject to change.

## License

MIT
