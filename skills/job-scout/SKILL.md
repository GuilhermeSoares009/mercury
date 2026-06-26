---
name: job-scout
description: >-
  Search and evaluate open roles on LinkedIn matching a candidate's profile,
  target companies, locations, and compensation goals. Returns structured
  shortlists with fit assessment, job IDs, and direct links. Use when user
  wants to find roles at specific companies or in specific locations/work-types.
  Part of the Mercury job search toolkit.
---

# LinkedIn Job Scout

Research open roles on LinkedIn and produce a prioritized shortlist matched to
the candidate's profile, level, stack, and preferences.

## Prerequisites

- **LinkedIn MCP** — `search_jobs`, `get_job_details`, `get_company_profile`

## Workflow

### 1. Gather Target Criteria

From the user, establish:
- **Target companies** (specific names)
- **Location** (city, country, or "remote")
- **Work type** (on-site, hybrid, remote)
- **Level** (junior/mid/senior/staff — infer from YoE if not stated)
- **Stack** (languages, frameworks, cloud)
- **Compensation goals** (USD? local currency? range?)

### 2. Search Jobs

Run parallel searches:
```
search_jobs(keywords="{company} software engineer", location="{city}", max_pages=2)
search_jobs(keywords="backend software engineer", location="{city}", work_type="remote", max_pages=2)
search_jobs(keywords="{niche_skill} engineer", location="{country}", work_type="remote", max_pages=2)
```

### 3. Get Details for Top Matches

For the most promising job IDs:
```
get_job_details(job_id)
```

Extract: requirements, YoE asked, stack match, compensation (if listed), team info, English requirement.

### 4. Assess Fit

For each role, rate as:
- **⭐ Strong** — level matches, stack aligns, location works
- **Good** — most criteria match, minor stretch on one dimension
- **Stretch** — notably above stated level or missing key requirement

### 5. Present Shortlist

Use two tables:

**Location-based roles:**
| Role | Company | Mode | Fit | Link |
|---|---|---|---|---|

**Remote / USD roles:**
| Role | Company | Comp | Fit | Link |
|---|---|---|---|---|

Include job ID links as: `[{id}](https://www.linkedin.com/jobs/view/{id}/)`

### 5b. Persist to Mercury

Save each shortlisted role to the Mercury database (powers the dashboard's Jobs section):

```
mercury job save \
  --linkedin-id {id} --title "{Role}" --company "{Company}" \
  --location "{City}" --work-type "{remote|hybrid|onsite}" \
  --comp "{comp if known}" --fit "{strong|good|stretch}" \
  --link "https://www.linkedin.com/jobs/view/{id}/"
```

Log the scout run:
```
mercury activity log --skill job-scout --summary "Scouted {N} roles for {query}"
```

> If `mercury` isn't installed, just present the shortlist tables (below).

### 6. Flag Caveats

- Diversity-scoped roles ("Vaga para mulheres", "PCD-only") — note eligibility
- Staffing aggregators with high stated comp — flag for legitimacy verification
- Roles requiring significantly more YoE than candidate has
- External ATS vs Easy Apply (affects application friction)

## Compensation Reality Check

Most Brazil-remote listings hide compensation. When visible:
- **Staffing firms** (Crossing Hurdles, Hire Feed, Quik Hire): often inflated or contractor rates — verify
- **Legitimate product companies** hiring BR-remote in USD: Airbnb, DoorDash, Brex, Uber, Kraken, ClassPass, TRM Labs, Wellhub, Engine, Housecall Pro, Motorola
- **$45/hr contracts** ≈ $93K/yr; **$80-100K** = typical mid-senior LatAm remote; **$180-230K** = verify carefully

## Company URN Lookup

`search_people(current_company=...)` requires numeric URN IDs, not names:
```
get_company_profile(company_name) → references.about → company_urn.value
```

Common URNs:
- Airbnb: 309694
- DoorDash: 3205573
- Uber: 1815218
- Amazon: 1586
