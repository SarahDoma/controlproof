import Resolver from '@forge/resolver';
import { FRAMEWORKS } from './core/frameworks.js';
import {
  acceptSuggestion, buildReport, controlDetail, getSettings, prioritisedGaps, saveSettings,
} from './forge/service.js';
import { seedSample } from './forge/demo.js';

// ---------------------------------------------------------------------------
// Dashboard (UI Kit) resolvers
// ---------------------------------------------------------------------------
const resolver = new Resolver();

resolver.define('getFrameworks', () => Object.values(FRAMEWORKS)
  .map(({ id, name, short, controls }) => ({ id, name, short, count: controls.length })));

resolver.define('getSettings', () => getSettings());

resolver.define('saveSettings', ({ payload }) => saveSettings(payload));

resolver.define('getReport', async ({ payload }) => {
  const { report, warnings, settings } = await buildReport(payload?.framework);
  return { report, warnings, settings };
});

resolver.define('getControl', ({ payload }) => controlDetail(payload.framework, payload.controlId));

resolver.define('acceptSuggestion', ({ payload }) => acceptSuggestion(payload));

resolver.define('seedSample', () => seedSample());

export const handler = resolver.getDefinitions();

// ---------------------------------------------------------------------------
// Rovo agent actions. Return compact JSON so the agent can explain it.
// ---------------------------------------------------------------------------
const brief = (r) => ({
  id: r.id, title: r.title, status: r.status, reason: r.reason, label: r.label,
  evidence: r.evidence.slice(0, 3).map((e) => ({ key: e.key, title: e.title, url: e.url, ageDays: e.ageDays })),
});

export async function getReadiness(payload) {
  const { report, warnings } = await buildReport(payload?.framework);
  return {
    framework: report.framework.name,
    score: report.score,
    verdict: report.verdict,
    counts: report.counts,
    total: report.total,
    topGaps: prioritisedGaps(report, 5).map(brief),
    warnings,
  };
}

export async function listGaps(payload) {
  const { report, warnings } = await buildReport(payload?.framework);
  const limit = Math.min(Math.max(Number(payload?.limit) || 10, 1), 30);
  return {
    framework: report.framework.name,
    gaps: prioritisedGaps(report, limit).map(brief),
    warnings,
  };
}

export async function findEvidence(payload) {
  const detail = await controlDetail(payload?.framework, payload?.control);
  if (detail.error) return detail;
  return {
    framework: detail.framework.name,
    control: brief(detail.control),
    suggestions: detail.suggestions.map((s) => ({
      key: s.key, title: s.title, url: s.url, source: s.source, matched: s.matched,
      howToLink: `Add label ${s.label}`,
    })),
    warnings: detail.warnings,
  };
}
