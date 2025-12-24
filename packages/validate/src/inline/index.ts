import { Diagnostic } from '@weave-md/core';
import { isEscaped, findClosingBracket } from '../links';

export function validateInlineSyntax(markdown: string, filePath?: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  
  diagnostics.push(...validateInlineMath(markdown, filePath));
  
  return diagnostics;
}

export function validateInlineMath(markdown: string, filePath?: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  
  // Build line start positions for O(1) line/column lookup
  const lineStarts: number[] = [0];
  for (let i = 0; i < markdown.length; i++) {
    if (markdown[i] === '\r') {
      if (i + 1 < markdown.length && markdown[i + 1] === '\n') {
        lineStarts.push(i + 2);
        i++;
      } else {
        lineStarts.push(i + 1);
      }
    } else if (markdown[i] === '\n') {
      lineStarts.push(i + 1);
    }
  }

  const getLineCol = (pos: number): { line: number; character: number } => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= pos) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return { line: lo + 1, character: pos - lineStarts[lo] + 1 };
  };

  const mathRegex = /:math\[/g;
  let match: RegExpExecArray | null;
  
  while ((match = mathRegex.exec(markdown)) !== null) {
    const startPos = match.index;
    
    // Skip if escaped
    if (isEscaped(markdown, startPos)) {
      continue;
    }
    
    const openBracket = startPos + 5;
    const { line: startLine, character: startColumn } = getLineCol(startPos);
    
    const closeBracketPos = findClosingBracket(markdown, openBracket + 1);
    
    if (closeBracketPos === -1) {
      diagnostics.push({
        severity: 'error',
        message: 'Inline math syntax :math[...] has unclosed bracket',
        filePath,
        position: { line: startLine, character: startColumn },
        code: 'unclosed-inline-math'
      });
    } else {
      const content = markdown.substring(openBracket + 1, closeBracketPos);
      // Remove escaped brackets when checking for empty content
      const unescapedContent = content.replace(/\\\[/g, '').replace(/\\\]/g, '');
      if (unescapedContent.trim() === '') {
        diagnostics.push({
          severity: 'warning',
          message: 'Inline math syntax :math[...] is empty',
          filePath,
          position: { line: startLine, character: startColumn },
          code: 'empty-inline-math'
        });
      }
    }
  }
  
  return diagnostics;
}
