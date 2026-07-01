# Skills

**Visão geral:** cada skill do Mercury é um arquivo `SKILL.md` que o agente carrega
para saber como executar uma tarefa. As skills instruem o agente a rodar comandos
`mercury ...` (CLI) e usar ferramentas MCP (LinkedIn MCP, Chrome MCP).

O ecossistema completo:

```
profile-optimizer ──alimenta──▶ job-scout ──alimenta──▶ resume-tailor ──alimenta──▶ portal-filler
                                    │                                                  │
                                    ▼                                                  ▼
                            recruiter-outreach ────▶ outreach-tracker ◀────────────────┘
                                    ▲                        │
                                    └──── experience-bank ───┘
                                         (alimenta resume-tailor também)
```

---

## profile-optimizer

**O que faz:** audita e otimiza o perfil do LinkedIn para maximizar a
descoberta por recrutadores. Corrige configurações de Open to Work, headline,
localização, skills, idiomas, projetos, seção Sobre e descrições de experiência.

**Pré-requisitos:** LinkedIn MCP (para `get_person_profile` + analytics),
Chrome MCP (para navegar e editar).

**Comandos CLI usados:**
```
mercury metric record --search-appearances N --profile-views N --score 0-100 --breakdown '{...}'
mercury activity log --skill profile-optimizer --summary "..."
```

**Fluxo resumido:**

1. **Puxa perfil** via `get_person_profile` e audita cada sinal contra o que
   recrutadores filtram (search appearances, connections, Open to Work,
   location, headline, top skills, languages, projects, about, experience).
2. **Apresenta tabela de pitfalls** ranqueada por impacto — ex: "headline sem
   palavras-chave técnicas", "localidade errada", "Top Skills só com soft
   skills", "seção Projects vazia".
3. **Otimiza via Chrome MCP** na ordem de impacto: Open to Work → Location →
   Headline → Top Skills → Languages → About → Projects → Experience Descriptions
   → Remove Internal Mobility Card.
4. **Verifica** com screenshot do estado final.
5. **Persiste métricas** no Mercury com `mercury metric record --breakdown` para
   o dashboard poder chartear a evolução ao longo do tempo.

**Exemplo de uso:**
```
"Otimiza meu perfil do LinkedIn — quero mais recrutadores me achando"
```

**Links:** alimenta o dashboard com métricas. Complementar com `job-scout` para
buscar vagas depois do perfil otimizado.

---

## job-scout

**O que faz:** busca e avalia vagas no LinkedIn, produzindo uma shortlist
priorizada com análise de fit, job IDs e links diretos.

**Duas entradas possíveis:**

1. **URL salva do LinkedIn Jobs** (ex: `f_C` com dezenas de empresas, `geoId`,
   `f_TPR` de recência) — o agente honra os parâmetros da URL em vez de fazer
   busca solta. Faz auto-widening da janela de tempo se o resultado for
   muito pequeno.
2. **Critérios livres** (empresas alvo, localização, work type, stack,
   compensação) — busca sequencial com keywords.

**Pré-requisitos:** LinkedIn MCP (`search_jobs`, `get_job_details`,
`get_company_profile`), Chrome MCP (para URL colada).

**Comandos CLI:**
```
mercury job save --linkedin-id {id} --title "{Role}" --company "{Company}" ...
mercury activity log --kind scout --skill job-scout --summary "..."
mercury outreach blocked --company-urn "{URN}"
```

**Fluxo resumido:**

1. Estabelece critérios (empresas, local, work type, nível, stack,
   compensação).
2. Busca vagas (uma por vez — o LinkedIn MCP é single-browser e concorrência
   quebra).
3. Pega detalhes das mais promissoras com `get_job_details`.
4. Avalia fit: **Strong** (tudo alinha), **Good** (quase tudo), **Stretch**
   (acima do nível ou requisito faltando).
5. Apresenta duas tabelas (presenciais/locais e remotas/USD).
6. Persiste vagas no Mercury com `mercury job save`.
7. Checa contacts bloqueados na empresa alvo com `mercury outreach blocked`.
8. Sinaliza caveats (vagas afirmativas, agregadoras, YoE irreal).

**Exemplo de uso:**
```
"Busca vagas de backend engineer em São Paulo, remoto, nas big techs"
"Vou colar uma URL do LinkedIn Jobs que salvei pra DoorDash + Airbnb"
```

**Links:** alimenta `resume-tailor` (job IDs viram input do tailoring) e
`recruiter-outreach` (empresas com vagas abertas viram alvo de conexão).

---

## experience-bank

**O que faz:** entrevista o usuário ("grill me") periodicamente para capturar
conquistas, projetos e experiências recentes, e as armazena em
`.mercury/experience/` como arquivos `.md` com frontmatter estruturado.

**Quando usar:** a cada trimestre/semestre, NÃO por aplicação individual.

**Formato dos arquivos:**
```yaml
---
title: Reduziu p99 da checkout em 40%
slug: checkout-latency-40pct
skills: [performance, distributed-systems, observability]
tech: [java, aws, sqs, dynamodb]
domain: [payments, e-commerce]
role_type: [backend, platform]
metrics: ["p99 -40%", "2M events/day"]
scope: "time de 6, 2M pedidos/dia"
dates: "2024-Q3"
on_resume: false
source: interview
---
```

