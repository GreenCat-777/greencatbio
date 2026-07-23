"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Vouch = {
  id: string;
  name: string;
  body: string;
  user_confirmed: boolean;
  admin_note: string | null;
  created_at: string;
};

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

function Avatar({ name }: { name: string }) {
  return (
    <div style={{
      width: 38, height: 38, borderRadius: "50%",
      border: "2px solid #0ed145", background: "rgba(14,209,69,0.08)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace", fontWeight: "bold", fontSize: 15,
      color: "#0ed145", flexShrink: 0, boxShadow: "0 0 10px rgba(14,209,69,0.3)",
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function VouchesClient() {
  const [vouches, setVouches] = useState<Vouch[]>([]);
  const [fetching, setFetching] = useState(true);

  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { fetchVouches(); }, []);

  async function fetchVouches() {
    setFetching(true);
    const { data } = await supabase
      .from("vouches")
      .select("id, name, body, user_confirmed, admin_note, created_at")
      .eq("admin_approved", true)
      .order("created_at", { ascending: false });
    if (data) setVouches(data);
    setFetching(false);
  }

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) return setError("Name is required.");
    if (!body.trim()) return setError("Vouch body is required.");
    if (!email.trim()) return setError("Email is required (kept private).");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Invalid email.");
    if (body.length > 1000) return setError("Too long (max 1000 chars).");

    setLoading(true);
    try {
      const res = await fetch("/api/vouches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), body: body.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed.");
      } else {
        setSubmitted(true);
        setName(""); setBody(""); setEmail("");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  const css = `
    .vc-wrap { font-family: monospace; color: #0ed145; }
    .vc-header { display:flex; align-items:center; gap:0.5rem; margin-bottom:1.25rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(14,209,69,0.2); }
    .vc-dot { width:8px; height:8px; border-radius:50%; background:#0ed145; box-shadow:0 0 6px #0ed145; }
    .vc-title { font-size:0.95rem; font-weight:bold; letter-spacing:0.08em; opacity:0.9; }
    .vc-count { margin-left:auto; font-size:0.75rem; opacity:0.45; }
    .vc-box { border:2px solid #0ed145; border-radius:12px; padding:1.5rem; background:rgba(0,0,0,0.5); box-shadow:0 0 24px rgba(14,209,69,0.25); }
    .vc-section-label { font-size:0.75rem; opacity:0.4; letter-spacing:0.1em; margin-bottom:0.75rem; }
    .vc-form { background:rgba(14,209,69,0.03); border:1px solid rgba(14,209,69,0.2); border-radius:8px; padding:1.25rem; margin-bottom:1.5rem; display:flex; flex-direction:column; gap:0.65rem; }
    .vc-input { width:100%; background:transparent; border:1px solid rgba(14,209,69,0.35); border-radius:6px; padding:0.5rem 0.75rem; color:#0ed145; font-family:monospace; font-size:0.875rem; outline:none; box-sizing:border-box; transition:border-color 0.15s, box-shadow 0.15s; }
    .vc-input:focus { border-color:#0ed145; box-shadow:0 0 8px rgba(14,209,69,0.25); }
    .vc-input::placeholder { color:rgba(14,209,69,0.35); }
    .vc-textarea { width:100%; background:transparent; border:1px solid rgba(14,209,69,0.35); border-radius:6px; padding:0.5rem 0.75rem; color:#0ed145; font-family:monospace; font-size:0.875rem; outline:none; resize:vertical; min-height:90px; box-sizing:border-box; transition:border-color 0.15s, box-shadow 0.15s; }
    .vc-textarea:focus { border-color:#0ed145; box-shadow:0 0 8px rgba(14,209,69,0.25); }
    .vc-textarea::placeholder { color:rgba(14,209,69,0.35); }
    .vc-hint { font-size:0.7rem; opacity:0.35; display:flex; align-items:center; gap:0.3rem; }
    .vc-char { font-size:0.7rem; opacity:0.35; text-align:right; margin-top:-4px; }
    .vc-footer { display:flex; align-items:center; justify-content:space-between; }
    .vc-error { font-size:0.78rem; color:#ff5555; }
    .vc-btn { padding:0.5rem 1.5rem; border:2px solid #0ed145; border-radius:6px; background:transparent; color:#0ed145; font-family:monospace; font-size:0.875rem; font-weight:bold; cursor:pointer; letter-spacing:0.05em; transition:background 0.15s, color 0.15s; white-space:nowrap; }
    .vc-btn:hover:not(:disabled) { background:#0ed145; color:black; }
    .vc-btn:disabled { opacity:0.45; cursor:not-allowed; }
    .vc-success-box { background:rgba(14,209,69,0.05); border:1px solid rgba(14,209,69,0.3); border-radius:8px; padding:1.25rem 1.5rem; margin-bottom:1.5rem; }
    .vc-success-title { font-size:1rem; font-weight:bold; color:#0ed145; margin:0 0 6px; }
    .vc-success-sub { font-size:0.82rem; color:rgba(14,209,69,0.6); margin:0; line-height:1.6; }
    .vc-list { display:flex; flex-direction:column; gap:0.85rem; }
    .vc-empty { opacity:0.4; font-size:0.85rem; text-align:center; padding:2rem 0; }
    .vc-item { display:flex; gap:0.85rem; align-items:flex-start; padding:0.9rem 1rem; border:1px solid rgba(14,209,69,0.15); border-radius:8px; background:rgba(14,209,69,0.02); transition:border-color 0.15s; }
    .vc-item:hover { border-color:rgba(14,209,69,0.3); }
    .vc-item-body { flex:1; min-width:0; }
    .vc-meta { display:flex; align-items:baseline; gap:0.5rem; margin-bottom:0.35rem; flex-wrap:wrap; }
    .vc-uname { font-weight:bold; font-size:0.88rem; }
    .vc-time { font-size:0.7rem; opacity:0.4; }
    .vc-badge { font-size:0.65rem; padding:1px 7px; border-radius:4px; font-weight:bold; letter-spacing:0.05em; }
    .vc-badge-confirmed { border:1px solid rgba(14,209,69,0.5); color:rgba(14,209,69,0.7); }
    .vc-badge-unconfirmed { border:1px solid rgba(14,209,69,0.2); color:rgba(14,209,69,0.35); }
    .vc-body { font-size:0.88rem; line-height:1.6; opacity:0.88; white-space:pre-wrap; word-break:break-word; margin:0; }
    .vc-note { font-size:0.78rem; font-style:italic; opacity:0.65; white-space:pre-wrap; word-break:break-word; margin:8px 0 0; padding-top:6px; border-top:1px dashed rgba(14,209,69,0.2); }
    .vc-divider { border:none; border-top:1px solid rgba(14,209,69,0.15); margin:1.25rem 0; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="vc-wrap">
        <div className="vc-box">
          {/* Header */}
          <div className="vc-header">
            <span className="vc-dot" />
            <span className="vc-title">// VOUCHES</span>
            <span className="vc-count">
              {fetching ? "..." : `${vouches.length} vouch${vouches.length !== 1 ? "es" : ""}`}
            </span>
            <a href="/" style={{marginLeft:"auto", fontSize:"0.78rem", color:"rgba(14,209,69,0.6)", textDecoration:"none", border:"1px solid rgba(14,209,69,0.3)", borderRadius:"5px", padding:"3px 12px", transition:"all 0.15s"}}
              onMouseOver={e => { (e.target as HTMLElement).style.color="#0ed145"; (e.target as HTMLElement).style.borderColor="#0ed145"; }}
              onMouseOut={e => { (e.target as HTMLElement).style.color="rgba(14,209,69,0.6)"; (e.target as HTMLElement).style.borderColor="rgba(14,209,69,0.3)"; }}>
              ← home
            </a>
          </div>

          {/* Submit form or success state */}
          {submitted ? (
            <div className="vc-success-box">
              <p className="vc-success-title">✓ Vouch submitted!</p>
              <p className="vc-success-sub">
                Check your inbox — we sent you a confirmation email.<br />
                Your vouch will appear here once you confirm it and it&apos;s reviewed.
              </p>
            </div>
          ) : (
            <div className="vc-form">
              <p className="vc-section-label">// LEAVE A VOUCH</p>
              <input
                className="vc-input"
                type="text"
                placeholder="your name"
                maxLength={64}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <textarea
                className="vc-textarea"
                placeholder="what did greencat do for you? (max 1000 chars)"
                maxLength={1000}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <p className="vc-char">{body.length}/1000</p>
              <input
                className="vc-input"
                type="email"
                placeholder="your email (private, for confirmation only)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span className="vc-hint">🔒 email is never shown publicly</span>
              <div className="vc-footer">
                <span>
                  {error && <span className="vc-error">⚠ {error}</span>}
                </span>
                <button
                  className="vc-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "sending..." : "→ submit vouch"}
                </button>
              </div>
            </div>
          )}

          <hr className="vc-divider" />

          {/* Vouch list */}
          <div className="vc-list">
            {fetching ? (
              <p className="vc-empty">loading vouches...</p>
            ) : vouches.length === 0 ? (
              <p className="vc-empty">no approved vouches yet — be the first.</p>
            ) : (
              vouches.map((v) => (
                <div key={v.id} className="vc-item">
                  <Avatar name={v.name} />
                  <div className="vc-item-body">
                    <div className="vc-meta">
                      <span className="vc-uname">{v.name}</span>
                      <span className="vc-time">{timeAgo(v.created_at)}</span>
                      {v.user_confirmed ? (
                        <span className="vc-badge vc-badge-confirmed">✓ Confirmed Vouch</span>
                      ) : (
                        <span className="vc-badge vc-badge-unconfirmed">Unconfirmed Vouch</span>
                      )}
                    </div>
                    <p className="vc-body">{v.body}</p>
                    {v.admin_note && (
                      <p className="vc-note">Note From GreenCat: {v.admin_note}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}