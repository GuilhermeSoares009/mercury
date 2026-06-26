---
name: profile-optimizer
description: >-
  Audit and optimize a LinkedIn profile for recruiter discoverability using
  browser automation. Fixes Open to Work settings, headline keywords, location,
  top skills, languages, projects, About section, and experience descriptions.
  Use when user wants to improve their LinkedIn profile for job searching or
  increase inbound recruiter messages. Part of the Mercury job search toolkit.
---

# LinkedIn Profile Optimizer

Audit a LinkedIn profile against real recruiter-search signals and fix the
gaps via Playwright browser automation (CDP).

## Prerequisites

- **LinkedIn MCP** — for pulling the full profile and analytics
- **Playwright MCP** — for making edits (connected to a browser with CDP on port 9222 where the user is logged into LinkedIn)
- User must launch browser with `--remote-debugging-port=9222 --user-data-dir="$HOME/<browser>-cdp-profile"`

## Workflow

### 1. Pull Profile & Audit

```
get_person_profile(username, sections: experience,education,skills,certifications,projects,honors,languages,posts)
```

Analyze these signals against recruiter-search behavior:

| Signal | What Recruiters Filter On | Common Pitfall |
|---|---|---|
| **Search appearances/week** | <100 = starved funnel | Headline has no tech keywords |
| **Connections** | <500 = tiny 2nd-degree pool | Low discoverability |
| **Open to Work** | Must be recruiter-visible | Set to internal-only or unset |
| **Location** | Recruiters filter by city | Listed in hometown, not work city |
| **Headline** | Most weighted search field | Uses jargon (SDE) or wastes space on degree |
| **Top Skills (5)** | Skill-match algorithms | Soft skills pinned instead of technical |
| **Languages** | Bilingual filter | Empty section |
| **Projects** | Completeness signal | Empty section |

Present ranked pitfalls with specific, actionable fixes.

### 2. Optimize via Playwright (Priority Order)

#### A. Open to Work (Highest Impact)
- Path: Profile → "Open to" button → "Finding a new job"
- Set: multiple titles (5 max), all location types (On-site/Hybrid/Remote), target city, "Flexible/casually looking", Full-time, **Recruiters only** visibility
- ⚠️ Enabling Remote re-renders the form (refs shift, adds required "Locations (remote)" field)

#### B. Location
- Path: `/in/{user}/edit/intro/`
- Change City field to actual work location

#### C. Headline
- Path: `/in/{user}/edit/intro/` → headline textbox (max 220 chars)
- Template: `{Role} @ {Company} | {Specialty} | {Tech1} · {Tech2} · {Tech3} · {Tech4} · {Tech5}`

#### D. Top Skills
- Path: `/in/{user}/add-edit/SUMMARY/` (the About editor contains the skills picker)
- Remove soft skills, add 5 technical skills matching target roles
- Use typeahead: type skill name → ArrowDown → Enter to select
- ⚠️ This is NOT in the Skills detail page — it's inside the About editor

#### E. Languages
- Path: `/in/{user}/add-edit/LANGUAGE/`
- Typeahead for language name + proficiency level dropdown
- Add native language + English with correct CEFR mapping:
  - B2 = "Professional working proficiency"
  - C1 = "Full professional proficiency"
  - Native = "Native or bilingual proficiency"

#### F. About Section
- Path: `/in/{user}/add-edit/SUMMARY/`
- Rich text editor (tiptap). Use `.fill()` to replace content.
- Lead with: role + company + city + specialty + stack (first 2 lines show in search previews)
- Include: what you work on (bullet points), education, what you're open to, links
- Keep handle/alias at the end, not the opening

#### G. Projects
- Path: `/in/{user}/add-edit/PROJECT/`
- Fields: name (255 max), description (2000 max), start/end dates, "Associated with" dropdown, skills, media
- Prioritize: open-source with stars, thesis/research, portfolio
- Associate with relevant experience entry

#### H. Experience Descriptions
- Path: `/in/{user}/details/experience/edit/forms/{formId}/`
- Find formId from the experience detail page's edit links
- Description field: 2000 char max
- ⚠️ Toggle "Notify network" OFF before saving (unless user wants to broadcast)

#### I. Remove Internal Mobility Card
- Path: `/in/{user}/opportunities/internal-mobility/edit/` → Delete → Confirm
- Removes the "Interested in jobs at {Company}" card that signals "not looking externally"

### 3. Verification
- Navigate to profile and screenshot final state
- Check analytics after 1-2 weeks for lift in search appearances

### 4. Persist to Mercury

Capture the profile metrics + computed score so the dashboard can chart progress over time. Run this whenever you pull fresh analytics (this is the only point profile metrics enter the system — the dashboard can't scrape them itself):

```
mercury metric record \
  --search-appearances {N} --profile-views {N} \
  --post-impressions {N} --connections {N} \
  --score {0-100} --breakdown '{"openToWork":true,"headline":"strong",...}'
```

Log the optimization session:
```
mercury activity log --skill profile-optimizer --summary "Audited + fixed {what}; score {old}->{new}"
```

## LinkedIn Deep Links Reference

```
/in/{user}/edit/intro/                              — Headline, location, name
/in/{user}/add-edit/SUMMARY/                        — About text + Top Skills picker
/in/{user}/add-edit/LANGUAGE/                       — Add language
/in/{user}/add-edit/PROJECT/                        — Add project
/in/{user}/details/experience/edit/forms/{id}/      — Edit experience entry
/in/{user}/details/skills/edit/forms/{id}/          — Edit skill associations
/in/{user}/opportunities/internal-mobility/edit/    — Internal mobility card
```

## Gotchas

1. **Typeahead fields** (Language, Skills): must use ArrowDown + Enter after typing — plain text won't register
2. **Multiple "Save" buttons**: use the dialog-scoped one, not global nav
3. **Refs shift on re-render**: after enabling Remote, adding/removing skills, etc. — re-snapshot
4. **Year dropdowns bloat snapshots**: use depth 7-8 to get field refs without option lists
5. **"Done" button conflicts**: video player has one too — use Escape to close post-save modals
6. **Premium "next action" modals**: appear after saving (suggest connections, ask about skills) — dismiss with Escape or skip
