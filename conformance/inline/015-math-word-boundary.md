---
id: math-word-boundary
title: Word Boundary Requirement for Math
---

Valid (after space): text :math[x^2] more.

Valid (after punctuation): (:math[x]) and ,:math[y].

Invalid (after letter): word:math[x] should not match.

Invalid (after digit): 123:math[x] should not match.

Invalid (after underscore): test_:math[x] should not match.
