/*
  Generator for schemas-index.json (T006, T008, T009)
  - Recursively scans the repository "schemas/" directory
  - Emits a deterministic tree to ui/public/schemas-index.json
  - Validates output against contracts/schemas-index.schema.json
  - Note: Reference extraction (T007) intentionally deferred to a later step
*/

import { promises as fs } from 'node:fs';
import path from 'node:path';
import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

type NodeType = 'folder' | 'schema';

interface DirectoryNode {
  name: string;
  type: NodeType;
  path: string; // relative to schemas/
  children?: DirectoryNode[];
}

interface IndexDoc {
  generatedAt: string; // ISO date-time
  root: DirectoryNode;
}

interface ReferenceLink {
  sourcePath: string; // relative to schemas/
  displayText: string; // the $ref string as found
  kind: 'ref' | 'allOf' | 'anyOf' | 'oneOf' | 'extends' | 'unknown';
  targetPath?: string; // resolved relative path to another file when applicable
}

interface RefsDoc {
  generatedAt: string;
  refs: ReferenceLink[];
}

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCHEMAS_DIR = path.resolve(REPO_ROOT, 'schemas');
const OUTPUT_FILE = path.resolve(REPO_ROOT, 'ui', 'public', 'schemas-index.json');
const CONTRACT_FILE = path.resolve(REPO_ROOT, 'specs', '001-schemas-directory-ui', 'contracts', 'schemas-index.schema.json');
const REFS_OUTPUT_FILE = path.resolve(REPO_ROOT, 'ui', 'public', 'schemas-refs.json');
const COPIED_SCHEMAS_DIR = path.resolve(REPO_ROOT, 'ui', 'public', 'schemas');

async function pathExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

async function readDirSorted(dir: string): Promise<string[]> {
  const entries: string[] = await fs.readdir(dir);
  return entries.sort((a: string, b: string) => a.localeCompare(b));
}

async function buildTree(absDir: string, relFromSchemas: string): Promise<DirectoryNode> {
  const name = relFromSchemas === '' ? 'schemas' : path.basename(absDir);
  const node: DirectoryNode = {
    name,
    type: 'folder',
    path: relFromSchemas === '' ? '/' : relFromSchemas.replace(/\\/g, '/'),
    children: []
  };

  const items = await readDirSorted(absDir);
  const folders: DirectoryNode[] = [];
  const files: DirectoryNode[] = [];

  for (const entry of items) {
    const abs = path.join(absDir, entry);
    const rel = relFromSchemas ? path.join(relFromSchemas, entry) : entry;
    const stat = await fs.lstat(abs);
    if (stat.isDirectory()) {
      const child = await buildTree(abs, rel);
      // Include folders even if empty so the hierarchy is visible in the UI
      folders.push(child);
    } else if (stat.isFile()) {
      if (entry.toLowerCase().endsWith('.json')) {
        files.push({ name: entry, type: 'schema', path: rel.replace(/\\/g, '/') });
      }
    }
  }

  // Deterministic ordering: folders first, then files; both already sorted by name
  node.children = [...folders, ...files];
  return node;
}

async function validateAgainstContract(doc: IndexDoc) {
  const raw = await fs.readFile(CONTRACT_FILE, 'utf8');
  const schema = JSON.parse(raw);
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv); // enable date-time, uri, email, etc.
  const validate = ajv.compile(schema);
  const valid = validate(doc);
  if (!valid) {
    const errors: ErrorObject[] = (validate.errors || []) as ErrorObject[];
    const message = errors.map((e: ErrorObject) => `${e.instancePath} ${e.message}`).join('\n');
    throw new Error(`Index does not conform to contract:\n${message}`);
  }
}

