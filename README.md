# Ars Contexta — Knowledge Management Plugin for GitHub Copilot

Research-backed knowledge management system that transforms raw material into connected, discoverable knowledge. Portable vaults work across GitHub Copilot, Claude Code, and Obsidian.

## Architecture

```mermaid
graph TB
    subgraph "Copilot CLI / VS Code"
        User([User])
        CLI[Copilot CLI]
        Chat[Copilot Chat]
    end

    subgraph "Ars Contexta Plugin"
        direction TB
        Instructions[".github/copilot-instructions.md"]
        
        subgraph Agents
            VA[vault-architect]
            PR[processor]
            KG[knowledge-guide]
            HC[health-checker]
            GA[graph-analyst]
        end

        subgraph "MCP Server (stdio)"
            VI[vault-init]
            SV[schema-validate]
            GQ[graph-query]
            TI[tree-inject]
            HCT[health-check]
            NS[note-search]
        end
    end

    subgraph "Vault (Markdown)"
        Notes["notes/"]
        Ops["ops/"]
        Inbox["inbox/"]
    end

    User --> CLI & Chat
    CLI & Chat --> Instructions
    Instructions --> Agents
    Agents --> |"MCP calls"| VI & SV & GQ & TI & HCT & NS
    VI & SV & GQ & TI & HCT & NS --> Notes & Ops & Inbox

    style Notes fill:#e8f5e9
    style Ops fill:#fff3e0
    style Inbox fill:#e3f2fd
```

## Install

One command:
```bash
copilot plugin install TheTrustedAdvisor/arscontexta
```

That's it. 5 agents + 17 skills + 6 MCP tools, ready to use.

<details>
<summary>Alternative: From source (contributors)</summary>

```bash
git clone https://github.com/TheTrustedAdvisor/arscontexta.git
cd arscontexta
npm install          # builds automatically via prepare script
```

Then point your MCP config at the local build:

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
</details>

## Usage

```
> /setup                    — Initialize a research vault
> /reduce docs/report.md    — Extract atomic claims from source material
> /reflect                  — Find connections, update MOCs
> /reweave                  — Update older notes with new context
> /pipeline docs/report.md  — End-to-end: reduce → reflect → reweave → verify
> /health full              — Run vault diagnostics
> /graph clusters           — Find topic clusters in the knowledge graph
```

## Processing Pipeline (6R)

```mermaid
flowchart LR
    R1[Record] --> R2[Reduce]
    R2 --> R3[Reflect]
    R3 --> R4[Reweave]
    R4 --> R5[Verify]
    R5 --> R6[Rethink]
    R6 -.->|"friction signals"| R1

    R1 -.- D1["Drop raw material\ninto inbox/"]
    R2 -.- D2["Extract atomic claims\ninto notes/"]
    R3 -.- D3["Find connections,\nupdate MOCs"]
    R4 -.- D4["Backward pass:\nupdate older notes"]
    R5 -.- D5["Schema + link\nquality checks"]
    R6 -.- D6["Challenge assumptions,\npropose changes"]

    style R1 fill:#e3f2fd
    style R2 fill:#e8f5e9
    style R3 fill:#fff3e0
    style R4 fill:#fce4ec
    style R5 fill:#f3e5f5
    style R6 fill:#e0f2f1
```

## Three-Space Architecture

```mermaid
graph TB
    subgraph Knowledge["Knowledge Space"]
        direction TB
        N1["Atomic claims"]
        N2["Patterns & principles"]
        MOC["Maps of Content"]
        N1 & N2 --> MOC
    end

    subgraph Operational["Operational Space"]
        direction TB
        Config["config.yaml"]
        Health["health reports"]
        Sessions["session logs"]
    end

    subgraph Interface["Interface Space"]
        direction TB
        Inbox2["inbox/"]
        Templates["templates/"]
    end

    Interface -->|"reduce"| Knowledge
    Knowledge -->|"health-check"| Operational
    Operational -->|"rethink"| Knowledge

    style Knowledge fill:#e8f5e9
    style Operational fill:#fff3e0
    style Interface fill:#e3f2fd
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `setup` | Initialize a new vault with three-space architecture |
| `validate` | Validate a note file against vault schema |
| `graph` | Query the wiki-link graph: orphans, backlinks, density, clusters, suggestions |
| `health` | Run vault diagnostics: schema, orphans, links, descriptions |
| `search` | Search notes by title, content, or frontmatter |
| `tree` | Get the vault directory tree for context injection |

## Agents

```mermaid
graph LR
    subgraph "Agent Delegation"
        VA[vault-architect] -->|"structural\nchanges"| PR[processor]
        PR -->|"methodology\nquestions"| KG[knowledge-guide]
        PR -->|"graph\nanalysis"| GA[graph-analyst]
        HC[health-checker] -->|"structural\nfixes"| VA
        GA -->|"health\ndiagnostics"| HC
    end

    style VA fill:#e3f2fd
    style PR fill:#e8f5e9
    style KG fill:#fff3e0
    style HC fill:#f3e5f5
    style GA fill:#fce4ec
