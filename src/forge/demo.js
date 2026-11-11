/**
 * "Add sample evidence": creates a small, realistic evidence set so a new
 * team (or a judge) can see ControlProof working in two minutes.
 * Everything created carries the label `controlproof-sample` for easy cleanup.
 * Runs as the current user, so it only works where they can create issues/pages.
 */
import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';
import { controlLabel } from '../core/frameworks.js';

const SAMPLE = 'controlproof-sample';
const L = (fw, id) => controlLabel(fw, id);

// state: 'done' | 'in_progress' | 'todo'; links: control labels to add (empty = left for suggestions)
export const SAMPLE_ISSUES = [
  { summary: 'Q4 user access review for production systems', state: 'done', links: [L('iso27001', 'A.5.18'), L('soc2', 'CC6.3')],
    body: 'Reviewed all accounts with production access. Removed 3 leavers, downgraded 2 admins. Sign-off by CTO attached.' },
  { summary: 'Patch critical OpenSSL CVE on API servers', state: 'done', links: [L('iso27001', 'A.8.8'), L('soc2', 'CC7.1')],
    body: 'Vulnerability scan flagged CVE on api-1..4. Patched and re-scanned clean.' },
  { summary: 'Quarterly backup restore test', state: 'done', links: [L('iso27001', 'A.8.13'), L('soc2', 'A1.2')],
    body: 'Restored the customer database snapshot to staging; data verified, took 38 minutes.' },
  { summary: 'Enforce code review on main branch', state: 'in_progress', links: [L('iso27001', 'A.8.28'), L('soc2', 'CC8.1')],
    body: 'Branch protection: require one approving pull request review before merge.' },
  { summary: 'Offboarding: revoke access for departing staff within 24h', state: 'done', links: [L('soc2', 'CC6.2')],
    body: 'Automated deprovision of SSO, GitHub and AWS accounts when HR marks an employee as leaving.' },
  { summary: 'Data subject access request from customer #4821', state: 'done', links: [L('ndpa', 'S34')],
    body: 'Customer asked for a copy of their personal data. Exported and sent within 14 days.' },
  // Unlinked on purpose: ControlProof should suggest these.
  { summary: 'Run security awareness training for all staff', state: 'done', links: [],
    body: 'Phishing training and security awareness session completed by 27 of 29 employees.' },
  { summary: 'Postmortem: login outage and suspected security incident', state: 'done', links: [],
    body: 'Incident timeline, root cause and follow-ups. No customer data was accessed.' },
  { summary: 'Rotate KMS encryption keys', state: 'todo', links: [],
    body: 'Annual key rotation for the payments database encryption keys.' },
];

export const SAMPLE_PAGES = [
  { title: 'Information Security Policy', links: [L('iso27001', 'A.5.1'), L('soc2', 'CC2.2'), L('soc2', 'CC5.3')],
    body: 'Purpose, scope, roles and responsibilities of the information security management system (ISMS). Reviewed annually.' },
  { title: 'Access Control Policy', links: [L('iso27001', 'A.5.15'), L('soc2', 'CC6.1')],
    body: 'Least privilege, role-based access (RBAC), MFA for all staff, SSO for business apps.' },
  { title: 'Incident Response Plan', links: [L('iso27001', 'A.5.24'), L('soc2', 'CC7.4')],
    body: 'Severity levels, escalation contacts, runbook, and breach notification steps (NDPC within 72 hours).' },
  { title: 'Business Continuity and Disaster Recovery Plan', links: [L('iso27001', 'A.5.29')],
    body: 'Recovery objectives (RTO 4h, RPO 1h), DR test schedule, communication plan.' },
  { title: 'Privacy Notice', links: [L('ndpa', 'S27'), L('iso27001', 'A.5.34')],
    body: 'How we collect, use and protect personal data, and how to contact our data protection officer.' },
  // Unlinked on purpose: should be suggested.
  { title: 'Encryption Standard', links: [],
    body: 'TLS 1.2+ in transit, AES-256 at rest, keys in KMS with yearly key rotation.' },
  { title: 'DPIA: Customer onboarding with BVN verification', links: [],
    body: 'Data protection impact assessment for collecting BVN and ID documents during onboarding.' },
];

