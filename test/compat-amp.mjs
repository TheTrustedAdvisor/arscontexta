/**
 * Compatibility test: run MCP tools against a real Ars Contexta vault
 * from the amp repo (fabric-architecture source).
 */
import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

const VAULT_PATH = join(process.cwd(), '.e2e-tmp-amp-vault');
const TIMEOUT_MS = 15_000;
let serverProcess;

function send(proc, msg) {
  proc.stdin.write(JSON.stringify(msg) + '\n');
}

function waitFor(proc, id, ms = 5000) {
  return new Promise((resolve, reject) => {
    let buf = '';
    const t = setTimeout(() => reject(new Error(`Timeout id=${id}`)), ms);
    function onData(chunk) {
      buf += chunk.toString();
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const p = JSON.parse(line);
          if (p.id === id) { clearTimeout(t); proc.stdout.off('data', onData); resolve(p); return; }
        } catch {}
      }
    }
    proc.stdout.on('data', onData);
  });
}

function callTool(proc, id, name, args) {
  send(proc, { jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });
  return waitFor(proc, id);
}

function getText(resp) {
  if (resp.error) return `ERROR: ${JSON.stringify(resp.error)}`;
  return resp.result.content[0].text;
}

async function run() {
  console.log(`Testing against real vault: ${VAULT_PATH}\n`);

  serverProcess = spawn('node', ['dist/server.js'], { stdio: ['pipe', 'pipe', 'pipe'] });
  serverProcess.stderr.on('data', (c) => process.stderr.write('[server] ' + c.toString()));

  send(serverProcess, {
    jsonrpc: '2.0', id: 0, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'compat', version: '1.0.0' } },
  });
  await waitFor(serverProcess, 0);
  send(serverProcess, { jsonrpc: '2.0', method: 'notifications/initialized' });

  // 1. tree-inject
  console.log('1. tree-inject:');
  const tree = getText(await callTool(serverProcess, 1, 'tree-inject', { vaultPath: VAULT_PATH, depth: 2 }));
  console.log(tree.split('\n').slice(0, 15).join('\n'));
  console.log(tree.includes('notes/') ? '  ✓ Found notes/' : '  ✗ Missing notes/');
  console.log(tree.includes('maps/') ? '  ✓ Found maps/' : '  ⚠ Missing maps/ (MOC directory)');
  console.log();

  // 2. health-check quick
  console.log('2. health-check (quick):');
  const health = getText(await callTool(serverProcess, 2, 'health-check', { mode: 'quick', vaultPath: VAULT_PATH }));
  console.log(health.split('\n').slice(0, 20).join('\n'));
  console.log();

  // 3. graph-query stats
  console.log('3. graph-query (stats):');
  const stats = getText(await callTool(serverProcess, 3, 'graph-query', { query: 'stats', vaultPath: VAULT_PATH }));
  console.log(stats);
  console.log();

  // 4. graph-query orphans
  console.log('4. graph-query (orphans):');
  const orphans = getText(await callTool(serverProcess, 4, 'graph-query', { query: 'orphans', vaultPath: VAULT_PATH }));
  console.log(orphans.split('\n').slice(0, 15).join('\n'));
  if (orphans.split('\n').length > 15) console.log(`  ... (${orphans.split('\n').length - 15} more lines)`);
  console.log();

  // 5. graph-query density
  console.log('5. graph-query (density):');
  const density = getText(await callTool(serverProcess, 5, 'graph-query', { query: 'density', vaultPath: VAULT_PATH }));
  console.log(density.split('\n').slice(0, 15).join('\n'));
  console.log();

  // 6. graph-query clusters
  console.log('6. graph-query (clusters):');
  const clusters = getText(await callTool(serverProcess, 6, 'graph-query', { query: 'clusters', vaultPath: VAULT_PATH }));
  console.log(clusters.split('\n').slice(0, 20).join('\n'));
  console.log();

  // 7. graph-query suggestions
  console.log('7. graph-query (suggestions):');
  const suggestions = getText(await callTool(serverProcess, 7, 'graph-query', { query: 'suggestions', vaultPath: VAULT_PATH }));
  console.log(suggestions.split('\n').slice(0, 15).join('\n'));
  console.log();

  // 8. note-search
  console.log('8. note-search (query: "Fabric"):');
  const search = getText(await callTool(serverProcess, 8, 'note-search', { query: 'Fabric', vaultPath: VAULT_PATH, scope: 'all' }));
  console.log(search.split('\n').slice(0, 15).join('\n'));
  console.log();

  // 9. note-search frontmatter
  console.log('9. note-search (frontmatter, query: "anti-pattern"):');
  const fmSearch = getText(await callTool(serverProcess, 9, 'note-search', { query: 'anti-pattern', vaultPath: VAULT_PATH, scope: 'frontmatter' }));
  console.log(fmSearch.split('\n').slice(0, 15).join('\n'));
  console.log();

  // 10. schema-validate a real note
  const sampleNote = join(VAULT_PATH, 'notes', 'Silver is the schema decoupling layer where Bronze chaos becomes stable typed contracts.md');
  console.log('10. schema-validate (real note):');
  const validate = getText(await callTool(serverProcess, 10, 'schema-validate', { filePath: sampleNote }));
  console.log(validate);
  console.log();

  console.log('=== Compatibility test complete ===');
}

const timer = setTimeout(() => { console.error('Timeout'); if (serverProcess) serverProcess.kill(); process.exit(1); }, TIMEOUT_MS);

run()
  .then(async () => {
    clearTimeout(timer);
    if (serverProcess) serverProcess.kill();
    await rm(VAULT_PATH, { recursive: true, force: true });
    process.exit(0);
  })
  .catch(async (err) => {
    clearTimeout(timer);
    console.error('\n✗ Failed:', err.message);
    if (serverProcess) serverProcess.kill();
    await rm(VAULT_PATH, { recursive: true, force: true });
    process.exit(1);
  });
