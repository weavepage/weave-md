import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { frontmatter } from 'micromark-extension-frontmatter'
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { gfmTable } from 'micromark-extension-gfm-table'
import { gfmTableFromMarkdown, gfmTableToMarkdown } from 'mdast-util-gfm-table'
import { gfmStrikethrough } from 'micromark-extension-gfm-strikethrough'
import { gfmStrikethroughFromMarkdown, gfmStrikethroughToMarkdown } from 'mdast-util-gfm-strikethrough'
import { gfmAutolinkLiteral } from 'micromark-extension-gfm-autolink-literal'
import { gfmAutolinkLiteralFromMarkdown, gfmAutolinkLiteralToMarkdown } from 'mdast-util-gfm-autolink-literal'
import { gfmTaskListItem } from 'micromark-extension-gfm-task-list-item'
import { gfmTaskListItemFromMarkdown, gfmTaskListItemToMarkdown } from 'mdast-util-gfm-task-list-item'
import { mathInline } from 'micromark-extension-math-inline'
import { mathInlineFromMarkdown, mathInlineToMarkdown } from 'mdast-util-math-inline'
import { sub } from 'micromark-extension-substitute'
import { subFromMarkdown, subToMarkdown } from 'mdast-util-substitute'
import type { Root } from 'mdast'
import type { Extension as MicromarkExtension } from 'micromark-util-types'
import type { Extension as MdastExtension } from 'mdast-util-from-markdown'
import type { Options as ToMarkdownOptions } from 'mdast-util-to-markdown'

const defaultMicromarkExtensions = [
  frontmatter(['yaml']),
  gfmTable(),
  gfmStrikethrough(),
  gfmAutolinkLiteral(),
  gfmTaskListItem(),
  mathInline(),
  sub()
]

const defaultMdastExtensions = [
  frontmatterFromMarkdown(['yaml']),
  gfmTableFromMarkdown(),
  gfmStrikethroughFromMarkdown(),
  gfmAutolinkLiteralFromMarkdown(),
  gfmTaskListItemFromMarkdown(),
  mathInlineFromMarkdown(),
  subFromMarkdown()
]

export function parseMdast(markdown: string, opts?: {
  micromarkExtensions?: MicromarkExtension[]
  mdastExtensions?: MdastExtension[]
}): Root {
  return fromMarkdown(markdown, {
    extensions: [
      ...defaultMicromarkExtensions,
      ...(opts?.micromarkExtensions ?? [])
    ],
    mdastExtensions: [
      ...defaultMdastExtensions,
      ...(opts?.mdastExtensions ?? [])
    ]
  })
}

const defaultToMarkdownExtensions = [
  gfmTableToMarkdown(),
  gfmStrikethroughToMarkdown(),
  gfmAutolinkLiteralToMarkdown(),
  gfmTaskListItemToMarkdown(),
  mathInlineToMarkdown(),
  subToMarkdown()
]

export function stringifyMdast(tree: Root, opts?: {
  toMarkdownExtensions?: ToMarkdownOptions['extensions']
}): string {
  return toMarkdown(tree, {
    extensions: [
      ...defaultToMarkdownExtensions,
      ...(opts?.toMarkdownExtensions ?? [])
    ]
  })
}
