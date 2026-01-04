import { visit, SKIP } from 'unist-util-visit'
import { parse as parseYaml } from 'yaml'
import { parseNodeUrl as coreParseNodeUrl } from '@weave-md/core'
import type { Root, PhrasingContent } from 'mdast'
import { 
  WeaveParseError,
  type WeaveNodeLink, 
  type WeaveMathBlock, 
  type WeaveMediaBlock, 
  type WeavePreformatted,
  type WeaveFrontmatter,
  type Diagnostic
} from './types.js'

export function transformNodeLinks(tree: Root): Root {
  visit(tree, 'link', (node: any, index, parent) => {
    if (!node.url.startsWith('node:')) return
    if (index === undefined || !parent) return
    
    const diagnostics: Diagnostic[] = []
    const result = coreParseNodeUrl(node.url)
    
    let id: string
    let display: string | undefined
    let exportVal: string | undefined
    let unknownParams: Record<string, string | true> = {}
    
    if (result.success) {
      const ref = result.ref
      id = ref.id
      display = ref.display
      exportVal = ref.export
      
      // Extract unknown params and emit info diagnostics per spec
      const knownKeys = new Set(['id', 'display', 'export'])
      for (const key of Object.keys(ref)) {
        if (!knownKeys.has(key)) {
          const val = ref[key]
          unknownParams[key] = val === true ? true : String(val)
          diagnostics.push({
            severity: 'info',
            code: 'WEAVE_NODE_URL_UNKNOWN_PARAM',
            message: `Unknown node URL parameter: ${key}`
          })
        }
      }
    } else {
      // Parse failed - extract raw ID for best-effort
      const urlWithoutScheme = node.url.slice(5)
      const qIndex = urlWithoutScheme.indexOf('?')
      id = qIndex === -1 ? urlWithoutScheme : urlWithoutScheme.slice(0, qIndex)
      diagnostics.push({ 
        severity: 'error', 
        code: 'WEAVE_NODE_URL_INVALID', 
        message: result.error 
      })
    }
    
    const weaveNode: WeaveNodeLink = {
      type: 'weaveNodeLink',
      targetId: id,
      display: display as any,
      exportHint: exportVal as any,
      unknownParams,
      children: node.children as PhrasingContent[],
      position: node.position,
      ...(diagnostics.length > 0 && { diagnostics })
    }
    
    parent.children[index] = weaveNode as any
    return SKIP
  })
  return tree
}

export function transformWeaveBlocks(tree: Root): Root {
  const mediaTypes = ['image', 'gallery', 'audio', 'video', 'embed', 'voiceover']
  
  visit(tree, 'code', (node: any, index, parent) => {
    if (!node.lang) return
    if (index === undefined || !parent) return
    
    if (node.lang === 'math') {
      const mathBlock: WeaveMathBlock = {
        type: 'weaveMathBlock',
        value: node.value,
        position: node.position
      }
      parent.children[index] = mathBlock as any
      return SKIP
    }
    
    if (mediaTypes.includes(node.lang)) {
      let config: Record<string, unknown>
      let nodeDiagnostics: Diagnostic[] | undefined
      
      try {
        config = parseYaml(node.value) ?? {}
        nodeDiagnostics = validateMediaConfig(node.lang, config)
      } catch (err) {
        config = {}
        nodeDiagnostics = [{ 
          severity: 'error', 
          code: 'WEAVE_MEDIA_YAML_INVALID', 
          message: `Invalid YAML: ${err}` 
        }]
      }
      
      const mediaBlock: WeaveMediaBlock = {
        type: 'weaveMediaBlock',
        mediaType: node.lang as any,
        config,
        position: node.position,
        ...(nodeDiagnostics && { diagnostics: nodeDiagnostics })
      }
      parent.children[index] = mediaBlock as any
      return SKIP
    }
    
    if (node.lang === 'pre') {
      const preBlock: WeavePreformatted = {
        type: 'weavePreformatted',
        value: node.value,
        position: node.position
      }
      parent.children[index] = preBlock as any
      return SKIP
    }
  })
  return tree
}

