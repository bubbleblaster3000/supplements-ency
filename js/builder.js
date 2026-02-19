/**
 * Stack Builder Module
 * 
 * Interactive custom stack builder that analyzes supplement combinations
 * for synergies, risks, category coverage, and evidence quality.
 * Persists user stacks to localStorage.
 */

const StackBuilder = (() => {

  // ──────────────────────────────
  // STATE
  // ──────────────────────────────

  let allSupplements = [];
  let allCategories = [];
  let selectedSupplements = []; // array of { supplement, customDose? }
  let savedStacks = [];
  let currentStackName = '';
  let currentStackId = null;

  const STORAGE_KEY = 'supplementsEncy_customStacks';

  // ──────────────────────────────
  // KNOWN SYNERGY DATABASE
  // Built from research + existing stack data
  // ──────────────────────────────

  const SYNERGY_DB = [
    {
      ids: ['nac', 'glycine'],
      name: 'GlyNAC Protocol',
      type: 'biochemical-synergy',
      strength: 'strong',
      evidenceLevel: 'strong',
      description: 'NAC provides cysteine and glycine provides the other key substrate for glutathione (GSH) synthesis — the body\'s master antioxidant. This is the basis of the GlyNAC protocol, which has shown remarkable results in aging studies.',
      mechanism: 'Glutathione = γ-glutamyl-cysteinyl-glycine. NAC → cysteine (rate-limiting). Glycine is the final amino acid. Co-supplementation ensures neither substrate is limiting.'
    },
    {
      ids: ['vitamin-d3-k2', 'magnesium'],
      name: 'Vitamin D Activation Triad',
      type: 'cofactor-dependency',
      strength: 'strong',
      evidenceLevel: 'strong',
      description: 'Magnesium is required for the enzymatic activation of vitamin D — specifically CYP27B1 that converts 25(OH)D to active 1,25(OH)₂D. K2 directs calcium mobilized by active vitamin D to bones rather than arteries.',
      mechanism: 'Mg²⁺ is a cofactor for CYP27B1 (1α-hydroxylase) and CYP2R1 (25-hydroxylase). K2 activates osteocalcin and matrix GLA protein.'
    },
    {
      ids: ['magnesium', 'taurine', 'glycine'],
      name: 'GABAergic Convergence',
      type: 'GABAergic-convergence',
      strength: 'moderate',
      evidenceLevel: 'moderate',
      description: 'All three converge on inhibitory neurotransmission. Magnesium blocks NMDA receptors and potentiates GABA-A. Taurine activates GABA-A and glycine receptors. Glycine activates inhibitory glycine receptors.',
      mechanism: 'Mg²⁺ → NMDA blockade + GABA-A PAM. Taurine → GABA-A + GlyR agonism. Glycine → GlyR agonism. Net: enhanced inhibitory tone.'
    },
    {
      ids: ['magnesium', 'taurine'],
      name: 'Dual Inhibitory Support',
      type: 'GABAergic-synergy',
      strength: 'moderate',
      evidenceLevel: 'moderate',
      description: 'Magnesium and taurine both enhance inhibitory neurotransmission through complementary mechanisms — NMDA blockade and GABA-A agonism respectively.',
      mechanism: 'Mg²⁺ → NMDA blockade. Taurine → GABA-A agonism. Combined: reduced neuronal excitability.'
    },
    {
      ids: ['magnesium', 'glycine'],
      name: 'Relaxation & Sleep Support',
      type: 'complementary-mechanisms',
      strength: 'moderate',
      evidenceLevel: 'moderate',
      description: 'Magnesium promotes relaxation via NMDA antagonism and GABA potentiation. Glycine lowers core body temperature via peripheral vasodilation to accelerate sleep onset.',
      mechanism: 'Mg²⁺ → neural inhibition. Glycine → thermoregulatory sleep onset. Different endpoints, complementary sleep benefits.'
    },
    {
      ids: ['curcumin', 'omega-3'],
      name: 'Anti-Inflammatory Convergence',
      type: 'anti-inflammatory-convergence',
      strength: 'strong',
      evidenceLevel: 'strong',
      description: 'Curcumin inhibits NF-κB and COX-2 (upstream inflammatory switches). Omega-3 fatty acids serve as substrates for specialized pro-resolving mediators (SPMs) that actively resolve inflammation.',
      mechanism: 'Curcumin → NF-κB inhibition + COX-2 downregulation. EPA/DHA → SPM biosynthesis → active resolution. Combined: suppress + resolve.'
    },
    {
      ids: ['l-tyrosine', 'elvanse'],
      name: 'Dopamine Substrate Replenishment',
      type: 'substrate-replenishment',
      strength: 'strong',
      evidenceLevel: 'moderate',
      description: 'Elvanse promotes dopamine release and blocks reuptake, depleting presynaptic stores. L-Tyrosine provides the rate-limiting precursor for dopamine biosynthesis.',
      mechanism: 'Tyrosine hydroxylase converts L-Tyrosine to L-DOPA → Dopamine. Amphetamines increase dopamine turnover, making substrate availability rate-limiting.'
    },
    {
      ids: ['l-tyrosine', 'ritalin'],
      name: 'Dopamine Precursor Support',
      type: 'substrate-replenishment',
      strength: 'moderate',
      evidenceLevel: 'moderate',
      description: 'Ritalin blocks dopamine reuptake, increasing synaptic dopamine. L-Tyrosine ensures adequate dopamine precursor availability to maintain synthesis rates.',
      mechanism: 'Methylphenidate → DAT blockade → increased synaptic DA. Tyrosine → dopamine synthesis substrate.'
    },
    {
      ids: ['ashwagandha', 'magnesium'],
      name: 'HPA Axis Modulation',
      type: 'HPA-axis-modulation',
      strength: 'moderate',
      evidenceLevel: 'moderate',
      description: 'Ashwagandha reduces cortisol via HPA axis modulation (14–28% reduction). Magnesium independently modulates the HPA axis and reduces stress-related cortisol.',
      mechanism: 'Ashwagandha withanolides → hypothalamic-pituitary cortisol modulation. Mg²⁺ → normalizes ACTH sensitivity. Combined: multi-level HPA buffering.'
    },
    {
      ids: ['myo-inositol', 'magnesium'],
      name: 'Anxiolytic Synergy',
      type: 'anxiolytic-synergy',
      strength: 'moderate',
      evidenceLevel: 'moderate',
      description: 'Myo-inositol normalizes serotonin receptor signaling (5-HT₂ second messenger). Magnesium reduces neuronal excitability via NMDA blockade. Together they address anxiety from two angles.',
      mechanism: 'Inositol → PI/PIP2/IP3 cycle → 5-HT₂ receptor normalization. Mg²⁺ → NMDA blockade → reduced glutamatergic overactivation.'
    },
    {
      ids: ['trazodone', 'melatonin'],
      name: 'Complementary Sleep Mechanisms',
      type: 'complementary-sleep-mechanisms',
      strength: 'strong',
      evidenceLevel: 'strong',
      description: 'Melatonin signals sleep onset via the SCN. Trazodone improves sleep maintenance via 5-HT₂A antagonism and increases slow-wave sleep. Together they address onset and continuity.',
      mechanism: 'Melatonin → MT1/MT2 activation → circadian phase advance. Trazodone → 5-HT₂A antagonism → deep sleep enhancement.'
    },
    {
      ids: ['creatine-monohydrate', 'magnesium'],
      name: 'ATP Production Support',
      type: 'energy-metabolism',
      strength: 'moderate',
      evidenceLevel: 'moderate',
      description: 'Creatine regenerates ATP via the phosphocreatine system. Magnesium is a cofactor in over 300 ATP-dependent reactions and is required for ATP to be biologically active (Mg-ATP complex).',
      mechanism: 'Creatine → PCr → ATP regeneration. Mg²⁺ → ATP cofactor (Mg-ATP complex required for kinase activity).'
    },
    {
      ids: ['creatine-monohydrate', 'omega-3'],
      name: 'Neuroprotective Stack',
      type: 'neuroprotective-synergy',
      strength: 'moderate',
      evidenceLevel: 'emerging',
      description: 'Creatine supports neuronal ATP regeneration. Omega-3 DHA maintains neuronal membrane fluidity and supports synaptic function. Together they protect neurons from multiple angles.',
      mechanism: 'Creatine → brain ATP buffering. DHA → membrane phospholipid integration → synaptic health.'
    },
    {
      ids: ['berberine', 'gn-digestive-enzymes'],
      name: 'Metabolic Optimization',
      type: 'metabolic-optimization',
      strength: 'moderate',
      evidenceLevel: 'moderate',
      description: 'Berberine activates AMPK for glucose uptake but can alter gut motility. Digestive enzymes ensure macronutrient absorption remains efficient despite berberine\'s GI effects.',
      mechanism: 'Berberine → AMPK → GLUT4 → glucose clearance. Enzymes → mechanical nutrient breakdown → optimal absorption.'
    },
    {
      ids: ['elvanse', 'huperzine-a'],
      name: 'Dual Neurotransmitter Enhancement',
      type: 'dual-neurotransmitter',
      strength: 'moderate',
      evidenceLevel: 'emerging',
      description: 'Elvanse enhances dopaminergic/noradrenergic signaling. Huperzine A boosts acetylcholine. This dual approach targets both motivational (DA) and attentional (ACh) cognitive dimensions.',
      mechanism: 'Dopaminergic (Elvanse) + cholinergic (Huperzine A) = complementary frontal executive + hippocampal memory activation.'
    },
    {
      ids: ['coenzyme-q10', 'omega-3'],
      name: 'Mitochondrial & Membrane Support',
      type: 'cellular-health',
      strength: 'moderate',
      evidenceLevel: 'moderate',
      description: 'CoQ10 supports mitochondrial electron transport and energy production. Omega-3 maintains cell membrane fluidity and integrity. Together they support cellular health at both the energy and structural level.',
      mechanism: 'CoQ10 → ETC Complex I/III → ATP production. DHA/EPA → membrane phospholipid integration → fluidity.'
    },
    {
      ids: ['lions-mane', 'huperzine-a'],
      name: 'Cholinergic & Neurotrophic Stack',
      type: 'cognitive-synergy',
      strength: 'moderate',
      evidenceLevel: 'emerging',
      description: 'Lion\'s Mane stimulates NGF (nerve growth factor) production for long-term neuronal health. Huperzine A acutely boosts acetylcholine. Together: acute cognitive enhancement + long-term neuroprotection.',
      mechanism: 'Lion\'s Mane hericenones/erinacines → NGF synthesis → neuronal growth. Huperzine A → AChE inhibition → acute ACh increase.'
    },
    {
      ids: ['lions-mane', 'omega-3'],
      name: 'Brain Structure & Growth',
      type: 'neurotrophic-synergy',
      strength: 'moderate',
      evidenceLevel: 'emerging',
      description: 'Lion\'s Mane promotes NGF and neuronal growth. Omega-3 DHA provides the structural building blocks (phospholipids) for new neuronal membranes. Growth factor + building material.',
      mechanism: 'Lion\'s Mane → NGF → neurogenesis signal. DHA → phospholipid substrate for new membrane synthesis.'
    },
    {
      ids: ['ashwagandha', 'l-tyrosine'],
      name: 'Stress-Resilient Performance',
      type: 'adaptogenic-synergy',
      strength: 'moderate',
      evidenceLevel: 'moderate',
      description: 'Ashwagandha reduces cortisol and stress response. L-Tyrosine maintains catecholamine levels under stress. Together: stress resilience + maintained cognitive performance under pressure.',
      mechanism: 'Ashwagandha → cortisol reduction via HPA modulation. Tyrosine → catecholamine availability under stress-induced depletion.'
    },
    {
      ids: ['nac', 'coenzyme-q10'],
      name: 'Antioxidant & Mitochondrial Synergy',
      type: 'cellular-defense',
      strength: 'moderate',
      evidenceLevel: 'moderate',
      description: 'NAC boosts glutathione (cytoplasmic antioxidant). CoQ10 protects mitochondrial membranes from oxidative damage. Together: comprehensive cellular antioxidant defense at two compartments.',
      mechanism: 'NAC → cysteine → glutathione → cytoplasmic ROS scavenging. CoQ10 → mitochondrial membrane antioxidant → lipid peroxidation prevention.'
    },
    {
      ids: ['creatine-monohydrate', 'l-tyrosine'],
      name: 'Cognitive Energy Stack',
      type: 'cognitive-energy',
      strength: 'moderate',
      evidenceLevel: 'emerging',
      description: 'Creatine supports brain ATP regeneration for cognitive endurance. L-Tyrosine provides dopamine precursors for sustained attention. Together: energy + neurotransmitter support for mental performance.',
      mechanism: 'Creatine → brain PCr → ATP regeneration under cognitive demand. Tyrosine → dopamine synthesis → sustained attentional resources.'
    }
  ];

  // ──────────────────────────────
  // DATA LOADING
  // ──────────────────────────────

  async function loadData() {
    const [catResult, suppResult] = await Promise.all([
      fetch('data/categories.json').then(r => r.json()),
      fetch('data/supplements.json').then(r => r.json())
    ]);
    allCategories = catResult.categories;
    allSupplements = suppResult.supplements;
  }

  // ──────────────────────────────
  // LOCALSTORAGE
  // ──────────────────────────────

  function loadSavedStacks() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      savedStacks = data ? JSON.parse(data) : [];
    } catch {
      savedStacks = [];
    }
  }

  function saveSavedStacks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStacks));
  }

  function saveCurrentStack(name) {
    if (!name || selectedSupplements.length === 0) return;

    const stack = {
      id: currentStackId || `custom-${Date.now()}`,
      name: name,
      supplementIds: selectedSupplements.map(s => s.supplement.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingIndex = savedStacks.findIndex(s => s.id === stack.id);
    if (existingIndex >= 0) {
      stack.createdAt = savedStacks[existingIndex].createdAt;
      savedStacks[existingIndex] = stack;
    } else {
      savedStacks.push(stack);
    }

    currentStackId = stack.id;
    currentStackName = name;
    saveSavedStacks();
    renderPage();
  }

  function loadStack(stackId) {
    const stack = savedStacks.find(s => s.id === stackId);
    if (!stack) return;

    selectedSupplements = [];
    stack.supplementIds.forEach(id => {
      const supp = allSupplements.find(s => s.id === id);
      if (supp) selectedSupplements.push({ supplement: supp });
    });

    currentStackId = stack.id;
    currentStackName = stack.name;
    renderPage();
  }

  function deleteStack(stackId) {
    savedStacks = savedStacks.filter(s => s.id !== stackId);
    if (currentStackId === stackId) {
      currentStackId = null;
      currentStackName = '';
      selectedSupplements = [];
    }
    saveSavedStacks();
    renderPage();
  }

  // ──────────────────────────────
  // SUPPLEMENT SELECTION
  // ──────────────────────────────

  function addSupplement(supplementId) {
    if (selectedSupplements.some(s => s.supplement.id === supplementId)) return;
    const supp = allSupplements.find(s => s.id === supplementId);
    if (!supp) return;
    selectedSupplements.push({ supplement: supp });
    renderPage();
  }

  function removeSupplement(supplementId) {
    selectedSupplements = selectedSupplements.filter(s => s.supplement.id !== supplementId);
    renderPage();
  }

  function clearAll() {
    selectedSupplements = [];
    currentStackId = null;
    currentStackName = '';
    renderPage();
  }

  // ──────────────────────────────
  // ANALYSIS ENGINE
  // ──────────────────────────────

  function analyzeStack() {
    if (selectedSupplements.length === 0) return null;

    const supplements = selectedSupplements.map(s => s.supplement);

    return {
      categoryCoverage: analyzeCategoryCoverage(supplements),
      synergies: detectSynergies(supplements),
      interactions: detectInteractions(supplements),
      benefits: aggregateBenefits(supplements),
      sideEffects: aggregateSideEffects(supplements),
      evidence: aggregateEvidence(supplements),
      warnings: generateWarnings(supplements),
      dosageSummary: generateDosageSummary(supplements),
      costEstimate: null // could be extended
    };
  }

  function analyzeCategoryCoverage(supplements) {
    const coverage = {};

    // Count how many supplements contribute to each category
    allCategories.forEach(cat => {
      const contributing = supplements.filter(s => s.categories.includes(cat.id));
      if (contributing.length > 0) {
        // Calculate a potency score: more contributions + higher evidence = higher score
        let score = 0;
        contributing.forEach(s => {
          const evidence = EvidenceScoring.calculateScore(s.evidence);
          // Base contribution: 2 points per supplement, +0-3 bonus for evidence quality
          score += 2 + (evidence / 33); // evidence 0-100 → bonus 0-3
        });
        // Cap at 10
        const rating = Math.min(10, Math.round(score));

        coverage[cat.id] = {
          category: cat,
          rating: rating,
          maxRating: 10,
          supplements: contributing.map(s => s.name),
          count: contributing.length
        };
      }
    });

    return coverage;
  }

  function detectSynergies(supplements) {
    const ids = new Set(supplements.map(s => s.id));
    const found = [];

    SYNERGY_DB.forEach(synergy => {
      const matchCount = synergy.ids.filter(id => ids.has(id)).length;
      if (matchCount === synergy.ids.length) {
        found.push({
          ...synergy,
          supplementNames: synergy.ids.map(id => {
            const s = supplements.find(sup => sup.id === id);
            return s ? s.name : id;
          })
        });
      }
    });

    return found;
  }

  function detectInteractions(supplements) {
    const interactions = [];
    const seen = new Set();

    supplements.forEach(supp => {
      if (!supp.interactions) return;
      supp.interactions.forEach(interaction => {
        // Check if the interacting substance is in our selected supplements
        const matchedSupp = supplements.find(s =>
          s.id !== supp.id && (
            s.name.toLowerCase().includes(interaction.substance.toLowerCase()) ||
            s.aliases.some(a => a.toLowerCase().includes(interaction.substance.toLowerCase())) ||
            interaction.substance.toLowerCase().includes(s.name.toLowerCase()) ||
            interaction.substance.toLowerCase().includes(s.name.split(' ')[0].toLowerCase())
          )
        );

        if (matchedSupp) {
          const key = [supp.id, matchedSupp.id].sort().join(':') + ':' + interaction.substance;
          if (!seen.has(key)) {
            seen.add(key);
            interactions.push({
              from: supp.name,
              to: matchedSupp.name,
              substance: interaction.substance,
              effect: interaction.effect,
              severity: interaction.severity
            });
          }
        }
      });
    });

    // Sort by severity (severe first)
    const severityOrder = { severe: 0, moderate: 1, mild: 2 };
    interactions.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

    return interactions;
  }

  function aggregateBenefits(supplements) {
    const benefitMap = {};
    supplements.forEach(supp => {
      supp.benefits.forEach(benefit => {
        // Use first 40 chars as a rough dedup key
        const key = benefit.substring(0, 40).toLowerCase();
        if (!benefitMap[key]) {
          benefitMap[key] = { text: benefit, sources: [supp.name] };
        } else {
          if (!benefitMap[key].sources.includes(supp.name)) {
            benefitMap[key].sources.push(supp.name);
          }
        }
      });
    });
    return Object.values(benefitMap);
  }

  function aggregateSideEffects(supplements) {
    const effectMap = {};
    supplements.forEach(supp => {
      supp.sideEffects.forEach(effect => {
        const key = effect.substring(0, 40).toLowerCase();
        if (!effectMap[key]) {
          effectMap[key] = { text: effect, sources: [supp.name] };
        } else {
          if (!effectMap[key].sources.includes(supp.name)) {
            effectMap[key].sources.push(supp.name);
          }
        }
      });
    });
    return Object.values(effectMap);
  }

  function aggregateEvidence(supplements) {
    // Compute composite evidence score (weighted average by supplement quality)
    let totalScore = 0;
    let totalStudies = 0;
    let totalHuman = 0;
    let totalRCTs = 0;
    let totalMeta = 0;
    let totalSR = 0;

    const tiers = { S: 0, A: 0, B: 0, C: 0, D: 0 };

    supplements.forEach(supp => {
      const assessment = EvidenceScoring.assess(supp.evidence);
      totalScore += assessment.score;
      totalStudies += supp.evidence.totalStudies || 0;
      totalHuman += supp.evidence.humanStudies || 0;
      totalRCTs += supp.evidence.rcts || 0;
      totalMeta += supp.evidence.metaAnalyses || 0;
      totalSR += supp.evidence.systematicReviews || 0;
      tiers[assessment.tier] = (tiers[assessment.tier] || 0) + 1;
    });

    const avgScore = supplements.length > 0 ? Math.round(totalScore / supplements.length) : 0;
    const tierInfo = EvidenceScoring.getTier(avgScore);

    // Find strongest and weakest
    const sorted = [...supplements].sort((a, b) =>
      EvidenceScoring.calculateScore(b.evidence) - EvidenceScoring.calculateScore(a.evidence)
    );
    const strongest = sorted.slice(0, 3).map(s => ({
      name: s.name,
      assessment: EvidenceScoring.assess(s.evidence)
    }));
    const weakest = sorted.slice(-3).reverse().map(s => ({
      name: s.name,
      assessment: EvidenceScoring.assess(s.evidence)
    }));

    return {
      avgScore,
      tierInfo,
      tiers,
      totals: { totalStudies, totalHuman, totalRCTs, totalMeta, totalSR },
      strongest,
      weakest,
      individualScores: supplements.map(s => ({
        name: s.name,
        id: s.id,
        assessment: EvidenceScoring.assess(s.evidence)
      }))
    };
  }

  function generateWarnings(supplements) {
    const warnings = [];

    // Check for prescription medications
    const meds = supplements.filter(s => s.categories.includes('medication'));
    if (meds.length > 0) {
      warnings.push({
        severity: 'severe',
        text: `This stack contains ${meds.length} prescription medication${meds.length > 1 ? 's' : ''} (${meds.map(m => m.name).join(', ')}). Always consult a physician before combining supplements with prescription drugs.`
      });
    }

    // Check for severe interactions
    const interactions = detectInteractions(supplements);
    const severeInteractions = interactions.filter(i => i.severity === 'severe');
    severeInteractions.forEach(i => {
      warnings.push({
        severity: 'severe',
        text: `Severe interaction: ${i.from} × ${i.to} — ${i.effect}`
      });
    });

    // Check for multiple cholinergics
    const cholinergics = supplements.filter(s =>
      s.id === 'huperzine-a' || s.mechanismOfAction.toLowerCase().includes('acetylcholinesterase')
    );
    if (cholinergics.length > 1) {
      warnings.push({
        severity: 'moderate',
        text: `Multiple cholinergic compounds detected (${cholinergics.map(c => c.name).join(', ')}). Monitor for cholinergic side effects (GI discomfort, headache).`
      });
    }

    // Check for multiple stimulants
    const stimulants = supplements.filter(s =>
      ['elvanse', 'ritalin'].includes(s.id)
    );
    if (stimulants.length > 1) {
      warnings.push({
        severity: 'severe',
        text: `Multiple stimulant medications detected (${stimulants.map(c => c.name).join(', ')}). Never combine stimulant medications without explicit medical supervision.`
      });
    }

    // Check for serotonergic combinations
    const serotonergics = supplements.filter(s =>
      s.id === 'trazodone' || s.mechanismOfAction.toLowerCase().includes('serotonin') ||
      s.mechanismOfAction.toLowerCase().includes('5-ht')
    );
    if (serotonergics.length > 2) {
      warnings.push({
        severity: 'moderate',
        text: `Multiple serotonergic compounds detected (${serotonergics.map(c => c.name).join(', ')}). Monitor for potential serotonergic effects when combining.`
      });
    }

    // General warning if stack is large
    if (supplements.length > 10) {
      warnings.push({
        severity: 'mild',
        text: `This is a large stack (${supplements.length} supplements). Consider starting with core components and adding others gradually to identify individual responses and tolerance.`
      });
    }

    return warnings;
  }

  function generateDosageSummary(supplements) {
    return supplements.map(supp => ({
      name: supp.name,
      id: supp.id,
      standard: supp.dosage.standard,
      optimal: supp.dosage.optimal,
      timing: supp.dosage.timing
    }));
  }

  // ──────────────────────────────
  // RENDERING
  // ──────────────────────────────

  function renderPage() {
    const container = document.getElementById('app');
    const analysis = analyzeStack();

    container.innerHTML = `
      <section class="builder-hero">
        <div class="container">
          <nav class="breadcrumb">
            <a href="index.html">Home</a>
            <span class="breadcrumb__sep">›</span>
            <span>Stack Builder</span>
          </nav>
          <h1 class="builder-hero__title">🛠️ Custom Stack Builder</h1>
          <p class="builder-hero__subtitle">
            Select supplements from the encyclopedia database to build and analyze your own custom stack.
            Get instant synergy detection, risk analysis, category coverage, and evidence scoring.
          </p>
        </div>
      </section>

      <div class="builder-content">
        <div class="container builder-layout">
          <!-- Left: Supplement Picker -->
          <div class="builder-picker">
            <div class="builder-picker__header">
              <h2 class="builder-picker__title">Add Supplements</h2>
              <div class="builder-picker__search-wrap">
                <span class="builder-picker__search-icon">🔍</span>
                <input 
                  type="text" 
                  id="builder-search" 
                  class="builder-picker__search" 
                  placeholder="Search supplements…" 
                  autocomplete="off"
                >
              </div>
            </div>
            <div id="builder-catalog" class="builder-catalog">
              ${renderCatalog('')}
            </div>

            ${renderSavedStacks()}
          </div>

          <!-- Right: Stack & Analysis -->
          <div class="builder-analysis">
            ${renderSelectedSupplements()}
            ${analysis ? renderAnalysis(analysis) : renderEmptyState()}
          </div>
        </div>
      </div>
    `;

    attachEventListeners();
  }

  function renderCatalog(query) {
    const q = query.toLowerCase().trim();
    let filtered = allSupplements;

    if (q.length >= 2) {
      filtered = allSupplements.filter(s => {
        const searchText = [s.name, ...s.aliases, s.tagline, ...s.categories].join(' ').toLowerCase();
        return searchText.includes(q);
      });
    }

    // Group by category
    const selectedIds = new Set(selectedSupplements.map(s => s.supplement.id));

    if (q.length >= 2) {
      // Flat list for search results
      return filtered.map(supp => {
        const isSelected = selectedIds.has(supp.id);
        const assessment = EvidenceScoring.assess(supp.evidence);
        return `
          <div class="catalog-item ${isSelected ? 'catalog-item--selected' : ''}" data-id="${supp.id}">
            <div class="catalog-item__info">
              <span class="catalog-item__tier" style="color: ${assessment.color}">${assessment.tier}</span>
              <span class="catalog-item__name">${supp.name}</span>
            </div>
            <button class="catalog-item__btn ${isSelected ? 'catalog-item__btn--remove' : ''}" 
                    data-action="${isSelected ? 'remove' : 'add'}" data-id="${supp.id}">
              ${isSelected ? '✕' : '+'}
            </button>
          </div>
        `;
      }).join('') || '<p class="builder-empty-search">No supplements match your search.</p>';
    }

    // Grouped by category (default view)
    return allCategories
      .filter(cat => cat.id !== 'medication') // Show medications at the end
      .concat(allCategories.filter(cat => cat.id === 'medication'))
      .map(cat => {
        const catSupps = allSupplements.filter(s => s.categories.includes(cat.id));
        if (catSupps.length === 0) return '';

        const items = catSupps.map(supp => {
          const isSelected = selectedIds.has(supp.id);
          const assessment = EvidenceScoring.assess(supp.evidence);
          return `
            <div class="catalog-item ${isSelected ? 'catalog-item--selected' : ''}" data-id="${supp.id}">
              <div class="catalog-item__info">
                <span class="catalog-item__tier" style="color: ${assessment.color}">${assessment.tier}</span>
                <span class="catalog-item__name">${supp.name}</span>
              </div>
              <button class="catalog-item__btn ${isSelected ? 'catalog-item__btn--remove' : ''}" 
                      data-action="${isSelected ? 'remove' : 'add'}" data-id="${supp.id}">
                ${isSelected ? '✕' : '+'}
              </button>
            </div>
          `;
        }).join('');

        return `
          <div class="catalog-group">
            <h3 class="catalog-group__title" style="--cat-color: ${cat.color}">${cat.icon} ${cat.name}</h3>
            ${items}
          </div>
        `;
      }).join('');
  }

  function renderSavedStacks() {
    if (savedStacks.length === 0) return '';

    const stackItems = savedStacks.map(stack => {
      const isActive = stack.id === currentStackId;
      return `
        <div class="saved-stack ${isActive ? 'saved-stack--active' : ''}" data-stack-id="${stack.id}">
          <div class="saved-stack__info">
            <span class="saved-stack__name">${stack.name}</span>
            <span class="saved-stack__meta">${stack.supplementIds.length} supplements</span>
          </div>
          <div class="saved-stack__actions">
            <button class="saved-stack__btn saved-stack__btn--load" data-action="load" data-stack-id="${stack.id}" title="Load">📂</button>
            <button class="saved-stack__btn saved-stack__btn--delete" data-action="delete" data-stack-id="${stack.id}" title="Delete">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="saved-stacks">
        <h3 class="saved-stacks__title">💾 Saved Stacks</h3>
        ${stackItems}
      </div>
    `;
  }

  function renderSelectedSupplements() {
    if (selectedSupplements.length === 0) return '';

    const pills = selectedSupplements.map(({ supplement: s }) => {
      const assessment = EvidenceScoring.assess(s.evidence);
      return `
        <div class="selected-pill">
          <span class="selected-pill__tier" style="color: ${assessment.color}">${assessment.tier}</span>
          <a href="supplement.html?id=${s.id}" class="selected-pill__name">${s.name}</a>
          <button class="selected-pill__remove" data-action="remove" data-id="${s.id}">✕</button>
        </div>
      `;
    }).join('');

    return `
      <div class="builder-selected">
        <div class="builder-selected__header">
          <h2 class="builder-selected__title">Your Stack (${selectedSupplements.length})</h2>
          <div class="builder-selected__actions">
            <button class="btn btn--sm btn--outline" id="btn-save-stack">💾 Save</button>
            <button class="btn btn--sm btn--outline btn--danger" id="btn-clear-stack">Clear All</button>
          </div>
        </div>
        <div class="builder-selected__pills">
          ${pills}
        </div>
      </div>
    `;
  }

  function renderEmptyState() {
    return `
      <div class="builder-empty">
        <div class="builder-empty__icon">🧪</div>
        <h3 class="builder-empty__title">Start Building Your Stack</h3>
        <p class="builder-empty__text">
          Add supplements from the catalog on the left to see a comprehensive analysis including synergies, 
          interactions, category coverage, and evidence scoring.
        </p>
        <div class="builder-empty__hints">
          <div class="builder-empty__hint">💡 Click <strong>+</strong> next to any supplement to add it</div>
          <div class="builder-empty__hint">🔗 Synergies are automatically detected between your selections</div>
          <div class="builder-empty__hint">⚠️ Interactions and risks are flagged in real-time</div>
          <div class="builder-empty__hint">💾 Save your stacks for later — they persist in your browser</div>
        </div>
      </div>
    `;
  }

  function renderAnalysis(analysis) {
    return `
      ${renderCategoryRadar(analysis.categoryCoverage)}
      ${renderSynergies(analysis.synergies)}
      ${renderRisks(analysis.interactions, analysis.warnings)}
      ${renderEvidenceOverview(analysis.evidence)}
      ${renderBenefitsList(analysis.benefits)}
      ${renderSideEffectsList(analysis.sideEffects)}
      ${renderDosageGuide(analysis.dosageSummary)}
    `;
  }

  function renderCategoryRadar(coverage) {
    const entries = Object.values(coverage);
    if (entries.length === 0) return '';

    // Sort by rating descending
    entries.sort((a, b) => b.rating - a.rating);

    const bars = entries.map(entry => {
      const pct = (entry.rating / entry.maxRating) * 100;
      return `
        <div class="potency-row">
          <div class="potency-row__label">
            <span class="potency-row__icon">${entry.category.icon}</span>
            <span class="potency-row__name">${entry.category.name}</span>
          </div>
          <div class="potency-row__bar-container">
            <div class="potency-row__bar" style="width: ${pct}%; background: ${entry.category.color}"></div>
          </div>
          <span class="potency-row__score">${entry.rating}/${entry.maxRating}</span>
          <p class="potency-row__rationale">${entry.count} supplement${entry.count !== 1 ? 's' : ''}: ${entry.supplements.join(', ')}</p>
        </div>
      `;
    }).join('');

    return `
      <section class="builder-section">
        <h2 class="builder-section__title">📊 Category Coverage</h2>
        <p class="builder-section__subtitle">How this stack performs across each category based on supplement coverage and evidence quality</p>
        <div class="potency-grid">${bars}</div>
      </section>
    `;
  }

  function renderSynergies(synergies) {
    if (synergies.length === 0) {
      return `
        <section class="builder-section">
          <h2 class="builder-section__title">🔗 Synergies (0)</h2>
          <p class="builder-section__empty">No known synergies detected between your selected supplements. Try adding complementary supplements.</p>
        </section>
      `;
    }

    const strengthColors = {
      strong: '#4CAF50',
      moderate: '#FF9800',
      emerging: '#2196F3'
    };

    const cards = synergies.map(syn => {
      const color = strengthColors[syn.strength] || '#8B949E';
      return `
        <div class="synergy-card" style="--synergy-color: ${color}">
          <div class="synergy-card__header">
            <div class="synergy-card__supplements">
              ${syn.supplementNames.map(s => `<span class="synergy-card__pill">${s}</span>`).join('<span class="synergy-card__connector">+</span>')}
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

    return `
      <section class="builder-section">
        <h2 class="builder-section__title">🔗 Synergies (${synergies.length})</h2>
        <p class="builder-section__subtitle">Beneficial interactions detected between your selected supplements</p>
        <div class="synergies-grid">${cards}</div>
      </section>
    `;
  }

  function renderRisks(interactions, warnings) {
    if (interactions.length === 0 && warnings.length === 0) {
      return `
        <section class="builder-section">
          <h2 class="builder-section__title">⚠️ Risks & Interactions (0)</h2>
          <p class="builder-section__empty builder-section__empty--good">✅ No known interactions or risks detected between your selected supplements.</p>
        </section>
      `;
    }

    const warningCards = warnings.map(w => {
      const severityClass = `builder-warning--${w.severity}`;
      return `
        <div class="builder-warning ${severityClass}">
          <span class="builder-warning__icon">${w.severity === 'severe' ? '🚨' : w.severity === 'moderate' ? '⚠️' : 'ℹ️'}</span>
          <p class="builder-warning__text">${w.text}</p>
        </div>
      `;
    }).join('');

    const interactionCards = interactions.map(int => {
      const severityClass = `interaction--${int.severity}`;
      return `
        <div class="interaction ${severityClass}">
          <div class="interaction__header">
            <h4 class="interaction__substance">${int.from} × ${int.to}</h4>
            <span class="interaction__severity">${int.severity.charAt(0).toUpperCase() + int.severity.slice(1)}</span>
          </div>
          <p class="interaction__effect">${int.effect}</p>
        </div>
      `;
    }).join('');

    return `
      <section class="builder-section">
        <h2 class="builder-section__title">⚠️ Risks & Interactions (${interactions.length + warnings.length})</h2>
        ${warnings.length > 0 ? `<div class="builder-warnings">${warningCards}</div>` : ''}
        ${interactions.length > 0 ? `
          <h3 class="builder-section__sub">Known Interactions</h3>
          <div class="interactions-list">${interactionCards}</div>
        ` : ''}
      </section>
    `;
  }

  function renderEvidenceOverview(evidence) {
    const { avgScore, tierInfo, tiers, totals, strongest, weakest, individualScores } = evidence;

    const tierBadges = Object.entries(tiers)
      .filter(([, count]) => count > 0)
      .map(([tier, count]) => {
        const info = EvidenceScoring.getTier(tier === 'S' ? 95 : tier === 'A' ? 80 : tier === 'B' ? 60 : tier === 'C' ? 40 : 15);
        return `<span class="builder-tier-badge" style="--badge-color: ${info.color}; --badge-bg: ${info.bgColor}">${tier} × ${count}</span>`;
      }).join('');

    const scoreRows = individualScores
      .sort((a, b) => b.assessment.score - a.assessment.score)
      .map(s => `
        <div class="builder-evidence-row">
          <span class="builder-evidence-row__tier" style="color: ${s.assessment.color}">${s.assessment.tier}</span>
          <a href="supplement.html?id=${s.id}" class="builder-evidence-row__name">${s.name}</a>
          <div class="builder-evidence-row__bar">
            <div class="evidence-bar">
              <div class="evidence-bar__fill" style="width: ${s.assessment.score}%; background: ${s.assessment.color}"></div>
            </div>
          </div>
          <span class="builder-evidence-row__score">${s.assessment.score}</span>
        </div>
      `).join('');

    return `
      <section class="builder-section">
        <h2 class="builder-section__title">🔬 Evidence Overview</h2>
        <div class="builder-evidence">
          <div class="builder-evidence__summary">
            <div class="evidence-badge" style="--badge-color: ${tierInfo.color}; --badge-bg: ${tierInfo.bgColor}">
              <span class="evidence-badge__tier">${tierInfo.tier}</span>
              <span class="evidence-badge__score">${avgScore}</span>
            </div>
            <div class="builder-evidence__meta">
              <h3>${tierInfo.label}</h3>
              <p>Average evidence score across ${selectedSupplements.length} supplements</p>
              <div class="builder-evidence__tiers">${tierBadges}</div>
            </div>
          </div>
          <div class="builder-evidence__totals">
            <div class="evidence-stat">
              <span class="evidence-stat__value">${totals.totalStudies.toLocaleString()}</span>
              <span class="evidence-stat__label">Total Studies</span>
            </div>
            <div class="evidence-stat">
              <span class="evidence-stat__value">${totals.totalHuman.toLocaleString()}</span>
              <span class="evidence-stat__label">Human Studies</span>
            </div>
            <div class="evidence-stat">
              <span class="evidence-stat__value">${totals.totalRCTs.toLocaleString()}</span>
              <span class="evidence-stat__label">RCTs</span>
            </div>
            <div class="evidence-stat">
              <span class="evidence-stat__value">${totals.totalMeta}</span>
              <span class="evidence-stat__label">Meta-Analyses</span>
            </div>
            <div class="evidence-stat">
              <span class="evidence-stat__value">${totals.totalSR}</span>
              <span class="evidence-stat__label">Systematic Reviews</span>
            </div>
          </div>
          <h3 class="builder-section__sub">Individual Evidence Scores</h3>
          <div class="builder-evidence__individual">${scoreRows}</div>
        </div>
      </section>
    `;
  }

  function renderBenefitsList(benefits) {
    if (benefits.length === 0) return '';

    const items = benefits.map(b => `
      <li class="builder-benefit-item">
        <span class="builder-benefit-item__text">${b.text}</span>
        ${b.sources.length > 0 ? `<span class="builder-benefit-item__sources">via ${b.sources.join(', ')}</span>` : ''}
      </li>
    `).join('');

    return `
      <section class="builder-section">
        <h2 class="builder-section__title">✅ Combined Benefits (${benefits.length})</h2>
        <ul class="builder-benefits-list">${items}</ul>
      </section>
    `;
  }

  function renderSideEffectsList(sideEffects) {
    if (sideEffects.length === 0) return '';

    const items = sideEffects.map(e => `
      <li class="builder-sideeffect-item">
        <span class="builder-sideeffect-item__text">${e.text}</span>
        ${e.sources.length > 0 ? `<span class="builder-sideeffect-item__sources">via ${e.sources.join(', ')}</span>` : ''}
      </li>
    `).join('');

    return `
      <section class="builder-section">
        <h2 class="builder-section__title">⚡ Potential Side Effects (${sideEffects.length})</h2>
        <ul class="builder-sideeffects-list">${items}</ul>
      </section>
    `;
  }

  function renderDosageGuide(dosageSummary) {
    if (dosageSummary.length === 0) return '';

    const rows = dosageSummary.map(d => `
      <div class="builder-dosage-row">
        <div class="builder-dosage-row__header">
          <a href="supplement.html?id=${d.id}" class="builder-dosage-row__name">${d.name}</a>
          <span class="builder-dosage-row__dose">${d.standard}</span>
        </div>
        <div class="builder-dosage-row__details">
          ${d.optimal ? `<span class="builder-dosage-row__optimal"><strong>Optimal:</strong> ${d.optimal}</span>` : ''}
          <span class="builder-dosage-row__timing"><strong>Timing:</strong> ${d.timing}</span>
        </div>
      </div>
    `).join('');

    return `
      <section class="builder-section">
        <h2 class="builder-section__title">💊 Dosage Guide</h2>
        <div class="builder-dosage-list">${rows}</div>
      </section>
    `;
  }

  // ──────────────────────────────
  // EVENT LISTENERS
  // ──────────────────────────────

  function attachEventListeners() {
    // Catalog add/remove buttons
    document.querySelectorAll('.catalog-item__btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if (action === 'add') addSupplement(id);
        else removeSupplement(id);
      });
    });

    // Selected pill remove buttons
    document.querySelectorAll('.selected-pill__remove').forEach(btn => {
      btn.addEventListener('click', () => {
        removeSupplement(btn.dataset.id);
      });
    });

    // Builder search
    const searchInput = document.getElementById('builder-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const catalog = document.getElementById('builder-catalog');
        if (catalog) {
          catalog.innerHTML = renderCatalog(e.target.value);
          // Re-attach catalog listeners
          catalog.querySelectorAll('.catalog-item__btn').forEach(btn => {
            btn.addEventListener('click', (ev) => {
              ev.stopPropagation();
              const id = btn.dataset.id;
              const action = btn.dataset.action;
              if (action === 'add') addSupplement(id);
              else removeSupplement(id);
            });
          });
        }
      });
      // Preserve search query after re-render
      setTimeout(() => searchInput.focus(), 0);
    }

    // Clear all button
    const clearBtn = document.getElementById('btn-clear-stack');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearAll);
    }

    // Save button
    const saveBtn = document.getElementById('btn-save-stack');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const name = prompt('Name your stack:', currentStackName || 'My Custom Stack');
        if (name) saveCurrentStack(name);
      });
    }

    // Saved stack load/delete
    document.querySelectorAll('.saved-stack__btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const stackId = btn.dataset.stackId;
        if (action === 'load') loadStack(stackId);
        else if (action === 'delete') {
          if (confirm('Delete this saved stack?')) deleteStack(stackId);
        }
      });
    });

    // Global search (navbar)
    const globalSearch = document.getElementById('search-input');
    const globalResults = document.getElementById('search-results');
    if (globalSearch && globalResults) {
      globalSearch.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length < 2) {
          globalResults.innerHTML = '';
          globalResults.classList.remove('active');
          return;
        }

        const matches = allSupplements.filter(s => {
          const searchText = [s.name, ...s.aliases, s.tagline, ...s.categories].join(' ').toLowerCase();
          return searchText.includes(query);
        });

        if (matches.length === 0) {
          globalResults.innerHTML = '<div class="search-result search-result--empty">No supplements found</div>';
          globalResults.classList.add('active');
          return;
        }

        globalResults.innerHTML = matches.slice(0, 8).map(s => {
          const assessment = EvidenceScoring.assess(s.evidence);
          return `
            <a href="supplement.html?id=${s.id}" class="search-result">
              <span class="search-result__badge" style="color: ${assessment.color}">${assessment.tier}</span>
              <div class="search-result__info">
                <span class="search-result__name">${s.name}</span>
                <span class="search-result__cats">${s.categories.map(cid => {
                  const cat = allCategories.find(c => c.id === cid);
                  return cat ? cat.name : cid;
                }).join(', ')}</span>
              </div>
            </a>
          `;
        }).join('');
        globalResults.classList.add('active');
      });

      document.addEventListener('click', (e) => {
        if (!globalSearch.contains(e.target) && !globalResults.contains(e.target)) {
          globalResults.innerHTML = '';
          globalResults.classList.remove('active');
        }
      });
    }
  }

  // ──────────────────────────────
  // INITIALIZATION
  // ──────────────────────────────

  async function init() {
    await loadData();
    loadSavedStacks();
    renderPage();
  }

  return { init };

})();
