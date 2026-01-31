// @weave-md/weave-link
// Utilities for handling Weave node links in chat interfaces

export { parseNodeUrl } from './parseNodeUrl.js'
export { splitSections } from './splitSections.js'
export { createDisplayConfig } from './displayConfig.js'
export { getTrailingPunctuation, splitTrailingPunctuation, isTrailingPunctuation } from './trailingPunctuation.js'

export type { ParsedNodeUrl, DisplayType, ExportType } from './parseNodeUrl.js'
export type { Section } from './splitSections.js'
export type { DisplayConfig, DisplayConfigOptions } from './displayConfig.js'