const json = { Accept: 'application/json', 'Content-Type': 'application/json' };
const adf = (text) => ({ type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function ok(res, what) {
  if (res.ok) return res.status === 204 ? null : res.json();
  throw new Error(`${what} failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
}

async function pickProject() {
  const data = await ok(await api.asUser().requestJira(route`/rest/api/3/project/search?maxResults=50&action=create`, { headers: json }), 'List Jira projects');
  const projects = data.values || [];
  if (!projects.length) throw new Error('No Jira project you can create issues in.');
  return projects.find((p) => p.projectTypeKey === 'software') || projects[0];
}

async function pickIssueType(projectId) {
  const data = await ok(await api.asUser().requestJira(route`/rest/api/3/issuetype/project?projectId=${projectId}`, { headers: json }), 'List issue types');
  const types = (data || []).filter((t) => !t.subtask);
  return types.find((t) => t.name === 'Task') || types.find((t) => t.hierarchyLevel === 0) || types[0];
}

async function moveTo(key, wanted) {
  if (wanted === 'todo') return;
  const data = await ok(await api.asUser().requestJira(route`/rest/api/3/issue/${key}/transitions`, { headers: json }), 'List transitions');
  const cat = wanted === 'done' ? 'done' : 'indeterminate';
  const t = (data.transitions || []).find((x) => x.to?.statusCategory?.key === cat);
  if (!t) return;
  await ok(await api.asUser().requestJira(route`/rest/api/3/issue/${key}/transitions`, {
    method: 'POST', headers: json, body: JSON.stringify({ transition: { id: t.id } }),
  }), `Transition ${key}`);
}

async function pickSpace() {
  const data = await ok(await api.asUser().requestConfluence(route`/wiki/api/v2/spaces?type=global&status=current&limit=25`, { headers: json }), 'List Confluence spaces');
  const spaces = data.results || [];
  if (!spaces.length) throw new Error('No Confluence space found.');
  return spaces[0];
}

async function existingSampleIssues() {
  const data = await ok(await api.asUser().requestJira(route`/rest/api/3/search/jql`, {
    method: 'POST', headers: json,
    body: JSON.stringify({ jql: `labels = ${SAMPLE}`, fields: ['summary'], maxResults: 100 }),
  }), 'Search sample issues');
  return new Set((data.issues || []).map((i) => i.fields.summary));
}

async function existingSamplePages() {
  const cql = `label = "${SAMPLE}" and type = page`;
  const data = await ok(await api.asUser().requestConfluence(
    route`/wiki/rest/api/content/search?cql=${cql}&limit=100`, { headers: json },
  ), 'Search sample pages');
  return new Set((data.results || []).map((p) => p.title));
}

/** Idempotent: items that already exist (same title + sample label) are skipped. */
export async function seedSample() {
  const result = { issues: [], pages: [], skipped: 0, warnings: [] };

  try {
    const have = await existingSampleIssues();
    const project = await pickProject();
    const type = await pickIssueType(project.id);
    for (const it of SAMPLE_ISSUES) {
      if (have.has(it.summary)) { result.skipped += 1; continue; }
      const created = await ok(await api.asUser().requestJira(route`/rest/api/3/issue`, {
        method: 'POST', headers: json,
        body: JSON.stringify({ fields: {
          project: { id: project.id }, issuetype: { id: type.id }, summary: it.summary,
          description: adf(it.body), labels: [SAMPLE, ...it.links],
        } }),
      }), `Create issue "${it.summary}"`);
      await moveTo(created.key, it.state).catch((e) => result.warnings.push(e.message));
      result.issues.push(created.key);
    }
  } catch (e) {
    result.warnings.push(`Jira: ${e.message}`);
  }

  try {
    const have = await existingSamplePages();
    const space = await pickSpace();
    for (const pg of SAMPLE_PAGES) {
      if (have.has(pg.title)) { result.skipped += 1; continue; }
      const created = await ok(await api.asUser().requestConfluence(route`/wiki/api/v2/pages`, {
        method: 'POST', headers: json,
        body: JSON.stringify({
          spaceId: space.id, status: 'current', title: pg.title,
          body: { representation: 'storage', value: `<p>${esc(pg.body)}</p>` },
        }),
      }), `Create page "${pg.title}"`);
      await ok(await api.asUser().requestConfluence(route`/wiki/rest/api/content/${created.id}/label`, {
        method: 'POST', headers: json,
        body: JSON.stringify([SAMPLE, ...pg.links].map((name) => ({ prefix: 'global', name }))),
      }), `Label page "${pg.title}"`);
      result.pages.push(created.id);
    }
  } catch (e) {
    result.warnings.push(`Confluence: ${e.message}`);
  }

  await kvs.set('sample:last', { at: new Date().toISOString(), issues: result.issues.length, pages: result.pages.length });
  return result;
}
