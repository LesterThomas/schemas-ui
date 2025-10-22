# Research: Schemas Directory UI (ODA‑style)

Date: 2025-10-22
Branch: 001-schemas-directory-ui
Spec: D:\Dev\innovation-network\schemas-ui\specs\001-schemas-directory-ui\spec.md

## Open Questions (from Technical Context)

1) TypeScript vs JavaScript (Language/Version)
2) Primary UI dependency (vanilla vs React)
3) Testing approach (unit/e2e)

## Findings and Decisions

### 1) Language: TypeScript vs JavaScript
- Decision: TypeScript
- Rationale: Strong types for schema shape (DirectoryNode, SchemaDocument, ReferenceLink) improve reliability and refactor safety.
- Alternatives considered: JavaScript (simpler, but weaker guarantees on ref resolution and index typing).

### 2) Primary UI dependency
- Decision: React (client-side rendering, static export friendly)
- Rationale: Component model suits directory tree, table view, and routing with deep links. Broad ecosystem and static export compatibility.
- Alternatives considered: Vanilla JS (viable but adds bespoke state mgmt and routing), other frameworks (overhead for simple static hosting).

### 3) Testing approach
- Decision: Unit tests for index generator and reference resolution; lightweight e2e smoke tests for navigation, table rendering, and deep links.
- Rationale: Generator correctness is critical; e2e validates primary flows without heavy infra.
- Alternatives considered: Full integration framework (overkill for static UI).

## Implications for Plan
- Plan will assume TypeScript and React on the client.
- A build-time script generates `public/schemas-index.json` deterministically.
- Deep links handled in client routing; all static-host compatible.

## References
- TM Forum ODA Components Directory and Open API Directory (for UI inspiration)
- Project constitution (static hosting, deterministic artifacts, accessibility)
