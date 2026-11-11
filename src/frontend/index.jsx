import React, { useCallback, useEffect, useState } from 'react';
import ForgeReconciler, {
  Badge, Box, Button, DynamicTable, Heading, Inline, Label, Link, Lozenge,
  Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition,
  ProgressBar, SectionMessage, Select, Spinner, Stack, Tab, TabList, TabPanel,
  Tabs, Text, Textfield, xcss,
} from '@forge/react';
import { invoke } from '@forge/bridge';

const STATUS_UI = {
  covered: { label: 'Covered', appearance: 'success' },
  partial: { label: 'Partial', appearance: 'inprogress' },
  stale: { label: 'Stale', appearance: 'moved' },
  gap: { label: 'Missing', appearance: 'removed' },
};
const VERDICT_UI = {
  'Audit-ready': 'success', 'Nearly ready': 'inprogress', 'Needs work': 'moved', 'Not ready': 'removed',
};
const FILTERS = [
  { label: 'All controls', value: 'all' },
  { label: 'Needs attention', value: 'open' },
  { label: 'Missing', value: 'gap' },
  { label: 'Stale', value: 'stale' },
  { label: 'Partial', value: 'partial' },
  { label: 'Covered', value: 'covered' },
];

const card = xcss({
  padding: 'space.200', borderRadius: 'border.radius.200',
  borderColor: 'color.border', borderStyle: 'solid', borderWidth: 'border.width',
});

const fmtDate = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '—');
const StatusLozenge = ({ status }) => (
  <Lozenge appearance={STATUS_UI[status].appearance} isBold={status === 'gap'}>{STATUS_UI[status].label}</Lozenge>
);

function Summary({ report }) {
  const { counts, total } = report;
  return (
    <Box xcss={card}>
      <Stack space="space.150">
        <Inline space="space.200" alignBlock="center" shouldWrap>
          <Heading as="h2">{report.score}% ready</Heading>
          <Lozenge appearance={VERDICT_UI[report.verdict]} isBold>{report.verdict}</Lozenge>
          <Text>{report.framework.name}</Text>
        </Inline>
        <ProgressBar value={report.score / 100} ariaLabel="Audit readiness" appearance={report.score >= 90 ? 'success' : 'default'} />
        <Inline space="space.300" shouldWrap>
          {['covered', 'partial', 'stale', 'gap'].map((s) => (
            <Inline key={s} space="space.075" alignBlock="center">
              <StatusLozenge status={s} />
              <Badge>{counts[s]}</Badge>
            </Inline>
          ))}
          <Text>of {total} controls</Text>
        </Inline>
      </Stack>
    </Box>
  );
}

function ControlModal({ framework, controlId, onClose, onLinked }) {
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setDetail(null);
    invoke('getControl', { framework, controlId }).then(setDetail).catch((e) => setError(String(e.message || e)));
  }, [framework, controlId]);
  useEffect(load, [load]);

  const link = async (s) => {
    setBusy(s.key);
    try {
      await invoke('acceptSuggestion', { framework, controlId, item: { source: s.source, key: s.key, id: s.id } });
      onLinked();
      load();
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setBusy(null);
    }
  };

  const ctl = detail?.control;
  return (
    <Modal onClose={onClose} width="large">
      <ModalHeader>
        <ModalTitle>{ctl ? `${ctl.id} · ${ctl.title}` : controlId}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        {error && <SectionMessage appearance="error"><Text>{error}</Text></SectionMessage>}
        {!detail && !error && <Spinner label="Loading control" />}
        {detail?.error && <SectionMessage appearance="warning"><Text>{detail.error}</Text></SectionMessage>}
        {ctl && (
          <Stack space="space.200">
            <Inline space="space.100" alignBlock="center"><StatusLozenge status={ctl.status} /><Text>{ctl.reason}</Text></Inline>
            <Text>{ctl.description}</Text>
            <Text>
              Expects: {ctl.expects.map((k) => (k === 'policy' ? 'a Confluence policy page' : 'completed Jira work')).join(' + ')}
              {' '}· evidence counts as current for {ctl.maxAgeDays} days · label <Text as="strong">{ctl.label}</Text>
            </Text>

            <Heading as="h4">Linked evidence ({ctl.evidence.length})</Heading>
            {ctl.evidence.length ? ctl.evidence.map((e) => (
              <Inline key={e.key} space="space.100" alignBlock="center" shouldWrap>
                <Lozenge appearance={e.fresh ? 'success' : 'moved'}>{e.fresh ? 'current' : `${e.ageDays}d old`}</Lozenge>
                <Link href={e.url} openNewTab>{e.source === 'jira' ? `${e.key} ` : ''}{e.title}</Link>
                <Text>{e.source === 'jira' ? e.state.replace('_', ' ') : 'page'} · {fmtDate(e.updated)}</Text>
              </Inline>
            )) : <Text>Nothing linked yet.</Text>}

            <Heading as="h4">Suggested evidence</Heading>
            {detail.suggestions.length ? detail.suggestions.map((s) => (
              <Inline key={s.key} space="space.100" alignBlock="center" shouldWrap>
                <Button appearance="primary" spacing="compact" isDisabled={!!busy} onClick={() => link(s)}>
                  {busy === s.key ? 'Linking…' : 'Link as evidence'}
                </Button>
                <Link href={s.url} openNewTab>{s.source === 'jira' ? `${s.key} ` : ''}{s.title}</Link>
                <Text>matched: {s.matched.join(', ')}</Text>
              </Inline>
            )) : <Text>No likely evidence found. Create a Jira task or Confluence page and add the label above.</Text>}
          </Stack>
        )}
      </ModalBody>
      <ModalFooter><Button onClick={onClose}>Close</Button></ModalFooter>
    </Modal>
  );
}

