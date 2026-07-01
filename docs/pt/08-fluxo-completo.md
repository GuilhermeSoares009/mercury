# Fluxo Completo

Este documento descreve o pipeline completo do Mercury, do início ao fim. Cada
seção corresponde a uma etapa que o usuário executa (algumas uma vez, outras
periodicamente, outras por vaga).

```
experience-bank ──→ profile-optimizer ──→ job-scout ──→ resume-tailor ──→ recruiter-outreach ──→ outreach-tracker
    (trimestral)        (semanal)        (diário)        (por vaga)         (por vaga)            (diário)
                                                                                │
                                                                                └──→ portal-filler
                                                                                     (por candidatura)
```

---

## 1. Experience Bank

**Frequência**: trimestral ou após marcos importantes (promoção, projeto grande,
nova skill).

**Skill**: `experience-bank`

**O que acontece**: o agente entrevista o usuário no estilo STAR (Situação,
Tarefa, Ação, Resultado) para extrair conquistas profissionais. Ele carrega o
banco existente primeiro, a base resume e o perfil do LinkedIn, e só pergunta
sobre o que ainda não está registrado.

**Comandos CLI executados**:

```bash
# A skill chama internamente:
mercury activity log --skill experience-bank --summary "N entries added"

# O usuário pode ver o banco:
ls ~/.mercury/experience/
```

**Dados persistidos**:

- `~/.mercury/experience/{slug}.md` — cada entrada com tags (skills, tech,
  domínio, tipo de cargo, métricas)
- `~/.mercury/experience/index.md` — sumário para scan rápido
- `activity_log` no SQLite

**O que o usuário faz**:

- Responde às perguntas do agente (não requer digitação — é uma entrevista
  conversacional)
- Revisa as entradas geradas para garantir acurácia
- Roda novamente a cada trimestre ou após entregas significativas

**Propósito**: criar um pool reutilizável de realizações que o resume-tailor
pode consultar mesmo que não estejam no currículo base.

---

## 2. Profile Optimizer

**Frequência**: semanal ou após alterações no perfil.

**Skill**: `profile-optimizer`

**O que acontece**: o agente audita o perfil do LinkedIn contra sinais de busca
de recrutadores e corrige gaps.

**Pipeline da skill**:

1. **Leitura**: `get_own_profile` via LinkedIn MCP — puxa perfil completo,
   métricas (aparições em busca, visualizações, impressões)
2. **Análise**: identifica pitfalls ranqueados por impacto em busca de
   recrutadores:
   - Open to Work desativado ou configurado como "apenas recrutadores"
   - Headline genérica ou sem palavras-chave
   - Localização ausente ou incorreta
   - Top skills desatualizadas ou faltando
   - Idiomas não listados
   - About section fraca ou vazia
   - Projetos não adicionados
   - Descrições de experiência sem métricas
   - Cards de mobilidade interna que sinalizam "não estou procurando"
3. **Edição via Chrome MCP**: para cada gap, o agente navega no LinkedIn e
   edita via browser automation (pipeline tool: navigate → snapshot → fill)
4. **Registro**: salva métricas e score

**Comandos CLI executados**:

```bash
mercury metric record --breakdown '{"searchAppearances": 42, "profileViews": 156, "impressions": 890}'
```

**Atenção**: o toggle "Notify network" deve estar sempre DESLIGADO antes de
salvar edições no perfil.

**Dados persistidos**:

- `profile_metrics` — série histórica de métricas
- `profile_snapshots` — instantâneos do perfil ao longo do tempo
- `activity_log` — log da execução

**O que o usuário faz**:

- Apenas acompanha — o agente executa as edições automaticamente
- Verifica se o "Notify network" ficou desligado
- Roda semanalmente para acompanhar tendências

---

## 3. Job Scout

**Frequência**: diário, sob demanda.

**Skill**: `job-scout`

**O que acontece**: o agente busca vagas no LinkedIn com base nos critérios
do usuário e produz uma shortlist priorizada com análise de fit.

**Pipeline**:

1. **Busca**: `search_jobs(keywords, location, work_type)` via LinkedIn MCP
2. **Detalhes**: `get_job_details(jobId)` para cada vaga promissora
3. **Análise de fit**: classifica como Strong / Good / Stretch baseado no
   perfil do usuário e no banco de experiência
4. **Flags**: identifica vagas com:
   - Escopo diversity-scoped
   - Staffing aggregators (consultorias que terceirizam)
   - ATS externo com alta fricção (Workday, Taleo, iCIMS)
5. **Shortlist**: apresenta lista priorizada para o usuário escolher

**Comandos CLI executados**:

```bash
mercury job save --title "Software Engineer" --company "Airbnb" \
  --url "https://linkedin.com/jobs/view/..." \
  --fit strong --location "São Paulo" --job-id "4393940374"
```

**Dados persistidos**:

- `jobs` — cada vaga com fit rating, empresa, local, URL, job ID
- `activity_log` — log da busca

**O que o usuário faz**:

