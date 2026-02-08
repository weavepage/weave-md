import { parseNodeUrl } from '../parseNodeUrl.js'

interface MarkdownIt {
  renderer: {
    rules: Record<string, RenderRule | undefined>
  }
}

type RenderRule = (
  tokens: Token[],
  idx: number,
  options: unknown,
  env: unknown,
  self: Renderer
) => string

interface Token {
  type: string
  tag: string
  attrs: [string, string][] | null
  children: Token[] | null
  content: string
  markup: string
  info: string
  nesting: number
  level: number
  attrGet(name: string): string | null
  attrSet(name: string, value: string): void
}

interface Renderer {
  renderToken(tokens: Token[], idx: number, options: unknown): string
  renderInline(tokens: Token[], options: unknown, env: unknown): string
}

export interface WeaveLinkPluginOptions {
  className?: string
}

/**
 * markdown-it plugin for rendering Weave node links.
 * 
 * Transforms `[text](node:id?display=overlay)` into:
 * `<span class="weave-link" data-target="id" data-display="overlay">text</span>`
 * 
 * @example
 * import MarkdownIt from 'markdown-it'
 * import { weaveLinkPlugin } from '@weave-md/stream/markdown-it'
 * 
 * const md = new MarkdownIt()
 * md.use(weaveLinkPlugin)
 * 
 * md.render('[see intro](node:intro?display=overlay)')
 * // <span class="weave-link" data-target="intro" data-display="overlay">see intro</span>
 */
export function weaveLinkPlugin(md: MarkdownIt, options: WeaveLinkPluginOptions = {}) {
  const { className = 'weave-link' } = options

  const defaultLinkOpenRenderer = md.renderer.rules.link_open
  const defaultLinkCloseRenderer = md.renderer.rules.link_close

  md.renderer.rules.link_open = function(tokens, idx, opts, env, self) {
    const token = tokens[idx]
    const href = token.attrGet('href')
    const parsed = parseNodeUrl(href)

    if (parsed) {
      // Mark this as a weave link for the close renderer
      ;(env as Record<string, unknown>).__weaveLinkActive = true

      const display = parsed.display ?? 'inline'
      const classes = [className, `${className}--pending`].join(' ')
      
      return `<span class="${classes}" data-target="${escapeHtml(parsed.id)}" data-display="${escapeHtml(display)}" data-resolved="false">`
    }

    if (defaultLinkOpenRenderer) {
      return defaultLinkOpenRenderer(tokens, idx, opts, env, self)
    }
    return self.renderToken(tokens, idx, opts)
  }

  md.renderer.rules.link_close = function(tokens, idx, opts, env, self) {
    if ((env as Record<string, unknown>).__weaveLinkActive) {
      ;(env as Record<string, unknown>).__weaveLinkActive = false
      return '</span>'
    }

    if (defaultLinkCloseRenderer) {
      return defaultLinkCloseRenderer(tokens, idx, opts, env, self)
    }
    return self.renderToken(tokens, idx, opts)
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
