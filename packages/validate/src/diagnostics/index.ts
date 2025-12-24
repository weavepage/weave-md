import { Diagnostic, Section, Graph } from '@weave-md/core';

export function validateSections(sections: Section[], filePaths?: Map<string, string>): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const seenIds = new Map<string, string>();
  
  sections.forEach(section => {
    const sectionFilePath = filePaths?.get(section.id);
    
    if (!section.id || section.id.trim() === '') {
      diagnostics.push({
        severity: 'error',
        message: 'Section must have a non-empty id',
        filePath: sectionFilePath,
        code: 'empty-id'
      });
    } else {
      const existingPath = seenIds.get(section.id);
      if (existingPath) {
        diagnostics.push({
          severity: 'error',
          message: `Duplicate section id "${section.id}" (also in ${existingPath})`,
          filePath: sectionFilePath,
          code: 'duplicate-id'
        });
      } else {
        seenIds.set(section.id, sectionFilePath || 'unknown');
      }
    }
  });
  
  return diagnostics;
}

export function validateReferences(graph: Graph, sections: Section[], linkFilePaths?: Map<string, string>): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const sectionIds = new Set(sections.map(s => s.id).filter(Boolean));
  
  Object.entries(graph.occurrences).forEach(([targetId, links]) => {
    if (!sectionIds.has(targetId)) {
      links.forEach(link => {
        diagnostics.push({
          severity: 'error',
          message: `Reference to unknown section: ${targetId}`,
          filePath: linkFilePaths?.get(`${link.start.line}:${link.start.character}`) || 'unknown',
          position: link.start,
          code: 'broken-reference'
        });
      });
    }
  });
  
  return diagnostics;
}

export function formatDiagnostics(diagnostics: Diagnostic[], format: 'text' | 'json' = 'text'): string {
  if (format === 'json') {
    return JSON.stringify(diagnostics, null, 2);
  }
  
  return diagnostics.map(d => {
    const location = d.filePath 
      ? `${d.filePath}${d.position ? `:${d.position.line}:${d.position.character}` : ''}`
      : 'unknown';
    return `[${d.severity.toUpperCase()}] ${location}: ${d.message}`;
  }).join('\n');
}
