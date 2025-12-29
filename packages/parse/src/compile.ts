import { visit } from 'unist-util-visit'
import type { Root, PhrasingContent } from 'mdast'
import type { 
  WeaveAst, 
  Section, 
  Link, 
  SourcePosition, 
  WeaveFrontmatter,
  Diagnostic,
  WeaveNodeLink
} from './types.js'

export function compileToWeaveAst(
  tree: Root,
  frontmatter: WeaveFrontmatter,
  frontmatterNode: { position?: { end?: { offset?: number } } },
  sourceText: string,
  diagnostics: Diagnostic[]
): WeaveAst {
  const links: Link[] = []
  
  visit(tree, 'weaveNodeLink', (node: any) => {
    const weaveNode = node as WeaveNodeLink
    const rawText = phrasingToText(weaveNode.children)
    const text = rawText.trim() === '' ? '' : rawText
    
    links.push({
      ref: {
        id: weaveNode.targetId,
        ...(weaveNode.display && { display: weaveNode.display }),
        ...(weaveNode.exportHint && { export: weaveNode.exportHint }),
        ...weaveNode.unknownParams
      },
      text,
      sourceId: frontmatter.id,
      start: positionToSourcePosition(weaveNode.position?.start) ?? { line: 0, character: 0 },
      end: positionToSourcePosition(weaveNode.position?.end) ?? { line: 0, character: 0 }
    })
  })
  
  const bodyStartOffset = findBodyStartOffset(sourceText, frontmatterNode)
  const body = sourceText.slice(bodyStartOffset).trim()
  
  const section: Section = {
    id: frontmatter.id,
    ...(frontmatter.title && { title: frontmatter.title }),
    ...(frontmatter.peek && { peek: frontmatter.peek }),
    body
  }
  
  return {
    sections: [section],
    links,
    ...(diagnostics.length > 0 && { diagnostics })
  }
}

function phrasingToText(children: PhrasingContent[]): string {
  return children.map(child => {
    switch (child.type) {
      case 'text':
        return child.value
      case 'inlineCode':
        return child.value
      case 'image':
        return child.alt || ''
      case 'break':
        return ' '
      default:
        if ('children' in child) {
          return phrasingToText((child as any).children)
        }
        return ''
    }
  }).join('')
}

function positionToSourcePosition(pos?: { line: number; column: number }): SourcePosition | undefined {
  if (!pos) return undefined
  return { line: pos.line - 1, character: pos.column - 1 }
}

function findBodyStartOffset(source: string, frontmatterNode?: { position?: { end?: { offset?: number } } }): number {
  if (frontmatterNode?.position?.end?.offset !== undefined) {
    return frontmatterNode.position.end.offset
  }
  const match = source.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)
  return match ? match[0].length : 0
}

export function stripDebugInfoFromAst(ast: WeaveAst): void {
  delete ast.diagnostics
  for (const link of ast.links) {
    delete (link as any).start
    delete (link as any).end
  }
}
