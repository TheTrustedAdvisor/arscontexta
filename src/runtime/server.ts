import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { vaultInit } from './tools/vault-init.js';
import { schemaValidate } from './tools/schema-validate.js';
import { graphQuery } from './tools/graph-query.js';
import { treeInject } from './tools/tree-inject.js';
import { healthCheck } from './tools/health-check.js';
import { noteSearch } from './tools/note-search.js';
import { safeVaultPath, assertContained } from './tools/path-guard.js';

const server = new McpServer({
  name: 'ars-contexta',
  version: '0.1.0',
});

server.tool(
  'vault-init',
  'Initialize a new Ars Contexta vault with three-space architecture',
  {
    preset: z.enum(['research', 'personal-assistant', 'experimental']).describe('Vault preset type'),
    notesDir: z.string().default('notes').describe('Name for the notes directory'),
    selfEnabled: z.boolean().default(false).describe('Enable self/ space for agent identity'),
    vaultPath: z.string().default('.').describe('Root path for the vault'),
  },
  async ({ preset, notesDir, selfEnabled, vaultPath }) => {
    const safePath = safeVaultPath(vaultPath);
    assertContained(safePath, notesDir);
    const result = await vaultInit({ preset, notesDir, selfEnabled, vaultPath: safePath });
    return { content: [{ type: 'text' as const, text: result }] };
  },
);

server.tool(
  'schema-validate',
  'Validate a note file against vault schema requirements',
  {
    filePath: z.string().describe('Path to the markdown file to validate'),
  },
  async ({ filePath }) => {
    const safePath = safeVaultPath('.');
    const resolvedFile = assertContained(safePath, filePath);
    const result = await schemaValidate({ filePath: resolvedFile });
    return { content: [{ type: 'text' as const, text: result }] };
  },
);

server.tool(
  'graph-query',
  'Query the vault wiki-link graph: orphans, backlinks, density, traversal',
  {
    query: z.enum(['orphans', 'backlinks', 'density', 'stats', 'traverse', 'clusters', 'suggestions']).describe('Type of graph query'),
    notePath: z.string().optional().describe('Note path for backlinks/traverse queries'),
    vaultPath: z.string().default('.').describe('Root path of the vault'),
  },
  async ({ query, notePath, vaultPath }) => {
    const safePath = safeVaultPath(vaultPath);
    if (notePath) assertContained(safePath, notePath);
    const result = await graphQuery({ query, notePath, vaultPath: safePath });
    return { content: [{ type: 'text' as const, text: result }] };
  },
);

server.tool(
  'tree-inject',
  'Get the vault directory tree for context injection',
  {
    vaultPath: z.string().default('.').describe('Root path of the vault'),
    depth: z.number().min(1).max(5).default(2).describe('Maximum directory depth (1-5)'),
  },
  async ({ vaultPath, depth }) => {
    const safePath = safeVaultPath(vaultPath);
    const result = await treeInject({ vaultPath: safePath, depth });
    return { content: [{ type: 'text' as const, text: result }] };
  },
);

server.tool(
  'health-check',
  'Run vault health diagnostics: schema, orphans, links, descriptions',
  {
    mode: z.enum(['quick', 'full', 'three-space']).default('quick').describe('Diagnostic mode'),
    vaultPath: z.string().default('.').describe('Root path of the vault'),
  },
  async ({ mode, vaultPath }) => {
    const safePath = safeVaultPath(vaultPath);
    const result = await healthCheck({ mode, vaultPath: safePath });
    return { content: [{ type: 'text' as const, text: result }] };
  },
);

server.tool(
  'note-search',
  'Search vault notes by title, content, or frontmatter fields',
  {
    query: z.string().describe('The search term'),
    vaultPath: z.string().default('.').describe('Root path of the vault'),
    scope: z
      .enum(['title', 'content', 'frontmatter', 'all'])
      .default('all')
      .describe('Search scope: title, content, frontmatter, or all'),
  },
  async ({ query, vaultPath, scope }) => {
    const safePath = safeVaultPath(vaultPath);
    const result = await noteSearch({ query, vaultPath: safePath, scope });
    return { content: [{ type: 'text' as const, text: result }] };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('MCP server failed to start:', err.message);
  process.exitCode = 1;
});
