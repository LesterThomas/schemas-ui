export type NodeType = 'folder' | 'schema';

export interface DirectoryNode {
  name: string;
  type: NodeType;
  path: string; // relative to schemas/
  children?: DirectoryNode[];
}

export interface ReferenceLink {
  sourcePath: string; // schema containing the reference
  targetPath?: string; // resolved schema path if found
  displayText: string;
  kind: 'ref' | 'allOf' | 'anyOf' | 'oneOf' | 'extends';
}

export interface SchemaDocument {
  path: string; // relative to schemas/
  title?: string;
  description?: string;
  properties?: Array<{
    name: string;
    type?: string;
    required?: boolean;
    description?: string;
  }>;
  raw: unknown;
  references?: ReferenceLink[];
}
