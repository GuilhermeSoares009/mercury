# Mercury

> Your AI-powered job search companion — LinkedIn profile optimization, job scouting, recruiter outreach, and resume tailoring in one toolkit.

Mercury is a collection of **AI agent skills** that automate your LinkedIn job search end-to-end. It works with any AI coding assistant that supports skill/instruction files (OpenCode, Cursor, Claude Code, Cline, Aider, etc.) paired with a [LinkedIn MCP Server](https://github.com/stickerdaniel/linkedin-mcp-server) and browser automation.

## The Pipeline

```
profile-optimizer → job-scout → resume-tailor → recruiter-outreach
     fix your         find the      tailor your      reach the
     profile          roles          resume          recruiters
```

## Skills

| Skill | What It Does |
|---|---|
| **profile-optimizer** | Audits your LinkedIn profile against recruiter-search signals and fixes gaps (Open to Work, headline, location, skills, languages, projects, About, experience) |
| **job-scout** | Searches LinkedIn Jobs by company/location/work-type, pulls full details, and presents a prioritized shortlist with fit assessment |
| **resume-tailor** | Takes your base resume + scouted roles and produces role-tailored versions with gap analysis, ATS keyword alignment, and cover letters |
| **recruiter-outreach** | Finds technical recruiters at target companies, prioritizes by proximity/mutuals, and sends tailored connection requests |

See [`diagram.html`](diagram.html) for a visual of how the skills work together.

![How Mercury skills work](diagram.png)

## The Dashboard

Mercury ships a local web dashboard — a central hub for your whole job search.
Run one command and it opens in your browser:

```bash
mercury dashboard
```

What it gives you:

- **Overview** — profile score, recruiters contacted/accepted/replied, interviews, jobs
- **Profile** — recruiter-search metrics charted over time (views, search appearances, connections)
- **Search** — instant LinkedIn job/people search (hybrid: raw results via the LinkedIn MCP)
- **Launch** — run any Mercury skill through your agent (**opencode** or **Claude Code**) over [ACP](https://agentclientprotocol.com), with a live agent activity stream
- **Recruiters** — kanban pipeline (pending → accepted → replied → interviewing → closed)
- **Jobs / Applications / Interviews / Activity** — everything tracked

The dashboard is a single Bun-compiled binary with the UI embedded. It binds to
`127.0.0.1` on a random port with a URL token, and stores everything in a local
SQLite database at `~/.mercury/mercury.db`.

The `mercury` CLI is both the dashboard launcher **and** the write API the skills
call (`mercury recruiter add`, `mercury job save`, …) — one schema, one source of truth.

### Install

```bash
./install.sh                      # builds the binary, links it to ~/.local/bin
mercury init                      # scaffold ~/.mercury/ + database
mercury import-journey JOURNEY.md # optional: migrate an existing journal
mercury dashboard                 # open the hub
```

Requires [Bun](https://bun.sh). For the **Launch** tab you also need an ACP-capable
agent on PATH — `opencode` (native `opencode acp`) or `claude` (Claude Code, via
`@zed-industries/claude-code-acp`).

## The `.mercury/` Directory

Mercury stores all job search artifacts in a `.mercury/` folder in your workspace:

```
.mercury/
├── base/
│   └── resume.typ              # Your canonical base resume
├── tailored/
│   ├── airbnb-4393940374.typ   # Tailored per role (company-jobId)
│   ├── doordash-3969556398.typ
│   └── uber-4380982336.typ
├── cover-letters/
│   ├── airbnb-4393940374.md    # Full cover letter per role
│   └── ...
├── reports/
│   ├── airbnb-4393940374.md    # Gap/match analysis per role
│   └── ...
├── logs/
│   ├── 2026-06-26T14:30:00.md  # Run history, diffs, keyword scores
│   └── ...
└── config.toml                 # Preferences (base resume path, format, targets)
```

Everything is tracked — you get full traceability of every tailoring run, outreach wave, and profile change.

## Requirements

### MCP Servers

1. **[LinkedIn MCP Server](https://github.com/stickerdaniel/linkedin-mcp-server)** — Profile reading, job search, people search, connection requests
2. **Playwright MCP Server** (or equivalent browser automation) — For profile edits that LinkedIn doesn't expose via API

### Browser Setup

Browser automation connects via Chrome DevTools Protocol. Launch with remote debugging enabled:

```bash
# Chrome
google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/chrome-cdp-profile"

# Arc (macOS)
/Applications/Arc.app/Contents/MacOS/Arc --remote-debugging-port=9222 --user-data-dir="$HOME/arc-cdp-profile"

# Brave
brave --remote-debugging-port=9222 --user-data-dir="$HOME/brave-cdp-profile"
```

> **Important:** Quit any existing browser instance first — the port only binds on a fresh launch. You must be logged into LinkedIn in this browser session.

## Installation

Mercury skills are plain markdown files. Copy them into your AI assistant's skill directory:

### OpenCode
```bash
cp -r skills/* ~/.config/opencode/skills/
```

### Cursor / Claude Code / Other
```bash
# Place in your project or global config — consult your tool's docs
cp -r skills/* ~/.your-tool/skills/
```

Or symlink to stay in sync:
```bash
for skill in skills/*/; do
  ln -sf "$(pwd)/$skill" ~/.config/opencode/skills/
done
```

## Usage

The agent loads these skills automatically when your request matches their description. Examples:

- *"Audit my LinkedIn profile and help me get more recruiter messages"* → loads `profile-optimizer`
- *"Find backend engineer roles at DoorDash and Airbnb in São Paulo"* → loads `job-scout`
- *"Tailor my resume for these 3 roles I scouted"* → loads `resume-tailor`
- *"Find recruiters at Uber who hire in Brazil and connect with them"* → loads `recruiter-outreach`

## What Mercury Can Do

### Profile Optimizer
- Pull full profile analytics (search appearances, views, impressions)
- Identify specific pitfalls ranked by recruiter-search impact
- Edit via browser automation: Open to Work (recruiter-only), headline, location, top skills, languages, projects, About section, experience descriptions
- Remove internal-mobility cards that signal "not looking"

### Job Scout
- Search by company + location + work type + seniority
- Get full job descriptions with requirements and compensation
- Assess fit (Strong / Good / Stretch) based on your profile
- Flag diversity-scoped roles, staffing aggregators, and external ATS friction

### Resume Tailor
- Parse your base resume (Typst/MD/PDF/txt) + LinkedIn profile data
- Batch-tailor to N scouted roles in one pass
- Produce ATS-keyword-aligned Typst output per role
- Generate full cover letters per role
- Gap/match analysis showing what's strong, what's a stretch, what's missing
- All outputs stored in `.mercury/` with full run logs

### Recruiter Outreach
- Look up company URN IDs (required for LinkedIn's people search filter)
- Find technical recruiters/sourcers at target companies in your region
- Prioritize by: same city > 2nd-degree > mutual connections > relevant title
- Send connection requests with short, specific notes (<300 chars)
- Provide follow-up templates for post-acceptance

## Known Quirks & Limitations

- **Cannot auto-apply** to external ATS (Workday, Greenhouse) — these need personal data and auth answers
- **LinkedIn rate limits** — don't send >10-15 connection requests per session
- **Top Skills** are managed inside the About editor (`/add-edit/SUMMARY/`), not the Skills detail page
- **Company URN IDs** are required for people search filters — plain names are silently ignored
- **Typeahead fields** (language, skills) require ArrowDown + Enter after typing
- **"Notify network" toggle** — always verify it's OFF before saving experience edits

## Directory Structure

```
skills/
├── job-scout/
│   └── SKILL.md
├── profile-optimizer/
│   └── SKILL.md
├── recruiter-outreach/
│   └── SKILL.md
└── resume-tailor/
    ├── SKILL.md
    └── references/
        └── examples.md
```

## Keywords

LinkedIn automation, job search AI, recruiter outreach, resume tailoring, profile optimization, ATS optimization, LinkedIn MCP, AI job hunting, career toolkit, LinkedIn bot, job scout, cover letter generator, LinkedIn skills for AI agents

## License

The Unlicense — public domain. Do whatever you want with it.
