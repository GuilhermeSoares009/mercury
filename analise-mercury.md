# Análise Técnica Completa — Mercury

> **Repositório:** joaovjo/mercury (v0.9.1)
> **Propósito:** Plataforma de busca de emprego assistida por IA — CLI + Dashboard Local + Skills para Agentes
> **Stack:** Bun + TypeScript + SQLite (WAL) + Svelte 5 + Tailwind v4 + ACP (Agent Client Protocol)
> **Licença:** The Unlicense (Domínio Público)
> **Data da análise:** Julho 2026

---

## 1. Identificação do Projeto

**Mercury** é um "companheiro de busca de emprego com IA" — uma coleção de *skills* para agentes de IA (opencode, Claude Code, Cursor etc.) que automatiza o processo de busca de trabalho no LinkedIn, combinado com um dashboard web local e uma CLI em TypeScript/Bun.

**Dividido em duas metades:**

1. **Skills** (`skills/*/SKILL.md`) — arquivos markdown que agentes carregam para orquestrar o LinkedIn MCP e Chrome MCP
2. **App** (`app/`) — CLI + dashboard web escrito em Bun + TypeScript + Svelte, compilado em binário único

**Ecosystema:**

| Camada | Tecnologia | Função |
|---|---|---|
| Runtime | Bun | Execução TypeScript, servidor HTTP, SQLite nativo |
| Database | SQLite (WAL) | Armazenamento local de recrutadores, vagas, métricas |
| Frontend | Svelte 5 + Tailwind v4 + Bits UI + Lucide | Dashboard web |
| Build | Vite + Bun compile | Binário autossuficiente |
| Protocolos | ACP + JSON-RPC 2.0 | Comunicação agente-dashboard |
| MCP | LinkedIn MCP + Chrome MCP | Integração com LinkedIn |
| Testes | Bun Test | Testes unitários |

---

## 2. Mapa Mental da Arquitetura

```
                    ┌──────────────────────────────────────┐
                    │           SKILLS (SKILL.md)          │
                    │  profile-optimizer  job-scout        │
                    │  experience-bank    resume-tailor    │
                    │  recruiter-outreach portal-filler   │
                    │  outreach-tracker                     │
                    └──────────┬───────────────────────────┘
                               │ agente executa comandos
                               │ `mercury job save ...`
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    mercury CLI (Bun binary)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   CLI    │  │    DB    │  │  Server  │  │  ACP Client      │  │
│  │ index.ts │  │ schema   │  │ Bun.serve│  │  session.ts      │  │
│  │ recruiter│  │ sqlite   │  │ REST/WS  │  │  providers.ts    │  │
│  │ records  │  │ WAL mode │  │ queries  │  │  client.ts       │  │
│  │ outreach │  │ notify   │  │ assets   │  │                  │  │
│  │ match    │  │          │  │          │  │                  │  │
│  └──────────┘  └────┬─────┘  └────┬─────┘  └──────────────────┘  │
│                     │             │                              │
└─────────────────────┼─────────────┼──────────────────────────────┘
                      │             │
                      ▼             ▼
              ┌────────────┐  ┌──────────┐
              │ SQLite DB  │  │ Browser  │
              │ ~/.mercury │  │ Svelte 5 │
              │ mercury.db │  │ Dashboard│
              └────────────┘  └──────────┘
                      │
                      ▼
              ┌──────────────────┐
              │  LinkedIn MCP    │
              │  Chrome MCP      │
              └──────────────────┘
```

**Fluxo de dados:**
1. Agente carrega skill → executa comandos `mercury ...` via bash
2. CLI escreve no SQLite e notifica dashboard via lockfile
3. Dashboard lê do SQLite e entrega via REST/WebSocket para UI
4. Dashboard também pode lançar skills via ACP (cliente do protocolo agente)

---

## 3. Estrutura de Pastas

