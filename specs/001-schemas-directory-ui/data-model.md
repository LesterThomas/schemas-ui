# Data Model: Schemas Directory UI (ODA‑style)

Date: 2025-10-22
Branch: 001-schemas-directory-ui

## Entities

### DirectoryNode
- Description: A node in the repository hierarchy.
- Attributes:
  - name: string
  - type: "folder" | "schema"
  - path: string (relative to `schemas/`)
  - children?: DirectoryNode[] (present when type = folder)

### SchemaDocument
- Description: Parsed schema suitable for tabular display.
- Attributes:
  - path: string (relative to `schemas/`)
  - title?: string
  - description?: string
  - properties?: Array<{ name: string; type?: string; required?: boolean; description?: string }>
  - raw: object (original JSON)
  - references?: ReferenceLink[]

### ReferenceLink
- Description: Linkable pointer from one schema to another.
- Attributes:
  - sourcePath: string (schema containing the reference)
  - targetPath?: string (resolved schema path if found)
  - displayText: string
  - kind: "ref" | "allOf" | "anyOf" | "oneOf" | "extends"

## Relationships
- DirectoryNode (folder) contains DirectoryNode children (folders and schemas).
- SchemaDocument aggregates ReferenceLink items that may point to other SchemaDocuments.

## Validation Rules
- DirectoryNode.path must be unique within the index.
- SchemaDocument.path must correspond to a file under `schemas/`.
- ReferenceLink.targetPath must be either resolvable to an existing schema or omitted with a user-facing notice.

## Notes
- This model supports UI rendering only; no external persistence.
