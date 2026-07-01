# Arquitetura

> **Leia antes:** [00 — Visão Geral](00-visao-geral.md) | **Próximo:** [01 — Instalação](01-instalacao.md)

---

## Duas Metades

Mercury é dividido em duas metades que funcionam juntas, mas vivem em mundos diferentes:

### 1. Skills (markdown puro)

Arquivos `skills/*/SKILL.md` que agentes de IA carregam como instrução. Cada skill ensina o agente a executar comandos `mercury <subcomando>` no terminal para registrar dados.

```markdown
# skills/recruiter-outreach/SKILL.md (exemplo simplificado)

Peça permissão ao usuário e execute:

mercury recruiter add "Recruiter Name" "Company" \
  --linkedin "https://linkedin.com/in/..." \
  --status "approached"
```

**Características:**

- **Portáteis** — funcionam em qualquer agente que suporte SKILL.md (opencode, Claude Code, Cursor, Cline)
- **Sem dependências** — markdown puro, zero lógica, zero binário
- **Copiáveis** — `mercury setup --all` distribui as skills para os diretórios de cada agente
- **Fáceis de auditar** — o usuário lê o que o agente vai fazer antes de executar

### 2. App (CLI + Servidor + Dashboard)

Binário único compilado em Bun que faz três papéis ao mesmo tempo:

| Papel | Tecnologia | Função |
|-------|-----------|--------|
| **CLI** | Bun + TypeScript | 14+ subcomandos que escrevem no SQLite |
| **Servidor HTTP** | `Bun.serve` | REST + WebSocket para o frontend |
| **Dashboard** | Svelte 5 embutido | Interface visual no navegador |

O binário é **autossuficiente**: não precisa de Node, npm, ou qualquer runtime além do próprio sistema operacional.

---

## Diagrama de Fluxo

```
                         ┌──────────────────────────────────────┐
                         │          SKILLS (SKILL.md)           │
                         │  profile-optimizer   job-scout       │
                         │  experience-bank     resume-tailor   │
                         │  recruiter-outreach  portal-filler   │
                         │  outreach-tracker                     │
                         └──────────┬───────────────────────────┘
                                    │ agente executa:
                                    │ mercury recruiter add ...
                                    │ mercury job add ...
                                    │ mercury metric record ...
                                    ▼
                ┌────────────────────────────────────────────────┐
                │              mercury CLI (binário)             │
                │                                                │
                │  ┌──────────┐  ┌─────────────────────────────┐ │
                │  │validar   │  │  escrever no SQLite          │ │
                │  │processar │──▶  notificar dashboard         │ │
                │  │escrever  │  │  (via lockfile se ativo)     │ │
                │  └──────────┘  └─────────────────────────────┘ │
                └──────────────────────┬─────────────────────────┘
                                       │
                                       ▼
                         ┌────────────────────────┐
                         │  ~/.mercury/mercury.db  │
                         │   SQLite WAL mode       │
                         └────────┬───────────────┘
                                  │ REST + WebSocket
                                  ▼
                ┌────────────────────────────────────────────────┐
                │         Dashboard Svelte 5 (127.0.0.1)        │
                │                                                │
                │  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
                │  │ Métricas │  │ Vagas    │  │ Recrutadores │  │
                │  │ Gaps     │  │ Match    │  │ Outreach    │  │
                │  └──────────┘  └──────────┘  └─────────────┘  │
                │                                                │
                │  ┌──────────────────────────────────────────┐  │
                │  │ Launch — executa skills via ACP          │  │
                │  │ (abre agente + carrega SKILL.md)         │  │
                │  └──────────────────────────────────────────┘  │
                └────────────────────────────────────────────────┘
```

---

## Decisões Arquiteturais

### 1. Separação Skills vs App

As skills são markdown puro — **zero lógica executável**. Elas só instruem o agente a chamar a CLI. O app é um binário standalone que não depende de agente nenhum.

**Por quê:** Portabilidade entre agentes. Se as skills fossem código (scripts, plugins), só funcionariam no ecossistema de um agente específico. Markdown é universal.

### 2. Single Source of Truth (SQLite via CLI)

Toda escrita passa pelos subcomandos da CLI. Skills nunca tocam SQL direto, nunca escrevem arquivos SQL, nunca manipulam o banco.

