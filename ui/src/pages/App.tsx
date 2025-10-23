// App shell (T010)
// Skeleton without JSX/React to avoid adding runtime deps at this stage.

export function renderAppShell(root: HTMLElement) {
  root.innerHTML = `
    <header class="topbar" role="banner">
      <h1>Schemas Directory</h1>
    </header>
    <main class="layout" role="main">
      <nav class="sidebar" aria-label="Schema folders">
        <div class="search">
          <input id="filter" type="search" placeholder="Filter by name…" aria-label="Filter" />
        </div>
        <div id="tree" class="tree" role="tree" aria-label="Schemas tree"></div>
      </nav>
      <section class="content" aria-live="polite">
        <div id="breadcrumbs" class="breadcrumbs" aria-label="Breadcrumbs"></div>
        <article id="schemaView" class="schema-view" hidden>
          <div class="schema-header">
            <h2 id="schemaTitle">Schema</h2>
            <button id="toggleJson" class="btn" aria-expanded="false" aria-controls="rawJson">Show JSON</button>
          </div>
          <p id="schemaDesc" class="muted"></p>
          <table class="schema-table" aria-describedby="schemaTitle">
            <thead>
              <tr>
                <th>Property</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody id="schemaTableBody"></tbody>
          </table>
          <div id="refs" class="refs"></div>
          <pre id="rawJson" class="raw" hidden></pre>
        </article>
        <article id="emptyState" class="empty">
          <p>Select a schema from the tree to view details.</p>
        </article>
      </section>
    </main>
  `;
}

export default renderAppShell;
