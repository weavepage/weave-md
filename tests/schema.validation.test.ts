import { describe, it, expect, beforeAll } from 'vitest'
import { readdir, readFile, access, constants } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const CONFORMANCE_DIR = join(__dirname, '../conformance')
const SCHEMA_DIR = join(__dirname, '../packages/core/schema')

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
  suite: string
  ast?: string
  graph?: string
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
      const tc: TestCase = { name: baseName, dir, suite: dir.split('/').pop()! }
      if (await fileExists(join(dir, `${baseName}.ast.json`))) tc.ast = join(dir, `${baseName}.ast.json`)
      if (await fileExists(join(dir, `${baseName}.graph.json`))) tc.graph = join(dir, `${baseName}.graph.json`)
      tests.push(tc)
    }
  }
  return tests
}

describe('Schema Validation', () => {
  let ajv: Ajv
  let astSchema: object
  let graphSchema: object
  let formatSchema: object

  beforeAll(async () => {
    ajv = new Ajv({ allErrors: true, strict: false })
    addFormats(ajv)

    // Load schemas
    formatSchema = JSON.parse(await readFile(join(SCHEMA_DIR, 'weave-format.schema.json'), 'utf-8'))
    astSchema = JSON.parse(await readFile(join(SCHEMA_DIR, 'weave-ast.schema.json'), 'utf-8'))
    graphSchema = JSON.parse(await readFile(join(SCHEMA_DIR, 'weave-graph.schema.json'), 'utf-8'))

    // Add format schema first so it can be referenced
    ajv.addSchema(formatSchema, 'https://weave-md.org/schema/weave-format.schema.json')
  })

  // Validate inline extension nodes that the parser produces match weave-format.schema.json
  describe('Inline extension nodes match weave-format.schema.json', () => {
    it('InlineMath nodes match schema', async () => {
      const { parseMdast } = await import('@weave-md/parse')
      const tree = parseMdast('Test :math[x^2 + y^2] formula')
      
      const para = tree.children[0] as any
      const mathNode = para.children?.find((n: any) => n.type === 'inlineMath')
      
      expect(mathNode).toBeDefined()
      
      const inlineMathSchema = (formatSchema as any).definitions.InlineMath
      const validate = ajv.compile(inlineMathSchema)
      const valid = validate(mathNode)
      
      if (!valid) {
        const errors = validate.errors?.map(e => `${e.instancePath} ${e.message}`).join('\n')
        expect.fail(`InlineMath node doesn't match schema:\n${errors}\nNode: ${JSON.stringify(mathNode)}`)
      }
      expect(valid).toBe(true)
    })

    it('Sub nodes match schema', async () => {
      const { parseMdast } = await import('@weave-md/parse')
      const tree = parseMdast('Test :sub[short]{long explanation} text')
      
      const para = tree.children[0] as any
      const subNode = para.children?.find((n: any) => n.type === 'sub')
      
      expect(subNode).toBeDefined()
      
      const subSchema = (formatSchema as any).definitions.Sub
      const validate = ajv.compile(subSchema)
      const valid = validate(subNode)
      
      if (!valid) {
        const errors = validate.errors?.map(e => `${e.instancePath} ${e.message}`).join('\n')
        expect.fail(`Sub node doesn't match schema:\n${errors}\nNode: ${JSON.stringify(subNode)}`)
      }
      expect(valid).toBe(true)
    })
  })

  describe('AST conformance outputs match weave-ast.schema.json', async () => {
    const testCases = await findTestCases(CONFORMANCE_DIR)

    for (const tc of testCases) {
      // Skip test cases that intentionally test malformed/error conditions
      if (!tc.ast || tc.name.includes('malformed') || tc.name.includes('error')) continue

      it(`${tc.suite}/${tc.name}.ast.json validates against schema`, async () => {
        const astData = JSON.parse(await readFile(tc.ast!, 'utf-8'))
        const validate = ajv.compile(astSchema)
        const valid = validate(astData)
        
        if (!valid) {
          const errors = validate.errors?.map(e => `${e.instancePath} ${e.message}`).join('\n')
          expect.fail(`Schema validation failed:\n${errors}`)
        }
        
        expect(valid).toBe(true)
      })
    }
  })

  describe('Graph conformance outputs match weave-graph.schema.json', async () => {
    const testCases = await findTestCases(CONFORMANCE_DIR)

    for (const tc of testCases) {
      if (!tc.graph) continue

      it(`${tc.suite}/${tc.name}.graph.json validates against schema`, async () => {
        const graphData = JSON.parse(await readFile(tc.graph!, 'utf-8'))
        const validate = ajv.compile(graphSchema)
        const valid = validate(graphData)
        
        if (!valid) {
          const errors = validate.errors?.map(e => `${e.instancePath} ${e.message}`).join('\n')
          expect.fail(`Schema validation failed:\n${errors}`)
        }
        
        expect(valid).toBe(true)
      })
    }
  })

})
