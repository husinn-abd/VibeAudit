import {
  Box,
  Boxes,
  Briefcase,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Cloud,
  Copy,
  ExternalLink,
  FileDown,
  FileJson,
  FileText,
  Filter,
  Fingerprint,
  Gauge,
  History,
  Info,
  KeyRound,
  LayoutGrid,
  LockKeyhole,
  Play,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createMarkdownReport } from "@vibeaudit/core/markdown";
import type { ScanReport } from "@vibeaudit/core";
import { findings as demoFindings, policyEvaluation as demoPolicyEvaluation, project, scannerRuns as demoScannerRuns } from "./data";
import { webConfig } from "./config";

type Severity = "critical" | "high" | "medium" | "low";
type Scanner = "semgrep" | "gitleaks" | "trivy";
type Status = "New" | "Acknowledged" | "Accepted";

type Finding = {
  id: string;
  severity: Severity;
  title: string;
  scanner: Scanner;
  ruleId: string;
  location: string;
  status: Status;
};

const navSections = [
  [
    { label: "Projects", icon: Briefcase },
    { label: "Scans", icon: FileText },
    { label: "Findings", icon: Fingerprint },
    { label: "Policy", icon: KeyRound },
    { label: "Reports", icon: FileDown },
    { label: "ISO Evidence", icon: LayoutGrid }
  ],
  [
    { label: "Settings", icon: Settings },
    { label: "Integrations", icon: Cloud },
    { label: "Audit Log", icon: History }
  ]
];

const summaryStats = [
  { label: "Critical", value: 7, severity: "critical" as const },
  { label: "High", value: 13, severity: "high" as const },
  { label: "Medium", value: 28, severity: "medium" as const },
  { label: "Low", value: 42, severity: "low" as const },
  { label: "Info", value: 90, severity: "info" as const }
];

const scanners = [
  { name: "Semgrep", type: "SAST", findings: 221, count: 14, severity: "high" as const, duration: "45s", icon: Sparkles },
  { name: "Gitleaks", type: "Secrets", findings: 47, count: 5, severity: "high" as const, duration: "28s", icon: LockKeyhole },
  { name: "Trivy", type: "SCA / Config", findings: 133, count: 8, severity: "medium" as const, duration: "1m 1s", icon: Box }
];

const findingRows: Finding[] = [
  {
    id: "VA-2026-00101",
    severity: "critical",
    title: "Hardcoded AWS Secret Key",
    scanner: "gitleaks",
    ruleId: "aws-access-key",
    location: ".env:12",
    status: "New"
  },
  {
    id: "VA-2026-00102",
    severity: "critical",
    title: "SQL Injection",
    scanner: "semgrep",
    ruleId: "python.lang.security.audit.sql-injection",
    location: "app/user.py:88",
    status: "New"
  },
  {
    id: "VA-2026-00103",
    severity: "high",
    title: "Use of Weak Hash Algorithm",
    scanner: "semgrep",
    ruleId: "python.lang.security.audit.weak-crypto",
    location: "utils/crypto.py:23",
    status: "New"
  },
  {
    id: "VA-2026-00104",
    severity: "high",
    title: "Exposed Git Credentials",
    scanner: "gitleaks",
    ruleId: "generic-api-key",
    location: "config.yaml:47",
    status: "New"
  },
  {
    id: "VA-2026-00105",
    severity: "high",
    title: "Outdated Dependency (lodash)",
    scanner: "trivy",
    ruleId: "CVE-2024-45590",
    location: "package-lock.json",
    status: "New"
  },
  {
    id: "VA-2026-00106",
    severity: "medium",
    title: "Missing Content Security Policy",
    scanner: "semgrep",
    ruleId: "p/security-misconfig.csp.missing",
    location: "templates/base.html:4",
    status: "Acknowledged"
  },
  {
    id: "VA-2026-00107",
    severity: "medium",
    title: "Directory Listing Enabled",
    scanner: "trivy",
    ruleId: "misconfig/directory-listing",
    location: "nginx.conf:19",
    status: "New"
  },
  {
    id: "VA-2026-00108",
    severity: "low",
    title: "HTTP Allowed",
    scanner: "semgrep",
    ruleId: "p/network-insecure.http-allow",
    location: "config/settings.py:16",
    status: "New"
  }
];

const isoRows = [
  { control: "A.8.25", name: "Secure Coding", status: "Not Met" },
  { control: "A.14.2.5", name: "Secure System Engineering", status: "Not Met" },
  { control: "A.18.1.4", name: "Privacy and Protection of PII", status: "Partially Met" }
];

const selectedDefaultId = "VA-2026-00102";

