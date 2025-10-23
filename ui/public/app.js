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
const schemaCache = new Map(); // url -> parsed JSON

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

function pathToSchemaUrl(nodePath){
  // Map to copied schemas under public/schemas/<relative-path>.json
  const p = (nodePath || '').replace(/^\/+/, '');
  return 'schemas/' + p;
}

async function openSchema(node){
  // Update hash for deep link
  try { window.location.hash = '#/schema/' + encodeURIComponent(node.path); } catch {}
  renderBreadcrumbs();
  emptyState.hidden = true;
  schemaView.hidden = false;
  tbodyEl.replaceChildren();
  refsEl.replaceChildren();
  rawEl.hidden = true;
  toggleBtn.setAttribute('aria-expanded','false');

  const url = pathToSchemaUrl(node.path);
  const schema = await fetchSchema(url);
  // Some schemas only expose their object under definitions/$defs/components.schemas
  const effective = selectPrimaryObjectSchema(schema) || schema;
  titleEl.textContent = schema.title || effective.title || node.name;
  descEl.textContent = (schema.description || effective.description || '');

  // Render properties table with simple resolution of refs, allOf/anyOf/oneOf, arrays
  const rows = [];
  const baseDir = node.path.split('/').slice(0,-1).join('/');
  await collectProps(effective, new Set(effective.required || []), '', rows, 0, baseDir, url);
  rows.forEach(r => tbodyEl.appendChild(renderRow(r)));

  // Collect other reference constructs (allOf with $ref, etc.)
  const refList = [];
  function collectRefs(obj){
    if(!obj || typeof obj !== 'object') return;
    if(Array.isArray(obj)) { obj.forEach(collectRefs); return; }
    if(obj.$ref && typeof obj.$ref === 'string') refList.push(obj.$ref);
    Object.values(obj).forEach(collectRefs);
  }
  // Prefer collecting from the effective subschema if we picked one
  const refSource = effective || schema;
  if(refSource.allOf || refSource.anyOf || refSource.oneOf){ collectRefs({allOf:refSource.allOf,anyOf:refSource.anyOf,oneOf:refSource.oneOf}); }
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
  // Resolve against the index using the referenced filename if present
  const base = ref.split('#')[0];
  let target = null;
  if (base) {
    // Try exact path match first
    target = findNodeByPath(base);
    // Otherwise try matching by basename anywhere in the tree
    if(!target){
      const wanted = base.split('/').pop();
      function walk(node){
        if(target) return;
        if(node.type==='schema' && node.name === wanted){ target = node; return; }
        (node.children||[]).forEach(walk);
      }
      walk(indexData.root);
    }
  }
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

function findNodeByPath(pathStr){
  const wanted = (pathStr || '').replace(/^\/+|\/+$/g,'');
  let found = null;
  function walk(node){
    if(found) return;
    if(node.type === 'schema' && node.path.replace(/^\/+|\/+$/g,'') === wanted){ found = node; return; }
    (node.children||[]).forEach(walk);
  }
  walk(indexData.root);
  return found;
}

function applyHashRoute(){
  const h = window.location.hash || '';
  if(h.startsWith('#/schema/')){
    const enc = h.substring('#/schema/'.length);
    const rel = decodeURIComponent(enc);
    const node = findNodeByPath(rel);
    if(node){
      currentPath = node.path.split('/').filter(Boolean);
      renderBreadcrumbs();
      openSchema(node);
      return true;
    }
  }
  return false;
}

(async function init(){
  try {
    await loadIndex();
    renderBreadcrumbs();
    renderTree();
    // Apply route if present
    if(!applyHashRoute()){
      window.addEventListener('hashchange', applyHashRoute);
    }
  } catch(err){
    treeEl.textContent = 'Failed to load schemas index.';
    console.error(err);
  }
})();

// Helpers for table rendering
function renderRow(r){
  const tr = document.createElement('tr');
  const tdName = document.createElement('td');
  tdName.textContent = r.name;
  const tdType = document.createElement('td');
  tdType.textContent = r.type;
  const tdReq = document.createElement('td');
  tdReq.textContent = r.required ? 'Yes' : 'No';
  const tdDesc = document.createElement('td');
  tdDesc.textContent = r.description || '';
  if (r.ref) {
    const link = document.createElement('a');
    link.textContent = r.ref;
    link.href = '#';
    link.className = 'link';
    link.addEventListener('click', (e)=>{ e.preventDefault(); openRef(r.ref); });
    tdDesc.appendChild(document.createTextNode(' '));
    tdDesc.appendChild(link);
  }
  tr.append(tdName, tdType, tdReq, tdDesc);
  return tr;
}

async function collectProps(schema, requiredSet, prefix, outRows, depth, baseDir, currentUrl){
  if (depth > 3 || !schema || typeof schema !== 'object') return;
  // If this node is a shell that just holds definitions, drill into a primary one
  if (!schema.properties && (schema.definitions || schema.$defs || (schema.components && schema.components.schemas))){
    const inner = selectPrimaryObjectSchema(schema);
    if (inner && inner !== schema){
      await collectProps(inner, new Set(inner.required || []), prefix, outRows, depth+1, baseDir, currentUrl);
      return;
    }
  }
  // Direct properties on this object
  if (schema.properties && typeof schema.properties === 'object'){
    const req = new Set(Array.isArray(schema.required) ? schema.required : []);
    for (const [name, def] of Object.entries(schema.properties)){
      const row = buildRow(prefix + name, def, req.has(name));
      outRows.push(row);
      // Recurse arrays' item properties
      if (def && typeof def === 'object' && def.type === 'array' && def.items){
        await collectProps(def.items, new Set(def.items.required || []), prefix + name + '[]' + '.', outRows, depth+1, baseDir, currentUrl);
      }
    }
  }
  // Composition keywords: merge in properties from subschemas
  for (const key of ['allOf','anyOf','oneOf']){
    const arr = schema[key];
    if (Array.isArray(arr)){
      for (const sub of arr){
        if (sub && typeof sub === 'object'){
          if (sub.$ref) {
            try {
              const { url, pointer } = refToFetchUrl(sub.$ref, baseDir, currentUrl);
              if (url){
                const target = await fetchSchema(url);
                const targetPart = pointer ? resolvePointer(target, pointer) : target;
                await collectProps(targetPart, new Set(targetPart?.required || []), prefix, outRows, depth+1, baseDir, url);
              }
            } catch {
              // Ignore unresolved refs in composition; keep local properties rendered
            }
          } else {
            await collectProps(sub, new Set(sub.required || []), prefix, outRows, depth+1, baseDir, currentUrl);
          }
        }
      }
    }
  }
  // Root-level $ref fallback
  if (!schema.properties && schema.$ref) {
    try {
      const { url, pointer } = refToFetchUrl(schema.$ref, baseDir, currentUrl);
      if (url){
        const target = await fetchSchema(url);
        const targetPart = pointer ? resolvePointer(target, pointer) : target;
        await collectProps(targetPart, new Set(targetPart?.required || []), prefix, outRows, depth+1, baseDir, url);
      }
    } catch {
      // Ignore unresolved root refs
    }
  }
}

// Heuristic: pick the most relevant object schema when the root only contains
// definitions/$defs/components.schemas. Preference order:
// 1) Definition key matching `title`
// 2) Single entry in defs
// 3) First entry that looks like an object schema (has properties or composition)
function selectPrimaryObjectSchema(schema){
  if (!schema || typeof schema !== 'object') return null;
  if (schema.properties && typeof schema.properties === 'object') return schema;
  const defs = schema.definitions || schema.$defs || (schema.components && schema.components.schemas);
  if (!defs || typeof defs !== 'object') return null;
  const keys = Object.keys(defs);
  if (!keys.length) return null;
  if (schema.title && defs[schema.title] && typeof defs[schema.title] === 'object') return defs[schema.title];
  if (keys.length === 1) return defs[keys[0]];
  for (const k of keys){
    const v = defs[k];
    if (v && typeof v === 'object' && (v.properties || v.allOf || v.anyOf || v.oneOf)) return v;
  }
  // Fallback to first object-like entry
  for (const k of keys){
    const v = defs[k];
    if (v && typeof v === 'object') return v;
  }
  return null;
}

function buildRow(name, def, required){
  let typeText = '';
  if (def){
    if (Array.isArray(def.type)) typeText = def.type.join('|');
    else if (typeof def.type === 'string') typeText = def.type;
    else if (def.enum) typeText = 'enum';
    else if (def.$ref) typeText = 'ref';
  }
  if (!typeText && def && typeof def === 'object' && def.format && (def.type === 'string' || !def.type)){
    typeText = 'string(' + def.format + ')';
  }
  return {
    name,
    type: typeText || '',
    required: !!required,
    description: (def && def.description) || '',
    ref: def && def.$ref ? def.$ref : null
  };
}

function refToFetchUrl(ref, baseDir, currentUrl){
  // Returns { url, pointer } where url is a fetchable path under ui/public
  if (!ref || typeof ref !== 'string') return { url: null, pointer: null };
  if (/^[a-zA-Z]+:\/\//.test(ref)) return { url: null, pointer: null }; // external URL not supported
  let filePart = ref;
  let pointer = null;
  const hashIdx = ref.indexOf('#');
  if (hashIdx >= 0){ filePart = ref.slice(0, hashIdx); pointer = ref.slice(hashIdx+1); if (!pointer.startsWith('/')) pointer = '/' + pointer; }
  let relPath;
  if (!filePart){
    // fragment-only → same file
    const currRel = (currentUrl || '').replace(/^schemas\//,'');
    relPath = currRel;
  } else if (filePart.startsWith('/')){
    relPath = filePart.replace(/^\//,'');
  } else {
    relPath = normalizePath([baseDir, filePart].filter(Boolean).join('/'));
  }
  return { url: 'schemas/' + relPath, pointer };
}

function normalizePath(p){
  const parts = p.split('/');
  const stack = [];
  for (const seg of parts){
    if (!seg || seg === '.') continue;
    if (seg === '..') stack.pop(); else stack.push(seg);
  }
  return stack.join('/');
}

async function fetchSchema(url){
  if (schemaCache.has(url)) return schemaCache.get(url);
  const res = await fetch(url + '?_=' + encodeURIComponent(timeISO()));
  if (!res.ok) throw new Error('Failed to load ' + url);
  const json = await res.json();
  schemaCache.set(url, json);
  return json;
}

function resolvePointer(obj, pointer){
  if (!pointer || pointer === '/' ) return obj;
  const parts = pointer.replace(/^\//,'').split('/').map(unescapeJsonPointer);
  let current = obj;
  for (const key of parts){
    if (current && typeof current === 'object' && key in current){ current = current[key]; }
    else return undefined;
  }
  return current;
}

function unescapeJsonPointer(s){
  return s.replace(/~1/g,'/').replace(/~0/g,'~');
}
