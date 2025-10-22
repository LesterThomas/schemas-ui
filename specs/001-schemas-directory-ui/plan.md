# Implementation Plan: Schemas Directory UI (ODA‑style)

**Branch**: `001-schemas-directory-ui` | **Date**: 2025-10-22 | **Spec**: D:\Dev\innovation-network\schemas-ui\specs\001-schemas-directory-ui\spec.md
**Input**: Feature specification from `D:\Dev\innovation-network\schemas-ui\specs\001-schemas-directory-ui\spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Browse and visualize data schemas stored under `schemas/` in a directory-like UI that mimics TM Forum ODA Components and Open API directories. Users can navigate the folder hierarchy, view each schema as a formatted table with a JSON toggle, and follow references as links. Technical approach: client-side app suitable for static hosting (GitHub Pages). A deterministic build-time index (`schemas-index.json`) will be generated from `schemas/` and consumed at runtime.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: JavaScript/TypeScript (browser) — NEEDS CLARIFICATION: TS vs JS preference  
**Primary Dependencies**: NEEDS CLARIFICATION (lightweight UI only; consider vanilla/React)  
**Storage**: N/A (static assets only)  
**Testing**: NEEDS CLARIFICATION (unit/e2e approach)  
**Target Platform**: Static hosting (GitHub Pages)
**Project Type**: web (single project at repo root)  
**Performance Goals**: Initial view interactive < 2s; schema view under 10s (includes JSON fetch)  
**Constraints**: Must export static site; no server code; accessible and responsive  
**Scale/Scope**: Hundreds to thousands of schema files; deep nesting possible

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Derived gates from `\.specify\memory\constitution.md`:
- Single Source of Truth: All content derived from `schemas/` via generated index → PASS (planned `schemas-index.json`).
- Client-Side Rendering for Static Hosting: No server runtime; static export → PASS (planned static hosting).
- Deterministic Build Artifacts: Reproducible index generation → PASS (prebuild script planned).
- Accessibility/Performance/Simplicity: Lightweight UI, semantic HTML, keyboard navigation → PASS (tracked in tasks/testing).
- Versioning & Change Transparency: Document breaking changes in plan/spec; no runtime server contracts → PASS.

Post-Design Re-check: PASS

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# Proposed single-project layout (no code committed by this plan)
ui/
├── public/
│   └── schemas-index.json        # Generated from schemas/ (deterministic)
├── src/
│   ├── components/
│   ├── pages/                    # or app/
│   └── styles/
└── scripts/
  └── generate-schemas-index.[m]js

schemas/                          # existing (source of truth)
```

**Structure Decision**: Single web project at repo root under `ui/` with a build script that scans `D:\Dev\innovation-network\schemas-ui\schemas\`. No backend. Static export for GitHub Pages.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
