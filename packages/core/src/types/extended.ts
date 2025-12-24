export interface ImageBlock {
  type: 'image';
  file: string;
  alt?: string;
  caption?: string;
  width?: 'normal' | 'wide' | 'full';
}

export interface GalleryBlock {
  type: 'gallery';
  files: string[];
  alt?: string;
  caption?: string;
}

export interface AudioBlock {
  type: 'audio';
  file: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
}

export interface VideoBlock {
  type: 'video';
  file: string;
  poster?: string;
  start?: number;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
}

export interface EmbedBlock {
  type: 'embed';
  url: string;
}

export interface VoiceoverBlock {
  type: 'voiceover';
  file: string;
}

export interface MathBlock {
  type: 'math';
  content: string;
}

export interface PreBlock {
  type: 'pre';
  content: string;
}

export type ExtendedBlock = 
  | ImageBlock
  | GalleryBlock 
  | AudioBlock 
  | VideoBlock 
  | EmbedBlock 
  | VoiceoverBlock 
  | MathBlock 
  | PreBlock;

// why do we have duplicate types here? is this intentionally separated?
export interface ExtendedWeaveDocAst {
  sections: Array<{
    id: string;
    title?: string;
    peek?: string;
    body: string;
    filePath?: string;
    extendedBlocks?: ExtendedBlock[];
  }>;
  links: Array<{
    ref: {
      id: string;
      display?: 'footnote' | 'sidenote' | 'margin' | 'overlay' | 'inline' | 'stretch' | 'page';
      export?: 'appendix' | 'inline' | 'omit';
      params?: Record<string, string>;
    };
    sourceId: string;
    start: {
      line: number;
      character: number;
    };
    end: {
      line: number;
      character: number;
    };
    text?: string;
  }>;
}