const demoScanReport: ScanReport = {
  schemaVersion: 1,
  tool: {
    name: "VibeAudit",
    version: "0.3.5"
  },
  target: {
    type: "local_path",
    value: "~/repos/vibeaudit-demo",
    branch: project.branch,
    commit: project.commit
  },
  scannerRuns: demoScannerRuns,
  findings: demoFindings,
  policy: {
    schema_version: 1,
    required_scanners: ["semgrep", "gitleaks", "trivy"],
    fail_on: "high",
    ignored_rules: [],
    accepted_risk_max_days: 90,
    ai_privacy_mode: "disabled"
  },
  policyEvaluation: demoPolicyEvaluation,
  generatedAt: project.generatedAt,
  artifactHash: project.artifactHash
};

export function App() {
  const [activeNav, setActiveNav] = useState("Projects");
  const [selectedFindingId, setSelectedFindingId] = useState(selectedDefaultId);
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [scannerFilter, setScannerFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ruleFilter, setRuleFilter] = useState("All");
  const [detailStatus, setDetailStatus] = useState("New");
  const [assignee, setAssignee] = useState("Unassigned");
  const [exportStatus, setExportStatus] = useState("Report export is ready");

  const visibleFindings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return findingRows.filter((finding) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [finding.title, finding.ruleId, finding.location, finding.scanner]
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesSeverity = severityFilter === "All" || finding.severity === severityFilter.toLowerCase();
      const matchesScanner = scannerFilter === "All" || finding.scanner === scannerFilter.toLowerCase();
      const matchesStatus = statusFilter === "All" || finding.status === statusFilter;
      const matchesRule = ruleFilter === "All" || finding.ruleId.includes(ruleFilter.toLowerCase());
      return matchesQuery && matchesSeverity && matchesScanner && matchesStatus && matchesRule;
    });
  }, [query, ruleFilter, scannerFilter, severityFilter, statusFilter]);

  const selectedFinding = findingRows.find((finding) => finding.id === selectedFindingId) ?? findingRows[1]!;

  function selectFinding(finding: Finding) {
    setSelectedFindingId(finding.id);
    setDetailStatus(finding.status);
  }

  function handleReportExport(format: string) {
    if (format === "MD") {
      downloadMarkdownReport();
      setExportStatus("Markdown .md report downloaded");
      return;
    }

    setExportStatus(`${format} export ready`);
  }

  return (
    <div
      className="app-shell"
      data-api-base-url={webConfig.apiBaseUrl}
      data-demo-mode={String(webConfig.demoMode)}
      data-organization-id={webConfig.organizationId}
      data-project-id={webConfig.projectId}
    >
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <Shield className="brand-logo" size={36} strokeWidth={2.3} />
          <strong>VibeAudit</strong>
        </div>

        <nav className="nav-list">
          {navSections.map((section, sectionIndex) => (
            <div className="nav-section" key={sectionIndex}>
              {section.map((item) => (
                <button
                  aria-pressed={activeNav === item.label}
                  className={activeNav === item.label ? "nav-item active" : "nav-item"}
                  key={item.label}
                  onClick={() => setActiveNav(item.label)}
                >
                  <item.icon size={22} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="local-card">
          <ShieldCheck size={44} />
          <strong>Local-First by Design</strong>
          <p>All scans, results, and reports stay on your machine.</p>
          <button>
            Learn more <ExternalLink size={16} />
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="project-bar">
          <div className="project-title">
            <div className="project-icon">
              <Terminal size={24} />
            </div>
            <div>
              <h1>VibeAudit Demo</h1>
              <div className="repo-line">
                <span>~/repos/vibeaudit-demo</span>
                <Copy size={14} />
                <b>Local Repository</b>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <span className="privacy-chip"><ShieldCheck size={17} /> Privacy</span>
            <span>100% local analysis</span>
            <Info size={17} />
            <span className="divider" />
            <Sun size={21} />
            <button className="avatar">VA</button>
            <ChevronDown size={15} />
          </div>
        </header>

        <section className="summary-strip" aria-label="Security summary">
          <div className="summary-status">
            <ShieldAlert size={44} />
            <div>
              <strong>Blocked by policy</strong>
              <span>Fix 7 Critical and 13 High issues</span>
            </div>
          </div>

          <div className="summary-counts">
            {summaryStats.map((stat) => (
              <button className={`summary-stat severity-${stat.severity}`} key={stat.label}>
                <Shield size={28} />
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="left-stack">
            <section className="top-cards">
              <div className="policy-card">
                <div className="policy-state">
                  <ShieldAlert size={62} />
                  <div>
                    <h2>Policy Gate</h2>
                    <strong>Blocked</strong>
                    <p>Repository does not meet security policy</p>
                  </div>
                </div>
                <div className="policy-rules">
                  <p>
                    Policy: <a href="#policy">Default Security Policy</a>
                  </p>
                  <span>Requirements not met</span>
                  <ul>
                    <li><X size={14} /> No Critical findings allowed</li>
                    <li><X size={14} /> No High findings in production code</li>
                  </ul>
                  <button>View policy <ExternalLink size={14} /></button>
                </div>
              </div>

              <div className="scanner-run-card">
                <h2>Scanner Run</h2>
                <strong>Manual scan required</strong>
                <span>Last scan: May 24, 2025 10:32 AM</span>
                <span>Duration: 2m 14s</span>
                <div className="run-actions">
                  <button onClick={() => setExportStatus("Scanner run queued locally")}>
                    <Play size={18} /> Run All Scanners
                  </button>
                  <button aria-label="Scanner settings"><Settings size={20} /></button>
                </div>
              </div>
            </section>

            <Panel
              action={<button className="text-button">View scan history</button>}
              className="scanner-panel"
              title="Scanners"
            >
              <div className="scanner-cards">
                {scanners.map((scanner) => (
                  <div className="scanner-card" key={scanner.name}>
                    <scanner.icon className={`scanner-logo ${scanner.name.toLowerCase()}`} size={36} />
                    <div>
                      <h3>{scanner.name}</h3>
                      <span>{scanner.type}</span>
                    </div>
                    <SeverityCounter count={scanner.count} severity={scanner.severity} />
                    <p><Check size={14} /> Completed</p>
                    <small>{scanner.findings} findings</small>
                    <em>{scanner.duration}</em>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              action={
                <button className="icon-button" aria-label="Finding table settings">
                  <Settings size={18} />
                </button>
              }
              className="findings-panel"
              title={`Findings (${visibleFindings.length === findingRows.length ? 180 : visibleFindings.length})`}
            >
              <div className="filters">
                <label className="search-field">
                  <Search size={17} />
                  <input
                    aria-label="Search findings"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search findings..."
                    value={query}
                  />
                </label>
                <FilterSelect label="Severity" onChange={setSeverityFilter} options={["All", "Critical", "High", "Medium", "Low"]} value={severityFilter} />
                <FilterSelect label="Scanner" onChange={setScannerFilter} options={["All", "Semgrep", "Gitleaks", "Trivy"]} value={scannerFilter} />
                <FilterSelect label="Status" onChange={setStatusFilter} options={["All", "New", "Acknowledged", "Accepted"]} value={statusFilter} />
                <FilterSelect label="Rule" onChange={setRuleFilter} options={["All", "SQL", "CVE", "AWS"]} value={ruleFilter} />
                <button className="filter-button"><Filter size={17} /> Filters</button>
              </div>

              <div className="findings-table" role="table" aria-label="Findings table">
                <div className="finding-row table-head" role="row">
                  <span><span className="checkbox" /></span>
                  <span>Severity</span>
                  <span>Finding</span>
                  <span>Scanner</span>
                  <span>Rule / ID</span>
                  <span>Location</span>
                  <span>Status</span>
                </div>
                {visibleFindings.map((finding) => (
                  <button
                    aria-pressed={selectedFinding.id === finding.id}
                    className={selectedFinding.id === finding.id ? "finding-row selected" : "finding-row"}
                    key={finding.id}
                    onClick={() => selectFinding(finding)}
                    role="row"
                  >
                    <span><span className="checkbox">{selectedFinding.id === finding.id ? <Check size={15} /> : null}</span></span>
                    <span><SeverityBadge severity={finding.severity} /></span>
                    <span className="finding-title">{finding.title}</span>
                    <span className="scanner-name">{finding.scanner === "gitleaks" ? <LockKeyhole size={15} /> : finding.scanner === "trivy" ? <Boxes size={15} /> : <Sparkles size={15} />}{capitalize(finding.scanner)}</span>
                    <span>{finding.ruleId}</span>
                    <span>{finding.location}</span>
                    <span><StatusDot status={finding.status} /></span>
                  </button>
                ))}
              </div>

              <div className="pagination">
                <button><ChevronLeft size={16} /></button>
                <button className="active-page">1</button>
                <button>2</button>
                <button>3</button>
                <span>...</span>
                <button>18</button>
                <button><ChevronRight size={16} /></button>
                <p>1-10 of 180</p>
                <select aria-label="Rows per page">
                  <option>10 / page</option>
                  <option>25 / page</option>
                </select>
              </div>
            </Panel>
          </div>

          <aside className="right-panel">
            <div className="detail-header">
              <div>
                <h2>{selectedFinding.title}</h2>
                <SeverityBadge severity={selectedFinding.severity} />
              </div>
              <button aria-label="Close finding detail"><X size={22} /></button>
            </div>

            <div className="tag-row">
              <span className="blue-chip"><CircleDot size={13} /> New</span>
              <span className="violet-chip"><Sparkles size={14} /> {capitalize(selectedFinding.scanner)}</span>
              <span>SAST</span>
            </div>

            <dl className="detail-grid">
              <DetailRow label="Rule ID" value={selectedFinding.ruleId} />
              <DetailRow label="Location" value={selectedFinding.location} />
              <DetailRow label="Data Flow" value="user_input -> cursor.execute" />
              <DetailRow label="Introduced" value="May 20, 2025" />
              <div>
                <dt>Status</dt>
                <dd>
                  <select aria-label="Finding status" onChange={(event) => setDetailStatus(event.target.value)} value={detailStatus}>
                    <option>New</option>
                    <option>Acknowledged</option>
                    <option>Accepted</option>
                  </select>
                </dd>
              </div>
              <div>
                <dt>Assignee</dt>
                <dd>
                  <select aria-label="Assignee" onChange={(event) => setAssignee(event.target.value)} value={assignee}>
                    <option>Unassigned</option>
                    <option>Security Lead</option>
                    <option>Developer</option>
                  </select>
                </dd>
              </div>
              <div>
                <dt>Tags</dt>
                <dd className="tag-list">
                  <span>owasp-a03</span>
                  <span>cwe-89</span>
                  <button>+</button>
                </dd>
              </div>
            </dl>

            <section className="evidence-block">
              <h3>Evidence</h3>
              <div className="code-card">
                <div className="code-top">
                  <span>{selectedFinding.location}</span>
                  <Copy size={15} />
                </div>
                <div className="code-lines" aria-label="Finding evidence">
                  <span><b>84</b><code>def get_user(user_id):</code></span>
                  <span><b>85</b><code>    conn = get_db_connection()</code></span>
                  <span><b>86</b><code>    cursor = conn.cursor()</code></span>
                  <span><b>87</b><code>    # Dangerous: user input used in query</code></span>
                  <span className="line-danger"><b>88</b><code>{'    cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")'}</code></span>
                  <span><b>89</b><code>    return cursor.fetchone()</code></span>
                </div>
                <div className="why-box">
                  <strong>Why is this an issue?</strong>
                  <p>User input is directly concatenated into an SQL query, allowing an attacker to modify the query structure.</p>
                  <button>View rule documentation <ExternalLink size={14} /></button>
                </div>
              </div>
            </section>

            <section className="iso-block">
              <h3>ISO Evidence</h3>
              <div className="iso-table">
                <div>
                  <strong>Control</strong>
                  <strong>Control Name</strong>
                  <strong>Evidence Status</strong>
                </div>
                {isoRows.map((row) => (
                  <div key={row.control}>
                    <span>{row.control}</span>
                    <span>{row.name}</span>
                    <span className={row.status === "Not Met" ? "not-met" : "partial"}>{row.status}</span>
                  </div>
                ))}
              </div>
              <button className="text-button">View all mappings (3) <ExternalLink size={14} /></button>
            </section>

            <section className="report-block">
              <h3>Report Export</h3>
              <p>Export this finding or scan results.</p>
              <div className="export-grid">
                {["HTML", "PDF", "JSON", "SARIF", "MD"].map((format) => (
                  <button key={format} onClick={() => handleReportExport(format)}>
                    {format === "JSON" ? <FileJson size={17} /> : format === "SARIF" ? <Gauge size={17} /> : format === "MD" ? <FileText size={17} /> : <FileDown size={17} />}
                    {format}
                  </button>
                ))}
              </div>
              <span className="export-status" aria-live="polite">{exportStatus}</span>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Panel(props: { title: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={props.className ? `panel ${props.className}` : "panel"}>
      <div className="panel-title">
        <h2>{props.title}</h2>
        {props.action}
      </div>
      {props.children}
    </section>
  );
}

function FilterSelect({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="select-filter">
      <span>{label}:</span>
      <select aria-label={`Filter by ${label.toLowerCase()}`} onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function SeverityCounter({ count, severity }: { count: number; severity: "high" | "medium" }) {
  return (
    <div className={`severity-counter severity-${severity}`}>
      <strong>{count}</strong>
      <span>{capitalize(severity)}</span>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={`severity-badge severity-${severity}`}>{capitalize(severity)}</span>;
}

function StatusDot({ status }: { status: Status }) {
  return (
    <span className={`status-dot status-${status.toLowerCase()}`}>
      <CircleDot size={12} />
      {status}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function downloadMarkdownReport() {
  const markdown = createMarkdownReport(demoScanReport);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "vibeaudit-demo-report.md";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
