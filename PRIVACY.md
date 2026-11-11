# ControlProof privacy policy

_Last updated: 11 November 2026_

ControlProof is an Atlassian Forge app that helps teams check how ready they are
for compliance audits. It does this using evidence that already exists in their
Jira issues and Confluence pages.

## What data the app accesses
- **Jira issues:** summary, status, labels, last-updated date and description,
  found by the JQL filter you configure.
- **Confluence pages:** title, labels, last-updated date and link, found by the
  CQL filter you configure.

Every request runs **as the signed-in user** (`asUser`). The app can only see
issues and pages that person is already allowed to see.

## What data the app stores
ControlProof stores only **app settings** in Atlassian's Forge storage on your
site:
- the default framework,
- the JQL and CQL filters,
- a timestamp and item counts for the last time sample evidence was added.

It does **not** store personal data, Atlassian account IDs, or copies of issue or
page content. Evidence is read fresh each time a report is built and is not kept.

## What data the app changes
The app changes your data only when a user clicks a button:
- **Link as evidence** adds one label (for example `cp-iso27001-a-5-18`) to the
  chosen issue or page.
- **Add sample evidence** creates example issues and pages, labelled
  `controlproof-sample` so you can find and delete them.

## Where data goes
ControlProof runs entirely on Atlassian's Forge platform. It declares **no
external egress**, so no data is sent to the developer or any third party. The
Rovo agent uses Atlassian Rovo, under Atlassian's own terms.

## Removing data
Uninstalling the app removes its stored settings. Labels and sample items stay in
Jira and Confluence. You can delete them like any other label, issue or page.

## Contact
Questions or concerns: open an issue at
https://github.com/SarahDoma/controlproof/issues
