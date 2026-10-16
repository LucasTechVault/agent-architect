import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Box,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Compass,
  Download,
  GitBranch,
  Hammer,
  Layers3,
  LayoutGrid,
  Map,
  Menu,
  Network,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { archetypes, type Archetype } from "./data/archetypes";
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

const roleIcons = {
  orchestrator: GitBranch,
  scout: Compass,
  builder: Hammer,
  critic: ShieldCheck,
  sentinel: Radio,
  curator: BookOpen,
};
const phases = [
  {
    title: "One bounded run",
    subtitle: "Build the Box + single-worker kernel",
    description:
      "Start with a path-bounded workspace, an append-only ledger, and a Builder that knows when to stop.",
    agents: ["builder"],
  },
  {
    title: "Earn the right to merge",
    subtitle: "Add the Builder ↔ Critic dyad",
    description:
      "Stage changes in isolation. Promote a patch only after deterministic checks and a verification receipt.",
    agents: ["critic"],
  },
  {
    title: "Coordinate with intent",
    subtitle: "Add orchestration + parallel recon",
    description:
      "Route work through an explicit task graph. Give workers compact evidence instead of an entire repository.",
    agents: ["orchestrator", "scout"],
  },
  {
    title: "React, then remember",
    subtitle: "Add the Sentinel + Memory Curator",
    description:
      "Wake on real events and turn verified outcomes into reusable, redacted lessons.",
    agents: ["sentinel", "curator"],
  },
];

function RoleIcon({ agent, size = 24 }: { agent: Archetype; size?: number }) {
  const Icon = roleIcons[agent.id];
  return (
    <span className={`role-icon ${agent.color}`}>
      <Icon size={size} strokeWidth={1.7} />
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
function ProgressBar({ value, total }: { value: number; total: number }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label="Completed milestones"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <span style={{ width: `${total ? (value / total) * 100 : 0}%` }} />
    </div>
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
        "Existing progress could not be loaded. Import a valid backup to resume saving.",
    };
  }
}
function routeFromHash() {
  return window.location.hash.slice(1) || "archetypes";
}

