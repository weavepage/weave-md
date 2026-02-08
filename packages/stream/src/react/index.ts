// React components for @weave-md/stream

// Core component
export { WeaveLink } from './WeaveLink.js'

// Display components
export { Overlay } from './displays/Overlay.js'
export { Footnotes, FootnoteRef } from './displays/Footnotes.js'
export { InlineExpand } from './displays/Inline.js'
export { Panel } from './displays/Panel.js'

// Hook for managing Weave content
export { useWeaveContent } from './displays/useWeaveContent.js'

// Re-export core utilities for convenience
export { parseNodeUrl } from '../parseNodeUrl.js'
export { splitSections } from '../splitSections.js'
export { createDisplayConfig } from '../displayConfig.js'
export { splitTrailingPunctuation } from '../trailingPunctuation.js'

// Styles (all styles - content + components)
export { getStyles, injectStyles, getScopedStyles } from '../styles/index.js'

// Types
export type { WeaveLinkProps, ResolvedSection } from './WeaveLink.js'
export type { OverlayProps } from './displays/Overlay.js'
export type { FootnotesProps, FootnoteEntry, FootnoteRefProps } from './displays/Footnotes.js'
export type { InlineExpandProps } from './displays/Inline.js'
export type { PanelProps } from './displays/Panel.js'
export type { UseWeaveContentOptions, UseWeaveContentResult } from './displays/useWeaveContent.js'
export type { ParsedNodeUrl, DisplayType, ExportType } from '../parseNodeUrl.js'
export type { Section } from '../splitSections.js'
export type { DisplayConfig, DisplayConfigOptions } from '../displayConfig.js'
export type { ThemeConfig, ThemeVariables } from '../styles/index.js'
