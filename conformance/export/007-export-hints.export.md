# Export Hints Test

Test all export hint values defined in the spec:

References with export hints:
- [Appendix hint](#section-a)
- [Inline hint](#section-b)
- [Omit hint](#section-c)

Combined display and export:
- [Footnote with appendix](#section-d)
- [Inline with inline export](#section-e)

---

## Appendix

### Section A {#section-a}

Content for section A (export=appendix hint).

### Section B {#section-b}

Content for section B (export=inline hint, but still in appendix for basic profile).

### Section D {#section-d}

Content for section D (display=footnote, export=appendix).

### Section E {#section-e}

Content for section E (display=inline, export=inline).

---

**Note**: Section C with `export=omit` is excluded from the export as requested by the hint.
