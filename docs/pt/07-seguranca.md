# Segurança

Mercury foi projetado com privacidade e controle do usuário como premissas
centrais. Nada do seu dado pessoal sai da sua máquina sem sua aprovação explícita.

## Princípios Fundamentais

1. **Dados locais** — tudo fica em `~/.mercury/mercury.db` (SQLite local).
2. **Sem telemetria** — nenhum dado é enviado automaticamente.
3. **Rede local apenas** — o dashboard bind em `127.0.0.1`, inacessível da rede.
4. **Consentimento explícito** — toda ação externa (enviar conexão, preencher
   formulário) requer aprovação humana.

---

## Dashboard

### Bind e Token

```bash
mercury dashboard
```

- O servidor HTTP bind exclusivamente em `127.0.0.1` (localhost).
- Porta aleatória (a menos que `--port` seja especificada).
- Token UUID gerado a cada inicialização, passado como query parameter:
  `http://127.0.0.1:{port}/?token={token}`
- O mesmo token é verificado em todas as requisições da API REST e WebSocket.
- Internamente, o CLI autentica no hook `/_internal/changed` via header
  `x-mercury-token`.

**Riscco**: se um processo malicioso rodando na mesma máquina conseguir ler
`~/.mercury/dashboard.lock`, ele terá acesso ao token e à porta. Mantenha sua
máquina segura.

### WebSocket

A conexão `/ws?token={token}` exige o token como query parameter. Sem ele, o
servidor retorna `403 Forbidden`. Todas as mensagens são broadcasts para os
sockets autenticados — não há dados sensíveis trafegando em texto puro não
criptografado, mas como é localhost, o risco é mínimo.

---

## Banco de Dados

### Localização

```
~/.mercury/mercury.db
```

SQLite com modo WAL (Write-Ahead Logging). Contém:

- Recrutadores, empresas, vagas
- Métricas de perfil (histórico de aparições, visualizações)
- Entrevistas, candidaturas, atividades
- Respostas do portal-filler
- Métricas de score

### Isolamento

- **Nenhum dado é enviado para servidor externo.**
- O banco não sai da máquina a menos que o usuário explicitamente o copie.
- O modo WAL permite leitura durante escrita, sem locks.

---

## Dados Pessoais e PII

### Regra Fundamental

```
NUNCA commitar dados reais no repositório.
```

O repositório é **público**. O `AGENTS.md` do projeto estabelece:

> Testes, fixtures, comentários, strings de exemplo, mensagens de commit, PRs,
> issues e docs de skills devem usar **identidades sintéticas** apenas:
> `Recruiter One`, `Acme Corp`, slugs como `recruiter-one-000001`,
> casos de diacríticos como `Renée Würst`.

Dados reais de outreach vivem **exclusivamente** em `~/.mercury/mercury.db`,
que é gitignorado.

### EEO (Equal Employment Opportunity)

O **portal-filler** nunca preenche campos demográficos (EEO) — raça, gênero,
veterano, deficiência. Esses campos são pulados explicitamente.

---

## Blacklist e Cooldown de Recrutadores

Quando um recrutador não responde ou o invite expira, o Mercury registra um
bloqueio scoped a **(pessoa, empresa URN)**:

```
mercury outreach update --id {attemptId} --state invite_ignored --reason "invite withdrawn after 7d"
```

- O bloqueio expira após o período configurado (default: **9 meses**).
- Durante o cooldown, o `recruiter-outreach` ignora esse par pessoa-empresa.
- Isso evita reconectar com quem já ignorou antes.
- O bloqueio **não** é permanente — após o cooldown, a pessoa pode ser
  contactada novamente (útil se ela mudou de cargo ou empresa).

---

## Riscos Conhecidos

### Credenciais do LinkedIn MCP

O LinkedIn MCP Server requer login via `uvx mcp-server-linkedin@latest --login`.
Isso armazena cookies/sessão do LinkedIn em:

```
~/.linkedin-mcp/
```

- Esses tokens dão acesso ao seu perfil e conexões do LinkedIn.
- O Mercury nunca acessa esse diretório — quem o gerencia é o MCP server.
- **Risco**: se outro processo malicioso tiver acesso ao mesmo diretório, pode
  roubar a sessão.

### Webhooks sem Assinatura

O hook interno `/_internal/changed` valida o token via header `x-mercury-token`,
mas não há assinatura criptográfica nas requisições. Um atacante com acesso ao
lockfile poderia disparar eventos falsos.

### Sem Rate Limiting na API

O servidor HTTP do dashboard (Bun.serve) não implementa rate limiting. Um
processo local poderia floodar o servidor com requisições. Como o bind é
exclusivamente localhost, o impacto é limitado à própria máquina.

### Informações Sensíveis em Logs

O CLI e o dashboard podem, em situações de erro, logar informações que
contenham nomes de empresas, recrutadores ou detalhes de vagas. Revise os
logs antes de compartilhar em issues ou bug reports.

Os logs ficam em `~/.mercury/logs/` e não são enviados a lugar nenhum.

### ACP — Auto-aprovação de Permissões

Atualmente, o SessionManager **auto-aprova** todas as requisições de permissão
do agente ACP. Isso significa que o agente pode executar ferramentas (LinkedIn
MCP, Chrome MCP, comandos `mercury`) sem pedir confirmação ao usuário.

**Mitigação planejada**: implementar aprovação explícita via interface no
dashboard, onde o usuário vê cada permissão solicitada e decide.

### Modelos de IA

Ao usar Claude Code ou opencode via ACP, os prompts e resultados da skill são
enviados para a API do provedor do modelo (Anthropic, OpenAI, etc.). Consulte
as políticas de privacidade de cada provedor.

---

## Dependências

### npm audit

O projeto usa Bun como runtime e gerenciador de pacotes. Periodicamente:

```bash
cd app
bun audit
```

Ou manualmente verifique vulnerabilidades conhecidas nas dependências. As
dependências principais são:

- `@modelcontextprotocol/sdk` — cliente MCP (LinkedIn)
- `zod` — validação de schemas
- Lucide, Bits UI, Tailwind — dependências de frontend (dashboard)

### Binário Único

O `mercury` é compilado como binário único via `bun build --compile`. Isso
elimina a cadeia de dependências em runtime — não há `node_modules` para
explorar. A superfície de ataque é o próprio binário e os MCP servers que ele
chama.

---

## Checklist de Segurança

- [ ] Dashboard bind em localhost (nunca `0.0.0.0`)
- [ ] Token de acesso gerado aleatoriamente
- [ ] Dados em SQLite local (não sai da máquina)
- [ ] EEO nunca preenchido
- [ ] Cooldown de 9 meses para recrutadores não respondedores
- [ ] NENHUM dado real no repositório público
- [ ] `require_send_consent` ativo em todas as skills de outreach
- [ ] Portal-filler nunca clica Submit
