#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { loadWorkspace } from '../load/index.js';
import { parseWeaveDocument } from '@weave-md/parse';
import { extractNodeLinks } from '@weave-md/validate';

// CLI for @weave-md/basic
// 
// Commands:
//   validate - Validate workspace
//   export   - Export workspace to various formats
//

async function runValidate(args: string[]) {
  const cwd = process.cwd();
  const strict = args.includes('--strict');
  const json = args.includes('--json');
  
  if (!json) console.log('Validating workspace...');
  
  const { sections, filePaths, rawContent } = await loadWorkspace(cwd);
  
  if (!json) console.log(`Found ${sections.length} sections`);
  
  const errors: Array<{ file: string; line?: number; col?: number; code: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];
  const sectionIds = new Set(sections.map(s => s.id));
  
  // 1. Check for duplicate IDs
  const idCounts = new Map<string, string[]>();
  for (const section of sections) {
    const files = idCounts.get(section.id) || [];
    files.push(filePaths.get(section.id) || 'unknown');
    idCounts.set(section.id, files);
  }
  for (const [id, files] of idCounts) {
    if (files.length > 1) {
      for (const file of files) {
        errors.push({
          file,
          code: 'WEAVE_DUPLICATE_ID',
          message: `Duplicate section ID '${id}' (also in: ${files.filter(f => f !== file).join(', ')})`,
          severity: 'error'
        });
      }
    }
  }
  
  // 2. Validate each section
  for (const section of sections) {
    const filePath = filePaths.get(section.id) || 'unknown';
    const content = rawContent.get(section.id);
    
    // Extract and validate node links
    const { links, errors: linkErrors } = extractNodeLinks(section.body, filePath);
    
    // Add link extraction errors
    for (const err of linkErrors) {
      errors.push({
        file: err.filePath || filePath,
        line: err.position?.line,
        col: err.position?.character,
        code: err.code || 'WEAVE_LINK_ERROR',
        message: err.message,
        severity: 'error'
      });
    }
    
    // Check for broken references (links to non-existent sections)
    for (const link of links) {
      if (!sectionIds.has(link.ref.id)) {
        errors.push({
          file: filePath,
          line: link.start?.line,
          col: link.start?.character,
          code: 'WEAVE_BROKEN_REFERENCE',
          message: `Reference to unknown section '${link.ref.id}'`,
          severity: 'error'
        });
      }
    }
    
    // Full AST validation (catches deeper issues)
    if (content) {
      try {
        const ast = parseWeaveDocument(content, { strict: false });
        // Check for diagnostics in AST
        if (ast.diagnostics) {
          for (const diag of ast.diagnostics) {
            errors.push({
              file: filePath,
              line: diag.position?.line,
              col: diag.position?.character,
              code: diag.code || 'WEAVE_PARSE_ERROR',
              message: diag.message,
              severity: diag.severity
            });
          }
        }
      } catch (err: any) {
        errors.push({
          file: filePath,
          code: err.code || 'WEAVE_PARSE_ERROR',
          message: err.message || String(err),
          severity: 'error'
        });
      }
    }
  }
  
  // Output results
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  const infoCount = errors.filter(e => e.severity === 'info').length;
  
  if (json) {
    console.log(JSON.stringify({ 
      valid: errorCount === 0,
      sections: sections.length,
      errors: errorCount,
      warnings: warningCount,
      info: infoCount,
      diagnostics: errors 
    }, null, 2));
  } else {
    // Group by file
    const byFile = new Map<string, typeof errors>();
    for (const err of errors) {
      const list = byFile.get(err.file) || [];
      list.push(err);
      byFile.set(err.file, list);
    }
    
    for (const [file, fileErrors] of byFile) {
      console.log(`\n${file}:`);
      for (const err of fileErrors) {
        const loc = err.line !== undefined ? `:${err.line}${err.col !== undefined ? `:${err.col}` : ''}` : '';
        const icon = err.severity === 'error' ? '✗' : err.severity === 'warning' ? '⚠' : 'ℹ';
        console.log(`  ${icon} ${loc} [${err.code}] ${err.message}`);
      }
    }
    
    console.log('');
    if (errorCount === 0 && warningCount === 0) {
      console.log(`✓ Validation passed (${sections.length} sections)`);
    } else {
      console.log(`Validation: ${errorCount} error(s), ${warningCount} warning(s), ${infoCount} info`);
    }
  }
  
  // Exit with error code if strict mode and any errors
  if (strict && errorCount > 0) {
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'validate') {
    await runValidate(args);
  } else if (command === 'help' || command === '--help' || command === '-h') {
    showHelp();
  } else if (command === 'export') {
    const subcommand = args[1];
    
    if (!subcommand) {
      console.error('Error: Export format required');
      console.error('Usage: weave-md-basic export <format> [options]');
      console.error('Valid formats: html, ast');
      console.error('');
      console.error('Run "weave-md-basic help" for more information');
      process.exit(1);
    }
    const outDir = args.find((a: string) => a.startsWith('--out='))?.split('=')[1] || './dist';
    let entryArg = args.find((a: string) => a.startsWith('--entry='))?.split('=')[1];
    const cwd = process.cwd();
    
    console.log('Loading workspace...');
    const { sections, filePaths, rawContent } = await loadWorkspace(cwd);
    
    // Auto-detect entry if only one .md file in root directory
    if (!entryArg && subcommand === 'html') {
      const rootMdFiles = fs.readdirSync(cwd)
        .filter(f => f.endsWith('.md') && fs.statSync(path.join(cwd, f)).isFile());
      
      if (rootMdFiles.length === 1) {
        // Find the section from this file
        for (const [id, filePath] of filePaths) {
          if (path.resolve(path.dirname(filePath)) === path.resolve(cwd)) {
            entryArg = id;
            break;
          }
        }
        if (!entryArg) {
          console.error(`Error: Root file ${rootMdFiles[0]} has no valid id in frontmatter.`);
          process.exit(1);
        }
      } else if (rootMdFiles.length > 1) {
        console.error('Error: Multiple .md files in root directory. Use --entry=<id> to specify the primary section.');
        console.error(`Found: ${rootMdFiles.join(', ')}`);
        process.exit(1);
      } else {
        console.error('Error: No .md file in root directory. Use --entry=<id> to specify the primary section.');
        process.exit(1);
      }
    }
    
    console.log(`Found ${sections.length} sections`);
    
    // Extract links and validate
    const results = sections.map(s => {
      const filePath = filePaths.get(s.id);
      return extractNodeLinks(s.body, filePath);
    });
    const allLinks = results.flatMap(r => r.links);
    const allErrors = results.flatMap(r => r.errors);
    
    if (allErrors.length > 0) {
      console.warn(`Found ${allErrors.length} link validation errors:`);
      allErrors.forEach(err => {
        console.warn(`  ${err.filePath}${err.position ? `:${err.position.line}:${err.position.character}` : ''} - ${err.message}`);
      });
    }
    
    
    // Create output directory
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    console.log(`Exporting to ${outDir}...`);
    
    if (subcommand === 'ast') {
      // Export full AST for each section - can be used to build any HTML on top
      const asts: Record<string, any> = {};
      for (const section of sections) {
        const content = rawContent.get(section.id);
        if (content) {
          try {
            const ast = parseWeaveDocument(content, { stripPositions: true });
            asts[section.id] = ast;
          } catch (err) {
            console.warn(`  Failed to parse ${section.id}: ${err}`);
            asts[section.id] = { error: String(err) };
          }
        }
      }
      
      // Write combined AST
      fs.writeFileSync(
        path.join(outDir, 'weave-ast.json'), 
        JSON.stringify({ sections: asts }, null, 2)
      );
      console.log(`  Written: weave-ast.json`);
      
    } else if (subcommand === 'html') {
      // HTML export with footnote and overlay support
      const { exportToStaticHtml } = await import('../render/index.js');
      const { parseToMdast } = await import('@weave-md/parse');
      
      const trees = new Map<string, any>();
      for (const section of sections) {
        const content = rawContent.get(section.id);
        if (content) {
          try {
            const { tree } = parseToMdast(content);
            trees.set(section.id, tree);
          } catch (err) {
            console.warn(`  Failed to parse ${section.id}: ${err}`);
          }
        }
      }
      
      const html = exportToStaticHtml(sections, trees, {
        title: 'Weave Document',
        entry: entryArg
      });
      
      fs.writeFileSync(path.join(outDir, 'index.html'), html);
      console.log(`  Written: index.html`);
      
    } else {
      console.error(`Unknown export format: ${subcommand}`);
      console.error('Valid formats: html, ast');
      process.exit(1);
    }
    
    console.log('Export complete!');
    
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Run "weave-md-basic help" for usage information');
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
Usage: weave-md-basic <command> [options]

Commands:
  validate              Validate workspace for errors
  export <format>       Export workspace to specified format
  help                  Show this help message

Export formats:
  html                  Interactive HTML with footnotes at bottom
  ast                   Parse to JSON AST

Options:
  --out=<dir>           Output directory (default: ./dist)
  --entry=<id>          Entry section ID (only render this and its references)
  --strict              Exit with code 1 if validation errors found
  --json                Output validation results as JSON

Examples:
  weave-md-basic validate
  weave-md-basic validate --strict
  weave-md-basic export html --entry=intro
  weave-md-basic export html --out=./build
  weave-md-basic export ast
`);
}

main().catch(console.error);