```
mercury/
├── .github/                    # (esperado: CI/CD — não encontrado localmente)
├── app/                        # Aplicação principal (Bun + TypeScript)
│   ├── package.json            # v0.9.1, dependências mínimas
│   ├── tsconfig.json           # Strict mode, ESNext, bundler resolution
│   ├── .gitignore              # assets.gen.ts não versionado
│   ├── scripts/                # Build, bootstrap, instalação
│   │   ├── bootstrap.ts        # Instalador remoto (curl|bun)
│   │   ├── build-targets.ts    # Cross-compilação multi-plataforma
│   │   ├── embed-assets.ts     # Embutir assets web no binário
│   │   ├── ensure-assets.ts    # Stub de assets para dev
│   │   └── gen-version.ts      # Geração de versão
│   ├── src/
│   │   ├── cli/                # Entry point + subcomandos
│   │   │   ├── index.ts        # CLI principal (roteamento de comandos)
│   │   │   ├── flags.ts        # Parser de flags minimalista
│   │   │   ├── recruiter.ts    # mercury recruiter add|update|sync
│   │   │   ├── records.ts      # job|metric|score|interview|application|answer|activity
│   │   │   ├── outreach.ts     # mercury outreach log|update|check|due|list|blocked|budget|withdraw
│   │   │   ├── match.ts        # mercury match (matcher de labels ATS)
│   │   │   ├── detect-portal.ts# mercury detect-portal
│   │   │   ├── export.ts       # mercury export (Typst → PDF)
│   │   │   ├── linkedin.ts     # mercury linkedin reset
│   │   │   ├── setup.ts        # mercury setup (instalar skills)
│   │   │   ├── init.ts         # mercury init
│   │   │   ├── update.ts       # mercury update
│   │   │   ├── import-journey.ts
│   │   │   └── skills.ts
│   │   ├── db/                 # Camada de dados
│   │   │   ├── index.ts        # Conexão + schema + migrations + backfill
│   │   │   ├── schema.ts       # Schema SQLite completo (v3)
│   │   │   └── notify.ts       # Notificação de mudanças via HTTP
│   │   ├── server/             # Dashboard web
│   │   │   ├── index.ts        # Bun.serve, REST, WebSocket, ACP
│   │   │   └── queries.ts      # Queries de leitura para API
│   │   ├── outreach/           # Core de outreach (memória de relacionamento)
│   │   │   ├── core.ts         # Pure functions: state machine, canais, deadlines
│   │   │   ├── core.test.ts    # Testes unitários do core (527 linhas)
│   │   │   ├── store.ts        # SQLite operations do outreach
│   │   │   └── store.test.ts   # Testes do store
│   │   ├── acp/                # Agent Client Protocol
│   │   │   ├── client.ts       # Cliente ACP (JSON-RPC sobre stdio)
│   │   │   ├── providers.ts    # Registry: opencode, claude-code
│   │   │   ├── session.ts      # SessionManager + skill prompts
│   │   │   └── session.test.ts # Testes de buildSkillPrompt
│   │   ├── mcp/                # LinkedIn MCP client
│   │   │   ├── linkedin.ts     # Conexão MCP + callTool
│   │   │   ├── search.ts       # searchJobs, searchPeople, jobDetails
│   │   │   └── withdraw.ts     # Withdraw (degraded, sem browser)
│   │   ├── match/              # Matcher ATS
│   │   │   ├── matcher.ts      # Algoritmo de matching (exact→synonym→fuzzy)
│   │   │   ├── matcher.test.ts # Testes unitários (126 linhas)
│   │   │   └── synonyms.ts     # Dicionário de sinônimos para campos ATS
│   │   ├── adapters/           # Adaptadores por ATS
│   │   │   ├── registry.ts     # Greenhouse, Lever, Ashby, Generic
│   │   │   ├── registry.test.ts
│   │   │   └── types.ts        # Types PortalId, Widget, FieldSpec, Adapter
│   │   ├── recruiter/          # Recruiter sync
│   │   │   ├── sync.ts         # Lógica de sincronização com LinkedIn
│   │   │   └── sync.test.ts    # Testes (262 linhas)
│   │   ├── paths.ts            # Path resolution (~/.mercury/)
│   │   ├── update-check.ts     # Verificação de atualização
│   │   ├── update-check.test.ts
│   │   └── version.gen.ts      # Versão auto-gerada
│   └── web/                    # Frontend Svelte 5
│       ├── package.json        # Svelte 5, Tailwind v4, Bits UI, Lucide
│       ├── vite.config.js      # Vite + Svelte + Tailwind
│       ├── svelte.config.js
│       └── src/
│           ├── main.js         # Entry point
│           ├── App.svelte      # Layout principal + navegação
│           ├── app.css         # Design tokens (tema dark Linear-ish)
│           ├── api.js          # Cliente HTTP + WebSocket
│           └── sections/       # Overview, Recruiters, Outreach, Jobs, etc.
├── skills/                     # Skills para agentes (copia para ~/.config/opencode/skills/)
│   ├── profile-optimizer/
│   ├── job-scout/
│   ├── experience-bank/
│   ├── resume-tailor/
│   ├── recruiter-outreach/
│   ├── portal-filler/
│   └── outreach-tracker/
├── README.md
├── AGENTS.md                   # Documentação para agentes de IA
├── CHANGELOG.md                # Keep a Changelog + Semantic Versioning
└── LICENSE                     # Unlicense
```

---

## 4. Fluxos Principais

### 4.1 Pipeline de busca de emprego

```
experience-bank (periódico/ocasional)
       │ banco de achievements read-only
       ▼
profile-optimizer → job-scout → resume-tailor → recruiter-outreach
     audita perfil    busca vagas    personaliza    contata recrutadores
       currículo
       │
       └──→ portal-filler (autofill ATS, pausa para revisão)
```

### 4.2 Ciclo de vida de dados

1. **profile-optimizer** navega pelo LinkedIn via Chrome MCP, audita perfil, chama `mercury metric record` para persistir
2. **job-scout** busca vagas via LinkedIn MCP, chama `mercury job save` para persistir
3. **resume-tailor** lê base resume + banco de experiência, gera versões customizadas, chama `mercury application add`
4. **recruiter-outreach** busca recrutadores, chama `mercury recruiter add`, depois `mercury outreach log`
5. **portal-filler** detecta ATS, faz `mercury answer list` + `mercury match`, preenche formulário, pausa

### 4.3 Escrita e notificação

```
CLI → SQLite (WAL) → notifyChange() → POST /_internal/changed → Dashboard → WebSocket broadcast → UI
```

Toda escrita na CLI:
1. Insere/atualiza no SQLite
2. Lê lockfile do dashboard (`~/.mercury/dashboard.lock`)
3. Faz POST para `/_internal/changed` com nome da tabela
4. Dashboard recebe, identifica qual seção da UI recarregar (table-scoped refresh)

---

## 5. Arquitetura — Análise Crítica

### Decisões Arquiteturais Fundamentais

**5.1 Separação Skills vs App**

O projeto separa claramente a camada de *orquestração* (skills markdown que agentes carregam) da camada de *persistência + dashboard* (CLI compilada). Isso é uma decisão inteligente porque:

- **Skills são portáteis**: qualquer agente que suporte SKILL.md (opencode, Claude Code, Cursor, Cline) pode usá-las
- **CLI é standalone**: não precisa do ecossistema Node.js instalado — é um binário único
- **Mudanças na UI não afetam skills**: a UI web é embutida no binário, mas as skills são markdown puro

**Trade-off:** As skills são markdown com instruções em linguagem natural, não código executável. Isso significa que dependem do modelo de linguagem interpretar corretamente. Um modelo pode pular etapas ou interpretar ambiguidades. A alternativa seria código executável (Python/TS scripts), mas perderia a portabilidade entre agentes.

**5.2 Single Source of Truth (DB centralizado)**

Toda escrita passa pelos subcomandos da CLI (`mercury job save`, `mercury recruiter add`, etc.). As skills NUNCA escrevem SQL diretamente. Isso é excelente porque:

- Centraliza validação e lógica de negócio
- Permite notificação ao dashboard
- Evita corrupção de dados por skills mal escritas
- Permite auditoria (tudo passa pelo mesmo código)

**5.3 ACP (Agent Client Protocol)**

A integração com agentes via ACP (em vez de subprocesso bash) é moderna e bem pensada:

- JSON-RPC 2.0 sobre stdio
- Streaming de atualizações via WebSocket
- Suporte a permissões (auto-aprovadas por enquanto)
- Provider registry extensível (opencode, claude-code)

