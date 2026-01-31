/**
 * Theming utilities for weave-link
 */

import { contentStyles } from './content.js'
import { componentStyles } from './components.js'

export interface ThemeVariables {
  /** Link text color */
  linkColor?: string
  /** Link text color on hover */
  linkHoverColor?: string
  /** Background color on hover */
  linkHoverBg?: string
  /** Focus outline color */
  linkFocusColor?: string
  /** Background color when active/pressed */
  linkActiveBg?: string
  /** Opacity for pending (unresolved) links */
  pendingOpacity?: string
  /** Font family for link text */
  fontFamily?: string
}

export interface ThemeConfig {
  /** Named variables that generate CSS custom properties */
  themeVariables?: ThemeVariables
  /** Raw CSS to inject (appended after generated styles) */
  themeCSS?: string
  /** Base theme: 'default' | 'dark' | 'none' */
  theme?: 'default' | 'dark' | 'none'
}

const DEFAULT_VARIABLES: Required<ThemeVariables> = {
  linkColor: '#0066cc',
  linkHoverColor: '#0066cc',
  linkHoverBg: 'rgba(0, 102, 204, 0.1)',
  linkFocusColor: '#0066cc',
  linkActiveBg: 'rgba(0, 102, 204, 0.2)',
  pendingOpacity: '0.7',
  fontFamily: 'inherit',
}

const DARK_VARIABLES: Required<ThemeVariables> = {
  linkColor: '#66b3ff',
  linkHoverColor: '#66b3ff',
  linkHoverBg: 'rgba(102, 179, 255, 0.15)',
  linkFocusColor: '#66b3ff',
  linkActiveBg: 'rgba(102, 179, 255, 0.25)',
  pendingOpacity: '0.7',
  fontFamily: 'inherit',
}

/**
 * Generate CSS custom properties from theme variables
 */
function generateCssVariables(variables: ThemeVariables): string {
  const lines: string[] = []
  
  if (variables.linkColor) {
    lines.push(`--weave-link-color: ${variables.linkColor};`)
  }
  if (variables.linkHoverColor) {
    lines.push(`--weave-link-hover-color: ${variables.linkHoverColor};`)
  }
  if (variables.linkHoverBg) {
    lines.push(`--weave-link-hover-bg: ${variables.linkHoverBg};`)
  }
  if (variables.linkFocusColor) {
    lines.push(`--weave-link-focus-color: ${variables.linkFocusColor};`)
  }
  if (variables.linkActiveBg) {
    lines.push(`--weave-link-active-bg: ${variables.linkActiveBg};`)
  }
  if (variables.pendingOpacity) {
    lines.push(`--weave-link-pending-opacity: ${variables.pendingOpacity};`)
  }
  if (variables.fontFamily) {
    lines.push(`--weave-link-font-family: ${variables.fontFamily};`)
  }
  
  return lines.join('\n  ')
}

function getVariables(config: ThemeConfig): ThemeVariables {
  const { theme = 'default', themeVariables = {} } = config
  
  let baseVariables: ThemeVariables
  switch (theme) {
    case 'dark':
      baseVariables = { ...DARK_VARIABLES }
      break
    case 'none':
      baseVariables = {}
      break
    default:
      baseVariables = { ...DEFAULT_VARIABLES }
  }
  
  return { ...baseVariables, ...themeVariables }
}

/**
 * Get CSS styles for weave-link components.
 * 
 * @example
 * // Default theme
 * const css = getStyles()
 * 
 * // Custom variables
 * const css = getStyles({
 *   themeVariables: {
 *     linkColor: '#ff6600',
 *     linkHoverBg: 'rgba(255, 102, 0, 0.1)'
 *   }
 * })
 * 
 * // With custom CSS appended
 * const css = getStyles({
 *   themeCSS: '.weave-link { font-weight: bold; }'
 * })
 * 
 * // Dark theme
 * const css = getStyles({ theme: 'dark' })
 */
export function getStyles(config: ThemeConfig = {}): string {
  const { theme = 'default', themeVariables = {}, themeCSS = '' } = config
  
  const mergedVariables = getVariables(config)
  const parts: string[] = []
  
  // CSS variables in :root
  const cssVars = generateCssVariables(mergedVariables)
  if (cssVars) {
    parts.push(`:root {\n  ${cssVars}\n}`)
  }
  
  // Content + component styles
  if (theme !== 'none') {
    parts.push(contentStyles)
    parts.push(componentStyles)
  }
  
  if (themeCSS) {
    parts.push(themeCSS)
  }
  
  return parts.join('\n\n')
}

/**
 * Inject styles into the document head.
 * 
 * @example
 * injectStyles({
 *   themeVariables: { linkColor: '#ff6600' }
 * })
 */
export function injectStyles(config: ThemeConfig = {}): void {
  if (typeof document === 'undefined') {
    return
  }
  
  const styleId = 'weave-link-styles'
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null
  
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = styleId
    document.head.appendChild(styleEl)
  }
  
  styleEl.textContent = getStyles(config)
}

/**
 * Create a scoped style string for a specific container.
 * Useful for Shadow DOM or iframe isolation.
 * 
 * @example
 * const scopedCss = getScopedStyles('.my-chat-container', {
 *   themeVariables: { linkColor: '#ff6600' }
 * })
 */
export function getScopedStyles(selector: string, config: ThemeConfig = {}): string {
  const baseStyles = getStyles(config)
  
  return baseStyles
    .replace(':root', selector)
    .replace(/(^|[\s,{])\.weave-/gm, `$1${selector} .weave-`)
}
