"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type State = "loading" | "success" | "error";

export default function ConfirmEmailChangeClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>("loading");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrMsg("No confirmation token found.");
      return;
    }

    fetch(`/api/account/confirm-email-change?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setState("success");
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

  const css = `
    .ce-wrap { font-family:monospace; color:#0ed145; }
    .ce-box { border:2px solid #0ed145; border-radius:12px; padding:2rem 2.5rem; background:rgba(0,0,0,0.5); box-shadow:0 0 30px rgba(14,209,69,0.3); text-align:center; }
    .ce-prompt { font-size:0.85rem; opacity:0.5; margin:0 0 8px; letter-spacing:0.08em; }
    .ce-title { font-size:1.6rem; font-weight:bold; color:#0ed145; margin:0 0 12px; text-shadow:0 0 12px rgba(14,209,69,0.5); }
    .ce-sub { font-size:0.9rem; color:rgba(14,209,69,0.65); line-height:1.7; margin:0 0 24px; }
    .ce-btn { display:inline-block; padding:10px 28px; border:2px solid #0ed145; border-radius:8px; color:#0ed145; text-decoration:none; font-family:monospace; font-size:0.9rem; font-weight:bold; letter-spacing:0.06em; transition:background 0.15s, color 0.15s; box-shadow:0 0 15px rgba(14,209,69,0.2); }
    .ce-btn:hover { background:#0ed145; color:black; }
    .ce-spinner { width:32px; height:32px; border:2px solid rgba(14,209,69,0.2); border-top-color:#0ed145; border-radius:50%; animation:ce-spin 0.8s linear infinite; margin:0 auto 20px; }
    @keyframes ce-spin { to { transform:rotate(360deg); } }
    .ce-error { color:#ff5555; }
    .ce-dot { width:10px; height:10px; border-radius:50%; background:#0ed145; box-shadow:0 0 8px #0ed145; margin:0 auto 20px; animation:ce-pulse 2s ease-in-out infinite; }
    @keyframes ce-pulse { 0%,100%{box-shadow:0 0 8px #0ed145;} 50%{box-shadow:0 0 20px #0ed145, 0 0 30px #0ed145;} }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="ce-wrap">
        <div className="ce-box">
          <p className="ce-prompt">greencat777@bio:~$ confirm_email</p>
          {state === "loading" && (
            <>
              <div className="ce-spinner" />
              <p className="ce-sub">Confirming...</p>
            </>
          )}
          {state === "success" && (
            <>
              <div className="ce-dot" />
              <h1 className="ce-title">✓ Email Updated!</h1>
              <p className="ce-sub">Your new email is confirmed. Sign in with it next time.</p>
              <a href="/pm" className="ce-btn">→ Go to Messages</a>
            </>
          )}
          {state === "error" && (
            <>
              <h1 className="ce-title ce-error">⚠ Confirmation Failed</h1>
              <p className="ce-sub ce-error">{errMsg}</p>
              <a href="/account" className="ce-btn">← Back to Settings</a>
            </>
          )}
        </div>
      </div>
    </>
  );
}