function Settings({ settings, frameworks, onSaved }) {
  const [jql, setJql] = useState(settings.jql);
  const [cql, setCql] = useState(settings.cql);
  const [fw, setFw] = useState(settings.framework);
  const [msg, setMsg] = useState(null);
  const save = async () => {
    try {
      await invoke('saveSettings', { jql, cql, framework: fw });
      setMsg({ appearance: 'success', text: 'Saved.' });
      onSaved(fw);
    } catch (e) {
      setMsg({ appearance: 'error', text: String(e.message || e) });
    }
  };
  return (
    <Stack space="space.200">
      <Stack space="space.050">
        <Label labelFor="fw">Default framework (used by the Rovo agent too)</Label>
        <Select id="fw" options={frameworks.map((f) => ({ label: f.name, value: f.id }))}
          value={frameworks.filter((f) => f.id === fw).map((f) => ({ label: f.name, value: f.id }))[0]}
          onChange={(o) => setFw(o.value)} />
      </Stack>
      <Stack space="space.050">
        <Label labelFor="jql">Jira issues to scan (JQL)</Label>
        <Textfield id="jql" value={jql} onChange={(e) => setJql(e.target.value)} />
      </Stack>
      <Stack space="space.050">
        <Label labelFor="cql">Confluence pages to scan (CQL)</Label>
        <Textfield id="cql" value={cql} onChange={(e) => setCql(e.target.value)} />
      </Stack>
      <Inline space="space.100"><Button appearance="primary" onClick={save}>Save settings</Button></Inline>
      {msg && <SectionMessage appearance={msg.appearance}><Text>{msg.text}</Text></SectionMessage>}
      <SampleData onSeeded={() => onSaved(fw)} />
    </Stack>
  );
}