**Comandos CLI:**
```
mercury activity log --skill experience-bank --summary "..."
```

**Fluxo resumido:**

1. Carrega o banco existente + base resume + perfil do LinkedIn para saber
   o que já está coberto.
2. **Entrevista o usuário** com perguntas STAR (Situation/Task → Action →
   Result) focadas no que ainda não foi capturado. Uma pergunta por vez,
   insistindo em métricas quantificáveis.
3. Aceita **freeform dumps** — se o usuário colar uma história raw, o
   agente estrutura sem reentrevistar.
4. Escreve/atualiza cada entrada e regenera o `index.md`.
5. Loga no Mercury.

**Regra fundamental:** NUNCA inventar conquistas, métricas ou escopo. Se o
usuário não consegue quantificar, armazena qualitativamente.

**Exemplo de uso:**
```
"Grill me — entreguei umas coisas esse trimestre"
```

**Links:** `resume-tailor` lê o banco como *read-only* para puxar conquistas
que não cabem no currículo base. `profile-optimizer`, `job-scout` e
`recruiter-outreach` também se beneficiam indiretamente (via currículo mais
forte).

---

## resume-tailor

**O que faz:** personaliza currículo e cover letter para cada vaga a partir
do currículo base (`resume.typ`) + banco de experiências + perfil LinkedIn.

**Batch:** pode processar múltiplas vagas de uma vez.

**Comandos CLI:**
```
mercury application add --job-id {id} --resume-path ... --cover-path ... --report-path ...
mercury activity log --skill resume-tailor --summary "..."
```

**Artefatos gerados em `.mercury/`:**
```
tailored/{company}-{jobId}.typ       # currículo personalizado
cover-letters/{company}-{jobId}.md   # cover letter
reports/{company}-{jobId}.md         # relatório gap/match
logs/{ISO-timestamp}.md              # log da execução
```

**Fluxo resumido:**

1. Lê inputs: base resume, banco de experiências (`experience-bank`), perfil
   LinkedIn, detalhes da(s) vaga(s).
2. Para cada vaga, extrai requisitos (skills obrigatórias, diferenciais, YoE,
   termos ATS).
3. Cruza candidato vs requisito: **✅ Strong match**, **🟡 Transferable**,
   **❌ Gap**.
4. **Tailor:** reordena bullets, puxa entradas do banco, reescreve descrições
   ecoando a linguagem da vaga, ajusta summary, injeta keywords ATS.
5. Gera cover letter (~250-400 palavras) com hook específico da empresa,
   mapeamento das top experiências, e fechamento concreto.
6. Salva tudo e persiste no Mercury.
7. Apresenta tabela resumo com keyword score por vaga.

**Regras fundamentais:**
- NUNCA adicionar skills que o candidato não tem
- NUNCA fabricar experiência, projetos ou inflar títulos
- Gaps reais devem ser sinalizados honestamente

**Exemplo de uso:**
```
"Tailor my resume for these roles: 4393940374, 3969556398, 4380982336"
```

**Links:** recebe job IDs de `job-scout`. Lê o banco de `experience-bank`.
Alimenta `portal-filler` (os artefatos gerados são usados no preenchimento
do formulário do ATS). Conteúdo de cover letter pode ser adaptado como nota
de conexão em `recruiter-outreach`.

---

## recruiter-outreach

**O que faz:** encontra recrutadores técnicos nas empresas alvo e envia
convites personalizados de conexão no LinkedIn.

**Pré-requisitos:** LinkedIn MCP (`get_company_profile`, `search_people`,
`connect_with_person`), Mercury CLI.

**Comandos CLI:**
```
mercury recruiter add --name ... --company ... --username ...
mercury outreach log --username ... --company-urn ... --channel connect_note
mercury outreach check --username ... --company-urn ...
mercury outreach budget
mercury recruiter sync [--apply]
```

**Fluxo resumido:**

1. **Resolve URN IDs** das empresas com `get_company_profile` (nomes de
   empresa são ignorados silenciosamente pelo filtro do LinkedIn).
2. **Busca recrutadores** com `search_people(current_company={URN}, keywords=...)`.
3. **Prioriza:** 2º grau > 3º grau, mesmo país > outros, mutual connections,
   título técnico > genérico.
4. **Blacklist check** com `mercury outreach check` — pula quem já foi
   contactado para aquela empresa.
5. **Escolhe canal:** 1º grau → mensagem grátis, 2º grau → connect note
   (usa cota semanal), 3º grau com Open Profile → InMail grátis, 3º grau
   sem via morna → InMail pago (respeitando reserve floor).
6. **Draft personalizado** (~300 chars): lead with intent + why-this-company,
   sem repetir info que o LinkedIn já mostra.
7. **Envia** com `connect_with_person`. Máx 10–15 por sessão.
8. **Persiste** no Mercury: `recruiter add` + `outreach log`.
9. **Sync periódico:** `recruiter sync` detecta aceites (pending → accepted).

