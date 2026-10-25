// Pure scoring engine for the DVFE framework.
// Mirrored verbatim in frontend/src/lib/scoring.js — keep both in sync.

export function colorForScore(sub, score) {
  if (score == null || Number.isNaN(score)) return 'empty';
  if (score <= sub.redMax) return 'red';
  if (score <= sub.yellowMax) return 'yellow';
  return 'green';
}

export function pillarMaxPossible(pillar) {
  return pillar.subcriteria.reduce((sum, s) => sum + s.maxScore, 0);
}

export function pillarSubtotal(pillar, scoresByCode) {
  return pillar.subcriteria.reduce((sum, s) => {
    const entry = scoresByCode[s.code];
    const v = entry && typeof entry.score === 'number' ? entry.score : 0;
    return sum + v;
  }, 0);
}

export function pillarNormalized(pillar, scoresByCode) {
  const max = pillarMaxPossible(pillar);
  if (max === 0) return 0;
  return (pillarSubtotal(pillar, scoresByCode) / max) * 100;
}

export function pillarGateStatus(pillar, scoresByCode) {
  const normalized = pillarNormalized(pillar, scoresByCode);
  const killBelow = pillar.gate?.killBelow ?? 40;
  const capBelow = pillar.gate?.capBelow ?? null;
  if (normalized < killBelow) return { status: 'kill', label: 'KILL GATE TRIGGERED' };
  if (capBelow != null && normalized < capBelow) return { status: 'cap', label: 'CAP AT HITL COPILOT' };
  if (capBelow != null) return { status: 'pass-autonomy', label: 'Pass (Autonomy Eligible)' };
  return { status: 'pass', label: 'Pass' };
}

// scoresByCode: { [subCriterionCode]: { score: number, notes: string } }
export function evaluateIdea(framework, scoresByCode = {}) {
  const pillars = framework.pillars.map((pillar) => {
    const normalized = pillarNormalized(pillar, scoresByCode);
    const raw = pillarSubtotal(pillar, scoresByCode);
    const max = pillarMaxPossible(pillar);
    const gate = pillarGateStatus(pillar, scoresByCode);
    return {
      pillarId: pillar.id,
      code: pillar.code,
      name: pillar.name,
      weight: pillar.weight,
      raw,
      max,
      normalized,
      gate,
    };
  });

  const overall = pillars.reduce((sum, p) => sum + p.normalized * p.weight, 0);
  const minPillar = pillars.length ? Math.min(...pillars.map((p) => p.normalized)) : 0;

  const rules = framework.verdictRules || {};
  const hardGateMin = rules.hardGateMin ?? 40;
  const goThreshold = rules.goThreshold ?? 75;
  const conditionalThreshold = rules.conditionalThreshold ?? 60;
  const autonomyThreshold = rules.autonomyThreshold ?? 70;

  const autonomyPillars = framework.pillars
    .map((p, i) => ({ def: p, result: pillars[i] }))
    .filter((p) => p.def.autonomyGate);

  let verdict;
  if (minPillar < hardGateMin) {
    verdict = `KILL / MAJOR PIVOT (Hard Gate < ${hardGateMin})`;
  } else if (overall >= goThreshold) {
    const failingAutonomy = autonomyPillars.find((p) => p.result.normalized < autonomyThreshold);
    if (failingAutonomy) {
      verdict = `CONDITIONAL GO: Scope as HITL Copilot (${failingAutonomy.def.name} < ${autonomyThreshold})`;
    } else {
      verdict = 'GO: Full Production / Graduated Autonomy';
    }
  } else if (overall >= conditionalThreshold) {
    verdict = 'CONDITIONAL GO: Scope as HITL Copilot MVP';
  } else {
    verdict = 'HOLD / RE-ARCHITECT USE CASE';
  }

  return {
    pillars,
    overall,
    minPillar,
    verdict,
    hardGatePassed: minPillar >= hardGateMin,
  };
}

export function verdictTone(verdict) {
  if (verdict.startsWith('KILL')) return 'red';
  if (verdict.startsWith('HOLD')) return 'red';
  if (verdict.startsWith('CONDITIONAL')) return 'yellow';
  if (verdict.startsWith('GO')) return 'green';
  return 'gray';
}
