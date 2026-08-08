"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

type State = "form" | "done" | "error";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<State>(token ? "form" : "error");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function savePassword() {
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords don't match.");
    if (!token) return setError("Missing token.");

    setSaving(true);
    try {
      const res = await fetch("/api/account/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
      } else {
        setState("done");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSaving(false);
  }

  const css = `
    .rp-wrap { font-family:monospace; color:#0ed145; }
    .rp-box { border:2px solid #0ed145; border-radius:12px; padding:2rem 2.5rem; background:rgba(0,0,0,0.5); box-shadow:0 0 30px rgba(14,209,69,0.3); text-align:center; }
    .rp-prompt { font-size:0.85rem; opacity:0.5; margin:0 0 8px; letter-spacing:0.08em; }
    .rp-title { font-size:1.4rem; font-weight:bold; color:#0ed145; margin:0 0 12px; text-shadow:0 0 12px rgba(14,209,69,0.5); }
    .rp-sub { font-size:0.88rem; color:rgba(14,209,69,0.65); line-height:1.7; margin:0 0 20px; }
    .rp-input { width:100%; max-width:280px; background:transparent; border:1px solid rgba(14,209,69,0.35); border-radius:6px; padding:0.55rem 0.8rem; color:#0ed145; font-family:monospace; font-size:0.875rem; outline:none; box-sizing:border-box; margin-bottom:0.6rem; }
    .rp-input:focus { border-color:#0ed145; box-shadow:0 0 8px rgba(14,209,69,0.25); }
    .rp-btn { display:inline-block; padding:10px 28px; border:2px solid #0ed145; border-radius:8px; color:#0ed145; text-decoration:none; font-family:monospace; font-size:0.9rem; font-weight:bold; letter-spacing:0.06em; transition:background 0.15s, color 0.15s; box-shadow:0 0 15px rgba(14,209,69,0.2); background:transparent; cursor:pointer; }
    .rp-btn:hover:not(:disabled) { background:#0ed145; color:black; }
    .rp-btn:disabled { opacity:0.45; cursor:not-allowed; }
    .rp-error { color:#ff5555; font-size:0.8rem; margin:0 0 12px; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="rp-wrap">
        <div className="rp-box">
          <p className="rp-prompt">greencat777@bio:~$ reset_password</p>

          {state === "error" && (
            <>
              <h1 className="rp-title" style={{ color: "#ff5555" }}>⚠ Link Invalid</h1>
              <p className="rp-sub">This reset link is missing or invalid. Request a new one from the sign-in screen.</p>
              <a href="/pm" className="rp-btn">← Back to Sign In</a>
            </>
          )}

          {state === "form" && (
            <>
              <h1 className="rp-title">Set New Password</h1>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <input
                  className="rp-input"
                  type="password"
                  placeholder="new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <input
                  className="rp-input"
                  type="password"
                  placeholder="confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && savePassword()}
                />
                {error && <p className="rp-error">⚠ {error}</p>}
                <button className="rp-btn" onClick={savePassword} disabled={saving}>
                  {saving ? "saving..." : "💾 Save Password"}
                </button>
              </div>
            </>
          )}

          {state === "done" && (
            <>
              <h1 className="rp-title">✓ Password Updated</h1>
              <p className="rp-sub">Sign in with your new password.</p>
              <a href="/pm" className="rp-btn">→ Go to Sign In</a>
            </>
          )}
        </div>
      </div>
    </>
  );
}
