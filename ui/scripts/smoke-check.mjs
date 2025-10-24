// Simple smoke-check against the Vite dev server
// Requires the dev server to be running at http://localhost:5173/

import http from 'node:http';
import https from 'node:https';

const base = 'http://localhost:5173';

function getJSON(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      const { statusCode = 0 } = res;
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        if (statusCode >= 200 && statusCode < 300) {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`GET ${url} -> ${statusCode}`));
        }
      });
    });
    req.on('error', reject);
  });
}

function tryGetJSON(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      const { statusCode = 0 } = res;
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        if (statusCode >= 200 && statusCode < 300) {
          try {
            resolve({ ok: true, status: statusCode, json: JSON.parse(raw) });
          } catch {
            resolve({ ok: false, status: 500 });
          }
        } else {
          resolve({ ok: false, status: statusCode });
        }
      });
    });
    req.on('error', () => resolve({ ok: false, status: 0 }));
  });
}

function listSchemas(node, acc = []) {
  if (!node) return acc;
  if (node.type === 'schema') acc.push(node);
  if (Array.isArray(node.children)) {
    for (const c of node.children) listSchemas(c, acc);
  }
  return acc;
}

function findSchemaByNameOrPath(root, { name, path }) {
  const all = listSchemas(root, []);
  for (const s of all) {
    if ((name && s.name === name) || (path && s.path === path)) return s;
  }
  return null;
}

function hasDirectProperties(schema) {
  if (!schema || typeof schema !== 'object') return false;
  const props = schema.properties;
  return !!(props && typeof props === 'object' && Object.keys(props).length > 0);
}

async function main() {
  const idx = await getJSON(`${base}/schemas-index.json`);
  const all = listSchemas(idx.root, []);
  if (!all.length) throw new Error('No schema nodes found in index');

  const first = all[0];
  const firstSchema = await getJSON(`${base}/schemas/${first.path}`);

  let second = null;
  let secondSchema = null;
  let withDirectPropsCount = hasDirectProperties(firstSchema) ? 1 : 0;
  // find a different schema that has direct properties
  for (let i = 1; i < all.length; i++) {
    const cand = all[i];
    try {
      const candSchema = await getJSON(`${base}/schemas/${cand.path}`);
      if (hasDirectProperties(candSchema)) {
        withDirectPropsCount++;
        second = cand;
        secondSchema = candSchema;
        break;
      }
    } catch (e) {
      // ignore failures and continue to next candidate
    }
  }

  // Appointment-focused probe
  const appointmentExpectedPath = 'Customer/Appointment.schema.json';
  const inIndex = !!findSchemaByNameOrPath(idx.root, { path: appointmentExpectedPath, name: 'Appointment.schema.json' });
  const apRes = await tryGetJSON(`${base}/schemas/${appointmentExpectedPath}`);
  const ap = apRes.ok ? apRes.json : null;
  const appointmentSample = {
    expectedPath: appointmentExpectedPath,
    foundInIndex: inIndex,
    httpOk: apRes.ok,
    httpStatus: apRes.status,
    title: ap && ap.title || null,
    hasProperties: ap ? hasDirectProperties(ap) : null,
    propertyCount: ap && ap.properties ? Object.keys(ap.properties).length : null,
  };

  const samples = [
    {
      path: first.path,
      title: firstSchema.title || null,
      hasProperties: hasDirectProperties(firstSchema),
      propertyCount: firstSchema && firstSchema.properties ? Object.keys(firstSchema.properties).length : 0,
    },
  ];

  if (second && secondSchema) {
    samples.push({
      path: second.path,
      title: secondSchema.title || null,
      hasProperties: true,
      propertyCount: Object.keys(secondSchema.properties || {}).length,
    });
  }

  const out = {
    IndexGeneratedAt: idx.generatedAt,
    totalSchemas: all.length,
    withDirectPropsCount,
    secondSampleFound: !!(second && secondSchema),
    Appointment: appointmentSample,
    Samples: samples,
  };
  process.stdout.write(JSON.stringify(out));
}

main().catch((err) => {
  console.error(String(err && err.stack) || String(err));
  process.exit(1);
});