export default function App() {
  const [initial] = useState(readInitial);
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [storageError, setStorageError] = useState(initial.error);
  const [route, setRoute] = useState(routeFromHash);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [importCandidate, setImportCandidate] = useState<Progress | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const main = useRef<HTMLElement>(null);
  const selected = route.startsWith("agent/")
    ? archetypes.find((a) => a.id === route.split("/")[1])
    : undefined;
  const total = archetypes.reduce((n, a) => n + a.milestones.length, 0);
  const done = archetypes.reduce((n, a) => n + completion(a, progress), 0);
  const percent = Math.round((done / total) * 100);
  useEffect(() => {
    const onHash = () => {
      setRoute(routeFromHash());
      setMobileOpen(false);
      window.scrollTo(0, 0);
      main.current?.focus();
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
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
      const timer = window.setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    document.title = `${selected?.shortName || (route === "map" ? "System map" : route === "roadmap" ? "Build roadmap" : "Archetypes")} · Agent Architect`;
  }, [selected, route]);
  function exportProgress() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(progress, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-architect-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("Progress backup exported. Keep it with your project.");
  }
  async function importProgress(file?: File) {
    if (!file) return;
    try {
      if (file.size > 2_000_000)
        throw new Error("Choose a backup smaller than 2 MB.");
      setImportCandidate(parseProgress(JSON.parse(await file.text())));
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "Could not read that backup.",
      );
    }
    if (importInput.current) importInput.current.value = "";
  }
  const nav = [
    { id: "archetypes", label: "Agent archetypes", icon: LayoutGrid },
    { id: "map", label: "System map", icon: Network },
    { id: "roadmap", label: "Build roadmap", icon: Map },
  ];
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
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <a
          className="brand"
          href="#archetypes"
          aria-label="Agent Architect home"
        >
          <span className="brand-symbol">
            <Box size={25} strokeWidth={1.6} />
          </span>
          <span>
            agent<span className="brand-light">architect</span>
            <small>A PERSONAL ENGINEERING LAB</small>
          </span>
        </a>
        <div className="workspace-chip">
          <span className="workspace-symbol">A</span>
          <div>
            AgentBox workspace<small>Learning & implementation</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <div className="nav-label">YOUR FIELD GUIDE</div>
        <nav aria-label="Main navigation">
          {nav.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className={
                (selected ? id === "archetypes" : route === id) ? "active" : ""
              }
              aria-current={
                (selected ? id === "archetypes" : route === id)
                  ? "page"
                  : undefined
              }
            >
              <Icon size={18} />
              {label}
              {id === "archetypes" && <span className="nav-count">06</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-philosophy">
          <span className="nav-label">THE LEARNING LOOP</span>
          <div>
            <span>01</span> Understand the mechanics
          </div>
          <div>
            <span>02</span> Make the decision
          </div>
          <div>
            <span>03</span> Build & verify
          </div>
          <div>
            <span>04</span> Capture the evidence
          </div>
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-progress">
            <div>
              <span>Your build progress</span>
              <strong>{percent}%</strong>
            </div>
            <ProgressBar value={done} total={total} />
            <small>
              {done} of {total} milestones verified
            </small>
          </div>
          <div className="local-indicator">
            <span />
            Local workspace<span className="version">v0.1</span>
          </div>
        </div>
      </aside>
      <div className="app-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <Layers3 size={17} />
            <span>Learning workspace</span>
            <ChevronRight size={14} />
            <strong>
              {selected?.shortName ||
                nav.find((n) => n.id === route)?.label ||
                "Field guide"}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="saved">
              <span />
              {storageError ? "Backup needed" : "Saved on this device"}
            </span>
            <button className="button quiet compact" onClick={exportProgress}>
              <Download size={15} />
              <span>Export progress</span>
            </button>
            <span className="avatar" aria-label="Personal workspace">
              YOU
            </span>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} ref={main}>
          {storageError && (
            <div className="storage-warning" role="alert">
              {storageError}
              <button onClick={() => importInput.current?.click()}>
                Import backup
              </button>
            </div>
          )}
          {selected ? (
            <AgentDetail
              key={selected.id}
              agent={selected}
              progress={progress}
              setProgress={setProgress}
            />
          ) : route === "map" ? (
            <SystemMap progress={progress} />
          ) : route === "roadmap" ? (
            <Roadmap progress={progress} />
          ) : route === "archetypes" ? (
            <Home progress={progress} />
          ) : (
            <div className="empty-state">
              <Compass size={34} />
              <h1>That page is off the map.</h1>
              <a className="button primary" href="#archetypes">
                Back to archetypes
              </a>
            </div>
          )}
          <footer className="page-footer">
            <span>
              <Box size={14} />
              Designed to understand. Built to remember.
            </span>
            <div>
              <button onClick={() => importInput.current?.click()}>
                <Upload size={13} />
                Import backup
              </button>
              <span>Progress stays in this browser.</span>
            </div>
          </footer>
        </main>
      </div>
      <input
        ref={importInput}
        className="sr-only"
        aria-label="Import progress backup"
        type="file"
        accept="application/json,.json"
        onChange={(e) => void importProgress(e.target.files?.[0])}
      />
      {toast && (
        <div className="toast" role="status">
          <CheckCheck size={18} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {importCandidate && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-title"
          >
            <span className="eyebrow">PROGRESS BACKUP</span>
            <h2 id="import-title">Restore this learning journey?</h2>
            <p>
              This replaces your current checklist, decisions, and notes with
              the selected backup. Export your current progress first if you
              want to keep both.
            </p>
            <div className="modal-actions">
              <button
                autoFocus
                className="button quiet"
                onClick={() => setImportCandidate(null)}
              >
                Cancel
              </button>
              <button
                className="button primary"
                onClick={() => {
                  setProgress(importCandidate);
                  setStorageError("");
                  setImportCandidate(null);
                  setToast("Your progress backup has been restored.");
                }}
              >
                Restore progress
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PageHeading({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="page-heading">
      <span className="eyebrow">
        <span className="tiny-square" />
        {label}
      </span>
      <h1>{title}</h1>
      <p>{children}</p>
    </div>
  );
}

function Home({ progress }: { progress: Progress }) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all");
  const done = archetypes.reduce((n, a) => n + completion(a, progress), 0);
  const total = archetypes.reduce((n, a) => n + a.milestones.length, 0);
  const verified = archetypes.filter(
    (a) => statusOf(a, progress) === "Verified",
  ).length;
  const next = [...archetypes]
    .sort((a, b) => a.stage - b.stage)
    .find((a) => statusOf(a, progress) !== "Verified");
  const visible = archetypes.filter(
    (a) =>
      (filter === "all" || statusOf(a, progress) === filter) &&
      `${a.name} ${a.tag} ${a.runtime} ${a.topology}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        label="AIE–10 / THE AGENT ARCHITECTURE FIELD GUIDE"
        title="Different minds. One system."
      >
        Understand the roles. Make the trade-offs. Build an agent system you can
        explain.
      </PageHeading>
      <section className="overview" aria-label="Learning overview">
        <div className="overview-intro">
          <span className="eyebrow">YOUR BUILD, AT A GLANCE</span>
          <div className="overview-numbers">
            <strong>
              {Math.round((done / total) * 100)}
              <span>%</span>
            </strong>
            <div>
              <b>
                From understanding
                <br />
                to implementation.
              </b>
              <span>
                {done} of {total} milestones verified
              </span>
            </div>
          </div>
          <ProgressBar value={done} total={total} />
        </div>
        <div className="overview-stats">
          <div>
            <span className="stat-icon">
              <Layers3 size={17} />
            </span>
            <strong>06</strong>
            <span>Specialist archetypes</span>
          </div>
          <div>
            <span className="stat-icon">
              <CheckCheck size={17} />
            </span>
            <strong>
              {String(verified).padStart(2, "0")}
              <small> / 06</small>
            </strong>
            <span>Archetypes verified</span>
          </div>
        </div>
        <a className="next-step" href={next ? `#agent/${next.id}` : "#roadmap"}>
          <span className="eyebrow">
            <span className="live-dot" />
            {done ? "KEEP THE MOMENTUM" : "A GOOD PLACE TO START"}
          </span>
          <div>
            <span>
              {next ? `Meet ${next.name}` : "Review your engineering journey"}
            </span>
            <ArrowUpRight size={20} />
          </div>
          <p>
            {next
              ? `Phase ${String(next.stage).padStart(2, "0")} · ${phases[next.stage - 1].subtitle}`
              : "Revisit your evidence and architectural decisions."}
          </p>
        </a>
      </section>
      <div className="section-toolbar">
        <div className="section-title">
          <h2>
            The agent roster <span>06</span>
          </h2>
          <p>Six distinct responsibilities. Six architectures to master.</p>
        </div>
        <div className="filter-controls">
          <div className="search-field">
            <Search size={16} />
            <input
              aria-label="Search archetypes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find an archetype…"
            />
            {search && (
              <button aria-label="Clear search" onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className="select-wrap">
            <select
              aria-label="Filter by status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option>Not Started</option>
              <option>In Progress</option>
              <option>Verified</option>
            </select>
            <ChevronDown size={14} />
          </div>
        </div>
      </div>
      <div className="archetype-grid">
        {visible.map((agent) => (
          <a
            href={`#agent/${agent.id}`}
            key={agent.id}
            className={`archetype-card ${agent.color}`}
          >
            <div className="card-top">
              <RoleIcon agent={agent} />
              <span className="card-index">
                0{archetypes.indexOf(agent) + 1}
              </span>
              <StatusBadge status={statusOf(agent, progress)} />
            </div>
            <span className="role-tag">{agent.tag}</span>
            <h3>{agent.name}</h3>
            <p className="card-description">{agent.summary}</p>
            <div className="runtime-label">
              <Network size={13} />
              <span>{agent.runtime}</span>
            </div>
            <div className="card-progress">
              <ProgressBar
                value={completion(agent, progress)}
                total={agent.milestones.length}
              />
              <div>
                <span>
                  {completion(agent, progress)} / {agent.milestones.length}{" "}
                  milestones
                </span>
                <span className="explore">
                  Explore archetype <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
      {!visible.length && (
        <div className="empty-state">
          <Search size={30} />
          <h3>No archetypes match your search.</h3>
          <p>Try a role, runtime, or another status.</p>
          <button
            className="button quiet"
            onClick={() => {
              setFilter("all");
              setSearch("");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <div className="principle-banner">
        <span className="principle-icon">
          <Sparkles size={20} />
        </span>
        <div>
          <strong>Learn the architecture. Build the evidence.</strong>
          <p>
            A checked box means more when you can point to a test, a diff, or a
            decision you can defend.
          </p>
        </div>
        <a href="#roadmap">
          See the build path <ArrowRight size={16} />
        </a>
      </div>
    </>
  );
}

function AgentDetail({
  agent,
  progress,
  setProgress,
}: {
  agent: Archetype;
  progress: Progress;
  setProgress: React.Dispatch<React.SetStateAction<Progress>>;
}) {
  const [tab, setTab] = useState("architecture");
  const [expanded, setExpanded] = useState<string | null>(
    agent.milestones[0]?.id ?? null,
  );
  const done = completion(agent, progress);
  function updateMilestone(
    id: string,
    update: Partial<{ complete: boolean; evidence: string }>,
  ) {
    const key = milestoneKey(agent, id);
    setProgress((p) => {
      const value = {
        ...(p.milestones[key] ?? { complete: false, evidence: "" }),
        ...update,
      };
      if (!value.evidence.trim()) value.complete = false;
      return { ...p, milestones: { ...p.milestones, [key]: value } };
    });
  }
  return (
    <>
      <a href="#archetypes" className="back-link">
        <ArrowLeft size={15} />
        Back to the roster
      </a>
      <div className={`detail-heading ${agent.color}`}>
        <RoleIcon agent={agent} size={32} />
        <div>
          <span className="eyebrow">
            ARCHETYPE 0{archetypes.indexOf(agent) + 1} /{" "}
            {agent.tag.toUpperCase()}
          </span>
          <h1>{agent.name}</h1>
          <p>{agent.summary}</p>
        </div>
        <StatusBadge status={statusOf(agent, progress)} />
      </div>
      <div className="detail-facts">
        <div>
          <span>RUNTIME</span>
          <strong>{agent.runtime}</strong>
        </div>
        <div>
          <span>TOPOLOGY</span>
          <strong>{agent.topology}</strong>
        </div>
        <div>
          <span>BUILD PHASE</span>
          <a href="#roadmap">
            0{agent.stage} · {phases[agent.stage - 1].title}
            <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
      <div className="detail-tabs" role="tablist" aria-label="Archetype detail">
        {[
          { id: "architecture", label: "Architecture", icon: Network },
          {
            id: "milestones",
            label: `Build milestones (${done}/${agent.milestones.length})`,
            icon: CheckCheck,
          },
          { id: "decisions", label: "Decisions & recall", icon: BookOpen },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault();
                const ids = ["architecture", "milestones", "decisions"];
                const next =
                  ids[
                    (ids.indexOf(tab) + (event.key === "ArrowRight" ? 1 : 2)) %
                      3
                  ];
                setTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              }
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="tab-panel"
      >
        {tab === "architecture" && (
          <div className="architecture-detail">
            <div className="detail-main">
              <section className="panel mental-model">
                <span className="eyebrow">01 / THE MENTAL MODEL</span>
                <h2>{agent.mentalModel}</h2>
                <p>{agent.purpose}</p>
                <div className="failure-note">
                  <CircleHelp size={17} />
                  <div>
                    <strong>What breaks without it?</strong>
                    <p>{agent.failureMode}</p>
                  </div>
                </div>
              </section>
              <section className="panel flow-panel">
                <div className="panel-title">
                  <span className="eyebrow">02 / RUNTIME & TOPOLOGY</span>
                  <span className="subtle-tag">{agent.flow.length} steps</span>
                </div>
                <h2>Follow the execution.</h2>
                <div className="execution-flow">
                  {agent.flow.map((step, i) => (
                    <div className="execution-step" key={step.label}>
                      <span className="step-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <strong>{step.label}</strong>
                        <p>{step.detail}</p>
                      </div>
                      {i < agent.flow.length - 1 && (
                        <ChevronDown size={15} className="flow-down" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="bound-note">
                  <ShieldCheck size={16} />
                  <span>
                    <strong>The stopping rule</strong>
                    {agent.loopBound}
                  </span>
                </div>
              </section>
            </div>
            <aside className="detail-aside">
              <section className="panel">
                <span className="eyebrow">03 / STATE OWNERSHIP</span>
                <h3>One clear source of truth.</h3>
                <ul className="policy-list">
                  {agent.stateOwnership.map((item) => (
                    <li key={item}>
                      <Layers3 size={15} />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="artifact-list">
                  {agent.artifacts.map((item) => (
                    <code key={item}>{item}</code>
                  ))}
                </div>
              </section>
              <section className="panel">
                <span className="eyebrow">04 / TOOL BOUNDARIES</span>
                <div className="tool-group">
                  <h4>
                    <Check size={14} />
                    Allowed capabilities
                  </h4>
                  <div>
                    {agent.allowedTools.map((tool) => (
                      <code key={tool}>{tool}</code>
                    ))}
                  </div>
                </div>
                <div className="tool-group forbidden">
                  <h4>
                    <X size={14} />
                    Outside its authority
                  </h4>
                  <div>
                    {agent.forbiddenTools.map((tool) => (
                      <code key={tool}>{tool}</code>
                    ))}
                  </div>
                </div>
              </section>
              <section className="model-note">
                <Sparkles size={18} />
                <div>
                  <h4>Model & context strategy</h4>
                  <p>{agent.modelStrategy}</p>
                  <p>{agent.contextStrategy}</p>
                </div>
              </section>
            </aside>
          </div>
        )}
        {tab === "milestones" && (
          <div className="milestone-layout">
            <section className="panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">BUILD IT IN AGENTBOX-CORE</span>
                  <h2>From concept to proof.</h2>
                </div>
                <span className="milestone-fraction">
                  {done}
                  <small>/{agent.milestones.length}</small>
                </span>
              </div>
              <p className="section-description">
                Add evidence, then verify each milestone. These are your
                learning records; they do not run or inspect the engine.
              </p>
              <ProgressBar value={done} total={agent.milestones.length} />
              <div className="milestone-list">
                {agent.milestones.map((m, i) => {
                  const item = progress.milestones[milestoneKey(agent, m.id)];
                  const open = expanded === m.id;
                  return (
                    <div
                      className={`milestone ${item?.complete ? "complete" : ""}`}
                      key={m.id}
                    >
                      <button
                        className="check-box"
                        role="checkbox"
                        aria-checked={!!item?.complete}
                        aria-label={`Verify ${m.title}`}
                        title={
                          item?.evidence.trim()
                            ? "Toggle milestone verification"
                            : "Add evidence below to verify this milestone"
                        }
                        onClick={() =>
                          item?.evidence.trim()
                            ? updateMilestone(m.id, {
                                complete: !item.complete,
                              })
                            : setExpanded(m.id)
                        }
                      >
                        {item?.complete && <Check size={15} />}
                      </button>
                      <div className="milestone-body">
                        <button
                          className="milestone-heading"
                          aria-expanded={open}
                          aria-controls={`milestone-${m.id}`}
                          onClick={() => setExpanded(open ? null : m.id)}
                        >
                          <span>
                            <small>{String(i + 1).padStart(2, "0")}</small>
                            {m.title}
                          </span>
                          <ChevronDown
                            size={17}
                            className={open ? "rotated" : ""}
                          />
                        </button>
                        {open && (
                          <div
                            id={`milestone-${m.id}`}
                            className="milestone-evidence"
                          >
                            <p>{m.detail}</p>
                            <div className="proof-hint">
                              <ShieldCheck size={15} />
                              <span>{m.proof}</span>
                            </div>
                            <label htmlFor={`evidence-${m.id}`}>
                              Your evidence{" "}
                              <span>
                                Test output, commit, or a short explanation
                              </span>
                            </label>
                            <textarea
                              id={`evidence-${m.id}`}
                              maxLength={20000}
                              rows={3}
                              placeholder="What did you build, and how did you verify it?"
                              value={item?.evidence || ""}
                              onChange={(e) =>
                                updateMilestone(m.id, {
                                  evidence: e.target.value,
                                })
                              }
                            />
                            <span className="input-hint">
                              {item?.complete
                                ? "Verified by you · evidence saved locally"
                                : "Write your evidence, then check the milestone to verify it."}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            <aside className="learning-note">
              <span className="note-mark">↗</span>
              <span className="eyebrow">PROGRESS WITH SUBSTANCE</span>
              <h3>Could you explain it without the code?</h3>
              <p>
                Before checking a milestone, describe the invariant it protects,
                the trade-off you chose, and the test that would catch a
                regression.
              </p>
              <a href="#roadmap">
                Find your next build phase
                <ArrowRight size={15} />
              </a>
            </aside>
          </div>
        )}
        {tab === "decisions" && (
          <div className="decisions-layout">
            <div>
              <div className="section-title">
                <h2>Make the architectural call.</h2>
                <p>
                  These are proposed decisions. Your choices become your record.
                </p>
              </div>
              {agent.decisions.map((decision, i) => {
                const key = decisionKey(agent, i),
                  item = progress.decisions[key];
                return (
                  <section className="panel decision-panel" key={key}>
                    <span className="eyebrow">DECISION 0{i + 1}</span>
                    <h3>{decision.question}</h3>
                    <label htmlFor={`choice-${i}`}>Your choice</label>
                    <select
                      id={`choice-${i}`}
                      value={item?.choice || ""}
                      onChange={(e) =>
                        setProgress((p) => ({
                          ...p,
                          decisions: {
                            ...p.decisions,
                            [key]: {
                              ...(p.decisions[key] ?? {
                                choice: "",
                                rationale: "",
                              }),
                              choice: e.target.value,
                            },
                          },
                        }))
                      }
                    >
                      <option value="">Not decided yet</option>
                      {decision.options.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                    <p className="recommendation">
                      <Compass size={15} />
                      <span>
                        <strong>A starting recommendation:</strong>{" "}
                        {decision.recommendation}
                      </span>
                    </p>
                    <label htmlFor={`rationale-${i}`}>
                      Why this trade-off?
                    </label>
                    <textarea
                      id={`rationale-${i}`}
                      rows={3}
                      maxLength={20000}
                      placeholder="What do you gain? What do you give up? What would change your mind?"
                      value={item?.rationale || ""}
                      onChange={(e) =>
                        setProgress((p) => ({
                          ...p,
                          decisions: {
                            ...p.decisions,
                            [key]: {
                              ...(p.decisions[key] ?? {
                                choice: "",
                                rationale: "",
                              }),
                              rationale: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </section>
                );
              })}
            </div>
            <aside className="panel recall-panel">
              <BookOpen size={24} />
              <span className="eyebrow">YOUR ENGINEERING RECALL</span>
              <h3>A note to your future self.</h3>
              <p>
                Explain this archetype in your own words. Capture a failure you
                saw, a question you still have, or a decision you would defend
                in an interview.
              </p>
              <label className="sr-only" htmlFor="learning-note">
                Learning reflection
              </label>
              <textarea
                id="learning-note"
                maxLength={50000}
                rows={12}
                placeholder="I used to think…\n\nThen I learned…\n\nThe failure mode I can now explain is…"
                value={progress.notes[agent.id] || ""}
                onChange={(e) =>
                  setProgress((p) => ({
                    ...p,
                    notes: { ...p.notes, [agent.id]: e.target.value },
                  }))
                }
              />
              <small>
                Autosaved on this device. Include in your next backup.
              </small>
            </aside>
          </div>
        )}
      </section>
      <div className="detail-pagination">
        {archetypes.map(
          (a, i) =>
            a.id === agent.id && (
              <div key={a.id}>
                {i > 0 ? (
                  <a href={`#agent/${archetypes[i - 1].id}`}>
                    <ArrowLeft size={16} />
                    <span>
                      <small>PREVIOUS ARCHETYPE</small>
                      {archetypes[i - 1].name}
                    </span>
                  </a>
                ) : (
                  <span />
                )}
                {i < archetypes.length - 1 ? (
                  <a href={`#agent/${archetypes[i + 1].id}`}>
                    <span>
                      <small>NEXT ARCHETYPE</small>
                      {archetypes[i + 1].name}
                    </span>
                    <ArrowRight size={16} />
                  </a>
                ) : (
                  <a href="#roadmap">
                    Follow the build roadmap
                    <ArrowRight size={16} />
                  </a>
                )}
              </div>
            ),
        )}
      </div>
    </>
  );
}

function SystemMap({ progress }: { progress: Progress }) {
  const [active, setActive] = useState("orchestrator");
  const agent = archetypes.find((a) => a.id === active)!;
  return (
    <>
      <PageHeading
        label="01 / TOPOLOGY & COLLABORATION"
        title="A crew, with clear boundaries."
      >
        Follow one objective through the system. Select a role to inspect its
        responsibility.
      </PageHeading>
      <div className="system-layout">
        <section className="panel system-canvas">
          <div className="canvas-title">
            <span className="eyebrow">THE BOX / CONCEPTUAL ARCHITECTURE</span>
            <span className="subtle-tag">
              <span className="live-dot" />
              Design reference
            </span>
          </div>
          <div className="objective-node">
            <Box size={18} />
            <span>Workspace + objective</span>
          </div>
          <div className="connector-label">ready event ↓</div>
          <div className="map-row single">{node("orchestrator")}</div>
          <div className="map-connectors">
            <span>gather evidence ↓</span>
            <span>delegate work ↓</span>
          </div>
          <div className="map-row pair">
            {node("scout")}
            {node("builder")}
          </div>
          <div className="map-connectors">
            <span>immutable evidence →</span>
            <span>staged patch ↓</span>
          </div>
          <div className="map-row single">{node("critic")}</div>
          <div className="map-connectors">
            <span>reject → bounded repair</span>
            <span>approve ↓ promote</span>
          </div>
          <div className="map-row pair">
            {node("sentinel")}
            {node("curator")}
          </div>
          <div className="map-caption">
            <Radio size={15} />
            Sentinel observes the whole workspace. Curator runs after
            termination.
          </div>
          <div className="ledger-strip">
            <Layers3 size={17} />
            <span>Append-only execution ledger</span>
            <small>Events + artifact references</small>
          </div>
        </section>
        <aside className={`panel map-inspector ${agent.color}`}>
          <RoleIcon agent={agent} size={28} />
          <span className="eyebrow">SELECTED ROLE</span>
          <h2>{agent.name}</h2>
          <p>{agent.purpose}</p>
          <dl>
            <dt>Runtime</dt>
            <dd>{agent.runtime}</dd>
            <dt>State boundary</dt>
            <dd>{agent.stateOwnership[0]}</dd>
            <dt>Stopping rule</dt>
            <dd>{agent.loopBound}</dd>
          </dl>
          <StatusBadge status={statusOf(agent, progress)} />
          <a className="button primary" href={`#agent/${agent.id}`}>
            Inspect archetype
            <ArrowUpRight size={15} />
          </a>
        </aside>
      </div>
      <div className="principle-banner">
        <ShieldCheck size={23} />
        <div>
          <strong>Coordination does not imply shared mutation.</strong>
          <p>
            Only the Orchestrator owns the task graph. Specialists exchange
            immutable, typed artifacts.
          </p>
        </div>
      </div>
    </>
  );
  function node(id: string) {
    const a = archetypes.find((x) => x.id === id)!;
    return (
      <button
        className={`map-node ${a.color} ${active === id ? "selected" : ""}`}
        onClick={() => setActive(id)}
        aria-pressed={active === id}
      >
        <RoleIcon agent={a} size={20} />
        <span>
          <strong>{a.shortName}</strong>
          <small>{a.tag}</small>
        </span>
        <ChevronRight size={14} />
      </button>
    );
  }
}

function Roadmap({ progress }: { progress: Progress }) {
  return (
    <>
      <PageHeading
        label="02 / PROGRESSIVE IMPLEMENTATION"
        title="Build one guarantee at a time."
      >
        A four-phase path from a bounded worker to a coordinated, observable
        agent system.
      </PageHeading>
      <div className="roadmap-note">
        <Compass size={19} />
        <span>
          This is a suggested build sequence. Milestones reflect your saved
          evidence; scaffolded code is not automatically marked complete.
        </span>
      </div>
      <div className="roadmap-list">
        {phases.map((phase, i) => {
          const agents = archetypes.filter((a) => phase.agents.includes(a.id));
          const done = agents.reduce((n, a) => n + completion(a, progress), 0),
            total = agents.reduce((n, a) => n + a.milestones.length, 0);
          return (
            <section className="roadmap-phase" key={phase.title}>
              <div className="phase-marker">
                <span>0{i + 1}</span>
              </div>
              <div className="panel phase-content">
                <div className="panel-title">
                  <span className="eyebrow">PHASE 0{i + 1}</span>
                  <span className="subtle-tag">
                    {done} / {total} milestones
                  </span>
                </div>
                <h2>{phase.title}</h2>
                <h3>{phase.subtitle}</h3>
                <p>{phase.description}</p>
                <ProgressBar value={done} total={total} />
                <div className="phase-agents">
                  {agents.map((a) => (
                    <a key={a.id} href={`#agent/${a.id}`}>
                      <RoleIcon agent={a} size={18} />
                      <span>{a.name}</span>
                      <StatusBadge status={statusOf(a, progress)} />
                      <ArrowUpRight size={15} />
                    </a>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
      <section className="repo-boundary">
        <Box size={24} />
        <div>
          <span className="eyebrow">TWO PROJECTS. A CLEAR BOUNDARY.</span>
          <h3>Learn here. Engineer in agentbox-core.</h3>
          <p>
            This app stores your understanding and evidence. The standalone
            engine owns runtime code, workspaces, and execution logs.
          </p>
          <div>
            <code>agent-architect/</code>
            <span>↔ decisions & evidence ↔</span>
            <code>agentbox-core/</code>
          </div>
        </div>
      </section>
    </>
  );
}