```

| Agent | Purpose |
|-------|---------|
| `vault-architect` | Setup, derivation, structure changes |
| `processor` | Reduce, reflect, reweave pipeline |
| `knowledge-guide` | Methodology guidance, research answers |
| `health-checker` | Diagnostics, schema validation |
| `graph-analyst` | Graph analysis, orphans, connections |

## Skills (17)

| Category | Skills | Description |
|----------|--------|-------------|
| **Processing** | `/setup`, `/reduce`, `/reflect`, `/reweave`, `/verify`, `/pipeline`, `/rethink` | Full 6R pipeline: record → reduce → reflect → reweave → verify → rethink |
| **Analysis** | `/health`, `/graph` | Vault diagnostics and wiki-link graph analysis |
| **Architecture** | `/architect`, `/add-domain`, `/reseed`, `/upgrade`, `/recommend` | Vault evolution, domain expansion, research-backed configuration |
| **Learning** | `/help`, `/ask`, `/tutorial` | Methodology guidance, research Q&A, interactive walkthroughs |

## Vault Format

Vaults use Markdown + YAML frontmatter + wiki-links. See [docs/vault-format-spec.md](docs/vault-format-spec.md) for the full specification.

```
my-vault/
  notes/          # Atomic knowledge claims
  maps/           # Maps of Content (MOCs)
  ops/            # Operational state (config, health, sessions)
  inbox/          # Raw material to process
  templates/      # Note templates
```

Each note follows the **prose-as-title** convention — the filename IS the title:

```markdown
---
description: ~150 chars elaborating the claim
type: claim | pattern | preference | fact | decision | question
created: 2026-05-18
---

# The Two-Zone model enables datenschutzkonforme Cloud extension

Body with reasoning (150-400 words).

---

Source: executive-summary

Relevant Notes:
- [[Sensitivity Labels steuern die Zonenzuordnung automatisch]] -- extends

Topics:
- [[Architektur]]
```

## Wiki-Link Graph

```mermaid
graph LR
    A["Die Plattform nutzt\nZwei-Zonen-Modell"] --> B["Restricted Zone bietet\nDatensouveränität"]
    A --> C["Sensitivity Labels\nsteuern Zonenzuordnung"]
    B --> D["Pseudonymisierung\nin Restricted Zone"]
    C --> E["Purview DLP blockiert\nZonenverstösse"]
    C --> B
    
    MOC["[[Architektur]]"] --> A & B & C & D & E

    style MOC fill:#fff3e0,stroke:#ff9800
    style A fill:#e8f5e9
    style B fill:#e8f5e9
    style C fill:#e8f5e9
    style D fill:#e8f5e9
    style E fill:#e8f5e9
```

## Vault Portability

```mermaid
graph LR
    Vault["Vault\n(Markdown + YAML\n+ Wiki-Links)"]
    
    Vault --> Copilot[".github/\ncopilot-instructions.md\nagents/ + skills/"]
    Vault --> Claude[".claude/\nCLAUDE.md"]
    Vault --> Obsidian["Native\nObsidian support"]

    style Vault fill:#e8f5e9,stroke:#4caf50
    style Copilot fill:#e3f2fd
    style Claude fill:#fff3e0
    style Obsidian fill:#f3e5f5
```

The vault format is platform-independent. Platform-specific configuration:

- **Copilot:** `.github/copilot-instructions.md` + `.github/agents/` + `.copilot/mcp-config.json`
- **Claude Code:** `CLAUDE.md` + `.claude/`
- **Obsidian:** Native wiki-link and frontmatter support

## Quality Metrics (E2E Validated)

Tested with Copilot CLI against real enterprise documentation (KTZH Datenplattform v2):

| Metric | Result | Target |
|--------|--------|--------|
| Notes generated | 50 | ~50 |
| Orphan rate | 0.0% | < 5% |
| Schema compliance | 100% | 100% |
| Link health | 100% | > 90% |
| Description quality | PASS | PASS |
| Avg link degree | 4.9 | 2-4 |
| Health score | 5/5 PASS | 5/5 |

## Development

```bash
git clone https://github.com/TheTrustedAdvisor/arscontexta.git
cd arscontexta
npm install              # builds automatically
npm test                 # 91 unit tests
npm run typecheck        # TypeScript check
node test/e2e-smoke.mjs  # E2E integration test
```

## License

MIT
