/**
 * Control catalogues.
 *
 * Descriptions are ControlProof's own plain-language paraphrases; only the
 * public control identifiers come from the standards. They are a practical
 * starting set, not the full text of any standard.
 *
 * expects: 'policy'   -> a written document (Confluence page) is required
 *          'activity' -> recurring work (Jira issues) is required
 * maxAgeDays: evidence older than this is treated as stale.
 */

const c = (id, title, description, keywords, expects, maxAgeDays = 365) => ({
  id, title, description, keywords, expects, maxAgeDays,
});

export const FRAMEWORKS = {
  iso27001: {
    id: 'iso27001',
    name: 'ISO/IEC 27001:2022 (Annex A, core set)',
    short: 'ISO 27001',
    controls: [
      c('A.5.1', 'Security policies', 'An approved information security policy exists and is reviewed.', ['security policy', 'information security policy', 'isms'], ['policy']),
      c('A.5.9', 'Asset inventory', 'Information assets and their owners are listed and kept current.', ['asset inventory', 'asset register', 'cmdb', 'inventory'], ['policy', 'activity']),
      c('A.5.15', 'Access control', 'Rules for who can access what are defined and followed.', ['access control', 'least privilege', 'rbac', 'permissions'], ['policy']),
      c('A.5.18', 'Access rights reviews', 'User access is granted, reviewed regularly and removed when no longer needed.', ['access review', 'user access review', 'offboarding', 'revoke access', 'deprovision'], ['activity'], 120),
      c('A.5.23', 'Cloud service security', 'Security of cloud services in use is managed.', ['cloud security', 'aws', 'azure', 'gcp', 'cloud provider'], ['policy']),
      c('A.5.24', 'Incident response planning', 'There is a plan for handling security incidents.', ['incident response', 'incident plan', 'runbook', 'escalation'], ['policy']),
      c('A.5.26', 'Incident handling', 'Security incidents are recorded, handled and closed.', ['incident', 'security incident', 'breach', 'postmortem', 'post-mortem'], ['activity'], 180),
      c('A.5.29', 'Security during disruption', 'Security is maintained during outages and disasters.', ['business continuity', 'disaster recovery', 'bcp', 'dr test'], ['policy', 'activity']),
      c('A.5.34', 'Privacy and personal data', 'Personal data is protected as required by law.', ['privacy', 'personal data', 'pii', 'gdpr', 'ndpa', 'data protection'], ['policy']),
      c('A.6.3', 'Security awareness training', 'Staff receive security awareness training.', ['security training', 'awareness training', 'phishing training', 'onboarding training'], ['activity']),
      c('A.8.7', 'Malware protection', 'Systems are protected against malware.', ['antivirus', 'malware', 'endpoint protection', 'edr'], ['policy', 'activity']),
      c('A.8.8', 'Vulnerability management', 'Technical vulnerabilities are found and fixed in time.', ['vulnerability', 'cve', 'patch', 'pentest', 'penetration test', 'dependency update', 'security scan'], ['activity'], 90),
      c('A.8.13', 'Backups', 'Backups are taken and restores are tested.', ['backup', 'restore test', 'snapshot'], ['activity'], 180),
      c('A.8.15', 'Logging', 'Security-relevant events are logged and protected.', ['logging', 'audit log', 'siem', 'log retention'], ['policy', 'activity']),
      c('A.8.24', 'Use of cryptography', 'Encryption is used appropriately and keys are managed.', ['encryption', 'tls', 'kms', 'key rotation', 'cryptography'], ['policy']),
      c('A.8.25', 'Secure development lifecycle', 'Security is built into how software is developed.', ['secure development', 'sdlc', 'threat model', 'security review'], ['policy']),
      c('A.8.28', 'Secure coding', 'Code is written and reviewed with security in mind.', ['code review', 'secure coding', 'sast', 'lint', 'pull request review'], ['activity'], 180),
      c('A.8.32', 'Change management', 'Changes to systems are planned, approved and tracked.', ['change management', 'change request', 'release', 'deployment approval', 'cab'], ['activity'], 180),
    ],
  },
  soc2: {
    id: 'soc2',
    name: 'SOC 2 Trust Services Criteria (Security, core set)',
    short: 'SOC 2',
    controls: [
      c('CC1.4', 'Hiring and competence', 'People are hired, trained and kept competent for their roles.', ['background check', 'hiring', 'onboarding', 'training'], ['activity']),
      c('CC2.2', 'Internal communication', 'Security responsibilities are communicated inside the organisation.', ['security policy', 'policy acknowledgement', 'handbook'], ['policy']),
      c('CC3.2', 'Risk assessment', 'Risks are identified and assessed regularly.', ['risk assessment', 'risk register', 'risk review'], ['policy', 'activity']),
      c('CC4.1', 'Monitoring of controls', 'Controls are checked to make sure they keep working.', ['control review', 'internal audit', 'compliance review'], ['activity']),
      c('CC5.3', 'Policies and procedures', 'Policies are documented and put into practice.', ['policy', 'procedure', 'standard operating procedure', 'sop'], ['policy']),
      c('CC6.1', 'Logical access', 'Access to systems and data is restricted and protected.', ['access control', 'sso', 'mfa', 'least privilege'], ['policy']),
      c('CC6.2', 'User provisioning', 'Accounts are created and removed through an approved process.', ['onboarding', 'offboarding', 'provision', 'deprovision', 'revoke access'], ['activity'], 120),
      c('CC6.3', 'Access reviews', 'Access is reviewed and adjusted regularly.', ['access review', 'user access review', 'permission review'], ['activity'], 120),
      c('CC7.1', 'Vulnerability detection', 'Systems are monitored for vulnerabilities and misconfiguration.', ['vulnerability', 'security scan', 'cve', 'pentest'], ['activity'], 90),
      c('CC7.3', 'Incident evaluation', 'Security events are evaluated to decide if they are incidents.', ['incident', 'triage', 'security event', 'alert'], ['activity'], 180),
      c('CC7.4', 'Incident response', 'Incidents are contained, fixed and communicated.', ['incident response', 'postmortem', 'runbook'], ['policy', 'activity']),
      c('CC8.1', 'Change management', 'Changes are authorised, tested and approved before release.', ['change management', 'code review', 'release', 'deployment approval'], ['activity'], 180),
      c('A1.2', 'Backup and recovery', 'Backups and recovery are in place and tested.', ['backup', 'restore test', 'disaster recovery'], ['activity'], 180),
    ],
  },
  ndpa: {
    id: 'ndpa',
    name: 'Nigeria Data Protection Act 2023 (core obligations)',
    short: 'NDPA',
    controls: [
      c('S24', 'Data processing principles', 'Personal data is processed lawfully, fairly, for a clear purpose and kept minimal.', ['data minimisation', 'purpose limitation', 'privacy principles', 'data protection'], ['policy']),
      c('S25', 'Lawful basis', 'Each processing activity has a documented lawful basis such as consent or contract.', ['lawful basis', 'consent', 'legitimate interest', 'ropa', 'processing register'], ['policy']),
      c('S26', 'Consent', 'Where consent is relied on, it is freely given, recorded and can be withdrawn.', ['consent', 'opt-in', 'cookie banner', 'withdraw consent'], ['policy', 'activity']),
      c('S27', 'Privacy notice', 'People are told how their data is used.', ['privacy notice', 'privacy policy', 'transparency'], ['policy']),
      c('S28', 'Impact assessments', 'High-risk processing gets a data protection impact assessment.', ['dpia', 'impact assessment', 'privacy impact'], ['policy']),
      c('S32', 'Data protection officer', 'A data protection officer is designated.', ['dpo', 'data protection officer'], ['policy']),
      c('S34', 'Data subject access', 'Requests for access to personal data are handled in time.', ['subject access', 'dsar', 'data request', 'right of access'], ['activity'], 180),
      c('S36', 'Rectification and erasure', 'Requests to correct or delete data are handled.', ['erasure', 'delete my data', 'rectification', 'right to be forgotten'], ['activity'], 180),
      c('S39', 'Security of processing', 'Appropriate technical and organisational security measures protect personal data.', ['encryption', 'access control', 'security measures', 'pseudonymisation'], ['policy']),
      c('S40', 'Breach notification', 'Personal data breaches are reported to the Commission within 72 hours when required.', ['breach notification', 'data breach', '72 hours', 'ndpc'], ['policy', 'activity']),
      c('S41', 'Cross-border transfers', 'Transfers of personal data outside Nigeria have an adequate basis.', ['cross-border', 'international transfer', 'data transfer', 'adequacy'], ['policy']),
    ],
  },
};

export const FRAMEWORK_IDS = Object.keys(FRAMEWORKS);

/** Label used to link a Jira issue or Confluence page to a control.
 *  Only lowercase letters, digits and hyphens, valid in both products.
 *  e.g. ('iso27001', 'A.5.15') -> 'cp-iso27001-a-5-15' */
export function controlLabel(frameworkId, controlId) {
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `cp-${norm(frameworkId)}-${norm(controlId)}`;
}

export function getFramework(id) {
  const fw = FRAMEWORKS[id];
  if (!fw) throw new Error(`Unknown framework "${id}". Use one of: ${FRAMEWORK_IDS.join(', ')}`);
  return fw;
}

export function findControl(frameworkId, query) {
  const fw = getFramework(frameworkId);
  const q = String(query || '').trim().toLowerCase();
  if (!q) return null;
  return fw.controls.find((ctl) => ctl.id.toLowerCase() === q)
    || fw.controls.find((ctl) => ctl.title.toLowerCase() === q)
    || fw.controls.find((ctl) => ctl.title.toLowerCase().includes(q)
      || ctl.keywords.some((k) => k.includes(q) || q.includes(k)))
    || null;
}
