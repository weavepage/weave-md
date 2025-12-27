---
id: escaping-test
title: URL Escaping and Encoding
---

Test proper handling of URL encoding in node links.

## Encoded characters in ID
Link with encoded space: [Encoded](node:my%20id)
Link with encoded special: [Special](node:id%2Fwith%2Fslashes)

## Encoded query params
Encoded param value: [Inline text](node:target?display=inline&text=Hello%20World)
Multiple encoded: [Complex](node:target?text=foo%26bar%3Dbaz)

## Mixed encoding
Partially encoded: [Mixed](node:my-id?display=inline&label=Test%20Label)

## Unicode in params
Unicode text: [Unicode](node:target?text=%E2%9C%93%20Done)

## Valid unencoded for comparison
Simple case: [Simple](node:simple-id?display=inline)
