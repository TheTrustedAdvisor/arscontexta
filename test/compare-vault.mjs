import { spawn } from 'node:child_process';
import { join } from 'node:path';

const VAULT = join(process.cwd(), '.e2e-tmp-ktzh-vault');
const proc = spawn('node', ['dist/server.js'], { stdio: ['pipe', 'pipe', 'pipe'] });

function send(msg) { proc.stdin.write(JSON.stringify(msg) + '\n'); }
function waitFor(id, ms = 10000) {
  return new Promise((resolve, reject) => {
    let buf = '';
    const t = setTimeout(() => reject(new Error(`Timeout id=${id}`)), ms);
    function onData(chunk) {
      buf += chunk.toString();
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try { const p = JSON.parse(line); if (p.id === id) { clearTimeout(t); proc.stdout.off('data', onData); resolve(p); return; } } catch {}
      }
    }
    proc.stdout.on('data', onData);
  });
}

send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'compare', version: '1.0.0' } } });
await waitFor(0);
send({ jsonrpc: '2.0', method: 'notifications/initialized' });

const tools = [
  [1, 'graph-query', { query: 'stats', vaultPath: VAULT }],
  [2, 'graph-query', { query: 'orphans', vaultPath: VAULT }],
  [3, 'graph-query', { query: 'density', vaultPath: VAULT }],
  [4, 'health-check', { mode: 'full', vaultPath: VAULT }],
  [5, 'graph-query', { query: 'clusters', vaultPath: VAULT }],
  [6, 'graph-query', { query: 'suggestions', vaultPath: VAULT }],
];

for (const [id, name, args] of tools) {
  send({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });
  const resp = await waitFor(id);
  const text = resp.result?.content?.[0]?.text || JSON.stringify(resp.error);
  const label = `${name} (${args.query || args.mode})`;
  console.log(`\n${'='.repeat(60)}`);
  console.log(label.toUpperCase());
  console.log('='.repeat(60));
  console.log(text.split('\n').slice(0, 25).join('\n'));
  if (text.split('\n').length > 25) console.log(`  ... (${text.split('\n').length - 25} more lines)`);
}

proc.kill();
process.exit(0);
