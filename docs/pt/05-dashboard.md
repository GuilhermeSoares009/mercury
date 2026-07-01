# Dashboard Web

O Mercury vem com um dashboard web local — uma interface Svelte 5 para visualizar e
controlar toda a sua busca de emprego em um só lugar.

## Acessando

```bash
mercury dashboard
```

Isso inicia um servidor HTTP local e abre automaticamente o navegador em:

```
http://127.0.0.1:{porta}/?token={token}
```

### Detalhes da conexão

- **Bind**: exclusivo em `127.0.0.1` (localhost) — nunca acessível pela rede.
- **Porta**: aleatória (porta 0 = SO escolhe), ou fixa com `--port`.
- **Token**: UUID aleatório gerado a cada inicialização, passado como query param.
- **Lockfile**: o dashboard escreve `~/.mercury/dashboard.lock` com
  `{port, token, pid}` para que o CLI possa notificá-lo após escritas no banco.

Se outro dashboard já estiver rodando, o comando `mercury dashboard` reutiliza a
mesma URL (lê o lockfile existente) em vez de iniciar outra instância.

## Stack Visual

| Camada | Tecnologia |
|--------|-----------|
| Framework | Svelte 5 (runes: `$state`, `$derived`, `$effect`) |
| Estilos | Tailwind CSS v4 |
| Componentes | Bits UI (Select, etc.) |
| Ícones | Lucide Svelte |
| Build | Vite (embedded no binário via base64) |
| Tempo real | WebSocket nativo (Bun.serve) |

### Design

Escuro, inspirado no Linear:

- Fundo principal `#08090a` com painéis em `#0e0f10`
- Sidebar com navegação fixa à esquerda (264px)
- Barra superior com indicador "live" (bolinha verde quando conectado)
- Tipografia limpa, tracking negativo, headings sem serifa
- Paleta de cores: texto `#e4e4e7`, dim `#a1a1aa`, faint `#52525b`, cyan para
  destaque, green para indicador de conexão
- Cards em painéis com borda sutil (`border-border-2`)

## Abas

O dashboard tem 11 abas, cada uma importada como um componente Svelte 5
independente em `app/web/src/sections/`:

### Overview (`Overview.svelte`)

Visão geral do pipeline. Exibe:

- **Score do perfil** (última auditoria do profile-optimizer)
- **Recrutadores**: total, contatados, aceitos, que responderam
- **Entrevistas**: agendadas, feitas
- **Vagas**: salvas, candidaturas enviadas
- **Atividades recentes**

Os dados vêm de `GET /api/overview`, que agrega múltiplas tabelas do SQLite.
O componente escuta eventos `changed` do WebSocket para recarregar automaticamente
quando recruiters, jobs, interviews, applications ou profile_metrics são alterados.

### Profile (`Profile.svelte`)

Métricas de perfil do LinkedIn ao longo do tempo. Gráfico que mostra:

- Aparições em busca de recrutadores (recruiter search appearances)
- Visualizações de perfil (profile views)
- Impressões
- Conexões

Dados persistidos via `mercury metric record --breakdown '...'` executado pelo
`profile-optimizer`. Exibe a série histórica com base em `GET /api/metrics`.

### Search (`Search.svelte`)

Busca instantânea no LinkedIn sem sair do dashboard. Usa o **LinkedIn MCP**
diretamente (não passa pelo agente):

- `POST /api/search/jobs` — busca de vagas por keywords + local + tipo de trabalho
- `POST /api/search/people` — busca de pessoas por keywords + empresa + local
- `POST /api/search/job-details` — detalhes completos de uma vaga por ID

Resultados crus vindos do MCP, sem passar pelo agente de IA. Ideal para
exploração rápida.

### Launch (`Launch.svelte`)

**ACP — Agent Client Protocol.** Executa qualquer skill do Mercury em um agente
(opencode ou Claude Code) com um clique.

O usuário configura:

1. **Agent**: opencode ou Claude Code
2. **Model**: modelo específico (opcional — usa o default se vazio)
3. **Skill**: Job Scout, Experience Bank, Recruiter Outreach, Profile Optimizer,
   Resume Tailor
4. **Parâmetros da skill**: query, local, empresa, IDs de vagas (muda conforme
   a skill selecionada)