function SampleData({ onSeeded }) {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const run = async () => {
    setBusy(true);
    try {
      const r = await invoke('seedSample');
      setRes(r);
      onSeeded();
    } catch (e) {
      setRes({ issues: [], pages: [], warnings: [String(e.message || e)] });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Stack space="space.100">
      <Heading as="h4">Try it with sample evidence</Heading>
      <Text>
        Creates 9 Jira issues and 7 Confluence pages (an access review, a backup restore test, an incident response plan
        and more), all labelled controlproof-sample so you can find and delete them later. Some are linked to controls,
        some are left unlinked so you can see suggestions.
      </Text>
      <Inline><Button onClick={run} isDisabled={busy}>{busy ? 'Creating…' : 'Add sample evidence'}</Button></Inline>
      {res && (
        <SectionMessage appearance={res.warnings.length ? 'warning' : 'success'}>
          <Text>
            Created {res.issues.length} issues and {res.pages.length} pages
            {res.skipped ? ` (${res.skipped} already existed)` : ''}.
          </Text>
          {res.warnings.map((w) => <Text key={w}>{w}</Text>)}
        </SectionMessage>
      )}
    </Stack>
  );
}

function App() {
  const [frameworks, setFrameworks] = useState([]);
  const [framework, setFramework] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(FILTERS[1]);
  const [open, setOpen] = useState(null);

  const load = useCallback(async (fw) => {
    setLoading(true);
    setError(null);
    try {
      const res = await invoke('getReport', { framework: fw });
      setData(res);
      setFramework(res.settings.framework);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    invoke('getFrameworks').then(setFrameworks);
    load();
  }, [load]);

  const report = data?.report;
  const rows = (report?.controls || [])
    .filter((c) => filter.value === 'all' || (filter.value === 'open' ? c.status !== 'covered' : c.status === filter.value))
    .map((c) => ({
      key: c.id,
      cells: [
        { key: 'id', content: <Text as="strong">{c.id}</Text> },
        { key: 'title', content: c.title },
        { key: 'status', content: <StatusLozenge status={c.status} /> },
        { key: 'reason', content: c.reason },
        { key: 'ev', content: String(c.evidence.length) },
        { key: 'upd', content: fmtDate(c.lastUpdated) },
        { key: 'act', content: <Button spacing="compact" onClick={() => setOpen(c.id)}>Details</Button> },
      ],
    }));
  const head = {
    cells: [
      { key: 'id', content: 'Control' }, { key: 'title', content: 'Name' }, { key: 'status', content: 'Status' },
      { key: 'reason', content: 'Why' }, { key: 'ev', content: 'Evidence' }, { key: 'upd', content: 'Last update' },
      { key: 'act', content: '' },
    ],
  };
  const fwOptions = frameworks.map((f) => ({ label: `${f.short} (${f.count} controls)`, value: f.id }));

  return (
    <Stack space="space.300">
      <Inline space="space.200" alignBlock="center" spread="space-between" shouldWrap>
        <Text>Audit evidence from your Jira issues and Confluence pages, checked against compliance controls.</Text>
        <Inline space="space.100" alignBlock="center">
          <Box xcss={xcss({ width: '240px' })}>
            <Select options={fwOptions} value={fwOptions.find((o) => o.value === framework)}
              onChange={(o) => load(o.value)} isDisabled={loading} />
          </Box>
          <Button onClick={() => load(framework)} isDisabled={loading}>Refresh</Button>
        </Inline>
      </Inline>

      {error && <SectionMessage appearance="error" title="Could not build the report"><Text>{error}</Text></SectionMessage>}
      {(data?.warnings || []).map((w) => (
        <SectionMessage key={w} appearance="warning"><Text>{w}</Text></SectionMessage>
      ))}
      {loading && !report && <Spinner size="large" label="Scanning Jira and Confluence" />}

      {report && (
        <>
          <Summary report={report} />
          {report.counts.gap === report.total && (
            <SectionMessage appearance="information" title="No evidence linked yet">
              <Text>
                Open a control and link suggested Jira issues or Confluence pages, or go to Settings and add sample
                evidence to see ControlProof in action.
              </Text>
            </SectionMessage>
          )}
          <Tabs id="cp-tabs">
            <TabList>
              <Tab>Controls</Tab>
              <Tab>Settings</Tab>
            </TabList>
            <TabPanel>
              <Stack space="space.150">
                <Box xcss={xcss({ width: '220px', paddingTop: 'space.150' })}>
                  <Select options={FILTERS} value={filter} onChange={setFilter} />
                </Box>
                <DynamicTable head={head} rows={rows} isLoading={loading} rowsPerPage={20}
                  emptyView={<Text>Nothing here. Every control in this filter is covered.</Text>} />
              </Stack>
            </TabPanel>
            <TabPanel>
              <Box xcss={xcss({ paddingTop: 'space.150', maxWidth: '640px' })}>
                <Settings settings={data.settings} frameworks={frameworks} onSaved={(fw) => load(fw)} />
              </Box>
            </TabPanel>
          </Tabs>
        </>
      )}

      <ModalTransition>
        {open && (
          <ControlModal framework={framework} controlId={open} onClose={() => setOpen(null)} onLinked={() => load(framework)} />
        )}
      </ModalTransition>
    </Stack>
  );
}

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
