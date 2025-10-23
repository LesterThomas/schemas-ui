type JSONObject = Record<string, unknown>;

export type PropertyRow = { name: string; type?: string; required?: boolean; description?: string };

function typeText(def: any): string | undefined {
  if (!def || typeof def !== 'object') return undefined;
  if (Array.isArray((def as any).type)) return (def as any).type.join('|');
  if (typeof (def as any).type === 'string') return (def as any).type as string;
  if ((def as any).enum) return 'enum';
  if ((def as any).format && (!(def as any).type || (def as any).type === 'string')) return `string(${(def as any).format})`;
  if ((def as any).$ref) return 'ref';
  return undefined;
}

export function collectDirectProperties(schema: JSONObject): PropertyRow[] {
  const rows: PropertyRow[] = [];
  const props = (schema as any).properties as JSONObject | undefined;
  const req = new Set<string>(Array.isArray((schema as any).required) ? (schema as any).required as string[] : []);
  if (props && typeof props === 'object'){
    for (const [name, def] of Object.entries(props)){
      rows.push({
        name,
        type: typeText(def),
        required: req.has(name),
        description: typeof (def as any)?.description === 'string' ? (def as any).description : undefined
      });
    }
  }
  return rows;
}

export function renderSchemaTable(tbody: HTMLElement, rows: PropertyRow[]){
  tbody.replaceChildren();
  for (const r of rows){
    const tr = document.createElement('tr');
    const tdName = document.createElement('td'); tdName.textContent = r.name;
    const tdType = document.createElement('td'); tdType.textContent = r.type || '';
    const tdReq = document.createElement('td'); tdReq.textContent = r.required ? 'Yes' : 'No';
    const tdDesc = document.createElement('td'); tdDesc.textContent = r.description || '';
    tr.append(tdName, tdType, tdReq, tdDesc);
    tbody.appendChild(tr);
  }
}
