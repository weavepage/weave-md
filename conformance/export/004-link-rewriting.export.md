# Link Rewriting Test

Test various link rewriting scenarios:

## Display params should be stripped
- [Inline link](#target) → becomes simple anchor
- [Footnote link](#target) → becomes simple anchor
- [Page link](#target) → becomes simple anchor

## Unknown params should be stripped
- [With unknown param](#target) → becomes simple anchor
- [Multiple params](#target) → becomes simple anchor

## Link text preserved
- [Custom label](#target) → label preserved
- [Another label](#target) → label preserved

## Regular markdown links unchanged
- [External link](https://example.com) → unchanged
- [Relative link](./other.md) → unchanged
- [Anchor link](#heading) → unchanged

---

## Appendix

### Target Section {#target}

This is the target section for link rewriting tests.
