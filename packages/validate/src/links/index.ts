import { Link, Diagnostic, parseNodeUrl } from '@weave-md/core';

export interface ExtractNodeLinksResult {
  links: Link[];
  errors: Diagnostic[];
}

export function extractNodeLinks(markdown: string, filePath?: string): ExtractNodeLinksResult {
  const links: Link[] = [];
  const errors: Diagnostic[] = [];
  
  const lines = markdown.split(/\r?\n/);
  
  lines.forEach((line, lineIndex) => {
    extractLinksFromLine(line, lineIndex, links, errors, filePath);
  });
  
  return { links, errors };
}

// potentially just use the parsed AST for this instead of regex
function extractLinksFromLine(
  line: string,
  lineIndex: number,
  links: Link[],
  errors: Diagnostic[],
  filePath?: string
): void {
  let i = 0;
  
  while (i < line.length) {
    if (line[i] === '[' && !isEscaped(line, i)) {
      const textEnd = findClosingBracket(line, i + 1);
      
      if (textEnd !== -1 && textEnd + 1 < line.length && line[textEnd + 1] === '(') {
        const urlStart = textEnd + 2;
        const urlEnd = findMatchingParen(line, textEnd + 1);
        
        if (urlEnd !== -1) {
          let nodeUrlStart = urlStart;
          while (nodeUrlStart < urlEnd && isWhitespaceChar(line[nodeUrlStart])) {
            nodeUrlStart++;
          }

          if (line.startsWith('node:', nodeUrlStart)) {
            let nodeUrlEnd = nodeUrlStart;
            while (nodeUrlEnd < urlEnd && !isWhitespaceChar(line[nodeUrlEnd])) {
              nodeUrlEnd++;
            }

            const url = line.substring(nodeUrlStart, nodeUrlEnd);
            const remainder = line.substring(nodeUrlEnd, urlEnd);

            if (hasNonWhitespace(remainder)) {
              errors.push({
                severity: 'error',
                message: 'Invalid node URL: unexpected trailing content after URL',
                filePath,
                position: { line: lineIndex + 1, character: nodeUrlStart + 1 },
                code: 'invalid-node-url'
              });
            } else {
              const parsed = parseNodeUrl(url);

              if (parsed.success) {
                links.push({
                  ref: parsed.ref,
                  sourceId: filePath || `line-${lineIndex + 1}`,
                  start: {
                    line: lineIndex + 1,
                    character: nodeUrlStart + 1
                  },
                  end: {
                    line: lineIndex + 1,
                    character: nodeUrlEnd + 1
                  }
                });
              } else {
                errors.push({
                  severity: 'error',
                  message: `Invalid node URL: ${parsed.error}`,
                  filePath,
                  position: { line: lineIndex + 1, character: nodeUrlStart + 1 },
                  code: 'invalid-node-url'
                });
              }
            }

            i = urlEnd + 1;
            continue;
          }
        }
      }
    }
    
    i++;
  }
}

function isWhitespaceChar(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\r';
}

function hasNonWhitespace(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (!isWhitespaceChar(str[i])) {
      return true;
    }
  }
  return false;
}

export function isEscaped(str: string, index: number): boolean {
  let backslashCount = 0;
  let i = index - 1;

  while (i >= 0 && str[i] === '\\') {
    backslashCount++;
    i--;
  }

  return backslashCount % 2 === 1;
}

export function findClosingBracket(str: string, startIndex: number): number {
  let depth = 1;
  let i = startIndex;
  
  while (i < str.length && depth > 0) {
    // Check for backslash escape
    if (str[i] === '\\' && i + 1 < str.length) {
      i += 2;
      continue;
    }
    
    if (str[i] === '[') {
      depth++;
    } else if (str[i] === ']') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
    
    i++;
  }
  
  return -1;
}

export function findMatchingParen(str: string, openParenIndex: number): number {
  let depth = 1;
  let i = openParenIndex + 1;
  
  while (i < str.length && depth > 0) {
    if (str[i] === '\\' && i + 1 < str.length) {
      i += 2;
      continue;
    }
    
    if (str[i] === '(') {
      depth++;
    } else if (str[i] === ')') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
    
    i++;
  }
  
  return -1;
}
