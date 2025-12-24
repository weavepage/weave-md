# Weave Markdown Specification v0.1

## Overview

Weave Markdown is a Markdown flavor that enables inline, expandable references between sections of content by extending standard Markdown with a small set of core extensions.

## Extensions

- [Node links](node-links.md) – `node:` URL syntax and parameters
- [Frontmatter](frontmatter.md) – Section metadata format
- [Weave format](weave-format.md) – Rich media, math, and formatting

## Conformance

An implementation conforms to this specification if it:

1. Correctly parses section frontmatter according to [frontmatter.md](frontmatter.md)
2. Correctly parses node links according to [node-links.md](node-links.md)
3. Correctly parses Weave format elements according to [weave-format.md](weave-format.md)
4. Produces AST output that conforms to the AST schema (see **Schemas**)
5. Produces graph output that conforms to the graph schema (see **Schemas**)
6. Passes all normative conformance tests in the `conformance/` directory

See [conformance.md](conformance.md) for details on conformance testing.

## Schemas

- [weave-ast.schema.json](../schema/weave-ast.schema.json) – Canonical AST structure
- [weave-graph.schema.json](../schema/weave-graph.schema.json) – Graph representation
- [weave-format.schema.json](../schema/weave-format.schema.json) – Weave format elements

## Version

Version **0.1.0** of the Weave Markdown specification.