- Fornece os critérios de busca (query, local, tipo de trabalho)
- Revisa a shortlist e seleciona quais vagas vai perseguir
- Pode passar os IDs das vagas selecionadas para o resume-tailor

---

## 4. Resume Tailor

**Frequência**: para cada vaga ou lote de vagas.

**Skill**: `resume-tailor`

**O que acontece**: o agente personaliza o currículo base + banco de
experiência para cada vaga específica, produzindo versão tailarda, cover
letter e análise de gaps.

**Pipeline**:

1. **Input**: base resume (Typst/MD/PDF/txt) + banco de experiência + vagas
   selecionadas
2. **Extração**: puxa entradas relevantes do banco de experiência mesmo que
   não estejam no currículo base
3. **Alinhamento ATS**: ajusta keywords para o ATS da vaga alvo
4. **Geração**:
   - Currículo tailardo em Typst (`~/.mercury/tailored/{company}-{jobId}.typ`)
   - Cover letter (`~/.mercury/cover-letters/{company}-{jobId}.md`)
   - Gap analysis (`~/.mercury/reports/{company}-{jobId}.md`)
5. **Batch**: pode processar N vagas em uma única execução

**Comandos CLI executados**:

```bash
mercury application add --company "Airbnb" --job-id "4393940374" \
  --role "Software Engineer" --status draft
```

**Dados persistidos**:

- `~/.mercury/tailored/` — currículos personalizados
- `~/.mercury/cover-letters/` — cartas de apresentação
- `~/.mercury/reports/` — relatórios de gap/match
- `applications` — registro da candidatura no SQLite
- `activity_log`

**O que o usuário faz**:

- Fornece os IDs das vagas (ou passa do job-scout)
- Revisa os currículos gerados e faz ajustes manuais se necessário
- Exporta para PDF com `mercury export --typ resume.typ --out resume.pdf`

---

## 5. Recruiter Outreach

**Frequência**: para cada lote de empresas-alvo.

**Skill**: `recruiter-outreach`

**O que acontece**: o agente encontra recrutadores técnicos nas empresas-alvo
e envia convites de conexão personalizados.

**Pipeline**:

1. **Resolve URN**: para cada empresa, descobre o URN ID do LinkedIn
   (via `get_company_profile` + cache em `companies`)
2. **Busca pessoas**: `search_people(keywords="technical recruiter",
   current_company={urn}, location={local})` via LinkedIn MCP
3. **Prioriza**: ordena por:
   - Mesma cidade > 2º grau > conexões mútuas > título relevante
4. **Convite**: envia `connect_with_person` com nota curta e específica
   (< 300 caracteres)
5. **Registra**: salva cada tentativa no banco

**Comandos CLI executados**:

```bash
mercury recruiter add --name "Jane Smith" --company "Airbnb" \
  --urn "airbnb-123" --linkedin "https://linkedin.com/in/janesmith" \
  --title "Technical Recruiter" --score 85 --status pending

# Quando o recrutador aceita, o dashboard sync detecta:
mercury recruiter update --id 1 --status accepted
```

**Limitações**:

- Não enviar mais que 10-15 convites por sessão (LinkedIn rate limits)
- URN é obrigatório — nomes de empresa comuns são ignorados
- Nota deve ser < 300 caracteres
- Convites retirados não podem ser reenviados por ~3 semanas

**Dados persistidos**:

- `recruiters` — pipeline completo (pending → accepted → replied → interviewing
  → closed)
- `outreach_attempts` — histórico de tentativas
- `companies` — cache de URN IDs
- `activity_log`

**O que o usuário faz**:

- Fornece empresas-alvo
- Confirma cada convite antes do envio
- Acompanha os aceites no dashboard (kanban Recruiters)
- Pode rodar **Sync** para detectar aceites automaticamente

---

## 6. Portal Filler

**Frequência**: para cada candidatura.

**Skill**: `portal-filler`

**O que acontece**: o agente preenche automaticamente formulários de ATS
(Greenhouse, Lever, Ashby) com os dados do usuário, mas **nunca clica Submit**.

**Pipeline**:

1. **Detecta portal**: `mercury detect-portal --url "{jobUrl}"` — identifica
   Greenhouse, Lever, Ashby ou genérico
2. **Preenche respostas**: o agente usa o banco de respostas do usuário
   (`mercury answer set`) para preencher campos de contato, elegibilidade,
   links
3. **Match de labels**: `mercury match --labels '["Email *", "LinkedIn Profile"]'`
   — mapeia labels do formulário para respostas conhecidas
4. **Upload de currículo**: `mercury export --typ resume.typ --out resume.pdf`
   — compila o currículo tailardo em PDF e anexa
5. **Preenchimento via Chrome MCP**: navega até o formulário, preenche cada
   campo, anexa o PDF
6. **Pausa**: o agente para antes do botão Submit e avisa o usuário

**Comandos CLI executados**:

