# Nested References Test

Main section references [A](#nested-a).

Section A references B, and B references C.

Should the appendix include all transitively referenced sections, or only direct references?

This test documents the expected behavior.

---

## Appendix

### Section A {#nested-a}

Section A references [B](#nested-b).

### Section B {#nested-b}

Section B references [C](#nested-c).

### Section C {#nested-c}

Section C is the end of the chain.

---

**Note**: This export includes all transitively referenced sections. The appendix follows the reference chain and includes nested references, maintaining first-reference order and deduplicating.
