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
    return `<a href="category.html?id=${cat.id}" class="category-tag" style="--cat-color: ${cat.color}">${cat.icon} ${cat.name}</a>`;
  }

  // ──────────────────────────────
  // HOME PAGE
  // ──────────────────────────────

  function homePage(categories, supplements) {
    const categoryCards = categories.map(cat => {
      const catSupplements = supplements.filter(s => s.categories.includes(cat.id));
      const sortedByEvidence = EvidenceScoring.sortByEvidence(catSupplements);
      const topSupplements = sortedByEvidence.slice(0, 3);

      return `
        <a href="category.html?id=${cat.id}" class="category-card" style="--cat-color: ${cat.color}">
          <div class="category-card__icon">${cat.icon}</div>
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
                return cat ? `<span class="supplement-row__cat" style="--cat-color: ${cat.color}">${cat.icon} ${cat.name}</span>` : '';
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
          <div class="category-hero__icon">${category.icon}</div>
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
              🔬 Evidence Strength
            </button>
            <button class="sort-btn ${sortMode === 'alpha' ? 'sort-btn--active' : ''}" data-sort="alpha">
              🔤 Alphabetical
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
          ${form.recommended ? '<span class="form-card__badge">✓ Recommended</span>' : ''}
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
          <div class="finding__quality">${f.quality === 'high' ? '⬆ High Quality' : '◆ Moderate Quality'}</div>
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

  return {
    homePage,
    categoryPage,
    supplementPage,
    supplementList,
    evidenceBadge,
    evidenceBar,
    evidenceDetail,
    evidenceTierExplainer
  };

})();
