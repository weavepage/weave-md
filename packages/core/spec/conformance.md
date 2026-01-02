# Conformance Testing

## Overview

Conformance tests verify that implementations correctly parse and process Weave Markdown according to the specification.

## Test Structure

Each test case consists of:

1. **Input**: A `.md` file with Weave Markdown content
2. **Expected outputs**: One or more JSON files with expected results
   - `.ast.json` - Canonical AST structure
   - `.graph.json` - Graph representation
   - `.section.json` - Frontmatter parse result (optional)
   - `.export.md` - Exported Markdown (for basic profile only)

## Test Categories

### Core Conformance

Tests in these directories verify core parsing behavior:

- `conformance/node-links/` - Node link parsing
- `conformance/frontmatter/` - Frontmatter parsing
- `conformance/graph/` - Graph extraction

**Requirements:**
- Parse input `.md` file
- Produce AST matching `.ast.json`
- Produce graph matching `.graph.json`

### Extended Conformance (Optional)

Tests for Weave Format features:

- `conformance/extended/` - Weave Format parsing and rendering

**Requirements:**
- Parse Weave Format blocks (math, gallery, audio, video, etc.)
- Parse inline extensions (`:math[...]`, `:sub[...]{...}`)
- Preserve content and parameters in AST
- Render appropriately when supported

## Running Tests

Use the conformance runner in `dev-tools/`:

```bash
# Test core parsing (AST + graph)
pnpm conformance:core

# Test basic profile
pnpm conformance:basic
```

## Test Naming

Test files follow this convention:

```
NNN-description.md
NNN-description.ast.json
NNN-description.graph.json
```

Where `NNN` is a zero-padded number (e.g., `001`, `002`).

## Pass Criteria

A test passes if:

1. The implementation produces output
2. The output exactly matches the expected JSON (deep equality)
3. No unexpected errors occur

## Adding Tests

To add a conformance test:

1. Create the input `.md` file
2. Generate expected outputs using the reference implementation
3. Manually verify the outputs are correct
4. Add to the appropriate `conformance/` subdirectory

## Normative vs. Non-Normative

- **Normative**: Tests in `conformance/` are normative and define correct behavior
- **Non-Normative**: Examples in `examples/` are illustrative only
