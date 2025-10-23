// Data loader (T012) - fetches schemas-index.json with cache busting
export interface DirectoryNode {
  name: string;
  type: 'folder' | 'schema';
  path: string;
  children?: DirectoryNode[];
}

export interface IndexDoc {
  generatedAt: string;
  root: DirectoryNode;
}

export async function loadIndex(baseUrl = ''): Promise<IndexDoc> {
  const ts = encodeURIComponent(new Date().toISOString());
  const url = `${baseUrl}/schemas-index.json?_=${ts}`.replace(/\/+/, '/');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load schemas-index.json (${res.status})`);
  return res.json();
}
