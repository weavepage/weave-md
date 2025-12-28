# weave-md

**Weave Markdown** - Inline, expandable references for markdown.

This is an umbrella package that re-exports all `@weave-md/*` packages. For most use cases, we recommend installing the individual packages directly from the [@weave-md](https://www.npmjs.com/org/weave-md) organization.

## Packages

| Package | Description |
|---------|-------------|
| [@weave-md/core](https://www.npmjs.com/package/@weave-md/core) | Types, schemas, and language spec |
| [@weave-md/parse](https://www.npmjs.com/package/@weave-md/parse) | Parse markdown to WeaveAst |
| [@weave-md/validate](https://www.npmjs.com/package/@weave-md/validate) | Validate references and links |
| [@weave-md/basic](https://www.npmjs.com/package/@weave-md/basic) | Reference implementation with CLI and renderer |

## Installation

Install individual packages (recommended):

```bash
npm install @weave-md/core @weave-md/parse
```

Or install everything via this umbrella package:

```bash
npm install weave-md
```

## Usage

```typescript
// Import from individual packages (recommended)
import { parseWeaveDocument, compileToWeaveAst } from '@weave-md/parse';
import { validateLinks } from '@weave-md/validate';
import type { WeaveFormat } from '@weave-md/core';

// Or import from umbrella package (namespaced)
import { parse, validate, core, basic } from 'weave-md';

const ast = parse.parseWeaveDocument(markdown);
const errors = validate.validateLinks(ast);
const html = basic.exportToStaticHtml(ast);
```

## Links

- [GitHub](https://github.com/weavepage/weave-md)
- [npm org](https://www.npmjs.com/org/weave-md)
