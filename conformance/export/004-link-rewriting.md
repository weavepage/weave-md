---
id: rewrite-test
title: Link Rewriting Test
---

Test various link rewriting scenarios:

## Display params should be stripped
- [Inline link](node:target?display=inline) → becomes simple anchor
- [Footnote link](node:target?display=footnote) → becomes simple anchor
- [Page link](node:target?display=page) → becomes simple anchor

## Unknown params should be stripped
- [With unknown param](node:target?unknown=value) → becomes simple anchor
- [Multiple params](node:target?display=inline&custom=data) → becomes simple anchor

## Link text preserved
- [Custom label](node:target) → label preserved
- [Another label](node:target?display=inline) → label preserved

## Regular markdown links unchanged
- [External link](https://example.com) → unchanged
- [Relative link](./other.md) → unchanged
- [Anchor link](#heading) → unchanged
