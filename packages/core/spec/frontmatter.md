# Frontmatter Extension

## Format

Section frontmatter uses YAML syntax enclosed in triple-dash delimiters:

```markdown
---
id: section-id
title: Section Title
peek: Brief preview text
---

Section body content here.
```

## Required Fields

### `id`

- **Type**: string
- **Required**: Yes
- **Description**: Unique identifier for the section
- **Constraints**: 
  - Must be unique within the document/workspace
  - Should use kebab-case (lowercase with hyphens)
  - Must not be empty

## Optional Fields

### `title`

- **Type**: string
- **Required**: No
- **Description**: Human-readable title for the section

### `peek`

- **Type**: string
- **Required**: No
- **Description**: Preview text shown in peek views

**Unknown Fields**: Implementations MUST preserve unknown YAML fields in frontmatter. This allows renderer-specific extensions and custom configuration without breaking conformance. Implementations MAY emit info-level messages for unknown fields.

## Validation Rules

Implementations MUST:

1. **Error on missing `id`**: A section without an `id` is invalid
2. **Error on duplicate `id`**: Multiple sections with the same `id` is invalid

## Examples

### Minimal section
```markdown
---
id: intro
---

This is the introduction.
```

### Full metadata
```markdown
---
id: getting-started
title: Getting Started Guide
peek: Learn how to set up and use Weave Markdown
---

Welcome to Weave Markdown! This guide will help you...
```

## Conformance

Implementations MUST:
1. Parse YAML frontmatter correctly
2. Validate presence of `id` field
3. Detect duplicate IDs across all sections
4. Emit appropriate errors and warnings
