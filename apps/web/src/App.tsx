import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronRight,
  FileDown,
  FileJson,
  Fingerprint,
  Gauge,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Network,
  PlayCircle,
  ShieldCheck,
  ShieldX,
  Siren,
  Sparkles,
  Terminal,
  UploadCloud
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { findings, isoCoverage, policyEvaluation, project, scannerRuns } from "./data.js";
import type { NormalizedFinding, Severity } from "@vibeaudit/core";

const navItems = [
  { label: "Projects", icon: LayoutDashboard },
  { label: "Scans", icon: PlayCircle },
  { label: "Findings", icon: Siren },
  { label: "Policy", icon: ListChecks },
  { label: "Reports", icon: FileDown },
  { label: "ISO Evidence", icon: Archive }
];

const severityOrder: Severity[] = ["critical", "high", "medium", "low", "info"];

export function App() {
  const [activeNav, setActiveNav] = useState("Findings");
  const [selectedFindingId, setSelectedFindingId] = useState(findings[0]!.id);
  const [exportStatus, setExportStatus] = useState("No report generated in this session");
  const severityCounts = severityOrder.map((severity) => ({
    severity,
    count: findings.filter((finding) => finding.severity === severity).length
  }));
  const selectedFinding = useMemo(
    () => findings.find((finding) => finding.id === selectedFindingId) ?? findings[0]!,
    [selectedFindingId]
  );

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={22} strokeWidth={2.4} />
          </div>
          <div>
            <strong>VibeAudit</strong>
            <span>Local-first auditor</span>
          </div>
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

        <div className="sidebar-status">
          <LockKeyhole size={18} />
          <div>
            <strong>Strict privacy</strong>
            <span>No source upload by default</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <h1>{project.name}</h1>
            <p>
              <GitBranch size={14} /> {project.repository} / {project.branch} / {project.commit}
            </p>
          </div>
          <div className="topbar-actions">
            <button className="secondary-action">
              <Terminal size={17} />
              CLI command
            </button>
            <button className="primary-action">
              <UploadCloud size={17} />
              Import scan
            </button>
          </div>
        </header>

        <section className="hero-grid" aria-label="Scan summary">
          <div className="policy-panel">
            <div className="panel-heading">
              <div>
                <span className="label">Policy gate</span>
                <h2>{policyEvaluation.passed ? "Ready to ship" : "Blocked by policy"}</h2>
              </div>
              {policyEvaluation.passed ? <CheckCircle2 className="ok-icon" /> : <ShieldX className="danger-icon" />}
            </div>
            <p>
              Fail threshold is <strong>{policyEvaluation.threshold}</strong>. Required scanners completed:
              {" "}{policyEvaluation.requiredScanners.join(", ")}.
            </p>
            <div className="gate-meter">
              <span style={{ width: "64%" }} />
            </div>
            <div className="policy-meta">
              <span>{policyEvaluation.blockedFindingIds.length} blocked findings</span>
              <span>{project.generatedAt}</span>
            </div>
          </div>

          <div className="metric-grid">
            {severityCounts.map((item) => (
              <div className={`metric-card severity-${item.severity}`} key={item.severity}>
                <span>{item.severity}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>

          <div className="evidence-panel">
            <div className="panel-heading compact">
              <div>
                <span className="label">Evidence integrity</span>
                <h2>Artifact chain</h2>
              </div>
              <Fingerprint size={22} />
            </div>
            <code>{project.artifactHash}</code>
            <p>Every report stores scanner metadata, redaction status, and SHA-256 evidence hashes.</p>
          </div>
        </section>

        <section className="content-grid">
          <div className="main-column">
            <Panel title="Findings" action="View all">
              <div className="finding-table" role="table" aria-label="Findings table">
                <div className="table-row table-head" role="row">
                  <span>Severity</span>
                  <span>Finding</span>
                  <span>Scanner</span>
                  <span>Status</span>
                  <span>ISO</span>
                </div>
                {findings.map((finding) => (
                  <FindingRow
                    finding={finding}
                    isSelected={finding.id === selectedFinding.id}
                    key={finding.id}
                    onSelect={() => setSelectedFindingId(finding.id)}
                  />
                ))}
              </div>
            </Panel>

            <Panel title="Scan timeline" action="Scanner logs">
              <div className="timeline">
                {scannerRuns.map((run) => (
                  <div className="timeline-item" key={run.scanner}>
                    <div className="timeline-dot" />
                    <div>
                      <strong>{run.scanner}</strong>
                      <span>{run.status} / exit {run.exitCode} / {run.version}</span>
                    </div>
                    <code>{run.rawOutputHash.slice(0, 16)}</code>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <aside className="detail-column">
            <Panel title="Selected finding" action="Accept risk">
              <div className="finding-detail">
                <SeverityBadge severity={selectedFinding.severity} />
                <h3>{selectedFinding.title}</h3>
                <p>{selectedFinding.description}</p>
                <dl>
                  <div>
                    <dt>Location</dt>
                    <dd>{selectedFinding.filePath}:{selectedFinding.startLine}</dd>
                  </div>
                  <div>
                    <dt>Evidence</dt>
                    <dd>{selectedFinding.evidence}</dd>
                  </div>
                  <div>
                    <dt>Hash</dt>
                    <dd>{selectedFinding.evidenceHash.slice(0, 24)}</dd>
                  </div>
                </dl>
              </div>
            </Panel>

            <Panel title="ISO evidence" action="Export pack">
              <div className="iso-list">
                {isoCoverage.map((control) => (
                  <div className="iso-row" key={control.id}>
                    <div>
                      <strong>{control.id}</strong>
                      <span>{control.title}</span>
                    </div>
                    <b>{control.findingCount}</b>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Report exports" action="Generate">
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
              <span>AI strict mode sends metadata only. Assisted output cannot change status.</span>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Panel(props: { title: string; action: string; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="section-header">
        <h2>{props.title}</h2>
        <button>
          {props.action}
          <ChevronRight size={15} />
        </button>
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