export function extractFrontmatter(tree: Root, diagnostics: Diagnostic[]): {
  frontmatter: WeaveFrontmatter
  node: { position?: { end?: { offset?: number } } }
} {
  const firstChild = tree.children[0]
  
  if (firstChild?.type !== 'yaml') {
    throw new WeaveParseError('WEAVE_FRONTMATTER_MISSING', 'Document must start with YAML frontmatter')
  }
  
  const frontmatterNode = firstChild
  const parsed = parseYaml((firstChild as any).value)
  
  if (!parsed || typeof parsed !== 'object') {
    throw new WeaveParseError('WEAVE_FRONTMATTER_INVALID', 'Frontmatter must be a YAML object')
  }
  
  if (typeof parsed.id !== 'string' || parsed.id.length === 0) {
    throw new WeaveParseError('WEAVE_FRONTMATTER_ID_MISSING', 'Frontmatter must include a non-empty `id`')
  }
  
  const knownFields = new Set(['id', 'title', 'peek'])
  for (const key of Object.keys(parsed)) {
    if (!knownFields.has(key)) {
      diagnostics.push({
        severity: 'info',
        code: 'WEAVE_FRONTMATTER_UNKNOWN_FIELD',
        message: `Unknown frontmatter field: ${key}`,
        position: firstChild.position ? {
          line: firstChild.position.start.line - 1,
          character: firstChild.position.start.column - 1
        } : undefined
      })
    }
  }
  
  tree.children.splice(0, 1)
  
  return {
    frontmatter: {
      id: parsed.id,
      title: parsed.title,
      peek: parsed.peek
    },
    node: frontmatterNode
  }
}

function validateMediaConfig(mediaType: string, config: Record<string, unknown>): Diagnostic[] | undefined {
  const diagnostics: Diagnostic[] = []
  
  if (mediaType === 'image') {
    if (typeof config.file !== 'string' || !config.file) {
      diagnostics.push({
        severity: 'error',
        code: 'WEAVE_MEDIA_CONFIG_INVALID',
        message: 'Image block requires "file" field'
      })
    }
    if (!config.alt) {
      diagnostics.push({
        severity: 'warning',
        code: 'WEAVE_MEDIA_CONFIG_INVALID',
        message: 'Image block should include "alt" field for accessibility'
      })
    }
  } else if (mediaType === 'gallery') {
    if (!Array.isArray(config.files) || config.files.length === 0) {
      diagnostics.push({
        severity: 'error',
        code: 'WEAVE_MEDIA_CONFIG_INVALID',
        message: 'Gallery block requires non-empty "files" array'
      })
    }
  } else if (mediaType === 'audio' || mediaType === 'video') {
    if (typeof config.file !== 'string' || !config.file) {
      diagnostics.push({
        severity: 'error',
        code: 'WEAVE_MEDIA_CONFIG_INVALID',
        message: `${mediaType} block requires "file" field`
      })
    }
  } else if (mediaType === 'embed') {
    if (typeof config.url !== 'string' || !config.url) {
      diagnostics.push({
        severity: 'error',
        code: 'WEAVE_MEDIA_CONFIG_INVALID',
        message: 'Embed block requires "url" field'
      })
    }
  } else if (mediaType === 'voiceover') {
    if (typeof config.file !== 'string' || !config.file) {
      diagnostics.push({
        severity: 'error',
        code: 'WEAVE_MEDIA_CONFIG_INVALID',
        message: 'Voiceover block requires "file" field'
      })
    }
  }
  
  return diagnostics.length > 0 ? diagnostics : undefined
}

export function collectDiagnostics(tree: Root, diagnostics: Diagnostic[]): void {
  visit(tree, (node: any) => {
    if ('diagnostics' in node && Array.isArray(node.diagnostics)) {
      diagnostics.push(...node.diagnostics)
    }
  })
}