**5.4 Single Binary com Assets Embutidos**

O build chain:
1. Vite compila Svelte → `web/dist/`
2. `scripts/embed-assets.ts` converte dist em base64 → `src/server/assets.gen.ts`
3. `bun build --compile` gera binário único

Isso elimina dependências de runtime e facilita distribuição. O `assets.gen.ts` é gitignored (issue #20) e um stub é gerado para dev/test.

---

## 6. Decisões Técnicas (Com Análise de Trade-offs)

### 6.1 Bun como runtime único ✅

**Decisão:** Usar Bun para tudo (runtime, package manager, bundler, test runner, SQLite nativo) em vez de Node.js + npm + better-sqlite3 + ts-node.

**Por que é bom:**
- `bun:sqlite` é built-in, zero dependências
- `bun build --compile` gera binário sem precisar de pkg/node SEA
- TypeScript roda nativo, sem ts-node/tsx
- Test runner integrado (compatível com Jest)
- Performance superior em I/O

**Trade-off:** Bun ainda é relativamente novo (estável desde set/2024), mas para um projeto CLI local sem dependências de servidor, é uma escolha segura.

### 6.2 SQLite com WAL mode ✅

```typescript
d.exec("PRAGMA journal_mode = WAL;");
```

WAL (Write-Ahead Logging) permite leitura concorrente durante escrita — essencial para o cenário onde o CLI escreve e o dashboard lê simultaneamente. Sem WAL, leituras bloqueiam escritas e vice-versa.

**Trade-off:** WAL cria arquivos adicionais (-wal, -shm). Para um usuário local, irrelevante.

### 6.3 Schema versioning via meta table

```typescript
INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)
```

Em vez de migration frameworks complexos (Knex, Prisma migrate), usam:
1. `CREATE TABLE IF NOT EXISTS` (idempotente)
2. `PRAGMA table_info()` + `ALTER TABLE ADD COLUMN` (migrations colunares)
3. Meta flags para one-time backfills (`backfill_outreach_attempts_v1`)

**Por que é bom:** Simples, sem dependências externas, adequado para um banco local single-user.

### 6.4 CLI minimalista sem framework

```typescript
// flags.ts - 47 linhas, sem dependências
export function parseFlags(argv: string[])...
```

Em vez de usar Commander, Yargs, ou Clerc, o projeto tem um parser de flags caseiro de 47 linhas. Isso mantém o binário enxuto (zero deps extra) e é suficiente para o caso de uso.

### 6.5 Lockfile para notificação cross-process

```
~/.mercury/dashboard.lock → { port, token, pid }
```

CLI e dashboard são processos separados. O lockfile permite comunicação bidirecional sem socket complexo. O CLI faz POST para o dashboard após escritas, e o dashboard usa o lockfile para saber se um CLI ainda está ativo.

### 6.6 Channel decision com consciência de custo (InMail)

```typescript
function decideChannel(opts: { degree, openProfile, highValue, creditsRemaining, reserveFloor }): ChannelDecision
```

Prioriza canais gratuitos (1st-degree → message; 2nd-degree → connect_note; Open Profile → InMail grátis), só gasta InMail pago em targets 3rd+ de alto valor com budget acima do reserve floor.

### 6.7 State machine de outreach com transições explícitas

```typescript
const TRANSITIONS: Record<OutreachState, ReadonlySet<OutreachState>> = {
  queued: new Set(["invited", "do_not_contact"]),
  invited: new Set(["invite_ignored", "accepted", "engaged", "do_not_contact"]),
  // ...
};
```

Toda transição é validada antes de executar. Isso previne estados inconsistentes. O teste unitário cobre TODAS as transições legais e ilegais.

### 6.8 Matcher ATS em camadas (exact → synonym → fuzzy)

```typescript
// 1. exact (1.0)
// 2. synonym (0.86-0.98)
// 3. fuzzy com Jaccard + Levenshtein (0.6-0.8)
```

Não usa LLM para matching — é determinístico e testado unitariamente. Prioriza especificidade (multi-word synonym > single-word hit). Reconhece campos EEO mas nunca autofill.

---

## 7. Padrões de Projeto

### 7.1 Command Pattern

Cada subcomando CLI (`mercury job save`, `mercury recruiter add`, etc.) é uma função separada que recebe `Flags` e age. O roteamento é feito por um switch no `index.ts`.

### 7.2 Repository Pattern (simplificado)

A camada de dados em `db/` e `store.ts` isola o SQL do resto do código. Queries são definidas em funções nomeadas em vez de espalhadas.

### 7.3 Adapter Pattern

```typescript
// Adapters para diferentes ATS
export const greenhouse: Adapter = { portal, hostPatterns, fields, notes }
export const lever: Adapter = { portal, hostPatterns, fields, notes }
export const ashby: Adapter = { portal, hostPatterns, fields, notes }
```

Cada ATS tem seu próprio adaptador com seletores CSS e widgets específicos. O `detectPortal` usa hostPatterns para selecionar o adaptador correto.

### 7.4 Pure Functions + Store Pattern (Outreach)

O outreach separa:
- `core.ts` — funções PURAS, sem I/O, deterministicas, testadas isoladamente (state machine, channel decision, deadline math)
- `store.ts` — operações SQLite que usam as funções puras

Isso segue o padrão de *separação de concerns* e permite testar a lógica de negócio sem banco de dados.

### 7.5 Singleton Pattern (DB)

```typescript
let _db: Database | null = null;
export function db(): Database {
  if (_db) return _db;
  // ...
}
```

Conexão com SQLite é singleton. Simples e adequado para um CLI single-thread.

### 7.6 Strategy Pattern (Providers ACP)

```typescript
export const PROVIDERS: Record<string, AcpProvider> = {
  opencode: { command, bin, models, ... }
  "claude-code": { command, bin, models, ... }
};
```

Cada provider sabe como iniciar seu agente, quais modelos oferece e como passar configuração. Extensível para adicionar novos providers.

### 7.7 Observer Pattern (Notificações)

```typescript
// notify.ts: CLI → Dashboard via HTTP
// WebSocket: Dashboard → UI via broadcast
```

Mudanças no banco são notificadas em cascata: CLI → Dashboard (HTTP) → UI (WebSocket).

---

## 8. Banco de Dados

### 8.1 Schema (v3, 11 tabelas)

| Tabela | Propósito | Destaques |
|---|---|---|
| `meta` | Chave-valor para flags de migração | Schema version, backfill flags |
| `profile` | Dados do perfil LinkedIn | Singleton (id=1) |
| `profile_metrics` | Séries temporais de métricas | search_appearances, views, score |
| `companies` | Cache de URNs do LinkedIn | name + urn_id |
| `recruiters` | Diretório de recrutadores | UNIQUE(username, company) |
| `jobs` | Vagas salvas | linkedin_job_id UNIQUE |
| `applications` | Candidaturas | status: draft/filled/submitted/needs_input |
| `applicant_answers` | Respostas reutilizáveis para ATS | upsert por key |
| `interviews` | Entrevistas agendadas | |
| `outreach_attempts` | Memória de relacionamento (issue #11) | Scope: (person_username, company_urn) |
| `outreach_budget` | Créditos InMail | Singleton (id=1) |
| `activity_log` | Log de auditoria | |
| `outreach_messages` | Mensagens enviadas (legado) | |

### 8.2 Índices

```sql
CREATE INDEX IF NOT EXISTS idx_recruiters_status ON recruiters(status);
CREATE INDEX IF NOT EXISTS idx_recruiters_company ON recruiters(company);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_metrics_captured ON profile_metrics(captured_at);
CREATE INDEX IF NOT EXISTS idx_activity_ts ON activity_log(ts);
CREATE INDEX IF NOT EXISTS idx_answers_category ON applicant_answers(category);
CREATE INDEX IF NOT EXISTS idx_attempts_scope ON outreach_attempts(person_username, company_urn);
CREATE INDEX IF NOT EXISTS idx_attempts_state ON outreach_attempts(state);
CREATE INDEX IF NOT EXISTS idx_attempts_due ON outreach_attempts(next_action_due);
CREATE INDEX IF NOT EXISTS idx_attempts_company ON outreach_attempts(company_urn);
```

Índices bem escolhidos: composite key para scoping de outreach, índice por `next_action_due` para queries de due actions, índices por status para filtros de dashboard.

### 8.3 Estratégia de Migração

```typescript
export const COLUMN_MIGRATIONS: Record<string, Record<string, string>> = {
  applications: {
    portal: "TEXT",
    external_url: "TEXT",
    fields_filled_json: "TEXT",
    unfilled_json: "TEXT",
  },
};
```

Migrações aditivas (só ADD COLUMN) via `PRAGMA table_info()`. One-time backfills com flag na meta table. Simples e seguro para SQLite (que não suporta `ADD COLUMN IF NOT EXISTS`).

### 8.4 Pontos Fortes

- **WAL mode** = leitura concorrente sem bloqueio
- **Foreign keys** habilitadas (`PRAGMA foreign_keys = ON`)
- **Unique constraints** bem colocados (`UNIQUE(username, company)` em recruiters, `UNIQUE(linkedin_job_id)` em jobs)
- **Timestamps automáticos** (`DEFAULT datetime('now')`)
- **JSON columns** para breakdowns flexíveis (`breakdown_json`, `fields_filled_json`)

### 8.5 Observações

- **Datas armazenadas como TEXT ISO 8601**: SQLite não tem tipo datetime nativo; TEXT ISO é padrão e bem aceito
- **Sem ENUMs**: estados são TEXT com validação na aplicação (no core.ts para outreach)
- **Outreach scoping por company_urn, não company_name**: resolve o problema "Amazon vs AWS" — boa decisão

---

## 9. APIs

### 9.1 CLI (14 comandos principais)

```
mercury setup                    # Instalar skills nos agentes
mercury init                     # Scaffold banco
mercury update                   # Auto-update
mercury dashboard                # Iniciar dashboard web
mercury linkedin reset           # Limpar sessões MCP órfãs

# Write API (usada pelas skills)
mercury recruiter add|update|sync
mercury outreach log|update|check|due|list|blocked|budget|withdraw
mercury job save
mercury metric record
mercury score record
mercury interview add
mercury application add|update
mercury answer set|list
mercury activity log

# Utilitários
mercury match
mercury detect-portal
mercury export
mercury import-journey
```

### 9.2 REST API (Dashboard)

| Rota | Método | Propósito |
|---|---|---|
| `/api/overview` | GET | Score + contagens |
| `/api/recruiters` | GET | Lista de recrutadores |
| `/api/outreach` | GET | Funil, due actions, blocked, budget |
| `/api/jobs` | GET | Vagas salvas |
| `/api/metrics` | GET | Métricas do perfil (série temporal) |
| `/api/interviews` | GET | Entrevistas |
| `/api/applications` | GET | Candidaturas |
| `/api/answers` | GET | Respostas reutilizáveis |
| `/api/activity` | GET | Log de atividades |
| `/api/profile` | GET | Perfil |
| `/api/profile-snapshot` | GET | Último snapshot |
| `/api/search/jobs` | POST | Busca de vagas (LinkedIn MCP) |
| `/api/search/people` | POST | Busca de pessoas |
| `/api/search/job-details` | POST | Detalhes da vaga |
| `/api/acp/providers` | GET | Provedores ACP disponíveis |
| `/api/acp/run` | POST | Executar skill via ACP |
| `/api/acp/cancel` | POST | Cancelar execução ACP |
| `/api/recruiters/sync` | POST | Sincronizar recrutadores |
| `/api/update` | POST | Executar update |
| `/api/update-status` | GET | Status de atualização |
| `/api/answer` | POST | Upsert de answer |
| `/_internal/changed` | POST | Notificação interna de mudança |

**Segurança da API:**
- Token de URL (`?token=<uuid>`) para autenticação — não há sessão nem login
- Servidor bind em `127.0.0.1` apenas (não exposto à rede)
- Verificação de token em todas as rotas `/api/`
- Cabeçalho `x-mercury-token` para chamadas internas

---

## 10. DevOps, Build e Deploy

### 10.1 Build

```bash
cd app
bun install
bun run dev                 # Executa direto do source
bun run typecheck           # tsc --noEmit
bun run build               # build:web → embed → build:bin
```

**Pipeline de build:**
1. `gen:version` — gera `version.gen.ts` do package.json
2. `build:web` — Vite compila Svelte → `web/dist/`
3. `embed` — `embed-assets.ts` converte `web/dist/` em base64 → `assets.gen.ts`
4. `build:bin` — `bun build --compile` → `dist/mercury`

### 10.2 Cross-compilação 5 targets

```
linux-x64, linux-arm64, darwin-x64, darwin-arm64, windows-x64.exe
```

### 10.3 Release

- CI em `.github/workflows/release.yml` (trigger em tag push: `git tag v0.3.0`)
- Workflow pin package.json na tag, cross-compila, gera SHA256SUMS, cria GitHub Release
- Bootstrap baixa binário pré-compilado com verificação SHA256
- Fallback para build from source se não houver binário para a plataforma

### 10.4 Bootstrap (Instalador)

```bash
curl -fsSL https://raw.githubusercontent.com/joaovjo/mercury/main/app/scripts/bootstrap.ts | bun run -
```

Script em TypeScript (350 linhas) que:
1. Detecta OS/arch
2. Baixa binário pré-compilado do GitHub Releases
3. Verifica SHA256
4. Instala em `~/.local/bin/mercury`
5. Copia skills para diretórios dos agentes detectados
6. Fallback para build from source se necessário

### 10.5 Setup de skills

```bash
mercury setup                    # Detecta agentes e copia skills
mercury setup --agent opencode   # Apenas um agente
mercury setup --all              # Todos (incluindo não detectados)
```

### 10.6 Auto-update

- Verifica GitHub Releases API a cada 10h
- Bounded timeout (1.5s), nunca bloqueia comando
- Cache em `~/.mercury/update-check.json`
- Stale cache atrás da versão instalada é ignorado (issue #13)
- Desabilitável via `MERCURY_NO_UPDATE_CHECK=1`

### 10.7 Docker?

**Não encontrei.** O projeto não usa Docker. É um binário único que roda localmente — não há container. Isso é consistente com o propósito: ferramenta CLI local, não serviço server-side.

---

## 11. Segurança

### 11.1 Ameaças Identificadas

#### Críticas

- **Sem criptografia do banco SQLite**: `~/.mercury/mercury.db` contém dados de recrutadores, conversas, credenciais de login (via LinkedIn MCP cookies). Qualquer processo com acesso ao diretório home pode ler.
  - *Mitigação:* O sistema foi desenhado para single-user local. Mas em máquinas compartilhadas, é um risco.
  - *Sugestão:* Documentar que o banco contém dados sensíveis e recomendar criptografia em nível de SO (FileVault, BitLocker).

- **Token de dashboard em texto puro no lockfile**: `~/.mercury/dashboard.lock` contém `{port, token, pid}`. O token pode ser lido por qualquer processo no sistema.
  - *Mitigação:* O servidor bind em 127.0.0.1, então ataque remoto não é possível.
  - *Sugestão:* Pelo menos `chmod 600` no lockfile.

- **Permissão automática ACP**: `SessionManager` auto-aprova TODAS as requisições de permissão do agente:
  ```typescript
  onPermission: async (p) => {
    // Auto-approve for now
    const allow = opts.find((o) => o.kind?.includes("allow")) ?? opts[0];
    return allow?.optionId ?? "allow";
  }
  ```
  *Risco:* Um skill malicioso ou prompt injection poderia fazer o agente executar operações não autorizadas.

#### Médias

- **Sem rate limiting na API REST**: O dashboard não tem proteção contra abuso local. De pouca relevância prática já que bind em 127.0.0.1.
- **CORS não configurado**: O servidor não define headers CORS — mas como bind local, irrelevante.
- **Sem validação de input em rotas API**: `POST /api/answer` aceita qualquer JSON. Mas como é single-user local, risco baixo.

#### Leves

- **Comando `detect-portal` aceita URL arbitrária**: Mas só detecta o ATS, não executa nada.
- **Log de atividade sem sanitização**: `activity.log` pode conter qualquer payload, mas é só log.

### 11.2 Decisões de Segurança Positivas

1. **Bind 127.0.0.1 exclusivo**: dashboard nunca exposto à rede
2. **Token de URL**: API protegida (embora seja single-user local)
3. **Never auto-submit**: portal-filler e recruiter-outreach param antes de enviar
4. **EEO never auto-fill**: campos demográficos EEO são reconhecidos mas sempre deixados para o humano
5. **Sem secrets no repositório**: AGENTS.md explicitamente proíbe commit de dados pessoais reais
6. **RequireSendConsent**: configurado como `true` por padrão
7. **Outreach gated por blacklist**: skills verificam se contato está bloqueado antes de tentar contato
8. **Dry-run mode**: `mercury recruiter sync --apply` requer flag explícita

---

## 12. Testes

### 12.1 Cobertura Geral

| Arquivo | Testes | O que testa |
|---|---|---|
| `outreach/core.test.ts` | 527 linhas | State machine, channel decision, blocking, due dates |
| `outreach/store.test.ts` | - | Operações SQLite do outreach |
| `recruiter/sync.test.ts` | 262 linhas | normalizeName, matchAccepted, planSync, applySync |
| `match/matcher.test.ts` | 126 linhas | normalize, editDistance, matchLabels |
| `acp/session.test.ts` | 80 linhas | buildSkillPrompt, Additional context field |
| `adapters/registry.test.ts` | - | detectPortal |
| `update-check.test.ts` | 119 linhas | Stale cache, version comparison |

### 12.2 O que é testado

- **Pure functions**: state machine (todas transições), channel decision, name normalization, matching
- **Comportamento determinístico**: matchLabels (exato, sinônimo, fuzzy, EEO)
- **Integração com DB em memória**: `planSync` / `applySync` com `Database(":memory:")`
- **Regressão**: stale cache no update check (issue #13)
- **Edge cases**: diacríticos, labels vazios, campos sem resposta, confidence ties

### 12.3 O que NÃO é testado

- **Quase nenhum teste de dashboard**: queries.ts, server/index.ts não têm testes
- **CLI sem testes**: Nenhum teste para os subcomandos CLI (recruiterCmd, jobCmd, etc.)
- **Integração MCP**: não há testes com LinkedIn MCP real
- **E2E**: nenhum teste browser/Chrome MCP
- **Integration DB → API**: nenhum teste que verifica se queries retornam formato correto
- **Testes de snapshot de schema**: nenhum teste que schema é o esperado

### 12.4 Qualidade dos Testes

**O que é bom:**
- Testes de pure functions são extensos e cobrem edge cases
- Testes usam `Database(":memory:")` para isolar
- Nomes descritivos (`"username match wins over name fallback"`)
- Uso de `beforeEach` para estado limpo
- Fixtures sintéticas (não usam dados reais)

**O que pode melhorar:**
- Os testes existentes não cobrem código que faz I/O real (MCP, sistema de arquivos)
- `bun test` pode ser executado sem build web completo (graças ao ensure-assets.ts)
- Falta teste de regressão de schema (que as migrações funcionam)

### 12.5 Framework

```bash
bun test  # usa bun:test (compatível com Jest API)
```

Sem dependências externas de teste (sem Jest, sem Vitest). `bun test` oferece:
- `describe`/`test`/`expect`
- `beforeEach`/`afterAll`
- Mocking via `mock()`

---

## 13. Observabilidade

### 13.1 Logging

O projeto **não usa** biblioteca de logging (pino, winston, etc.). A saída é:
- `console.log` para output normal
- `console.error` para erros
- `process.exit(1)` para falhas

Tem um `activity_log` no SQLite que registra eventos: kind, skill, summary, payload_json. Skills chamam: `mercury activity log --kind scout --skill job-scout --summary "Scouted N roles"`

### 13.2 Métricas

- Perfil: `profile_metrics` registra search_appearances, profile_views, post_impressions, connections, score
- Dashboard exibe gráfico de série temporal (uPlot) no Profile

### 13.3 Health Check

- `/api/update-status` expõe versão atual vs última disponível
- Dashboard indica "live/offline" via WebSocket status

### 13.4 Tracing

**Nenhum.** Sem OpenTelemetry, sem spans, sem traces distribuídos. Para um CLI local, adequado.

### 13.5 Update Check

```typescript
// update-check.ts — 197 linhas
// Cache de 10h, timeout de 1.5s, nunca bloqueia
```

---

## 14. Dívida Técnica e Riscos

### 14.1 Dívida Técnica

| Item | Severidade | Descrição |
|---|---|---|
| **Withdraw stub** | Média | `withdrawInvitation` retorna `false` sempre — não há implementação browser real no CLI, depende do skill `outreach-tracker` |
| **Auto-approve ACP** | Média | Todas as permissões são auto-aprovadas — pode levar a ações não intencionais |
| **Sem testes de dashboard** | Média | `server/index.ts` e `queries.ts` não têm cobertura |
| **CLI sem testes** | Média | Nenhum teste nos subcomandos CLI |
| **console.log como logging** | Baixa | Sem níveis de log, sem formato estruturado |
| **assets.gen.ts stub** | Baixa | Dev precisa de stub — mas é automatizado via ensure-assets.ts |

### 14.2 Riscos de Produção

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| **LinkedIn MCP falha** | Alta | Skills não funcionam | CLI reporta erro, skills degradam |
| **Rate limit LinkedIn** | Alta | Conta pode ser restrita | Skills documentam limite de 10-15 conexões |
| **Stale browser sessions** | Média | MCP não conecta | `mercury linkedin reset` limpa |
| **Token no lockfile** | Baixa | Acesso local ao token | Bind 127.0.0.1 |
| **DB corrompido** | Baixa | Perda de dados | WAL mode minimiza |

### 14.3 Boas Práticas que o Projeto Segue

- **Zero runtime dependencies** no CLI: só `@modelcontextprotocol/sdk` como dependência
- **TypeScript strict mode**: `strict: true` no tsconfig
- **Verbatim module syntax**: `verbatimModuleSyntax: true`
- **Generated code versionado**: `version.gen.ts` auto-gerado
- **Lockfile-based IPC**: elegante e simples
- **Pure functions testáveis**: core.ts sem I/O
- **DRY via CLI centralizado**: toda escrita passa pelo CLI
- **Synthetic data only**: sem PII real em commits

---

## 15. Conceitos para Dominar

Para entender este projeto a fundo, você precisa dominar:

| Conceito | Por que é importante |
|---|---|
| **Bun runtime** | Runtime, package manager, SQLite nativo, test runner, bundler |
| **MCP (Model Context Protocol)** | Como agentes se conectam a ferramentas externas (LinkedIn, Chrome) |
| **ACP (Agent Client Protocol)** | Protocolo para comunicação agente-cliente (JSON-RPC 2.0) |
| **SQLite WAL mode** | Concorrência leitura/escrita |
| **Svelte 5 runes** | `$state`, `$derived`, `$effect`, `bind:this` |
| **State machine design** | Outreach lifecycle com transições explícitas |
| **Levenshtein distance + Jaccard** | Algoritmos de fuzzy matching |
| **JSON-RPC 2.0** | Protocolo de comunicação agente-cliente |
| **Single binary compilation** | `bun build --compile` |
| **Cross-platform path resolution** | ~/.mercury, diferenças Windows/Unix |
| **Semantic versioning + keep a changelog** | Versionamento semântico |

---

## 16. Explicação Didática em Camadas

### Camada 1: Skills (O que o agente faz)

Skills são arquivos markdown que o agente carrega quando você faz um pedido. Por exemplo, quando você diz *"Find backend roles at Uber"*, o agente carrega `job-scout/SKILL.md` que contém:

```
search_jobs(keywords="Uber backend engineer", ...)
get_job_details(job_id)
mercury job save --linkedin-id {...}
```

O agente **interpreta** essas instruções e chama as ferramentas MCP + CLI.

### Camada 2: CLI (A interface de armazenamento)

Quando o skill chama `mercury job save --title "Backend Engineer" --company "Uber"`, a CLI:
1. Conecta no SQLite (WAL mode)
2. Executa INSERT com ON CONFLICT (upsert)
3. Verifica se dashboard está rodando (lockfile)
4. Se sim, faz POST para `/_internal/changed`
5. Dashboard recebe e broadcast WebSocket para UI

### Camada 3: Dashboard (A visualização)

O dashboard é um servidor HTTP (Bun.serve) que:
- Serve uma SPA Svelte 5 embutida no binário
- Expõe REST API para leitura de dados
- Mantém WebSocket para updates em tempo real
- Gerencia sessões ACP para executar skills com um clique

### Camada 4: MCP (A integração externa)

Mercury conversa com dois servidores MCP:
- **LinkedIn MCP**: busca de vagas, pessoas, perfis, conexões
- **Chrome MCP**: automação de navegador para edições que a API não expõe

---

## 17. Técnicas Didáticas no Código

### 17.1 State Machine explícita

```typescript
const TRANSITIONS: Record<OutreachState, ReadonlySet<OutreachState>> = {
  queued: new Set(["invited", "do_not_contact"]),
  invited: new Set(["invite_ignored", "accepted", "engaged", "do_not_contact"]),
  // ...
};
```

**O que ensina:** Máquinas de estado não precisam de bibliotecas. Um `Record<State, Set<State>>` + uma função `canTransition` é suficiente e testável.

### 17.2 Pure functions separadas de I/O

```typescript
// core.ts — pure, testável sem DB
export function isBlocking(a: AttemptLike, nowIso: string): boolean { ... }
export function dueAction(a: AttemptLike, cfg: OutreachConfig, nowIso: string): DueAction | null { ... }

// store.ts — opera no SQLite usando as funções puras
export function checkBlocked(username, companyUrn, d, nowIso): BlockCheck { ... }
```

**O que ensina:** Separar lógica pura (determinística, testável) de I/O (banco, rede) é uma das habilidades mais importantes para engenharia de software.

### 17.3 Matcher em camadas com fallback

```
exact (1.0) → synonym (0.86-0.98) → fuzzy Jaccard/Levenshtein (0.6-0.8)
```

**O que ensina:** Nem tudo precisa de LLM. Um algoritmo determinístico bem projetado resolve o problema, é mais rápido, mais barato e mais testável.

### 17.4 Migration aditiva sem framework

```typescript
for (const [table, columns] of Object.entries(COLUMN_MIGRATIONS)) {
  const existing = d.query(`PRAGMA table_info(${table})`).all() as { name: string }[];
  for (const [col, type] of Object.entries(columns)) {
    if (!existing.has(col)) {
      d.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
    }
  }
}
```

**O que ensina:** Você não PRECISA de Prisma/Knex para gerenciar schema. `PRAGMA table_info` + `ALTER TABLE ADD COLUMN` resolve para casos simples.

---

## 18. Perguntas para Reflexão

1. Por que usar SQLite em vez de PostgreSQL/MySQL? Quais os trade-offs para um CLI local?
2. Se você fosse adicionar suporte a múltiplos usuários, o que precisaria mudar na arquitetura?
3. Como você protegeria o banco SQLite em uma máquina compartilhada?
4. O que acontece se o LinkedIn MCP mudar sua API? Como o projeto poderia ser mais resiliente?
5. Se você fosse adicionar testes E2E, quais ferramentas usaria e o que testaria primeiro?
6. Como o sistema de notificação (CLI → Dashboard) falha? O lockfile pode ficar inconsistente?
7. O matcher de ATS é determinístico. Qual cenário poderia fazer um LLM ser melhor?
8. Se você precisasse adicionar um novo ATS (Workday), o que precisaria ser criado/modificado?
9. Por que `assets.gen.ts` foi tirado do versionamento (issue #20)? Qual problema isso resolvia?
10. O modelo de auto-aprovação de permissões ACP é seguro? Como melhorar?

---

## 19. Exercícios Práticos

1. **Exercício 1 — Nova skill:** Crie uma skill `company-researcher` que pesquisa uma empresa no LinkedIn e salva contatos-chave.

2. **Exercício 2 — Novo provider ACP:** Adicione suporte a um provider "codex" em `providers.ts`.

3. **Exercício 3 — Teste de integração:** Escreva um teste que verifica se `jobCmd("save", flags)` persiste corretamente usando `Database(":memory:")`.

4. **Exercício 4 — Matcher:** Adicione um novo campo ATS "pronouns" ao `synonyms.ts` e teste o matching.

5. **Exercício 5 — Dashboard view:** Adicione uma seção "Settings" ao dashboard que permite configurar `~/.mercury/config.json`.

6. **Exercício 6 — Export metrics:** Crie um comando `mercury metrics export --format csv` que exporta as métricas de perfil.

7. **Exercício 7 — Migração:** Crie uma migration v4 que adiciona uma tabela `notes` com `CREATE TABLE` + backfill.

8. **Exercício 8 — CLI test:** Escreva um teste para `recruiterCmd` que verifica se a flag `--name` é obrigatória.

---

## 20. ADRs (Architecture Decision Records) — Inferidos

| Decisão | Alternativa | Por que foi escolhida |
|---|---|---|
| SQLite em vez de PostgreSQL | PostgreSQL via Docker | Zero setup, single-user, embutido |
| Bun em vez de Node.js | Node.js + tsx + better-sqlite3 | Binário único, SQLite nativo, performance |
| Skills em markdown | Python scripts | Portabilidade entre agentes |
| Token URL em vez de login | JWT/sessão | Simplicidade, single-user local |
| Lockfile IPC em vez de socket Unix | Socket Unix | Portabilidade Windows |
| WAL mode em vez de DELETE | DELETE journal | Concorrência leitura/escrita |
| Sem ORM (SQL puro) | Prisma/Drizzle | Zero dependências, binário leve |
| Pure functions + store layer | Tudo junto | Testabilidade, separação de concerns |

---

## 21. Roadmap Implícito (baseado no CHANGELOG + issues)

### Já implementado:
- [x] CLI + SQLite + Dashboard (v0.2)
- [x] LinkedIn MCP integration + Hybrid search (v0.2)
- [x] ACP multi-provider (v0.2)
- [x] Single binary packaging (v0.2)
- [x] Profile optimizer skill (v0.2)
- [x] Experience bank skill (v0.2)
- [x] Windows prebuilt (v0.4)
- [x] Job scout URL parsing + auto-widen (v0.4)
- [x] Dashboard redesign Linear-inspired (v0.7)
- [x] Portal filler foundations (v0.6)
- [x] Outreach relationship memory + state machine (v0.8)
- [x] Recruiter sync via degree detection (v0.9)
- [x] Launch additional context field (v0.9)
- [x] Assets gen não versionado (v0.9.1)

### Futuro (mencionado / implícito):
- [ ] **Auto-submit (opt-in):** portal-filler atualmente só preenche, não submete
- [ ] **Workday/Taleo/iCIMS:** ATS complexos ainda não suportados
- [ ] **Dashboard UI polish:** Applications e Answers têm shells visuais, mas lógica incompleta
- [ ] **Testes do dashboard:** queries.ts sem cobertura
- [ ] **CI/CD pipeline:** workflows do GitHub não estão no clone local (mas existem no repo)

---

## 22. O que Copiar e o Que Evitar

### ✅ O que copiar para seus projetos

| Prática | Por que copiar |
|---|---|
| **Pure functions separadas de I/O** | Testabilidade, clareza, manutenibilidade |
| **State machine com Record<State, Set<State>>** | Simples, explícito, testável |
| **CLI como única fonte de verdade para escrita** | Evita corrupção de dados, centraliza validação |
| **Notificação cross-process via lockfile HTTP** | Simples, funciona cross-platform |
| **Compilação single binary** | Distribuição sem dependências |
| **Generated code + stub para dev** | CI não quebra por build faltando |
| **Migrações aditivas com PRAGMA table_info** | Seguro, sem dependências |
| **Matcher determinístico em camadas** | Não precisa de LLM para tudo |
| **Synthetic data only em commits** | Protege PII, essencial para open source |

### ❌ O que evitar (ou melhorar)

| Prática | Problema | Alternativa |
|---|---|---|
| **Auto-approve ACP permissions** | Risco de segurança | Implementar aprovação real ou ao menos logar |
| **console.log como logging** | Sem estrutura, sem níveis | Pino ou pelo menos structured logging |
| **Withdraw stub** | Funcionalidade incompleta | Completar ou documentar explicitamente |
| **Sem testes de dashboard** | Regressões não detectadas | Pelo menos smoke tests nas queries |
| **Token em texto puro no lockfile** | Exposição local | Chmod 600 ou criptografia simples |
| **Flags parser caseiro** | Edge cases não tratados | Para projetos maiores, usar commander/clerc |
| **Sem rate limit na API** | Abuso local (menor) | Adicionar se houver exposição remota |

---

## 23. Mentoria — Lições para um Engenheiro Sênior

### O que este projeto ensina sobre arquitetura

1. **Comece simples, evolua com necessidade.** O projeto começou com CLI, depois ganhou dashboard, depois ACP, depois outreach state machine. Cada feature foi adicionada quando necessária, não antes.

2. **Separe preocupações por camada de I/O.** O exemplo mais claro: `core.ts` (puro) vs `store.ts` (SQLite). Quando você precisa testar, essa separação vale ouro.

3. **Ferramenta certa para o problema certo.** SQLite para dados locais single-user é melhor que PostgreSQL em Docker. Bun para CLI compilado é melhor que Node.js + pkg. Skills em markdown são melhores que Python scripts para portabilidade entre agentes.

4. **Documentação para agentes de IA.** O `AGENTS.md` é um padrão emergente. Documentar arquitetura, convenções e gotchas para o próximo agente (ou humano) que mexer no código é um investimento que paga rápido.

5. **Segurança por design, mesmo em ferramenta local.** Bind 127.0.0.1, token de URL, never auto-submit, EEO fields protegidos, dry-run mode — tudo demonstra consciência de segurança mesmo em uma ferramenta single-user.

### O que falta para ser "production-grade"

1. Testes de integração (CLI + DB + API)
2. Testes E2E (Chrome MCP skills)
3. Logging estruturado
4. Documentação de segurança (o banco tem PII!)
5. CI com lint + typecheck + tests automatizados
6. Processo de rollback para updates

---

## 24. Síntese Final

**Mercury é um projeto exemplar** para estudo de arquitetura de sistemas modernos. Em ~5.000 linhas de TypeScript, ele demonstra:

- **CLI design**: parsing de flags, subcomandos, help text
- **Database schema design**: SQLite, migrations aditivas, índices
- **State machine**: transições explícitas, pure functions
- **IPC**: lockfile + HTTP para comunicação cross-process
- **WebSocket**: live updates para UI
- **MCP/ACP**: protocolos modernos de integração agente-ferramenta
- **Build chain**: Vite + Bun compile, single binary, cross-compilação
- **Instalação**: bootstrap remoto, SHA256 verification, fallback source build
- **Auto-update**: cache-aware, bounded timeout, never blocking
- **Segurança consciente**: bind local, token URL, never auto-submit

### Pontuação (1-10)

| Dimensão | Nota | Justificativa |
|---|---|---|
| **Arquitetura** | 9 | Separação clara de concerns, pure functions, state machine |
| **Código** | 8 | Limpo, TypeScript strict, bem organizado |
| **Testes** | 6 | Bons testes de pure functions, mas faltam testes de I/O e dashboard |
| **Documentação** | 9 | README excelente, AGENTS.md, CHANGELOG, SKILL.md detalhados |
| **Segurança** | 7 | Consciente, mas auto-approve ACP e lockfile exposto |
| **DevOps** | 7 | CI/CD existe mas não está no clone; build/release bem automatizado |
| **Inovação** | 8 | Uso de ACP, MCP, single binary, skills markdown — abordagem moderna |
| **Manutenibilidade** | 8 | Código modular, naming consistente, conventions documentadas |
| **Aprendizado** | 10 | Projeto riquíssimo para estudo — toca quase todos os tópicos de engenharia |

**Nota geral: 8.0/10** — Projeto maduro, bem arquitetado, com excelente documentação. Pecado pela falta de testes no dashboard e CLI, e pelo auto-approve ACP. Mas como ferramenta de aprendizado, é nota 10.
