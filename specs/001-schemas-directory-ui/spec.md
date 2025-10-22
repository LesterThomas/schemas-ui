# Feature Specification: Schemas Directory UI (ODA‑style)

**Feature Branch**: `001-schemas-directory-ui`  
**Created**: 2025-10-22  
**Status**: Draft  
**Input**: User description: "The user interface should mimic the ODA Components (https://www.tmforum.org/oda/directory/components-map) and Open API (https://www.tmforum.org/oda/open-apis/directory) interfaces. The schemas should be presented in a hierarchy mimiking the folder structure. The individual schemas should be displayed as a nicely formatted table with a button in the top right corner to display the json. Where a schema references another schems (using $Ref or $AllOf) then this should be implemented as a link."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Browse hierarchy and view schema (Priority: P1)

Users can browse the repository's `schemas/` hierarchy, open a schema, view its
fields in a readable table, and toggle to see raw JSON.

**Why this priority**: This is the primary value of the UI—discovering schemas
and understanding their structure quickly.

**Independent Test**: Start from the root, navigate into nested folders, open a
schema file, verify a formatted table renders and a control reveals the JSON
payload.

**Acceptance Scenarios**:

1. **Given** the UI root, **When** the user clicks a folder, **Then** the view
  shows that folder's children and a breadcrumb with the current path.
2. **Given** a folder with schemas, **When** the user selects a schema file,
  **Then** a table displays key/value pairs (including nested properties in an
  intelligible way) and a button reveals the JSON.

---

### User Story 2 - Follow schema references (Priority: P2)

Users can follow schema references to related definitions when a schema includes
links via reference constructs.

**Why this priority**: Cross‑navigation between related schemas is essential for
comprehension and reduces time spent searching.

**Independent Test**: Open any schema that references another; verify reference
elements are rendered as links that navigate to the target.

**Acceptance Scenarios**:

1. **Given** a schema with a reference, **When** the user clicks the reference
  link, **Then** the UI opens the referenced schema view.
2. **Given** a reference that cannot be resolved, **When** the view renders,
  **Then** the UI displays a clear, non‑blocking indication (e.g., "Reference
  not found") and keeps the rest of the schema usable.

---

### User Story 3 - Find and deep‑link (Priority: P3)

Users can quickly find schemas by name/path and share direct links to folders or
schema views.

**Why this priority**: Improves productivity and collaboration by enabling fast
access and shareable context.

**Independent Test**: Use a filter to narrow visible items by name; copy a link
to a schema and open it in a new session to reach the same view directly.

**Acceptance Scenarios**:

1. **Given** the directory view, **When** a filter term is entered, **Then** the
  list updates to show matching folders/schemas only.
2. **Given** a schema view, **When** the user copies the link and shares it,
  **Then** opening the link lands on the same schema with the table visible.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Extremely deep folder nesting (ensure breadcrumbs and scrolling remain usable)
- Very large directories (pagination or virtualized rendering to keep UI
  responsive)
- Invalid or malformed schema files (render error message and continue)
- Unresolvable references (broken links) with graceful, non‑blocking notice
- Cyclic references (prevent infinite navigation loops)
- Non‑schema files present in folders (ignore or present as non‑clickable)

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: The system MUST display the repository `schemas/` folder structure
  as a navigable hierarchy (folders and schema files).
- **FR-002**: The system MUST render a selected schema as a readable tabular
  view summarizing key properties and metadata.
- **FR-003**: The system MUST provide a control to show/hide the raw JSON for
  the selected schema in the same view.
- **FR-004**: The system MUST provide breadcrumb navigation reflecting the
  current folder path and allow jumping to any ancestor.
- **FR-005**: The system MUST turn references within a schema into links when
  they point to another schema (e.g., reference constructs commonly used in
  schema definitions).
- **FR-006**: Clicking a reference link MUST navigate to the referenced schema
  view (or indicate clearly if the target cannot be resolved).
- **FR-007**: The system MUST support deep links that open a specific folder or
  schema view directly via a shareable URL.
- **FR-008**: The system MUST support filtering by name/path to locate schemas
  quickly within the directory.
- **FR-009**: The system MUST handle invalid or malformed schema files by
  showing a non‑blocking error message while keeping the UI functional.
- **FR-010**: The system MUST avoid infinite loops when cyclic references are
  encountered (e.g., cap traversal depth for link resolution).
- **FR-011**: The system MUST perform all interactions in the browser without
  requiring server execution at view time (suitable for static hosting).
- **FR-012**: The system SHOULD remain usable with large directories by keeping
  interactions responsive (e.g., avoid full re‑renders of large lists).
- **FR-013**: The system MUST use accessible UI patterns (keyboard navigation,
  semantic headings, sufficient contrast, focus management).

#### Assumptions

- Schemas are stored as JSON files within `schemas/` and subfolders.
- References use common schema reference patterns; when a reference cannot be
  mapped to a file path, it is rendered as plain text with an explanatory note.
- No authentication or role‑based access is required for viewing.

### Key Entities *(include if feature involves data)*

- **Directory Node**: Represents either a folder or a schema file in the
  hierarchy. Attributes: name, type (folder|schema), path, children (for
  folders).
- **Schema Document**: A parsed schema with metadata and properties suitable for
  tabular display. Attributes: path, title/name, description, properties,
  references.
- **Reference Link**: A linkable pointer found within a schema that may resolve
  to another schema document. Attributes: source path, target path (if
  resolvable), display text.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: A user can navigate from the root to any schema and view its
  formatted table in under 10 seconds on a typical broadband connection.
- **SC-002**: Reference links correctly navigate to target schemas for at least
  95% of valid references present in the repository (remaining cases display
  clear non‑blocking notices).
- **SC-003**: Users report that the table view makes schema comprehension
  faster, with 90% of evaluators successfully answering a property‑level
  question after viewing a single schema.
- **SC-004**: Deep links open directly to the intended schema/folder with no
  additional navigation steps required 100% of the time in supported browsers.
