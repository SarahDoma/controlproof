/**
 * Suggest unlinked Jira issues / Confluence pages that look like evidence for
 * a control, using keyword matching on title and text. Deterministic and
 * explainable on purpose: every suggestion says which keywords matched, so an
 * auditor can see why it was proposed. The user confirms before anything is
 * labelled.
 */
import { controlLabel } from './frameworks.js';

const norm = (s) => ` ${String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;

export function scoreItem(control, item) {
  const title = norm(item.title);
  const body = norm(item.text);
  const matched = [];
  let score = 0;
  for (const kw of control.keywords) {
    const k = norm(kw);
    if (title.includes(k)) { score += 3; matched.push(kw); } else if (body.includes(k)) { score += 1; matched.push(kw); }
  }
  // Prefer the kind of evidence the control expects.
  const kind = item.source === 'confluence' ? 'policy' : 'activity';
  if (score && control.expects.includes(kind)) score += 1;
  return { score, matched };
}

export function suggestEvidence(frameworkId, control, items, { limit = 5, minScore = 3 } = {}) {
  const label = controlLabel(frameworkId, control.id);
  return items
    .filter((it) => !(it.labels || []).includes(label))
    .map((it) => ({ item: it, ...scoreItem(control, it) }))
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score || String(b.item.updated).localeCompare(String(a.item.updated)))
    .slice(0, limit)
    .map(({ item, score, matched }) => ({
      source: item.source, id: item.id, key: item.key, title: item.title, url: item.url,
      updated: item.updated, state: item.state, score, matched, label,
    }));
}