5. **Contexto adicional**: campo de texto livre para instruções extras

Quando o usuário clica **Run Agent**:

1. O dashboard envia `POST /api/acp/run` com provider, skill e parâmetros
2. O `SessionManager` no backend cria uma sessão ACP com o agente
3. Um prompt template é montado para a skill escolhida
4. O agente executa, chamando MCPs (LinkedIn, Chrome) e o CLI do Mercury
5. Todo o progresso é transmitido via WebSocket: texto do agente, tool calls,
   permissões, erros
6. O painel direito mostra um terminal ao vivo com `agent_output.log`

O cancelamento é feito via `POST /api/acp/cancel`.

### Recruiters (`Recruiters.svelte`)

Kanban do pipeline de recrutadores. Colunas:

| Coluna | Descrição |
|--------|-----------|
| Pending | Convite enviado, aguardando aceite |
| Accepted | Aceitou, aguardando resposta |
| Replied | Respondeu à primeira mensagem |
| Interviewing | Em processo de entrevista |
| Closed | Não respondido / arquivado |

Botão **Sync**: detecta convites aceitos via busca no LinkedIn MCP
(`POST /api/recruiters/sync`). Avança cards de pending → accepted
automaticamente.

### Outreach (`Outreach.svelte`)

Follow-ups de outreach pendentes. Integra com `mercury outreach due` para
mostrar o que precisa de ação hoje: nudges, retirada de convites, fechamentos.

### Jobs (`Jobs.svelte`)

Todas as vagas salvas. Lista com fit rating (Strong / Good / Stretch), empresa,
local, data. Vem de `GET /api/jobs`.

### Applications (`Applications.svelte`)

Candidaturas enviadas via `portal-filler`. Status tracking:

- `draft` — resposta salva, não preencheu ainda
- `filled` — formulário preenchido (mas não submetido)
- `submitted` — confirmado como enviado

### Answers (`Answers.svelte`)

Respostas reutilizáveis para candidaturas (portal-filler). O usuário pode
cadastrar e editar contato, elegibilidade, links, etc. Persiste via
`POST /api/answer` ou `mercury answer set`.

### Interviews (`Interviews.svelte`)

Entrevistas registradas. Calendário com data, empresa, estágio, notas.

### Activity (`Activity.svelte`)

Histórico completo de ações do Mercury. Log de execuções de skills, syncs de
recrutadores, alterações de perfil. Cada entrada tem timestamp, skill usada,
resumo.

## Tempo Real (WebSocket)

O dashboard mantém uma conexão WebSocket (`/ws?token={token}`) para atualizações
ao vivo:

1. **CLI escreve no banco** → pica o lockfile via HTTP `POST /_internal/changed`
2. **Servidor** → broadcast `{type: "changed", table: "recruiters"}` para todos
   os sockets conectados
3. **Componentes** → escutam `changed` e recarregam os dados da aba relevante

Além disso, eventos do ACP (execução de skills) são transmitidos em tempo real:

- `acp-status` — starting / running / done
- `acp-update` — chunks de texto do agente, tool calls, planos
- `acp-permission` — permissões auto-aprovadas
- `acp-error` — erros do agente
- `acp-exit` — processo do agente encerrou
- `update` — eventos de atualização do próprio Mercury

## Indicador de Atualização

O dashboard verifica se há uma nova versão do Mercury disponível via
`GET /api/update-status`. Se houver, exibe um card no rodapé da sidebar com
link para atualizar. O usuário clica **Update now** e o dashboard orquestra o
download via `POST /api/update`, exibindo o progresso em tempo real.

## Arquitetura do Servidor

Tudo roda em um único binário compilado:

```
Bun.serve (porta aleatória, hostname 127.0.0.1)
├── REST API (/api/*) — consultas ao SQLite
├── WebSocket (/ws) — mudanças ao vivo + stream ACP
├── Search API (/api/search/*) — LinkedIn MCP direto
├── ACP API (/api/acp/*) — execução de skills via agente
├── Internal hook (/_internal/changed) — CLI → dashboard
└── Static assets (Svelte build embedado ou em disco)
```

O build em produção embeda os assets Svelte como base64 no binário. Em
desenvolvimento, o servidor serve de `web/dist/` no disco.
