import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Box,
  CheckCheck,
  ChevronRight,
  Code2,
  Compass,
  Download,
  GitBranch,
  Hammer,
  LayoutGrid,
  ListChecks,
  Menu,
  Network,
  Radio,
  Search,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { archetypes, type Archetype } from "./data/archetypes";
import { engineeringSpecs } from "./data/engineering-specs";
import { roadmapIssues, roadmapPhases } from "./data/roadmap";
import EngineeringSheet from "./components/EngineeringSheet";
import SpecProperties, { PropertyGrid } from "./components/SpecProperties";
import Roadmap from "./components/Roadmap";
import {
  completion,
  decisionKey,
  emptyProgress,
  milestoneKey,
  parseProgress,
  statusOf,
  STORAGE_KEY,
  type Progress,
  type Status,
} from "./progress";

type ProgressSetter = Dispatch<SetStateAction<Progress>>;
const icons = {
  orchestrator: GitBranch,
  scout: Compass,
  builder: Hammer,
  critic: ShieldCheck,
  sentinel: Radio,
  curator: BookOpen,
};
const tabs = ["architecture", "milestones", "decisions"] as const;
type DetailTab = (typeof tabs)[number];
const nav = [
  { id: "archetypes", label: "Agent archetypes", icon: LayoutGrid },
  { id: "map", label: "System map", icon: Network },
  { id: "roadmap", label: "Build roadmap", icon: ListChecks },
];
function RoleIcon({ agent, size = 17 }: { agent: Archetype; size?: number }) {
  const Icon = icons[agent.id];
  return (
    <span className={`role-icon ${agent.color}`}>
      <Icon size={size} />
    </span>
  );
}
function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status ${status.toLowerCase().replaceAll(" ", "-")}`}>
      <span />
      {status}
    </span>
  );
}
function readInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return {
      progress: raw ? parseProgress(JSON.parse(raw)) : emptyProgress(),
      error: "",
    };
  } catch {
    return {
      progress: emptyProgress(),
      error:
        "Existing progress could not be loaded. Import a valid backup to resume saving. The stored record has been preserved.",
    };
  }
}
const currentRoute = () => window.location.hash.slice(1) || "archetypes";
function routeFor(agent: Archetype, tab: DetailTab, block?: string) {
  return `#agent/${agent.id}?tab=${tab}${block ? `&block=${block}` : ""}`;
}

