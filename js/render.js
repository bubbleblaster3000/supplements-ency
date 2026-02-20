/**
 * Render Module
 * 
 * Template rendering functions for all pages of the Supplements Encyclopedia.
 * Each function takes data and returns HTML strings.
 */

const Render = (() => {

  // ──────────────────────────────
  // SHARED / UTILITY COMPONENTS
  // ──────────────────────────────

  function evidenceBadge(evidence, size = 'normal') {
    const assessment = EvidenceScoring.assess(evidence);
    const sizeClass = size === 'small' ? 'badge--small' : '';
    return `
      <div class="evidence-badge ${sizeClass}" style="--badge-color: ${assessment.color}; --badge-bg: ${assessment.bgColor}">
        <span class="evidence-badge__tier">${assessment.tier}</span>
        <span class="evidence-badge__score">${assessment.score}</span>
      </div>
    `;
  }

  function evidenceBar(evidence) {
    const assessment = EvidenceScoring.assess(evidence);
    return `
      <div class="evidence-bar">
        <div class="evidence-bar__fill" style="width: ${assessment.score}%; background: ${assessment.color}"></div>
      </div>
    `;
  }

  function evidenceDetail(evidence) {
    const assessment = EvidenceScoring.assess(evidence);
    return `
      <div class="evidence-detail">
        <div class="evidence-detail__header">
          ${evidenceBadge(evidence)}
          <div class="evidence-detail__meta">
            <h3 class="evidence-detail__label">${assessment.label}</h3>
            <p class="evidence-detail__description">${assessment.description}</p>
          </div>
        </div>
        ${evidenceBar(evidence)}
        <div class="evidence-detail__breakdown">
          <div class="evidence-stat">
            <span class="evidence-stat__value">${assessment.breakdown.totalStudies.toLocaleString()}</span>
            <span class="evidence-stat__label">Total Studies</span>
          </div>
          <div class="evidence-stat">
            <span class="evidence-stat__value">${assessment.breakdown.humanStudies.toLocaleString()}</span>
            <span class="evidence-stat__label">Human Studies</span>
          </div>
          <div class="evidence-stat">
            <span class="evidence-stat__value">${assessment.breakdown.rcts.toLocaleString()}</span>
            <span class="evidence-stat__label">RCTs</span>
          </div>
          <div class="evidence-stat">
            <span class="evidence-stat__value">${assessment.breakdown.metaAnalyses}</span>
            <span class="evidence-stat__label">Meta-Analyses</span>
          </div>
          <div class="evidence-stat">
            <span class="evidence-stat__value">${assessment.breakdown.systematicReviews}</span>
            <span class="evidence-stat__label">Systematic Reviews</span>
          </div>
        </div>
      </div>
    `;
  }

  function categoryTag(categoryId, categories) {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return '';
    return `<a href="category.html?id=${cat.id}" class="category-tag" style="--cat-color: ${cat.color}">${SI(cat.icon + ' ', '')}${cat.name}</a>`;
  }

  // ──────────────────────────────
  // HOME PAGE
  // ──────────────────────────────

  function homePage(categories, supplements, stacks) {
    const categoryCards = categories.map(cat => {
      const catSupplements = supplements.filter(s => s.categories.includes(cat.id));
      const sortedByEvidence = EvidenceScoring.sortByEvidence(catSupplements);
      const topSupplements = sortedByEvidence.slice(0, 3);

      return `
        <a href="category.html?id=${cat.id}" class="category-card" style="--cat-color: ${cat.color}">
          <div class="category-card__icon">${SI(cat.icon, '')}</div>
          <h2 class="category-card__name">${cat.name}</h2>
          <p class="category-card__description">${cat.description}</p>
          <div class="category-card__count">${catSupplements.length} supplement${catSupplements.length !== 1 ? 's' : ''}</div>
          ${topSupplements.length > 0 ? `
            <div class="category-card__top">
              <span class="category-card__top-label">Top by evidence:</span>
              ${topSupplements.map(s => `<span class="category-card__top-item">${s.name}</span>`).join('')}
            </div>
          ` : ''}
        </a>
      `;
    }).join('');

    // Stats
    const totalSupplements = supplements.length;
    const totalStudies = supplements.reduce((sum, s) => sum + (s.evidence.totalStudies || 0), 0);
    const totalRCTs = supplements.reduce((sum, s) => sum + (s.evidence.rcts || 0), 0);

    return `
      <section class="hero">
        <div class="container">
          <h1 class="hero__title">Supplements Encyclopedia</h1>
          <p class="hero__subtitle">Evidence-based reference for supplements & protocols — ranked by science, not marketing.</p>
          <div class="hero__stats">
            <div class="hero__stat">
              <span class="hero__stat-value">${totalSupplements}</span>
              <span class="hero__stat-label">Supplements</span>
            </div>
            <div class="hero__stat">
              <span class="hero__stat-value">${totalStudies.toLocaleString()}+</span>
              <span class="hero__stat-label">Studies Referenced</span>
            </div>
            <div class="hero__stat">
              <span class="hero__stat-value">${totalRCTs.toLocaleString()}+</span>
              <span class="hero__stat-label">RCTs</span>
            </div>
            <div class="hero__stat">
              <span class="hero__stat-value">${categories.length}</span>
              <span class="hero__stat-label">Categories</span>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section__header">
            <h2 class="section__title">Browse by Category</h2>
            <p class="section__subtitle">Explore supplements organized by their primary use case</p>
          </div>
          <div class="categories-grid">
            ${categoryCards}
          </div>
        </div>
      </section>

      ${stacksSection(stacks)}

      <section class="section">
        <div class="container">
          <div class="builder-cta">
            <div class="builder-cta__text">
              <h2 class="builder-cta__title">${SI('🛠️ ', '')}Custom Stack Builder</h2>
              <p class="builder-cta__description">Build your own supplement stack from our database. Get instant synergy detection, risk analysis, category coverage scoring, and a full evidence breakdown — all in real time.</p>
            </div>
            <a href="builder.html" class="btn builder-cta__btn">Open Stack Builder →</a>
          </div>
        </div>
      </section>

      <section class="section section--alt">
        <div class="container">
          <div class="section__header">
            <h2 class="section__title">All Supplements — Ranked by Evidence</h2>
            <p class="section__subtitle">Every supplement in the encyclopedia, sorted by the strength of scientific evidence</p>
          </div>
          ${supplementList(EvidenceScoring.sortByEvidence(supplements), categories)}
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section__header">
            <h2 class="section__title">Understanding Evidence Tiers</h2>
            <p class="section__subtitle">How we score and rank supplements based on scientific research</p>
          </div>
          ${evidenceTierExplainer()}
        </div>
      </section>
    `;
  }

  // ──────────────────────────────
  // SUPPLEMENT LIST COMPONENT
  // ──────────────────────────────

  function supplementList(supplements, categories) {
    if (supplements.length === 0) {
      return '<p class="empty-state">No supplements found in this category yet.</p>';
    }

    const rows = supplements.map((s, index) => {
      const assessment = EvidenceScoring.assess(s.evidence);
      return `
        <a href="supplement.html?id=${s.id}" class="supplement-row">
          <div class="supplement-row__rank">${index + 1}</div>
          <div class="supplement-row__badge">
            ${evidenceBadge(s.evidence, 'small')}
          </div>
          <div class="supplement-row__info">
            <h3 class="supplement-row__name">${s.name}</h3>
            <p class="supplement-row__tagline">${s.tagline}</p>
            <div class="supplement-row__categories">
              ${s.categories.map(cid => {
                const cat = categories.find(c => c.id === cid);
                return cat ? `<span class="supplement-row__cat" style="--cat-color: ${cat.color}">${SI(cat.icon + ' ', '')}${cat.name}</span>` : '';
              }).join('')}
            </div>
          </div>
          <div class="supplement-row__evidence">
            <div class="supplement-row__score-bar">
              ${evidenceBar(s.evidence)}
            </div>
            <div class="supplement-row__stats">
              <span>${assessment.breakdown.rcts} RCTs</span>
              <span>${assessment.breakdown.metaAnalyses} Meta-analyses</span>
            </div>
          </div>
        </a>
      `;
    }).join('');

    return `<div class="supplement-list">${rows}</div>`;
  }

  // ──────────────────────────────
  // CATEGORY PAGE
  // ──────────────────────────────

  function categoryPage(category, supplements, allCategories, sortMode = 'evidence') {
    const catSupplements = supplements.filter(s => s.categories.includes(category.id));
    const sorted = sortMode === 'alpha'
      ? EvidenceScoring.sortAlphabetically(catSupplements)
      : EvidenceScoring.sortByEvidence(catSupplements);

    return `
      <section class="category-hero" style="--cat-color: ${category.color}">
        <div class="container">
          <nav class="breadcrumb">
            <a href="index.html">Home</a>
            <span class="breadcrumb__sep">›</span>
            <span>${category.name}</span>
          </nav>
          <div class="category-hero__icon">${SI(category.icon, '')}</div>
          <h1 class="category-hero__title">${category.name}</h1>
          <p class="category-hero__description">${category.description}</p>
          <div class="category-hero__count">${catSupplements.length} supplement${catSupplements.length !== 1 ? 's' : ''}</div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="sort-controls">
            <span class="sort-controls__label">Sort by:</span>
            <button class="sort-btn ${sortMode === 'evidence' ? 'sort-btn--active' : ''}" data-sort="evidence">
              ${SI('🔬 ', '')}Evidence Strength
            </button>
            <button class="sort-btn ${sortMode === 'alpha' ? 'sort-btn--active' : ''}" data-sort="alpha">
              ${SI('🔤 ', '')}Alphabetical
            </button>
          </div>
          ${supplementList(sorted, allCategories)}
        </div>
      </section>
    `;
  }

  // ──────────────────────────────
  // SUPPLEMENT DETAIL PAGE
  // ──────────────────────────────

  function supplementPage(supplement, allCategories) {
    const assessment = EvidenceScoring.assess(supplement.evidence);

    return `
      <section class="supplement-hero">
        <div class="container">
          <nav class="breadcrumb">
            <a href="index.html">Home</a>
            <span class="breadcrumb__sep">›</span>
            <span>${supplement.name}</span>
          </nav>
          <div class="supplement-hero__header">
            <div class="supplement-hero__text">
              <h1 class="supplement-hero__title">${supplement.name}</h1>
              ${supplement.aliases.length > 0 ? `<p class="supplement-hero__aliases">Also known as: ${supplement.aliases.join(', ')}</p>` : ''}
              <p class="supplement-hero__tagline">${supplement.tagline}</p>
              <div class="supplement-hero__categories">
                ${supplement.categories.map(cid => categoryTag(cid, allCategories)).join('')}
              </div>
            </div>
            <div class="supplement-hero__evidence">
              ${evidenceDetail(supplement.evidence)}
            </div>
          </div>
        </div>
      </section>

      <div class="supplement-content">
        <div class="container supplement-layout">
          <nav class="supplement-sidebar">
            <div class="sidebar-nav">
              <h4 class="sidebar-nav__title">Contents</h4>
              <ul class="sidebar-nav__list">
                <li><a href="#overview" class="sidebar-nav__link">Overview</a></li>
                <li><a href="#mechanism" class="sidebar-nav__link">Mechanism of Action</a></li>
                <li><a href="#forms" class="sidebar-nav__link">Forms & Variants</a></li>
                <li><a href="#dosage" class="sidebar-nav__link">Dosage</a></li>
                <li><a href="#benefits" class="sidebar-nav__link">Benefits</a></li>
                <li><a href="#side-effects" class="sidebar-nav__link">Side Effects</a></li>
                <li><a href="#interactions" class="sidebar-nav__link">Interactions</a></li>
                <li><a href="#key-findings" class="sidebar-nav__link">Key Research Findings</a></li>
                <li><a href="#safety" class="sidebar-nav__link">Safety Profile</a></li>
                <li><a href="#populations" class="sidebar-nav__link">Population Notes</a></li>
                <li><a href="#references" class="sidebar-nav__link">References</a></li>
              </ul>
            </div>

            <div class="sidebar-quickfacts">
              <h4 class="sidebar-quickfacts__title">Quick Facts</h4>
              <div class="sidebar-quickfacts__item">
                <span class="sidebar-quickfacts__label">Standard Dose</span>
                <span class="sidebar-quickfacts__value">${supplement.dosage.standard}</span>
              </div>
              <div class="sidebar-quickfacts__item">
                <span class="sidebar-quickfacts__label">Evidence Tier</span>
                <span class="sidebar-quickfacts__value" style="color: ${assessment.color}">${assessment.tier} — ${assessment.label}</span>
              </div>
              <div class="sidebar-quickfacts__item">
                <span class="sidebar-quickfacts__label">RCTs</span>
                <span class="sidebar-quickfacts__value">${assessment.breakdown.rcts}</span>
              </div>
              <div class="sidebar-quickfacts__item">
                <span class="sidebar-quickfacts__label">Meta-Analyses</span>
                <span class="sidebar-quickfacts__value">${assessment.breakdown.metaAnalyses}</span>
              </div>
            </div>
          </nav>

          <main class="supplement-main">
            ${renderSection('overview', 'Overview', `<p>${supplement.overview}</p>`)}
            ${renderSection('mechanism', 'Mechanism of Action', `<p>${supplement.mechanismOfAction}</p>`)}
            ${renderFormsSection(supplement.forms)}
            ${renderDosageSection(supplement.dosage)}
            ${renderListSection('benefits', 'Benefits', supplement.benefits)}
            ${renderListSection('side-effects', 'Side Effects', supplement.sideEffects)}
            ${renderInteractionsSection(supplement.interactions)}
            ${renderKeyFindingsSection(supplement.keyFindings)}
            ${renderSection('safety', 'Safety Profile', `<p>${supplement.safetyProfile}</p>`)}
            ${renderSection('populations', 'Population Notes', `<p>${supplement.populationNotes}</p>`)}
            ${renderReferencesSection(supplement.references)}
          </main>
        </div>
      </div>
    `;
  }

  // ──────────────────────────────
  // SECTION RENDERERS
  // ──────────────────────────────

  function renderSection(id, title, content) {
    return `
      <section id="${id}" class="content-section">
        <h2 class="content-section__title">${title}</h2>
        <div class="content-section__body">${content}</div>
      </section>
    `;
  }

  function renderListSection(id, title, items) {
    const listHtml = `
      <ul class="content-list">
        ${items.map(item => `<li class="content-list__item">${item}</li>`).join('')}
      </ul>
    `;
    return renderSection(id, title, listHtml);
  }

  function renderFormsSection(forms) {
    if (!forms || forms.length === 0) return '';
    const formsHtml = forms.map(form => `
      <div class="form-card ${form.recommended ? 'form-card--recommended' : ''}">
        <div class="form-card__header">
          <h4 class="form-card__name">${form.name}</h4>
          ${form.recommended ? `<span class="form-card__badge">${SI('✓', '[*]')} Recommended</span>` : ''}
        </div>
        <p class="form-card__description">${form.description}</p>
      </div>
    `).join('');
    return renderSection('forms', 'Forms & Variants', `<div class="forms-grid">${formsHtml}</div>`);
  }

  function renderDosageSection(dosage) {
    const html = `
      <div class="dosage-grid">
        <div class="dosage-item">
          <h4 class="dosage-item__label">Standard Dose</h4>
          <p class="dosage-item__value">${dosage.standard}</p>
        </div>
        ${dosage.optimal ? `
          <div class="dosage-item dosage-item--highlight">
            <h4 class="dosage-item__label">Optimal Protocol</h4>
            <p class="dosage-item__value">${dosage.optimal}</p>
          </div>
        ` : ''}
        ${dosage.loading ? `
          <div class="dosage-item">
            <h4 class="dosage-item__label">Loading Protocol</h4>
            <p class="dosage-item__value">${dosage.loading}</p>
          </div>
        ` : ''}
        <div class="dosage-item">
          <h4 class="dosage-item__label">Timing</h4>
          <p class="dosage-item__value">${dosage.timing}</p>
        </div>
      </div>
      ${dosage.notes ? `<div class="dosage-notes"><strong>Note:</strong> ${dosage.notes}</div>` : ''}
    `;
    return renderSection('dosage', 'Dosage', html);
  }

  function renderInteractionsSection(interactions) {
    if (!interactions || interactions.length === 0) return '';
    const html = interactions.map(int => {
      const severityClass = `interaction--${int.severity}`;
      const severityLabel = int.severity.charAt(0).toUpperCase() + int.severity.slice(1);
      return `
        <div class="interaction ${severityClass}">
          <div class="interaction__header">
            <h4 class="interaction__substance">${int.substance}</h4>
            <span class="interaction__severity">${severityLabel}</span>
          </div>
          <p class="interaction__effect">${int.effect}</p>
        </div>
      `;
    }).join('');
    return renderSection('interactions', 'Interactions', `<div class="interactions-list">${html}</div>`);
  }

  function renderKeyFindingsSection(findings) {
    if (!findings || findings.length === 0) return '';
    const html = findings.map(f => {
      const qualityClass = `finding--${f.quality}`;
      return `
        <div class="finding ${qualityClass}">
          <div class="finding__quality">${f.quality === 'high' ? SI('⬆ High Quality', 'HIGH QUALITY') : SI('◆ Moderate Quality', 'MODERATE QUALITY')}</div>
          <p class="finding__text">"${f.finding}"</p>
          <cite class="finding__source">${f.source}</cite>
        </div>
      `;
    }).join('');
    return renderSection('key-findings', 'Key Research Findings', `<div class="findings-list">${html}</div>`);
  }

  function renderReferencesSection(references) {
    if (!references || references.length === 0) return '';
    const html = `
      <ol class="references-list">
        ${references.map(ref => `<li class="references-list__item">${ref}</li>`).join('')}
      </ol>
    `;
    return renderSection('references', 'References', html);
  }

  // ──────────────────────────────
  // EVIDENCE TIER EXPLAINER
  // ──────────────────────────────

  function evidenceTierExplainer() {
    const tiers = [
      { tier: 'S', score: '90–100', label: 'Gold Standard', color: '#FFD700', desc: 'Extensively studied with scientific consensus. Supported by numerous meta-analyses and hundreds of RCTs.' },
      { tier: 'A', score: '70–89', label: 'Strong Evidence', color: '#4CAF50', desc: 'Robust clinical evidence from multiple high-quality trials. Well-established in the research literature.' },
      { tier: 'B', score: '50–69', label: 'Moderate Evidence', color: '#2196F3', desc: 'Growing body of clinical evidence. Multiple RCTs support efficacy, though more research would strengthen conclusions.' },
      { tier: 'C', score: '30–49', label: 'Emerging Evidence', color: '#FF9800', desc: 'Promising early clinical data. Some RCTs available, but the evidence base is still developing.' },
      { tier: 'D', score: '0–29', label: 'Preliminary', color: '#F44336', desc: 'Limited clinical evidence. Mostly preclinical or observational data.' }
    ];

    return `
      <div class="tier-explainer">
        ${tiers.map(t => `
          <div class="tier-explainer__row">
            <div class="tier-explainer__badge" style="--badge-color: ${t.color}; --badge-bg: ${t.color}20">
              <span class="tier-explainer__tier">${t.tier}</span>
              <span class="tier-explainer__score">${t.score}</span>
            </div>
            <div class="tier-explainer__info">
              <h4 class="tier-explainer__label">${t.label}</h4>
              <p class="tier-explainer__desc">${t.desc}</p>
            </div>
          </div>
        `).join('')}
        <div class="tier-explainer__methodology">
          <h4>Scoring Methodology</h4>
          <p>Evidence scores are calculated using a weighted composite of study quantity and quality. Meta-analyses carry the highest weight, followed by systematic reviews and randomized controlled trials (RCTs). The scoring uses a sigmoid normalization curve, providing natural diminishing returns — meaning the difference between 10 and 20 RCTs matters more than the difference between 200 and 210. This ensures meaningful differentiation across the entire evidence spectrum.</p>
        </div>
      </div>
    `;
  }

  // ──────────────────────────────
  // STACK CARD (for home page)
  // ──────────────────────────────

  function stackCard(stack) {
    const tierInfo = EvidenceScoring.getTier(stack.evidenceAssessment.overallScore);
    const blockCount = stack.blocks.length;
    const totalItems = stack.blocks.reduce((sum, b) => sum + b.items.length, 0);
    const synergyCount = stack.synergies.length;

    return `
      <a href="stack.html?id=${stack.id}" class="stack-card">
        <div class="stack-card__header">
          <div class="stack-card__icon">${SI('📋', '')}</div>
          <div class="stack-card__tier" style="--badge-color: ${tierInfo.color}; --badge-bg: ${tierInfo.bgColor}">
            <span class="stack-card__tier-letter">${tierInfo.tier}</span>
            <span class="stack-card__tier-score">${stack.evidenceAssessment.overallScore}</span>
          </div>
        </div>
        <h3 class="stack-card__name">${stack.name}</h3>
        <p class="stack-card__tagline">${stack.tagline}</p>
        <div class="stack-card__meta">
          <span class="stack-card__meta-item">${SI('🕖 ', '')}${blockCount} timing blocks</span>
          <span class="stack-card__meta-item">${SI('💊 ', '')}${totalItems} supplements</span>
          <span class="stack-card__meta-item">${SI('🔗 ', '')}${synergyCount} synergies</span>
        </div>
        <div class="stack-card__potency">
          ${stack.categoryPotency.slice(0, 4).map(cp => {
            const filled = cp.rating;
            const empty = cp.maxRating - cp.rating;
            return `<span class="stack-card__potency-item" title="${cp.categoryId}: ${cp.rating}/${cp.maxRating}">${cp.categoryId}: ${'#'.repeat(filled)}${'.'.repeat(empty)}</span>`;
          }).join('')}
        </div>
      </a>
    `;
  }

  function stacksSection(stacks) {
    if (!stacks || stacks.length === 0) return '';

    return `
      <section class="section">
        <div class="container">
          <div class="section__header">
            <h2 class="section__title">Supplement Stacks</h2>
            <p class="section__subtitle">Complete protocols with timing, synergies, and evidence analysis</p>
          </div>
          <div class="stacks-grid">
            ${stacks.map(s => stackCard(s)).join('')}
          </div>
        </div>
      </section>
    `;
  }

  // ──────────────────────────────
  // STACK DETAIL PAGE
  // ──────────────────────────────

  function stackPage(stack, supplements, categories) {
    const tierInfo = EvidenceScoring.getTier(stack.evidenceAssessment.overallScore);
    const totalItems = stack.blocks.reduce((sum, b) => sum + b.items.length, 0);

    return `
      <section class="stack-hero">
        <div class="container">
          <nav class="breadcrumb">
            <a href="index.html">Home</a>
            <span class="breadcrumb__sep">›</span>
            <span>Stacks</span>
            <span class="breadcrumb__sep">›</span>
            <span>${stack.name}</span>
          </nav>
          <div class="stack-hero__header">
            <div class="stack-hero__text">
              <h1 class="stack-hero__title">${stack.name}</h1>
              <p class="stack-hero__tagline">${stack.tagline}</p>
              <div class="stack-hero__stats">
                <span class="stack-hero__stat">${SI('📦 ', '')}${stack.blocks.length} Timing Blocks</span>
                <span class="stack-hero__stat">${SI('💊 ', '')}${totalItems} Supplements</span>
                <span class="stack-hero__stat">${SI('🔗 ', '')}${stack.synergies.length} Synergies</span>
              </div>
            </div>
            <div class="stack-hero__evidence">
              <div class="evidence-badge" style="--badge-color: ${tierInfo.color}; --badge-bg: ${tierInfo.bgColor}">
                <span class="evidence-badge__tier">${tierInfo.tier}</span>
                <span class="evidence-badge__score">${stack.evidenceAssessment.overallScore}</span>
              </div>
              <div class="stack-hero__evidence-meta">
                <h3>${stack.evidenceAssessment.overallLabel}</h3>
                <p>${tierInfo.description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="stack-content">
        <div class="container stack-layout">
          <nav class="supplement-sidebar">
            <div class="sidebar-nav">
              <h4 class="sidebar-nav__title">Contents</h4>
              <ul class="sidebar-nav__list">
                <li><a href="#overview" class="sidebar-nav__link">Overview</a></li>
                <li><a href="#timeline" class="sidebar-nav__link">Daily Timeline</a></li>
                ${stack.blocks.map((b, i) => `<li><a href="#block-${b.id}" class="sidebar-nav__link sidebar-nav__link--indent">${SI(b.icon + ' ', '[' + (i + 1) + '] ')}${b.name.split(' (')[0]}</a></li>`).join('')}
                <li><a href="#synergies" class="sidebar-nav__link">Synergies</a></li>
                <li><a href="#potency" class="sidebar-nav__link">Category Potency</a></li>
                <li><a href="#evidence" class="sidebar-nav__link">Evidence Assessment</a></li>
                <li><a href="#warnings" class="sidebar-nav__link">Warnings</a></li>
                <li><a href="#references" class="sidebar-nav__link">References</a></li>
              </ul>
            </div>

            <div class="sidebar-quickfacts">
              <h4 class="sidebar-quickfacts__title">Stack Overview</h4>
              <div class="sidebar-quickfacts__item">
                <span class="sidebar-quickfacts__label">Evidence Tier</span>
                <span class="sidebar-quickfacts__value" style="color: ${tierInfo.color}">${tierInfo.tier} — ${tierInfo.label}</span>
              </div>
              <div class="sidebar-quickfacts__item">
                <span class="sidebar-quickfacts__label">Supplements</span>
                <span class="sidebar-quickfacts__value">${totalItems}</span>
              </div>
              <div class="sidebar-quickfacts__item">
                <span class="sidebar-quickfacts__label">Synergies</span>
                <span class="sidebar-quickfacts__value">${stack.synergies.length} identified</span>
              </div>
              ${stack.costEstimate ? `
              <div class="sidebar-quickfacts__item">
                <span class="sidebar-quickfacts__label">Est. Cost</span>
                <span class="sidebar-quickfacts__value">€${stack.costEstimate.monthlyLow}–${stack.costEstimate.monthlyHigh}/mo</span>
              </div>
              ` : ''}
            </div>
          </nav>

          <main class="supplement-main">
            ${renderSection('overview', 'Overview', `
              <p>${stack.description}</p>
              ${stack.targetAudience ? `<p class="stack-target"><strong>Target Audience:</strong> ${stack.targetAudience}</p>` : ''}
            `)}

            ${renderStackTimeline(stack.blocks, supplements)}
            ${renderStackBlocks(stack.blocks, supplements)}
            ${renderSynergiesSection(stack.synergies)}
            ${renderCategoryPotency(stack.categoryPotency, categories)}
            ${renderEvidenceAssessment(stack.evidenceAssessment)}
            ${renderStackWarnings(stack.warnings)}
            ${renderReferencesSection(stack.references)}
          </main>
        </div>
      </div>
    `;
  }

  function renderStackTimeline(blocks, supplements) {
    const timelineHtml = blocks.map((block, index) => `
      <div class="timeline-block">
        <div class="timeline-block__marker">
          <span class="timeline-block__icon">${SI(block.icon, '[' + (index + 1) + ']')}</span>
          ${index < blocks.length - 1 ? '<div class="timeline-block__line"></div>' : ''}
        </div>
        <div class="timeline-block__content">
          <a href="#block-${block.id}" class="timeline-block__link">
            <h4 class="timeline-block__name">${block.name}</h4>
            <span class="timeline-block__timing">${block.timing}</span>
            <div class="timeline-block__pills">
              ${block.items.map(item => {
                const isLinked = item.supplementId !== null;
                return `<span class="timeline-pill ${isLinked ? 'timeline-pill--linked' : ''}">${item.name.split(' (')[0]}</span>`;
              }).join('')}
            </div>
          </a>
        </div>
      </div>
    `).join('');

    return renderSection('timeline', 'Daily Timeline', `<div class="stack-timeline">${timelineHtml}</div>`);
  }

  function renderStackBlocks(blocks, supplements) {
    return blocks.map((block, index) => {
      const itemsHtml = block.items.map(item => {
        const linkedClass = item.supplementId ? 'stack-item--linked' : '';
        const linkStart = item.supplementId ? `<a href="supplement.html?id=${item.supplementId}" class="stack-item__link">` : '';
        const linkEnd = item.supplementId ? '</a>' : '';

        return `
          <div class="stack-item ${linkedClass}">
            <div class="stack-item__header">
              <h4 class="stack-item__name">${linkStart}${item.name}${linkEnd}</h4>
              <span class="stack-item__dose">${item.dose}</span>
            </div>
            <p class="stack-item__role">${item.role}</p>
            ${item.supplementId ? `<span class="stack-item__view">View full profile →</span>` : ''}
          </div>
        `;
      }).join('');

      return `
        <section id="block-${block.id}" class="content-section stack-block">
          <div class="stack-block__header">
            <span class="stack-block__icon">${SI(block.icon, '[' + (index + 1) + ']')}</span>
            <div>
              <h2 class="content-section__title">${block.name}</h2>
              <p class="stack-block__timing">${block.timing}</p>
            </div>
          </div>
          <div class="stack-block__rationale">
            <h4>Why this timing?</h4>
            <p>${block.rationale}</p>
          </div>
          <div class="stack-block__items">
            ${itemsHtml}
          </div>
        </section>
      `;
    }).join('');
  }

  function renderSynergiesSection(synergies) {
    if (!synergies || synergies.length === 0) return '';

    const strengthColors = {
      strong: '#4CAF50',
      moderate: '#FF9800',
      emerging: '#2196F3'
    };

    const html = synergies.map(syn => {
      const color = strengthColors[syn.strength] || '#8B949E';
      return `
        <div class="synergy-card" style="--synergy-color: ${color}">
          <div class="synergy-card__header">
            <div class="synergy-card__supplements">
              ${syn.supplements.map(s => `<span class="synergy-card__pill">${s}</span>`).join('<span class="synergy-card__connector">+</span>')}
            </div>
            <div class="synergy-card__badges">
              <span class="synergy-card__strength">${syn.strength}</span>
              <span class="synergy-card__evidence">${syn.evidenceLevel} evidence</span>
            </div>
          </div>
          <span class="synergy-card__type">${syn.type.replace(/-/g, ' ')}</span>
          <p class="synergy-card__description">${syn.description}</p>
          <div class="synergy-card__mechanism">
            <strong>Mechanism:</strong> ${syn.mechanism}
          </div>
        </div>
      `;
    }).join('');

    return renderSection('synergies', `Synergies (${synergies.length})`, `<div class="synergies-grid">${html}</div>`);
  }

  function renderCategoryPotency(potencies, categories) {
    if (!potencies || potencies.length === 0) return '';

    const html = potencies.map(cp => {
      const cat = categories.find(c => c.id === cp.categoryId);
      const icon = cat ? cat.icon : '';
      const name = cat ? cat.name : cp.categoryId;
      const color = cat ? cat.color : '#8B949E';
      const pct = (cp.rating / cp.maxRating) * 100;

      return `
        <div class="potency-row">
          <div class="potency-row__label">
            ${SI(icon + ' ', '')}<span class="potency-row__name">${name}</span>
          </div>
          <div class="potency-row__bar-container">
            <div class="potency-row__bar" style="width: ${pct}%; background: ${color}"></div>
          </div>
          <span class="potency-row__score">${cp.rating}/${cp.maxRating}</span>
          <p class="potency-row__rationale">${cp.rationale}</p>
        </div>
      `;
    }).join('');

    return renderSection('potency', 'Category Potency', `<div class="potency-grid">${html}</div>`);
  }

  function renderEvidenceAssessment(assessment) {
    if (!assessment) return '';

    const tierInfo = EvidenceScoring.getTier(assessment.overallScore);

    const html = `
      <div class="stack-evidence">
        <div class="stack-evidence__header">
          <div class="evidence-badge" style="--badge-color: ${tierInfo.color}; --badge-bg: ${tierInfo.bgColor}">
            <span class="evidence-badge__tier">${assessment.overallTier}</span>
            <span class="evidence-badge__score">${assessment.overallScore}</span>
          </div>
          <div class="stack-evidence__meta">
            <h3>${assessment.overallLabel}</h3>
            <p>${assessment.rationale}</p>
          </div>
        </div>

        <div class="stack-evidence__columns">
          <div class="stack-evidence__col stack-evidence__col--strong">
            <h4>${SI('✅ ', '[+] ')}Strongest Components</h4>
            <ul>
              ${assessment.strongestComponents.map(c => `<li>${c}</li>`).join('')}
            </ul>
          </div>
          <div class="stack-evidence__col stack-evidence__col--weak">
            <h4>${SI('⚠️ ', '[!] ')}Weakest Components</h4>
            <ul>
              ${assessment.weakestComponents.map(c => `<li>${c}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;

    return renderSection('evidence', 'Evidence Assessment', html);
  }

  function renderStackWarnings(warnings) {
    if (!warnings || warnings.length === 0) return '';

    const html = `
      <div class="stack-warnings">
        ${warnings.map(w => `
          <div class="stack-warning">
            <span class="stack-warning__icon">${SI('⚠️', '[!]')}</span>
            <p class="stack-warning__text">${w}</p>
          </div>
        `).join('')}
      </div>
    `;

    return renderSection('warnings', 'Warnings & Contraindications', html);
  }

  return {
    homePage,
    categoryPage,
    supplementPage,
    supplementList,
    evidenceBadge,
    evidenceBar,
    evidenceDetail,
    evidenceTierExplainer,
    stackCard,
    stacksSection,
    stackPage
  };

})();