**Exemplo de uso:**
```
"Encontra recrutadores na Airbnb e DoorDash que contratam engenheiros no Brasil"
```

**Links:** as empresas vêm de `job-scout`. O `outreach-tracker` gerencia
o follow-up dos convites enviados.

---

## portal-filler

**O que faz:** preenche formulários de candidatura em portais ATS (Greenhouse,
Lever, Ashby, genérico) com Chrome MCP usando os artefatos do `resume-tailor`.

**IMPORTANTE:** NUNCA clica em Submit — para antes e entrega para o humano
revisar e confirmar.

**Pré-requisitos:** Chrome MCP, Mercury CLI.

**Comandos CLI:**
```
mercury detect-portal --url "{link}"
mercury answer list | set
mercury match --labels '["Email *","Phone",...]'
mercury export --typ ".mercury/tailored/..." --out "...pdf"
mercury application add|update
```

**Fluxo resumido:**

1. Carrega inputs: oportunidade (job id, link), artefatos (resume .typ,
   cover letter), answer store (`mercury answer list`).
2. Compila resume .typ → PDF com `mercury export`.
3. Detecta o portal com `mercury detect-portal` — retorna seletores
   estáveis + widget types + quirks.
4. Preenche campos conhecidos do adapter (via seletores estáveis).
5. **Matcher determinístico** com `mercury match` para os campos restantes:
   exato → sinônimo → fuzzy. Campos EEO são sempre ignorados (human-only).
6. Widget mechanics: sabe lidar com `text`, `tel`, `native-select`,
   `react-select`, `listbox`, `file` (upload S3), `reCAPTCHA`.
7. **Para antes do submit** — tira screenshot, apresenta sumário dos
   campos preenchidos e deixados para revisão.
8. Persiste no Mercury.

**Cobertura ATS:**

| Portal | Seletores | Resume | Dropdowns |
|---|---|---|---|
| `greenhouse` | ids (`#first_name`) | upload S3 | react-select |
| `lever` | atributos `name` | file input | `<select>` nativo |
| `ashby` | ids `#_systemfield_*` | file input | button/listbox |
| `generic` | — (usa matcher genérico) | — | — |

**Exemplo de uso:**
```
"Abre a candidatura da vaga Airbnb-123 e preenche o formulário pra eu revisar"
```

**Links:** recebe job IDs + artifacts de `resume-tailor`. A vaga veio de
`job-scout`.

---

## outreach-tracker

**O que faz:** gerencia o ciclo de follow-up dos convites enviados pelo
`recruiter-outreach`. Encontra o que venceu hoje, detecta replies, e propõe
ações — sempre com aprovação humana explícita.

**Nunca auto-envia:** o princípio é *draft + ask*. O agente prepara a
mensagem, mostra ao usuário, e só age mediante aprovação.

**Três ações possíveis:**

| Ação | Quando | O que faz |
|---|---|---|
| **FOLLOWUP** | Convite aceito mas sem reply (~4d) | Manda nudge amigável |
| **WITHDRAW** | Convite ignorado (~7d) | Retira o convite (via Chrome MCP) |
| **CLOSE** | Follow-up sem resposta (~7d) | Fecha o contato, bloqueia empresa |

**Pré-requisitos:** Mercury CLI, LinkedIn MCP, Chrome MCP (para withdraw).

**Comandos CLI:**
```
mercury outreach due          # mostra o que precisa de ação hoje
mercury outreach update --id {id} --state engaged --reason "..."
mercury outreach budget       # checa créditos InMail restantes
mercury outreach blocked --company-urn "{URN}"
```

**Fluxo resumido:**

1. `mercury outreach due` — lista o que venceu com ação e motivo.
2. **Detecta replies primeiro** com `get_conversation` — se alguém já
   respondeu, marca como `engaged` (e estorna crédito InMail se aplicável).
3. Para cada item restante, mostra o draft ao usuário:
   - **FOLLOWUP:** nudge curto (~400 chars), sem guilt-trip.
   - **WITHDRAW:** navega até `linkedin.com/mynetwork/invitation-manager/sent/`,
     clica "Withdraw" via Chrome MCP, confirma diálogo.
   - **CLOSE:** só marca — sem envio.
4. Após aprovação, persiste a transição.
5. Apresenta tabela resumo + orçamento InMail atualizado.

**Regras:**
- Reply detection é *best-effort* — se as ferramentas de inbox não
  confirmarem, pergunta ao usuário.
- Bloqueio é escopo **(pessoa, empresa URN)** com cooldown de 9 meses
  (padrão) — não queima permanentemente o contato.
- Seguro para rodar diariamente: com consent gating, o pior caso é uma
  lista de drafts aguardando aprovação.

**Exemplo de uso:**
```
"Roda o outreach tracker pra ver o que precisa de follow-up hoje"
```

**Links:** gerencia os contatos criados por `recruiter-outreach`. Empresas
com blocked contacts são respeitadas por `job-scout` (que consulta
`mercury outreach blocked` ao scoutar).
