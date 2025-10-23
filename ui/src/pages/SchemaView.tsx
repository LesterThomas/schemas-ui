import { renderSchemaTable, collectDirectProperties } from '../components/SchemaTable';
import bindJsonToggle from '../components/JsonToggle';

export async function renderSchemaView(
  container: HTMLElement,
  titleEl: HTMLElement,
  descEl: HTMLElement,
  tbodyEl: HTMLElement,
  refsEl: HTMLElement,
  rawEl: HTMLElement,
  toggleBtn: HTMLElement,
  relPath: string
){
  // Fetch from the same public mirror used by the preview
  const url = `schemas/${relPath}`;
  const res = await fetch(url);
  if (!res.ok) { container.textContent = `Failed to load ${relPath}`; return; }
  const json = await res.json();

  const title = (json && json.title) || relPath.split('/').pop() || 'Schema';
  titleEl.textContent = title as string;
  descEl.textContent = (json && json.description) || '';

  // Try direct properties first (keep simple in typed app; advanced deref handled in preview)
  const rows = collectDirectProperties(json);
  renderSchemaTable(tbodyEl, rows);

  // Bind JSON toggle and set raw text
  rawEl.textContent = JSON.stringify(json, null, 2);
  bindJsonToggle(toggleBtn, rawEl);
}

export default renderSchemaView;
