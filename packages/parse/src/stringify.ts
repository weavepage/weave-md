import { toMarkdown } from 'mdast-util-to-markdown'
import { stringify as stringifyYaml } from 'yaml'
import { gfmTableToMarkdown } from 'mdast-util-gfm-table'
import { gfmStrikethroughToMarkdown } from 'mdast-util-gfm-strikethrough'
import { gfmAutolinkLiteralToMarkdown } from 'mdast-util-gfm-autolink-literal'
import { mathInlineToMarkdown } from 'mdast-util-math-inline'
import type { Options as ToMarkdownOptions } from 'mdast-util-to-markdown'
import type { WeaveDocument, WeaveExtension } from './types.js'
import { formatNodeUrl, type NodeRef } from '@weave-md/core'

export function stringifyWeaveDocument(
  doc: WeaveDocument,
  options?: { extensions?: WeaveExtension[] }
): string {
  const { extra, ...knownFields } = doc.frontmatter
  const frontmatterToSerialize = extra ? { ...knownFields, ...extra } : knownFields
  let output = '---\n' + stringifyYaml(frontmatterToSerialize) + '---\n\n'
  
  const userToMarkdownExtensions = collectToMarkdownExtensions(options?.extensions)
  
  output += toMarkdown(doc.tree, {
    extensions: [
      gfmTableToMarkdown(),
      gfmStrikethroughToMarkdown(),
      gfmAutolinkLiteralToMarkdown(),
      mathInlineToMarkdown(),
      ...userToMarkdownExtensions,
      {
        handlers: {
          weaveNodeLink(node: any, _parent: any, state: any, info: any) {
            const ref: NodeRef = {
              id: node.targetId,
              ...(node.display && { display: node.display }),
              ...(node.exportHint && { export: node.exportHint }),
              ...node.unknownParams
            }
            const url = formatNodeUrl(ref)
            const tracker = state.createTracker(info)
            const exit = state.enter('weaveNodeLink')
            const text = state.containerPhrasing(node, tracker.current())
            exit()
            return `[${text}](${url})`
          },
          
          weaveMathBlock(node: any) {
            const value = node.value.endsWith('\n') ? node.value : node.value + '\n'
            return '```math\n' + value + '```\n'
          },
          
          weaveMediaBlock(node: any) {
            let yamlContent = node.config != null ? stringifyYaml(node.config) : ''
            if (yamlContent && !yamlContent.endsWith('\n')) {
              yamlContent += '\n'
            }
            return '```' + node.mediaType + '\n' + yamlContent + '```\n'
          },
          
          weavePreformatted(node: any) {
            const value = node.value.endsWith('\n') ? node.value : node.value + '\n'
            return '```pre\n' + value + '```\n'
          }
        }
      } as any
    ]
  })
  
  return output
}

function collectToMarkdownExtensions(extensions?: WeaveExtension[]): NonNullable<ToMarkdownOptions['extensions']> {
  if (!extensions) return []
  const result: NonNullable<ToMarkdownOptions['extensions']> = []
  for (const ext of extensions) {
    if (ext.toMarkdownExtensions) {
      result.push(...ext.toMarkdownExtensions)
    }
  }
  return result
}
