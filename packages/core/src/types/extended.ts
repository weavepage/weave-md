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