```
SKILL.md ──instrui──▶ agente ──executa──▶ mercury CLI ──escreve──▶ SQLite
```

**Regra de ouro:** Se uma skill precisa persistir um dado novo, primeiro crie um subcomando `mercury` para isso. Depois adicione a chamada ao SKILL.md.

**Exceção:** O dashboard também pode escrever via `POST /api/*` (mesma lógica de upsert dos subcomandos), e notifica via WebSocket com evento `changed`.

### 3. ACP (Agent Client Protocol)

O dashboard pode **lançar skills** — ou seja, abrir o agente já com a skill carregada. Isso usa o ACP: JSON-RPC 2.0 sobre stdio.

```
Dashboard (Launch) ──ACP──▶ opencode/Claude Code ──carrega SKILL.md──▶ execução
```

Cada provedor ACP (opencode, Claude Code) tem configuração própria em `config.json`:

```json
{
  "providers": {
    "opencode": { "cmd": "opencode" },
    "claude": { "cmd": "claude", "model": "claude-sonnet-4-20250514" }
  }
}
```

### 4. Single Binary com Assets Embutidos

O frontend Svelte 5 é compilado pelo Vite e os assets resultantes são convertidos para base64 e embutidos no binário do Bun. O resultado: **um arquivo só**, sem dependências externas.

Pipeline de build:

```
Svelte 5 ──Vite──▶ dist/ (HTML+CSS+JS) ──scripts/embed-assets.ts──▶ assets.gen.ts (base64) ──bun build --compile──▶ mercury (binário único)
```

---

## Estrutura de Diretórios

```
mercury/
│
├── app/                          # ⚙️ O app (código fonte)
│   ├── src/
│   │   ├── cli/                  # Subcomandos da CLI
│   │   │   ├── index.ts          # Entry point: parse de args + dispatch
│   │   │   ├── recruiter.ts      # mercury recruiter (add, list, update)
│   │   │   ├── records.ts        # mercury record (add, list, delete)
│   │   │   ├── match.ts          # mercury match (comparar labels ATS)
│   │   │   ├── outreach.ts       # mercury outreach (rastreio)
│   │   │   ├── detect-portal.ts  # mercury detect-portal
│   │   │   ├── export.ts         # mercury export
│   │   │   ├── init.ts           # mercury init
│   │   │   ├── setup.ts          # mercury setup (copiar skills)
│   │   │   ├── skills.ts         # mercury skills
│   │   │   ├── linkedin.ts       # mercury linkedin
│   │   │   ├── import-journey.ts # mercury import-journey
│   │   │   ├── update.ts         # mercury update
│   │   │   └── flags.ts          # Opções compartilhadas
│   │   │
│   │   ├── db/                   # Banco de dados
│   │   │   ├── schema.ts         # Schema SQLite (DDL + migrações)
│   │   │   ├── index.ts          # Conexão (bun:sqlite, WAL mode)
│   │   │   └── notify.ts         # Notificação ao dashboard via lockfile
│   │   │
│   │   ├── server/               # Servidor HTTP + WebSocket
│   │   │   ├── index.ts          # Bun.serve: REST + WS + assets embutidos
│   │   │   └── queries.ts        # Consultas SQL que o dashboard usa
│   │   │
│   │   ├── mcp/                  # Cliente LinkedIn MCP
│   │   │                        # Busca híbrida (instant search)
│   │   │
│   │   ├── acp/                  # Agent Client Protocol
│   │   │   ├── client.ts         # Cliente JSON-RPC 2.0 sobre stdio
│   │   │   ├── providers.ts      # Provedores (opencode, Claude Code)
│   │   │   ├── session.ts        # Gerenciamento de sessão
│   │   │   └── session.test.ts   # Testes
│   │   │
│   │   ├── outreach/             # Core de relacionamento com recrutadores
│   │   │                        # Lógica de scoring e rastreio
│   │   │
│   │   ├── match/                # Matcher de labels ATS
│   │   │                        # Compara skills do perfil com reqs da vaga
│   │   │
│   │   ├── adapters/             # Adaptadores por portal de vagas
│   │   │                        # Greenhouse, Lever, etc.
│   │   │
│   │   ├── recruiter/            # Sincronização com LinkedIn
│   │   │
│   │   ├── paths.ts              # Resolução de ~/.mercury/ + MERCURY_HOME
│   │   ├── version.gen.ts        # Versão gerada no build
│   │   └── update-check.ts       # Verificador de atualizações
│   │
│   ├── web/                      # 🎨 Frontend Svelte 5
│   │   ├── src/                  # Componentes Svelte
│   │   ├── index.html            # Entry point HTML
│   │   ├── vite.config.js        # Configuração Vite
│   │   └── svelte.config.js      # Configuração Svelte
│   │
│   ├── scripts/
│   │   ├── bootstrap.ts          # Instalador (curl|bun run -)
│   │   ├── install.ts            # Instalação local dev
│   │   └── embed-assets.ts       # Embutir assets no binário
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── bun.lock
│
├── skills/                       # 📋 Skills para agentes (markdown)
│   ├── profile-optimizer/        # Otimizar perfil LinkedIn
│   ├── job-scout/                # Encontrar vagas no LinkedIn
│   ├── experience-bank/          # Banco de experiências profissionais
│   ├── resume-tailor/            # Personalizar currículo Typst
│   ├── recruiter-outreach/       # Abordagem a recrutadores
│   ├── portal-filler/            # Preenchimento de portais (Greenhouse, etc.)
│   └── outreach-tracker/         # Rastreio de conversas
│
├── docs/
│   └── pt/                       # Documentação em português
│       ├── 00-visao-geral.md
│       ├── 01-instalacao.md
│       └── 02-arquitetura.md     # ← você está aqui
│
├── AGENTS.md                     # Notas para agentes de IA
├── CHANGELOG.md
└── README.md
```

