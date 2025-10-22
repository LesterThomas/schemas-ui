<!--
Sync Impact Report
- Version change: n/a → 1.0.0
- Modified principles: n/a (initial adoption)
- Added sections: Core Principles; Additional Constraints; Development Workflow & Quality Gates; Governance
- Removed sections: none
- Templates requiring updates:
	- .specify/templates/plan-template.md ✅ aligned (no conflicting gates)
	- .specify/templates/spec-template.md ✅ aligned (no constitution-driven mandatory additions)
	- .specify/templates/tasks-template.md ✅ aligned (no changes required)
	- .specify/templates/commands/* ⚠ pending (folder not present in repo; no action)
- Deferred items:
	- TODO(RATIFICATION_DATE): Original adoption date unknown; set when known.
-->

# Schemas UI Constitution

## Core Principles

### I. Single Source of Truth (NON-NEGOTIABLE)
All rendered content MUST be derived directly from files in `schemas/` and its
subdirectories. No manual duplication or shadow copies are permitted. A
generated index MAY exist only as a derivative artifact produced by a script
that scans `schemas/`.

Rationale: Eliminates drift between UI and repository content; guarantees users
see the real, current schemas.

### II. Client‑Side Rendering for Static Hosting
The web UI MUST render on the client only and be compatible with static hosting
environments (e.g., GitHub Pages) via static export. No server runtime is
assumed or required.

Rationale: Ensures simple, low‑cost deployment and portability.

### III. Deterministic Build Artifacts
A reproducible script MUST generate a `schemas-index.json` from the `schemas/`
tree during build. The UI MUST consume this index at runtime and NOT rely on
server directory listing or dynamic server APIs.

Rationale: Static hosts do not expose directory listing; deterministic outputs
enable reliable, cacheable deployments.

### IV. Accessibility, Performance, and Simplicity
Pages MUST load quickly (lightweight assets, minimal JS), be responsive, and
follow basic accessibility practices (semantic HTML, keyboard navigation,
contrast). Introduce new dependencies only when they materially reduce
complexity.

Rationale: Users benefit from fast, inclusive experiences; simpler stacks are
easier to maintain.

### V. Versioning & Change Transparency
Breaking changes to structure, navigation, or build contracts MUST be
documented. The constitution uses semantic versioning. Schema content changes
live with the repository; the UI MUST update without manual wiring once the
index regenerates.

Rationale: Predictable governance and low operational overhead.

## Additional Constraints

- Hosting target: GitHub Pages or equivalent static host.
- Export: Static export with relative asset paths; images unoptimized to avoid
	server transforms.
- No network calls outside the repository origin by default. External links are
	allowed for documentation only.
- Security: Do not execute untrusted schema content. Render text safely.

## Development Workflow & Quality Gates

1. Run the index generator to produce `public/schemas-index.json` from
	 `schemas/`.
2. Local dev uses client‑side rendering; no server APIs.
3. Quality gates (PASS required):
	 - Build succeeds and produces a deterministic `out/` export.
	 - Lint/typecheck has no errors for changed files.
	 - Accessibility basics verified (landmarks, labels, keyboard focus).
4. Deploy by publishing the static export directory to Pages.

## Governance

- This constitution supersedes ad‑hoc practices for this UI.
- Amendments require a PR describing the change, rationale, and version bump.
- Versioning policy:
	- MAJOR: Backward‑incompatible governance or build contract changes.
	- MINOR: New principle/section or substantial guidance expansion.
	- PATCH: Clarifications and non‑semantic edits.
- Reviews MUST check: principles compliance, build determinism, and static host
	compatibility.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): Original adoption date unknown | **Last Amended**: 2025-10-22
