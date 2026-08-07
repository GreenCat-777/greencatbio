"use client";

import { useEffect, useState, useRef, type ChangeEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useAccount } from "@/lib/use-account";

type MyVouch = {
  id: string;
  name: string;
  body: string;
  admin_approved: boolean;
  user_confirmed: boolean;
  admin_note: string | null;
  created_at: string;
};

export default function AccountSettingsClient() {
  const { state: authState, session, profile, signOut, refreshProfile } = useAccount();

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Username
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState<{ text: string; err: boolean } | null>(null);

  // Email
  const [emailInput, setEmailInput] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ text: string; err: boolean } | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // Password
  const [pwSending, setPwSending] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  // Vouches
  const [vouches, setVouches] = useState<MyVouch[]>([]);
  const [loadingVouches, setLoadingVouches] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBody, setEditBody] = useState("");
  const [vouchSaving, setVouchSaving] = useState(false);
  const [vouchMsg, setVouchMsg] = useState<{ text: string; err: boolean } | null>(null);

  // Data export / account deletion
  const [exportData, setExportData] = useState<Record<string, unknown> | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setUsernameInput(profile.username);
  }, [profile]);

  useEffect(() => {
    if (session) setEmailInput(session.user.email || "");
  }, [session]);

  useEffect(() => {
    if (authState === "ready" && session) loadVouches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, session]);

  async function loadVouches() {
    if (!session) return;
    setLoadingVouches(true);
    try {
      const res = await fetch("/api/vouches/my", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (res.ok) setVouches(data.vouches);
    } catch {
      // silent — non-critical section
    }
    setLoadingVouches(false);
  }

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    setAvatarError(null);
    const file = e.target.files?.[0];
    if (!file || !session) return;

    if (!file.type.startsWith("image/")) return setAvatarError("Please choose an image file.");
    if (file.size > 3 * 1024 * 1024) return setAvatarError("Image must be under 3MB.");

    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${session.user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabaseBrowser.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseBrowser.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: dbError } = await supabaseBrowser
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", session.user.id);

      if (dbError) throw dbError;

      await refreshProfile();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed.");
    }
    setAvatarUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function saveUsername() {
    setUsernameMsg(null);
    const uname = usernameInput.trim();
    if (uname.length < 3 || uname.length > 24) return setUsernameMsg({ text: "3–24 characters.", err: true });
    if (!/^[a-zA-Z0-9_]+$/.test(uname)) return setUsernameMsg({ text: "Letters, numbers, underscores only.", err: true });
    if (!session) return;

    setUsernameSaving(true);
    const { error } = await supabaseBrowser
      .from("profiles")
      .update({ username: uname })
      .eq("id", session.user.id);
    setUsernameSaving(false);

    if (error) {
      setUsernameMsg({ text: error.message.includes("duplicate") ? "That username is taken." : "Failed to save.", err: true });
    } else {
      await refreshProfile();
      setUsernameMsg({ text: "✓ Username updated.", err: false });
    }
  }

  async function saveEmail() {
    setEmailMsg(null);
    const newEmail = emailInput.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return setEmailMsg({ text: "Invalid email.", err: true });
    if (session && newEmail.toLowerCase() === (session.user.email || "").toLowerCase()) {
      return setEmailMsg({ text: "That's already your email.", err: true });
    }

    setEmailSaving(true);
    const { error } = await supabaseBrowser.auth.updateUser({ email: newEmail });
    setEmailSaving(false);

    if (error) {
      setEmailMsg({ text: error.message, err: true });
    } else {
      setPendingEmail(newEmail);
      setEmailMsg({ text: "✓ Confirmation link(s) sent — check your inbox(es) to finish the change.", err: false });
    }
  }

  async function resendEmailVerification() {
    if (!pendingEmail) return;
    setResending(true);
    const { error } = await supabaseBrowser.auth.resend({ type: "email_change", email: pendingEmail });
    setResending(false);
    setEmailMsg(
      error
        ? { text: error.message, err: true }
        : { text: "✓ Verification email resent.", err: false }
    );
  }

  async function sendPasswordReset() {
    if (!session?.user.email) return;
    setPwSending(true);
    setPwMsg(null);
    const { error } = await supabaseBrowser.auth.resetPasswordForEmail(session.user.email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/pm/reset` : undefined,
    });
    setPwSending(false);
    setPwMsg(error ? error.message : "📬 Check your email for a reset link.");
  }

  function startEditVouch(v: MyVouch) {
    setEditingId(v.id);
    setEditName(v.name);
    setEditBody(v.body);
    setVouchMsg(null);
  }

  async function saveVouchEdit(id: string) {
    if (!session) return;
    setVouchSaving(true);
    setVouchMsg(null);
    try {
      const res = await fetch("/api/vouches/my", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id, name: editName.trim(), body: editBody.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVouchMsg({ text: data.error || "Failed to save.", err: true });
      } else {
        setEditingId(null);
        setVouchMsg({ text: "✓ Saved — back in the review queue.", err: false });
        loadVouches();
      }
    } catch {
      setVouchMsg({ text: "Network error.", err: true });
    }
    setVouchSaving(false);
  }

  async function deleteVouch(id: string) {
    if (!session) return;
    if (!confirm("Permanently delete this vouch?")) return;
    setVouchSaving(true);
    try {
      const res = await fetch("/api/vouches/my", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setVouches((v) => v.filter((x) => x.id !== id));
        setVouchMsg({ text: "✓ Deleted.", err: false });
      } else {
        const data = await res.json();
        setVouchMsg({ text: data.error || "Failed to delete.", err: true });
      }
    } catch {
      setVouchMsg({ text: "Network error.", err: true });
    }
    setVouchSaving(false);
  }

  async function exportMyData() {
    if (!session) return;
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch("/api/account/export", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setExportError(data.error || "Failed to load your data.");
      } else {
        setExportData(data);
      }
    } catch {
      setExportError("Network error.");
    }
    setExporting(false);
  }

  function downloadExport() {
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-greencatbio-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteMyAccount() {
    if (!session || !profile) return;
    if (deleteConfirmText.trim().toLowerCase() !== profile.username.toLowerCase()) {
      return setDeleteError("Type your username exactly to confirm.");
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete account.");
        setDeleting(false);
      }
    } catch {
      setDeleteError("Network error.");
      setDeleting(false);
    }
  }

  const css = `
    .as-wrap { font-family:monospace; color:#0ed145; }
    .as-header { display:flex; align-items:center; gap:0.5rem; margin-bottom:1.25rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(14,209,69,0.2); }
    .as-dot { width:8px; height:8px; border-radius:50%; background:#0ed145; box-shadow:0 0 6px #0ed145; }
    .as-title { font-size:0.95rem; font-weight:bold; letter-spacing:0.08em; opacity:0.9; }
    .as-right { margin-left:auto; display:flex; gap:0.5rem; }
    .as-link { font-size:0.78rem; color:rgba(14,209,69,0.6); text-decoration:none; border:1px solid rgba(14,209,69,0.3); border-radius:5px; padding:3px 12px; transition:all 0.15s; background:transparent; cursor:pointer; font-family:monospace; }
    .as-link:hover { color:#0ed145; border-color:#0ed145; }
    .as-section { border:2px solid #0ed145; border-radius:12px; padding:1.25rem 1.5rem; background:rgba(0,0,0,0.5); box-shadow:0 0 20px rgba(14,209,69,0.2); margin-bottom:1rem; }
    .as-section-label { font-size:0.72rem; opacity:0.45; letter-spacing:0.08em; margin:0 0 12px; }
    .as-avatar-row { display:flex; align-items:center; gap:1rem; }
    .as-avatar { width:64px; height:64px; border-radius:50%; border:2px solid #0ed145; background:rgba(14,209,69,0.08); display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:bold; overflow:hidden; box-shadow:0 0 10px rgba(14,209,69,0.3); flex-shrink:0; }
    .as-avatar img { width:100%; height:100%; object-fit:cover; }
    .as-row { display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap; }
    .as-input { flex:1; min-width:180px; background:transparent; border:1px solid rgba(14,209,69,0.35); border-radius:6px; padding:0.5rem 0.75rem; color:#0ed145; font-family:monospace; font-size:0.875rem; outline:none; box-sizing:border-box; }
    .as-input:focus { border-color:#0ed145; box-shadow:0 0 8px rgba(14,209,69,0.25); }
    .as-textarea { width:100%; background:transparent; border:1px solid rgba(14,209,69,0.35); border-radius:6px; padding:0.5rem 0.75rem; color:#0ed145; font-family:monospace; font-size:0.85rem; outline:none; resize:vertical; min-height:70px; box-sizing:border-box; margin:0.5rem 0; }
    .as-btn { padding:0.5rem 1.2rem; border:2px solid #0ed145; border-radius:6px; background:transparent; color:#0ed145; font-family:monospace; font-size:0.82rem; font-weight:bold; cursor:pointer; letter-spacing:0.04em; transition:background 0.15s, color 0.15s; white-space:nowrap; }
    .as-btn:hover:not(:disabled) { background:#0ed145; color:black; }
    .as-btn:disabled { opacity:0.45; cursor:not-allowed; }
    .as-btn-danger { border-color:rgba(255,85,85,0.5); color:#ff5555; }
    .as-btn-danger:hover:not(:disabled) { background:#ff5555; color:#000; }
    .as-msg { font-size:0.78rem; margin-top:8px; }
    .as-msg-err { color:#ff5555; }
    .as-msg-ok { color:#0ed145; opacity:0.8; }
    .as-sub { font-size:0.78rem; opacity:0.55; line-height:1.6; margin:0 0 10px; }
    .as-vouch-item { border:1px solid rgba(14,209,69,0.2); border-radius:8px; padding:0.85rem 1rem; margin-bottom:0.6rem; background:rgba(14,209,69,0.02); }
    .as-vouch-top { display:flex; align-items:center; gap:0.5rem; margin-bottom:6px; flex-wrap:wrap; }
    .as-vouch-name { font-weight:bold; font-size:0.85rem; }
    .as-badge { font-size:0.63rem; padding:1px 7px; border-radius:4px; font-weight:bold; border:1px solid; }
    .as-badge-live { border-color:#0ed145; color:#0ed145; }
    .as-badge-pending { border-color:rgba(255,200,0,0.5); color:rgba(255,200,0,0.8); }
    .as-vouch-body { font-size:0.82rem; opacity:0.8; line-height:1.5; white-space:pre-wrap; word-break:break-word; margin:0 0 8px; }
    .as-empty { opacity:0.4; font-size:0.82rem; text-align:center; padding:1rem 0; }
    .as-file-input { font-size:0.75rem; color:rgba(14,209,69,0.6); }
    .as-danger-section { border-color:rgba(255,85,85,0.5); box-shadow:0 0 20px rgba(255,85,85,0.12); }
    .as-export-box { background:rgba(14,209,69,0.03); border:1px solid rgba(14,209,69,0.2); border-radius:8px; padding:0.85rem; max-height:220px; overflow-y:auto; font-size:0.72rem; white-space:pre-wrap; word-break:break-word; margin-top:10px; }
  `;

  if (authState === "loading") {
    return (
      <>
        <style>{css}</style>
        <div className="as-wrap"><p className="as-empty">loading...</p></div>
      </>
    );
  }

  if (authState !== "ready") {
    return (
      <>
        <style>{css}</style>
        <div className="as-wrap">
          <div className="as-section" style={{ textAlign: "center" }}>
            <p className="as-sub">You need a verified account to view settings.</p>
            <a href="/pm" className="as-btn" style={{ textDecoration: "none", display: "inline-block" }}>→ Sign In</a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="as-wrap">
        <div className="as-header">
          <span className="as-dot" />
          <span className="as-title">// ACCOUNT SETTINGS</span>
          <div className="as-right">
            <a href="/pm" className="as-link">← messages</a>
            <button className="as-link" onClick={signOut}>sign out</button>
          </div>
        </div>

        {/* Avatar */}
        <div className="as-section">
          <p className="as-section-label">// PROFILE PICTURE (public)</p>
          <div className="as-avatar-row">
            <div className="as-avatar">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" />
              ) : (
                profile?.username.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                className="as-file-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
              />
              {avatarUploading && <p className="as-msg">uploading...</p>}
              {avatarError && <p className="as-msg as-msg-err">⚠ {avatarError}</p>}
            </div>
          </div>
        </div>

        {/* Username */}
        <div className="as-section">
          <p className="as-section-label">// USERNAME</p>
          <div className="as-row">
            <input className="as-input" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} maxLength={24} />
            <button className="as-btn" onClick={saveUsername} disabled={usernameSaving || usernameInput.trim() === profile?.username}>
              {usernameSaving ? "saving..." : "Save"}
            </button>
          </div>
          {usernameMsg && <p className={`as-msg ${usernameMsg.err ? "as-msg-err" : "as-msg-ok"}`}>{usernameMsg.text}</p>}
        </div>

        {/* Email */}
        <div className="as-section">
          <p className="as-section-label">// EMAIL</p>
          <div className="as-row">
            <input className="as-input" type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
            <button className="as-btn" onClick={saveEmail} disabled={emailSaving}>
              {emailSaving ? "saving..." : "Change Email"}
            </button>
          </div>
          {emailMsg && <p className={`as-msg ${emailMsg.err ? "as-msg-err" : "as-msg-ok"}`}>{emailMsg.text}</p>}
          {pendingEmail && (
            <button className="as-link" style={{ marginTop: "8px" }} onClick={resendEmailVerification} disabled={resending}>
              {resending ? "resending..." : "↻ Resend verification email"}
            </button>
          )}
        </div>

        {/* Password */}
        <div className="as-section">
          <p className="as-section-label">// PASSWORD</p>
          <p className="as-sub">For security, password changes go through an emailed link — no old password typed here.</p>
          <button className="as-btn" onClick={sendPasswordReset} disabled={pwSending}>
            {pwSending ? "sending..." : "✉ Send Reset Link"}
          </button>
          {pwMsg && <p className="as-msg as-msg-ok">{pwMsg}</p>}
        </div>

        {/* Vouches */}
        <div className="as-section">
          <p className="as-section-label">// YOUR VOUCHES</p>
          {vouchMsg && <p className={`as-msg ${vouchMsg.err ? "as-msg-err" : "as-msg-ok"}`} style={{ marginBottom: "10px" }}>{vouchMsg.text}</p>}
          {loadingVouches ? (
            <p className="as-empty">loading...</p>
          ) : vouches.length === 0 ? (
            <p className="as-empty">No vouches tied to this email yet.</p>
          ) : (
            vouches.map((v) => (
              <div key={v.id} className="as-vouch-item">
                {editingId === v.id ? (
                  <>
                    <input className="as-input" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={64} style={{ marginBottom: "8px" }} />
                    <textarea className="as-textarea" value={editBody} onChange={(e) => setEditBody(e.target.value)} maxLength={1000} rows={3} />
                    <div className="as-row">
                      <button className="as-btn" onClick={() => setEditingId(null)} disabled={vouchSaving}>Cancel</button>
                      <button className="as-btn" onClick={() => saveVouchEdit(v.id)} disabled={vouchSaving}>
                        {vouchSaving ? "saving..." : "💾 Save"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="as-vouch-top">
                      <span className="as-vouch-name">{v.name}</span>
                      {v.admin_approved ? (
                        <span className="as-badge as-badge-live">● LIVE</span>
                      ) : (
                        <span className="as-badge as-badge-pending">PENDING REVIEW</span>
                      )}
                    </div>
                    <p className="as-vouch-body">{v.body}</p>
                    <div className="as-row">
                      <button className="as-btn" onClick={() => startEditVouch(v)} disabled={vouchSaving}>✎ Edit</button>
                      <button className="as-btn as-btn-danger" onClick={() => deleteVouch(v.id)} disabled={vouchSaving}>🗑 Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Data Export */}
        <div className="as-section">
          <p className="as-section-label">// YOUR DATA</p>
          <p className="as-sub">Download everything stored under this account: profile, vouches, messages, and comments.</p>
          <div className="as-row">
            <button className="as-btn" onClick={exportMyData} disabled={exporting}>
              {exporting ? "loading..." : "📄 Request All My Data"}
            </button>
            {exportData && (
              <button className="as-btn" onClick={downloadExport}>⬇ Download as JSON</button>
            )}
          </div>
          {exportError && <p className="as-msg as-msg-err">⚠ {exportError}</p>}
          {exportData && (
            <div className="as-export-box">{JSON.stringify(exportData, null, 2)}</div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="as-section as-danger-section">
          <p className="as-section-label" style={{ color: "#ff5555" }}>// DANGER ZONE</p>
          <p className="as-sub">
            Permanently deletes your account, profile, avatar, all messages (both sides), all your comments, and all vouches tied to this email. This can&apos;t be undone.
          </p>
          <input
            className="as-input"
            placeholder={`type "${profile?.username}" to confirm`}
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            style={{ marginBottom: "8px" }}
          />
          <button
            className="as-btn as-btn-danger"
            onClick={deleteMyAccount}
            disabled={deleting || deleteConfirmText.trim().toLowerCase() !== profile?.username.toLowerCase()}
          >
            {deleting ? "deleting..." : "🗑 Delete My Account Permanently"}
          </button>
          {deleteError && <p className="as-msg as-msg-err">⚠ {deleteError}</p>}
        </div>
      </div>
    </>
  );
}
