# CLI — Linha de Comando

## Uso básico

```bash
mercury <comando> [subcomando] [flags]
```

Flags globais:

| Flag             | Descrição                    |
| ---------------- | ---------------------------- |
| `-h, --help`     | Exibe ajuda                  |
| `-v, --version`  | Exibe a versão               |

---

## mercury init

Inicializa o diretório de dados `~/.mercury/`, cria o banco SQLite e gera a
configuração padrão.

```bash
mercury init
```

Saída típica:

```
Mercury initialized at /home/user/.mercury
  db:     /home/user/.mercury/mercury.db
  config: /home/user/.mercury/config.json
Run `mercury dashboard` to open the hub.
```

---

## mercury setup

Instala as skills do Mercury nos diretórios de skills dos agentes detectados
(opencode, Claude Code, Cursor, Codex, `~/.agents`). Idempotente — seguro
re-executar após uma atualização para atualizar as skills.

```bash
mercury setup [flags]
```

Flags:

| Flag                 | Descrição                                                   |
| -------------------- | ----------------------------------------------------------- |
| `--agent <id>`       | Apenas um agente específico (`opencode`, `claude`, etc.)    |
| `--all`              | Instala em todos os agentes conhecidos (mesmo não detectados) |
| `--skills-dir <p>`   | Diretório explícito adicional para copiar as skills          |
| `--skills-src <p>`   | Diretório de origem das skills (sobrescreve detecção)       |

Exemplos:

```bash
mercury setup                               # instala nos agentes detectados
mercury setup --all                          # instala em todos (cria diretórios)
mercury setup --agent opencode               # apenas opencode
mercury setup --skills-dir ~/.custom/skills  # diretório customizado
```

---

## mercury update

Verifica e aplica atualizações do Mercury.

```bash
mercury update [--force]
```

| Flag     | Descrição                                            |
| -------- | ---------------------------------------------------- |
| `--force`| Reinstala a versão mais recente mesmo se já atualizado |

Sem `--force`, só executa o update se houver uma versão mais nova disponível.

---

## mercury dashboard

Abre o dashboard web do Mercury (interface Svelte com WebSocket para
live-refresh).

```bash
mercury dashboard [--port N] [--no-open] [--provider id]
```

Flags:

| Flag               | Descrição                                         |
| ------------------ | ------------------------------------------------- |
| `--port <N>`       | Porta específica (0 = atribuída pelo SO)          |
| `--no-open`        | Não abre o navegador automaticamente               |
| `--provider <id>`  | Provedor ACP padrão (`opencode`, `claude-code`)    |
| `--workspace <p>`  | Diretório do workspace do projeto                  |

Exemplos:

```bash
mercury dashboard                     # abre na porta aleatória
mercury dashboard --port 3456         # porta fixa
mercury dashboard --no-open           # só inicia o servidor
mercury dashboard --provider opencode # define o provedor ACP
```

---

## mercury linkedin reset

Limpa sessões órfãs do navegador Chromium usado pelo LinkedIn MCP
(`~/.linkedin-mcp/`). No Windows, processos-filho orphaned mantêm locks do
perfil; este comando mata esses processos e remove arquivos de lock stale.

```bash
mercury linkedin reset
```

Saída típica:

```
linkedin reset — killed 2 stale browser process(es), cleared 3 stale lock file(s).
```

---

## mercury import-journey

Migra um arquivo `JOURNEY.md` legado para o banco SQLite. Reconhece as
tabelas "Recruiter Outreach Tracker", "Interviews" e "Profile Metrics" no
formato markdown.

```bash
mercury import-journey <FILE.md>
```

Exemplo:

```bash
mercury import-journey ~/antigo-journal.md
```

---

## mercury recruiter

Gerencia o banco de recrutadores.

### Subcomandos

#### recruiter add

Adiciona um recrutador ao banco.

```bash
mercury recruiter add --name <nome> [flags]
```

Flags:

| Flag                | Descrição                           |
| ------------------- | ----------------------------------- |
| `--name <n>`        | Nome do recrutador **(obrigatório)**|
| `--company <n>`     | Empresa                             |
| `--username <n>`    | Username no LinkedIn                 |
| `--title <n>`       | Cargo                               |
| `--location <n>`    | Localização                         |
| `--degree <n>`      | Grau de conexão                     |
| `--status <s>`      | Status (`pending`, `accepted`, etc.)|
| `--note <t>`        | Observação                          |
| `--source-skill <s>`| Skill de origem                     |

Exemplo:

