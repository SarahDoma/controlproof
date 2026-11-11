/**
 * Fetch evidence from Jira and Confluence and normalise it.
 * All reads use api.asUser() so people only ever see evidence they are
 * already allowed to see in Jira/Confluence.
 */
import api, { route } from '@forge/api';

const MAX_ISSUES = 500;
const MAX_PAGES = 300;

export async function fetchJiraEvidence(jql) {
  const out = [];
  let nextPageToken;
  do {
    const res = await api.asUser().requestJira(route`/rest/api/3/search/jql`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jql,
        fields: ['summary', 'status', 'updated', 'labels', 'description'],
        maxResults: 100,
        ...(nextPageToken ? { nextPageToken } : {}),
      }),
    });
    if (!res.ok) throw new Error(`Jira search failed (${res.status}): ${await res.text()}`);
    const data = await res.json();
    for (const is of data.issues || []) out.push(normaliseIssue(is));
    nextPageToken = data.isLast ? undefined : data.nextPageToken;
  } while (nextPageToken && out.length < MAX_ISSUES);
  return [...new Map(out.map((i) => [i.key, i])).values()];
}

export function normaliseIssue(is, siteUrl = '') {
  const f = is.fields || {};
  const cat = f.status?.statusCategory?.key;
  return {
    source: 'jira',
    id: is.id,
    key: is.key,
    title: f.summary || is.key,
    url: siteUrl ? `${siteUrl}/browse/${is.key}` : `/browse/${is.key}`,
    updated: f.updated,
    state: cat === 'done' ? 'done' : cat === 'indeterminate' ? 'in_progress' : 'todo',
    labels: (f.labels || []).map((l) => l.toLowerCase()),
    text: adfToText(f.description).slice(0, 4000),
  };
}

export async function fetchConfluenceEvidence(cql) {
  const byId = new Map();
  let cursor = '';
  let base = '';
  for (let guard = 0; guard < 20 && byId.size < MAX_PAGES; guard += 1) {
    const res = await api.asUser().requestConfluence(
      cursor
        ? route`/wiki/rest/api/content/search?cql=${cql}&limit=50&cursor=${cursor}&expand=metadata.labels,version`
        : route`/wiki/rest/api/content/search?cql=${cql}&limit=50&expand=metadata.labels,version`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) throw new Error(`Confluence search failed (${res.status}): ${await res.text()}`);
    const data = await res.json();
    base = data._links?.base || base;
    const before = byId.size;
    for (const p of data.results || []) byId.set(p.id, normalisePage(p, base));
    const next = nextCursor(data._links?.next);
    // Stop when there is no next page, or the API returned nothing new.
    if (!next || next === cursor || byId.size === before) break;
    cursor = next;
  }
  return [...byId.values()];
}

/** Confluence v1 search paginates with an opaque cursor in _links.next. */
export function nextCursor(nextLink) {
  if (!nextLink) return '';
  const m = /[?&]cursor=([^&]+)/.exec(nextLink);
  return m ? decodeURIComponent(m[1]) : '';
}

export function normalisePage(p, base = '') {
  return {
    source: 'confluence',
    id: p.id,
    key: p.id,
    title: p.title,
    url: `${base}${p._links?.webui || ''}`,
    updated: p.version?.when,
    state: 'page',
    labels: (p.metadata?.labels?.results || []).map((l) => String(l.name).toLowerCase()),
    text: '',
  };
}

/** Add the control label to an issue or page (user-confirmed in the UI). */
export async function linkEvidence({ source, key, id }, label) {
  if (source === 'jira') {
    const res = await api.asUser().requestJira(route`/rest/api/3/issue/${key}`, {
      method: 'PUT',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ update: { labels: [{ add: label }] } }),
    });
    if (!res.ok) throw new Error(`Could not label ${key} (${res.status})`);
    return;
  }
  const res = await api.asUser().requestConfluence(route`/wiki/rest/api/content/${id}/label`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify([{ prefix: 'global', name: label }]),
  });
  if (!res.ok) throw new Error(`Could not label page ${id} (${res.status})`);
}

/** Flatten Atlassian Document Format to plain text. */
export function adfToText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (node.type === 'text') return node.text || '';
  const inner = (node.content || []).map(adfToText).join(node.type === 'doc' ? '\n' : ' ');
  return inner.replace(/\s+/g, ' ').trim();
}
