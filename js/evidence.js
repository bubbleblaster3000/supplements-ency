/**
 * Evidence Scoring System
 * 
 * Calculates a composite evidence score (0–100) based on the quantity 
 * and quality of scientific studies supporting a supplement's efficacy.
 * 
 * Scoring weights:
 *   - Meta-analyses:       10 points each (highest quality evidence)
 *   - Systematic reviews:   6 points each
 *   - RCTs:                 2 points each
 *   - Human studies (any):  0.1 points each (baseline breadth)
 * 
 * A sigmoid normalization is applied to produce a 0–100 score
 * with good differentiation across the full evidence spectrum.
 */

const EvidenceScoring = (() => {

  // Weights for each study type
  const WEIGHTS = {
    metaAnalyses:      10,
    systematicReviews:  6,
    rcts:               2,
    humanStudies:       0.2
  };

  // Normalization constant — controls the curve's inflection point.
  // Higher value = more studies needed to reach high scores.
  const NORM_FACTOR = 200;

  /**
   * Calculate the raw weighted evidence value.
   * @param {Object} evidence - Evidence data object
   * @returns {number} Raw weighted score
   */
  function rawScore(evidence) {
    return (
      (evidence.metaAnalyses || 0)      * WEIGHTS.metaAnalyses +
      (evidence.systematicReviews || 0) * WEIGHTS.systematicReviews +
      (evidence.rcts || 0)              * WEIGHTS.rcts +
      (evidence.humanStudies || 0)      * WEIGHTS.humanStudies
    );
  }

  /**
   * Calculate normalized evidence score (0–100).
   * Uses a sigmoid-like function: score = 100 × (1 - e^(-raw/NORM))
   * This gives diminishing returns at the top, providing natural tiers.
   * 
   * @param {Object} evidence - { totalStudies, humanStudies, rcts, metaAnalyses, systematicReviews }
   * @returns {number} Score from 0 to 100
   */
  function calculateScore(evidence) {
    const raw = rawScore(evidence);
    const score = 100 * (1 - Math.exp(-raw / NORM_FACTOR));
    return Math.round(score);
  }

  /**
   * Get the evidence tier based on the score.
   * 
   * Tiers:
   *   S (90–100) — Gold Standard: Extensively studied, scientific consensus
   *   A (70–89)  — Strong Evidence: Robust clinical data, well-established
   *   B (50–69)  — Moderate Evidence: Growing body of quality research
   *   C (30–49)  — Emerging Evidence: Promising early data, needs more research
   *   D (0–29)   — Preliminary: Limited clinical data, mostly preclinical
   * 
   * @param {number} score - Evidence score (0–100)
   * @returns {Object} { tier, label, color, description }
   */
  function getTier(score) {
    if (score >= 90) return {
      tier: 'S',
      label: 'Gold Standard',
      color: '#FFD700',
      bgColor: 'rgba(255, 215, 0, 0.12)',
      description: 'Extensively studied with scientific consensus on efficacy. Supported by numerous meta-analyses and hundreds of RCTs.'
    };
    if (score >= 70) return {
      tier: 'A',
      label: 'Strong Evidence',
      color: '#4CAF50',
      bgColor: 'rgba(76, 175, 80, 0.12)',
      description: 'Robust clinical evidence from multiple high-quality trials. Well-established in the research literature.'
    };
    if (score >= 50) return {
      tier: 'B',
      label: 'Moderate Evidence',
      color: '#2196F3',
      bgColor: 'rgba(33, 150, 243, 0.12)',
      description: 'Growing body of clinical evidence. Multiple RCTs support efficacy, though more research would strengthen conclusions.'
    };
    if (score >= 30) return {
      tier: 'C',
      label: 'Emerging Evidence',
      color: '#FF9800',
      bgColor: 'rgba(255, 152, 0, 0.12)',
      description: 'Promising early clinical data. Some RCTs available, but the evidence base is still developing.'
    };
    return {
      tier: 'D',
      label: 'Preliminary',
      color: '#F44336',
      bgColor: 'rgba(244, 67, 54, 0.12)',
      description: 'Limited clinical evidence. Mostly preclinical or observational data. Requires significantly more human research.'
    };
  }

  /**
   * Get a complete evidence assessment for a supplement.
   * @param {Object} evidence - Evidence data object
   * @returns {Object} { score, tier, label, color, bgColor, description, breakdown }
   */
  function assess(evidence) {
    const score = calculateScore(evidence);
    const tierInfo = getTier(score);
    return {
      score,
      ...tierInfo,
      breakdown: {
        totalStudies: evidence.totalStudies || 0,
        humanStudies: evidence.humanStudies || 0,
        rcts: evidence.rcts || 0,
        metaAnalyses: evidence.metaAnalyses || 0,
        systematicReviews: evidence.systematicReviews || 0,
        rawWeighted: Math.round(rawScore(evidence))
      }
    };
  }

  /**
   * Sort supplements by evidence score (descending).
   * @param {Array} supplements - Array of supplement objects
   * @returns {Array} Sorted copy of supplements array
   */
  function sortByEvidence(supplements) {
    return [...supplements].sort((a, b) => {
      const scoreA = calculateScore(a.evidence);
      const scoreB = calculateScore(b.evidence);
      return scoreB - scoreA;
    });
  }

  /**
   * Sort supplements alphabetically by name.
   * @param {Array} supplements - Array of supplement objects
   * @returns {Array} Sorted copy of supplements array
   */
  function sortAlphabetically(supplements) {
    return [...supplements].sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    calculateScore,
    getTier,
    assess,
    sortByEvidence,
    sortAlphabetically,
    rawScore,
    WEIGHTS
  };

})();

/**
 * Style Icon helper — renders both emoji and text-alternative spans.
 * CSS controls which one is visible based on [data-style] attribute.
 *
 * @param {string} emoji  - Content to show in classic mode
 * @param {string} text   - Content to show in typewriter mode
 * @returns {string} HTML with both variants
 */
window.SI = function(emoji, text) {
  return '<span class="si-e">' + emoji + '</span><span class="si-t">' + text + '</span>';
};
