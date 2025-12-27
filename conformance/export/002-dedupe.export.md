# Deduplication Test Main

This section references [shared](#dedupe-shared) multiple times:
- First reference: [shared section](#dedupe-shared)
- Second reference: [same section again](#dedupe-shared)
- Third reference: [shared](#dedupe-shared)

It also references [another section](#dedupe-other) that also references shared.

---

## Appendix

### Another Section {#dedupe-other}

This section also references the [shared section](#dedupe-shared).

### Shared Section {#dedupe-shared}

This is the shared section content that should only appear once in the appendix export, despite being referenced multiple times.
