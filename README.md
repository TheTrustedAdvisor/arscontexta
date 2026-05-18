# Ars Contexta — Knowledge Management Plugin for GitHub Copilot

Research-backed knowledge management system that transforms raw material into connected, discoverable knowledge. Portable vaults work across GitHub Copilot and Claude Code.

## Prerequisites

- Node.js >= 20
- GitHub Copilot CLI >= 1.0.48

## Installation

```bash
git clone https://github.com/TheTrustedAdvisor/arscontexta.git
cd arscontexta
npm install
npm run build
```

## Connect to Copilot CLI

The plugin provides an MCP server. Configure it in your Copilot session:

```bash
copilot --additional-mcp-config @.copilot/mcp-config.json
```

Or reference the MCP config directly in `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "ars-contexta": {
      "command": "node",
      "args": ["/path/to/arscontexta/dist/server.js"]
    }
  }
}
```

## Copilot Chat (VS Code)

Install the plugin directory and invoke `@ars-contexta` in Copilot Chat for interactive vault management.

## MCP Tools

| Tool | Description |
|------|-------------|
| `vault-init` | Initialize a new vault with three-space architecture |
| `schema-validate` | Validate a note file against vault schema |
| `graph-query` | Query the wiki-link graph: orphans, backlinks, density, clusters, suggestions |
| `health-check` | Run vault diagnostics: schema, orphans, links, descriptions |
| `note-search` | Search notes by title, content, or frontmatter |
| `tree-inject` | Get the vault directory tree for context injection |

## Agents

| Agent | Purpose |
|-------|---------|
| `vault-architect` | Setup, derivation, structure changes |
| `processor` | Reduce, reflect, reweave pipeline |
| `knowledge-guide` | Methodology guidance, research answers |
| `health-checker` | Diagnostics, schema validation |
| `graph-analyst` | Graph analysis, orphans, connections |

## Skills

**Processing:** `/setup`, `/reduce`, `/reflect`, `/reweave`, `/verify`, `/pipeline`, `/rethink`
**Analysis:** `/health`, `/graph`
**Architecture:** `/architect`, `/add-domain`, `/reseed`, `/upgrade`, `/recommend`
**Learning:** `/help`, `/ask`, `/tutorial`

## Vault Format

Vaults use Markdown + YAML frontmatter + wiki-links. See [docs/vault-format-spec.md](docs/vault-format-spec.md) for the full specification.

```
my-vault/
  notes/          # Atomic knowledge claims
  ops/            # Operational state (config, health, sessions)
  inbox/          # Raw material to process
  templates/      # Note templates
```

Each note follows the prose-as-title convention:

```markdown
---
description: ~150 chars elaborating the claim
type: claim | pattern | preference | fact | decision | question
created: 2026-05-18
---

# Prose-as-title proposition

Body with reasoning (150-400 words).

---

Source: original-source

Relevant Notes:
- [[Related note]] -- relationship type

Topics:
- [[Relevant MOC]]
```

## Development

```bash
npm run typecheck    # Type-check without emitting
npm run build        # Bundle with tsup
npm test             # Run 91 unit tests
npm run lint         # ESLint
node test/e2e-smoke.mjs  # E2E integration test
```

## Vault Portability

The vault format (Markdown + YAML + wiki-links) is platform-independent. Platform-specific configuration:

- **Copilot:** `.github/copilot-instructions.md` + `.github/agents/` + `.copilot/mcp-config.json`
- **Claude Code:** `CLAUDE.md` + `.claude/`

## License

MIT
