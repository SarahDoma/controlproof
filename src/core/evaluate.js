/**
 * Pure readiness logic. No Forge imports, so it runs under plain Node tests.
 *
 * Evidence item (normalised from Jira or Confluence):
 * { source: 'jira'|'confluence', id, key, title, url, updated: ISO string,
 *   state: 'done'|'in_progress'|'todo'|'page', labels: string[], text: string }
 */
import { controlLabel, getFramework } from './frameworks.js';

export const STATUS = {
  COVERED: 'covered',          // fresh, complete evidence of every expected kind
  PARTIAL: 'partial',          // fresh evidence but something expected is missing / unfinished
  STALE: 'stale',              // linked evidence exists but all of it is too old
  GAP: 'gap',                  // nothing linked
};

const WEIGHT = { covered: 1, partial: 0.5, stale: 0.25, gap: 0 };
const DAY = 86_400_000;

const isComplete = (e) => e.state === 'done' || e.state === 'page';
const kindOf = (e) => (e.source === 'confluence' ? 'policy' : 'activity');

export function ageDays(item, now) {
  const t = Date.parse(item.updated);
  return Number.isFinite(t) ? Math.floor((now - t) / DAY) : Infinity;
}

export function evaluateControl(frameworkId, control, evidence, now = Date.now()) {
  const label = controlLabel(frameworkId, control.id);
  const linked = evidence.filter((e) => (e.labels || []).includes(label));
  const fresh = linked.filter((e) => ageDays(e, now) <= control.maxAgeDays);
  const freshComplete = fresh.filter(isComplete);

  const missing = control.expects.filter((k) => !freshComplete.some((e) => kindOf(e) === k));
  let status;
  let reason;
  if (!linked.length) {
    status = STATUS.GAP;
    reason = `No evidence linked. Add label ${label} to a ${describe(control.expects)}.`;
  } else if (!fresh.length) {
    const newest = Math.min(...linked.map((e) => ageDays(e, now)));
    status = STATUS.STALE;
    reason = `Newest evidence is ${newest} days old (limit ${control.maxAgeDays}).`;
  } else if (missing.length) {
    status = STATUS.PARTIAL;
    const open = fresh.filter((e) => !isComplete(e)).length;
    reason = `Missing: ${describe(missing)}` + (open ? `; ${open} linked issue(s) still open.` : '.');
  } else {
    status = STATUS.COVERED;
    reason = `${freshComplete.length} current evidence item(s).`;
  }

  const lastUpdated = linked.length
    ? linked.map((e) => e.updated).sort().at(-1)
    : null;
  return {
    id: control.id, title: control.title, description: control.description,
    expects: control.expects, maxAgeDays: control.maxAgeDays,
    label, status, reason, lastUpdated,
    evidence: linked
      .map((e) => ({ ...pick(e), ageDays: ageDays(e, now), fresh: ageDays(e, now) <= control.maxAgeDays }))
      .sort((a, b) => a.ageDays - b.ageDays),
  };
}

export function evaluateFramework(frameworkId, evidence, now = Date.now()) {
  const fw = getFramework(frameworkId);
  const controls = fw.controls.map((ctl) => evaluateControl(frameworkId, ctl, evidence, now));
  const counts = { covered: 0, partial: 0, stale: 0, gap: 0 };
  controls.forEach((r) => { counts[r.status] += 1; });
  const score = controls.length
    ? Math.round((controls.reduce((s, r) => s + WEIGHT[r.status], 0) / controls.length) * 100)
    : 0;
  return {
    framework: { id: fw.id, name: fw.name, short: fw.short },
    score, counts, total: controls.length,
    verdict: verdict(score, counts),
    controls,
    generatedAt: new Date(now).toISOString(),
  };
}

export function verdict(score, counts) {
  if (score >= 90 && counts.gap === 0) return 'Audit-ready';
  if (score >= 70) return 'Nearly ready';
  if (score >= 40) return 'Needs work';
  return 'Not ready';
}

/** Top-N gaps in priority order: gaps first, then stale, then partial. */
export function prioritisedGaps(report, limit = 10) {
  const order = { gap: 0, stale: 1, partial: 2 };
  return report.controls
    .filter((r) => r.status !== STATUS.COVERED)
    .sort((a, b) => order[a.status] - order[b.status] || a.id.localeCompare(b.id, undefined, { numeric: true }))
    .slice(0, limit);
}

function describe(kinds) {
  const words = kinds.map((k) => (k === 'policy' ? 'Confluence policy page' : 'completed Jira issue'));
  return words.join(' and ');
}

function pick(e) {
  return { source: e.source, key: e.key, title: e.title, url: e.url, updated: e.updated, state: e.state };
}