export default function App() {
  const [initial] = useState(readInitial);
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [storageError, setStorageError] = useState(initial.error);
  const [route, setRoute] = useState(currentRoute);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [importCandidate, setImportCandidate] = useState<Progress | null>(null);
  const input = useRef<HTMLInputElement>(null),
    main = useRef<HTMLElement>(null),
    menuButton = useRef<HTMLButtonElement>(null);
  const path = route.split("?")[0],
    query = new URLSearchParams(route.split("?")[1] || "");
  const selected = path.startsWith("agent/")
    ? archetypes.find((a) => a.id === path.split("/")[1])
    : undefined;
  const rawTab = query.get("tab"),
    tab: DetailTab = tabs.includes(rawTab as DetailTab)
      ? (rawTab as DetailTab)
      : "architecture";
  const block = query.get("block") || undefined;
  const milestoneDone = archetypes.reduce(
      (n, a) => n + completion(a, progress),
      0,
    ),
    milestoneTotal = archetypes.reduce((n, a) => n + a.milestones.length, 0);
  const issueDone = roadmapIssues.filter(
    (issue) => progress.issues[issue.id]?.complete,
  ).length;
  useEffect(() => {
    let lastPath = currentRoute().split("?")[0];
    const update = () => {
      const next = currentRoute();
      setRoute(next);
      setMobileOpen(false);
      if (lastPath !== next.split("?")[0]) {
        window.scrollTo(0, 0);
        main.current?.focus();
      }
      lastPath = next.split("?")[0];
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    if (storageError.startsWith("Existing")) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      setStorageError(
        "Browser storage is unavailable. Export a backup before closing this tab.",
      );
    }
  }, [progress, storageError]);
  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    document.title = `${selected?.shortName || nav.find((n) => n.id === path)?.label || "Vault"} · Agent Architect`;
  }, [path, selected]);
  useEffect(() => {
    if (!mobileOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [mobileOpen]);
  function exportProgress() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(progress, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-architect-${new Date().toLocaleDateString("en-CA")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("Progress v2 backup exported.");
  }
  async function importProgress(file?: File) {
    if (!file) return;
    try {
      if (file.size > 8_000_000)
        throw new Error("Choose a progress backup smaller than 8 MB.");
      setImportCandidate(parseProgress(JSON.parse(await file.text())));
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : "Unable to read progress backup.",
      );
    }
    if (input.current) input.current.value = "";
  }
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      {mobileOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        id="sidebar-navigation"
        className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}
      >
        <a
          className="brand"
          href="#archetypes"
          onClick={() => setMobileOpen(false)}
        >
          <Box size={23} />
          <span>
            agent<span>architect</span>
            <small>ENGINEERING KNOWLEDGE VAULT</small>
          </span>
        </a>
        <div className="workspace-label">
          <span className="local-dot" />
          <code>LOCAL / agentbox</code>
          <span>v0.2</span>
        </div>
        <nav aria-label="Main navigation">
          {nav.map(({ id, label, icon: Icon }) => (
            <a
              href={`#${id}`}
              key={id}
              onClick={() => setMobileOpen(false)}
              className={
                (selected ? id === "archetypes" : path === id) ? "active" : ""
              }
              aria-current={
                (selected ? id === "archetypes" : path === id)
                  ? "page"
                  : undefined
              }
            >
              <Icon size={15} />
              {label}
              {id === "archetypes" && <code>06</code>}
            </a>
          ))}
        </nav>
        <div className="sidebar-label">MODULE INDEX</div>
        <nav className="module-nav" aria-label="Agent modules">
          {archetypes.map((a) => (
            <a
              href={`#agent/${a.id}`}
              key={a.id}
              onClick={() => setMobileOpen(false)}
              aria-current={selected?.id === a.id ? "page" : undefined}
              className={selected?.id === a.id ? "active" : ""}
            >
              <RoleIcon agent={a} size={13} />
              <span>{a.shortName}</span>
              <code>{String(a.stage).padStart(2, "0")}</code>
            </a>
          ))}
        </nav>
        <div className="sidebar-links">
          <span className="sidebar-label">SOURCE / RECORDS</span>
          <a
            href="https://github.com/LucasTechVault/agent-architect/tree/main/docs/adr"
            target="_blank"
            rel="noreferrer"
          >
            <BookOpen size={13} />
            Architecture records
            <ArrowUpRight size={11} />
          </a>
          <a
            href="https://github.com/LucasTechVault/agentbox-core"
            target="_blank"
            rel="noreferrer"
          >
            <Code2 size={13} />
            agentbox-core
            <ArrowUpRight size={11} />
          </a>
        </div>
        <div className="sidebar-bottom">
          <div>
            <span>Role milestones</span>
            <code>
              {milestoneDone}/{milestoneTotal}
            </code>
          </div>
          <div>
            <span>Engineering issues</span>
            <code>
              {issueDone}/{roadmapIssues.length}
            </code>
          </div>
          <small>Personal verification records</small>
          <div className="local-record">
            <span className="local-dot" />
            localStorage<code>schema v2</code>
          </div>
        </div>
      </aside>
      <div className="app-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              ref={menuButton}
              className="icon-button mobile-toggle"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              aria-controls="sidebar-navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={17} />
            </button>
            <span>vault</span>
            <ChevronRight size={12} />
            <strong>{selected ? `agents / ${selected.id}` : path}</strong>
            <span className="header-version">SPEC v0.2</span>
          </div>
          <div className="topbar-actions">
            <span className="save-state">
              <span className="local-dot" />
              {storageError ? "backup required" : "saved locally"}
            </span>
            <button
              className="button"
              aria-label="Import backup"
              onClick={() => input.current?.click()}
            >
              <Upload size={13} />
              <span>Import</span>
            </button>
            <button
              className="button"
              aria-label="Export progress"
              onClick={exportProgress}
            >
              <Download size={13} />
              <span>Export</span>
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} ref={main}>
          {storageError && (
            <div className="storage-warning" role="alert">
              <span>{storageError}</span>
              <button onClick={() => input.current?.click()}>
                Import backup
              </button>
            </div>
          )}
          {selected ? (
            <AgentDetail
              agent={selected}
              progress={progress}
              setProgress={setProgress}
              tab={tab}
              activeBlock={block}
            />
          ) : path === "archetypes" ? (
            <Registry progress={progress} />
          ) : path === "map" ? (
            <SystemMap progress={progress} />
          ) : path === "roadmap" ? (
            <>
              <DocumentHeader
                section="IMPLEMENTATION / PHASED DELIVERY"
                title="Engineering implementation ledger"
                path="agent-architect/src/data/roadmap.ts → agentbox-core/src/"
              />
              <PropertyGrid
                properties={[
                  {
                    label: "Module Path",
                    value: <code>agentbox-core/src/</code>,
                  },
                  {
                    label: "Runtime Pattern",
                    value:
                      "Bounded kernel → verification → coordination → events",
                  },
                  {
                    label: "State Mutability",
                    value:
                      "Versioned personal receipts; engine state is separate",
                  },
                  {
                    label: "Token Budget Tier",
                    value: "Per-run limits + per-role proposed caps",
                  },
                  {
                    label: "Verification Gate",
                    value: "Commit / test / PR evidence + explicit check",
                  },
                  {
                    label: "Implementation Status",
                    value: `${issueDone}/${roadmapIssues.length} issues verified by you`,
                  },
                ]}
              />
              <Roadmap progress={progress} setProgress={setProgress} />
            </>
          ) : (
            <div className="empty-state">
              <h1>Unknown document</h1>
              <a href="#archetypes">Return to agent registry</a>
            </div>
          )}
          <footer className="page-footer">
            <code>agent-architect / v0.2</code>
            <span>
              Specifications describe target behavior. Verification is
              self-recorded.
            </span>
            <span>Local records · export to back up</span>
          </footer>
        </main>
      </div>
      <input
        ref={input}
        className="sr-only"
        type="file"
        accept="application/json,.json"
        aria-label="Import progress file"
        onChange={(e) => void importProgress(e.target.files?.[0])}
      />
      {toast && (
        <div className="toast" role="status">
          <CheckCheck size={14} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={13} />
          </button>
        </div>
      )}
      {importCandidate && (
        <RestoreDialog
          onCancel={() => setImportCandidate(null)}
          onRestore={() => {
            setProgress(importCandidate);
            setStorageError("");
            setImportCandidate(null);
            setToast(
              "Progress restored. Legacy records are retained in schema v2.",
            );
          }}
        />
      )}
    </>
  );
}
function RestoreDialog({
  onCancel,
  onRestore,
}: {
  onCancel: () => void;
  onRestore: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return (
    <dialog
      className="restore-dialog"
      ref={dialog}
      aria-labelledby="restore-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <span className="section-caption">IMPORT / PROGRESS RECORDS</span>
      <h2 id="restore-title">Restore progress backup?</h2>
      <p>
        This replaces the current issues, milestones, notes, decisions, and
        takeaways. Export first to retain the current records. Version 1 backups
        migrate automatically.
      </p>
      <div className="dialog-actions">
        <button autoFocus className="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="button primary" onClick={onRestore}>
          Restore progress
        </button>
      </div>
    </dialog>
  );
}
function DocumentHeader({
  section,
  title,
  path,
  children,
}: {
  section: string;
  title: string;
  path: string;
  children?: ReactNode;
}) {
  return (
    <div className="document-header">
      <div>
        <div className="section-caption">{section}</div>
        <h1>{title}</h1>
        <code className="document-path">{path}</code>
      </div>
      {children}
    </div>
  );
}
function Registry({ progress }: { progress: Progress }) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all");
  const visible = archetypes.filter(
    (a) =>
      (filter === "all" || statusOf(a, progress) === filter) &&
      `${a.name} ${a.runtime} ${a.topology} ${engineeringSpecs[a.id].modulePath} ${a.artifacts.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const totalDone = archetypes.reduce((n, a) => n + completion(a, progress), 0);
  return (
    <>
      <DocumentHeader
        section="SPEC // AGENTBOX-CORE // AGENT REGISTRY"
        title="Agent archetypes"
        path="agentbox-core/src/agents/* (target modules)"
      >
        <span className="document-badge">06 ROLES / 54 SPEC BLOCKS</span>
      </DocumentHeader>
      <PropertyGrid
        properties={[
          {
            label: "Module Path",
            value: <code>agentbox-core/src/agents/* (planned)</code>,
          },
          {
            label: "Runtime Pattern",
            value: "State machine / bounded loop / pipeline / actor",
          },
          {
            label: "State Mutability",
            value: "Single task-graph writer; immutable handoffs (target)",
          },
          {
            label: "Token Budget Tier",
            value: "Role-scoped admission limits (proposed)",
          },
          {
            label: "Verification Gate",
            value: "Independent receipts before promotion (planned)",
          },
          {
            label: "Implementation Status",
            value: `Kernel scaffold · ${totalDone}/30 personal milestones`,
          },
        ]}
      />
      <div className="registry-toolbar">
        <div>
          <strong>Specification index</strong>
          <span>{visible.length} / 6 documents</span>
        </div>
        <div className="filter-controls">
          <label className="search-control">
            <Search size={13} />
            <input
              aria-label="Search archetypes"
              placeholder="Search role, runtime, module…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button aria-label="Clear search" onClick={() => setSearch("")}>
                <X size={12} />
              </button>
            )}
          </label>
          <select
            aria-label="Filter by status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All personal statuses</option>
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Verified</option>
          </select>
        </div>
      </div>
      <div className="archetype-grid">
        {visible.map((a) => {
          const spec = engineeringSpecs[a.id];
          return (
            <a
              className={`archetype-card ${a.color}`}
              href={`#agent/${a.id}`}
              key={a.id}
            >
              <div className="card-heading">
                <RoleIcon agent={a} />
                <span className="identifier">
                  AGENT.{String(archetypes.indexOf(a) + 1).padStart(2, "0")}
                </span>
                <StatusBadge status={statusOf(a, progress)} />
              </div>
              <h2>
                {a.name}
                <ArrowUpRight size={13} />
              </h2>
              <p>{a.purpose}</p>
              <dl className="card-properties">
                <div>
                  <dt>RUNTIME</dt>
                  <dd>
                    <code>{a.runtime}</code>
                  </dd>
                </div>
                <div>
                  <dt>STATE</dt>
                  <dd>{spec.stateMutability}</dd>
                </div>
                <div>
                  <dt>GATE</dt>
                  <dd>{spec.verificationGate}</dd>
                </div>
              </dl>
              <div className="card-boundary">
                <span className="field-label">AUTHORITY</span>
                <p>{spec.blocks[0].decision}</p>
              </div>
              <div className="tool-chips">
                {a.allowedTools.slice(0, 3).map((tool) => (
                  <code key={tool}>{tool}</code>
                ))}
              </div>
              <div className="card-footer">
                <code>{spec.modulePath}</code>
                <span>
                  {completion(a, progress)}/{a.milestones.length} milestones ·{" "}
                  {spec.implementation}
                </span>
              </div>
            </a>
          );
        })}
      </div>
      {!visible.length && (
        <div className="empty-state">
          <h2>No matching specifications</h2>
          <button
            className="button"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <div className="registry-footnote">
        <span>
          <Code2 size={13} />9 building blocks + typed I/O contracts per role
        </span>
        <a href="#roadmap">
          Open {roadmapIssues.length} implementation issues
          <ArrowRight size={12} />
        </a>
      </div>
    </>
  );
}
function AgentDetail({
  agent,
  progress,
  setProgress,
  tab,
  activeBlock,
}: {
  agent: Archetype;
  progress: Progress;
  setProgress: ProgressSetter;
  tab: DetailTab;
  activeBlock?: string;
}) {
  const done = completion(agent, progress),
    spec = engineeringSpecs[agent.id];
  function openTab(next: DetailTab) {
    window.location.hash = routeFor(agent, next).slice(1);
  }
  return (
    <>
      <a href="#archetypes" className="back-link">
        <ArrowLeft size={12} />
        archetypes / registry
      </a>
      <DocumentHeader
        section={`SPEC // AGENTBOX-CORE // ${agent.tag.toUpperCase()}`}
        title={agent.name}
        path={spec.modulePath}
      >
        <span className="document-badge">
          v{spec.version} / PHASE 0{agent.stage}
        </span>
        <StatusBadge status={statusOf(agent, progress)} />
      </DocumentHeader>
      <SpecProperties agent={agent} progress={progress} />
      <div className="detail-tabs" role="tablist" aria-label="Archetype detail">
        {tabs.map((id, i) => (
          <button
            id={`tab-${id}`}
            role="tab"
            key={id}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            className={tab === id ? "active" : ""}
            onClick={() => openTab(id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                const next = tabs[(i + (e.key === "ArrowRight" ? 1 : 2)) % 3];
                openTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              }
            }}
          >
            {id === "architecture" ? (
              <Network size={13} />
            ) : id === "milestones" ? (
              <ListChecks size={13} />
            ) : (
              <BookOpen size={13} />
            )}
            <span>
              {id === "architecture"
                ? "Architecture"
                : id === "milestones"
                  ? `Build milestones (${done}/${agent.milestones.length})`
                  : "Decisions & recall"}
            </span>
          </button>
        ))}
      </div>
      <section
        className="tab-panel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        role="tabpanel"
      >
        {tab === "architecture" && (
          <>
            <EngineeringSheet agent={agent} activeBlock={activeBlock} />
            <Takeaways
              agent={agent}
              progress={progress}
              setProgress={setProgress}
            />
          </>
        )}
        {tab === "milestones" && (
          <Milestones
            agent={agent}
            progress={progress}
            setProgress={setProgress}
          />
        )}
        {tab === "decisions" && (
          <Decisions
            agent={agent}
            progress={progress}
            setProgress={setProgress}
            activeBlock={activeBlock}
          />
        )}
      </section>
      <div className="agent-pagination">
        <a href="#roadmap">
          Phase 0{agent.stage} /{" "}
          {roadmapPhases.find((p) => p.id === agent.stage)?.title}
          <ArrowRight size={12} />
        </a>
        <a
          href={`#agent/${archetypes[(archetypes.indexOf(agent) + 1) % archetypes.length].id}`}
        >
          Next specification
          <ChevronRight size={12} />
        </a>
      </div>
    </>
  );
}
function Milestones({
  agent,
  progress,
  setProgress,
}: {
  agent: Archetype;
  progress: Progress;
  setProgress: ProgressSetter;
}) {
  function update(
    id: string,
    patch: Partial<{ complete: boolean; evidence: string }>,
  ) {
    const key = milestoneKey(agent, id);
    setProgress((p) => {
      const value = {
        ...(p.milestones[key] || { complete: false, evidence: "" }),
        ...patch,
      };
      if (!value.evidence.trim()) value.complete = false;
      return { ...p, milestones: { ...p.milestones, [key]: value } };
    });
  }
  return (
    <div className="milestone-panel">
      <div className="panel-heading">
        <div>
          <h2>Role implementation milestones</h2>
          <p>
            Legacy role checklist. Engineering issues are tracked separately in
            the roadmap; each verification requires your evidence.
          </p>
        </div>
        <code>
          {completion(agent, progress)}/{agent.milestones.length}
        </code>
      </div>
      {agent.milestones.map((m, i) => {
        const record = progress.milestones[milestoneKey(agent, m.id)];
        return (
          <div className="milestone-record" key={m.id}>
            <input
              type="checkbox"
              aria-label={`Verify ${m.title}`}
              checked={!!record?.complete}
              disabled={!record?.evidence.trim()}
              onChange={(e) => update(m.id, { complete: e.target.checked })}
            />
            <details open={i === 0}>
              <summary>
                <code>M{String(i + 1).padStart(2, "0")}</code>
                <strong>{m.title}</strong>
                <ChevronRight size={13} />
              </summary>
              <div className="record-body">
                <p>{m.detail}</p>
                <div className="verification-callout">
                  <span className="field-label">ACCEPTANCE TEST</span>
                  <p>{m.proof}</p>
                </div>
                <label htmlFor={`evidence-${m.id}`}>
                  Verification receipt · commit / test path / PR / result
                </label>
                <textarea
                  id={`evidence-${m.id}`}
                  rows={2}
                  maxLength={20000}
                  value={record?.evidence || ""}
                  placeholder="Record the implementation evidence…"
                  onChange={(e) => update(m.id, { evidence: e.target.value })}
                />
                <small>
                  Add a receipt to enable the verification checkbox. Records are
                  not checked against GitHub automatically.
                </small>
              </div>
            </details>
          </div>
        );
      })}
    </div>
  );
}
function Takeaways({
  agent,
  progress,
  setProgress,
}: {
  agent: Archetype;
  progress: Progress;
  setProgress: ProgressSetter;
}) {
  const record = progress.takeaways[agent.id] || { text: "", reviewed: false };
  return (
    <section className="takeaway-editor">
      <div className="section-caption">
        <span>CORE TAKEAWAYS / PERSONAL RECORD</span>
        <label className="check-label">
          <input
            type="checkbox"
            checked={record.reviewed}
            disabled={!record.text.trim()}
            onChange={(e) =>
              setProgress((p) => ({
                ...p,
                takeaways: {
                  ...p.takeaways,
                  [agent.id]: { ...record, reviewed: e.target.checked },
                },
              }))
            }
          />
          Reviewed
        </label>
      </div>
      <label className="sr-only" htmlFor={`takeaway-${agent.id}`}>
        Core takeaways for {agent.shortName}
      </label>
      <textarea
        id={`takeaway-${agent.id}`}
        rows={3}
        maxLength={20000}
        placeholder="Record the invariant, implementation trade-off, or failure mode worth retaining…"
        value={record.text}
        onChange={(e) =>
          setProgress((p) => ({
            ...p,
            takeaways: {
              ...p.takeaways,
              [agent.id]: {
                text: e.target.value,
                reviewed: record.reviewed && !!e.target.value.trim(),
              },
            },
          }))
        }
      />
      <small>
        Editable and persistent. Review state is separate from implementation
        verification.
      </small>
    </section>
  );
}
function Decisions({
  agent,
  progress,
  setProgress,
  activeBlock,
}: {
  agent: Archetype;
  progress: Progress;
  setProgress: ProgressSetter;
  activeBlock?: string;
}) {
  const context = engineeringSpecs[agent.id].blocks.find(
    (b) => b.id === activeBlock,
  );
  return (
    <div className="decisions-layout">
      <div>
        {context && (
          <section className="linked-spec">
            <div className="section-caption">
              LINKED SPECIFICATION / {context.id.toUpperCase()}
            </div>
            <h2>{context.title}</h2>
            <p>{context.decision}</p>
            <p>
              <strong>Trade-off:</strong> {context.tradeoff}
            </p>
            <a
              className="inline-link"
              href={routeFor(agent, "architecture", context.id)}
            >
              Return to specification
              <ArrowUpRight size={12} />
            </a>
          </section>
        )}
        <div className="panel-heading">
          <h2>Architectural decision records</h2>
          <small>Proposed choices · explicit selection required</small>
        </div>
        {agent.decisions.map((decision, i) => {
          const key = decisionKey(agent, i),
            record = progress.decisions[key] || { choice: "", rationale: "" };
          return (
            <section className="decision-record" key={key}>
              <div className="section-caption">
                DECISION / {agent.id.toUpperCase()} / 0{i + 1}
              </div>
              <h3>{decision.question}</h3>
              <label htmlFor={`choice-${agent.id}-${i}`}>
                Selected approach
              </label>
              <select
                id={`choice-${agent.id}-${i}`}
                value={record.choice}
                onChange={(e) =>
                  setProgress((p) => ({
                    ...p,
                    decisions: {
                      ...p.decisions,
                      [key]: { ...record, choice: e.target.value },
                    },
                  }))
                }
              >
                <option value="">Not decided yet</option>
                {decision.options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <p className="proposed-note">{decision.recommendation}</p>
              <label htmlFor={`rationale-${agent.id}-${i}`}>
                Rationale / rejected alternatives / revisit trigger
              </label>
              <textarea
                id={`rationale-${agent.id}-${i}`}
                rows={3}
                maxLength={20000}
                value={record.rationale}
                placeholder="Record the reason and practical consequence…"
                onChange={(e) =>
                  setProgress((p) => ({
                    ...p,
                    decisions: {
                      ...p.decisions,
                      [key]: { ...record, rationale: e.target.value },
                    },
                  }))
                }
              />
            </section>
          );
        })}
      </div>
      <aside className="notes-column">
        <section className="architectural-notes">
          <div className="section-caption">ARCHITECTURAL NOTES</div>
          <label htmlFor={`notes-${agent.id}`}>
            Implementation observations
          </label>
          <textarea
            id={`notes-${agent.id}`}
            rows={10}
            maxLength={50000}
            placeholder="Module changes, edge cases, constraints, unresolved questions…"
            value={progress.notes[agent.id] || ""}
            onChange={(e) =>
              setProgress((p) => ({
                ...p,
                notes: { ...p.notes, [agent.id]: e.target.value },
              }))
            }
          />
          <small>Original learning reflections are retained here.</small>
        </section>
        <Takeaways
          agent={agent}
          progress={progress}
          setProgress={setProgress}
        />
        <div className="recall-block-links">
          <span className="section-caption">SPECIFICATION REFERENCES</span>
          {engineeringSpecs[agent.id].blocks.map((b, i) => (
            <a key={b.id} href={routeFor(agent, "architecture", b.id)}>
              <code>0{i + 1}</code>
              {b.title}
              <ArrowUpRight size={11} />
            </a>
          ))}
        </div>
      </aside>
    </div>
  );
}
function SystemMap({ progress }: { progress: Progress }) {
  const [selectedId, setSelectedId] = useState<Archetype["id"]>("orchestrator");
  const agent = archetypes.find((a) => a.id === selectedId)!;
  const inspector = useRef<HTMLDivElement>(null);
  useEffect(() => {
    inspector.current?.scrollTo(0, 0);
  }, [selectedId]);
  const node = (id: Archetype["id"]) => {
    const a = archetypes.find((item) => item.id === id)!;
    return (
      <button
        className={`map-node ${selectedId === id ? "selected" : ""}`}
        aria-pressed={selectedId === id}
        key={id}
        onClick={() => setSelectedId(id)}
      >
        <RoleIcon agent={a} />
        <span>
          <strong>{a.shortName}</strong>
          <code>{a.id}</code>
        </span>
        <ChevronRight size={12} />
      </button>
    );
  };
  return (
    <>
      <DocumentHeader
        section="TOPOLOGY // SUPERVISOR + BOUNDED SUBGRAPHS"
        title="System map"
        path="agentbox-core/src/agents/ · target collaboration graph"
      >
        <span className="document-badge">CONCEPTUAL SPEC / v0.2</span>
      </DocumentHeader>
      <SpecProperties agent={agent} progress={progress} />
      <div className="map-layout">
        <section className="topology-pane" aria-label="Agent topology">
          <div className="section-caption">
            SELECT A NODE / INSPECT SPECIFICATION
          </div>
          <div className="objective-node">
            <Box size={14} />
            <code>Box + objective + budget</code>
          </div>
          <div className="map-edge">WorkspaceReady ↓</div>
          {node("orchestrator")}
          <div className="map-edge">TaskLease / read capability ↓</div>
          <div className="node-pair">
            {node("scout")}
            {node("builder")}
          </div>
          <div className="map-edge">
            EvidenceBundle → Builder → StagedPatch ↓
          </div>
          {node("critic")}
          <div className="map-edge">
            REJECTED ↺ bounded repair · APPROVED → promote
          </div>
          <div className="observer-rail">
            <span>DECOUPLED EVENT / POST-RUN PROCESSES</span>
            {node("sentinel")}
            {node("curator")}
          </div>
          <div className="ledger-node">
            <code>Append-only execution ledger</code>
            <small>Immutable events + typed artifact references</small>
          </div>
          <div className="map-legend">
            <p>
              <span className="legend-square" />
              Single task-graph writer: Orchestrator
            </p>
            <p>
              <span className="legend-square outline" />
              Worker capability scope is role-specific
            </p>
            <p>
              Graph is a target design. Six production agents are not yet
              implemented.
            </p>
          </div>
        </section>
        <div
          className="map-spec-pane"
          ref={inspector}
          role="region"
          aria-label={`${agent.shortName} technical specification`}
        >
          <div className="map-spec-heading">
            <RoleIcon agent={agent} />
            <div>
              <span className="section-caption">
                TECHNICAL SPECIFICATION / 9 BLOCKS
              </span>
              <h2>{agent.name}</h2>
            </div>
            <a className="button" href={`#agent/${agent.id}`}>
              Open document
              <ArrowUpRight size={12} />
            </a>
          </div>
          <EngineeringSheet key={agent.id} agent={agent} compact />
        </div>
      </div>
    </>
  );
}
