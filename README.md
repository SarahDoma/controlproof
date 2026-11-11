# ControlProof

**Find out if you're audit-ready, using the evidence that already lives in Jira and Confluence.**

Small fintech, health and SaaS teams preparing for ISO 27001, SOC 2 or Nigeria's
Data Protection Act face the same problem. The evidence is already there,
in access-review tickets, incident post-mortems and policy pages, but it is
scattered. Nobody knows which controls are covered until an auditor asks.
Teams spend weeks collecting screenshots into spreadsheets.

ControlProof is a Forge app that maps Jira issues and Confluence pages to
compliance controls. It tells you which controls have current evidence, which
evidence is stale, and which controls have none.

Built for **Codegeist 2026**. Category: **Apps for Specialized Industries**.
Bonus prize entry: **Best Agents (Rovo)**.

## Features

- **Readiness dashboard (Jira global page).** It shows a score and a verdict, plus a count of controls in each state: Covered, Partial, Stale or Missing.
- **Control table.** Each control comes with a plain-language reason, for example "Newest evidence is 200 days old (limit 120)" or "Missing: Confluence policy page".
- **Evidence suggestions.** For any control, ControlProof finds Jira issues and Confluence pages that look like evidence, and shows which keywords matched. You link them with **one click**, which adds a label such as `cp-iso27001-a-5-18`.
- **Freshness rules.** Each control has its own age limit. For example, access reviews must be from the last 120 days and vulnerability work from the last 90.
- **Policy vs activity.** Some controls need a written policy (a Confluence page), some need work that was actually done (completed Jira issues), and some need both.
- **Rovo agent "ControlProof Auditor".** Ask "Are we audit-ready for ISO 27001?", "What are our biggest SOC 2 gaps?" or "Show me evidence for backups". It has 3 actions: `get-readiness`, `list-gaps` and `find-evidence`.
- **Three frameworks.** It covers a core set of ISO/IEC 27001:2022 Annex A controls, the SOC 2 Security criteria, and the obligations of the **Nigeria Data Protection Act 2023**.
- **Permission-safe.** Every read uses `asUser()`, so people only see evidence they can already open.

## How evidence is evaluated

| Status | Rule |
|---|---|
| Covered | Every expected kind of evidence (policy and/or activity) is linked, completed, and within the age limit |
| Partial | Some current evidence is linked, but an expected kind is missing or an issue is still open |
| Stale | Evidence is linked, but all of it is older than the control's limit |
| Missing | Nothing is linked |

The score weights the statuses as Covered 1, Partial 0.5, Stale 0.25 and Missing 0, averaged over all controls.
The verdict is one of Audit-ready (90% or more with no missing controls), Nearly ready, Needs work or Not ready.

ControlProof reports on evidence. It does not certify compliance, which only an accredited auditor can do.

## Forge modules used

| Module | Purpose |
|---|---|
| `jira:globalPage` (UI Kit) | The readiness dashboard |
| `rovo:agent` | ControlProof Auditor |
| `action` ×3 | `get-readiness`, `list-gaps`, `find-evidence` |
| `function` | The UI resolver and the action handlers |
| Forge KVS (`@forge/kvs`) | Saved settings: default framework, JQL and CQL scope |
| Jira REST (`/rest/api/3/search/jql`, issue labels) | Reading activity evidence and linking it |
| Confluence REST (CQL search, page labels) | Reading policy evidence and linking it |

## Project layout

```
manifest.yml            Forge modules, scopes and resources
prompts/agent.md        Rovo agent instructions
src/core/               Pure logic (no Forge imports), unit tested
  frameworks.js         Control catalogues and the label scheme
  evaluate.js           Status, score, verdict and prioritised gaps
  suggest.js            Explainable keyword-based evidence suggestions
src/forge/              Jira/Confluence data access, KVS settings and the shared service
src/index.js            UI resolvers and Rovo action handlers
src/frontend/index.jsx  UI Kit dashboard
test/                   node:test unit tests
```

## Run it

Requirements:
- Node.js 22.23.4 or later (or 24.22.1 or later)
- An Atlassian account
- A free [developer site](https://developer.atlassian.com/cloud/) with Jira and Confluence

```bash
npm install -g @forge/cli
```

`forge login` uses an API token with the Forge scope, created at id.atlassian.com, then API tokens.

```bash
forge login
```

```bash
npm install
```

```bash
forge register
```

```bash
forge deploy
```

```bash
forge install
```

In Jira, open **Apps → ControlProof**. In Rovo chat, pick **ControlProof Auditor**.

Unit tests:

```bash
npm test
```

## Licence

MIT
