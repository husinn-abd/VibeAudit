import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Database,
  Eye,
  FileDown,
  FileJson,
  Fingerprint,
  Gauge,
  GitBranch,
  GitCommit,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Network,
  PlayCircle,
  Search,
  ShieldCheck,
  ShieldX,
  Siren,
  Sparkles,
  Terminal,
  UploadCloud
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { FindingStatus, NormalizedFinding, ScannerName, Severity } from "@vibeaudit/core";
import { findings, isoCoverage, policyEvaluation, project, scannerRuns } from "./data.js";

const navItems = [
  { label: "Projects", icon: LayoutDashboard },
  { label: "Scans", icon: PlayCircle },
  { label: "Findings", icon: Siren },
  { label: "Policy", icon: ListChecks },
  { label: "Reports", icon: FileDown },
  { label: "ISO Evidence", icon: Archive }
];

const severityOrder: Severity[] = ["critical", "high", "medium", "low", "info"];
type SeverityFilter = Severity | "all";
type ScannerFilter = ScannerName | "all";

const initialStatusById = findings.reduce<Record<string, FindingStatus>>((statuses, finding) => {
  statuses[finding.id] = finding.status;
  return statuses;
}, {});

export function App() {
  const [activeNav, setActiveNav] = useState("Findings");
  const [selectedFindingId, setSelectedFindingId] = useState(findings[0]!.id);
  const [exportStatus, setExportStatus] = useState("No report generated in this session");
  const [workflowNotice, setWorkflowNotice] = useState("Ready for normalized scan import");
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [scannerFilter, setScannerFilter] = useState<ScannerFilter>("all");
  const [statusById, setStatusById] = useState<Record<string, FindingStatus>>(initialStatusById);

  const findingsWithStatus = useMemo(
    () =>
      findings.map((finding) => ({
        ...finding,
        status: statusById[finding.id] ?? finding.status
      })),
    [statusById]
  );

  const scannerOptions = useMemo(
    () => Array.from(new Set(findings.map((finding) => finding.scanner))),
    []
  );

  const selectedFinding = useMemo(
    () => findingsWithStatus.find((finding) => finding.id === selectedFindingId) ?? findingsWithStatus[0]!,
    [findingsWithStatus, selectedFindingId]
  );

  const filteredFindings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return findingsWithStatus.filter((finding) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [finding.title, finding.filePath, finding.ruleId, finding.scanner]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery));
      const matchesSeverity = severityFilter === "all" || finding.severity === severityFilter;
      const matchesScanner = scannerFilter === "all" || finding.scanner === scannerFilter;
      return matchesSearch && matchesSeverity && matchesScanner;
    });
  }, [findingsWithStatus, scannerFilter, searchQuery, severityFilter]);

  const severityCounts = severityOrder.map((severity) => ({
    severity,
    count: findingsWithStatus.filter((finding) => finding.severity === severity).length
  }));
  const openBlockedCount = policyEvaluation.blockedFindingIds.filter((id) => statusById[id] !== "accepted").length;
  const policyBlocked = openBlockedCount > 0;

  const flowSteps = [
    {
      label: "Scan",
      meta: `${scannerRuns.length} required scanners`,
      value: `${scannerRuns.filter((run) => run.status === "success").length}/${scannerRuns.length} done`,
      icon: PlayCircle
    },
    {
      label: "Normalize",
      meta: "Stable schema",
      value: `${findingsWithStatus.length} findings`,
      icon: Fingerprint
    },
    {
      label: "Policy",
      meta: `fail_on: ${policyEvaluation.threshold}`,
      value: `${openBlockedCount} blocked`,
      icon: ListChecks
    },
    {
      label: "Review",
      meta: "Evidence + ISO",
      value: `${isoCoverage.length} controls`,
      icon: Eye
    },
    {
      label: "Export",
      meta: "HTML PDF JSON SARIF",
      value: "4 formats",
      icon: FileDown
    }
  ];

  function acceptSelectedRisk() {
    setStatusById((current) => ({ ...current, [selectedFinding.id]: "accepted" }));
    setWorkflowNotice(`${selectedFinding.title} accepted for this review session`);
  }

  function resetFilters() {
    setSearchQuery("");
    setSeverityFilter("all");
    setScannerFilter("all");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={24} strokeWidth={2.5} />
          </div>
          <div>
            <strong>VibeAudit</strong>
            <span>Local-first security auditor</span>
          </div>
        </div>

        <div className="workspace-switcher">
          <span>Workspace</span>
          <button onClick={() => setWorkflowNotice("Workspace selector is using the seeded local workspace")}>
            <Database size={16} />
            Local repository
            <ChevronDown size={15} />
          </button>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              aria-pressed={activeNav === item.label}
              className={activeNav === item.label ? "nav-item active" : "nav-item"}
              key={item.label}
              onClick={() => setActiveNav(item.label)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <div className="shield-orb">
            <LockKeyhole size={20} />
          </div>
          <strong>Local-first by design</strong>
          <p>Source stays on the machine unless a user chooses to send artifacts.</p>
          <span>v0.2.0 / pre-release</span>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="project-heading">
            <div className="release-line">
              <span>v0.2.0</span>
              <span>public MVP</span>
              <span>{activeNav}</span>
            </div>
            <h1>{project.name}</h1>
            <p>
              <GitBranch size={14} /> {project.repository}
              <span>/</span>
              <GitCommit size={14} /> {project.branch}:{project.commit}
            </p>
          </div>
          <div className="topbar-actions">
            <button
              className="secondary-action"
              onClick={() => setWorkflowNotice("corepack pnpm --filter @vibeaudit/runner scan:mock")}
            >
              <Terminal size={17} />
              Runner CLI
            </button>
            <button
              className="primary-action"
              onClick={() => setWorkflowNotice("Normalized scan JSON is ready to import into the dashboard")}
            >
              <UploadCloud size={17} />
              Import scan
            </button>
          </div>
        </header>

        <section className="command-grid" aria-label="Audit command center">
          <div className={policyBlocked ? "gate-panel blocked" : "gate-panel passed"}>
            <div className="panel-heading">
              <div>
                <span className="label">Policy gate</span>
                <h2>{policyBlocked ? "Blocked by policy" : "Ready to ship"}</h2>
              </div>
              {policyBlocked ? <ShieldX className="danger-icon" /> : <CheckCircle2 className="ok-icon" />}
            </div>
            <p>
              Threshold is <strong>{policyEvaluation.threshold}</strong>. Required scanners completed:
              {" "}{policyEvaluation.requiredScanners.join(", ")}.
            </p>
            <div className="gate-meter">
              <span style={{ width: policyBlocked ? "68%" : "100%" }} />
            </div>
            <dl className="gate-stats">
              <MetricTerm label="Blocked" value={String(openBlockedCount)} />
              <MetricTerm label="Redacted" value={`${findingsWithStatus.filter((finding) => finding.masked).length}`} />
              <MetricTerm label="Artifact" value={project.artifactHash.slice(0, 10)} />
            </dl>
          </div>

          <div className="flow-panel">
            <div className="section-header plain">
              <h2>Scan flow</h2>
              <span>{workflowNotice}</span>
            </div>
            <div className="flow-rail">
              {flowSteps.map((step, index) => (
                <div className="flow-step" key={step.label}>
                  <div className="flow-icon">
                    <step.icon size={17} />
                  </div>
                  <div>
                    <strong>{step.label}</strong>
                    <span>{step.meta}</span>
                  </div>
                  <b>{step.value}</b>
                  {index < flowSteps.length - 1 ? <ChevronRight className="flow-arrow" size={15} /> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="integrity-panel">
            <div className="panel-heading compact">
              <div>
                <span className="label">Evidence integrity</span>
                <h2>Artifact chain</h2>
              </div>
              <Fingerprint size={22} />
            </div>
            <code>{project.artifactHash}</code>
            <p>Scanner metadata, redaction state, and SHA-256 evidence hashes are preserved in reports.</p>
          </div>
        </section>

        <section className="kpi-grid" aria-label="Severity summary">
          {severityCounts.map((item) => (
            <button
              className={`metric-card severity-${item.severity}`}
              key={item.severity}
              onClick={() => setSeverityFilter(item.severity)}
            >
              <span>{item.severity}</span>
              <strong>{item.count}</strong>
            </button>
          ))}
        </section>

        <section className="content-grid">
          <div className="main-column">
            <Panel
              action={
                <button onClick={resetFilters}>
                  Reset
                  <ChevronRight size={15} />
                </button>
              }
              title={`Findings (${filteredFindings.length})`}
            >
              <div className="toolbar" role="search">
                <label className="search-box">
                  <Search size={16} />
                  <input
                    aria-label="Search findings"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search finding, rule, file..."
                    value={searchQuery}
                  />
                </label>
                <label>
                  <span>Severity</span>
                  <select
                    aria-label="Filter by severity"
                    onChange={(event) => setSeverityFilter(event.target.value as SeverityFilter)}
                    value={severityFilter}
                  >
                    <option value="all">All</option>
                    {severityOrder.map((severity) => (
                      <option key={severity} value={severity}>
                        {severity}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Scanner</span>
                  <select
                    aria-label="Filter by scanner"
                    onChange={(event) => setScannerFilter(event.target.value as ScannerFilter)}
                    value={scannerFilter}
                  >
                    <option value="all">All</option>
                    {scannerOptions.map((scanner) => (
                      <option key={scanner} value={scanner}>
                        {scanner}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="finding-table" role="table" aria-label="Findings table">
                <div className="table-row table-head" role="row">
                  <span>Severity</span>
                  <span>Finding</span>
                  <span>Scanner</span>
                  <span>Status</span>
                  <span>ISO</span>
                </div>
                {filteredFindings.map((finding) => (
                  <FindingRow
                    finding={finding}
                    isSelected={finding.id === selectedFinding.id}
                    key={finding.id}
                    onSelect={() => setSelectedFindingId(finding.id)}
                  />
                ))}
                {filteredFindings.length === 0 ? (
                  <div className="empty-row">
                    <ClipboardCheck size={18} />
                    <span>No findings match this filter.</span>
                  </div>
                ) : null}
              </div>
            </Panel>

            <Panel
              action={
                <button onClick={() => setActiveNav("Scans")}>
                  Logs
                  <ChevronRight size={15} />
                </button>
              }
              title="Scanner run"
            >
              <div className="scanner-run-grid">
                {scannerRuns.map((run) => (
                  <div className="scanner-run" key={run.scanner}>
                    <div>
                      <span className="scanner-icon">
                        <Activity size={18} />
                      </span>
                      <strong>{run.scanner}</strong>
                      <small>{run.version}</small>
                    </div>
                    <b>{run.status}</b>
                    <code>{run.rawOutputHash.slice(0, 16)}</code>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <aside className="detail-column">
            <Panel
              action={
                <button onClick={acceptSelectedRisk}>
                  Accept risk
                  <ChevronRight size={15} />
                </button>
              }
              title="Selected finding"
            >
              <div className="finding-detail">
                <div className="detail-title-row">
                  <SeverityBadge severity={selectedFinding.severity} />
                  <span className={`status status-${selectedFinding.status}`}>{selectedFinding.status.replace("_", " ")}</span>
                </div>
                <h3>{selectedFinding.title}</h3>
                <p>{selectedFinding.description}</p>
                <dl>
                  <div>
                    <dt>Location</dt>
                    <dd>{selectedFinding.filePath}:{selectedFinding.startLine ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>Evidence</dt>
                    <dd>{selectedFinding.evidence}</dd>
                  </div>
                  <div>
                    <dt>Evidence hash</dt>
                    <dd>{selectedFinding.evidenceHash.slice(0, 32)}</dd>
                  </div>
                </dl>
              </div>
            </Panel>

            <Panel
              action={
                <button onClick={() => setActiveNav("ISO Evidence")}>
                  Pack
                  <ChevronRight size={15} />
                </button>
              }
              title="ISO evidence"
            >
              <div className="iso-list">
                {isoCoverage.map((control) => (
                  <button
                    className="iso-row"
                    key={control.id}
                    onClick={() => setWorkflowNotice(`${control.id} evidence mapping selected`)}
                  >
                    <div>
                      <strong>{control.id}</strong>
                      <span>{control.title}</span>
                    </div>
                    <b>{control.findingCount}</b>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel
              action={
                <button onClick={() => setExportStatus("HTML report queued for the selected scan")}>
                  Generate
                  <ChevronRight size={15} />
                </button>
              }
              title="Report exports"
            >
              <div className="export-grid">
                <button onClick={() => setExportStatus("HTML report queued for the selected scan")}><FileDown size={18} /> HTML</button>
                <button onClick={() => setExportStatus("PDF report queued for the selected scan")}><FileDown size={18} /> PDF</button>
                <button onClick={() => setExportStatus("JSON machine report ready")}><FileJson size={18} /> JSON</button>
                <button onClick={() => setExportStatus("SARIF export ready for code scanning")}><Gauge size={18} /> SARIF</button>
              </div>
              <p className="export-status" aria-live="polite">{exportStatus}</p>
            </Panel>

            <div className="ai-note">
              <Sparkles size={18} />
              <span>AI strict mode sends metadata only. Assisted output cannot change finding status.</span>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function MetricTerm({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Panel(props: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="section-header">
        <h2>{props.title}</h2>
        {props.action}
      </div>
      {props.children}
    </section>
  );
}

function FindingRow({
  finding,
  isSelected,
  onSelect
}: {
  finding: NormalizedFinding;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={isSelected ? "table-row finding-row selected" : "table-row finding-row"}
      onClick={onSelect}
      role="row"
    >
      <span>
        <SeverityBadge severity={finding.severity} />
      </span>
      <span className="finding-title">
        <strong>{finding.title}</strong>
        <small>{finding.filePath}</small>
      </span>
      <span>{finding.scanner}</span>
      <span className={`status status-${finding.status}`}>{finding.status.replace("_", " ")}</span>
      <span>{finding.isoControls.slice(0, 2).join(", ")}</span>
    </button>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const icon = severity === "critical" || severity === "high" ? <AlertTriangle size={14} /> : <Network size={14} />;
  return (
    <span className={`severity-badge severity-${severity}`}>
      {icon}
      {severity}
    </span>
  );
}
