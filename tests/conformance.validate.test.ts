import { describe, it, expect } from 'vitest'
import { readdir, readFile, access, constants } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const CONFORMANCE_DIR = join(__dirname, '../conformance')

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

interface TestCase {
  name: string
  dir: string
  input: string
  suite: string
  ast?: string
  graph?: string
  errors?: string
}

async function findTestCases(dir: string): Promise<TestCase[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const tests: TestCase[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      tests.push(...await findTestCases(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md' && !entry.name.endsWith('.export.md')) {
      const baseName = entry.name.replace(/\.md$/, '')
      const tc: TestCase = { name: baseName, dir, input: fullPath, suite: dir.split('/').pop()! }
      if (await fileExists(join(dir, `${baseName}.ast.json`))) tc.ast = join(dir, `${baseName}.ast.json`)
      if (await fileExists(join(dir, `${baseName}.graph.json`))) tc.graph = join(dir, `${baseName}.graph.json`)
      if (await fileExists(join(dir, `${baseName}.errors.json`))) tc.errors = join(dir, `${baseName}.errors.json`)
      tests.push(tc)
    }
  }
  return tests
}

async function findRelatedFiles(tc: TestCase): Promise<string[]> {
  const entries = await readdir(tc.dir, { withFileTypes: true })
  return entries
    .filter((e): e is import('fs').Dirent & { name: string } => 
      e.isFile() && e.name.endsWith('.md') && 
      (e.name.replace(/\.md$/, '').startsWith(tc.name + '-') || e.name === tc.name + '.md'))
    .map(e => join(tc.dir, e.name))
    .sort()
}

describe('conformance (validate)', async () => {
  const testCases = await findTestCases(CONFORMANCE_DIR)

  for (const tc of testCases) {
    const name = `${tc.suite}/${tc.name}`

    if (tc.errors && !tc.ast && !tc.graph) {
      it(name, async () => {
        const { parseFrontmatter } = await import('@weave-md/validate')
        const input = await readFile(tc.input, 'utf-8')
        const expected = JSON.parse(await readFile(tc.errors!, 'utf-8'))
        const { frontmatter, diagnostics } = parseFrontmatter(input)
        const actualTypes: string[] = []
        if (!frontmatter?.id && expected.errors.some((e: any) => e.type === 'missing_required_field')) actualTypes.push('missing_required_field')
        if (diagnostics.some((d: any) => d.code === 'invalid-yaml') && expected.errors.some((e: any) => e.type === 'invalid_yaml')) actualTypes.push('invalid_yaml')
        expect(actualTypes.length).toBeGreaterThan(0)
      })
      continue
    }

    if (!tc.ast && !tc.graph) continue

    if (tc.ast) {
      it(`${name} - AST`, async () => {
        const { parseFrontmatter, extractNodeLinks } = await import('@weave-md/validate')
        const input = await readFile(tc.input, 'utf-8')
        const expected = JSON.parse(await readFile(tc.ast!, 'utf-8'))
        const { frontmatter, body } = parseFrontmatter(input)
        const { links } = extractNodeLinks(body, frontmatter?.id)
        const actual = {
          sections: frontmatter ? [{ id: frontmatter.id, ...(frontmatter.title && { title: frontmatter.title }), ...(frontmatter.peek && { peek: frontmatter.peek }), body: body.trim() }] : [],
          links: links.map((l: any) => ({ ref: l.ref, text: l.text, sourceId: l.sourceId }))
        }
        expect(actual).toEqual(expected)
      })
    }

    if (tc.graph) {
      it(`${name} - Graph`, async () => {
        const { parseFrontmatter, extractNodeLinks } = await import('@weave-md/validate')
        const input = await readFile(tc.input, 'utf-8')
        const expected = JSON.parse(await readFile(tc.graph!, 'utf-8'))
        const { frontmatter, body } = parseFrontmatter(input)
        const { links, errors } = extractNodeLinks(body, frontmatter?.id)
        const relatedFiles = await findRelatedFiles(tc)
        const allLinks = [...links], allErrors = [...errors], allSections: any[] = frontmatter ? [frontmatter] : []

        for (const filePath of relatedFiles) {
          if (filePath === tc.input) continue
          const { frontmatter: fm, body: b } = parseFrontmatter(await readFile(filePath, 'utf-8'))
          if (fm?.id) {
            allSections.push(fm)
            const { links: l, errors: e } = extractNodeLinks(b, fm.id)
            allLinks.push(...l)
            allErrors.push(...e)
          }
        }

        const errorPositions = new Set(allErrors.filter((e: any) => e.position).map((e: any) => `${e.position.line}:${e.position.character}`))
        const edgeMap = new Map<string, number>()
        for (const link of allLinks) {
          if (errorPositions.has(`${link.start.line}:${link.start.character}`)) continue
          const key = `${link.sourceId}->${decodeURIComponent(link.ref.id)}`
          edgeMap.set(key, (edgeMap.get(key) || 0) + 1)
        }

        const nodes: Record<string, any> = {}
        for (const s of allSections) {
          const outgoing: Record<string, number> = {}, incoming: Record<string, number> = {}
          for (const [k, v] of edgeMap) {
            const [from, to] = k.split('->')
            if (from === s.id) outgoing[to] = v
            if (to === s.id) incoming[from] = v
          }
          nodes[s.id] = { outgoing, incoming }
        }
        expect({ nodes }).toEqual(expected)
      })
    }
  }
})
