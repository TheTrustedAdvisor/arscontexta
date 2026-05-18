/**
 * E2E smoke test for the Ars Contexta MCP server.
 * Spawns the server, sends JSON-RPC messages over stdio, and verifies responses.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TIMEOUT_MS = 15_000;
let serverProcess;
let tmpDir;

function sendMessage(proc, message) {
  proc.stdin.write(JSON.stringify(message) + '\n');
}

function waitForResponse(proc, id, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for response id=${id}`)), timeoutMs);

    function onData(chunk) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === id) {
            clearTimeout(timer);
            proc.stdout.off('data', onData);
            resolve(parsed);
            return;
          }
        } catch {
          // Not valid JSON, skip
        }
      }
    }

    proc.stdout.on('data', onData);
  });
}

async function run() {
  tmpDir = await mkdtemp(join(process.cwd(), '.e2e-tmp-'));

  console.log('Starting MCP server...');
  serverProcess = spawn('node', ['dist/server.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });

  serverProcess.stderr.on('data', (chunk) => {
    process.stderr.write('[server] ' + chunk.toString());
  });

  // Step 1: Initialize
  console.log('  → Sending initialize...');
  sendMessage(serverProcess, {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'e2e-test', version: '1.0.0' },
    },
  });

  const initResp = await waitForResponse(serverProcess, 1);
  assert(initResp.result, 'Initialize should return a result');
  assert(initResp.result.serverInfo.name === 'ars-contexta', `Server name should be ars-contexta, got: ${initResp.result.serverInfo.name}`);
  console.log('  ✓ Initialize OK — server: ' + initResp.result.serverInfo.name);

  // Send initialized notification
  sendMessage(serverProcess, {
    jsonrpc: '2.0',
    method: 'notifications/initialized',
  });

  // Step 2: List tools
  console.log('  → Listing tools...');
  sendMessage(serverProcess, {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  });

  const toolsResp = await waitForResponse(serverProcess, 2);
  const toolNames = toolsResp.result.tools.map(t => t.name).sort();
  const expected = ['graph-query', 'health-check', 'note-search', 'schema-validate', 'tree-inject', 'vault-init'];
  assert(JSON.stringify(toolNames) === JSON.stringify(expected), `Expected tools: ${expected.join(', ')}\nGot: ${toolNames.join(', ')}`);
  console.log(`  ✓ Tools listed: ${toolNames.join(', ')}`);

  // Step 3: vault-init
  console.log('  → Calling vault-init...');
  sendMessage(serverProcess, {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'vault-init',
      arguments: { preset: 'research', vaultPath: tmpDir },
    },
  });

  const initVaultResp = await waitForResponse(serverProcess, 3);
  const initText = initVaultResp.result.content[0].text;
  assert(initText.includes('Vault initialized successfully'), `vault-init should succeed, got: ${initText}`);
  console.log('  ✓ vault-init OK');

  // Step 4: vault-init again — overwrite protection
  console.log('  → Calling vault-init again (overwrite protection)...');
  sendMessage(serverProcess, {
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'vault-init',
      arguments: { preset: 'research', vaultPath: tmpDir },
    },
  });

  const overwriteResp = await waitForResponse(serverProcess, 4);
  const overwriteText = overwriteResp.result.content[0].text;
  assert(overwriteText.includes('already exists'), `Should block overwrite, got: ${overwriteText}`);
  console.log('  ✓ Overwrite protection OK');

  // Step 5: tree-inject
  console.log('  → Calling tree-inject...');
  sendMessage(serverProcess, {
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'tree-inject',
      arguments: { vaultPath: tmpDir, depth: 2 },
    },
  });

  const treeResp = await waitForResponse(serverProcess, 5);
  const treeText = treeResp.result.content[0].text;
  assert(treeText.includes('Vault Structure'), `tree-inject should return structure, got: ${treeText}`);
  assert(treeText.includes('notes/'), 'Should contain notes directory');
  console.log('  ✓ tree-inject OK');

  // Step 6: health-check
  console.log('  → Calling health-check (quick)...');
  sendMessage(serverProcess, {
    jsonrpc: '2.0',
    id: 6,
    method: 'tools/call',
    params: {
      name: 'health-check',
      arguments: { mode: 'quick', vaultPath: tmpDir },
    },
  });

  const healthResp = await waitForResponse(serverProcess, 6);
  const healthText = healthResp.result.content[0].text;
  assert(healthText.includes('Vault Health Report'), `health-check should return report, got: ${healthText}`);
  console.log('  ✓ health-check OK');

  // Step 7: schema-validate
  console.log('  → Calling schema-validate...');
  sendMessage(serverProcess, {
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: {
      name: 'schema-validate',
      arguments: { filePath: join(tmpDir, 'notes', 'index.md') },
    },
  });

  const schemaResp = await waitForResponse(serverProcess, 7);
  const schemaText = schemaResp.result.content[0].text;
  assert(schemaText.includes('index.md'), `schema-validate should reference index.md, got: ${schemaText}`);
  console.log('  ✓ schema-validate OK');

  // Step 8: graph-query stats
  console.log('  → Calling graph-query (stats)...');
  sendMessage(serverProcess, {
    jsonrpc: '2.0',
    id: 8,
    method: 'tools/call',
    params: {
      name: 'graph-query',
      arguments: { query: 'stats', vaultPath: tmpDir },
    },
  });

  const graphResp = await waitForResponse(serverProcess, 8);
  const graphText = graphResp.result.content[0].text;
  assert(graphText.includes('Vault Statistics'), `graph-query should return stats, got: ${graphText}`);
  console.log('  ✓ graph-query OK');

  // Step 9: note-search
  console.log('  → Calling note-search...');
  sendMessage(serverProcess, {
    jsonrpc: '2.0',
    id: 9,
    method: 'tools/call',
    params: {
      name: 'note-search',
      arguments: { query: 'Index', vaultPath: tmpDir, scope: 'all' },
    },
  });

  const searchResp = await waitForResponse(serverProcess, 9);
  const searchText = searchResp.result.content[0].text;
  assert(searchText.includes('Index') || searchText.includes('index'), `note-search should find Index, got: ${searchText}`);
  console.log('  ✓ note-search OK');

  console.log('\n✓ All E2E smoke tests passed!');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

const timer = setTimeout(() => {
  console.error('E2E test timed out');
  if (serverProcess) serverProcess.kill();
  process.exit(1);
}, TIMEOUT_MS);

run()
  .then(async () => {
    clearTimeout(timer);
    if (serverProcess) serverProcess.kill();
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
    process.exit(0);
  })
  .catch(async (err) => {
    clearTimeout(timer);
    console.error('\n✗ E2E test failed:', err.message);
    if (serverProcess) serverProcess.kill();
    if (tmpDir) await rm(tmpDir, { recursive: true, force: true });
    process.exit(1);
  });
