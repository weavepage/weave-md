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
      if (await fileExists(join(dir, `${baseName}.errors.json`))) tc.errors = join(dir, `${baseName}.errors.json`)
      tests.push(tc)
    }
  }
  return tests
}

describe('conformance (parse)', async () => {
  const testCases = await findTestCases(CONFORMANCE_DIR)

  for (const tc of testCases) {
    if (!tc.ast) continue

    it(`${tc.suite}/${tc.name} - AST`, async () => {
      const { parseWeaveDocument, stripDebugInfoFromAst } = await import('@weave-md/parse')
      const input = await readFile(tc.input, 'utf-8')
      const expected = JSON.parse(await readFile(tc.ast!, 'utf-8'))

      let ast
      try {
        ast = parseWeaveDocument(input)
      } catch {
        if (tc.errors) return
        throw new Error('Unexpected parse error')
      }

      stripDebugInfoFromAst(ast)
      expect({ sections: ast.sections, links: ast.links }).toEqual(expected)
    })
  }
})