```bash
mercury answer set --key phone --value "+1 555 ..." --category contact
mercury answer set --key linkedin --value "https://linkedin.com/in/..." --category links
mercury answer list
mercury detect-portal --url "https://job-boards.greenhouse.io/acme/jobs/123"
mercury match --labels '["Email *","Phone","LinkedIn Profile"]'
mercury export --typ resume.typ --out resume.pdf
mercury application update --id 1 --status filled --portal greenhouse
```

**EEO**: o agente **nunca** preenche campos demográficos (raça, gênero,
deficiência, veterano). Esses campos são pulados explicitamente.

**Dados persistidos**:

- `applicant_answers` — respostas reutilizáveis (contato, links, elegibilidade)
- `applications` — status da candidatura (draft → filled → submitted)
- `activity_log`

**O que o usuário faz**:

- Cadastra respostas padrão no dashboard (Answers tab) ou via CLI
- **Revisa o formulário preenchido** no navegador
- **Clica Submit manualmente** — o Mercury nunca envia
- Preenche campos que o agente não conseguiu mapear
- Atualiza o status da candidatura após o envio

**Limitações atuais**:

- Workday, Taleo e iCIMS (multi-step, iframe-heavy, account-gated) não são
  suportados
- CAPTCHA e SSO (Google Login, etc.) são deixados para o humano
- Auto-submit (fully autonomous) não é suportado — o Mercury sempre pausa

---

## 7. Outreach Tracker

**Frequência**: diário (agendado ou manual).

**Skill**: `outreach-tracker`

**O que acontece**: o agente revisa o pipeline de outreach, detecta replies,
envia nudges, retira convites ignorados e fecha ciclos mortos.

**Pipeline**:

1. **Verifica o que venceu hoje**:

```bash
mercury outreach due
```

Retorna ações classificadas:

- `[WITHDRAW]` — convite não aceito após ~7 dias
- `[FOLLOWUP]` — aceitou mas não respondeu após ~4 dias
- `[CLOSE]` — follow-up sem resposta após ~7 dias

2. **Detecta replies**: para cada ação, verifica a conversa no LinkedIn:

```
get_conversation(linkedin_username = "{username}")
```

Se houver reply, marca como `engaged` e interrompe automação:

```bash
mercury outreach update --id {attemptId} --state engaged --reason "replied: {gist}"
```

(Isso também estorna crédito InMail se aplicável.)

3. **Executa ações (com consentimento)**:

- **FOLLOWUP**: drafteria nudge curto → mostra ao usuário → se aprovado,
  envia `send_message` e registra
- **WITHDRAW**: navega Chrome até "invitation-manager/sent/" → clica Withdraw
  → confirma → registra bloqueio de 9 meses
- **CLOSE**: apenas registra como unresponsive (bloqueio de 9 meses)

4. **Sumariza**: tabela do que foi feito e do que precisa de aprovação.

**Comandos CLI executados**:

```bash
mercury outreach due            # lista ações pendentes
mercury outreach budget         # saldo de InMail credits
mercury outreach update --id X --state engaged --reason "..."
mercury outreach update --id X --state followup --reason "gentle nudge sent"
mercury outreach update --id X --state invite_ignored --reason "invite withdrawn after 7d"
mercury outreach update --id X --state unresponsive --reason "no reply after follow-up"
mercury outreach blocked --add --person "Jane Smith" --company "Airbnb"
```

**Dados persistidos**:

- `outreach_attempts` — estado de cada tentativa
- `recruiters` — atualização do pipeline
- `activity_log`

**O que o usuário faz**:

- **Aprova cada ação** antes do envio (nunca automático)
- Verifica replies que o agente pode ter perdido
- Mantém a rotina diária (ou agenda no cron)

---

## Resumo do Ciclo de Vida

| Etapa | Frequência | Input do Usuário | Output |
|-------|-----------|------------------|--------|
| **Experience Bank** | Trimestral | Respostas à entrevista | Banco de conquistas |
| **Profile Optimizer** | Semanal | Nenhum | Perfil auditado + métricas |
| **Job Scout** | Diário | Critérios de busca | Shortlist de vagas |
| **Resume Tailor** | Por vaga | IDs das vagas | Currículo + cover + gap report |
| **Recruiter Outreach** | Por lote | Empresas-alvo | Pipeline de recrutadores |
| **Portal Filler** | Por candidatura | Respostas padrão | Formulário preenchido (pausado) |
| **Outreach Tracker** | Diário | Aprovação de ações | Follow-ups gerenciados |

## Visualização no Dashboard

| Aba | Etapa |
|-----|-------|
| Overview | Todas |
| Profile | Profile Optimizer (métricas históricas) |
| Search | Job Scout (busca direta via MCP) |
| Launch | **Todas as skills** (execução via ACP) |
| Recruiters | Recruiter Outreach + Sync |
| Outreach | Outreach Tracker |
| Jobs | Job Scout |
| Applications | Resume Tailor + Portal Filler |
| Answers | Portal Filler (respostas salvas) |
| Interviews | Todas (manual) |
| Activity | Todas |
