import type { DisplayType } from './parseNodeUrl.js'

export type { DisplayType }

export interface DisplayConfigOptions {
  supported?: DisplayType[]
  fallbacks?: Partial<Record<DisplayType, DisplayType>>
  default?: DisplayType
}

export interface DisplayConfig {
  resolve: (requested: DisplayType | undefined) => DisplayType
}

const ALL_DISPLAY_TYPES: DisplayType[] = ['inline', 'overlay', 'footnote', 'sidenote', 'margin', 'stretch', 'panel']
const DEFAULT_DISPLAY: DisplayType = 'inline'

/**
 * Create a display configuration for resolving display types.
 * 
 * @example
 * // Narrow viewport config
 * const narrowConfig = createDisplayConfig({
 *   supported: ['inline', 'overlay', 'footnote'],
 *   fallbacks: {
 *     sidenote: 'footnote',
 *     margin: 'footnote',
 *     panel: 'overlay',
 *     stretch: 'overlay',
 *   }
 * })
 * 
 * narrowConfig.resolve('sidenote')  // → 'footnote'
 * narrowConfig.resolve('overlay')   // → 'overlay'
 * narrowConfig.resolve(undefined)   // → 'inline' (default)
 */
export function createDisplayConfig(options: DisplayConfigOptions = {}): DisplayConfig {
  const {
    supported = ALL_DISPLAY_TYPES,
    fallbacks = {},
    default: defaultDisplay = DEFAULT_DISPLAY
  } = options

  const supportedSet = new Set(supported)

  function resolve(requested: DisplayType | undefined): DisplayType {
    // If no display requested, use default
    if (!requested) {
      return supportedSet.has(defaultDisplay) ? defaultDisplay : (supported[0] ?? DEFAULT_DISPLAY)
    }

    // If requested type is supported, use it
    if (supportedSet.has(requested)) {
      return requested
    }

    // Try fallback
    const fallback = fallbacks[requested]
    if (fallback && supportedSet.has(fallback)) {
      return fallback
    }

    // Last resort: use default
    return supportedSet.has(defaultDisplay) ? defaultDisplay : (supported[0] ?? DEFAULT_DISPLAY)
  }

  return { resolve }
}