```bash
mercury recruiter add \
  --name "Maria Silva" \
  --company "Acme Corp" \
  --username "maria-silva" \
  --title "Tech Recruiter"
```

#### recruiter update

Atualiza um recrutador existente.

```bash
mercury recruiter update --id <n> [flags]
```

| Flag                | Descrição                           |
| ------------------- | ----------------------------------- |
| `--id <n>`          | ID do recrutador **(obrigatório)**  |
| `--status <s>`      | Novo status                         |
| `--note <t>`        | Nova observação                     |
| `--username <n>`    | Username                            |
| `--company <n>`     | Empresa                             |
| `--title <n>`       | Cargo                               |
| `--location <n>`    | Localização                         |
| `--degree <n>`      | Grau de conexão                     |

Exemplo:

```bash
mercury recruiter update --id 5 --status accepted --note "Aceitou conexão"
```

#### recruiter sync

Varre recrutadores pendentes contra o LinkedIn e detecta quais agora são
conexões de 1º grau (dry-run por padrão).

```bash
mercury recruiter sync [--apply] [--json]
```

| Flag    | Descrição                                      |
| ------- | ---------------------------------------------- |
| `--apply`| Aplica as transições pending → accepted        |
| `--json` | Saída em JSON para consumo programático        |

Exemplo:

```bash
mercury recruiter sync                    # dry-run
mercury recruiter sync --apply            # aplica transições
mercury recruiter sync --apply --json     # aplica e emite JSON
```

---

## mercury job save

Salva uma vaga no banco de dados.

```bash
mercury job save [flags]
```

Flags:

| Flag                | Descrição                             |
| ------------------- | ------------------------------------- |
| `--linkedin-id <n>` | ID da vaga no LinkedIn                |
| `--title <n>`       | Título da vaga                        |
| `--company <n>`     | Empresa                               |
| `--location <n>`    | Localização                           |
| `--work-type <n>`   | Tipo de trabalho (remoto, híbrido, presencial) |
| `--comp <n>`        | Remuneração (string livre)             |
| `--fit <n>`         | Nível de fit (string livre)            |
| `--requirements <j>`| Requisitos (JSON)                     |
| `--status <s>`      | Status (padrão: `saved`)              |
| `--link <n>`        | URL da vaga                           |

Exemplo:

```bash
mercury job save \
  --linkedin-id "123456" \
  --title "Software Engineer" \
  --company "Acme Corp" \
  --work-type "remote" \
  --comp "$150k-$180k" \
  --fit "strong"
```

---

## mercury metric record

Registra um snapshot de métricas do perfil do LinkedIn.

```bash
mercury metric record [flags]
```

Flags:

| Flag                  | Descrição                    |
| --------------------- | ---------------------------- |
| `--search-appearances <n>` | Aparições em busca/semana |
| `--profile-views <n>` | Visualizações do perfil      |
| `--post-impressions <n>`    | Impressões de posts      |
| `--connections <n>`   | Número de conexões           |
| `--score <n>`         | Pontuação geral              |
| `--breakdown <j>`     | Detalhamento (JSON)          |
| `--at <data>`         | Data/hora do snapshot        |

Exemplo:

```bash
mercury metric record \
  --search-appearances 15 \
  --profile-views 42 \
  --connections 580
```

---

## mercury score record

Atalho para registrar apenas a pontuação do perfil LinkedIn.

```bash
mercury score record --value <n> [--signals <json>]
```

| Flag         | Descrição                      |
| ------------ | ------------------------------ |
| `--value <n>`| Pontuação **(obrigatório)**    |
| `--signals <j>`| Sinais detalhados (JSON)     |

Exemplo:

```bash
mercury score record --value 85 --signals '{"keywords": 0.9, "profile": 0.8}'
```

---

## mercury interview add

Adiciona um registro de entrevista.

```bash
mercury interview add --company <n> [flags]
```

| Flag           | Descrição                              |
| -------------- | -------------------------------------- |
| `--company <n>`| Empresa **(obrigatório)**              |
| `--when <d>`   | Data/hora agendada                     |
| `--stage <s>`  | Estágio (ex: `phone`, `technical`)     |
| `--status <s>` | Status (padrão: `scheduled`)           |
| `--note <t>`   | Observações                            |

Exemplo:

```bash
mercury interview add \
  --company "Acme Corp" \
  --stage "technical" \
  --when "2025-07-15T14:00:00" \
  --note "System design + live coding"
```

---

## mercury application

Gerencia candidaturas.

### Subcomandos

#### application add

Registra uma nova candidatura.

