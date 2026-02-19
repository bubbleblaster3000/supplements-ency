# Supplements Encyclopedia — Workflow & Blueprint

> **Purpose:** This document captures the methodology, data schema, conventions, and editorial standards established during the initial build. Use it as a reference for all future sessions to maintain consistency when adding or editing content.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & File Map](#architecture--file-map)
3. [Data Schema: Supplements](#data-schema-supplements)
4. [Data Schema: Categories](#data-schema-categories)
5. [Evidence Scoring System](#evidence-scoring-system)
6. [Editorial Standards & Tone](#editorial-standards--tone)
7. [Workflow: Adding a New Supplement](#workflow-adding-a-new-supplement)
8. [Workflow: Adding a New Category](#workflow-adding-a-new-category)
9. [Classification Rules](#classification-rules)
10. [Naming Conventions](#naming-conventions)
11. [Cross-Referencing & Interactions](#cross-referencing--interactions)
12. [Quality Checklist](#quality-checklist)

---

## Project Overview

- **Stack:** Plain HTML + CSS + vanilla JavaScript (no frameworks, no build step)
- **Data format:** JSON files in `/data/` — the app loads them at runtime via `fetch()`
- **Rendering:** Client-side template rendering via `js/render.js`
- **Hosting:** Static files — can be served from any web server, GitHub Pages, Netlify, etc.
- **Theme:** Dark by default, with light mode toggle (saved to `localStorage`)

---

## Architecture & File Map

```text
supplements-ency/
├── index.html                 ← Home page (categories grid + stacks + global ranked list)
├── category.html              ← Category view (sort toggle: evidence / alpha)
├── supplement.html            ← Individual supplement detail page
├── stack.html                 ← Stack detail page (timing blocks, synergies, potency)
├── css/
│   └── style.css              ← All styles (CSS variables, dark/light themes, responsive)
├── js/
│   ├── evidence.js            ← Evidence scoring engine (weights, normalization, tiers)
│   ├── render.js              ← HTML template generators for all pages/components (incl. stacks)
│   └── app.js                 ← Core logic (data loading, routing, search, theme toggle, stacks)
├── data/
│   ├── categories.json        ← Category definitions (id, name, icon, description, color)
│   ├── supplements.json       ← All supplement entries (full schema — see below)
│   └── stacks.json            ← Supplement stack protocols (timing, synergies, potency)
└── WORKFLOW.md                ← This file
```

---

## Data Schema: Stacks

Each stack in `data/stacks.json` represents a complete supplement protocol with timing blocks, synergy analysis, and evidence assessment.

```jsonc
{
  "id": "kebab-case-id",
  "name": "Display Name",
  "tagline": "One-sentence summary (<150 chars)",
  "description": "Multi-paragraph overview of the stack",
  "targetAudience": "Who this stack is designed for",
  "blocks": [
    {
      "id": "timing-block-id",
      "name": "Block Name (Localized)",
      "timing": "When to take these supplements",
      "icon": "🌅",
      "rationale": "Why this timing matters — biochemical justification",
      "items": [
        {
          "supplementId": "id-or-null",  // Links to supplements.json entry, null if not in DB
          "name": "Display Name",
          "dose": "Dose with units",
          "role": "What this supplement does in this stack context"
        }
      ]
    }
  ],
  "synergies": [
    {
      "supplements": ["Name A", "Name B"],
      "type": "synergy-type",           // e.g., substrate-replenishment, biochemical-synergy
      "strength": "strong | moderate",
      "evidenceLevel": "strong | moderate | emerging",
      "description": "What the synergy is and why it matters",
      "mechanism": "Biochemical mechanism explanation"
    }
  ],
  "categoryPotency": [
    {
      "categoryId": "cognitive",
      "rating": 9,
      "maxRating": 10,
      "rationale": "Why this stack scores X/10 in this category"
    }
  ],
  "evidenceAssessment": {
    "overallScore": 72,               // 0–100, same scale as individual supplements
    "overallTier": "A",
    "overallLabel": "Strong Evidence Base",
    "rationale": "Overall assessment of the stack's evidence quality",
    "strongestComponents": ["Component descriptions"],
    "weakestComponents": ["Component descriptions"]
  },
  "warnings": ["Warning strings"],
  "costEstimate": {
    "currency": "EUR",
    "monthlyLow": 80,
    "monthlyHigh": 150,
    "note": "Additional cost context"
  },
  "references": ["Formatted citation strings"]
}
```

### Workflow: Adding a New Stack

1. **Define timing blocks** — group supplements by their optimal intake window
2. **Identify synergies** — document all meaningful interactions between stack components
3. **Rate category potency** — score the stack's effectiveness in each relevant category (1–10)
4. **Assess overall evidence** — provide an honest composite score based on component evidence
5. **Document warnings** — flag all prescription medications, interaction risks, and contraindications
6. **Link supplements** — set `supplementId` for any supplement that exists in `supplements.json`
7. **Validate JSON** — ensure the file parses correctly after editing

---

## Data Schema: Supplements

Every supplement entry in `data/supplements.json` must follow this exact structure. All fields are **required** unless marked optional.

```jsonc
{
  "id": "kebab-case-id",                     // Unique URL-safe identifier
  "name": "Display Name (Localized Name)",    // Primary display name; can include original language name
  "aliases": ["Alias1", "Alias2"],            // Alternative names, brand names, chemical names
  "categories": ["cat-id-1", "cat-id-2"],     // Array of category IDs (min 1, typically 2-4)
  "tagline": "One-sentence summary.",         // <120 chars. Appears in list views. Concise and informative.
  
  "overview": "Multi-paragraph overview...",  // Wikipedia-style. 150-300 words. What it is, why it matters,
                                               // how widespread its use is. Factual, authoritative tone.
  
  "mechanismOfAction": "Detailed MOA...",     // Biochemistry of how it works. Name specific receptors,
                                               // enzymes, pathways. 150-250 words.
  
  "forms": [                                  // Available forms/variants
    {
      "name": "Form Name",
      "description": "Why this form matters, bioavailability notes",
      "recommended": true                     // true = recommended form, false = not first choice
    }
  ],
  
  "dosage": {
    "standard": "Range (e.g., 200-400 mg)",   // Typical dose range
    "loading": "Protocol or 'Not required'",  // Loading phase if applicable
    "optimal": "Best-practice recommendation", // The 'if you had to pick one dose' answer
    "timing": "When and how to take it",      // Relative to meals, time of day, etc.
    "notes": "Additional context"             // Body weight adjustments, population-specific notes
  },
  
  "benefits": [                               // 5-8 bullet points, specific and quantified where possible
    "Benefit with specifics (+X% improvement)",
    "..."
  ],
  
  "sideEffects": [                            // Honest, complete. Include frequency (common/rare)
    "Side effect (frequency and context)",
    "..."
  ],
  
  "interactions": [                           // Drug/supplement interactions
    {
      "substance": "Name of interacting substance",
      "effect": "What happens and what to do about it",
      "severity": "mild | moderate | severe"  // Only these three values
    }
  ],
  
  "evidence": {                               // Numbers for auto-scoring — be accurate and conservative
    "totalStudies": 0,                        // Total published studies (PubMed estimate)
    "humanStudies": 0,                        // Studies in human subjects
    "rcts": 0,                                // Randomized controlled trials
    "metaAnalyses": 0,                        // Meta-analyses
    "systematicReviews": 0                    // Systematic reviews
  },
  
  "keyFindings": [                            // 3-4 landmark studies, best available evidence
    {
      "finding": "What the study found — one sentence, specific",
      "source": "Author et al., Year — Study type (n=X if available)",
      "quality": "high | moderate"            // Only these two values
    }
  ],
  
  "safetyProfile": "Paragraph on safety...",  // Overall safety assessment. Regulatory status,
                                               // long-term data, toxicity thresholds, myth-busting.
  
  "populationNotes": "Who benefits most...",  // Specific populations: age, sex, athletes, pregnant,
                                               // vegans, clinical conditions. Who should avoid it.
  
  "references": [                             // 3-5 key references in author-date format
    "Author, X. et al. (Year). Title. Journal, Volume(Issue), Pages."
  ]
}
```

---

## Data Schema: Categories

Each category in `data/categories.json`:

```jsonc
{
  "id": "kebab-case",           // URL-safe identifier, used in supplement.categories[]
  "name": "Display Name",       // Short, descriptive (2-3 words)
  "icon": "🧠",                 // Single emoji
  "description": "One sentence describing what this category covers.",
  "color": "#HEX"               // Brand color for UI accents
}
```

### Current Categories

| ID | Name | Icon | Use For |
| --- | --- | --- | --- |
| `sleep` | Sleep & Recovery | 🌙 | Melatonin, magnesium glycinate, trazodone (for sleep), apigenin, glycine |
| `cognitive` | Focus & Cognition | 🧠 | Nootropics, stimulants, tyrosine, huperzine A, lion's mane |
| `performance` | Performance & Energy | ⚡ | Creatine, caffeine, beta-alanine, citrulline, maltodextrin |
| `longevity` | Longevity & Anti-Aging | 🧬 | NAC, NMN, resveratrol, omega-3, vitamin D |
| `mood` | Mood & Stress | 🧘 | Ashwagandha, inositol, L-theanine, trazodone (for mood) |
| `recovery` | Recovery & Repair | 💪 | Taurine, glycine, whey protein, omega-3, magnesium |
| `foundational` | Foundational Health | 🏛️ | Multivitamins, vitamin D+K2, zinc, basic mineral complexes |
| `medication` | Prescription Medications | 💊 | Elvanse, trazodone, any Rx compound (always flag as prescription-only) |

**Rules for adding new categories:**

- Only add a category if ≥2 supplements would belong to it and no existing category fits
- A supplement can (and usually should) belong to multiple categories (2-4 typical)
- Categories describe *use case*, not *compound class*

---

## Evidence Scoring System

### How Scores Are Calculated

The scoring engine is in `js/evidence.js`. It uses a **weighted composite with sigmoid normalization**.

**Weights per study type:**

| Study Type | Weight | Rationale |
| --- | --- | --- |
| Meta-analyses | 10 pts each | Highest level of evidence (synthesize multiple RCTs) |
| Systematic reviews | 6 pts each | Comprehensive evidence synthesis |
| RCTs | 2 pts each | Gold standard individual studies |
| Human studies (any) | 0.2 pts each | Breadth indicator |

**Formula:**

```text
raw = (metaAnalyses × 10) + (systematicReviews × 6) + (rcts × 2) + (humanStudies × 0.2)
score = 100 × (1 - e^(-raw / 200))
```

The sigmoid normalization provides diminishing returns — meaning the difference between 10 and 30 RCTs matters more than between 300 and 320.

### Evidence Tiers

| Tier | Score | Label | Color | Meaning |
| --- | --- | --- | --- | --- |
| **S** | 90–100 | Gold Standard | `#FFD700` | Scientific consensus, extensive meta-analyses, hundreds of RCTs |
| **A** | 70–89 | Strong Evidence | `#4CAF50` | Robust clinical data, well-established |
| **B** | 50–69 | Moderate Evidence | `#2196F3` | Growing body of quality research |
| **C** | 30–49 | Emerging Evidence | `#FF9800` | Promising early clinical data, needs more research |
| **D** | 0–29 | Preliminary | `#F44336` | Limited clinical evidence, mostly preclinical |

### Guidelines for Evidence Numbers

- **Be conservative and honest** — overestimating undermines the entire system's credibility
- Use **PubMed search estimates** as a baseline (search: `"compound name" AND (supplement OR supplementation)`)
- `totalStudies` includes preclinical (animal, in vitro) + human
- `humanStudies` is a subset of `totalStudies` — only studies with human participants
- `rcts` is a subset of `humanStudies` — only randomized controlled trials
- `metaAnalyses` and `systematicReviews` are specific publication types
- When unsure, round **down** — it's better to undersell than overclaim
- For prescription medications, evidence counts include the drug's full clinical trial program

---

## Editorial Standards & Tone

### Voice & Style

- **Authoritative but accessible** — write like a well-sourced Wikipedia article, not a marketing page
- **Factual and balanced** — always present both benefits AND limitations honestly
- **Quantify wherever possible** — "reduces cortisol by 14–28%" is better than "reduces cortisol"
- **Cite mechanisms** — name specific receptors, enzymes, and pathways (5-HT₂A, NF-κB, CYP3A4, etc.)
- **No hype** — avoid words like "miracle," "breakthrough," "game-changer," "superfood"
- **Debunk myths** — if a common concern is scientifically unfounded, say so explicitly
- **Admit gaps** — if evidence is limited, say "evidence is limited" or "more research is needed"

### Language Specifics

- Use the **localized name first** if the user provided one, then the English/scientific name in parentheses
  - Example: `"name": "Trazodon (Trazodone)"`, `"name": "L-Tyrosin (L-Tyrosine)"`
- **Dosage units:** mg, g, μg, IU — always include units
- **Dose ranges:** use en-dash: `200–400 mg` (not `200-400mg`)
- **Study citations in keyFindings:** `"Author et al., Year — Study type (n=X)"`
- **Interaction severity:** only `mild`, `moderate`, or `severe` — no other values

### Prescription Medications

When adding a prescription medication (vs. a supplement):

1. Always assign the `medication` category in addition to functional categories
2. Include explicit warnings in `dosage.notes`: "Prescription-only" / "Requires medical supervision"
3. Include controlled substance classification if applicable
4. Note common co-prescribing patterns in interactions (e.g., Elvanse + Trazodone)
5. Note discontinuation protocols if relevant (tapering, etc.)

---

## Workflow: Adding a New Supplement

### Step-by-step

1. **Identify the compound** — determine if it's a supplement, vitamin/mineral, or prescription medication
2. **Assign categories** — pick 2–4 category IDs from the existing list. Create a new category only if needed (see rules above)
3. **Write the entry** following the exact JSON schema above — all fields required
4. **Fill evidence numbers** — conservative PubMed-based estimates  
5. **Select 3–4 key findings** — prioritize meta-analyses and large RCTs; include the source in standardized format
6. **Cross-reference interactions** — check if the new supplement interacts with any *existing* entries in the database. If so, add the interaction to BOTH entries
7. **Validate JSON** — ensure the file parses correctly after editing
8. **Insert position** — add the new entry before the closing `]` of the supplements array

### Template (copy-paste starter)

```json
{
  "id": "",
  "name": "",
  "aliases": [],
  "categories": [],
  "tagline": "",
  "overview": "",
  "mechanismOfAction": "",
  "forms": [
    { "name": "", "description": "", "recommended": true }
  ],
  "dosage": {
    "standard": "",
    "loading": "",
    "optimal": "",
    "timing": "",
    "notes": ""
  },
  "benefits": [],
  "sideEffects": [],
  "interactions": [
    { "substance": "", "effect": "", "severity": "mild" }
  ],
  "evidence": {
    "totalStudies": 0,
    "humanStudies": 0,
    "rcts": 0,
    "metaAnalyses": 0,
    "systematicReviews": 0
  },
  "keyFindings": [
    { "finding": "", "source": "", "quality": "high" }
  ],
  "safetyProfile": "",
  "populationNotes": "",
  "references": []
}
```

---

## Workflow: Adding a New Category

1. Add the category object to `data/categories.json` — follow the schema
2. Choose a unique `id` (kebab-case), a descriptive `name` (2-3 words), a single emoji `icon`, a one-sentence `description`, and a hex `color`
3. Update the category table in this WORKFLOW.md file
4. Category should only be created if ≥2 supplements would use it and no existing category fits

---

## Classification Rules

### How to decide which categories a supplement belongs to

| If the compound... | Assign category |
| --- | --- |
| Improves sleep onset, sleep quality, or sleep architecture | `sleep` |
| Enhances focus, memory, learning, or neuroprotection | `cognitive` |
| Improves physical performance, strength, endurance, or energy | `performance` |
| Has anti-aging, cellular repair, or healthspan-extending evidence | `longevity` |
| Reduces stress, anxiety, or supports emotional regulation | `mood` |
| Accelerates physical recovery, reduces inflammation or DOMS | `recovery` |
| Is a basic vitamin, mineral, or multi-nutrient essential for health | `foundational` |
| Requires a prescription / is a pharmaceutical | `medication` (always in addition to functional categories) |

### Special cases

- **Amino acids** (glycine, taurine, tyrosine): Classify by primary functional use, NOT as a category of their own
- **Combo products** (D3+K2, GlyNAC): Treat as a single entry with combined mechanisms
- **Brand-specific products** (GN Sports Complex): Still write objectively about the *class* of product — the mechanisms and evidence apply to the ingredient category, not the brand

---

## Naming Conventions

| Element | Convention | Example |
| -- | -- | -- |
| Supplement `id` | kebab-case, descriptive | `vitamin-d3-k2`, `lions-mane` |
| Supplement `name` | Localized name first (if user provided), English/scientific in parentheses | `"L-Tyrosin (L-Tyrosine)"` |
| Category `id` | single lowercase word or kebab-case | `sleep`, `cognitive`, `foundational` |
| Interaction severity | only `mild`, `moderate`, `severe` | — |
| Finding quality | only `high`, `moderate` | — |
| Form recommended | boolean `true`/`false` | — |

---

## Cross-Referencing & Interactions

When adding a new supplement, always check for interactions with **existing entries** in the database. If a meaningful interaction exists:

1. Add it to the **new** supplement's `interactions` array
2. Add the **reciprocal** interaction to the existing supplement's entry (if it doesn't already exist)

### Established cross-references in this project

| Compound A | Compound B | Relationship |
| --- | --- | --- |
| Elvanse | Trazodone | Often co-prescribed (stimulant + sleep aid) |
| Elvanse | L-Tyrosine | Additive catecholaminergic effects — monitor |
| Elvanse | Caffeine | Additive stimulant effects |
| Vitamin D3 | Magnesium | Magnesium required for D3 activation — synergistic |
| Vitamin D3 | K2 | Synergistic calcium metabolism — co-formulated |
| NAC | Glycine | GlyNAC protocol for glutathione — synergistic |
| Creatine | Caffeine | Acute co-ingestion may reduce benefit |

---

## Quality Checklist

Before marking a supplement entry as complete, verify:

- [ ] `id` is unique, kebab-case, and URL-safe
- [ ] `name` follows localized-first convention if applicable
- [ ] `aliases` include common names, brand names, and chemical names
- [ ] `categories` includes 2–4 appropriate category IDs
- [ ] `tagline` is <120 characters and informative (not marketing fluff)
- [ ] `overview` is 150–300 words, factual, well-structured
- [ ] `mechanismOfAction` names specific receptors/enzymes/pathways
- [ ] `forms` includes ≥2 options with clear recommendation guidance
- [ ] `dosage` has all 5 fields filled with specific numbers and units
- [ ] `benefits` has 5–8 specific, quantified items
- [ ] `sideEffects` is honest and includes frequency qualifiers
- [ ] `interactions` checked against all existing database entries
- [ ] `evidence` numbers are conservative PubMed-based estimates
- [ ] `keyFindings` has 3–4 entries with proper source citations
- [ ] `safetyProfile` includes regulatory status and myth-busting where relevant
- [ ] `populationNotes` addresses specific groups (elderly, pregnant, athletes, vegans)
- [ ] `references` has 3–5 properly formatted citations
- [ ] JSON validates after insertion
- [ ] If prescription medication: includes `medication` category + safety warnings

---

## Remaining Supplements Queue

Supplements from the original list not yet added:

- [ ] Maltodextrin Pulver
- [ ] Whey Protein Pulver
- [ ] Berberin
- [ ] Ashwagandha Shoden
- [ ] Omega-3 (DHA)
- [ ] Zink-Bisglycinat
- [ ] Magnesium-Bisglycinat
- [ ] Glycin
- [ ] Taurin
- [ ] Myo-Inositol
- [ ] L-Theanin
- [ ] Apigenin
- [ ] Melatonin
- [ ] Huperzin A

> **Note:** Ashwagandha and Omega-3 already have generic entries in the database. When adding the user's specific forms (Ashwagandha Shoden, Omega-3 DHA), decide whether to update the existing entries to highlight these forms, or create separate entries. Recommended approach: **update the existing entries** to feature Shoden / DHA-focused info, rather than duplicating.
