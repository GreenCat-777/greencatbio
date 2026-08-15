"use client";

import { useState, useEffect, useCallback } from "react";

type Vouch = {
  id: string;
  name: string;
  body: string;
  email: string;
  user_confirmed: boolean;
  admin_approved: boolean;
  admin_note: string | null;
  created_at: string;
};

type Puzzle = {
  question: string;
  answer: number;
};

function generatePuzzle(): Puzzle {
  const puzzles: Puzzle[] = [
    { question: "What is 7 + 8?", answer: 15 },
    { question: "What is 13 - 5?", answer: 8 },
    { question: "What is 4 × 6?", answer: 24 },
    { question: "What is 36 ÷ 6?", answer: 6 },
    { question: "What is 9 + 14?", answer: 23 },
    { question: "What is 100 - 37?", answer: 63 },
    { question: "What is 3 × 9?", answer: 27 },
    { question: "What is 81 ÷ 9?", answer: 9 },
    { question: "What is 17 + 26?", answer: 43 },
    { question: "What is 5 × 7?", answer: 35 },
  ];
  return puzzles[Math.floor(Math.random() * puzzles.length)];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ── LOGIN SCREEN ───────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [puzzleAnswer, setPuzzleAnswer] = useState("");
  const [puzzle] = useState(generatePuzzle);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(4);
  const [locked, setLocked] = useState(false);

  async function handleLogin() {
    setError(null);
    if (!password.trim()) return setError("Password required.");
    if (!puzzleAnswer.trim()) return setError("Solve the puzzle first.");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          puzzle,
          puzzleAnswer: Number(puzzleAnswer),
        }),
      });
      const data = await res.json();

      if (data.ok) {
        onLogin();
      } else {
        if (data.locked) {
          setLocked(true);
          setError(data.error);
        } else {
          setAttempts(data.remaining ?? attempts - 1);
          setError(data.error);
        }
      }
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  }

  const css = `
    .al-wrap { font-family:monospace; color:#0ed145; }
    .al-box { border:2px solid #0ed145; border-radius:12px; padding:2rem; background:rgba(0,0,0,0.5); box-shadow:0 0 30px rgba(14,209,69,0.3); max-width:400px; margin:0 auto; }
    .al-prompt { font-size:0.8rem; opacity:0.5; margin:0 0 6px; letter-spacing:0.08em; }
    .al-title { font-size:1.4rem; font-weight:bold; color:#0ed145; margin:0 0 1.5rem; text-shadow:0 0 10px rgba(14,209,69,0.4); }
    .al-label { font-size:0.75rem; opacity:0.5; letter-spacing:0.08em; margin-bottom:5px; }
    .al-field { margin-bottom:1rem; }
    .al-input { width:100%; background:transparent; border:1px solid rgba(14,209,69,0.4); border-radius:6px; padding:0.5rem 0.75rem; color:#0ed145; font-family:monospace; font-size:0.9rem; outline:none; box-sizing:border-box; transition:border-color 0.15s, box-shadow 0.15s; }
    .al-input:focus { border-color:#0ed145; box-shadow:0 0 8px rgba(14,209,69,0.25); }
    .al-input::placeholder { color:rgba(14,209,69,0.3); }
    .al-puzzle { background:rgba(14,209,69,0.05); border:1px solid rgba(14,209,69,0.2); border-radius:8px; padding:0.75rem 1rem; margin-bottom:1rem; }
    .al-puzzle-q { font-size:0.85rem; color:rgba(14,209,69,0.7); margin:0 0 8px; }
    .al-attempts { font-size:0.72rem; opacity:0.4; margin-bottom:1rem; }
    .al-error { font-size:0.78rem; color:#ff5555; margin-bottom:0.75rem; }
    .al-btn { width:100%; padding:0.55rem; border:2px solid #0ed145; border-radius:6px; background:transparent; color:#0ed145; font-family:monospace; font-size:0.9rem; font-weight:bold; cursor:pointer; letter-spacing:0.06em; transition:background 0.15s, color 0.15s; }
    .al-btn:hover:not(:disabled) { background:#0ed145; color:black; }
    .al-btn:disabled { opacity:0.45; cursor:not-allowed; }
    .al-locked { text-align:center; padding:1rem 0; }
    .al-lock-icon { font-size:2rem; margin-bottom:0.5rem; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="al-wrap">
        <div className="al-box">
          <p className="al-prompt">greencat777@bio:~$ sudo admin</p>
          <h2 className="al-title">Admin Access</h2>

          {locked ? (
            <div className="al-locked">
              <div className="al-lock-icon">🔒</div>
              <p className="al-error">{error}</p>
            </div>
          ) : (
            <>
              {/* Puzzle */}
              <div className="al-puzzle">
                <p className="al-puzzle-q">// Solve to continue: {puzzle.question}</p>
                <input
                  className="al-input"
                  type="number"
                  placeholder="answer"
                  value={puzzleAnswer}
                  onChange={(e) => setPuzzleAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              {/* Password */}
              <div className="al-field">
                <p className="al-label">// PASSWORD</p>
                <input
                  className="al-input"
                  type="password"
                  placeholder="admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>

              <p className="al-attempts">Attempts remaining: {attempts}/4</p>

              {error && <p className="al-error">⚠ {error}</p>}

              <button className="al-btn" onClick={handleLogin} disabled={loading}>
                {loading ? "authenticating..." : "→ login"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── DASHBOARD ───────────────────────────────────────────────────
function Dashboard() {
  const [vouches, setVouches] = useState<Vouch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const fetchVouches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vouches");
      const data = await res.json();
      if (data.vouches) setVouches(data.vouches);
    } catch {
      showToast("Failed to load vouches.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchVouches(); }, [fetchVouches]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function approve(id: string) {
    setActionLoading(id + "-approve");
    try {
      await fetch("/api/admin/vouches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, admin_approved: true }),
      });
      setVouches((v) => v.map((x) => x.id === id ? { ...x, admin_approved: true } : x));
      showToast("✓ Vouch approved and published.");
    } catch { showToast("Error approving vouch."); }
    setActionLoading(null);
  }

  async function reject(id: string) {
    setActionLoading(id + "-reject");
    try {
      await fetch("/api/admin/vouches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, admin_approved: false }),
      });
      setVouches((v) => v.map((x) => x.id === id ? { ...x, admin_approved: false } : x));
      showToast("Vouch unpublished.");
    } catch { showToast("Error."); }
    setActionLoading(null);
  }

  async function deleteVouch(id: string) {
    if (!confirm("Permanently delete this vouch?")) return;
    setActionLoading(id + "-delete");
    try {
      await fetch("/api/admin/vouches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setVouches((v) => v.filter((x) => x.id !== id));
      showToast("Vouch deleted.");
    } catch { showToast("Error deleting."); }
    setActionLoading(null);
  }

  function noteValue(v: Vouch) {
    return noteDrafts[v.id] !== undefined ? noteDrafts[v.id] : (v.admin_note ?? "");
  }

  async function saveNote(id: string) {
    const admin_note = noteDrafts[id] ?? "";
    setActionLoading(id + "-note");
    try {
      await fetch("/api/admin/vouches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, admin_note }),
      });
      setVouches((v) => v.map((x) => x.id === id ? { ...x, admin_note: admin_note.trim() ? admin_note.trim() : null } : x));
      setNoteDrafts((d) => { const n = { ...d }; delete n[id]; return n; });
      showToast("✓ Note saved.");
    } catch { showToast("Error saving note."); }
    setActionLoading(null);
  }

  const filtered = vouches.filter((v) => {
    if (filter === "pending") return !v.admin_approved;
    if (filter === "approved") return v.admin_approved;
    return true;
  });

  const counts = {
    all: vouches.length,
    pending: vouches.filter((v) => !v.admin_approved).length,
    approved: vouches.filter((v) => v.admin_approved).length,
  };

  const css = `
    .ad-wrap { font-family:monospace; color:#0ed145; }
    .ad-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(14,209,69,0.2); flex-wrap:wrap; gap:0.5rem; }
    .ad-title { font-size:1.1rem; font-weight:bold; letter-spacing:0.06em; }
    .ad-refresh { padding:4px 14px; border:1px solid rgba(14,209,69,0.4); border-radius:5px; background:transparent; color:rgba(14,209,69,0.6); font-family:monospace; font-size:0.78rem; cursor:pointer; transition:all 0.15s; }
    .ad-refresh:hover { border-color:#0ed145; color:#0ed145; }
    .ad-box { border:2px solid #0ed145; border-radius:12px; padding:1.5rem; background:rgba(0,0,0,0.5); box-shadow:0 0 24px rgba(14,209,69,0.25); }
    .ad-tabs { display:flex; gap:0.4rem; margin-bottom:1.25rem; }
    .ad-tab { padding:5px 16px; border:1px solid rgba(14,209,69,0.3); border-radius:5px; background:transparent; color:rgba(14,209,69,0.5); font-family:monospace; font-size:0.8rem; cursor:pointer; transition:all 0.15s; }
    .ad-tab:hover { border-color:#0ed145; color:#0ed145; }
    .ad-tab-active { border-color:#0ed145; color:#000; background:#0ed145; }
    .ad-badge { display:inline-block; margin-left:4px; background:rgba(14,209,69,0.15); border-radius:3px; padding:0 5px; font-size:0.7rem; }
    .ad-tab-active .ad-badge { background:rgba(0,0,0,0.25); color:#000; }
    .ad-list { display:flex; flex-direction:column; gap:0.85rem; }
    .ad-empty { opacity:0.4; font-size:0.85rem; text-align:center; padding:2rem 0; }
    .ad-item { border:1px solid rgba(14,209,69,0.2); border-radius:8px; padding:1rem; background:rgba(14,209,69,0.02); }
    .ad-item-approved { border-color:rgba(14,209,69,0.4); background:rgba(14,209,69,0.04); }
    .ad-row1 { display:flex; align-items:baseline; gap:0.75rem; margin-bottom:6px; flex-wrap:wrap; }
    .ad-name { font-weight:bold; font-size:0.9rem; }
    .ad-time { font-size:0.7rem; opacity:0.4; }
    .ad-badge-confirmed { font-size:0.65rem; padding:1px 7px; border-radius:4px; border:1px solid rgba(14,209,69,0.5); color:rgba(14,209,69,0.7); font-weight:bold; }
    .ad-badge-unconfirmed { font-size:0.65rem; padding:1px 7px; border-radius:4px; border:1px solid rgba(14,209,69,0.2); color:rgba(14,209,69,0.35); }
    .ad-badge-live { font-size:0.65rem; padding:1px 7px; border-radius:4px; border:1px solid #0ed145; color:#0ed145; font-weight:bold; }
    .ad-body { font-size:0.85rem; line-height:1.6; opacity:0.8; white-space:pre-wrap; word-break:break-word; margin:0 0 10px; }
    .ad-actions { display:flex; gap:0.4rem; flex-wrap:wrap; }
    .ad-btn { padding:4px 14px; border-radius:5px; font-family:monospace; font-size:0.78rem; font-weight:bold; cursor:pointer; transition:all 0.15s; border:1px solid; letter-spacing:0.04em; }
    .ad-btn:disabled { opacity:0.4; cursor:not-allowed; }
    .ad-btn-approve { border-color:rgba(14,209,69,0.5); color:rgba(14,209,69,0.8); background:transparent; }
    .ad-btn-approve:hover:not(:disabled) { background:#0ed145; color:#000; border-color:#0ed145; }
    .ad-btn-unapprove { border-color:rgba(255,200,0,0.5); color:rgba(255,200,0,0.8); background:transparent; }
    .ad-btn-unapprove:hover:not(:disabled) { background:rgba(255,200,0,0.2); }
    .ad-btn-delete { border-color:rgba(255,85,85,0.4); color:rgba(255,85,85,0.7); background:transparent; }
    .ad-btn-delete:hover:not(:disabled) { background:rgba(255,85,85,0.15); border-color:#ff5555; color:#ff5555; }
    .ad-toast { position:fixed; bottom:24px; right:24px; background:#0ed145; color:#000; font-family:monospace; font-size:0.85rem; font-weight:bold; padding:10px 20px; border-radius:8px; box-shadow:0 0 20px rgba(14,209,69,0.5); z-index:9999; animation:ad-fadein 0.2s ease; }
    @keyframes ad-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .ad-spinner { display:inline-block; width:12px; height:12px; border:1px solid rgba(14,209,69,0.3); border-top-color:#0ed145; border-radius:50%; animation:ad-spin 0.7s linear infinite; margin-right:4px; vertical-align:middle; }
    @keyframes ad-spin { to{transform:rotate(360deg)} }
    .ad-stats { display:flex; gap:0.75rem; margin-bottom:1.25rem; flex-wrap:wrap; }
    .ad-stat { border:1px solid rgba(14,209,69,0.2); border-radius:6px; padding:8px 14px; background:rgba(14,209,69,0.03); }
    .ad-stat-val { font-size:1.4rem; font-weight:bold; line-height:1; }
    .ad-stat-label { font-size:0.68rem; opacity:0.4; margin-top:2px; letter-spacing:0.06em; }
    .ad-note-block { margin-top:10px; padding-top:10px; border-top:1px dashed rgba(14,209,69,0.15); }
    .ad-note-label { font-size:0.7rem; opacity:0.4; letter-spacing:0.06em; margin-bottom:5px; }
    .ad-note-input { width:100%; background:transparent; border:1px solid rgba(14,209,69,0.35); border-radius:6px; padding:0.5rem 0.75rem; color:#0ed145; font-family:monospace; font-size:0.82rem; outline:none; resize:vertical; min-height:50px; box-sizing:border-box; transition:border-color 0.15s, box-shadow 0.15s; }
    .ad-note-input:focus { border-color:#0ed145; box-shadow:0 0 8px rgba(14,209,69,0.25); }
    .ad-note-input::placeholder { color:rgba(14,209,69,0.3); }
    .ad-note-row { display:flex; align-items:center; gap:0.5rem; margin-top:6px; }
    .ad-btn-note { border-color:rgba(14,209,69,0.5); color:rgba(14,209,69,0.8); background:transparent; }
    .ad-btn-note:hover:not(:disabled) { background:#0ed145; color:#000; border-color:#0ed145; }
    .ad-note-dirty { font-size:0.68rem; color:rgba(255,200,0,0.75); }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="ad-wrap">
        <div className="ad-box">
          <div className="ad-header">
            <div>
              <p style={{ margin: "0 0 2px", fontSize: "0.78rem", opacity: 0.45, letterSpacing: "0.08em" }}>greencat777@bio:~$</p>
              <span className="ad-title">// ADMIN DASHBOARD — VOUCHES</span>
            </div>
            <button className="ad-refresh" onClick={fetchVouches}>
              ↺ refresh
            </button>
          </div>

          {/* Stats */}
          <div className="ad-stats">
            <div className="ad-stat">
              <div className="ad-stat-val">{counts.all}</div>
              <div className="ad-stat-label">TOTAL</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat-val">{counts.pending}</div>
              <div className="ad-stat-label">PENDING</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat-val">{counts.approved}</div>
              <div className="ad-stat-label">APPROVED</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat-val">{vouches.filter((v) => v.user_confirmed).length}</div>
              <div className="ad-stat-label">USER CONFIRMED</div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="ad-tabs">
            {(["pending", "approved", "all"] as const).map((tab) => (
              <button
                key={tab}
                className={`ad-tab${filter === tab ? " ad-tab-active" : ""}`}
                onClick={() => setFilter(tab)}
              >
                {tab.toUpperCase()}
                <span className="ad-badge">{counts[tab]}</span>
              </button>
            ))}
          </div>

          {/* List */}
          <div className="ad-list">
            {loading ? (
              <p className="ad-empty">
                <span className="ad-spinner" />loading...
              </p>
            ) : filtered.length === 0 ? (
              <p className="ad-empty">No {filter === "all" ? "" : filter} vouches.</p>
            ) : (
              filtered.map((v) => (
                <div key={v.id} className={`ad-item${v.admin_approved ? " ad-item-approved" : ""}`}>
                  <div className="ad-row1">
                    <span className="ad-name">{v.name}</span>
                    <span className="ad-time">{timeAgo(v.created_at)}</span>
                    {v.admin_approved && <span className="ad-badge-live">● LIVE</span>}
                    {v.user_confirmed
                      ? <span className="ad-badge-confirmed">✓ Confirmed</span>
                      : <span className="ad-badge-unconfirmed">Unconfirmed</span>}
                  </div>
                  <div style={{fontSize:"0.75rem", opacity:0.4, marginBottom:"8px"}}>✉ {v.email}</div>
                  <p className="ad-body">{v.body}</p>
                  <div className="ad-actions">
                    {!v.admin_approved ? (
                      <button
                        className="ad-btn ad-btn-approve"
                        onClick={() => approve(v.id)}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === v.id + "-approve" ? <><span className="ad-spinner" />approving...</> : "✓ Approve"}
                      </button>
                    ) : (
                      <button
                        className="ad-btn ad-btn-unapprove"
                        onClick={() => reject(v.id)}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === v.id + "-reject" ? <><span className="ad-spinner" />saving...</> : "⊘ Unpublish"}
                      </button>
                    )}
                    <button
                      className="ad-btn ad-btn-delete"
                      onClick={() => deleteVouch(v.id)}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === v.id + "-delete" ? <><span className="ad-spinner" />deleting...</> : "✕ Delete"}
                    </button>
                  </div>

                  <div className="ad-note-block">
                    <p className="ad-note-label">// NOTE FROM GREENCAT (shown publicly on this vouch)</p>
                    <textarea
                      className="ad-note-input"
                      placeholder="optional note to display under this vouch..."
                      rows={2}
                      value={noteValue(v)}
                      onChange={(e) => setNoteDrafts((d) => ({ ...d, [v.id]: e.target.value }))}
                    />
                    <div className="ad-note-row">
                      <button
                        className="ad-btn ad-btn-note"
                        onClick={() => saveNote(v.id)}
                        disabled={!!actionLoading || noteValue(v) === (v.admin_note ?? "")}
                      >
                        {actionLoading === v.id + "-note" ? <><span className="ad-spinner" />saving...</> : "💾 Save note"}
                      </button>
                      {noteValue(v) !== (v.admin_note ?? "") && <span className="ad-note-dirty">unsaved changes</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {toast && <div className="ad-toast">{toast}</div>}
    </>
  );
}

// ── ACCOUNTS PANEL ─────────────────────────────────────────────
type UserRow = {
  id: string;
  email: string | null;
  email_confirmed: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  username: string | null;
  avatar_url: string | null;
};

function AccountsPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const css = `
    .ad-wrap { font-family:monospace; color:#0ed145; }
    .ad-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(14,209,69,0.2); flex-wrap:wrap; gap:0.5rem; }
    .ad-title { font-size:1.1rem; font-weight:bold; letter-spacing:0.06em; }
    .ad-refresh { padding:4px 14px; border:1px solid rgba(14,209,69,0.4); border-radius:5px; background:transparent; color:rgba(14,209,69,0.6); font-family:monospace; font-size:0.78rem; cursor:pointer; transition:all 0.15s; }
    .ad-refresh:hover { border-color:#0ed145; color:#0ed145; }
    .ad-box { border:2px solid #0ed145; border-radius:12px; padding:1.5rem; background:rgba(0,0,0,0.5); box-shadow:0 0 24px rgba(14,209,69,0.25); }
    .ad-list { display:flex; flex-direction:column; gap:0.85rem; }
    .ad-empty { opacity:0.4; font-size:0.85rem; text-align:center; padding:2rem 0; }
    .ad-item { border:1px solid rgba(14,209,69,0.2); border-radius:8px; padding:1rem; background:rgba(14,209,69,0.02); }
    .ad-row1 { display:flex; align-items:baseline; gap:0.75rem; margin-bottom:6px; flex-wrap:wrap; }
    .ad-name { font-weight:bold; font-size:0.9rem; }
    .ad-time { font-size:0.7rem; opacity:0.4; }
    .ad-badge-confirmed { font-size:0.65rem; padding:1px 7px; border-radius:4px; border:1px solid rgba(14,209,69,0.5); color:rgba(14,209,69,0.7); font-weight:bold; }
    .ad-badge-unconfirmed { font-size:0.65rem; padding:1px 7px; border-radius:4px; border:1px solid rgba(14,209,69,0.2); color:rgba(14,209,69,0.35); }
    .ad-body { font-size:0.85rem; line-height:1.6; opacity:0.8; white-space:pre-wrap; word-break:break-word; margin:0 0 10px; }
    .ad-actions { display:flex; gap:0.4rem; flex-wrap:wrap; }
    .ad-btn { padding:4px 14px; border-radius:5px; font-family:monospace; font-size:0.78rem; font-weight:bold; cursor:pointer; transition:all 0.15s; border:1px solid; letter-spacing:0.04em; }
    .ad-btn:disabled { opacity:0.4; cursor:not-allowed; }
    .ad-btn-delete { border-color:rgba(255,85,85,0.4); color:rgba(255,85,85,0.7); background:transparent; }
    .ad-btn-delete:hover:not(:disabled) { background:rgba(255,85,85,0.15); border-color:#ff5555; color:#ff5555; }
    .ad-toast { position:fixed; bottom:24px; right:24px; background:#0ed145; color:#000; font-family:monospace; font-size:0.85rem; font-weight:bold; padding:10px 20px; border-radius:8px; box-shadow:0 0 20px rgba(14,209,69,0.5); z-index:9999; animation:ad-fadein 0.2s ease; }
    @keyframes ad-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .ad-spinner { display:inline-block; width:12px; height:12px; border:1px solid rgba(14,209,69,0.3); border-top-color:#0ed145; border-radius:50%; animation:ad-spin 0.7s linear infinite; margin-right:4px; vertical-align:middle; }
    @keyframes ad-spin { to{transform:rotate(360deg)} }
    .ad-stats { display:flex; gap:0.75rem; margin-bottom:1.25rem; flex-wrap:wrap; }
    .ad-stat { border:1px solid rgba(14,209,69,0.2); border-radius:6px; padding:8px 14px; background:rgba(14,209,69,0.03); }
    .ad-stat-val { font-size:1.4rem; font-weight:bold; line-height:1; }
    .ad-stat-label { font-size:0.68rem; opacity:0.4; margin-top:2px; letter-spacing:0.06em; }
  `;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch {
      showToast("Failed to load accounts.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function deleteUser(id: string, label: string) {
    if (!confirm(`Permanently delete ${label}'s account and all their data (vouches, comments, messages)?`)) return;
    setActionLoading(id);
    try {
      await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setUsers((u) => u.filter((x) => x.id !== id));
      showToast("✓ Account deleted.");
    } catch {
      showToast("Error deleting account.");
    }
    setActionLoading(null);
  }

  return (
    <div className="ad-wrap">
      <style>{css}</style>
      <div className="ad-box">
        <div className="ad-header">
          <div>
            <p style={{ margin: "0 0 2px", fontSize: "0.78rem", opacity: 0.45, letterSpacing: "0.08em" }}>greencat777@bio:~$</p>
            <span className="ad-title">// ADMIN DASHBOARD — ACCOUNTS</span>
          </div>
          <button className="ad-refresh" onClick={fetchUsers}>↺ refresh</button>
        </div>

        <div className="ad-stats">
          <div className="ad-stat">
            <div className="ad-stat-val">{users.length}</div>
            <div className="ad-stat-label">TOTAL ACCOUNTS</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat-val">{users.filter((u) => u.email_confirmed).length}</div>
            <div className="ad-stat-label">VERIFIED</div>
          </div>
        </div>

        <div className="ad-list">
          {loading ? (
            <p className="ad-empty"><span className="ad-spinner" />loading...</p>
          ) : users.length === 0 ? (
            <p className="ad-empty">No accounts yet.</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="ad-item">
                <div className="ad-row1">
                  <span className="ad-name">{u.username || "(no username set)"}</span>
                  <span className="ad-time">joined {timeAgo(u.created_at)}</span>
                  {u.email_confirmed
                    ? <span className="ad-badge-confirmed">✓ Verified</span>
                    : <span className="ad-badge-unconfirmed">Unverified</span>}
                </div>
                <div style={{ fontSize: "0.75rem", opacity: 0.4, marginBottom: "8px" }}>
                  ✉ {u.email} {u.last_sign_in_at && `· last seen ${timeAgo(u.last_sign_in_at)}`}
                </div>
                <div className="ad-actions">
                  <button
                    className="ad-btn ad-btn-delete"
                    onClick={() => deleteUser(u.id, u.username || u.email || "this user")}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === u.id ? <><span className="ad-spinner" />deleting...</> : "✕ Delete Account"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {toast && <div className="ad-toast">{toast}</div>}
    </div>
  );
}

// ── MESSAGES PANEL ──────────────────────────────────────────────
type MessageRow = {
  id: string;
  sender_id: string | null;
  recipient_id: string | null;
  other_id: string;
  other_username: string;
  from_admin: boolean;
  body: string;
  created_at: string;
  read_at: string | null;
};

type Conversation = {
  otherId: string;
  otherUsername: string;
  lastBody: string;
  lastAt: string;
  unread: boolean;
};

function MessagesPanel() {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState("");
  const [newChatError, setNewChatError] = useState<string | null>(null);
  const [newChatLoading, setNewChatLoading] = useState(false);

  const css = `
    .ad-wrap { font-family:monospace; color:#0ed145; }
    .ad-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(14,209,69,0.2); flex-wrap:wrap; gap:0.5rem; }
    .ad-title { font-size:1.1rem; font-weight:bold; letter-spacing:0.06em; }
    .ad-refresh { padding:4px 14px; border:1px solid rgba(14,209,69,0.4); border-radius:5px; background:transparent; color:rgba(14,209,69,0.6); font-family:monospace; font-size:0.78rem; cursor:pointer; transition:all 0.15s; }
    .ad-refresh:hover { border-color:#0ed145; color:#0ed145; }
    .ad-box { border:2px solid #0ed145; border-radius:12px; padding:1.5rem; background:rgba(0,0,0,0.5); box-shadow:0 0 24px rgba(14,209,69,0.25); }
    .ad-list { display:flex; flex-direction:column; gap:0.85rem; }
    .ad-empty { opacity:0.4; font-size:0.85rem; text-align:center; padding:2rem 0; }
    .ad-item { border:1px solid rgba(14,209,69,0.2); border-radius:8px; padding:1rem; background:rgba(14,209,69,0.02); cursor:pointer; transition:border-color 0.15s; text-align:left; width:100%; }
    .ad-item:hover { border-color:rgba(14,209,69,0.4); }
    .ad-row1 { display:flex; align-items:baseline; gap:0.75rem; margin-bottom:6px; flex-wrap:wrap; }
    .ad-name { font-weight:bold; font-size:0.9rem; }
    .ad-time { font-size:0.7rem; opacity:0.4; }
    .ad-badge-confirmed { font-size:0.65rem; padding:1px 7px; border-radius:4px; border:1px solid rgba(14,209,69,0.5); color:rgba(14,209,69,0.7); font-weight:bold; }
    .ad-badge-unconfirmed { font-size:0.65rem; padding:1px 7px; border-radius:4px; border:1px solid rgba(14,209,69,0.2); color:rgba(14,209,69,0.35); }
    .ad-body { font-size:0.85rem; line-height:1.6; opacity:0.8; white-space:pre-wrap; word-break:break-word; margin:0 0 10px; }
    .ad-actions { display:flex; gap:0.4rem; flex-wrap:wrap; }
    .ad-btn { padding:4px 14px; border-radius:5px; font-family:monospace; font-size:0.78rem; font-weight:bold; cursor:pointer; transition:all 0.15s; border:1px solid; letter-spacing:0.04em; }
    .ad-btn:disabled { opacity:0.4; cursor:not-allowed; }
    .ad-btn-delete { border-color:rgba(255,85,85,0.4); color:rgba(255,85,85,0.7); background:transparent; }
    .ad-btn-delete:hover:not(:disabled) { background:rgba(255,85,85,0.15); border-color:#ff5555; color:#ff5555; }
    .ad-btn-approve { border-color:rgba(14,209,69,0.5); color:rgba(14,209,69,0.8); background:transparent; }
    .ad-btn-approve:hover:not(:disabled) { background:#0ed145; color:#000; border-color:#0ed145; }
    .ad-toast { position:fixed; bottom:24px; right:24px; background:#0ed145; color:#000; font-family:monospace; font-size:0.85rem; font-weight:bold; padding:10px 20px; border-radius:8px; box-shadow:0 0 20px rgba(14,209,69,0.5); z-index:9999; animation:ad-fadein 0.2s ease; }
    @keyframes ad-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .ad-spinner { display:inline-block; width:12px; height:12px; border:1px solid rgba(14,209,69,0.3); border-top-color:#0ed145; border-radius:50%; animation:ad-spin 0.7s linear infinite; margin-right:4px; vertical-align:middle; }
    @keyframes ad-spin { to{transform:rotate(360deg)} }
    .ad-stats { display:flex; gap:0.75rem; margin-bottom:1.25rem; flex-wrap:wrap; }
    .ad-stat { border:1px solid rgba(14,209,69,0.2); border-radius:6px; padding:8px 14px; background:rgba(14,209,69,0.03); }
    .ad-stat-val { font-size:1.4rem; font-weight:bold; line-height:1; }
    .ad-stat-label { font-size:0.68rem; opacity:0.4; margin-top:2px; letter-spacing:0.06em; }
    .ad-back { background:transparent; border:none; color:#0ed145; font-size:1.1rem; cursor:pointer; padding:0 6px; }
    .ad-thread-body { display:flex; flex-direction:column; gap:0.5rem; max-height:340px; overflow-y:auto; margin-bottom:1rem; padding-right:2px; }
    .ad-msg { max-width:75%; padding:0.5rem 0.8rem; border-radius:10px; font-size:0.85rem; line-height:1.5; word-break:break-word; white-space:pre-wrap; }
    .ad-msg-mine { align-self:flex-end; background:rgba(14,209,69,0.18); border:1px solid rgba(14,209,69,0.4); }
    .ad-msg-theirs { align-self:flex-start; background:rgba(14,209,69,0.05); border:1px solid rgba(14,209,69,0.15); }
    .ad-msg-time { font-size:0.62rem; opacity:0.35; margin-top:3px; }
    .ad-reply-row { display:flex; gap:0.5rem; padding-top:1rem; border-top:1px solid rgba(14,209,69,0.15); }
    .ad-reply-input { flex:1; background:transparent; border:1px solid rgba(14,209,69,0.35); border-radius:6px; padding:0.5rem 0.75rem; color:#0ed145; font-family:monospace; font-size:0.85rem; outline:none; resize:none; }
    .ad-reply-input:focus { border-color:#0ed145; box-shadow:0 0 8px rgba(14,209,69,0.25); }
  `;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages");
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {
      showToast("Failed to load messages.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const conversations: Conversation[] = (() => {
    const byOther = new Map<string, { username: string; lastBody: string; lastAt: string; unread: boolean }>();
    for (const m of messages) {
      const existing = byOther.get(m.other_id);
      const isUnread = m.from_admin === false && !m.read_at;
      if (!existing || new Date(m.created_at) >= new Date(existing.lastAt)) {
        byOther.set(m.other_id, {
          username: m.other_username,
          lastBody: m.body,
          lastAt: m.created_at,
          unread: existing?.unread || isUnread,
        });
      } else if (isUnread) {
        existing.unread = true;
      }
    }
    return Array.from(byOther.entries())
      .map(([otherId, v]) => ({ otherId, otherUsername: v.username, lastBody: v.lastBody, lastAt: v.lastAt, unread: v.unread }))
      .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  })();

  const threadMessages = activeConvo ? messages.filter((m) => m.other_id === activeConvo.otherId) : [];

  async function openConvo(c: Conversation) {
    setActiveConvo(c);
    try {
      await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherId: c.otherId }),
      });
      fetchMessages();
    } catch {
      // non-critical
    }
  }

  async function startNewChat() {
    setNewChatError(null);
    const uname = newChatUsername.trim().replace(/^@/, "");
    if (!uname) return setNewChatError("Enter a username.");

    setNewChatLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      const match = (data.users || []).find(
        (u: { username: string | null }) => u.username?.toLowerCase() === uname.toLowerCase()
      );
      if (!match) {
        setNewChatError("No account with that username.");
      } else {
        setActiveConvo({ otherId: match.id, otherUsername: match.username, lastBody: "", lastAt: new Date().toISOString(), unread: false });
        setNewChatOpen(false);
        setNewChatUsername("");
      }
    } catch {
      setNewChatError("Failed to look up user.");
    }
    setNewChatLoading(false);
  }

  async function sendReply() {
    if (!activeConvo || !reply.trim()) return;
    setSending(true);
    try {
      await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: activeConvo.otherId, body: reply.trim() }),
      });
      setReply("");
      fetchMessages();
    } catch {
      showToast("Failed to send reply.");
    }
    setSending(false);
  }

  async function deleteMessage(id: string) {
    if (!confirm("Permanently delete this message?")) return;
    setActionLoading(id);
    try {
      await fetch("/api/admin/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setMessages((m) => m.filter((x) => x.id !== id));
      showToast("✓ Message deleted.");
    } catch {
      showToast("Error deleting message.");
    }
    setActionLoading(null);
  }

  return (
    <div className="ad-wrap">
      <style>{css}</style>
      <div className="ad-box">
        <div className="ad-header">
          <div>
            <p style={{ margin: "0 0 2px", fontSize: "0.78rem", opacity: 0.45, letterSpacing: "0.08em" }}>greencat777@bio:~$</p>
            <span className="ad-title">// ADMIN DASHBOARD — MESSAGES</span>
          </div>
          <button className="ad-refresh" onClick={fetchMessages}>↺ refresh</button>
        </div>

        {!activeConvo ? (
          <>
            {!newChatOpen ? (
              <button className="ad-refresh" style={{ marginBottom: "1rem" }} onClick={() => setNewChatOpen(true)}>
                + Reach out to a user
              </button>
            ) : (
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input
                  className="ad-reply-input"
                  style={{ flex: 1 }}
                  type="text"
                  placeholder="username to message"
                  value={newChatUsername}
                  onChange={(e) => setNewChatUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startNewChat()}
                />
                <button className="ad-btn ad-btn-approve" onClick={startNewChat} disabled={newChatLoading}>
                  {newChatLoading ? "..." : "Go"}
                </button>
              </div>
            )}
            {newChatError && <p className="ad-msg-err" style={{ fontSize: "0.78rem", color: "#ff5555", marginBottom: "0.75rem" }}>⚠ {newChatError}</p>}

            <div className="ad-stats">
              <div className="ad-stat">
                <div className="ad-stat-val">{conversations.length}</div>
                <div className="ad-stat-label">CONVERSATIONS</div>
              </div>
              <div className="ad-stat">
                <div className="ad-stat-val">{conversations.filter((c) => c.unread).length}</div>
                <div className="ad-stat-label">UNREAD</div>
              </div>
            </div>

            <div className="ad-list">
              {loading ? (
                <p className="ad-empty"><span className="ad-spinner" />loading...</p>
              ) : conversations.length === 0 ? (
                <p className="ad-empty">No messages yet.</p>
              ) : (
                conversations.map((c) => (
                  <button key={c.otherId} className="ad-item" onClick={() => openConvo(c)}>
                    <div className="ad-row1">
                      <span className="ad-name">{c.otherUsername}</span>
                      <span className="ad-time">{timeAgo(c.lastAt)}</span>
                      {c.unread && <span className="ad-badge-confirmed">● unread</span>}
                    </div>
                    <p className="ad-body" style={{ marginBottom: 0 }}>{c.lastBody}</p>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="ad-row1" style={{ marginBottom: "1rem" }}>
              <button className="ad-back" onClick={() => setActiveConvo(null)} aria-label="Back">←</button>
              <span className="ad-name">{activeConvo.otherUsername}</span>
            </div>

            <div className="ad-thread-body">
              {threadMessages.map((m) => (
                <div key={m.id} className={`ad-msg ${m.from_admin ? "ad-msg-mine" : "ad-msg-theirs"}`}>
                  {m.body}
                  <div className="ad-msg-time" style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                    <span>{timeAgo(m.created_at)}</span>
                    <button
                      className="ad-btn ad-btn-delete"
                      style={{ padding: "0 6px", fontSize: "0.6rem" }}
                      onClick={() => deleteMessage(m.id)}
                      disabled={actionLoading === m.id}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="ad-reply-row">
              <textarea
                className="ad-reply-input"
                placeholder="reply as GreenCat..."
                rows={1}
                maxLength={2000}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
              />
              <button className="ad-btn ad-btn-approve" onClick={sendReply} disabled={sending || !reply.trim()}>
                {sending ? "..." : "→"}
              </button>
            </div>
          </>
        )}
      </div>
      {toast && <div className="ad-toast">{toast}</div>}
    </div>
  );
}

// ── COMMENTS PANEL ──────────────────────────────────────────────
type CommentRow = {
  id: string;
  username: string;
  body: string;
  created_at: string;
  user_id: string | null;
};

function CommentsPanel() {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const css = `
    .ad-wrap { font-family:monospace; color:#0ed145; }
    .ad-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(14,209,69,0.2); flex-wrap:wrap; gap:0.5rem; }
    .ad-title { font-size:1.1rem; font-weight:bold; letter-spacing:0.06em; }
    .ad-refresh { padding:4px 14px; border:1px solid rgba(14,209,69,0.4); border-radius:5px; background:transparent; color:rgba(14,209,69,0.6); font-family:monospace; font-size:0.78rem; cursor:pointer; transition:all 0.15s; }
    .ad-refresh:hover { border-color:#0ed145; color:#0ed145; }
    .ad-box { border:2px solid #0ed145; border-radius:12px; padding:1.5rem; background:rgba(0,0,0,0.5); box-shadow:0 0 24px rgba(14,209,69,0.25); }
    .ad-list { display:flex; flex-direction:column; gap:0.85rem; }
    .ad-empty { opacity:0.4; font-size:0.85rem; text-align:center; padding:2rem 0; }
    .ad-item { border:1px solid rgba(14,209,69,0.2); border-radius:8px; padding:1rem; background:rgba(14,209,69,0.02); }
    .ad-row1 { display:flex; align-items:baseline; gap:0.75rem; margin-bottom:6px; flex-wrap:wrap; }
    .ad-name { font-weight:bold; font-size:0.9rem; }
    .ad-time { font-size:0.7rem; opacity:0.4; }
    .ad-badge-confirmed { font-size:0.65rem; padding:1px 7px; border-radius:4px; border:1px solid rgba(14,209,69,0.5); color:rgba(14,209,69,0.7); font-weight:bold; }
    .ad-badge-unconfirmed { font-size:0.65rem; padding:1px 7px; border-radius:4px; border:1px solid rgba(14,209,69,0.2); color:rgba(14,209,69,0.35); }
    .ad-body { font-size:0.85rem; line-height:1.6; opacity:0.8; white-space:pre-wrap; word-break:break-word; margin:0 0 10px; }
    .ad-actions { display:flex; gap:0.4rem; flex-wrap:wrap; }
    .ad-btn { padding:4px 14px; border-radius:5px; font-family:monospace; font-size:0.78rem; font-weight:bold; cursor:pointer; transition:all 0.15s; border:1px solid; letter-spacing:0.04em; }
    .ad-btn:disabled { opacity:0.4; cursor:not-allowed; }
    .ad-btn-delete { border-color:rgba(255,85,85,0.4); color:rgba(255,85,85,0.7); background:transparent; }
    .ad-btn-delete:hover:not(:disabled) { background:rgba(255,85,85,0.15); border-color:#ff5555; color:#ff5555; }
    .ad-toast { position:fixed; bottom:24px; right:24px; background:#0ed145; color:#000; font-family:monospace; font-size:0.85rem; font-weight:bold; padding:10px 20px; border-radius:8px; box-shadow:0 0 20px rgba(14,209,69,0.5); z-index:9999; animation:ad-fadein 0.2s ease; }
    @keyframes ad-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .ad-spinner { display:inline-block; width:12px; height:12px; border:1px solid rgba(14,209,69,0.3); border-top-color:#0ed145; border-radius:50%; animation:ad-spin 0.7s linear infinite; margin-right:4px; vertical-align:middle; }
    @keyframes ad-spin { to{transform:rotate(360deg)} }
    .ad-stats { display:flex; gap:0.75rem; margin-bottom:1.25rem; flex-wrap:wrap; }
    .ad-stat { border:1px solid rgba(14,209,69,0.2); border-radius:6px; padding:8px 14px; background:rgba(14,209,69,0.03); }
    .ad-stat-val { font-size:1.4rem; font-weight:bold; line-height:1; }
    .ad-stat-label { font-size:0.68rem; opacity:0.4; margin-top:2px; letter-spacing:0.06em; }
  `;

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/comments");
      const data = await res.json();
      if (data.comments) setComments(data.comments);
    } catch {
      showToast("Failed to load comments.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function deleteComment(id: string) {
    if (!confirm("Permanently delete this comment?")) return;
    setActionLoading(id);
    try {
      await fetch("/api/admin/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setComments((c) => c.filter((x) => x.id !== id));
      showToast("✓ Comment deleted.");
    } catch {
      showToast("Error deleting comment.");
    }
    setActionLoading(null);
  }

  return (
    <div className="ad-wrap">
      <style>{css}</style>
      <div className="ad-box">
        <div className="ad-header">
          <div>
            <p style={{ margin: "0 0 2px", fontSize: "0.78rem", opacity: 0.45, letterSpacing: "0.08em" }}>greencat777@bio:~$</p>
            <span className="ad-title">// ADMIN DASHBOARD — COMMENTS</span>
          </div>
          <button className="ad-refresh" onClick={fetchComments}>↺ refresh</button>
        </div>

        <div className="ad-stats">
          <div className="ad-stat">
            <div className="ad-stat-val">{comments.length}</div>
            <div className="ad-stat-label">TOTAL COMMENTS</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat-val">{comments.filter((c) => c.user_id).length}</div>
            <div className="ad-stat-label">FROM ACCOUNTS</div>
          </div>
        </div>

        <div className="ad-list">
          {loading ? (
            <p className="ad-empty"><span className="ad-spinner" />loading...</p>
          ) : comments.length === 0 ? (
            <p className="ad-empty">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="ad-item">
                <div className="ad-row1">
                  <span className="ad-name">{c.username}</span>
                  <span className="ad-time">{timeAgo(c.created_at)}</span>
                  {c.user_id
                    ? <span className="ad-badge-confirmed">✓ verified</span>
                    : <span className="ad-badge-unconfirmed">guest</span>}
                </div>
                <p className="ad-body">{c.body}</p>
                <div className="ad-actions">
                  <button
                    className="ad-btn ad-btn-delete"
                    onClick={() => deleteComment(c.id)}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === c.id ? <><span className="ad-spinner" />deleting...</> : "✕ Delete"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {toast && <div className="ad-toast">{toast}</div>}
    </div>
  );
}

// ── KOFI WALL PANEL ───────────────────────────────────────────────
type KofiEntry = {
  id: string;
  name: string;
  kofi_url: string;
  description: string;
  avatar_url: string | null;
  email: string | null;
  admin_approved: boolean;
  added_by_admin: boolean;
  created_at: string;
};

const KW_MAX_AVATAR_DIM = 256;

function kwResizeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Not an image."));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("Image too large (max 8MB)."));

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = KW_MAX_AVATAR_DIM;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unsupported."));
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Couldn't read image."));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Couldn't read file."));
    reader.readAsDataURL(file);
  });
}

function KwAvatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #0ed145", boxShadow: "0 0 10px rgba(14,209,69,0.3)", flexShrink: 0 }} />;
  }
  return (
    <div style={{
      width: 44, height: 44, borderRadius: "50%",
      border: "2px solid #0ed145", background: "rgba(14,209,69,0.08)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace", fontWeight: "bold", fontSize: 17,
      color: "#0ed145", flexShrink: 0, boxShadow: "0 0 10px rgba(14,209,69,0.3)",
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

type KwDraft = { name: string; kofi_url: string; description: string; avatar_base64?: string; avatar_preview?: string };

function KofiWallPanel() {
  const [entries, setEntries] = useState<KofiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<KwDraft>({ name: "", kofi_url: "", description: "" });
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<KwDraft>({ name: "", kofi_url: "", description: "" });
  const [editError, setEditError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/kofi-wall");
      const data = await res.json();
      if (data.entries) setEntries(data.entries);
    } catch {
      showToast("Failed to load entries.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function approve(id: string) {
    setActionLoading(id + "-approve");
    try {
      await fetch("/api/admin/kofi-wall", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, admin_approved: true }),
      });
      setEntries((v) => v.map((x) => x.id === id ? { ...x, admin_approved: true } : x));
      showToast("✓ Entry approved and published.");
    } catch { showToast("Error approving entry."); }
    setActionLoading(null);
  }

  async function reject(id: string) {
    setActionLoading(id + "-reject");
    try {
      await fetch("/api/admin/kofi-wall", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, admin_approved: false }),
      });
      setEntries((v) => v.map((x) => x.id === id ? { ...x, admin_approved: false } : x));
      showToast("Entry unpublished.");
    } catch { showToast("Error."); }
    setActionLoading(null);
  }

  async function deleteEntry(id: string) {
    if (!confirm("Permanently delete this entry?")) return;
    setActionLoading(id + "-delete");
    try {
      await fetch("/api/admin/kofi-wall", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setEntries((v) => v.filter((x) => x.id !== id));
      showToast("Entry deleted.");
    } catch { showToast("Error deleting."); }
    setActionLoading(null);
  }

  function startEdit(entry: KofiEntry) {
    setEditingId(entry.id);
    setEditError(null);
    setEditDraft({ name: entry.name, kofi_url: entry.kofi_url, description: entry.description, avatar_preview: entry.avatar_url ?? undefined });
  }

  async function handleEditAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await kwResizeImageToBase64(file);
      setEditDraft((d) => ({ ...d, avatar_base64: b64, avatar_preview: b64 }));
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Couldn't process image.");
    }
  }

  async function saveEdit(id: string) {
    setEditError(null);
    if (!editDraft.name.trim() || !editDraft.kofi_url.trim() || !editDraft.description.trim()) {
      return setEditError("All fields are required.");
    }
    setActionLoading(id + "-edit");
    try {
      const res = await fetch("/api/admin/kofi-wall", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editDraft.name.trim(),
          kofi_url: editDraft.kofi_url.trim(),
          description: editDraft.description.trim(),
          avatar_base64: editDraft.avatar_base64,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to save.");
      } else {
        setEntries((v) => v.map((x) => x.id === id ? {
          ...x,
          name: editDraft.name.trim(),
          kofi_url: editDraft.kofi_url.trim(),
          description: editDraft.description.trim(),
          avatar_url: editDraft.avatar_base64 ? (editDraft.avatar_preview ?? x.avatar_url) : x.avatar_url,
        } : x));
        setEditingId(null);
        showToast("✓ Entry updated.");
        fetchEntries(); // pick up the real uploaded avatar_url
      }
    } catch {
      setEditError("Network error.");
    }
    setActionLoading(null);
  }

  async function handleAddAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await kwResizeImageToBase64(file);
      setAddDraft((d) => ({ ...d, avatar_base64: b64, avatar_preview: b64 }));
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Couldn't process image.");
    }
  }

  async function submitAdd() {
    setAddError(null);
    if (!addDraft.name.trim() || !addDraft.kofi_url.trim() || !addDraft.description.trim()) {
      return setAddError("All fields are required.");
    }
    setActionLoading("add-new");
    try {
      const res = await fetch("/api/admin/kofi-wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addDraft.name.trim(),
          kofi_url: addDraft.kofi_url.trim(),
          description: addDraft.description.trim(),
          avatar_base64: addDraft.avatar_base64,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Failed to add entry.");
      } else {
        setAddDraft({ name: "", kofi_url: "", description: "" });
        setAddOpen(false);
        showToast("✓ Entry added and published.");
        fetchEntries();
      }
    } catch {
      setAddError("Network error.");
    }
    setActionLoading(null);
  }

  const filtered = entries.filter((e) => {
    if (filter === "pending") return !e.admin_approved;
    if (filter === "approved") return e.admin_approved;
    return true;
  });

  const counts = {
    all: entries.length,
    pending: entries.filter((e) => !e.admin_approved).length,
    approved: entries.filter((e) => e.admin_approved).length,
  };

  const css = `
    .ad-wrap { font-family:monospace; color:#0ed145; }
    .ad-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(14,209,69,0.2); flex-wrap:wrap; gap:0.5rem; }
    .ad-title { font-size:1.1rem; font-weight:bold; letter-spacing:0.06em; }
    .ad-refresh { padding:4px 14px; border:1px solid rgba(14,209,69,0.4); border-radius:5px; background:transparent; color:rgba(14,209,69,0.6); font-family:monospace; font-size:0.78rem; cursor:pointer; transition:all 0.15s; }
    .ad-refresh:hover { border-color:#0ed145; color:#0ed145; }
    .ad-box { border:2px solid #0ed145; border-radius:12px; padding:1.5rem; background:rgba(0,0,0,0.5); box-shadow:0 0 24px rgba(14,209,69,0.25); }
    .ad-tabs { display:flex; gap:0.4rem; margin-bottom:1.25rem; }
    .ad-tab { padding:5px 16px; border:1px solid rgba(14,209,69,0.3); border-radius:5px; background:transparent; color:rgba(14,209,69,0.5); font-family:monospace; font-size:0.8rem; cursor:pointer; transition:all 0.15s; }
    .ad-tab:hover { border-color:#0ed145; color:#0ed145; }
    .ad-tab-active { border-color:#0ed145; color:#000; background:#0ed145; }
    .ad-badge { display:inline-block; margin-left:4px; background:rgba(14,209,69,0.15); border-radius:3px; padding:0 5px; font-size:0.7rem; }
    .ad-tab-active .ad-badge { background:rgba(0,0,0,0.25); color:#000; }
    .ad-list { display:flex; flex-direction:column; gap:0.85rem; }
    .ad-empty { opacity:0.4; font-size:0.85rem; text-align:center; padding:2rem 0; }
    .ad-item { border:1px solid rgba(14,209,69,0.2); border-radius:8px; padding:1rem; background:rgba(14,209,69,0.02); }
    .ad-item-approved { border-color:rgba(14,209,69,0.4); background:rgba(14,209,69,0.04); }
    .ad-row1 { display:flex; align-items:center; gap:0.75rem; margin-bottom:6px; flex-wrap:wrap; }
    .ad-name { font-weight:bold; font-size:0.9rem; }
    .ad-time { font-size:0.7rem; opacity:0.4; }
    .ad-badge-confirmed { font-size:0.65rem; padding:1px 7px; border-radius:4px; border:1px solid rgba(14,209,69,0.5); color:rgba(14,209,69,0.7); font-weight:bold; }
    .ad-badge-unconfirmed { font-size:0.65rem; padding:1px 7px; border-radius:4px; border:1px solid rgba(14,209,69,0.2); color:rgba(14,209,69,0.35); }
    .ad-badge-live { font-size:0.65rem; padding:1px 7px; border-radius:4px; border:1px solid #0ed145; color:#0ed145; font-weight:bold; }
    .ad-body { font-size:0.85rem; line-height:1.6; opacity:0.8; white-space:pre-wrap; word-break:break-word; margin:0 0 10px; }
    .ad-actions { display:flex; gap:0.4rem; flex-wrap:wrap; }
    .ad-btn { padding:4px 14px; border-radius:5px; font-family:monospace; font-size:0.78rem; font-weight:bold; cursor:pointer; transition:all 0.15s; border:1px solid; letter-spacing:0.04em; }
    .ad-btn:disabled { opacity:0.4; cursor:not-allowed; }
    .ad-btn-approve { border-color:rgba(14,209,69,0.5); color:rgba(14,209,69,0.8); background:transparent; }
    .ad-btn-approve:hover:not(:disabled) { background:#0ed145; color:#000; border-color:#0ed145; }
    .ad-btn-unapprove { border-color:rgba(255,200,0,0.5); color:rgba(255,200,0,0.8); background:transparent; }
    .ad-btn-unapprove:hover:not(:disabled) { background:rgba(255,200,0,0.2); }
    .ad-btn-delete { border-color:rgba(255,85,85,0.4); color:rgba(255,85,85,0.7); background:transparent; }
    .ad-btn-delete:hover:not(:disabled) { background:rgba(255,85,85,0.15); border-color:#ff5555; color:#ff5555; }
    .ad-btn-edit { border-color:rgba(14,209,69,0.3); color:rgba(14,209,69,0.6); background:transparent; }
    .ad-btn-edit:hover:not(:disabled) { border-color:#0ed145; color:#0ed145; }
    .ad-toast { position:fixed; bottom:24px; right:24px; background:#0ed145; color:#000; font-family:monospace; font-size:0.85rem; font-weight:bold; padding:10px 20px; border-radius:8px; box-shadow:0 0 20px rgba(14,209,69,0.5); z-index:9999; animation:ad-fadein 0.2s ease; }
    @keyframes ad-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .ad-spinner { display:inline-block; width:12px; height:12px; border:1px solid rgba(14,209,69,0.3); border-top-color:#0ed145; border-radius:50%; animation:ad-spin 0.7s linear infinite; margin-right:4px; vertical-align:middle; }
    @keyframes ad-spin { to{transform:rotate(360deg)} }
    .ad-stats { display:flex; gap:0.75rem; margin-bottom:1.25rem; flex-wrap:wrap; }
    .ad-stat { border:1px solid rgba(14,209,69,0.2); border-radius:6px; padding:8px 14px; background:rgba(14,209,69,0.03); }
    .ad-stat-val { font-size:1.4rem; font-weight:bold; line-height:1; }
    .ad-stat-label { font-size:0.68rem; opacity:0.4; margin-top:2px; letter-spacing:0.06em; }
    .kw-add-toggle { padding:5px 16px; border:1px dashed rgba(14,209,69,0.4); border-radius:6px; background:transparent; color:rgba(14,209,69,0.7); font-family:monospace; font-size:0.8rem; cursor:pointer; margin-bottom:1.25rem; transition:all 0.15s; }
    .kw-add-toggle:hover { border-color:#0ed145; color:#0ed145; }
    .kw-add-box { border:1px solid rgba(14,209,69,0.3); border-radius:8px; padding:1rem; margin-bottom:1.25rem; background:rgba(14,209,69,0.03); display:flex; flex-direction:column; gap:0.6rem; }
    .kw-field-input { width:100%; background:transparent; border:1px solid rgba(14,209,69,0.35); border-radius:6px; padding:0.5rem 0.75rem; color:#0ed145; font-family:monospace; font-size:0.85rem; outline:none; box-sizing:border-box; }
    .kw-field-input:focus { border-color:#0ed145; box-shadow:0 0 8px rgba(14,209,69,0.25); }
    .kw-field-textarea { width:100%; background:transparent; border:1px solid rgba(14,209,69,0.35); border-radius:6px; padding:0.5rem 0.75rem; color:#0ed145; font-family:monospace; font-size:0.85rem; outline:none; resize:vertical; min-height:60px; box-sizing:border-box; }
    .kw-field-textarea:focus { border-color:#0ed145; box-shadow:0 0 8px rgba(14,209,69,0.25); }
    .kw-avatar-row { display:flex; align-items:center; gap:0.75rem; }
    .kw-file-btn { padding:0.35rem 0.9rem; border:1px solid rgba(14,209,69,0.4); border-radius:6px; background:transparent; color:rgba(14,209,69,0.8); font-family:monospace; font-size:0.75rem; cursor:pointer; transition:all 0.15s; }
    .kw-file-btn:hover { border-color:#0ed145; color:#0ed145; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="ad-wrap">
        <div className="ad-box">
          <div className="ad-header">
            <div>
              <p style={{ margin: "0 0 2px", fontSize: "0.78rem", opacity: 0.45, letterSpacing: "0.08em" }}>greencat777@bio:~$</p>
              <span className="ad-title">// ADMIN DASHBOARD — KO-FI WALL</span>
            </div>
            <button className="ad-refresh" onClick={fetchEntries}>↺ refresh</button>
          </div>

          <div className="ad-stats">
            <div className="ad-stat"><div className="ad-stat-val">{counts.all}</div><div className="ad-stat-label">TOTAL</div></div>
            <div className="ad-stat"><div className="ad-stat-val">{counts.pending}</div><div className="ad-stat-label">PENDING</div></div>
            <div className="ad-stat"><div className="ad-stat-val">{counts.approved}</div><div className="ad-stat-label">APPROVED</div></div>
          </div>

          {!addOpen ? (
            <button className="kw-add-toggle" onClick={() => setAddOpen(true)}>+ add entry directly (auto-published)</button>
          ) : (
            <div className="kw-add-box">
              <div className="kw-avatar-row">
                <KwAvatar name={addDraft.name || "?"} url={addDraft.avatar_preview ?? null} />
                <label className="kw-file-btn">
                  upload photo
                  <input type="file" accept="image/*" onChange={handleAddAvatar} style={{ display: "none" }} />
                </label>
              </div>
              <input className="kw-field-input" placeholder="name" value={addDraft.name} onChange={(e) => setAddDraft((d) => ({ ...d, name: e.target.value }))} />
              <input className="kw-field-input" placeholder="ko-fi link (https://ko-fi.com/...)" value={addDraft.kofi_url} onChange={(e) => setAddDraft((d) => ({ ...d, kofi_url: e.target.value }))} />
              <textarea className="kw-field-textarea" rows={2} placeholder="description" value={addDraft.description} onChange={(e) => setAddDraft((d) => ({ ...d, description: e.target.value }))} />
              {addError && <p className="ad-note-dirty" style={{ color: "#ff5555" }}>⚠ {addError}</p>}
              <div className="ad-actions">
                <button className="ad-btn ad-btn-approve" onClick={submitAdd} disabled={actionLoading === "add-new"}>
                  {actionLoading === "add-new" ? <><span className="ad-spinner" />adding...</> : "✓ Publish entry"}
                </button>
                <button className="ad-btn ad-btn-edit" onClick={() => { setAddOpen(false); setAddError(null); }}>cancel</button>
              </div>
            </div>
          )}

          <div className="ad-tabs">
            {(["pending", "approved", "all"] as const).map((tab) => (
              <button key={tab} className={`ad-tab${filter === tab ? " ad-tab-active" : ""}`} onClick={() => setFilter(tab)}>
                {tab.toUpperCase()}
                <span className="ad-badge">{counts[tab]}</span>
              </button>
            ))}
          </div>

          <div className="ad-list">
            {loading ? (
              <p className="ad-empty"><span className="ad-spinner" />loading...</p>
            ) : filtered.length === 0 ? (
              <p className="ad-empty">No {filter === "all" ? "" : filter} entries.</p>
            ) : (
              filtered.map((entry) => (
                <div key={entry.id} className={`ad-item${entry.admin_approved ? " ad-item-approved" : ""}`}>
                  {editingId === entry.id ? (
                    <>
                      <div className="kw-avatar-row" style={{ marginBottom: 8 }}>
                        <KwAvatar name={editDraft.name || "?"} url={editDraft.avatar_preview ?? null} />
                        <label className="kw-file-btn">
                          change photo
                          <input type="file" accept="image/*" onChange={handleEditAvatar} style={{ display: "none" }} />
                        </label>
                      </div>
                      <input className="kw-field-input" style={{ marginBottom: 6 }} value={editDraft.name} onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))} />
                      <input className="kw-field-input" style={{ marginBottom: 6 }} value={editDraft.kofi_url} onChange={(e) => setEditDraft((d) => ({ ...d, kofi_url: e.target.value }))} />
                      <textarea className="kw-field-textarea" style={{ marginBottom: 6 }} rows={2} value={editDraft.description} onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))} />
                      {editError && <p style={{ color: "#ff5555", fontSize: "0.75rem", margin: "0 0 6px" }}>⚠ {editError}</p>}
                      <div className="ad-actions">
                        <button className="ad-btn ad-btn-approve" onClick={() => saveEdit(entry.id)} disabled={!!actionLoading}>
                          {actionLoading === entry.id + "-edit" ? <><span className="ad-spinner" />saving...</> : "💾 Save"}
                        </button>
                        <button className="ad-btn ad-btn-edit" onClick={() => setEditingId(null)} disabled={!!actionLoading}>cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="ad-row1">
                        <KwAvatar name={entry.name} url={entry.avatar_url} />
                        <span className="ad-name">{entry.name}</span>
                        <span className="ad-time">{timeAgo(entry.created_at)}</span>
                        {entry.admin_approved && <span className="ad-badge-live">● LIVE</span>}
                        {entry.added_by_admin
                          ? <span className="ad-badge-confirmed">added by admin</span>
                          : <span className="ad-badge-unconfirmed">public submission</span>}
                      </div>
                      <div style={{ fontSize: "0.75rem", opacity: 0.5, margin: "0 0 6px" }}>
                        ☕ <a href={entry.kofi_url} target="_blank" rel="noopener noreferrer" style={{ color: "#0ed145" }}>{entry.kofi_url}</a>
                      </div>
                      {entry.email && <div style={{ fontSize: "0.75rem", opacity: 0.4, marginBottom: "8px" }}>✉ {entry.email}</div>}
                      <p className="ad-body">{entry.description}</p>
                      <div className="ad-actions">
                        {!entry.admin_approved ? (
                          <button className="ad-btn ad-btn-approve" onClick={() => approve(entry.id)} disabled={!!actionLoading}>
                            {actionLoading === entry.id + "-approve" ? <><span className="ad-spinner" />approving...</> : "✓ Approve"}
                          </button>
                        ) : (
                          <button className="ad-btn ad-btn-unapprove" onClick={() => reject(entry.id)} disabled={!!actionLoading}>
                            {actionLoading === entry.id + "-reject" ? <><span className="ad-spinner" />saving...</> : "⊘ Unpublish"}
                          </button>
                        )}
                        <button className="ad-btn ad-btn-edit" onClick={() => startEdit(entry)} disabled={!!actionLoading}>✎ Edit</button>
                        <button className="ad-btn ad-btn-delete" onClick={() => deleteEntry(entry.id)} disabled={!!actionLoading}>
                          {actionLoading === entry.id + "-delete" ? <><span className="ad-spinner" />deleting...</> : "✕ Delete"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {toast && <div className="ad-toast">{toast}</div>}
    </>
  );
}

// ── ADMIN SHELL (section tabs) ───────────────────────────────────
type Section = "vouches" | "kofiWall" | "accounts" | "messages" | "comments";

function AdminShell() {
  const [section, setSection] = useState<Section>("vouches");

  const shellCss = `
    .ash-tabs { display:flex; gap:0.5rem; margin-bottom:1rem; font-family:monospace; flex-wrap:wrap; }
    .ash-tab { padding:6px 18px; border:1px solid rgba(14,209,69,0.35); border-radius:6px; background:transparent; color:rgba(14,209,69,0.55); font-family:monospace; font-size:0.82rem; font-weight:bold; cursor:pointer; letter-spacing:0.05em; transition:all 0.15s; }
    .ash-tab:hover { border-color:#0ed145; color:#0ed145; }
    .ash-tab-active { border-color:#0ed145; background:#0ed145; color:#000; }
  `;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <style>{shellCss}</style>
      <div className="ash-tabs">
        <button className={`ash-tab${section === "vouches" ? " ash-tab-active" : ""}`} onClick={() => setSection("vouches")}>
          VOUCHES
        </button>
        <button className={`ash-tab${section === "kofiWall" ? " ash-tab-active" : ""}`} onClick={() => setSection("kofiWall")}>
          KO-FI WALL
        </button>
        <button className={`ash-tab${section === "accounts" ? " ash-tab-active" : ""}`} onClick={() => setSection("accounts")}>
          ACCOUNTS
        </button>
        <button className={`ash-tab${section === "messages" ? " ash-tab-active" : ""}`} onClick={() => setSection("messages")}>
          MESSAGES
        </button>
        <button className={`ash-tab${section === "comments" ? " ash-tab-active" : ""}`} onClick={() => setSection("comments")}>
          COMMENTS
        </button>
      </div>
      {section === "vouches" && <Dashboard />}
      {section === "kofiWall" && <KofiWallPanel />}
      {section === "accounts" && <AccountsPanel />}
      {section === "messages" && <MessagesPanel />}
      {section === "comments" && <CommentsPanel />}
    </div>
  );
}

// ── MAIN EXPORT ─────────────────────────────────────────────────
export default function AdminClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  // Check if already authed via session cookie
  useEffect(() => {
    fetch("/api/admin/vouches")
      .then((r) => {
        setAuthed(r.ok);
      })
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <div style={{ fontFamily: "monospace", color: "#0ed145", textAlign: "center", padding: "2rem", opacity: 0.5 }}>
        loading...
      </div>
    );
  }

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  return <AdminShell />;
}