```bash
mercury application add [flags]
```

Flags:

| Flag                 | Descrição                           |
| -------------------- | ----------------------------------- |
| `--job-id <n>`      | ID da vaga no banco                 |
| `--resume-path <p>`  | Caminho do currículo enviado        |
| `--cover-path <p>`   | Caminho da carta de apresentação    |
| `--report-path <p>`  | Caminho do relatório de match       |
| `--keyword-score <n>`| Pontuação de keywords               |
| `--status <s>`       | Status (padrão: `draft`)            |
| `--portal <n>`       | Nome do portal ATS                  |
| `--external-url <n>` | URL externa da candidatura          |

Exemplo:

```bash
mercury application add \
  --job-id 3 \
  --status "submitted" \
  --portal "greenhouse" \
  --resume-path ~/resume.pdf
```

#### application update

Atualiza campos de uma candidatura existente.

```bash
mercury application update --id <n> [flags]
```

| Flag                 | Descrição                           |
| -------------------- | ----------------------------------- |
| `--id <n>`          | ID da candidatura **(obrigatório)** |
| `--status <s>`       | Novo status                         |
| `--portal <n>`       | Nome do portal ATS                  |
| `--external-url <n>` | URL externa                         |
| `--fields <j>`       | Campos preenchidos (JSON)           |
| `--unfilled <j>`     | Campos não preenchidos (JSON)       |
| `--applied-at <d>`   | Data de aplicação                   |
| `--resume-path <p>`  | Caminho do currículo                |
| `--cover-path <p>`   | Caminho da carta de apresentação    |
| `--report-path <p>`  | Caminho do relatório                |

Exemplo:

```bash
mercury application update --id 7 --status "interview" --applied-at "2025-07-01"
```

---

## mercury answer

Gerencia respostas reutilizáveis para formulários de candidatura (PII,
eligibilidade, links, EEO, etc).

### Subcomandos

#### answer set

Define ou atualiza uma resposta.

```bash
mercury answer set --key <k> [--value <v>] [--category <c>]
```

| Flag          | Descrição                               |
| ------------- | --------------------------------------- |
| `--key <k>`   | Chave da resposta **(obrigatório)**     |
| `--value <v>` | Valor da resposta                       |
| `--category <c>` | Categoria (padrão: `custom`)         |

Exemplo:

```bash
mercury answer set --key "email" --value "maria@example.com" --category "pii"
mercury answer set --key "github" --value "https://github.com/maria"
```

#### answer list

Lista respostas salvas, opcionalmente filtradas por categoria.

```bash
mercury answer list [--category <c>]
```

| Flag            | Descrição                    |
| --------------- | ---------------------------- |
| `--category <c>`| Filtra por categoria          |

Exemplo:

```bash
mercury answer list                  # lista todas
mercury answer list --category pii   # apenas dados pessoais
```

---

## mercury match

Mapeia labels de formulários ATS para respostas armazenadas. Recebe um array
JSON de labels (ex: `["Email", "Phone", "Full Name"]`) e retorna um plano de
preenchimento com matched/unfilled.

```bash
mercury match --labels '["Email","Phone",...]' [--threshold-pct N]
```

| Flag              | Descrição                                      |
| ----------------- | ---------------------------------------------- |
| `--labels <j>`    | Array JSON de labels do formulário              |
| `--threshold-pct <n>` | Percentual mínimo de confiança (padrão: 60) |

As labels também podem ser passadas via pipe (stdin):

```bash
echo '["Email","Phone"]' | mercury match
```

---

## mercury detect-portal

Detecta qual ATS (Applicant Tracking System) um portal de vagas utiliza e
retorna os seletores de campos conhecidos.

```bash
mercury detect-portal --url <url-da-vaga>
```

| Flag     | Descrição                            |
| -------- | ------------------------------------ |
| `--url <n>`| URL da página de candidatura **(obrigatório)** |

Exemplo:

```bash
mercury detect-portal --url "https://boards.greenhouse.io/acme/jobs/123"
```

Saída:

```json
{
  "portal": "greenhouse",
  "fields": [{ "key": "email", "selectors": ["#email"], "widget": "text" }],
  "notes": []
}
```

---

## mercury outreach

Gerencia o ciclo de vida de ações de outreach (conexão, follow-up,
retirada).

### Subcomandos

#### outreach log

Registra uma nova tentativa de outreach.

```bash
mercury outreach log --username <u> --company-urn <n> [flags]
```

