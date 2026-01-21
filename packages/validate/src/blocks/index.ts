import { parse } from 'yaml';
import { Diagnostic } from '@weave-md/core';

export interface WeaveBlock {
  type: string;
  content: string;
  line: number;
}

export function extractWeaveBlocks(markdown: string): WeaveBlock[] {
  const blocks: WeaveBlock[] = [];
  const regex = /^```(\w+)\n([\s\S]*?)^```$/gm;
  let match;
  
  while ((match = regex.exec(markdown)) !== null) {
    const type = match[1];
    const content = match[2];
    const linesBefore = markdown.substring(0, match.index).split('\n').length;
    
    blocks.push({
      type,
      content,
      line: linesBefore
    });
  }
  
  return blocks;
}

export function validateWeaveBlocks(markdown: string, filePath?: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const blocks = extractWeaveBlocks(markdown);
  
  blocks.forEach(block => {
    switch (block.type) {
      case 'image':
        diagnostics.push(...validateImageBlock(block, filePath));
        break;
      case 'gallery':
        diagnostics.push(...validateGalleryBlock(block, filePath));
        break;
      case 'audio':
        diagnostics.push(...validateAudioBlock(block, filePath));
        break;
      case 'video':
        diagnostics.push(...validateVideoBlock(block, filePath));
        break;
      case 'embed':
        diagnostics.push(...validateEmbedBlock(block, filePath));
        break;
      case 'math':
        diagnostics.push(...validateMathBlock(block, filePath));
        break;
      case 'pre':
        diagnostics.push(...validatePreBlock(block, filePath));
        break;
    }
  });
  
  return diagnostics;
}

function validateImageBlock(block: WeaveBlock, filePath?: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  
  try {
    const data = parse(block.content);
    
    if (!data || typeof data !== 'object') {
      diagnostics.push({
        severity: 'error',
        message: 'Image block must contain YAML data',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-image-block'
      });
      return diagnostics;
    }
    
    if (!data.file) {
      diagnostics.push({
        severity: 'error',
        message: 'Image block must have a "file" field',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'missing-image-file'
      });
    }
    
    if (data.file && typeof data.file !== 'string') {
      diagnostics.push({
        severity: 'error',
        message: 'Image "file" field must be a string',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-image-file-type'
      });
    }
    
    if (data.alt && typeof data.alt !== 'string') {
      diagnostics.push({
        severity: 'error',
        message: 'Image "alt" field must be a string',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-image-alt-type'
      });
    } else if (!data.alt) {
      diagnostics.push({
        severity: 'warning',
        message: 'Image block should have an "alt" field for accessibility',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'missing-image-alt'
      });
    }
    
    if (data.width && !['normal', 'wide', 'full'].includes(data.width)) {
      diagnostics.push({
        severity: 'error',
        message: 'Image "width" must be one of: normal, wide, full',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-image-width'
      });
    }
  } catch (error) {
    diagnostics.push({
      severity: 'error',
      message: `Failed to parse image block YAML: ${error instanceof Error ? error.message : String(error)}`,
      filePath,
      position: { line: block.line, character: 1 },
      code: 'invalid-image-yaml'
    });
  }
  
  return diagnostics;
}

function validateGalleryBlock(block: WeaveBlock, filePath?: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  
  try {
    const data = parse(block.content);
    
    if (!data || typeof data !== 'object') {
      diagnostics.push({
        severity: 'error',
        message: 'Gallery block must contain YAML data',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-gallery-block'
      });
      return diagnostics;
    }
    
    if (!data.files) {
      diagnostics.push({
        severity: 'error',
        message: 'Gallery block must have a "files" field',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'missing-gallery-files'
      });
    } else if (!Array.isArray(data.files)) {
      diagnostics.push({
        severity: 'error',
        message: 'Gallery "files" field must be an array',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-gallery-files-type'
      });
    } else if (data.files.length === 0) {
      diagnostics.push({
        severity: 'error',
        message: 'Gallery "files" array must contain at least one entry',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'empty-gallery-files'
      });
    }
    
    if (!data.alt) {
      diagnostics.push({
        severity: 'warning',
        message: 'Gallery block should have an "alt" field for accessibility',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'missing-gallery-alt'
      });
    }
  } catch (error) {
    diagnostics.push({
      severity: 'error',
      message: `Failed to parse gallery block YAML: ${error instanceof Error ? error.message : String(error)}`,
      filePath,
      position: { line: block.line, character: 1 },
      code: 'invalid-gallery-yaml'
    });
  }
  
  return diagnostics;
}

