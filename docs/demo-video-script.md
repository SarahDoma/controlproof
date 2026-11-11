# ControlProof demo video script (target 3:45, hard limit 5:00)

**Setup before recording**
- Use the demo site `one-atlas-viaq.atlassian.net`, a browser at 1280×800 or wider, zoom 110%.
- Sample evidence should already be added. Score should be about 50%. Keep MOBL-64 linked.
- Leave one suggestion unlinked to click live. The **DPIA** page for NDPA S28 is a good one.
- Open these tabs in order:
  1. ControlProof (Jira, then Apps, then ControlProof)
  2. Rovo chat with ControlProof Auditor, new chat
  3. The Confluence page "Access Control Policy"
- Use your own voice and no music. If you add music, it must be royalty-free and you must own the rights.
- No third-party logos. Atlassian product UI is fine, because it's the platform you're building on.

---

## 0:00 – 0:30 · The problem (talking over the ControlProof page, or a simple title slide)

> "Small fintech and health teams in Nigeria and everywhere else hit the same wall
> before an ISO 27001 or SOC 2 audit, or when the Data Protection Commission comes
> asking about NDPA compliance. The evidence already exists: access reviews in
> Jira, incident post-mortems, policy pages in Confluence. But it's scattered,
> and nobody knows which controls are actually covered until the auditor asks.
> Teams lose weeks copying screenshots into spreadsheets."

## 0:30 – 0:50 · What ControlProof is

> "ControlProof is a Forge app that reads the evidence you already have in Jira and
> Confluence, maps it to compliance controls, and tells you honestly where you stand:
> what's covered, what's stale, and what's missing."

Show the top of the ControlProof page: the score, the verdict, and the four status counts.

## 0:50 – 1:50 · Dashboard walkthrough

1. Point at **"50% ready · Needs work"** and the count of each status.
   > "Every control is checked against three things: is evidence linked, is it the
   > right kind (a written policy, real completed work, or both), and is it recent
   > enough? Access reviews must be from the last 120 days, for example."
2. Scroll the **Needs attention** table and read one reason aloud:
   > "No guessing here: *Missing: completed Jira issue; 1 linked issue still open.*"
3. Open **A.5.29 Security during disruption** (Partial).
   > "We have a continuity plan in Confluence, but no evidence that we actually tested it.
   > That's exactly what an auditor would flag."

## 1:50 – 2:30 · Suggestions, linked in one click

1. Switch the framework dropdown to **NDPA (11 controls)**.
   > "It's not just ISO and SOC 2. ControlProof also covers Nigeria's Data Protection Act 2023."
2. Open **S28 Impact assessments**. Under "Suggested evidence", show the DPIA page and its "matched: dpia".
   > "ControlProof found a DPIA page we'd never labelled, and it tells you *why* it
   > suggested it. Nothing is a black box."
3. Click **Link as evidence**. It moves to linked evidence and the score goes up.
   > "One click adds a label to the page. Anyone can see it and anyone can audit it."

## 2:30 – 3:20 · The Rovo agent

1. Switch to the Rovo tab with **ControlProof Auditor**. Click the starter **"Are we audit-ready for ISO 27001?"**
   > "Not everyone will open a dashboard. Managers just ask."
   Show the answer: the score, the verdict and the top three gaps, each with the label to add.
2. Type: **"Show me evidence for access reviews"**.
   Show the linked issue with its age, and any suggestions.
   > "The agent uses three Forge actions: get-readiness, list-gaps and find-evidence.
   > It works in the same data, with the same rules, as the dashboard."

## 3:20 – 3:45 · How it's built, and wrap-up

> "Under the hood: a Jira global page built in UI Kit, a Rovo agent with three
> actions, Forge storage for settings, and the Jira and Confluence REST APIs.
> Every read runs as the signed-in user, so people only ever see evidence they're
> already allowed to see. And there's an 'Add sample evidence' button, so you can
> try it on your own site in two minutes.
>
> ControlProof doesn't certify you. Only an auditor can do that. But it means that
> when the auditor arrives, you already know the answer. Thanks for watching."