| Flag               | Descrição                              |
| ------------------ | -------------------------------------- |
| `--username <u>`   | Username no LinkedIn **(obrigatório)** |
| `--company-urn <n>`| URN da empresa **(obrigatório)**       |
| `--name <n>`       | Nome da pessoa                         |
| `--company <n>`    | Nome da empresa                        |
| `--channel <c>`    | Canal (`connect_note`, `inmail`, etc.) |
| `--cost <n>`       | Custou crédito? (0 ou 1)               |
| `--message <t>`    | Corpo da mensagem                      |
| `--state <s>`      | Estado inicial                         |
| `--source-skill <s>`| Skill de origem                       |
| `--job-id <n>`     | ID da vaga associada                   |
| `--recruiter-id <n>`| ID do recrutador associado            |

Exemplo:

```bash
mercury outreach log \
  --username "maria-silva" \
  --company-urn "urn:li:company:123" \
  --name "Maria Silva" \
  --company "Acme Corp"
```

#### outreach update

Transiciona o estado de uma tentativa.

```bash
mercury outreach update --id <n> --state <s> [--reason <t>]
```

| Flag        | Descrição                              |
| ----------- | -------------------------------------- |
| `--id <n>`  | ID da tentativa **(obrigatório)**      |
| `--state <s>`| Novo estado **(obrigatório)**          |
| `--reason <t>`| Motivo da transição                   |

#### outreach check

Verifica se um usuário está bloqueado para uma empresa (blacklist). Exit
code 0 = liberado, 1 = bloqueado.

```bash
mercury outreach check --username <u> --company-urn <n>
```

Exemplo:

```bash
mercury outreach check --username "maria-silva" --company-urn "urn:li:company:123"
```

#### outreach due

Lista ações pendentes (follow-up, withdraw, close) para uma data.

```bash
mercury outreach due [--on YYYY-MM-DD]
```

| Flag         | Descrição                       |
| ------------ | ------------------------------- |
| `--on <data>`| Data para verificar (padrão: hoje) |

Exemplo:

```bash
mercury outreach due --on 2025-07-15
```

#### outreach list

Lista tentativas de outreach com filtros opcionais.

```bash
mercury outreach list [--company-urn <n>] [--state <s>]
```

| Flag              | Descrição                |
| ----------------- | ------------------------ |
| `--company-urn <n>`| Filtrar por empresa      |
| `--state <s>`     | Filtrar por estado        |

#### outreach blocked

Lista pessoas bloqueadas para uma empresa.

```bash
mercury outreach blocked --company-urn <n>
```

#### outreach budget

Exibe ou define o orçamento de InMail.

```bash
mercury outreach budget [set: --plan <p> --remaining <n> ...]
```

Flags (para definir):

| Flag                | Descrição                        |
| ------------------- | -------------------------------- |
| `--plan <p>`        | Nome do plano                    |
| `--remaining <n>`   | Créditos restantes                |
| `--allotment <n>`   | Franquia mensal de InMail         |
| `--rollover-cap <n>`| Teto de rollover                  |
| `--reserve-floor <n>`| Reserva mínima                   |
| `--reset-day <n>`   | Dia do ciclo de reset             |

Sem flags, exibe o orçamento atual.

#### outreach withdraw

Retira um convite pendente (via navegador) e marca como `invite_ignored`,
além de bloquear a empresa para aquela pessoa.

```bash
mercury outreach withdraw --id <n>
```

---

## mercury activity log

Registra uma atividade no log de auditoria (usado internamente por skills).

```bash
mercury activity log [--kind <k>] [--skill <s>] [--summary <t>] [--payload <j>]
```

| Flag          | Descrição                    |
| ------------- | ---------------------------- |
| `--kind <k>`  | Tipo de atividade            |
| `--skill <s>` | Nome da skill de origem      |
| `--summary <t>`| Resumo textual               |
| `--payload <j>`| Dados adicionais (JSON)      |

Exemplo:

```bash
mercury activity log \
  --kind "recruiter_sync" \
  --skill "recruiter-sync" \
  --summary "Sync: 3 accepted"
```

---

## mercury export

Compila um arquivo Typst (`.typ`) para PDF. Requer o binário `typst`
instalado no PATH.

```bash
mercury export --typ <arquivo.typ> --out <arquivo.pdf>
```

| Flag          | Descrição                            |
| ------------- | ------------------------------------ |
| `--typ <f>`   | Arquivo Typst de entrada **(obrigatório)** |
| `--out <f>`   | Arquivo PDF de saída **(obrigatório)**     |

Exemplo:

```bash
mercury export --typ ~/resume.typ --out ~/resume.pdf
```