function validateAudioBlock(block: WeaveBlock, filePath?: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  
  try {
    const data = parse(block.content);
    
    if (!data || typeof data !== 'object') {
      diagnostics.push({
        severity: 'error',
        message: 'Audio block must contain YAML data',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-audio-block'
      });
      return diagnostics;
    }
    
    if (!data.file) {
      diagnostics.push({
        severity: 'error',
        message: 'Audio block must have a "file" field',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'missing-audio-file'
      });
    }
    
    if (data.autoplay !== undefined && typeof data.autoplay !== 'boolean') {
      diagnostics.push({
        severity: 'error',
        message: 'Audio "autoplay" field must be a boolean',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-audio-autoplay-type'
      });
    }
    
    if (data.controls !== undefined && typeof data.controls !== 'boolean') {
      diagnostics.push({
        severity: 'error',
        message: 'Audio "controls" field must be a boolean',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-audio-controls-type'
      });
    }
    
    if (data.loop !== undefined && typeof data.loop !== 'boolean') {
      diagnostics.push({
        severity: 'error',
        message: 'Audio "loop" field must be a boolean',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-audio-loop-type'
      });
    }
  } catch (error) {
    diagnostics.push({
      severity: 'error',
      message: `Failed to parse audio block YAML: ${error instanceof Error ? error.message : String(error)}`,
      filePath,
      position: { line: block.line, character: 1 },
      code: 'invalid-audio-yaml'
    });
  }
  
  return diagnostics;
}

function validateVideoBlock(block: WeaveBlock, filePath?: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  
  try {
    const data = parse(block.content);
    
    if (!data || typeof data !== 'object') {
      diagnostics.push({
        severity: 'error',
        message: 'Video block must contain YAML data',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-video-block'
      });
      return diagnostics;
    }
    
    if (!data.file) {
      diagnostics.push({
        severity: 'error',
        message: 'Video block must have a "file" field',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'missing-video-file'
      });
    }
    
    if (data.start !== undefined && typeof data.start !== 'number') {
      diagnostics.push({
        severity: 'error',
        message: 'Video "start" field must be a number',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-video-start-type'
      });
    }
    
    if (data.autoplay !== undefined && typeof data.autoplay !== 'boolean') {
      diagnostics.push({
        severity: 'error',
        message: 'Video "autoplay" field must be a boolean',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-video-autoplay-type'
      });
    }
    
    if (data.controls !== undefined && typeof data.controls !== 'boolean') {
      diagnostics.push({
        severity: 'error',
        message: 'Video "controls" field must be a boolean',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-video-controls-type'
      });
    }
    
    if (data.loop !== undefined && typeof data.loop !== 'boolean') {
      diagnostics.push({
        severity: 'error',
        message: 'Video "loop" field must be a boolean',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-video-loop-type'
      });
    }
  } catch (error) {
    diagnostics.push({
      severity: 'error',
      message: `Failed to parse video block YAML: ${error instanceof Error ? error.message : String(error)}`,
      filePath,
      position: { line: block.line, character: 1 },
      code: 'invalid-video-yaml'
    });
  }
  
  return diagnostics;
}

function validateEmbedBlock(block: WeaveBlock, filePath?: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  
  try {
    const data = parse(block.content);
    
    if (!data || typeof data !== 'object') {
      diagnostics.push({
        severity: 'error',
        message: 'Embed block must contain YAML data',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'invalid-embed-block'
      });
      return diagnostics;
    }
    
    if (!data.url) {
      diagnostics.push({
        severity: 'error',
        message: 'Embed block must have a "url" field',
        filePath,
        position: { line: block.line, character: 1 },
        code: 'missing-embed-url'
      });
    }
  } catch (error) {
    diagnostics.push({
      severity: 'error',
      message: `Failed to parse embed block YAML: ${error instanceof Error ? error.message : String(error)}`,
      filePath,
      position: { line: block.line, character: 1 },
      code: 'invalid-embed-yaml'
    });
  }
  
  return diagnostics;
}

function validateMathBlock(block: WeaveBlock, filePath?: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  
  if (!block.content || block.content.trim() === '') {
    diagnostics.push({
      severity: 'error',
      message: 'Math block must have content',
      filePath,
      position: { line: block.line, character: 1 },
      code: 'empty-math-block'
    });
  }
  
  return diagnostics;
}

function validatePreBlock(block: WeaveBlock, filePath?: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  
  if (!block.content || block.content.trim() === '') {
    diagnostics.push({
      severity: 'warning',
      message: 'Pre block is empty',
      filePath,
      position: { line: block.line, character: 1 },
      code: 'empty-pre-block'
    });
  }
  
  return diagnostics;
}
