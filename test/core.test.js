import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FRAMEWORKS, controlLabel, findControl } from '../src/core/frameworks.js';
import { evaluateControl, evaluateFramework, prioritisedGaps, verdict } from '../src/core/evaluate.js';
import { suggestEvidence } from '../src/core/suggest.js';

const NOW = Date.parse('2026-11-10T12:00:00Z');
const daysAgo = (n) => new Date(NOW - n * 86_400_000).toISOString();
const iso = FRAMEWORKS.iso27001;
const ctl = (id) => iso.controls.find((c) => c.id === id);

const issue = (key, labels, { state = 'done', age = 10, title = key, text = '' } = {}) => ({
  source: 'jira', id: key, key, title, url: `/browse/${key}`, updated: daysAgo(age), state, labels, text,
});
const page = (id, labels, { age = 10, title = id } = {}) => ({
  source: 'confluence', id, key: id, title, url: `/wiki/${id}`, updated: daysAgo(age), state: 'page', labels, text: '',
});

test('labels are valid in Jira and Confluence', () => {
  assert.equal(controlLabel('iso27001', 'A.5.15'), 'cp-iso27001-a-5-15');
  assert.equal(controlLabel('soc2', 'CC6.3'), 'cp-soc2-cc6-3');
  for (const fw of Object.values(FRAMEWORKS)) {
    const labels = fw.controls.map((c) => controlLabel(fw.id, c.id));
    assert.equal(new Set(labels).size, labels.length, `${fw.id} labels must be unique`);
    labels.forEach((l) => assert.match(l, /^[a-z0-9-]+$/));
  }
});

test('every control is well formed', () => {
  for (const fw of Object.values(FRAMEWORKS)) {
    for (const c of fw.controls) {
      assert.ok(c.keywords.length, `${fw.id} ${c.id} keywords`);
      assert.ok(c.expects.every((k) => k === 'policy' || k === 'activity'), `${fw.id} ${c.id} expects`);
      assert.ok(c.maxAgeDays > 0);
    }
  }
});

test('gap when nothing is linked', () => {
  const r = evaluateControl('iso27001', ctl('A.5.18'), [issue('SEC-1', [])], NOW);
  assert.equal(r.status, 'gap');
  assert.match(r.reason, /cp-iso27001-a-5-18/);
});

test('covered with fresh completed activity', () => {
  const r = evaluateControl('iso27001', ctl('A.5.18'), [issue('SEC-1', ['cp-iso27001-a-5-18'], { age: 30 })], NOW);
  assert.equal(r.status, 'covered');
  assert.equal(r.evidence[0].fresh, true);
});

test('stale when evidence is older than the control limit', () => {
  // A.5.18 access reviews: 120-day limit
  const r = evaluateControl('iso27001', ctl('A.5.18'), [issue('SEC-1', ['cp-iso27001-a-5-18'], { age: 200 })], NOW);
  assert.equal(r.status, 'stale');
  assert.match(r.reason, /200 days old/);
});

test('partial when issue is still open', () => {
  const r = evaluateControl('iso27001', ctl('A.5.18'),
    [issue('SEC-1', ['cp-iso27001-a-5-18'], { state: 'in_progress' })], NOW);
  assert.equal(r.status, 'partial');
  assert.match(r.reason, /still open/);
});

test('policy + activity control needs both kinds', () => {
  const lbl = controlLabel('iso27001', 'A.5.29');
  const onlyPage = evaluateControl('iso27001', ctl('A.5.29'), [page('P1', [lbl])], NOW);
  assert.equal(onlyPage.status, 'partial');
  assert.match(onlyPage.reason, /completed Jira issue/);
  const both = evaluateControl('iso27001', ctl('A.5.29'), [page('P1', [lbl]), issue('OPS-9', [lbl])], NOW);
  assert.equal(both.status, 'covered');
});

test('framework score, verdict and prioritised gaps', () => {
  const ev = iso.controls.map((c, i) => {
    const lbl = controlLabel('iso27001', c.id);
    const items = [];
    if (c.expects.includes('policy')) items.push(page(`P${i}`, [lbl]));
    if (c.expects.includes('activity')) items.push(issue(`K-${i}`, [lbl]));
    return items;
  }).flat();
  const full = evaluateFramework('iso27001', ev, NOW);
  assert.equal(full.score, 100);
  assert.equal(full.verdict, 'Audit-ready');

  const none = evaluateFramework('iso27001', [], NOW);
  assert.equal(none.score, 0);
  assert.equal(none.counts.gap, iso.controls.length);
  assert.equal(none.verdict, 'Not ready');

  const mixed = evaluateFramework('iso27001', [
    issue('A', [controlLabel('iso27001', 'A.8.8')], { age: 400 }),     // stale
    issue('B', [controlLabel('iso27001', 'A.8.13')], { state: 'todo' }), // partial
  ], NOW);
  const gaps = prioritisedGaps(mixed, 50);
  assert.equal(gaps.at(-1).id, 'A.8.13');
  assert.equal(gaps.at(-2).id, 'A.8.8');
  assert.equal(gaps[0].status, 'gap');
});

test('verdict thresholds', () => {
  assert.equal(verdict(95, { gap: 1 }), 'Nearly ready');
  assert.equal(verdict(50, { gap: 3 }), 'Needs work');
});

test('suggestions match keywords and skip already-linked items', () => {
  const items = [
    issue('SEC-10', [], { title: 'Q3 user access review for production' }),
    issue('SEC-11', [controlLabel('iso27001', 'A.5.18')], { title: 'Q2 access review' }),
    issue('MKT-1', [], { title: 'Launch newsletter' }),
    page('P7', [], { title: 'Employee offboarding checklist' }),
  ];
  const s = suggestEvidence('iso27001', ctl('A.5.18'), items);
  assert.deepEqual(s.map((x) => x.key), ['SEC-10', 'P7']);
  assert.ok(s[0].matched.includes('access review'));
});

test('findControl by id, title and topic', () => {
  assert.equal(findControl('iso27001', 'a.5.18').id, 'A.5.18');
  assert.equal(findControl('iso27001', 'Backups').id, 'A.8.13');
  assert.equal(findControl('soc2', 'access reviews').id, 'CC6.3');
  assert.equal(findControl('ndpa', 'breach').id, 'S40');
  assert.equal(findControl('iso27001', 'zzz'), null);
});
