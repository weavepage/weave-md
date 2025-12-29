import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { toHtml, exportToHtml, exportToAppendix, exportToStaticHtml } from '../src/render/index.js'
import { loadWorkspace } from '../src/load/index.js'
import { parseToMdast } from '@weave-md/parse'
import { join } from 'path'
import { mkdtempSync, writeFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'

describe('toHtml', () => {
  it('renders basic markdown', () => {
    const markdown = `---
id: test-section
title: Test Section
---

This is a paragraph with **bold** and *italic* text.`

    const { tree } = parseToMdast(markdown)
    const html = toHtml(tree)

    expect(html).toContain('<p>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
  })

  it('renders node links', () => {
    const markdown = `---
id: test-section
title: Test Section
---

See [this section](node:other-section) for more.`

    const { tree } = parseToMdast(markdown)
    const html = toHtml(tree)

    expect(html).toContain('weave-node-link')
    expect(html).toContain('data-node-id="other-section"')
  })

  it('renders node links as footnotes when display=footnote', () => {
    const markdown = `---
id: test-section
title: Test Section
---

See [this section](node:other-section?display=footnote) for more.`

    const { tree } = parseToMdast(markdown)
    const html = toHtml(tree)

    expect(html).toContain('weave-footnote-ref')
    expect(html).toContain('fn-1')
  })

  it('renders math blocks with KaTeX', () => {
    const markdown = `---
id: test-section
title: Test Section
---

\`\`\`math
E = mc^2
\`\`\``

    const { tree } = parseToMdast(markdown)
    const html = toHtml(tree, { renderMath: true })

    expect(html).toContain('weave-math-block')
    expect(html).toContain('katex')
  })

  it('renders math blocks as code when renderMath=false', () => {
    const markdown = `---
id: test-section
title: Test Section
---

\`\`\`math
E = mc^2
\`\`\``

    const { tree } = parseToMdast(markdown)
    const html = toHtml(tree, { renderMath: false })

    expect(html).toContain('weave-math-block')
    expect(html).toContain('<code>')
    expect(html).toContain('E = mc^2')
  })

  it('renders inline math', () => {
    const markdown = `---
id: test-section
title: Test Section
---

The equation :math[E = mc^2] is famous.`

    const { tree } = parseToMdast(markdown)
    const html = toHtml(tree, { renderMath: true })

    expect(html).toContain('katex')
  })

  it('renders media blocks', () => {
    const markdown = `---
id: test-section
title: Test Section
---

\`\`\`image
src: /images/photo.jpg
alt: A photo
\`\`\``

    const { tree } = parseToMdast(markdown)
    const html = toHtml(tree)

    expect(html).toContain('weave-image')
    expect(html).toContain('src="/images/photo.jpg"')
    expect(html).toContain('alt="A photo"')
  })

  it('renders preformatted blocks', () => {
    const markdown = `---
id: test-section
title: Test Section
---

\`\`\`pre
  Preserved
    spacing
\`\`\``

    const { tree } = parseToMdast(markdown)
    const html = toHtml(tree)

    expect(html).toContain('weave-preformatted')
    expect(html).toContain('Preserved')
  })

  it('uses custom nodeLinksHandler', () => {
    const markdown = `---
id: test-section
title: Test Section
---

See [details](node:other-section) here.`

    const { tree } = parseToMdast(markdown)
    const html = toHtml(tree, {
      nodeLinksHandler: (ref, text) => `<custom-link to="${ref.id}">${text}</custom-link>`
    })

    expect(html).toContain('<custom-link to="other-section">details</custom-link>')
  })
})

describe('exportToHtml', () => {
  it('generates complete HTML document', () => {
    const sections = [
      { id: 'intro', title: 'Introduction', body: 'Welcome to the document.' },
      { id: 'chapter-1', title: 'Chapter 1', body: 'First chapter content.' }
    ]

    const markdown1 = `---
id: intro
title: Introduction
---

Welcome to the document.`

    const markdown2 = `---
id: chapter-1
title: Chapter 1
---

First chapter content.`

    const trees = new Map<string, any>()
    trees.set('intro', parseToMdast(markdown1).tree)
    trees.set('chapter-1', parseToMdast(markdown2).tree)

    const html = exportToHtml(sections, trees, { title: 'My Document' })

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<title>My Document</title>')
    expect(html).toContain('weave-section')
    expect(html).toContain('id="intro"')
    expect(html).toContain('id="chapter-1"')
    expect(html).toContain('Introduction')
    expect(html).toContain('Chapter 1')
  })

  it('includes styles by default', () => {
    const sections = [{ id: 'test', title: 'Test', body: 'Content' }]
    const trees = new Map<string, any>()
    trees.set('test', parseToMdast(`---
id: test
title: Test
---

Content`).tree)

    const html = exportToHtml(sections, trees)

    expect(html).toContain('<style>')
    expect(html).toContain('.weave-document')
  })

  it('excludes styles when includeStyles=false', () => {
    const sections = [{ id: 'test', title: 'Test', body: 'Content' }]
    const trees = new Map<string, any>()
    trees.set('test', parseToMdast(`---
id: test
title: Test
---

Content`).tree)

    const html = exportToHtml(sections, trees, { includeStyles: false })

    expect(html).not.toContain('<style>')
  })
})

describe('exportToAppendix', () => {
  it('generates markdown appendix', () => {
    const sections = [
      { id: 'intro', title: 'Introduction', body: 'Welcome.' },
      { id: 'chapter-1', title: 'Chapter 1', body: 'Content here.' }
    ]

    const markdown = exportToAppendix(sections)

    expect(markdown).toContain('# Introduction')
    expect(markdown).toContain('Welcome.')
    expect(markdown).toContain('# Chapter 1')
    expect(markdown).toContain('Content here.')
    expect(markdown).toContain('---')
  })

  it('uses id as title fallback', () => {
    const sections = [
      { id: 'my-section', body: 'No title here.' }
    ]

    const markdown = exportToAppendix(sections)

    expect(markdown).toContain('# my-section')
  })
})

describe('exportToStaticHtml', () => {
  it('generates static HTML with footnotes and overlay support', () => {
    const sections = [
      { id: 'main', title: 'Main Section', body: 'Content with [overlay link](node:detail?display=overlay) and [footnote](node:note).' },
      { id: 'detail', title: 'Detail', body: 'Detail content.' },
      { id: 'note', title: 'Note', body: 'Note content.' }
    ]

    const markdown1 = `---
id: main
title: Main Section
---

Content with [overlay link](node:detail?display=overlay) and [footnote](node:note).`

    const markdown2 = `---
id: detail
title: Detail
---

Detail content.`

    const markdown3 = `---
id: note
title: Note
---

Note content.`

    const trees = new Map<string, any>()
    trees.set('main', parseToMdast(markdown1).tree)
    trees.set('detail', parseToMdast(markdown2).tree)
    trees.set('note', parseToMdast(markdown3).tree)

    const html = exportToStaticHtml(sections, trees, { title: 'Test Document' })

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<title>Test Document</title>')
    expect(html).toContain('data-display="overlay"')
    expect(html).toContain('weave-footnote-ref')
    expect(html).toContain('weave-overlay')
    expect(html).toContain('openOverlay')
  })

  it('renders empty overlay links as icons', () => {
    const sections = [
      { id: 'main', title: 'Main', body: 'Text[ ](node:detail?display=overlay)more text.' },
      { id: 'detail', title: 'Detail', body: 'Detail content.' }
    ]

    const trees = new Map<string, any>()
    trees.set('main', parseToMdast(`---
id: main
title: Main
---

Text[ ](node:detail?display=overlay)more text.`).tree)
    trees.set('detail', parseToMdast(`---
id: detail
title: Detail
---

Detail content.`).tree)

    const html = exportToStaticHtml(sections, trees)

    expect(html).toContain('weave-overlay-anchor')
    expect(html).toContain('data-display="overlay"')
    expect(html).toContain('weave-icon') // SVG icon
  })

  it('includes section data for overlay rendering', () => {
    const sections = [
      { id: 'main', title: 'Main', body: 'See [detail](node:detail?display=overlay).' },
      { id: 'detail', title: 'Detail', body: 'Detail content.' }
    ]

    const trees = new Map<string, any>()
    trees.set('main', parseToMdast(`---
id: main
title: Main
---

See [detail](node:detail?display=overlay).`).tree)
    trees.set('detail', parseToMdast(`---
id: detail
title: Detail
---

Detail content.`).tree)

    const html = exportToStaticHtml(sections, trees)

    expect(html).toContain('"detail"')
    expect(html).toContain('"title":"Detail"')
  })
})

describe('loadWorkspace', () => {
  let tempDir: string

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'weave-test-'))

    writeFileSync(join(tempDir, 'intro.md'), `---
id: intro
title: Introduction
---

Welcome to the test.`)

    writeFileSync(join(tempDir, 'chapter.md'), `---
id: chapter-1
title: Chapter 1
peek: First chapter preview
---

Chapter content here.`)

    writeFileSync(join(tempDir, 'no-frontmatter.md'), `# Just a heading

No frontmatter here.`)
  })

  afterAll(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it('loads sections from directory', async () => {
    const { sections, filePaths } = await loadWorkspace(tempDir)

    expect(sections.length).toBe(2)
    expect(sections.map(s => s.id).sort()).toEqual(['chapter-1', 'intro'])
    expect(filePaths.get('intro')).toContain('intro.md')
  })

  it('extracts frontmatter fields', async () => {
    const { sections } = await loadWorkspace(tempDir)

    const chapter = sections.find(s => s.id === 'chapter-1')
    expect(chapter?.title).toBe('Chapter 1')
    expect(chapter?.peek).toBe('First chapter preview')
  })

  it('skips files without valid frontmatter', async () => {
    const { sections } = await loadWorkspace(tempDir)

    const ids = sections.map(s => s.id)
    expect(ids).not.toContain('no-frontmatter')
  })

  it('loads specific files', async () => {
    const { sections } = await loadWorkspace(tempDir, {
      files: ['intro.md']
    })

    expect(sections.length).toBe(1)
    expect(sections[0].id).toBe('intro')
  })

  it('provides raw content for AST parsing', async () => {
    const { rawContent } = await loadWorkspace(tempDir)

    expect(rawContent.get('intro')).toContain('---')
    expect(rawContent.get('intro')).toContain('id: intro')
  })
})
