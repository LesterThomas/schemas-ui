---

description: "Task list for Schemas Directory UI (ODA‑style)"
---

# Tasks: Schemas Directory UI (ODA‑style)

**Input**: Design documents from `D:/Dev/innovation-network/schemas-ui/specs/001-schemas-directory-ui/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested. No test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure (no implementation yet executed)

- [ ] T001 Create project directories in ui/: `ui/public/`, `ui/src/components/`, `ui/src/pages/`, `ui/src/styles/`, `ui/scripts/`
- [ ] T002 Create schema types file `ui/src/types/schema.ts` (DirectoryNode, SchemaDocument, ReferenceLink)
- [ ] T003 Create index generator scaffold `ui/scripts/generate-schemas-index.ts` (empty main function, TODOs)
- [ ] T004 Create placeholder `ui/public/.gitkeep` to ensure folder exists
- [ ] T005 Add contracts reference in docs `specs/001-schemas-directory-ui/contracts/schemas-index.schema.json` (confirm location in README placeholder `specs/001-schemas-directory-ui/quickstart.md`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [ ] T006 Implement directory scan in `ui/scripts/generate-schemas-index.ts` (read `schemas/` recursively; emit tree)
- [ ] T007 [P] Add reference extraction/resolution to generator in `ui/scripts/generate-schemas-index.ts` (collect $ref/$allOf-like links → relative paths)
- [ ] T008 Validate generated index against `specs/001-schemas-directory-ui/contracts/schemas-index.schema.json` within `ui/scripts/generate-schemas-index.ts`
- [ ] T009 Write output to `ui/public/schemas-index.json` (deterministic ordering)
- [ ] T010 Create app shell `ui/src/pages/App.tsx` (layout, header, main regions)
- [ ] T011 [P] Create basic styles `ui/src/styles/app.css` (responsive, accessible defaults, ODA-inspired)
- [ ] T012 Implement data loader `ui/src/lib/loadIndex.ts` (fetch `schemas-index.json` with cache-busting)
- [ ] T013 Implement client router `ui/src/router.tsx` (routes for folder view and schema view with path params)

**Checkpoint**: Foundation ready - directory index exists; app can load index and route

---

## Phase 3: User Story 1 - Browse hierarchy and view schema (Priority: P1) 🎯 MVP

**Goal**: Navigate folders, open a schema, render table, toggle raw JSON

**Independent Test**: From root, drill into folders to a schema; verify table renders and JSON toggle shows raw content

### Implementation for User Story 1

- [ ] T014 [P] [US1] Implement DirectoryTree component in `ui/src/components/DirectoryTree.tsx` (renders folders/files)
- [ ] T015 [P] [US1] Implement Breadcrumbs component in `ui/src/components/Breadcrumbs.tsx` (path-aware)
- [ ] T016 [P] [US1] Implement SchemaTable component in `ui/src/components/SchemaTable.tsx` (tabular properties)
- [ ] T017 [P] [US1] Implement JsonToggle control in `ui/src/components/JsonToggle.tsx` (button top-right to show JSON)
- [ ] T018 [US1] Implement FolderView page in `ui/src/pages/FolderView.tsx` (uses DirectoryTree, Breadcrumbs)
- [ ] T019 [US1] Implement SchemaView page in `ui/src/pages/SchemaView.tsx` (uses SchemaTable, JsonToggle)
- [ ] T020 [US1] Wire router paths in `ui/src/router.tsx` to FolderView/SchemaView
- [ ] T021 [US1] Integrate data loader in `ui/src/pages/App.tsx` to provide index/context

**Checkpoint**: User Story 1 independently functional

---

## Phase 4: User Story 2 - Follow schema references (Priority: P2)

**Goal**: Render references as links; navigate to target schema; handle missing targets gracefully

**Independent Test**: Open a schema with references; click a reference to navigate; missing targets show non-blocking notice

### Implementation for User Story 2

- [ ] T022 [P] [US2] Implement ReferenceLink component in `ui/src/components/ReferenceLink.tsx` (renders link or notice)
- [ ] T023 [US2] Enhance SchemaTable rendering in `ui/src/components/SchemaTable.tsx` to use ReferenceLink for references
- [ ] T024 [US2] Enhance router handler in `ui/src/router.tsx` to accept reference target paths and navigate to SchemaView

**Checkpoint**: User Story 2 independently functional

---

## Phase 5: User Story 3 - Find and deep‑link (Priority: P3)

**Goal**: Filter by name/path; copy/share deep links to folders/schemas

**Independent Test**: Filter list to match items; copy link and open in new session to land on same view

### Implementation for User Story 3

- [ ] T025 [P] [US3] Implement FilterInput component in `ui/src/components/FilterInput.tsx` (name/path filter)
- [ ] T026 [US3] Integrate filter into FolderView `ui/src/pages/FolderView.tsx` (client-side filtering)
- [ ] T027 [US3] Add DeepLink control in `ui/src/components/DeepLink.tsx` (copy sharable URL)
- [ ] T028 [US3] Ensure router supports direct navigation to any folder/schema via URL in `ui/src/router.tsx`

**Checkpoint**: User Story 3 independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T029 Accessibility pass in `ui/src/components/` (ARIA labels, focus, landmarks)
- [ ] T030 Performance: virtualize long lists in `ui/src/components/DirectoryTree.tsx` if needed
- [ ] T031 Documentation updates in `specs/001-schemas-directory-ui/quickstart.md` (add usage notes)
- [ ] T032 Code cleanup and refactoring across `ui/src/`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): Must complete before Foundational
- Foundational (Phase 2): Blocks all user stories
- User Story 1 (Phase 3): Depends on Foundational
- User Story 2 (Phase 4): Depends on User Story 1
- User Story 3 (Phase 5): Depends on User Story 1 (can proceed in parallel with US2 after US1)
- Polish: Final pass after desired stories are complete

### User Story Dependencies

- US1: None beyond foundational
- US2: Depends on US1
- US3: Depends on US1 (independent of US2)

### Within Each User Story

- Components in separate files can proceed in parallel [P]
- Page wiring follows after component creation

### Parallel Opportunities

- [P] T007, T011 can proceed alongside other foundational tasks
- [P] In US1: T014–T017 can run in parallel
- [P] In US3: T025 can start while T026–T028 finalize wiring

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Stop and validate

### Incremental Delivery

1. Deliver US1 → demo
2. Add US2 → demo
3. Add US3 → demo
4. Polish

---

## Validation Summary

- Total tasks: 32
- Tasks per story: US1 (8), US2 (3), US3 (4); Setup (5), Foundational (8), Polish (4)
- Parallel opportunities identified and marked with [P]
- Independent test criteria provided for each story
- Checklist format validated for all tasks
