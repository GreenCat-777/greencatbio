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

export default function Comments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [username, setUsername] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, []);

  async function fetchComments() {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setComments(data);
  }

  async function handleSubmit() {
    setError(null);

    if (!username.trim()) return setError("Please enter a username.");
    if (!body.trim()) return setError("Comment can't be empty.");
    if (username.length > 32) return setError("Username too long (max 32 chars).");
    if (body.length > 500) return setError("Comment too long (max 500 chars).");

    setLoading(true);
    const { error } = await supabase
      .from("comments")
      .insert([{ username: username.trim(), body: body.trim() }]);

    setLoading(false);

    if (error) {
      setError("Failed to post comment. Try again.");
    } else {
      setBody("");
      fetchComments();
    }
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

  return (
    <div className="comments-section">
      <h2 className="comments-title">Comments</h2>

      {/* Form */}
      <div className="comment-form">
        <input
          className="comment-input"
          type="text"
          placeholder="Username"
          maxLength={32}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <textarea
          className="comment-textarea"
          placeholder="Leave a comment..."
          maxLength={500}
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {error && <p className="comment-error">{error}</p>}
        <button
          className="comment-submit"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>

      {/* Comment list */}
      <div className="comment-list">
        {comments.length === 0 && (
          <p className="comment-empty">No comments yet. Be the first!</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="comment-item">
            <div className="comment-meta">
              <span className="comment-username">{c.username}</span>
              <span className="comment-time">{timeAgo(c.created_at)}</span>
            </div>
            <p className="comment-body">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
