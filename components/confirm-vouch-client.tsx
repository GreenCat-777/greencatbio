"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type State = "loading" | "success" | "error";

export default function ConfirmVouchClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>("loading");
  const [name, setName] = useState("");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrMsg("No confirmation token found.");
      return;
    }

    fetch(`/api/vouches/confirm?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setName(data.name || "");
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
    .cc-wrap { font-family:monospace; color:#0ed145; }
    .cc-box { border:2px solid #0ed145; border-radius:12px; padding:2rem 2.5rem; background:rgba(0,0,0,0.5); box-shadow:0 0 30px rgba(14,209,69,0.3); text-align:center; }
    .cc-prompt { font-size:0.85rem; opacity:0.5; margin:0 0 8px; letter-spacing:0.08em; }
    .cc-title { font-size:1.6rem; font-weight:bold; color:#0ed145; margin:0 0 12px; text-shadow:0 0 12px rgba(14,209,69,0.5); }
    .cc-sub { font-size:0.9rem; color:rgba(14,209,69,0.65); line-height:1.7; margin:0 0 24px; }
    .cc-btn { display:inline-block; padding:10px 28px; border:2px solid #0ed145; border-radius:8px; color:#0ed145; text-decoration:none; font-family:monospace; font-size:0.9rem; font-weight:bold; letter-spacing:0.06em; transition:background 0.15s, color 0.15s; box-shadow:0 0 15px rgba(14,209,69,0.2); }
    .cc-btn:hover { background:#0ed145; color:black; }
    .cc-spinner { width:32px; height:32px; border:2px solid rgba(14,209,69,0.2); border-top-color:#0ed145; border-radius:50%; animation:cc-spin 0.8s linear infinite; margin:0 auto 20px; }
    @keyframes cc-spin { to { transform:rotate(360deg); } }
    .cc-error { color:#ff5555; }
    .cc-dot { width:10px; height:10px; border-radius:50%; background:#0ed145; box-shadow:0 0 8px #0ed145; margin:0 auto 20px; animation:cc-pulse 2s ease-in-out infinite; }
    @keyframes cc-pulse { 0%,100%{box-shadow:0 0 8px #0ed145;} 50%{box-shadow:0 0 20px #0ed145, 0 0 30px #0ed145;} }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="cc-wrap">
        <div className="cc-box">
          <p className="cc-prompt">greencat777@bio:~$ confirm_vouch</p>
          {state === "loading" && (
            <>
              <div className="cc-spinner" />
              <p className="cc-sub">Verifying your token...</p>
            </>
          )}
          {state === "success" && (
            <>
              <div className="cc-dot" />
              <h1 className="cc-title">✓ Vouch Confirmed!</h1>
              <p className="cc-sub">
                Thanks{name ? `, ${name}` : ""}! Your vouch is now marked as confirmed.<br />
                It will appear publicly once reviewed and approved.
              </p>
              <a href="/vouches" className="cc-btn">← Back to Vouches</a>
            </>
          )}
          {state === "error" && (
            <>
              <h1 className="cc-title cc-error">⚠ Confirmation Failed</h1>
              <p className="cc-sub cc-error">{errMsg}</p>
              <a href="/vouches" className="cc-btn">← Back to Vouches</a>
            </>
          )}
        </div>
      </div>
    </>
  );
}
