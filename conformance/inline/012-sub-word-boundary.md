---
id: sub-word-boundary
title: Word Boundary Requirement
---

Valid (after space): text :sub[a]{b} more.

Valid (after punctuation): (:sub[a]{b}) and ,:sub[a]{b}.

Invalid (after letter): word:sub[a]{b} should not match.

Invalid (after digit): 123:sub[a]{b} should not match.

Invalid (after underscore): test_:sub[a]{b} should not match.
