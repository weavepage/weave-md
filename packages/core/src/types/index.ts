export interface Section {
  id: string;
  title?: string;
  peek?: string;
  body: string;
}

export type DisplayType =
  | 'footnote'
  | 'sidenote'
  | 'margin'
  | 'overlay'
  | 'inline'
  | 'stretch'
  | 'page';

export type ExportHint = 'appendix' | 'inline' | 'omit';

export interface NodeRef {
  id: string;
  display?: DisplayType;
  export?: ExportHint;
  [key: string]: string | DisplayType | ExportHint | boolean | undefined;
}

export interface SourcePosition {
  line: number;
  character: number;
}

export interface Link {
  ref: NodeRef;
  sourceId: string;
  start: SourcePosition;
  end: SourcePosition;
  text?: string;
}

export interface DocAst {
  sections: Section[];
  links: Link[];
}

export interface GraphNode {
  id: string;
  outgoing: Record<string, number>;
  incoming: Record<string, number>;
}

export interface Graph {
  nodes: Record<string, GraphNode>;
  occurrences: Record<string, Link[]>;
}

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  severity: DiagnosticSeverity;
  message: string;
  filePath?: string;
  position?: SourcePosition;
  code?: string;
}
