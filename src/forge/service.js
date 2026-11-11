/**
 * Shared service used by both the dashboard resolvers and the Rovo actions.
 */
import { kvs } from '@forge/kvs';
import { FRAMEWORK_IDS, controlLabel, findControl, getFramework } from '../core/frameworks.js';
import { evaluateFramework, prioritisedGaps } from '../core/evaluate.js';
import { suggestEvidence } from '../core/suggest.js';
import { fetchConfluenceEvidence, fetchJiraEvidence, linkEvidence } from './data.js';

export const DEFAULT_SETTINGS = {
  framework: 'iso27001',
  jql: 'updated >= -730d ORDER BY updated DESC',
  cql: 'type = page ORDER BY lastmodified DESC',
};

const SETTINGS_KEY = 'settings:v1';

export async function getSettings() {
  const saved = (await kvs.get(SETTINGS_KEY)) || {};
  return { ...DEFAULT_SETTINGS, ...saved };
}

export async function saveSettings(patch) {
  const next = { ...(await getSettings()), ...patch };
  if (!FRAMEWORK_IDS.includes(next.framework)) throw new Error('Unknown framework');
  if (!String(next.jql).trim() || !String(next.cql).trim()) throw new Error('JQL and CQL cannot be empty');
  await kvs.set(SETTINGS_KEY, next);
  return next;
}

export async function loadEvidence(settings) {
  const [jira, confluence] = await Promise.allSettled([
    fetchJiraEvidence(settings.jql),
    fetchConfluenceEvidence(settings.cql),
  ]);
  const warnings = [];
  if (jira.status === 'rejected') warnings.push(`Jira: ${jira.reason?.message || jira.reason}`);
  if (confluence.status === 'rejected') warnings.push(`Confluence: ${confluence.reason?.message || confluence.reason}`);
  return {
    items: [
      ...(jira.status === 'fulfilled' ? jira.value : []),
      ...(confluence.status === 'fulfilled' ? confluence.value : []),
    ],
    warnings,
  };
}

function resolveFramework(requested, settings) {
  const id = String(requested || settings.framework).toLowerCase().replace(/[^a-z0-9]/g, '');
  const alias = { iso: 'iso27001', iso27001: 'iso27001', soc2: 'soc2', soc: 'soc2', ndpa: 'ndpa', ndpr: 'ndpa' };
  return alias[id] || settings.framework;
}

export async function buildReport(frameworkRequested) {
  const settings = await getSettings();
  const framework = resolveFramework(frameworkRequested, settings);
  const { items, warnings } = await loadEvidence(settings);
  const report = evaluateFramework(framework, items);
  return { report, items, warnings, settings: { ...settings, framework } };
}

export async function controlDetail(frameworkRequested, controlQuery) {
  const { report, items, warnings, settings } = await buildReport(frameworkRequested);
  const ctl = findControl(settings.framework, controlQuery);
  if (!ctl) return { error: `No ${report.framework.short} control matches "${controlQuery}".`, warnings };
  const result = report.controls.find((r) => r.id === ctl.id);
  return {
    framework: report.framework,
    control: result,
    suggestions: suggestEvidence(settings.framework, ctl, items),
    warnings,
  };
}

export async function acceptSuggestion({ framework, controlId, item }) {
  const ctl = getFramework(framework).controls.find((c) => c.id === controlId);
  if (!ctl) throw new Error('Unknown control');
  const label = controlLabel(framework, ctl.id);
  await linkEvidence(item, label);
  return { ok: true, label };
}

export { prioritisedGaps };
