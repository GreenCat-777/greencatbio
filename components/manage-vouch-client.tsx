"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Action = "delete" | "export" | "edit";

type VouchData = {
  name: string;
  body: string;
  email: string;
  admin_approved: boolean;
  user_confirmed: boolean;
  admin_note: string | null;
  created_at: string;
};

type State = "loading" | "ready" | "error" | "done";

export default function ManageVouchClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<State>("loading");
  const [action, setAction] = useState<Action | null>(null);
  const [vouch, setVouch] = useState<VouchData | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [doneMsg, setDoneMsg] = useState("");

  const [editName, setEditName] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrMsg("No link token found.");
      return;
    }
    fetch(`/api/vouches/manage?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setAction(data.action);
          setVouch(data.vouch);
          setEditName(data.vouch.name);
          setEditBody(data.vouch.body);
          setEditEmail(data.vouch.email);
          setState("ready");
        } else {
          setErrMsg(data.error || "Invalid or expired link.");
          setState("error");
        }
      })
      .catch(() => {
        setErrMsg("Network error. Please try again.");
        setState("error");
      });
  }, [token]);

  async function saveEdit() {
    setSaveErr(null);
    if (!editName.trim()) return setSaveErr("Name is required.");
    if (!editBody.trim()) return setSaveErr("Vouch body is required.");
    if (!editEmail.trim()) return setSaveErr("Email is required.");
    if (editBody.length > 1000) return setSaveErr("Too long (max 1000 chars).");

    setSaving(true);
    try {
      const res = await fetch("/api/vouches/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: editName.trim(),
          body: editBody.trim(),
          email: editEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveErr(data.error || "Failed to save changes.");
      } else {
        setDoneMsg("✓ Saved. Your vouch is back in the review queue.");
        setState("done");
      }
    } catch {
      setSaveErr("Network error. Please try again.");
    }
    setSaving(false);
  }

  async function performDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/vouches/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrMsg(data.error || "Failed to delete.");
        setState("error");
      } else {
        setDoneMsg("✓ Your vouch and all associated info have been permanently deleted.");
        setState("done");
      }
    } catch {
      setErrMsg("Network error. Please try again.");
      setState("error");
    }
    setDeleting(false);
  }

  const css = `
    .mv-wrap { font-family:monospace; color:#0ed145; }
    .mv-box { border:2px solid #0ed145; border-radius:12px; padding:2rem 2.5rem; background:rgba(0,0,0,0.5); box-shadow:0 0 30px rgba(14,209,69,0.3); max-width:480px; margin:0 auto; }
    .mv-prompt { font-size:0.85rem; opacity:0.5; margin:0 0 8px; letter-spacing:0.08em; text-align:center; }
    .mv-title { font-size:1.4rem; font-weight:bold; color:#0ed145; margin:0 0 12px; text-shadow:0 0 12px rgba(14,209,69,0.5); text-align:center; }
    .mv-sub { font-size:0.88rem; color:rgba(14,209,69,0.65); line-height:1.7; margin:0 0 20px; text-align:center; }
    .mv-error { color:#ff5555; }
    .mv-spinner { width:32px; height:32px; border:2px solid rgba(14,209,69,0.2); border-top-color:#0ed145; border-radius:50%; animation:mv-spin 0.8s linear infinite; margin:0 auto 20px; }
    @keyframes mv-spin { to { transform:rotate(360deg); } }
    .mv-btn { display:inline-block; padding:10px 24px; border:2px solid #0ed145; border-radius:8px; color:#0ed145; text-decoration:none; font-family:monospace; font-size:0.85rem; font-weight:bold; letter-spacing:0.05em; transition:background 0.15s, color 0.15s; box-shadow:0 0 15px rgba(14,209,69,0.2); background:transparent; cursor:pointer; }
    .mv-btn:hover:not(:disabled) { background:#0ed145; color:black; }
    .mv-btn:disabled { opacity:0.45; cursor:not-allowed; }
    .mv-btn-danger { border-color:#ff5555; color:#ff5555; box-shadow:none; }
    .mv-btn-danger:hover:not(:disabled) { background:#ff5555; color:#000; }
    .mv-actions { display:flex; gap:0.6rem; justify-content:center; flex-wrap:wrap; margin-top:0.75rem; }
    .mv-data-box { text-align:left; background:rgba(14,209,69,0.05); border:1px solid rgba(14,209,69,0.2); border-radius:8px; padding:1rem 1.25rem; margin:0 0 20px; }
    .mv-data-row { margin-bottom:12px; }
    .mv-data-label { font-size:0.68rem; opacity:0.4; letter-spacing:0.08em; margin:0 0 4px; }
    .mv-data-val { font-size:0.85rem; line-height:1.6; word-break:break-word; white-space:pre-wrap; margin:0; }
    .mv-input { width:100%; background:transparent; border:1px solid rgba(14,209,69,0.35); border-radius:6px; padding:0.5rem 0.75rem; color:#0ed145; font-family:monospace; font-size:0.875rem; outline:none; box-sizing:border-box; margin-bottom:0.6rem; }
    .mv-input:focus { border-color:#0ed145; box-shadow:0 0 8px rgba(14,209,69,0.25); }
    .mv-textarea { width:100%; background:transparent; border:1px solid rgba(14,209,69,0.35); border-radius:6px; padding:0.5rem 0.75rem; color:#0ed145; font-family:monospace; font-size:0.875rem; outline:none; resize:vertical; min-height:90px; box-sizing:border-box; margin-bottom:0.4rem; }
    .mv-textarea:focus { border-color:#0ed145; box-shadow:0 0 8px rgba(14,209,69,0.25); }
    .mv-char { font-size:0.7rem; opacity:0.35; text-align:right; margin:0 0 0.75rem; }
    .mv-checkbox-row { display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="mv-wrap">
        <div className="mv-box">
          <p className="mv-prompt">greencat777@bio:~$ manage_vouch</p>

          {state === "loading" && (
            <>
              <div className="mv-spinner" />
              <p className="mv-sub">Verifying your link...</p>
            </>
          )}

          {state === "error" && (
            <>
              <h1 className="mv-title mv-error">⚠ Link Invalid</h1>
              <p className="mv-sub mv-error">{errMsg}</p>
              <div className="mv-actions">
                <a href="/vouches" className="mv-btn">← Back to Vouches</a>
              </div>
            </>
          )}

          {state === "done" && (
            <>
              <h1 className="mv-title">✓ Done</h1>
              <p className="mv-sub">{doneMsg}</p>
              <div className="mv-actions">
                <a href="/vouches" className="mv-btn">← Back to Vouches</a>
              </div>
            </>
          )}

          {state === "ready" && vouch && action === "export" && (
            <>
              <h1 className="mv-title">📄 Your Info</h1>
              <p className="mv-sub">Here's everything stored for your vouch. This link has now been used up.</p>
              <div className="mv-data-box">
                <div className="mv-data-row">
                  <p className="mv-data-label">// NAME</p>
                  <p className="mv-data-val">{vouch.name}</p>
                </div>
                <div className="mv-data-row">
                  <p className="mv-data-label">// EMAIL</p>
                  <p className="mv-data-val">{vouch.email}</p>
                </div>
                <div className="mv-data-row">
                  <p className="mv-data-label">// VOUCH TEXT</p>
                  <p className="mv-data-val">{vouch.body}</p>
                </div>
                <div className="mv-data-row">
                  <p className="mv-data-label">// STATUS</p>
                  <p className="mv-data-val">
                    {vouch.user_confirmed ? "✓ Confirmed" : "Unconfirmed"} · {vouch.admin_approved ? "Live on site" : "Pending review"}
                  </p>
                </div>
                {vouch.admin_note && (
                  <div className="mv-data-row">
                    <p className="mv-data-label">// NOTE FROM GREENCAT</p>
                    <p className="mv-data-val">{vouch.admin_note}</p>
                  </div>
                )}
                <div className="mv-data-row" style={{ marginBottom: 0 }}>
                  <p className="mv-data-label">// SUBMITTED</p>
                  <p className="mv-data-val">{new Date(vouch.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="mv-actions">
                <a href="/vouches" className="mv-btn">← Back to Vouches</a>
              </div>
            </>
          )}

          {state === "ready" && vouch && action === "delete" && (
            <>
              <h1 className="mv-title mv-error">🗑 Delete Vouch</h1>
              <p className="mv-sub">
                This will permanently delete your vouch and all associated info. This can't be undone.
              </p>
              <div className="mv-data-box">
                <div className="mv-data-row" style={{ marginBottom: 0 }}>
                  <p className="mv-data-label">// VOUCH TO DELETE</p>
                  <p className="mv-data-val"><strong>{vouch.name}</strong>: {vouch.body}</p>
                </div>
              </div>
              {!confirmDelete ? (
                <div className="mv-actions">
                  <a href="/vouches" className="mv-btn">Cancel</a>
                  <button className="mv-btn mv-btn-danger" onClick={() => setConfirmDelete(true)}>
                    🗑 Delete Everything
                  </button>
                </div>
              ) : (
                <>
                  <p className="mv-sub mv-error">Are you absolutely sure?</p>
                  <div className="mv-actions">
                    <button className="mv-btn" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                      Cancel
                    </button>
                    <button className="mv-btn mv-btn-danger" onClick={performDelete} disabled={deleting}>
                      {deleting ? "deleting..." : "Yes, delete permanently"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {state === "ready" && vouch && action === "edit" && (
            <>
              <h1 className="mv-title">✎ Edit Vouch</h1>
              <p className="mv-sub">Update your name, vouch text, or email on file.</p>
              <div style={{ textAlign: "left" }}>
                <input
                  className="mv-input"
                  type="text"
                  placeholder="your name"
                  maxLength={64}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <textarea
                  className="mv-textarea"
                  placeholder="your vouch"
                  maxLength={1000}
                  rows={4}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                />
                <p className="mv-char">{editBody.length}/1000</p>
                <input
                  className="mv-input"
                  type="email"
                  placeholder="your email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
                {saveErr && <p className="mv-sub mv-error" style={{ margin: "0 0 12px" }}>⚠ {saveErr}</p>}
              </div>
              <div className="mv-actions">
                <a href="/vouches" className="mv-btn">Cancel</a>
                <button className="mv-btn" onClick={saveEdit} disabled={saving}>
                  {saving ? "saving..." : "💾 Save Changes"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
