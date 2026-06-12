import { describe, it, expect } from 'vitest'
import {
  flattenWeaveDocument,
  recordsToJsonl,
  recordsToMarkdown
} from '../dist/index.js'

/** Build a file with frontmatter from an id (+ optional fields) and a body. */
function file(path: string, fm: Record<string, unknown>, body: string) {
  const yaml = Object.entries(fm)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
  return { path, content: `---\n${yaml}\n---\n${body}` }
}

describe('flattenWeaveDocument', () => {
  it('resolves by frontmatter id (not filename), flags main, orders DFS pre-order', () => {
    const files = [
      // filename deliberately != id, to prove resolution is by id
      file('main.md', { id: 'intro' }, 'See [a](node:alpha?display=footnote) and [b](node:beta?display=inline).'),
      file('sections/x.md', { id: 'alpha' }, 'Alpha body, links [c](node:gamma?display=overlay).'),
      file('sections/y.md', { id: 'beta' }, 'Beta body.'),
      file('sections/z.md', { id: 'gamma' }, 'Gamma body.'),
    ]
    const { records, orphans, missing } = flattenWeaveDocument(files, { mainPath: 'main.md' })

    expect(records.map((r) => r.id)).toEqual(['intro', 'alpha', 'gamma', 'beta'])
    expect(records[0].main).toBe(true)
    expect(records.slice(1).every((r) => r.main === undefined)).toBe(true)
    expect(orphans).toEqual([])
    expect(missing).toEqual([])
    // body has frontmatter stripped; links captured with display + text
    expect(records[0].body).toBe('See [a](node:alpha?display=footnote) and [b](node:beta?display=inline).')
    expect(records[0].links).toEqual([
      { id: 'alpha', display: 'footnote', text: 'a' },
      { id: 'beta', display: 'inline', text: 'b' },
    ])
  })

  it('appends orphans (never referenced from main) but still includes them', () => {
    const files = [
      file('main.md', { id: 'intro' }, 'Only [a](node:alpha?display=footnote).'),
      file('a.md', { id: 'alpha' }, 'Alpha.'),
      file('lonely.md', { id: 'orphan' }, 'Never linked.'),
    ]
    const { records, orphans } = flattenWeaveDocument(files, { mainId: 'intro' })
    expect(orphans).toEqual(['orphan'])
    expect(records.map((r) => r.id)).toEqual(['intro', 'alpha', 'orphan'])
  })

  it('reports dangling node refs without throwing', () => {
    const files = [file('main.md', { id: 'intro' }, 'Dead [x](node:ghost?display=footnote).')]
    const { records, missing } = flattenWeaveDocument(files)
    expect(records.map((r) => r.id)).toEqual(['intro'])
    expect(missing).toEqual(['ghost'])
  })

  it('is cycle-safe (mutually recursive references terminate)', () => {
    const files = [
      file('main.md', { id: 'a' }, 'go [b](node:b?display=stretch).'),
      file('b.md', { id: 'b' }, 'back [a](node:a?display=stretch) and [self](node:b?display=stretch).'),
    ]
    const { records } = flattenWeaveDocument(files, { mainId: 'a' })
    expect(records.map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('preserves unknown frontmatter keys (extra)', () => {
    const files = [file('main.md', { id: 'intro', title: 'T', custom: 'kept' }, 'Body.')]
    const { records } = flattenWeaveDocument(files)
    expect(records[0].frontmatter).toEqual({ id: 'intro', title: 'T', custom: 'kept' })
  })

  it('reports duplicate ids and keeps the first', () => {
    const files = [
      file('main.md', { id: 'intro' }, 'x'),
      file('one.md', { id: 'dup' }, 'first'),
      file('two.md', { id: 'dup' }, 'second'),
    ]
    const { duplicates, records } = flattenWeaveDocument(files, { mainId: 'intro' })
    expect(duplicates).toEqual([{ id: 'dup', kept: 'one.md', dropped: 'two.md' }])
    expect(records.find((r) => r.id === 'dup')?.body).toBe('first')
  })

  it('throws on empty input or missing main', () => {
    expect(() => flattenWeaveDocument([])).toThrow(/no files/i)
    expect(() => flattenWeaveDocument([file('a.md', { id: 'a' }, 'x')], { mainId: 'nope' })).toThrow(/main file not found/i)
  })

  it('serializes to one JSONL line per record, each valid JSON, fields ordered', () => {
    const files = [
      file('main.md', { id: 'intro' }, 'See [a](node:alpha?display=footnote).'),
      file('a.md', { id: 'alpha' }, 'Alpha.'),
    ]
    const { records } = flattenWeaveDocument(files, { mainId: 'intro' })
    const jsonl = recordsToJsonl(records)
    const lines = jsonl.trimEnd().split('\n')
    expect(lines).toHaveLength(2)
    const parsed = lines.map((l) => JSON.parse(l))
    expect(parsed[0].main).toBe(true)
    expect(parsed[1].main).toBeUndefined()
    expect(Object.keys(parsed[0])).toEqual(['id', 'path', 'main', 'frontmatter', 'links', 'body'])
  })

  it('derived markdown carries provenance markers and bodies', () => {
    const files = [
      file('main.md', { id: 'intro', title: 'Intro' }, '# Hello'),
      file('a.md', { id: 'alpha' }, 'Alpha.'),
    ]
    const { records } = flattenWeaveDocument(files, { mainId: 'intro' })
    const md = recordsToMarkdown(records)
    expect(md).toContain('<!-- weave:file id="intro" path="main.md" title="Intro" -->')
    expect(md).toContain('# Hello')
    expect(md).toContain('<!-- weave:file id="alpha" path="a.md" -->')
  })
})
