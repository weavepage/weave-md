# Weave Markdown

A Markdown flavor for inline, expandable references between sections of content.

## Overview

Weave Markdown extends standard Markdown with:

- **Section frontmatter** — YAML metadata defining section identity
- **Node links** — `node:` URL scheme for referencing sections
- **Weave format** — Rich media, math (LaTeX), embeds, and voiceover

## Repository Layout

```
weave-md/
├── packages/
│   ├── core/       # Spec, schemas, types, pure helpers
│   ├── parse/      # AST generation
│   ├── validate/   # Document validation
│   └── basic/      # CLI + rendering + export
├── conformance/    # Normative test corpus
├── examples/       # Non-normative demos
└── tests/
```

## Getting Started

```bash
pnpm install && pnpm build   # Install and build
pnpm test                    # Run tests
```

### CLI (via @weave-md/basic)

```bash
weave-md-basic export html --entry=intro   # Export to HTML
weave-md-basic export ast                  # Export to JSON AST
```

See [@weave-md/basic](./packages/basic/README.md) for more CLI options.

## Packages

| Package | Description |
|---------|-------------|
| [@weave-md/core](./packages/core) | Language contract — spec, schemas, types, pure helpers |
| [@weave-md/parse](./packages/parse) | AST generation (markdown → WeaveAst) |
| [@weave-md/validate](./packages/validate) | Document validation for editors/CI |
| [@weave-md/basic](./packages/basic) | Reference implementation — CLI, rendering, export |

## Specification

The normative spec lives in [packages/core/spec/](./packages/core/spec/): [Overview](./packages/core/spec/index.md) · [Node Links](./packages/core/spec/node-links.md) · [Frontmatter](./packages/core/spec/frontmatter.md) · [Weave Format](./packages/core/spec/weave-format.md) · [Conformance](./packages/core/spec/conformance.md)

Conformance tests in `conformance/` define correct behavior.

## Ecosystem

- **This repo:** `@weave-md/core`, `@weave-md/parse`, `@weave-md/validate`, `@weave-md/basic`
- **Separate:** `vscode-weave-md` (VS Code extension)

## Stability

Version **0.1.0-alpha** — APIs and spec subject to change.

## License

MIT
