import { describe, it, expect } from 'vitest'
import { 
  parseWeaveDocument, 
  parseToMdast, 
  stringifyWeaveDocument,
  parseMdast
} from '../dist/index.js'

describe('Error throwing', () => {
  it('throws on missing frontmatter', () => {
    expect(() => parseWeaveDocument('No frontmatter here.'))
      .toThrow(/frontmatter/i)
  })

  it('throws on missing id field', () => {
    expect(() => parseWeaveDocument(`---
title: No ID
---
Content.`))
      .toThrow(/id/i)
  })

  it('throws on invalid frontmatter structure (non-object)', () => {
    expect(() => parseWeaveDocument(`---
just a string
---
Content.`))
      .toThrow()
  })
})

describe('Diagnostics', () => {
  it('unknown frontmatter fields produce info diagnostics', () => {
    const ast = parseWeaveDocument(`---
id: test
customField: value
anotherUnknown: 123
---
Content.`)
    
    expect(ast.diagnostics).toHaveLength(2)
    expect(ast.diagnostics![0].severity).toBe('info')
    expect(ast.diagnostics![0].code).toBe('WEAVE_FRONTMATTER_UNKNOWN_FIELD')
    expect(ast.diagnostics![0].message).toContain('customField')
  })

  it('invalid node URL produces error diagnostic', () => {
    const ast = parseWeaveDocument(`---
id: test
---
See [broken](node:).`)
    
    const errorDiag = ast.diagnostics?.find(d => d.severity === 'error')
    expect(errorDiag).toBeDefined()
    expect(errorDiag!.code).toBe('WEAVE_NODE_URL_INVALID')
  })

  it('unknown node URL params produce info diagnostics', () => {
    const ast = parseWeaveDocument(`---
id: test
---
See [link](node:target?customParam=value).`)
    
    const infoDiag = ast.diagnostics?.find(d => d.code === 'WEAVE_NODE_URL_UNKNOWN_PARAM')
    expect(infoDiag).toBeDefined()
    expect(infoDiag!.message).toContain('customParam')
  })

  it('invalid media block YAML produces error diagnostic', () => {
    const ast = parseWeaveDocument(`---
id: test
---

\`\`\`image
not: valid: yaml: here
\`\`\`
`)
    
    const errorDiag = ast.diagnostics?.find(d => d.code === 'WEAVE_MEDIA_YAML_INVALID')
    expect(errorDiag).toBeDefined()
  })

  it('missing required media config produces error diagnostic', () => {
    const ast = parseWeaveDocument(`---
id: test
---

\`\`\`image
caption: No file field
\`\`\`
`)
    
    const errorDiag = ast.diagnostics?.find(d => d.code === 'WEAVE_MEDIA_CONFIG_INVALID')
    expect(errorDiag).toBeDefined()
    expect(errorDiag!.message).toContain('file')
  })

  it('missing alt on image produces warning diagnostic', () => {
    const ast = parseWeaveDocument(`---
id: test
---

\`\`\`image
file: /photo.jpg
\`\`\`
`)
    
    const warnDiag = ast.diagnostics?.find(d => d.severity === 'warning')
    expect(warnDiag).toBeDefined()
    expect(warnDiag!.message).toContain('alt')
  })
})

describe('Weave block parsing', () => {
  it('parses math blocks correctly', () => {
    const { tree } = parseToMdast(`---
id: test
---

\`\`\`math
E = mc^2
\`\`\`
`)
    
    const mathBlock = tree.children.find((n: any) => n.type === 'weaveMathBlock') as any
    expect(mathBlock?.type).toBe('weaveMathBlock')
    expect(mathBlock?.value).toBe('E = mc^2')
  })

  it('parses media blocks correctly', () => {
    const { tree } = parseToMdast(`---
id: test
---

\`\`\`image
file: /photo.jpg
alt: A photo
\`\`\`
`)
    
    const mediaBlock = tree.children.find((n: any) => n.type === 'weaveMediaBlock') as any
    expect(mediaBlock?.type).toBe('weaveMediaBlock')
    expect(mediaBlock?.mediaType).toBe('image')
    expect(mediaBlock?.config?.file).toBe('/photo.jpg')
  })

  it('parses preformatted blocks correctly', () => {
    const { tree } = parseToMdast(`---
id: test
---

\`\`\`pre
  Preserved   spacing
\`\`\`
`)
    
    const preBlock = tree.children.find((n: any) => n.type === 'weavePreformatted') as any
    expect(preBlock?.type).toBe('weavePreformatted')
    expect(preBlock?.value).toContain('Preserved   spacing')
  })

  it('parses inline math correctly', () => {
    const tree = parseMdast('The equation :math[x^2] is simple.')
    const para = tree.children[0] as any
    const mathNode = para.children?.find((n: any) => n.type === 'inlineMath')
    expect(mathNode?.type).toBe('inlineMath')
    expect(mathNode?.value).toBe('x^2')
  })
})

describe('Stringify round-trip', () => {
  it('stringifyWeaveDocument round-trips correctly', () => {
    const original = `---
id: roundtrip
title: Round Trip Test
---

Hello [world](node:world).
`
    const { tree, frontmatter } = parseToMdast(original)
    const output = stringifyWeaveDocument({ tree, frontmatter })
    
    expect(output).toContain('id: roundtrip')
    expect(output).toContain('title: Round Trip Test')
    expect(output).toContain('node:world')
  })

  it('stringifyWeaveDocument preserves node link params', () => {
    const original = `---
id: test
---

See [link](node:target?display=footnote&export=appendix).
`
    const { tree, frontmatter } = parseToMdast(original)
    const output = stringifyWeaveDocument({ tree, frontmatter })
    
    expect(output).toContain('display=footnote')
    expect(output).toContain('export=appendix')
  })

  it('stringifyWeaveDocument handles math blocks', () => {
    const original = `---
id: test
---

\`\`\`math
E = mc^2
\`\`\`
`
    const { tree, frontmatter } = parseToMdast(original)
    const output = stringifyWeaveDocument({ tree, frontmatter })
    
    expect(output).toContain('```math')
    expect(output).toContain('E = mc^2')
  })

  it('stringifyWeaveDocument preserves unknown frontmatter fields', () => {
    const original = `---
id: test
title: Test Title
customField: custom value
anotherField: 123
nestedField:
  key: value
---

Content here.
`
    const { tree, frontmatter } = parseToMdast(original)
    const output = stringifyWeaveDocument({ tree, frontmatter })
    
    expect(output).toContain('id: test')
    expect(output).toContain('title: Test Title')
    expect(output).toContain('customField: custom value')
    expect(output).toContain('anotherField: 123')
    expect(output).toContain('nestedField:')
    expect(output).toContain('key: value')
  })

  it('unknown frontmatter fields survive full round-trip', () => {
    const original = `---
id: roundtrip-unknown
customMeta: preserved
tags:
  - one
  - two
---

Some content.
`
    const { tree, frontmatter } = parseToMdast(original)
    const output = stringifyWeaveDocument({ tree, frontmatter })
    const { frontmatter: reparsed } = parseToMdast(output)
    
    expect(reparsed.id).toBe('roundtrip-unknown')
    expect(reparsed.extra!['customMeta']).toBe('preserved')
    expect(reparsed.extra!['tags']).toEqual(['one', 'two'])
  })
})
