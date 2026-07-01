# Mercury — Visão Geral

Mercury é um **companheiro de busca de emprego com IA**. Ele combina:

- **Skills para agentes de IA** (opencode, Claude Code, Cursor) que orquestram o LinkedIn via MCP
- **CLI + Dashboard local** em binário único (Bun + TypeScript + Svelte)

## Problema que resolve

Buscar emprego no LinkedIn é repetitivo: otimizar perfil, encontrar vagas, personalizar currículo, se candidatar, fazer follow-up com recrutadores. Mercury automatiza esse pipeline mantendo você no controle — nada é enviado sem sua aprovação.

## Ecossistema

```
                      ┌──────────────────────────────────────┐
                      │           SKILLS (SKILL.md)          │
                      │  profile-optimizer  job-scout        │
                      │  experience-bank    resume-tailor    │
                      │  recruiter-outreach portal-filler   │
                      │  outreach-tracker                     │
                      └──────────┬───────────────────────────┘
                                 │ agente executa comandos
                                 ▼
              ┌──────────────────────────────────────┐
              │        mercury CLI (binário)          │
              │  ┌────────┐  ┌──────┐  ┌───────────┐ │
              │  │  CLI   │  │  DB  │  │ Dashboard │ │
              │  │comandos│  │SQLite│  │ Svelte 5  │ │
              │  └────────┘  └──────┘  └───────────┘ │
              └──────────────────────────────────────┘
                         │                │
                         ▼                ▼
                  ┌────────────┐   ┌──────────┐
                  │ SQLite DB  │   │ Browser  │
                  │~/.mercury/ │   │Dashboard │
                  └────────────┘   └──────────┘
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Bun |
| Banco | SQLite (WAL) |
| Frontend | Svelte 5 + Tailwind v4 + Bits UI + Lucide |
| Build | Vite + Bun compile |
| Protocolos | ACP (JSON-RPC 2.0) + MCP |
| Testes | Bun Test |
| Licença | The Unlicense (Domínio Público) |

## Pipeline Completa

```
experience-bank → profile-optimizer → job-scout → resume-tailor → recruiter-outreach → portal-filler
```

Cada skill é um arquivo `SKILL.md` que o agente carrega para executar uma etapa específica. O resultado persiste no SQLite local e aparece no dashboard.