---

## Dados do Usuário (`~/.mercury/`)

Todo o estado do usuário vive em `~/.mercury/` (sobrescrito por `$MERCURY_HOME`).

```
~/.mercury/
│
├── mercury.db               # SQLite WAL: a fonte da verdade
│                            # Tabelas: recruiters, jobs, metrics,
│                            # scores, interviews, applications,
│                            # answers, activities
│
├── config.json              # Provedores ACP + preferências do usuário
│
├── dashboard.lock            # {port, token, pid} do dashboard ativo
│                            # Usado pela CLI para notificar live-refresh
│
├── update-check.json        # Cache da última verificação de versão
│
├── src/                     # Clone do repositório (fallback build)
│
├── base/                    # Currículo base em Typst (.typ)
│
├── experience/              # Banco de experiências (arquivos .md com tags)
│
├── tailored/                # Currículos personalizados por vaga
│
├── cover-letters/           # Cartas de apresentação
│
├── reports/                 # Relatórios de gap/match
│
└── logs/                    # Logs de execução
```

### Por que SQLite?

- **Zero setup** — não precisa de servidor de banco, Docker, nem configuração
- **WAL mode** — leitura e escrita simultâneas sem lock
- **Portátil** — o arquivo `mercury.db` pode ser copiado para outro computador
- **Embarcado** — `bun:sqlite` é nativo no runtime Bun, sem dependências

---

## Skills: O Ecossistema

Cada skill é uma etapa da pipeline de busca de emprego:

```
experience-bank → profile-optimizer → job-scout → resume-tailor → recruiter-outreach → portal-filler
                                                                      └── outreach-tracker
```

| Skill | O que faz | Comandos que executa |
|-------|-----------|---------------------|
| **experience-bank** | Extrair experiências do LinkedIn para o banco local | `mercury record add` |
| **profile-optimizer** | Analisar perfil, recomendar melhorias, registrar métricas | `mercury metric record` |
| **job-scout** | Buscar vagas no LinkedIn via MCP | `mercury job add` |
| **resume-tailor** | Personalizar currículo Typst para uma vaga | `mercury match` |
| **recruiter-outreach** | Abordar recrutadores e rastrear conversas | `mercury recruiter add` |
| **portal-filler** | Preencher portais (Greenhouse, Lever) via navegador | `mercury application add` |
| **outreach-tracker** | Rastrear follow-ups e atualizar status | `mercury outreach` |

---

## Protocolos de Comunicação

### MCP (Model Context Protocol)

