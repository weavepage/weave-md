---
id: unknown-fields-test
title: Unknown Frontmatter Fields Test
peek: Testing unknown field handling
customField: This is a custom field
author: John Doe
tags: [test, conformance]
metadata:
  key: value
  nested: data
---

This section has unknown frontmatter fields that should emit info-level messages but still parse successfully.

The section references [another section](node:target-section) to test node-links work with unknown fields.
