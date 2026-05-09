"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Comment = {
  id: string;
  username: string;
  body: string;
  created_at: string;
};

function Avatar({ name }: { name: string }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      border: "2px solid #0ed145", background: "rgba(14,209,69,0.08)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace", fontWeight: "bold", fontSize: 14,
      color: "#0ed145", flexShrink: 0, boxShadow: "0 0 8px rgba(14,209,69,0.3)",
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Comments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [username, setUsername] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { fetchComments(); }, []);

  async function fetchComments() {
    setFetching(true);
    const { data, error } = await supabase
      .from("comments").select("*").order("created_at", { ascending: false });
    if (!error && data) setComments(data);
    setFetching(false);
  }

  async function handleSubmit() {
    setError(null); setSuccess(false);
    if (!username.trim()) return setError("Username required.");
    if (!body.trim()) return setError("Comment can't be empty.");
    if (username.length > 32) return setError("Username too long (max 32).");
    if (body.length > 500) return setError("Too long (max 500 chars).");
    setLoading(true);
    const { error } = await supabase
      .from("comments").insert([{ username: username.trim(), body: body.trim() }]);
    setLoading(false);
    if (error) {
      setError("Failed to post. Try again.");
    } else {
      setBody(""); setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchComments();
    }
  }

  const css = `
    .gc-comments { font-family: monospace; color: #0ed145; border: 2px solid #0ed145; border-radius: 12px; padding: 1.5rem; background: rgba(0,0,0,0.5); box-shadow: 0 0 24px rgba(14,209,69,0.25); }
    .gc-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(14,209,69,0.2); }
    .gc-dot { width: 8px; height: 8px; border-radius: 50%; background: #0ed145; box-shadow: 0 0 6px #0ed145; }
    .gc-title { font-size: 0.95rem; font-weight: bold; letter-spacing: 0.08em; opacity: 0.9; }
    .gc-count { margin-left: auto; font-size: 0.75rem; opacity: 0.45; }
    .gc-form { background: rgba(14,209,69,0.03); border: 1px solid rgba(14,209,69,0.2); border-radius: 8px; padding: 1rem; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; }
    .gc-row { display: flex; gap: 0.6rem; align-items: center; }
    .gc-input { flex: 1; background: transparent; border: 1px solid rgba(14,209,69,0.35); border-radius: 6px; padding: 0.45rem 0.7rem; color: #0ed145; font-family: monospace; font-size: 0.875rem; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
    .gc-input:focus { border-color: #0ed145; box-shadow: 0 0 8px rgba(14,209,69,0.25); }
    .gc-input::placeholder { color: rgba(14,209,69,0.35); }
    .gc-textarea { width: 100%; background: transparent; border: 1px solid rgba(14,209,69,0.35); border-radius: 6px; padding: 0.5rem 0.7rem; color: #0ed145; font-family: monospace; font-size: 0.875rem; outline: none; resize: vertical; min-height: 80px; box-sizing: border-box; transition: border-color 0.15s, box-shadow 0.15s; }
    .gc-textarea:focus { border-color: #0ed145; box-shadow: 0 0 8px rgba(14,209,69,0.25); }
    .gc-textarea::placeholder { color: rgba(14,209,69,0.35); }
    .gc-char { font-size: 0.7rem; opacity: 0.35; text-align: right; margin-top: -4px; }
    .gc-footer { display: flex; align-items: center; justify-content: space-between; }
    .gc-error { font-size: 0.78rem; color: #ff5555; }
    .gc-success { font-size: 0.78rem; color: #0ed145; opacity: 0.7; }
    .gc-btn { padding: 0.45rem 1.4rem; border: 2px solid #0ed145; border-radius: 6px; background: transparent; color: #0ed145; font-family: monospace; font-size: 0.875rem; font-weight: bold; cursor: pointer; letter-spacing: 0.05em; transition: background 0.15s, color 0.15s; }
    .gc-btn:hover:not(:disabled) { background: #0ed145; color: black; }
    .gc-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .gc-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .gc-empty { opacity: 0.4; font-size: 0.85rem; text-align: center; padding: 1.5rem 0; }
    .gc-item { display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.75rem; border: 1px solid rgba(14,209,69,0.15); border-radius: 8px; background: rgba(14,209,69,0.02); transition: border-color 0.15s; }
    .gc-item:hover { border-color: rgba(14,209,69,0.3); }
    .gc-item-body { flex: 1; min-width: 0; }
    .gc-meta { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.3rem; }
    .gc-uname { font-weight: bold; font-size: 0.85rem; }
    .gc-time { font-size: 0.7rem; opacity: 0.4; }
    .gc-body { font-size: 0.875rem; line-height: 1.55; opacity: 0.88; white-space: pre-wrap; word-break: break-word; margin: 0; }
    .gc-hint { font-size: 0.7rem; opacity: 0.3; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="gc-comments">
        {/* Header */}
        <div className="gc-header">
          <span className="gc-dot" />
          <span className="gc-title">// COMMENTS</span>
          <span className="gc-count">
            {fetching ? "..." : `${comments.length} post${comments.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Form */}
        <div className="gc-form">
          <div className="gc-row">
            <input
              className="gc-input"
              type="text"
              placeholder="username"
              maxLength={32}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <span className="gc-hint">{username.length}/32</span>
          </div>
          <textarea
            className="gc-textarea"
            placeholder="leave a comment..."
            maxLength={500}
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <p className="gc-char">{body.length}/500</p>
          <div className="gc-footer">
            <span>
              {error && <span className="gc-error">⚠ {error}</span>}
              {success && <span className="gc-success">✓ posted!</span>}
            </span>
            <button className="gc-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? "posting..." : "→ post"}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="gc-list">
          {fetching ? (
            <p className="gc-empty">loading...</p>
          ) : comments.length === 0 ? (
            <p className="gc-empty">no comments yet — be the first.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="gc-item">
                <Avatar name={c.username} />
                <div className="gc-item-body">
                  <div className="gc-meta">
                    <span className="gc-uname">{c.username}</span>
                    <span className="gc-time">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="gc-body">{c.body}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
