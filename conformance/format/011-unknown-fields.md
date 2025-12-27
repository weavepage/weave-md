---
id: unknown-fields-test
title: Unknown Fields Test
---

Image with unknown custom fields (should be preserved):

```image
file: /photos/custom.jpg
alt: Testing unknown field preservation
customField: custom value
renderHint: special
metadata: { key: value }
```

Video with unknown fields:

```video
file: /video/custom.mp4
customQuality: 4k
customCodec: h265
customMetadata: preserved
```
