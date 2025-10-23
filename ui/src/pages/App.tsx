// App shell (T010) + basic US1 wiring (T021)
// Framework-free DOM wiring to keep runtime deps minimal.

import type { IndexDoc } from '../lib/loadIndex';
import { loadIndex } from '../lib/loadIndex';
import { startRouter, type Route } from '../router';
import renderFolderView from './FolderView';
import renderSchemaView from './SchemaView';

export async function renderAppShell(root: HTMLElement) {
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

  const treeEl = root.querySelector('#tree') as HTMLElement;
  const crumbsEl = root.querySelector('#breadcrumbs') as HTMLElement;
  const filterEl = root.querySelector('#filter') as HTMLInputElement;
  const schemaArticle = root.querySelector('#schemaView') as HTMLElement;
  const emptyArticle = root.querySelector('#emptyState') as HTMLElement;
  const titleEl = root.querySelector('#schemaTitle') as HTMLElement;
  const descEl = root.querySelector('#schemaDesc') as HTMLElement;
  const tbodyEl = root.querySelector('#schemaTableBody') as HTMLElement;
  const refsEl = root.querySelector('#refs') as HTMLElement;
  const rawEl = root.querySelector('#rawJson') as HTMLElement;
  const toggleBtn = root.querySelector('#toggleJson') as HTMLElement;

  let index: IndexDoc | null = null;
  let hiddenNames: Set<string> = new Set();

  // Load optional config used in preview (ui/public/app.config.json)
  try {
    const res = await fetch('app.config.json');
    if (res.ok){ const cfg = await res.json(); if (cfg && Array.isArray(cfg.hiddenFolderNames)) hiddenNames = new Set(cfg.hiddenFolderNames); }
  } catch {}

  // Load index
  index = await loadIndex('');

  const renderRoot = () => {
    if (!index) return;
    renderFolderView(treeEl, crumbsEl, index, [], { filter: filterEl.value, hiddenFolderNames: hiddenNames });
    emptyArticle.hidden = false; schemaArticle.hidden = true;
  };

  filterEl.addEventListener('input', renderRoot);

  // Start router for schema deep links
  startRouter(async (route: Route)=>{
    if (!index) return;
    if (route.path === '/schema' && route.params?.path){
      emptyArticle.hidden = true; schemaArticle.hidden = false;
      await renderSchemaView(schemaArticle, titleEl, descEl, tbodyEl, refsEl, rawEl, toggleBtn, route.params.path);
      const parts = route.params.path.split('/').slice(0,-1).filter(Boolean);
      renderFolderView(treeEl, crumbsEl, index!, parts, { filter: filterEl.value, hiddenFolderNames: hiddenNames });
    } else {
      renderRoot();
    }
  });
}

export default renderAppShell;
