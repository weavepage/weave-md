import stripBom from 'strip-bom'
import { unified } from 'unified'
import { VFile } from 'vfile'
import type { Root } from 'mdast'
import { parseMdast } from './mdast.js'
import { 
  transformNodeLinks, 
  transformWeaveBlocks, 
  extractFrontmatter,
  collectDiagnostics 
} from './transforms.js'
import { compileToWeaveAst, stripDebugInfoFromAst } from './compile.js'
import { WeaveDiagnosticsError } from './types.js'
import type { 
  ParseOptions, 
  WeaveAst, 
  WeaveFrontmatter,
  Diagnostic,
  WeaveExtension,
  WeavePlugin
} from './types.js'
import type { Extension as MicromarkExtension } from 'micromark-util-types'
import type { Extension as MdastExtension } from 'mdast-util-from-markdown'

export function parseToMdast(markdown: string): {
  tree: Root
  frontmatter: WeaveFrontmatter
  frontmatterNode: { position?: { end?: { offset?: number } } }
  diagnostics: Diagnostic[]
  sourceText: string
} {
  const cleanMarkdown = stripBom(markdown)
  const tree = parseMdast(cleanMarkdown)
  const diagnostics: Diagnostic[] = []
  
  const { frontmatter, node: frontmatterNode } = extractFrontmatter(tree, diagnostics)
  
  transformNodeLinks(tree)
  transformWeaveBlocks(tree)
  
  collectDiagnostics(tree, diagnostics)
  
  return { tree, frontmatter, frontmatterNode, diagnostics, sourceText: cleanMarkdown }
}

export function parseWeaveDocument(markdown: string, options?: ParseOptions): WeaveAst {
  const { tree, frontmatter, frontmatterNode, diagnostics, sourceText } = parseToMdast(markdown)
  
  const ast = compileToWeaveAst(tree, frontmatter, frontmatterNode, sourceText, diagnostics)
  
  if (options?.stripPositions) {
    stripDebugInfoFromAst(ast)
  }
  
  return ast
}

export async function parseWeaveDocumentAsync(
  markdown: string,
  options: ParseOptions = {}
): Promise<WeaveAst> {
  const cleanMarkdown = stripBom(markdown)
  
  const tree = parseMdast(cleanMarkdown, {
    micromarkExtensions: collectMicromarkExtensions(options.extensions),
    mdastExtensions: collectMdastExtensions(options.extensions)
  })
  
  const diagnostics: Diagnostic[] = []
  
  const { frontmatter, node: frontmatterNode } = extractFrontmatter(tree, diagnostics)
  
  const allPlugins = collectPlugins(options.plugins, options.extensions)
  let transformedTree = tree
  
  if (allPlugins.length > 0) {
    const processor = unified()
    for (const plugin of allPlugins) {
      if (Array.isArray(plugin)) {
        processor.use(plugin[0], plugin[1])
      } else {
        processor.use(plugin)
      }
    }
    
    const file = new VFile({ value: cleanMarkdown, path: options.filePath })
    file.data.frontmatter = frontmatter
    const result = await processor.run(tree, file)
    transformedTree = result as Root
  }
  
  transformNodeLinks(transformedTree)
  transformWeaveBlocks(transformedTree)
  
  collectDiagnostics(transformedTree, diagnostics)
  
  if (options.strict) {
    const errors = diagnostics.filter(d => d.severity === 'error')
    if (errors.length > 0) {
      throw new WeaveDiagnosticsError(errors)
    }
  }
  
  const ast = compileToWeaveAst(transformedTree, frontmatter, frontmatterNode, cleanMarkdown, diagnostics)
  
  if (options.stripPositions) {
    stripDebugInfoFromAst(ast)
  }
  
  return ast
}

function collectMicromarkExtensions(extensions?: WeaveExtension[]): MicromarkExtension[] {
  if (!extensions) return []
  return extensions.flatMap(ext => ext.micromarkExtensions ?? [])
}

function collectMdastExtensions(extensions?: WeaveExtension[]): MdastExtension[] {
  if (!extensions) return []
  return extensions.flatMap(ext => ext.mdastExtensions ?? [])
}

function collectPlugins(
  plugins?: Array<WeavePlugin | [WeavePlugin, unknown]>,
  extensions?: WeaveExtension[]
): Array<WeavePlugin | [WeavePlugin, unknown]> {
  const result: Array<WeavePlugin | [WeavePlugin, unknown]> = []
  
  if (plugins) {
    result.push(...plugins)
  }
  
  if (extensions) {
    for (const ext of extensions) {
      if (ext.plugins) {
        result.push(...ext.plugins)
      }
    }
  }
  
  return result
}
