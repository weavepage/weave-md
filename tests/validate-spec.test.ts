import { describe, it, expect } from 'vitest'
import { readdir, readFile, stat } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const REPO_ROOT = join(__dirname, '..')
const SPEC_DIR = join(REPO_ROOT, 'packages/core/spec')
const SCHEMA_DIR = join(REPO_ROOT, 'packages/core/schema')
const CONFORMANCE_DIR = join(REPO_ROOT, 'conformance')

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false
    }
    throw error
  }
}

async function findFiles(dir: string, extension: string, recursive = true): Promise<string[]> {
  const files: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory() && recursive && !entry.name.startsWith('.')) {
      const subFiles = await findFiles(fullPath, extension, recursive)
      files.push(...subFiles)
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(fullPath)
    }
  }

  return files
}

describe('Spec Structure', () => {
  const requiredSpecFiles = [
    'index.md',
    'conformance.md',
    'node-links.md',
    'frontmatter.md'
  ]

  for (const file of requiredSpecFiles) {
    it(`has required spec file: ${file}`, async () => {
      const path = join(SPEC_DIR, file)
      expect(await fileExists(path)).toBe(true)
    })
  }
})

describe('Schemas', () => {
  const requiredSchemas = [
    'weave-ast.schema.json',
    'weave-format.schema.json',
    'weave-graph.schema.json'
  ]

  for (const schema of requiredSchemas) {
    it(`has required schema: ${schema}`, async () => {
      const path = join(SCHEMA_DIR, schema)
      expect(await fileExists(path)).toBe(true)
    })

    it(`${schema} is valid JSON`, async () => {
      const path = join(SCHEMA_DIR, schema)
      if (await fileExists(path)) {
        const content = await readFile(path, 'utf-8')
        expect(() => JSON.parse(content)).not.toThrow()
      }
    })
  }
})

describe('Schema References', () => {
  it('schemas are referenced in spec/index.md', async () => {
    const indexPath = join(SPEC_DIR, 'index.md')
    if (!await fileExists(indexPath)) {
      return // Skip if index doesn't exist (caught by other test)
    }

    const indexContent = await readFile(indexPath, 'utf-8')
    const schemas = await findFiles(SCHEMA_DIR, '.json', false)

    for (const schemaPath of schemas) {
      const schemaName = basename(schemaPath)
      // This is a warning-level check, so we just log if missing
      if (!indexContent.includes(schemaName)) {
        console.warn(`Warning: Schema ${schemaName} not referenced in spec/index.md`)
      }
    }
  })
})

describe('Conformance Tests', () => {
  it('has conformance/README.md', async () => {
    const conformanceReadme = join(CONFORMANCE_DIR, 'README.md')
    expect(await fileExists(conformanceReadme)).toBe(true)
  })

  it('test suites are documented in README', async () => {
    const conformanceReadme = join(CONFORMANCE_DIR, 'README.md')
    if (!await fileExists(conformanceReadme)) return

    const readmeContent = await readFile(conformanceReadme, 'utf-8')
    const testSuites = await readdir(CONFORMANCE_DIR, { withFileTypes: true })
    const suiteDirs = testSuites
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => e.name)

    for (const suite of suiteDirs) {
      if (!readmeContent.includes(suite)) {
        console.warn(`Warning: Test suite '${suite}' not documented in conformance/README.md`)
      }
    }
  })

  it('test suites have test cases', async () => {
    const testSuites = await readdir(CONFORMANCE_DIR, { withFileTypes: true })
    const suiteDirs = testSuites
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => e.name)

    for (const suite of suiteDirs) {
      const suitePath = join(CONFORMANCE_DIR, suite)
      const testFiles = await findFiles(suitePath, '.md', false)
      const actualTests = testFiles.filter(f => !f.endsWith('README.md'))

      if (actualTests.length === 0) {
        console.warn(`Warning: Test suite '${suite}' has no test cases`)
      }
    }
  })

  it('test cases have expected outputs', async () => {
    const testSuites = await readdir(CONFORMANCE_DIR, { withFileTypes: true })
    const suiteDirs = testSuites
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => e.name)

    for (const suite of suiteDirs) {
      const suitePath = join(CONFORMANCE_DIR, suite)
      const testFiles = await findFiles(suitePath, '.md', false)
      const actualTests = testFiles.filter(f => !f.endsWith('README.md') && !f.endsWith('.export.md'))

      for (const testFile of actualTests) {
        const baseName = testFile.replace(/\.md$/, '')
        const astPath = `${baseName}.ast.json`
        const graphPath = `${baseName}.graph.json`
        const errorsPath = `${baseName}.errors.json`

        const hasAst = await fileExists(astPath)
        const hasGraph = await fileExists(graphPath)
        const hasErrors = await fileExists(errorsPath)

        if (!hasAst && !hasGraph && !hasErrors) {
          const testName = basename(testFile)
          console.warn(`Warning: Test ${suite}/${testName} has no expected outputs`)
        }
      }
    }
  })
})

describe('Spec Extensions', () => {
  const extensionSpecs = ['node-links.md', 'frontmatter.md']

  for (const specFile of extensionSpecs) {
    const extensionName = basename(specFile, '.md')

    it(`${extensionName} has conformance test suite`, async () => {
      const specPath = join(SPEC_DIR, specFile)
      if (!await fileExists(specPath)) return

      const conformanceSuite = join(CONFORMANCE_DIR, extensionName)
      if (!await fileExists(conformanceSuite)) {
        console.warn(`Warning: Spec extension '${extensionName}' has no conformance test suite`)
      }
    })
  }
})

describe('Package READMEs', () => {
  const packages = ['core', 'validate', 'basic', 'parse']

  for (const pkg of packages) {
    it(`@weave-md/${pkg} has README.md`, async () => {
      const readmePath = join(REPO_ROOT, 'packages', pkg, 'README.md')
      expect(await fileExists(readmePath)).toBe(true)
    })
  }

  it('has root README.md', async () => {
    const rootReadme = join(REPO_ROOT, 'README.md')
    expect(await fileExists(rootReadme)).toBe(true)
  })
})
