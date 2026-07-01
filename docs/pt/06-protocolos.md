# Protocolos de Comunicação

O Mercury usa dois protocolos principais para se comunicar com o mundo externo:

- **MCP (Model Context Protocol)** — para ferramentas do LinkedIn e Chrome
- **ACP (Agent Client Protocol)** — para executar skills em agentes de IA

---

## MCP — Model Context Protocol

O Mercury atua como **cliente MCP** para dois servidores:

### LinkedIn MCP Server

Conecta-se ao [LinkedIn MCP Server](https://github.com/stickerdaniel/linkedin-mcp-server)
via stdio. Usa o SDK oficial `@modelcontextprotocol/sdk` para comunicação
JSON-RPC.

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
```

**Transporte**: `StdioClientTransport` — spawna `uvx mcp-server-linkedin@latest`
como subprocesso e se comunica via JSON-RPC sobre stdin/stdout.

**Inicialização**: lazy — a conexão só é estabelecida na primeira chamada a uma
ferramenta. O cliente é singleton (`_client`) e reutilizado durante toda a vida
do dashboard.

#### Ferramentas do LinkedIn MCP expostas pelo Mercury

| Ferramenta | Uso | Endpoint REST |
|-----------|-----|---------------|
| `search_jobs` | Buscar vagas por keyword + local + work type | `POST /api/search/jobs` |
| `get_job_details` | Detalhes completos de uma vaga | `POST /api/search/job-details` |
| `search_people` | Buscar recrutadores por keyword + empresa + local | `POST /api/search/people` |
| `get_person_profile` | Perfil completo de uma pessoa | via skill (não exposto REST) |
| `get_company_profile` | Dados da empresa + URN ID | via skill, usado internamente |
| `connect_with_person` | Enviar convite de conexão | via skill (recruiter-outreach) |
| `send_message` | Enviar mensagem após aceite | via skill (outreach-tracker) |
| `get_inbox` / `get_conversation` | Ler conversas | via skill (outreach-tracker) |
| `get_own_profile` | Perfil do próprio usuário | via skill (profile-optimizer) |
| `search_appearing_keywords` | Palavras-chave que aparecem no perfil | via skill |
| `search_profile_views` | Quem viu o perfil | via skill |

O wrapper está em `app/src/mcp/linkedin.ts`. A função `callTool(name, args)`
chama qualquer ferramenta do LinkedIn MCP e retorna o resultado parseado.

### Chrome MCP

Usado para automação de navegador quando o LinkedIn MCP não expõe a
funcionalidade necessária.

#### Casos de uso

| Operação | Chrome MCP | Por quê? |
|----------|-----------|----------|
| Editar perfil (About, headline, skills) | `navigate` + `snapshot` + `click` + `fill` + `pipeline` | LinkedIn não expõe edição via API |
| Retirar convite (withdraw) | `navigate` + `snapshot` + `click` + `dialog` | LinkedIn MCP não tem tool de withdraw |
| Preencher ATS (portal-filler) | `navigate` + `snapshot` + `fill` + `click` | Formulários externos (Greenhouse, Lever, Ashby) |

**Pipeline tool**: o Chrome MCP suporta `pipeline` — uma chamada que executa
múltiplas ações (navegar → snapshot → clicar/preencher) em uma só rodada,
mais rápido e confiável que round-trips individuais.

### Cache de Company URN

O Mercury mantém uma tabela `companies` em SQLite para cachear URN IDs do
LinkedIn. Quando uma skill busca recrutadores de uma empresa, o sistema:

1. Verifica se o URN já está no cache local
2. Se não, chama `get_company_profile` via MCP
3. Extrai o `company_urn` do resultado
4. Salva no banco para consultas futuras

Isso é essencial porque o filtro `current_company` da busca de pessoas exige
URN numérico — nomes comuns são ignorados silenciosamente.

---

## ACP — Agent Client Protocol

O Mercury implementa um **cliente ACP** para executar skills em agentes de IA
(opencode ou Claude Code) diretamente do dashboard.

### Visão Geral

ACP é um protocolo JSON-RPC 2.0 sobre **stdio** (newline-delimited). O Mercury
atua como **cliente** (lado editor), spawna o agente como subprocesso e se
comunica via stdin/stdout.

```
Mercury Dashboard (cliente ACP)
       │
       ├── spawna: opencode acp --cwd /workspace
       │            ou npx @zed-industries/claude-code-acp
       │
       ▼
Agente de IA (servidor ACP)
       │
       ├── recebe prompts via session/prompt
       ├── envia atualizações via session/update
       └── pede permissão via session/request_permission
```

**Especificação**: [agentclientprotocol.com](https://agentclientprotocol.com)

### Handshake

1. **initialize** — Mercury anuncia suas capacidades:
   ```json
   {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {
     "protocolVersion": 1,
     "clientCapabilities": {
       "fs": { "readTextFile": true, "writeTextFile": true }
     }
   }}
   ```

2. **session/new** — cria uma sessão vinculada ao diretório do workspace:
   ```json
   {"jsonrpc": "2.0", "id": 2, "method": "session/new", "params": {
     "cwd": "/caminho/do/workspace",
     "mcpServers": []
   }}
   ```

3. O agente responde com `{sessionId: "..."}` e o Mercury envia prompts.

### Fluxo de Execução de Skill

```
Usuário clica "Run Agent" no dashboard
       │
       ▼
POST /api/acp/run { provider, skill, params }
       │
       ▼
SessionManager.run()
       │
       ├── Cria AcpClient(providerId, cwd, callbacks)
       ├── client.start() → spawn + initialize + session/new
       ├── client.prompt(prompt) → session/prompt
       │
       ▼
Agente começa a trabalhar
       │
       ├── session/update → chunks de texto, tool calls, planos
       │     → broadcast WebSocket → dashboard exibe ao vivo
       │
       ├── session/request_permission → auto-aprovada (por enquanto)
       │     → broadcast WebSocket → "auto-approved"
       │
       └── Ao terminar → session/update final → acp-status "done"
```

### Provider Registry

Definido em `app/src/acp/providers.ts`:

| Provider | Comando | Flag de modelo |
|----------|---------|----------------|
| **opencode** | `opencode acp --cwd {cwd}` | `OPENCODE_CONFIG_CONTENT` (JSON com `model`) |
| **claude-code** | `npx -y @zed-industries/claude-code-acp` | `ANTHROPIC_MODEL` |

O provider default é configurável em `~/.mercury/config.json`.

O **Claude Code ACP** requer a instalação do adapter da Zed:
```bash
npx -y @zed-industries/claude-code-acp
```

### Session Manager

Em `app/src/acp/session.ts`. Mantém uma sessão ativa por vez (single user).

**Estados**: `running` (bool) — impede execução concorrente.

**Cancelamento**: envia `session/cancel` via notificação JSON-RPC, depois
mata o processo.

### Skill Prompts

Cada skill tem um prompt template em `buildSkillPrompt()`:

| Skill | Prompt Template |
|-------|----------------|
| `job-scout` | Busca no LinkedIn, produz shortlist, salva com `mercury job save` |
| `recruiter-outreach` | Encontra recrutadores, envia conexões, registra com `mercury recruiter add` |
| `profile-optimizer` | Audita perfil, reporta pitfalls, registra métricas |
| `experience-bank` | Entrevista usuário sobre conquistas, armazena em `.mercury/experience/` |
| `resume-tailor` | Personaliza currículo + cover letter + gap report |

O campo "Additional context" do dashboard é **appendado** ao prompt como um
bloco claramente delimitado (`--- Additional context from the user (honor this):`).

### Permissões

Atualmente, todas as permissões são **auto-aprovadas**. O SessionManager
implementa `onPermission` que seleciona automaticamente a primeira opção
"allow" disponível. Isso é um comportamento provisório — a intenção é
adicionar aprovação explícita pelo usuário no futuro.

### Model Discovery

O Mercury descobre modelos disponíveis em tempo real:

- **opencode**: executa `opencode models` e parseia a saída linha a linha
- **Claude Code**: faz um handshake ACP de teste com `session/new` e lê
  `availableModels` da resposta do adapter

Os resultados são cacheados por 5 minutos para evitar latência.

### Tratamento do CLAUDECODE Guard

O Claude Code ACP se recusa a iniciar se detectar a variável `CLAUDECODE`
(herdada quando o dashboard roda dentro de uma sessão Claude Code). O Mercury
neutraliza isso explicitamente:

```typescript
const env: Record<string, string> = { CLAUDECODE: "" };
```

Isso é o escape hatch documentado pelo adapter.
