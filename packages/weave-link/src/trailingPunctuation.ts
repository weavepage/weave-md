/**
 * Utility for handling trailing punctuation with inline expansions.
 * Prevents punctuation from being orphaned below expanded content.
 */

/**
 * Extract trailing punctuation that follows a link.
 * Given the text AFTER a link, extracts any punctuation at the start
 * so it can be kept with the link trigger.
 * 
 * @example
 * // Text after link: ". More text"
 * getTrailingPunctuation('. More text')
 * // → { punctuation: '.', rest: ' More text' }
 * 
 * getTrailingPunctuation('No punctuation')
 * // → null
 */
export function getTrailingPunctuation(text: string): { punctuation: string; rest: string } | null {
  const match = text.match(/^([.,;:!?'"\)\]]+)(.*)$/s)
  if (match) {
    return { punctuation: match[1], rest: match[2] }
  }
  return null
}

/**
 * Split text into leading punctuation and the rest.
 * Always returns both parts (empty strings if no punctuation).
 * Useful for HTML processing where you always need both values.
 * 
 * @example
 * splitTrailingPunctuation('. More text')
 * // → { punctuation: '.', rest: ' More text' }
 * 
 * splitTrailingPunctuation('No punctuation')
 * // → { punctuation: '', rest: 'No punctuation' }
 */
export function splitTrailingPunctuation(text: string): { punctuation: string; rest: string } {
  const match = text.match(/^([.,;:!?'"\)\]]+)(.*)$/s)
  if (match) {
    return { punctuation: match[1], rest: match[2] }
  }
  return { punctuation: '', rest: text }
}

/**
 * Check if a character is trailing punctuation that should stay with the previous element.
 */
export function isTrailingPunctuation(char: string): boolean {
  return /^[.,;:!?'"\)\]]+$/.test(char)
}
