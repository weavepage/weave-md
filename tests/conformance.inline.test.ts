import { describe, it, expect } from 'vitest'
import { readdir, readFile, access, constants } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const INLINE_DIR = join(__dirname, '../conformance/inline')

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
  input: string
  ast?: string
  errors?: string
}

async function findTestCases(): Promise<TestCase[]> {
  const entries = await readdir(INLINE_DIR, { withFileTypes: true })
  const tests: TestCase[] = []
  
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') {
      const baseName = entry.name.replace(/\.md$/, '')
      const tc: TestCase = { 
        name: baseName, 
        input: join(INLINE_DIR, entry.name)
      }
      if (await fileExists(join(INLINE_DIR, `${baseName}.ast.json`))) {
        tc.ast = join(INLINE_DIR, `${baseName}.ast.json`)
      }
      if (await fileExists(join(INLINE_DIR, `${baseName}.errors.json`))) {
        tc.errors = join(INLINE_DIR, `${baseName}.errors.json`)
      }
      tests.push(tc)
    }
  }
  return tests.sort((a, b) => a.name.localeCompare(b.name))
}

describe('conformance (inline)', async () => {
  const testCases = await findTestCases()

  for (const tc of testCases) {
    if (tc.errors) {
      it(`${tc.name} - errors`, async () => {
        const { validateInlineSyntax, parseFrontmatter } = await import('@weave-md/validate')
        const input = await readFile(tc.input, 'utf-8')
        const expected = JSON.parse(await readFile(tc.errors!, 'utf-8'))
        
        const { body } = parseFrontmatter(input)
        const diagnostics = validateInlineSyntax(body)
        
        // Check that we got the expected error types
        const actualTypes = diagnostics.map(d => d.code)
        const expectedTypes = expected.errors.map((e: any) => e.type)
        
        expect(actualTypes).toEqual(expectedTypes)
        
        // Optionally check line numbers if specified
        for (let i = 0; i < expected.errors.length; i++) {
          if (expected.errors[i].line !== undefined) {
            // Adjust for frontmatter offset - body starts after frontmatter
            const frontmatterLines = input.split('---')[1]?.split('\n').length || 0
            const expectedLine = expected.errors[i].line - frontmatterLines - 1
            expect(diagnostics[i]?.position?.line).toBe(expectedLine)
          }
        }
      })
    }

    if (tc.ast) {
      it(`${tc.name} - valid syntax`, async () => {
        const { validateInlineSyntax, parseFrontmatter } = await import('@weave-md/validate')
        const input = await readFile(tc.input, 'utf-8')
        
        const { body } = parseFrontmatter(input)
        const diagnostics = validateInlineSyntax(body)
        
        // Valid syntax tests should have no errors (warnings are ok for some tests)
        const errors = diagnostics.filter(d => d.severity === 'error')
        expect(errors).toEqual([])
      })
    }
  }
})
