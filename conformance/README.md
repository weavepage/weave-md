# Conformance Tests

This directory contains normative conformance tests for Weave Markdown implementations.

## Structure

Tests are organized by feature:

- `format/` - Weave document format and structure tests
- `node-links/` - Node link parsing tests
- `frontmatter/` - Frontmatter parsing tests
- `graph/` - Graph extraction tests
- `export/` - Export behavior tests (basic profile only)

## Test Suites

### format/
| Test | Description |
|------|-------------|
| `001-valid-document` | Complete weave document with all frontmatter fields |
| `002-no-title` | Document with only required `id` field (title optional) |
| `003-math-block` | Math blocks with LaTeX content |
| `004-media-blocks` | All media block types (image, gallery, audio, video, embed, voiceover) |
| `005-inline-math` | Inline math syntax `:math[...]` |
| `006-preformatted` | Preformatted blocks with preserved whitespace |

### node-links/
| Test | Description |
|------|-------------|
| `001-basic` | Basic `node:ID` link syntax |
| `002-params` | Links with query params (`display`, `export`) |
| `002-malformed` | Malformed node URLs (missing ID, invalid chars, bad params) |
| `003-escaping` | URL encoding and special character handling |

### frontmatter/
| Test | Description |
|------|-------------|
| `001-minimal-section` | Minimal section with only `id` field |
| `002-missing-id` | Section without required `id` field (error case) |
| `003-duplicate-ids` | Multiple sections with same ID (error case) |
| `004-invalid-frontmatter` | Malformed YAML frontmatter (error case) |
| `005-broken-references` | Links to non-existent nodes |
| `006-peek-fallback` | Peek text derived from first paragraph |
| `007-peek-explicit` | Explicit peek field in frontmatter |

### graph/
| Test | Description |
|------|-------------|
| `001-two-sections` | Single section with links to self and undefined node |
| `002-cycles` | Three-way cycle detection (A→B→C→A) |
| `003-deep-cycle` | Five-node deep cycle detection |

### export/
| Test | Description |
|------|-------------|
| `001-appendix` | Appendix export mode with multiple sections |
| `002-dedupe` | Deduplication of shared references |
| `003-stable-anchors` | Stable anchor generation across exports |
| `004-link-rewriting` | Link rewriting during export |
| `005-ordering` | Section ordering in export output |
| `006-nested-refs` | Nested reference handling in export |

## Test Format

Each test case consists of:

1. **Input**: `NNN-description.md` - Weave Markdown source
2. **Expected outputs**:
   - `NNN-description.ast.json` - Canonical AST structure
   - `NNN-description.graph.json` - Graph representation
   - `NNN-description.section.json` - Frontmatter parse (optional)
   - `NNN-description.export.md` - Export output (basic profile)

## Running Tests

From the repository root:

```bash
pnpm test
```

This runs vitest, which tests both implementations against the conformance fixtures:
- `@weave-md/validate` — lightweight regex-based validation
- `@weave-md/parse` — full AST parser (micromark/mdast)

### Package Roles

**Validator (`@weave-md/validate`)**:
- Lightweight link extraction (line-by-line parsing)
- Document-level validation (broken refs, duplicate IDs)
- Suitable for: IDE integration, keystroke validation, quick checks
- Limitations: Single-line links only, no complex nesting

**Parser (`@weave-md/parse`)**:
- Full micromark + mdast parsing
- Complete AST with Weave transforms
- Parse-time validation (node URLs, media configs, frontmatter)
- Suitable for: Building custom renderers and tools
- Features: Plugin support, stringify, full CommonMark + GFM

**Basic (`@weave-md/basic`)**:
- CLI for validation and export
- HTML rendering with KaTeX math support
- Uses both `@weave-md/parse` and `@weave-md/validate`
- Suitable for: Production builds, export, reference implementation

## Adding Tests

1. Create the input `.md` file
2. Generate expected outputs using the reference implementation
3. Manually verify correctness
4. Add to the appropriate subdirectory

## Conformance Levels

- **Core conformance**: Must pass AST and graph tests
- **Basic profile conformance**: Must pass core + export tests

See [../packages/core/spec/conformance.md](../packages/core/spec/conformance.md) for details.
