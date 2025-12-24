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
- `@weave-md/validate` - Reference validation (lightweight for editor/CI)
- `@weave-md/basic` - Reference implementation (parser + renderer + exporter)
- `conformance/` - Normative test corpus
- `examples/` - Non-normative demos
- `dev-tools/` - Conformance runners and repo validation

## Repository Layout

```
weave-md/
├── packages/
│   ├── core/          # @weave-md/core - spec, schemas, types
│   ├── validate/      # @weave-md/validate - validation
│   └── basic/         # @weave-md/basic - reference implementation
├── conformance/       # Normative conformance tests
├── examples/          # Non-normative examples
├── dev-tools/         # Conformance runners
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

### Run Conformance Tests

```bash
# Test core parsing (AST + graph)
npm run conformance:core

# Test basic profile (includes export)
npm run conformance:basic
```

### Export a Document

```bash
cd packages/basic
pnpm build
./dist/cli/index.js export --out=./output
```

## Packages

### [@weave-md/core](./packages/core)

The language contract - pure helpers with no I/O:

```bash
npm install @weave-md/core
```

See [packages/core/README.md](./packages/core/README.md) and [spec/](./packages/core/spec/).

### [@weave-md/validate](./packages/validate)

Reference validation for editors and CI:

```bash
npm install @weave-md/validate
```

See [packages/validate/README.md](./packages/validate/README.md).

### [@weave-md/basic](./packages/basic)

Reference implementation with HTML/appendix export:

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
- `@weave-md/validate`
- `@weave-md/basic`

**Separate repos:**
- `vscode-weave-md` - VS Code extension

## Stability

This is version **0.1.0-alpha** - APIs and spec are subject to change.

## License

MIT