Usado para comunicação direta com serviços externos — principalmente o **LinkedIn MCP Server** para busca de perfis, vagas e mensagens. O agente usa o cliente MCP para consultar o LinkedIn; os resultados são persistidos via CLI.

```
Agente ──MCP──▶ LinkedIn MCP ──▶ API do LinkedIn
```

### ACP (Agent Client Protocol)

Protocolo próprio para o dashboard se comunicar com agentes de IA. Usa **JSON-RPC 2.0 sobre stdio** para:

1. Listar skills disponíveis
2. Carregar uma skill no agente
3. Acompanhar execução

```
Dashboard ──stdin──▶ opencode -- skill profile-optimizer ──stdout──▶ resposta JSON-RPC
```

O ACP é o que permite o botão **Launch** no dashboard: em vez de você abrir o terminal e digitar `mercury`, o dashboard abre o agente para você.

### Notificação via Lockfile

Quando a CLI escreve no banco, ela verifica se `~/.mercury/dashboard.lock` existe. Se sim, faz uma requisição HTTP para `http://127.0.0.1:{port}/api/notify?token={token}`, e o dashboard faz live-refresh dos dados via WebSocket.

```
mercury CLI ──HTTP GET──▶ dashboard.localhost/api/notify?token=... ──WebSocket──▶ interface atualiza
```

---

## Pipeline de Build

```
bun run build
├── build:web      Vite compila Svelte 5 → app/web/dist/ (HTML+CSS+JS)
├── embed          scripts/embed-assets.ts → inline base64 em src/server/assets.gen.ts
└── build:bin      bun build --compile → app/dist/mercury

bun run dev        Executa direto da fonte (sem compilar): bun run src/cli/index.ts
bun run typecheck  tsc --noEmit (deve passar antes de commit)
bun run test       Bun test (executa todos os *.test.ts)
```

### Assets stub

`assets.gen.ts` é um artefato **gerado** e **gitignorado**. Em ambiente dev (quando não existe ou está vazio), um script `ensure-assets.ts` cria um stub vazio para que typecheck e testes funcionem sem precisar buildar o frontend.

---

## CLI: Subcomandos e Responsabilidades

| Subcomando | Descrição | Categoria |
|-----------|-----------|-----------|
| `init` | Cria `~/.mercury/` com config padrão | Setup |
| `setup` | Copia skills para agentes detectados | Setup |
| `update` | Atualiza o binário do Mercury | Setup |
| `recruiter` | Gerenciar recrutadores (add, list, update) | Outreach |
| `job` | Gerenciar vagas (add, list) | Vagas |
| `record` | Registrar experiências no banco | Experiência |
| `match` | Comparar perfil com requisitos da vaga | Match |
| `metric` | Registrar métricas do perfil LinkedIn | Métricas |
| `score` | Calcular score de compatibilidade | Match |
| `interview` | Gerenciar entrevistas | Pipeline |
| `application` | Gerenciar candidaturas | Pipeline |
| `answer` | Gerenciar respostas salvas | Outreach |
| `activity` | Registrar atividades | Geral |
| `outreach` | Rastrear follow-ups | Outreach |
| `export` | Exportar dados do banco | Utilitário |
| `detect-portal` | Detectar portal de vagas (Greenhouse, Lever) | Utilitário |
| `linkedin` | Operações LinkedIn via CLI | LinkedIn |

---

## Segurança e Privacidade

- **Tudo local** — o banco SQLite, as skills, os currículos. Nenhum dado sai da sua máquina.
- **Dashboard local** — o servidor HTTP bind em `127.0.0.1` com porta aleatória e token de URL. Nunca exposto à rede.
- **Nada é automático** — skills pedem permissão do usuário antes de cada ação no LinkedIn.
- **Sem dados reais no repositório** — testes e exemplos usam dados sintéticos (`Recruiter One`, `Acme Corp`). Dados reais vivem apenas em `~/.mercury/mercury.db` (gitignorado).

---

## Leitura Recomendada

- [00 — Visão Geral](00-visao-geral.md) — conceitos e pipeline completa
- [01 — Instalação](01-instalacao.md) — como instalar e configurar
- `AGENTS.md` — notas detalhadas de arquitetura para contribuidores
- `CHANGELOG.md` — histórico de versões
