---
id: malformed-urls
title: Malformed Node URLs
---

Test various malformed node: URL patterns.

## Missing ID
Link with no ID: [Empty node link](node:)

## Invalid characters in ID
Link with spaces: [Spaced ID](node:my invalid id)
Link with special chars: [Special](node:id@#$%)

## Malformed query params
Missing value: [No value](node:target?display=)
Invalid param: [Bad param](node:target?invalid)
Duplicate display: [Dupes](node:target?display=footnote&display=inline)
Duplicate export: [Export dupes](node:target?export=appendix&export=inline)

## Valid reference for comparison
This should work: [Valid](node:valid-id?display=inline)
