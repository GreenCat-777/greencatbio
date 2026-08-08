"use client";

import { useEffect, useState, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useAccount } from "@/lib/use-account";

type Message = {
  id: string;
  sender_id: string | null;
  recipient_id: string | null;
  body: string;
  created_at: string;
  read_at: string | null;
};

type AuthTab = "signin" | "signup";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PmClient() {
  const { state: authState, session, profile, signOut } = useAccount();

  const [tab, setTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signupSent, setSignupSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [thread, setThread] = useState<Message[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [compose, setCompose] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authState === "ready" && session && profile?.verified) loadThread(session.user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, session, profile?.verified]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  async function loadThread(myId: string) {
    setLoadingThread(true);
    const { data } = await supabaseBrowser
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${myId},recipient_id.is.null),and(sender_id.is.null,recipient_id.eq.${myId})`)
      .order("created_at", { ascending: true });

    setThread(data || []);
    setLoadingThread(false);

    await supabaseBrowser
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .is("sender_id", null)
      .eq("recipient_id", myId)
      .is("read_at", null);
  }

  async function handleSignIn() {
    setAuthError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setAuthError("Enter a valid email.");
    if (!password) return setAuthError("Enter your password.");

    setAuthLoading(true);
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email: email.trim(), password });
    setAuthLoading(false);
    if (error) setAuthError(error.message);
  }

  async function handleSignUp() {
    setAuthError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setAuthError("Enter a valid email.");
    if (password.length < 8) return setAuthError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setAuthError("Passwords don't match.");
    const uname = signupUsername.trim();
    if (uname.length < 3 || uname.length > 24) return setAuthError("Username must be 3–24 characters.");
    if (!/^[a-zA-Z0-9_]+$/.test(uname)) return setAuthError("Username: letters, numbers, underscores only.");

    setAuthLoading(true);
    try {
      const res = await fetch("/api/account/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, username: uname }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Failed to create account.");
      } else {
        setSignupSent(true);
      }
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  }

  async function handleForgotPassword() {
    setAuthError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setAuthError("Enter your email above first.");
    setAuthLoading(true);
    try {
      await fetch("/api/account/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setResetSent(true);
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  }

  async function sendMessage() {
    if (!session || !compose.trim()) return;
    setSending(true);
    const body = compose.trim();
    const { data, error } = await supabaseBrowser
      .from("messages")
      .insert([{ sender_id: session.user.id, recipient_id: null, body }])
      .select()
      .single();
    setSending(false);
    if (!error && data) {
      setThread((t) => [...t, data]);
      setCompose("");
    }
  }

  async function handleSignOut() {
    await signOut();
    setThread([]);
  }

  const css = `
    .pm-wrap { font-family:monospace; color:#0ed145; }
    .pm-box { border:2px solid #0ed145; border-radius:12px; padding:1.5rem; background:rgba(0,0,0,0.5); box-shadow:0 0 24px rgba(14,209,69,0.25); min-height:420px; display:flex; flex-direction:column; }
    .pm-header { display:flex; align-items:center; gap:0.5rem; margin-bottom:1.25rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(14,209,69,0.2); }
    .pm-dot { width:8px; height:8px; border-radius:50%; background:#0ed145; box-shadow:0 0 6px #0ed145; }
    .pm-title { font-size:0.95rem; font-weight:bold; letter-spacing:0.08em; opacity:0.9; }
    .pm-right { margin-left:auto; display:flex; gap:0.5rem; align-items:center; }
    .pm-link { font-size:0.78rem; color:rgba(14,209,69,0.6); text-decoration:none; border:1px solid rgba(14,209,69,0.3); border-radius:5px; padding:3px 12px; transition:all 0.15s; background:transparent; cursor:pointer; font-family:monospace; }
    .pm-link:hover { color:#0ed145; border-color:#0ed145; }
    .pm-centered { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:0.65rem; padding:2rem 1rem; }
    .pm-sub { font-size:0.85rem; opacity:0.6; line-height:1.6; max-width:340px; }
    .pm-input { width:100%; max-width:280px; background:transparent; border:1px solid rgba(14,209,69,0.35); border-radius:6px; padding:0.55rem 0.8rem; color:#0ed145; font-family:monospace; font-size:0.875rem; outline:none; box-sizing:border-box; }
    .pm-input:focus { border-color:#0ed145; box-shadow:0 0 8px rgba(14,209,69,0.25); }
    .pm-btn { padding:0.5rem 1.4rem; border:2px solid #0ed145; border-radius:6px; background:transparent; color:#0ed145; font-family:monospace; font-size:0.85rem; font-weight:bold; cursor:pointer; letter-spacing:0.05em; transition:background 0.15s, color 0.15s; }
    .pm-btn:hover:not(:disabled) { background:#0ed145; color:black; }
    .pm-btn:disabled { opacity:0.45; cursor:not-allowed; }
    .pm-error { font-size:0.78rem; color:#ff5555; }
    .pm-tabs { display:flex; gap:0.4rem; margin-bottom:0.5rem; }
    .pm-tab { padding:4px 14px; border:1px solid rgba(14,209,69,0.3); border-radius:5px; background:transparent; color:rgba(14,209,69,0.5); font-family:monospace; font-size:0.78rem; cursor:pointer; }
    .pm-tab-active { border-color:#0ed145; color:#000; background:#0ed145; }
    .pm-forgot { font-size:0.72rem; opacity:0.45; background:transparent; border:none; color:#0ed145; cursor:pointer; text-decoration:underline; }
    .pm-empty { opacity:0.4; font-size:0.85rem; text-align:center; padding:2rem 0; }
    .pm-thread-avatar { width:34px; height:34px; border-radius:50%; border:2px solid #0ed145; background:rgba(14,209,69,0.08); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px; flex-shrink:0; }
    .pm-thread-header { display:flex; align-items:center; gap:0.6rem; margin-bottom:1rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(14,209,69,0.2); }
    .pm-thread-name { font-weight:bold; font-size:0.9rem; }
    .pm-thread-body { flex:1; display:flex; flex-direction:column; gap:0.5rem; overflow-y:auto; max-height:380px; padding-right:2px; }
    .pm-msg { max-width:75%; padding:0.5rem 0.8rem; border-radius:10px; font-size:0.85rem; line-height:1.5; word-break:break-word; white-space:pre-wrap; }
    .pm-msg-mine { align-self:flex-end; background:rgba(14,209,69,0.18); border:1px solid rgba(14,209,69,0.4); }
    .pm-msg-theirs { align-self:flex-start; background:rgba(14,209,69,0.05); border:1px solid rgba(14,209,69,0.15); }
    .pm-msg-time { font-size:0.62rem; opacity:0.35; margin-top:3px; }
    .pm-compose-row { display:flex; gap:0.5rem; margin-top:1rem; padding-top:1rem; border-top:1px solid rgba(14,209,69,0.15); }
    .pm-compose-input { flex:1; background:transparent; border:1px solid rgba(14,209,69,0.35); border-radius:6px; padding:0.5rem 0.75rem; color:#0ed145; font-family:monospace; font-size:0.85rem; outline:none; resize:none; }
    .pm-compose-input:focus { border-color:#0ed145; box-shadow:0 0 8px rgba(14,209,69,0.25); }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="pm-wrap">
        <div className="pm-box">
          <div className="pm-header">
            <span className="pm-dot" />
            <span className="pm-title">// TALK WITH GREENCAT</span>
            <div className="pm-right">
              {authState === "ready" && (
                <>
                  <a href="/account" className="pm-link">⚙ settings</a>
                  <button className="pm-link" onClick={handleSignOut}>sign out</button>
                </>
              )}
              <a href="/social" className="pm-link">← social</a>
            </div>
          </div>

          {authState === "loading" && (
            <div className="pm-centered">
              <p className="pm-sub">loading...</p>
            </div>
          )}

          {authState === "signed-out" && (
            <div className="pm-centered">
              {signupSent ? (
                <p className="pm-sub">📬 Check your email — tap the verification link, then come back and sign in.</p>
              ) : resetSent ? (
                <p className="pm-sub">📬 If that email has an account, a reset link is on its way.</p>
              ) : (
                <>
                  <p className="pm-sub">
                    Sign in for a private, secure line straight to GreenCat — this goes directly to their dashboard, no one else can see it.
                  </p>
                  <div className="pm-tabs">
                    <button className={`pm-tab${tab === "signin" ? " pm-tab-active" : ""}`} onClick={() => { setTab("signin"); setAuthError(null); }}>
                      Sign In
                    </button>
                    <button className={`pm-tab${tab === "signup" ? " pm-tab-active" : ""}`} onClick={() => { setTab("signup"); setAuthError(null); }}>
                      Create Account
                    </button>
                  </div>
                  {tab === "signup" && (
                    <input
                      className="pm-input"
                      type="text"
                      placeholder="username"
                      maxLength={24}
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                    />
                  )}
                  <input
                    className="pm-input"
                    type="email"
                    placeholder="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    className="pm-input"
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (tab === "signin" ? handleSignIn() : handleSignUp())}
                  />
                  {tab === "signup" && (
                    <input
                      className="pm-input"
                      type="password"
                      placeholder="confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                    />
                  )}
                  {authError && <span className="pm-error">⚠ {authError}</span>}
                  {tab === "signin" ? (
                    <>
                      <button className="pm-btn" onClick={handleSignIn} disabled={authLoading}>
                        {authLoading ? "signing in..." : "→ Sign In"}
                      </button>
                      <button className="pm-forgot" onClick={handleForgotPassword} disabled={authLoading}>
                        forgot password?
                      </button>
                    </>
                  ) : (
                    <button className="pm-btn" onClick={handleSignUp} disabled={authLoading}>
                      {authLoading ? "creating..." : "→ Create Account"}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {authState === "needs-username" && (
            <div className="pm-centered">
              <p className="pm-sub">Something's off with this account (no profile found). Contact support.</p>
            </div>
          )}

          {authState === "ready" && !profile?.verified && (
            <div className="pm-centered">
              <p className="pm-sub">
                📬 Almost there — check your email and tap the verification link before messaging GreenCat.
              </p>
            </div>
          )}

          {authState === "ready" && profile?.verified && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div className="pm-thread-header">
                <div className="pm-thread-avatar">G</div>
                <span className="pm-thread-name">GreenCat</span>
              </div>

              <div className="pm-thread-body">
                {loadingThread ? (
                  <p className="pm-empty">loading...</p>
                ) : thread.length === 0 ? (
                  <p className="pm-empty">No messages yet — say hi, {profile.username}.</p>
                ) : (
                  thread.map((m) => (
                    <div key={m.id} className={`pm-msg ${m.sender_id === session?.user.id ? "pm-msg-mine" : "pm-msg-theirs"}`}>
                      {m.body}
                      <div className="pm-msg-time">{timeAgo(m.created_at)}</div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className="pm-compose-row">
                <textarea
                  className="pm-compose-input"
                  placeholder="type a message..."
                  rows={1}
                  maxLength={2000}
                  value={compose}
                  onChange={(e) => setCompose(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button className="pm-btn" onClick={sendMessage} disabled={sending || !compose.trim()}>
                  {sending ? "..." : "→"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