---

## Submission text checklist
- **Repo:** https://github.com/SarahDoma/controlproof
- **Category:** Apps for Specialized Industries
- **Bonus prize:** Best Agents (Rovo). ControlProof uses `rovo:agent` and three `action` modules.
- **How it meets the tech requirement:**
  - It's a Forge app (`manifest.yml`).
  - It has a `jira:globalPage` built with UI Kit, a `rovo:agent`, three `action` modules and storage in `@forge/kvs`.
  - It integrates with Jira (search, labels) and Confluence (CQL search, pages, labels).
- **Install instructions for judges:**
  1. Open the [installation link](https://developer.atlassian.com/console/install/47b69b15-1c3a-4a59-a901-235cbe410fb7?signature=AYABeLkoGeU9i5yX%2F69jElqeNWYAAAADAAdhd3Mta21zAEthcm46YXdzOmttczp1cy13ZXN0LTI6NzA5NTg3ODM1MjQzOmtleS83MDVlZDY3MC1mNTdjLTQxYjUtOWY5Yi1lM2YyZGNjMTQ2ZTcAuAECAQB4CxqLTo9l4lqXuFjNim1xJM%2Bp%2F3TVP9xHS2BrU5DRRucB6f%2F3U3C%2FoETwyXFKs8l07AAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDC9JYCEfHi1qApEriAIBEIA7EYYFhSioaPIh9A3h5pCidl0KxYjzCL01p66meBUVjnWcW48LdMzBKOZMZYiU4KYUfknRKXfDV14s9oYAB2F3cy1rbXMAS2Fybjphd3M6a21zOmV1LXdlc3QtMTo3MDk1ODc4MzUyNDM6a2V5LzQ2MzBjZTZiLTAwYzMtNGRlMi04NzdiLTYyN2UyMDYwZTVjYwC4AQICAHi9bVMAkme4qVQX1fQHo6ePw3H40A7cGfz7yrmSfBWMXgFOlzdbHmfwcBoHB5oDFawCAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQM5HWcjK%2BvXToCu6PdAgEQgDuQMsyW2KJWiyQsWdHiG5M0KZBs9VVQ3jF6ML%2FJ8q2AQ8%2FJK3PGDes5WWSutW2whxiSAA7boGtu%2FcnfWQAHYXdzLWttcwBLYXJuOmF3czprbXM6dXMtZWFzdC0xOjcwOTU4NzgzNTI0MzprZXkvNmMxMjBiYTAtNGNkNS00OTg1LWI4MmUtNDBhMDQ5NTJjYzU3ALgBAgIAeDYASx0XCjkny4iLV6vz%2BKtEGSGT6kdt0QRpkn6D%2FlVEAddqQYdJGVokOGxc1o35q00AAAB%2BMHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAw95iDd%2F1Fsqiga8woCARCAO8dtFeLjvXrMTbhZuHc45rrkAR4Sg42jEfdMFcECnBDLUDiErH6HOZ70B%2F8jF2nUdV%2FTDC1jFaIYeVF8AgAAAAAMAAAQAAAAAAAAAAAAAAAAAHnqGIbp0qJsZmSRSMDui7L%2F%2F%2F%2F%2FAAAAAQAAAAAAAAAAAAAAAQAAADIZt0n0ADuIdTTtdAuxsA2dZRI3g06gEYIVKss88Lw7c6ulBMHRRFK69t5313t8y5VqFfQ%2Fxc0gDGNvLuDnDGtJMw4%3D&product=confluence&product=jira) and install on a site with **both Jira and Confluence**.
  2. In Jira, open **Apps, then ControlProof**. Go to **Settings, then Add sample evidence**.
  3. Click **Refresh**. You can then explore the dashboard, or chat with **ControlProof Auditor** in Rovo.
