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

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCHEMAS_DIR = path.resolve(REPO_ROOT, 'schemas');
const OUTPUT_FILE = path.resolve(REPO_ROOT, 'ui', 'public', 'schemas-index.json');
const CONTRACT_FILE = path.resolve(REPO_ROOT, 'specs', '001-schemas-directory-ui', 'contracts', 'schemas-index.schema.json');

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
      // Only include folder if it has children (avoid empty branches)
      if (child.children && child.children.length > 0) folders.push(child);
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
}

// Execute when run directly via ts-node
if (require.main === module) {
  main().catch(err => {
    console.error('[generator] Error:', err.message || err);
    process.exit(1);
  });
}