export async function main() {
  if (!(await pathExists(SCHEMAS_DIR))) {
    throw new Error(`Schemas directory not found: ${SCHEMAS_DIR}`);
  }
  const root = await buildTree(SCHEMAS_DIR, '');
  const indexDoc: IndexDoc = {
    generatedAt: new Date().toISOString(),
    root
  };
  await validateAgainstContract(indexDoc);
  const json = JSON.stringify(indexDoc, null, 2) + '\n';
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, json, 'utf8');
  console.log(`[generator] Wrote ${path.relative(REPO_ROOT, OUTPUT_FILE)} (${json.length} bytes)`);

  // T007: Collect references into a separate manifest without changing index contract
  const refs: ReferenceLink[] = await collectAllRefs();
  const refsDoc: RefsDoc = { generatedAt: indexDoc.generatedAt, refs };
  const refsJson = JSON.stringify(refsDoc, null, 2) + '\n';
  await fs.writeFile(REFS_OUTPUT_FILE, refsJson, 'utf8');
  console.log(`[generator] Wrote ${path.relative(REPO_ROOT, REFS_OUTPUT_FILE)} (${refsJson.length} bytes)`);

  // Copy schema JSON files into public for the static preview (preserve structure)
  const copied = await copySchemaJsonToPublic();
  console.log(`[generator] Copied ${copied} JSON file(s) into ${path.relative(REPO_ROOT, COPIED_SCHEMAS_DIR)}`);
}

async function collectAllRefs(): Promise<ReferenceLink[]> {
  const results: ReferenceLink[] = [];
  // Walk filesystem to get all json files under schemas
  async function walk(dir: string) {
    const entries = await readDirSorted(dir);
    for (const entry of entries) {
      const abs = path.join(dir, entry);
      const stat = await fs.lstat(abs);
      if (stat.isDirectory()) await walk(abs);
      else if (stat.isFile() && entry.toLowerCase().endsWith('.json')) {
        await collectRefsFromFile(abs, results);
      }
    }
  }
  await walk(SCHEMAS_DIR);
  return results;
}

async function collectRefsFromFile(absFile: string, out: ReferenceLink[]) {
  try {
    const raw = await fs.readFile(absFile, 'utf8');
    const json = JSON.parse(raw);
    const rel = path.relative(SCHEMAS_DIR, absFile).replace(/\\/g, '/');

    // Deep scan for $ref anywhere
    function scan(obj: any, contextKind: ReferenceLink['kind'] = 'unknown') {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) { obj.forEach(v => scan(v, contextKind)); return; }
      // Track composition keywords
      if (obj.allOf) scan(obj.allOf, 'allOf');
      if (obj.anyOf) scan(obj.anyOf, 'anyOf');
      if (obj.oneOf) scan(obj.oneOf, 'oneOf');
      // $ref
      if (typeof obj.$ref === 'string') {
        const displayText = obj.$ref as string;
        const target = resolveRefTarget(absFile, displayText);
        out.push({ sourcePath: rel, displayText, kind: contextKind === 'unknown' ? 'ref' : contextKind, targetPath: target });
      }
      // Continue recursion
      for (const val of Object.values(obj)) scan(val, contextKind);
    }

    scan(json);
  } catch {
    // Ignore JSON parse errors for non-schema files
  }
}

function resolveRefTarget(sourceAbs: string, ref: string): string | undefined {
  // Fragment-only refs → same file
  if (ref.startsWith('#')) {
    return path.relative(SCHEMAS_DIR, sourceAbs).replace(/\\/g, '/');
  }
  // URL-like refs are ignored for resolution
  if (/^[a-zA-Z]+:\/\//.test(ref)) return undefined;
  // Otherwise treat as relative path; strip fragment
  const filePart = ref.split('#')[0];
  if (!filePart) return undefined;
  const abs = path.resolve(path.dirname(sourceAbs), filePart);
  return abs.startsWith(SCHEMAS_DIR) ? path.relative(SCHEMAS_DIR, abs).replace(/\\/g, '/') : undefined;
}

async function copySchemaJsonToPublic(): Promise<number> {
  let count = 0;
  async function walk(dir: string) {
    const entries = await readDirSorted(dir);
    for (const entry of entries) {
      const abs = path.join(dir, entry);
      const stat = await fs.lstat(abs);
      if (stat.isDirectory()) {
        await walk(abs);
      } else if (stat.isFile() && entry.toLowerCase().endsWith('.json')) {
        const rel = path.relative(SCHEMAS_DIR, abs);
        const dest = path.join(COPIED_SCHEMAS_DIR, rel);
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.copyFile(abs, dest);
        count++;
      }
    }
  }
  await fs.mkdir(COPIED_SCHEMAS_DIR, { recursive: true });
  await walk(SCHEMAS_DIR);
  return count;
}

// Execute when run directly via ts-node
if (require.main === module) {
  main().catch(err => {
    console.error('[generator] Error:', err.message || err);
    process.exit(1);
  });
}

