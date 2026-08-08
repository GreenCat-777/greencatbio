"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type State = "loading" | "success" | "error";

export default function VerifyAccountClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>("loading");
  const [username, setUsername] = useState("");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrMsg("No verification token found.");
      return;
    }

    fetch(`/api/account/verify?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setUsername(data.username || "");
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
    .va-wrap { font-family:monospace; color:#0ed145; }
    .va-box { border:2px solid #0ed145; border-radius:12px; padding:2rem 2.5rem; background:rgba(0,0,0,0.5); box-shadow:0 0 30px rgba(14,209,69,0.3); text-align:center; }
    .va-prompt { font-size:0.85rem; opacity:0.5; margin:0 0 8px; letter-spacing:0.08em; }
    .va-title { font-size:1.6rem; font-weight:bold; color:#0ed145; margin:0 0 12px; text-shadow:0 0 12px rgba(14,209,69,0.5); }
    .va-sub { font-size:0.9rem; color:rgba(14,209,69,0.65); line-height:1.7; margin:0 0 24px; }
    .va-btn { display:inline-block; padding:10px 28px; border:2px solid #0ed145; border-radius:8px; color:#0ed145; text-decoration:none; font-family:monospace; font-size:0.9rem; font-weight:bold; letter-spacing:0.06em; transition:background 0.15s, color 0.15s; box-shadow:0 0 15px rgba(14,209,69,0.2); }
    .va-btn:hover { background:#0ed145; color:black; }
    .va-spinner { width:32px; height:32px; border:2px solid rgba(14,209,69,0.2); border-top-color:#0ed145; border-radius:50%; animation:va-spin 0.8s linear infinite; margin:0 auto 20px; }
    @keyframes va-spin { to { transform:rotate(360deg); } }
    .va-error { color:#ff5555; }
    .va-dot { width:10px; height:10px; border-radius:50%; background:#0ed145; box-shadow:0 0 8px #0ed145; margin:0 auto 20px; animation:va-pulse 2s ease-in-out infinite; }
    @keyframes va-pulse { 0%,100%{box-shadow:0 0 8px #0ed145;} 50%{box-shadow:0 0 20px #0ed145, 0 0 30px #0ed145;} }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="va-wrap">
        <div className="va-box">
          <p className="va-prompt">greencat777@bio:~$ verify_account</p>
          {state === "loading" && (
            <>
              <div className="va-spinner" />
              <p className="va-sub">Verifying...</p>
            </>
          )}
          {state === "success" && (
            <>
              <div className="va-dot" />
              <h1 className="va-title">✓ Account Verified!</h1>
              <p className="va-sub">
                {username && `Welcome, ${username}. `}Your account is fully active — you can now message GreenCat directly.
              </p>
              <a href="/pm" className="va-btn">→ Go to Messages</a>
            </>
          )}
          {state === "error" && (
            <>
              <h1 className="va-title va-error">⚠ Verification Failed</h1>
              <p className="va-sub va-error">{errMsg}</p>
              <a href="/pm" className="va-btn">← Back to Sign In</a>
            </>
          )}
        </div>
      </div>
    </>
  );
}
