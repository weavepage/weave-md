import { Diagnostic } from '@weave-md/core';
import { isEscaped, findClosingBracket } from '../links/index.js';

export function validateInlineSyntax(markdown: string, filePath?: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  
  diagnostics.push(...validateInlineMath(markdown, filePath));
  diagnostics.push(...validateInlineSubstitute(markdown, filePath));
  
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
    
    const closeBracketPos = findClosingBracketNoNewline(markdown, openBracket + 1);
    
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

export function validateInlineSubstitute(markdown: string, filePath?: string): Diagnostic[] {
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

  const subRegex = /:sub\[/g;
  let match: RegExpExecArray | null;
  
  while ((match = subRegex.exec(markdown)) !== null) {
    const startPos = match.index;
    
    // Skip if escaped
    if (isEscaped(markdown, startPos)) {
      continue;
    }
    
    const openBracket = startPos + 4; // position of '['
    const { line: startLine, character: startColumn } = getLineCol(startPos);
    
    const closeBracketPos = findClosingBracketNoNewline(markdown, openBracket + 1);
    
    if (closeBracketPos === -1) {
      diagnostics.push({
        severity: 'error',
        message: 'Inline substitution syntax :sub[...]{...} has unclosed bracket',
        filePath,
        position: { line: startLine, character: startColumn },
        code: 'unclosed-inline-sub'
      });
      continue;
    }
    
    // Check for opening brace after closing bracket
    if (closeBracketPos + 1 >= markdown.length || markdown[closeBracketPos + 1] !== '{') {
      diagnostics.push({
        severity: 'error',
        message: 'Inline substitution syntax :sub[...]{...} missing replacement braces',
        filePath,
        position: { line: startLine, character: startColumn },
        code: 'missing-sub-replacement'
      });
      continue;
    }
    
    const openBracePos = closeBracketPos + 1;
    const closeBracePos = findClosingBrace(markdown, openBracePos + 1);
    
    if (closeBracePos === -1) {
      diagnostics.push({
        severity: 'error',
        message: 'Inline substitution syntax :sub[...]{...} has unclosed brace',
        filePath,
        position: { line: startLine, character: startColumn },
        code: 'unclosed-inline-sub-brace'
      });
      continue;
    }
    
    // Check for empty initial content
    const initialContent = markdown.substring(openBracket + 1, closeBracketPos);
    const unescapedInitial = initialContent.replace(/\\\[/g, '').replace(/\\\]/g, '');
    if (unescapedInitial.trim() === '') {
      diagnostics.push({
        severity: 'warning',
        message: 'Inline substitution syntax :sub[...]{...} has empty initial content',
        filePath,
        position: { line: startLine, character: startColumn },
        code: 'empty-inline-sub-initial'
      });
    }
    
    // Check for empty replacement content
    const replacementContent = markdown.substring(openBracePos + 1, closeBracePos);
    const unescapedReplacement = replacementContent.replace(/\\\{/g, '').replace(/\\\}/g, '');
    if (unescapedReplacement.trim() === '') {
      diagnostics.push({
        severity: 'warning',
        message: 'Inline substitution syntax :sub[...]{...} has empty replacement content',
        filePath,
        position: { line: startLine, character: startColumn },
        code: 'empty-inline-sub-replacement'
      });
    }
  }
  
  return diagnostics;
}

function findClosingBracketNoNewline(str: string, startIndex: number): number {
  let depth = 1;
  let i = startIndex;
  
  while (i < str.length && depth > 0) {
    const ch = str[i];
    
    // Cannot span lines
    if (ch === '\n' || ch === '\r') {
      return -1;
    }
    
    // Handle escapes: only \] \[ \\ are valid escapes in initial content
    if (ch === '\\' && i + 1 < str.length) {
      const next = str[i + 1];
      if (next === ']' || next === '[' || next === '\\') {
        i += 2;
        continue;
      }
    }
    
    if (ch === '[') {
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
    i++;
  }
  
  return -1;
}

function findClosingBrace(str: string, startIndex: number): number {
  let depth = 1;
  let i = startIndex;
  
  while (i < str.length && depth > 0) {
    const ch = str[i];
    
    // Cannot span lines
    if (ch === '\n' || ch === '\r') {
      return -1;
    }
    
    // Handle escapes: only \} \{ \\ are valid escapes in replacement content
    if (ch === '\\' && i + 1 < str.length) {
      const next = str[i + 1];
      if (next === '}' || next === '{' || next === '\\') {
        i += 2;
        continue;
      }
    }
    
    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
    i++;
  }
  
  return -1;
}
