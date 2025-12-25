---
id: weave-format-demo
title: Weave Format Demo
---

# Weave Format Demo

This document showcases the weave format extensions available in Weave Markdown. When viewed through a Weave-compatible renderer, both the inline math and the fenced code blocks below will be transformed into rich content.

## Math

The equation :math[E = mc^2] is famous.

```math
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
```

## Preformatted Text

```pre
Two roads diverged in a yellow wood,
  And sorry I could not travel both
And be one traveler, long I stood
```

## Gallery

```gallery
files:
  - https://example.com/photo1.jpg
  - https://example.com/photo2.jpg
```

## Image

```image
file: https://example.com/photo.jpg
alt: A beautiful landscape
caption: Sunset over the mountains
width: wide
```

## Audio

```audio
file: https://example.com/podcast.mp3
autoplay: false
controls: true
loop: false
```

## Video

```video
file: https://example.com/video.mp4
poster: https://example.com/poster.jpg
start: 0
autoplay: false
controls: true
loop: false
```

## Embed

```embed
url: https://example.com/widget
```

## Voiceover

```voiceover
file: https://example.com/narration.mp3
```