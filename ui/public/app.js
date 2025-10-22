const treeEl = document.getElementById('tree');
const crumbsEl = document.getElementById('breadcrumbs');
const filterEl = document.getElementById('filter');
const schemaView = document.getElementById('schemaView');
const emptyState = document.getElementById('emptyState');
const titleEl = document.getElementById('schemaTitle');
const descEl = document.getElementById('schemaDesc');
const tbodyEl = document.getElementById('schemaTableBody');
const refsEl = document.getElementById('refs');
const rawEl = document.getElementById('rawJson');
const toggleBtn = document.getElementById('toggleJson');

let indexData = null;
let currentPath = [];

function timeISO() { return new Date().toISOString(); }

function normalizeFilter(s){return (s||'').trim().toLowerCase();}

function matchesFilter(name, filter){
  if(!filter) return true;
  return name.toLowerCase().includes(filter);
}

async function loadIndex(){
  const res = await fetch('schemas-index.json?_=' + encodeURIComponent(timeISO()));
  if(!res.ok) throw new Error('Failed to load schemas-index.json');
  indexData = await res.json();
}

function renderBreadcrumbs(){
  if(!currentPath.length){ crumbsEl.textContent = 'Root'; return; }
  crumbsEl.textContent = ['Root', ...currentPath].join(' / ');
}

function renderTreeNode(node, filter){
  const li = document.createElement('li');
  if(node.type === 'folder'){
    const btn = document.createElement('button');
    btn.textContent = '📁 ' + node.name;
    btn.setAttribute('role','treeitem');
    btn.addEventListener('click', ()=>{
      currentPath = node.path.split('/').filter(Boolean);
      renderBreadcrumbs();
      // Expand children inline
      ul.replaceChildren(...(node.children||[]).filter(n=>matchesFilter(n.name, filter)).map(n=>renderTreeNode(n, filter)));
    });
    li.appendChild(btn);
    const ul = document.createElement('ul');
    ul.setAttribute('role','group');
    (node.children||[]).filter(n=>matchesFilter(n.name, filter)).forEach(child=>ul.appendChild(renderTreeNode(child, filter)));
    li.appendChild(ul);
  } else {
    const btn = document.createElement('button');
    btn.textContent = '📄 ' + node.name;
    btn.setAttribute('role','treeitem');
    btn.addEventListener('click', ()=>openSchema(node));
    li.appendChild(btn);
  }
  return li;
}

function renderTree(){
  const filter = normalizeFilter(filterEl.value);
  const root = indexData.root;
  const ul = document.createElement('ul');
  ul.setAttribute('role','tree');
  (root.children||[]).filter(n=>matchesFilter(n.name, filter)).forEach(n=>{
    ul.appendChild(renderTreeNode(n, filter));
  });
  treeEl.replaceChildren(ul);
}

function pathToMockUrl(nodePath){
  // For preview, map any Schema node to mock-schemas/<filename>.json
  const base = nodePath.split('/').pop();
  return 'mock-schemas/' + base;
}

async function openSchema(node){
  renderBreadcrumbs();
  emptyState.hidden = true;
  schemaView.hidden = false;
  tbodyEl.replaceChildren();
  refsEl.replaceChildren();
  rawEl.hidden = true;
  toggleBtn.setAttribute('aria-expanded','false');

  const res = await fetch(pathToMockUrl(node.path) + '?_=' + encodeURIComponent(timeISO()));
  if(!res.ok){
    titleEl.textContent = node.name;
    descEl.textContent = 'Failed to load schema content.';
    return;
  }
  const schema = await res.json();
  titleEl.textContent = schema.title || node.name;
  descEl.textContent = schema.description || '';

  // Render properties table (JSON Schema-like)
  const props = schema.properties || {};
  const required = new Set(schema.required || []);
  Object.entries(props).forEach(([name, def])=>{
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = name;
    const tdType = document.createElement('td');
    let typeText = Array.isArray(def.type) ? def.type.join('|') : def.type || (def.$ref ? 'ref' : '');
    tdType.textContent = typeText;
    const tdReq = document.createElement('td');
    tdReq.textContent = required.has(name) ? 'Yes' : 'No';
    const tdDesc = document.createElement('td');
    tdDesc.textContent = def.description || '';
    // Reference link if present
    if(def.$ref){
      const link = document.createElement('a');
      link.textContent = def.$ref;
      link.href = '#';
      link.className = 'link';
      link.addEventListener('click',(e)=>{e.preventDefault(); openRef(def.$ref);});
      tdDesc.appendChild(document.createTextNode(' '));
      tdDesc.appendChild(link);
    }
    tr.append(tdName, tdType, tdReq, tdDesc);
    tbodyEl.appendChild(tr);
  });

  // Collect other reference constructs (allOf with $ref, etc.)
  const refList = [];
  function collectRefs(obj){
    if(!obj || typeof obj !== 'object') return;
    if(Array.isArray(obj)) { obj.forEach(collectRefs); return; }
    if(obj.$ref && typeof obj.$ref === 'string') refList.push(obj.$ref);
    Object.values(obj).forEach(collectRefs);
  }
  if(schema.allOf || schema.anyOf || schema.oneOf){ collectRefs({allOf:schema.allOf,anyOf:schema.anyOf,oneOf:schema.oneOf}); }
  if(refList.length){
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'References: ';
    refList.forEach((r,i)=>{
      const link = document.createElement('a');
      link.textContent = r;
      link.href = '#';
      link.className = 'link';
      link.addEventListener('click',(e)=>{e.preventDefault(); openRef(r);});
      p.appendChild(link);
      if(i < refList.length-1) p.appendChild(document.createTextNode(', '));
    });
    refsEl.appendChild(p);
  }

  // Raw JSON
  rawEl.textContent = JSON.stringify(schema, null, 2);
}

async function openRef(ref){
  // For preview, resolve to mock file in same folder by filename
  const base = ref.split('#')[0];
  const target = indexData.root.children?.find(n => n.type==='schema' && n.name === base) || null;
  if(target){ await openSchema(target); }
  else {
    alert('Reference not found in preview index: ' + ref);
  }
}

toggleBtn.addEventListener('click', ()=>{
  const isHidden = rawEl.hasAttribute('hidden');
  if(isHidden){ rawEl.removeAttribute('hidden'); toggleBtn.textContent = 'Hide JSON'; toggleBtn.setAttribute('aria-expanded','true'); }
  else { rawEl.setAttribute('hidden',''); toggleBtn.textContent = 'Show JSON'; toggleBtn.setAttribute('aria-expanded','false'); }
});

filterEl.addEventListener('input', ()=> renderTree());

(async function init(){
  try {
    await loadIndex();
    renderBreadcrumbs();
    renderTree();
  } catch(err){
    treeEl.textContent = 'Failed to load schemas index.';
    console.error(err);
  }
})();
