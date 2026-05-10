"use client";

import { useState, useEffect, useCallback } from "react";

type Vouch = {
  id: string;
  name: string;
  body: string;
  email: string;
  user_confirmed: boolean;
  admin_approved: boolean;
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

  return <Dashboard />;
}
