# @weave-md/core

The language contract for Weave Markdown - spec, schemas, types, and pure helpers.

## What's in Core

This package contains:

- **Specification documents** (`spec/`) - Normative prose defining Weave Markdown
- **JSON Schemas** (`schema/`) - Machine-readable schemas for AST and graph structures
- **TypeScript types** - Type definitions matching the schemas
- **Pure helpers** - Utility functions with no I/O or side effects

## Pure Helpers Only

`@weave-md/core` has **no filesystem access** and **no rendering side effects**. It provides:

### Node URL Utilities
- `parseNodeUrl(href: string)` - Parse `node:` URLs into structured references
- `formatNodeUrl(ref: NodeRef)` - Format references back to `node:` URLs

### Graph Utilities
- `buildGraph(sections: Section[], links: Link[])` - Build document graph with node connections
- `detectCycles(graph: Graph)` - Detect circular references in the document graph

## Installation

```bash
npm install @weave-md/core
```

## Usage

```typescript
import { parseNodeUrl, formatNodeUrl, buildGraph, SPEC_VERSION } from '@weave-md/core';

// Parse node URLs
const ref = parseNodeUrl('node:intro?display=footnote');
console.log(ref); // { id: 'intro', display: 'footnote' }

// Format node URLs
const url = formatNodeUrl({ id: 'intro', display: 'footnote' });
console.log(url); // 'node:intro?display=footnote'

// Build document graph
const graph = buildGraph(sections, links);
console.log(graph.nodes); // Graph nodes with incoming/outgoing connections

console.log(SPEC_VERSION); // '0.1.0'
```

### Weave Format Types

```typescript
import { GalleryBlock, MathBlock, VideoBlock } from '@weave-md/core/weave-format';

const gallery: GalleryBlock = {
  type: 'gallery',
  urls: ['image1.jpg', 'image2.jpg'],
  columns: 3,
  gap: 8,
  aspect: '16:9'
};
```

## Links

- [Specification](./spec/index.md)
- [Schemas](./schema/)
- [GitHub Repository](https://github.com/weavepage/weave-md)

## License

MIT
