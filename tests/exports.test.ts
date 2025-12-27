import { describe, it, expect } from 'vitest'

describe('@weave-md/core exports', () => {
  it('exports SPEC_VERSION', async () => {
    const core = await import('@weave-md/core')
    expect(core.SPEC_VERSION).toBeDefined()
  })

  it('exports parseNodeUrl', async () => {
    const core = await import('@weave-md/core')
    expect(typeof core.parseNodeUrl).toBe('function')
  })

  it('exports formatNodeUrl', async () => {
    const core = await import('@weave-md/core')
    expect(typeof core.formatNodeUrl).toBe('function')
  })

  it('exports buildGraph', async () => {
    const core = await import('@weave-md/core')
    expect(typeof core.buildGraph).toBe('function')
  })
})

describe('@weave-md/parse exports', () => {
  it('exports parseWeaveDocument', async () => {
    const parse = await import('@weave-md/parse')
    expect(typeof parse.parseWeaveDocument).toBe('function')
  })

  it('exports parseToMdast', async () => {
    const parse = await import('@weave-md/parse')
    expect(typeof parse.parseToMdast).toBe('function')
  })

  it('exports parseWeaveDocumentAsync', async () => {
    const parse = await import('@weave-md/parse')
    expect(typeof parse.parseWeaveDocumentAsync).toBe('function')
  })

  it('exports parseMdast', async () => {
    const parse = await import('@weave-md/parse')
    expect(typeof parse.parseMdast).toBe('function')
  })

  it('exports stringifyMdast', async () => {
    const parse = await import('@weave-md/parse')
    expect(typeof parse.stringifyMdast).toBe('function')
  })

  it('exports stringifyWeaveDocument', async () => {
    const parse = await import('@weave-md/parse')
    expect(typeof parse.stringifyWeaveDocument).toBe('function')
  })
})

describe('@weave-md/validate exports', () => {
  it('exports parseFrontmatter', async () => {
    const validate = await import('@weave-md/validate')
    expect(typeof validate.parseFrontmatter).toBe('function')
  })

  it('exports extractNodeLinks', async () => {
    const validate = await import('@weave-md/validate')
    expect(typeof validate.extractNodeLinks).toBe('function')
  })
})

describe('@weave-md/basic exports', () => {
  it('exports loadWorkspace', async () => {
    const basic = await import('@weave-md/basic')
    expect(typeof basic.loadWorkspace).toBe('function')
  })

  it('exports toHtml', async () => {
    const basic = await import('@weave-md/basic')
    expect(typeof basic.toHtml).toBe('function')
  })

  it('exports exportToHtml', async () => {
    const basic = await import('@weave-md/basic')
    expect(typeof basic.exportToHtml).toBe('function')
  })

  it('exports exportToAppendix', async () => {
    const basic = await import('@weave-md/basic')
    expect(typeof basic.exportToAppendix).toBe('function')
  })

  // Re-exports from @weave-md/parse
  it('re-exports parseWeaveDocument from parse', async () => {
    const basic = await import('@weave-md/basic')
    expect(typeof basic.parseWeaveDocument).toBe('function')
  })

  it('re-exports parseToMdast from parse', async () => {
    const basic = await import('@weave-md/basic')
    expect(typeof basic.parseToMdast).toBe('function')
  })

  it('re-exports parseWeaveDocumentAsync from parse', async () => {
    const basic = await import('@weave-md/basic')
    expect(typeof basic.parseWeaveDocumentAsync).toBe('function')
  })

  it('re-exports parseMdast from parse', async () => {
    const basic = await import('@weave-md/basic')
    expect(typeof basic.parseMdast).toBe('function')
  })

  it('re-exports stringifyMdast from parse', async () => {
    const basic = await import('@weave-md/basic')
    expect(typeof basic.stringifyMdast).toBe('function')
  })

  it('re-exports stringifyWeaveDocument from parse', async () => {
    const basic = await import('@weave-md/basic')
    expect(typeof basic.stringifyWeaveDocument).toBe('function')
  })
})

describe('@weave-md/basic functional', () => {
  it('parseWeaveDocument works correctly', async () => {
    const { parseWeaveDocument } = await import('@weave-md/basic')
    const ast = parseWeaveDocument(`---
id: test
title: Test
---

Hello [world](node:other).
`)
    expect(ast.sections[0].id).toBe('test')
    expect(ast.links[0].ref.id).toBe('other')
  })
})
