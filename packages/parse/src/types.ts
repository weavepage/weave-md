import type { Plugin } from 'unified'
import type { Root, PhrasingContent } from 'mdast'
import type { Extension as MicromarkExtension } from 'micromark-util-types'
import type { Extension as MdastExtension } from 'mdast-util-from-markdown'
import type { Options as ToMarkdownOptions } from 'mdast-util-to-markdown'
import type {
  Section,
  NodeRef,
  SourcePosition,
  Link,
  Diagnostic,
  DiagnosticSeverity,
  DisplayType,
  ExportHint,
  DocAst
} from '@weave-md/core'

export type WeavePlugin<TOpts = unknown> = Plugin<[TOpts?], Root>

export interface WeaveExtension {
  plugins?: Array<WeavePlugin | [WeavePlugin, unknown]>
  micromarkExtensions?: MicromarkExtension[]
  mdastExtensions?: MdastExtension[]
  toMarkdownExtensions?: ToMarkdownOptions['extensions']
}

export interface ParseOptions {
  plugins?: Array<WeavePlugin | [WeavePlugin, unknown]>
  extensions?: WeaveExtension[]
  strict?: boolean
  stripPositions?: boolean
  validate?: boolean
  filePath?: string
}

export { Section, NodeRef, SourcePosition, Link, Diagnostic, DiagnosticSeverity, DisplayType, ExportHint }

export interface WeaveNodeLink {
  type: 'weaveNodeLink'
  targetId: string
  display?: DisplayType
  exportHint?: ExportHint
  unknownParams: Record<string, string | true>
  children: PhrasingContent[]
  position?: {
    start: { line: number; column: number; offset?: number }
    end: { line: number; column: number; offset?: number }
  }
  diagnostics?: Diagnostic[]
}

export interface WeaveMathBlock {
  type: 'weaveMathBlock'
  value: string
  position?: {
    start: { line: number; column: number; offset?: number }
    end: { line: number; column: number; offset?: number }
  }
}

export interface WeaveMediaBlock {
  type: 'weaveMediaBlock'
  mediaType: 'image' | 'gallery' | 'audio' | 'video' | 'embed' | 'voiceover'
  config: Record<string, unknown>
  position?: {
    start: { line: number; column: number; offset?: number }
    end: { line: number; column: number; offset?: number }
  }
  diagnostics?: Diagnostic[]
}

export interface WeavePreformatted {
  type: 'weavePreformatted'
  value: string
  position?: {
    start: { line: number; column: number; offset?: number }
    end: { line: number; column: number; offset?: number }
  }
}

export type WeaveFrontmatter = Omit<Section, 'body'>

export interface WeaveAst extends DocAst {
  diagnostics?: Diagnostic[]
}

export type DiagnosticCode =
  | 'WEAVE_FRONTMATTER_MISSING'
  | 'WEAVE_FRONTMATTER_INVALID'
  | 'WEAVE_FRONTMATTER_ID_MISSING'
  | 'WEAVE_FRONTMATTER_UNKNOWN_FIELD'
  | 'WEAVE_FRONTMATTER_ID_DUPLICATE'
  | 'WEAVE_NODE_URL_INVALID'
  | 'WEAVE_NODE_URL_UNKNOWN_PARAM'
  | 'WEAVE_MEDIA_YAML_INVALID'
  | 'WEAVE_MEDIA_CONFIG_INVALID'

export interface ExtendedBlock {
  type: 'math' | 'media' | 'preformatted'
  position: SourcePosition
  content: unknown
}

export interface WeaveDocument {
  frontmatter: WeaveFrontmatter
  tree: Root
}

export class WeaveParseError extends Error {
  constructor(public code: DiagnosticCode, message: string) {
    super(message)
    this.name = 'WeaveParseError'
  }
}

export class WeaveDiagnosticsError extends Error {
  constructor(public diagnostics: Diagnostic[]) {
    super(`${diagnostics.length} error(s): ${diagnostics.map(d => d.message).join('; ')}`)
    this.name = 'WeaveDiagnosticsError'
  }
}
