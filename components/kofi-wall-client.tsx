"use client";

import { useEffect, useState } from "react";
import { useAccount } from "@/lib/use-account";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";

type KofiEntry = {
  id: string;
  name: string;
  kofi_url: string;
  description: string;
  avatar_url: string | null;
};

const MAX_AVATAR_DIM = 256;

function resizeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Not an image."));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("Image too large (max 8MB)."));

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = MAX_AVATAR_DIM;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unsupported."));
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Couldn't read image."));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Couldn't read file."));
    reader.readAsDataURL(file);
  });
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className="kw-avatar-img" />;
  }
  return <div className="kw-avatar-fallback">{name.charAt(0).toUpperCase()}</div>;
}

type OptionsStep = "menu" | "edit" | "remove";

function EntryOptionsModal({ entryName, onClose }: { entryName: string; onClose: () => void }) {
  const [step, setStep] = useState<OptionsStep>("menu");

  return (
    <div className="kwm-overlay" onClick={onClose}>
      <div className="kwm-box" onClick={(e) => e.stopPropagation()}>
        <button className="kwm-close" onClick={onClose} aria-label="Close">✕</button>

        {step === "menu" && (
          <>
            <p className="kwm-title">Manage &quot;{entryName}&quot;</p>
            <p className="kwm-sub">Is this your Ko-fi?</p>
            <div className="kwm-btns">
              <button className="kwm-btn" onClick={() => setStep("edit")}>
                ✎ Edit name, description, or photo
              </button>
              <button className="kwm-btn kwm-btn-danger" onClick={() => setStep("remove")}>
                🗑 Remove this entry
              </button>
            </div>
          </>
        )}

        {step === "edit" && (
          <>
            <p className="kwm-title">✎ Edit this entry</p>
            <p className="kwm-sub">
              If this is your Ko-fi and you wish to edit the description, name, profile image, or other, contact{" "}
              <a href="/social" className="kwm-link">GreenCat</a>.
            </p>
            <div className="kwm-btns kwm-btns-row">
              <button className="kwm-btn kwm-btn-ghost" onClick={() => setStep("menu")}>← Back</button>
              <a className="kwm-btn kwm-btn-cta" href="/social">→ Contact GreenCat</a>
            </div>
          </>
        )}

        {step === "remove" && (
          <>
            <p className="kwm-title">🗑 Remove this entry</p>
            <p className="kwm-sub">
              If this is your Ko-fi and you wish to remove it from the page, please contact{" "}
              <a href="/social" className="kwm-link">GreenCat</a>.
            </p>
            <div className="kwm-btns kwm-btns-row">
              <button className="kwm-btn kwm-btn-ghost" onClick={() => setStep("menu")}>← Back</button>
              <a className="kwm-btn kwm-btn-cta" href="/social">→ Contact GreenCat</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function KofiWallClient() {
  const { session, profile } = useAccount();

  const [entries, setEntries] = useState<KofiEntry[]>([]);
  const [fetching, setFetching] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [kofiUrl, setKofiUrl] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [openOptionsFor, setOpenOptionsFor] = useState<KofiEntry | null>(null);

  useEffect(() => { fetchEntries(); }, []);

  useEffect(() => {
    if (profile) {
      setName((n) => n || profile.username);
      if (profile.avatar_url) setAvatarPreview((a) => a || profile.avatar_url);
    }
    if (session?.user.email) setEmail((e) => e || session.user.email!);
  }, [profile, session]);

  async function fetchEntries() {
    setFetching(true);
    const { data } = await supabase
      .from("kofi_wall")
      .select("id, name, kofi_url, description, avatar_url")
      .eq("admin_approved", true)
      .order("name", { ascending: true });
    if (data) setEntries(data);
    setFetching(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    try {
      const b64 = await resizeImageToBase64(file);
      setAvatarPreview(b64);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Couldn't process image.");
    }
  }

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) return setError("Name is required.");
    if (!kofiUrl.trim()) return setError("Ko-fi link is required.");
    if (!/^https?:\/\//.test(kofiUrl.trim())) return setError("Ko-fi link must start with https://");
    if (!description.trim()) return setError("Description is required.");
    if (description.length > 500) return setError("Description too long (max 500 chars).");
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Invalid email.");

    setLoading(true);
    try {
      const res = await fetch("/api/kofi-wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          kofi_url: kofiUrl.trim(),
          description: description.trim(),
          email: email.trim() || undefined,
          avatar_base64: avatarPreview?.startsWith("data:") ? avatarPreview : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed.");
      } else {
        setSubmitted(true);
        setName(""); setKofiUrl(""); setDescription(""); setEmail(""); setAvatarPreview(null);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  const css = `
    .kw-wrap { font-family: monospace; color: #0ed145; }
    .kw-header { display:flex; align-items:center; gap:0.5rem; margin-bottom:1.25rem; padding-bottom:0.75rem; border-bottom:1px solid rgba(14,209,69,0.2); flex-wrap:wrap; }
    .kw-dot { width:8px; height:8px; border-radius:50%; background:#0ed145; box-shadow:0 0 6px #0ed145; }
    .kw-title { font-size:0.95rem; font-weight:bold; letter-spacing:0.08em; opacity:0.9; }
    .kw-count { margin-left:8px; font-size:0.75rem; opacity:0.45; }
    .kw-home { margin-left:auto; font-size:0.78rem; color:rgba(14,209,69,0.6); text-decoration:none; border:1px solid rgba(14,209,69,0.3); border-radius:5px; padding:3px 12px; transition:all 0.15s; }
    .kw-home:hover { color:#0ed145; border-color:#0ed145; }
    .kw-intro { font-size:0.85rem; opacity:0.6; line-height:1.6; margin:0 0 1.25rem; }
    .kw-toggle { padding:0.55rem 1.25rem; border:2px solid #0ed145; border-radius:6px; background:transparent; color:#0ed145; font-family:monospace; font-size:0.85rem; font-weight:bold; cursor:pointer; letter-spacing:0.04em; transition:background 0.15s, color 0.15s; margin-bottom:1.5rem; }
    .kw-toggle:hover { background:#0ed145; color:#000; }
    .kw-form { background:rgba(14,209,69,0.03); border:1px solid rgba(14,209,69,0.2); border-radius:8px; padding:1.25rem; margin-bottom:1.75rem; display:flex; flex-direction:column; gap:0.65rem; }
    .kw-section-label { font-size:0.75rem; opacity:0.4; letter-spacing:0.1em; margin-bottom:0.25rem; }
    .kw-input { width:100%; background:transparent; border:1px solid rgba(14,209,69,0.35); border-radius:6px; padding:0.5rem 0.75rem; color:#0ed145; font-family:monospace; font-size:0.875rem; outline:none; box-sizing:border-box; transition:border-color 0.15s, box-shadow 0.15s; }
    .kw-input:focus { border-color:#0ed145; box-shadow:0 0 8px rgba(14,209,69,0.25); }
    .kw-input::placeholder { color:rgba(14,209,69,0.35); }
    .kw-textarea { width:100%; background:transparent; border:1px solid rgba(14,209,69,0.35); border-radius:6px; padding:0.5rem 0.75rem; color:#0ed145; font-family:monospace; font-size:0.875rem; outline:none; resize:vertical; min-height:80px; box-sizing:border-box; }
    .kw-textarea:focus { border-color:#0ed145; box-shadow:0 0 8px rgba(14,209,69,0.25); }
    .kw-textarea::placeholder { color:rgba(14,209,69,0.35); }
    .kw-char { font-size:0.7rem; opacity:0.35; text-align:right; margin-top:-4px; }
    .kw-hint { font-size:0.7rem; opacity:0.35; }
    .kw-avatar-row { display:flex; align-items:center; gap:0.85rem; }
    .kw-avatar-preview { width:56px; height:56px; border-radius:50%; object-fit:cover; border:2px solid #0ed145; box-shadow:0 0 10px rgba(14,209,69,0.3); flex-shrink:0; }
    .kw-avatar-placeholder { width:56px; height:56px; border-radius:50%; border:2px dashed rgba(14,209,69,0.35); display:flex; align-items:center; justify-content:center; font-size:0.65rem; opacity:0.4; text-align:center; flex-shrink:0; }
    .kw-file-btn { padding:0.4rem 1rem; border:1px solid rgba(14,209,69,0.4); border-radius:6px; background:transparent; color:rgba(14,209,69,0.8); font-family:monospace; font-size:0.78rem; cursor:pointer; transition:all 0.15s; }
    .kw-file-btn:hover { border-color:#0ed145; color:#0ed145; }
    .kw-footer { display:flex; align-items:center; justify-content:space-between; gap:0.5rem; flex-wrap:wrap; }
    .kw-error { font-size:0.78rem; color:#ff5555; }
    .kw-btn { padding:0.5rem 1.5rem; border:2px solid #0ed145; border-radius:6px; background:transparent; color:#0ed145; font-family:monospace; font-size:0.875rem; font-weight:bold; cursor:pointer; letter-spacing:0.05em; transition:background 0.15s, color 0.15s; white-space:nowrap; }
    .kw-btn:hover:not(:disabled) { background:#0ed145; color:black; }
    .kw-btn:disabled { opacity:0.45; cursor:not-allowed; }
    .kw-success-box { background:rgba(14,209,69,0.05); border:1px solid rgba(14,209,69,0.3); border-radius:8px; padding:1.25rem 1.5rem; margin-bottom:1.75rem; }
    .kw-success-title { font-size:1rem; font-weight:bold; color:#0ed145; margin:0 0 6px; }
    .kw-success-sub { font-size:0.82rem; color:rgba(14,209,69,0.6); margin:0; line-height:1.6; }
    .kw-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr)); gap:1rem; }
    .kw-empty { opacity:0.4; font-size:0.85rem; text-align:center; padding:2rem 0; grid-column:1/-1; }
    .kw-card { position:relative; display:flex; flex-direction:column; align-items:center; text-align:center; gap:0.6rem; padding:1.5rem 1rem 1.25rem; border:1px solid rgba(14,209,69,0.2); border-radius:10px; background:rgba(14,209,69,0.02); transition:border-color 0.15s, transform 0.15s; animation:kw-fadein 0.35s ease; }
    .kw-card:hover { border-color:rgba(14,209,69,0.5); transform:translateY(-2px); }
    @keyframes kw-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    .kw-dots-btn { position:absolute; top:6px; right:6px; background:transparent; border:none; color:rgba(14,209,69,0.35); font-size:1.1rem; line-height:1; cursor:pointer; padding:3px 8px; border-radius:5px; transition:color 0.15s, background 0.15s; }
    .kw-dots-btn:hover { color:#0ed145; background:rgba(14,209,69,0.1); }
    .kw-avatar-img { width:64px; height:64px; border-radius:50%; object-fit:cover; border:2px solid #0ed145; box-shadow:0 0 10px rgba(14,209,69,0.3); }
    .kw-avatar-fallback { width:64px; height:64px; border-radius:50%; border:2px solid #0ed145; background:rgba(14,209,69,0.08); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.3rem; color:#0ed145; box-shadow:0 0 10px rgba(14,209,69,0.3); }
    .kw-card-name { font-weight:bold; font-size:0.95rem; word-break:break-word; }
    .kw-card-desc { font-size:0.8rem; opacity:0.7; line-height:1.5; word-break:break-word; margin:0; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; min-height:2.25em; }
    .kw-card-btn { margin-top:auto; padding:0.45rem 1.1rem; border:2px solid #0ed145; border-radius:6px; background:transparent; color:#0ed145; font-family:monospace; font-size:0.78rem; font-weight:bold; text-decoration:none; letter-spacing:0.03em; transition:background 0.15s, color 0.15s; }
    .kw-card-btn:hover { background:#0ed145; color:#000; }
    .kwm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); display:flex; align-items:center; justify-content:center; z-index:9999; padding:1rem; }
    .kwm-box { position:relative; font-family:monospace; color:#0ed145; border:2px solid #0ed145; border-radius:12px; padding:1.75rem; background:#0a0a0a; box-shadow:0 0 30px rgba(14,209,69,0.35); max-width:380px; width:100%; }
    .kwm-close { position:absolute; top:10px; right:12px; background:transparent; border:none; color:rgba(14,209,69,0.5); font-size:1rem; cursor:pointer; }
    .kwm-close:hover { color:#0ed145; }
    .kwm-title { font-size:1.05rem; font-weight:bold; margin:0 0 6px; }
    .kwm-sub { font-size:0.82rem; opacity:0.65; line-height:1.6; margin:0 0 18px; }
    .kwm-btns { display:flex; flex-direction:column; gap:0.5rem; }
    .kwm-btns-row { flex-direction:row; justify-content:flex-end; }
    .kwm-btn { padding:8px 16px; border:1px solid rgba(14,209,69,0.4); border-radius:6px; background:transparent; color:#0ed145; font-family:monospace; font-size:0.82rem; cursor:pointer; text-align:left; text-decoration:none; display:inline-block; transition:all 0.15s; }
    .kwm-btn:hover { border-color:#0ed145; background:rgba(14,209,69,0.1); }
    .kwm-btn-danger { border-color:rgba(255,85,85,0.4); color:#ff5555; }
    .kwm-btn-danger:hover { border-color:#ff5555; background:rgba(255,85,85,0.1); }
    .kwm-btn-ghost { border-color:rgba(14,209,69,0.2); color:rgba(14,209,69,0.5); text-align:center; }
    .kwm-btn-cta { border-color:#0ed145; background:#0ed145; color:#000; font-weight:bold; text-align:center; }
    .kwm-btn-cta:hover { background:transparent; color:#0ed145; }
    .kwm-link { color:#0ed145; text-decoration:underline; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="kw-wrap">
        <div className="kw-header">
          <span className="kw-dot" />
          <span className="kw-title">// KINDLE KO-FI WALL</span>
          <span className="kw-count">
            {fetching ? "..." : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
          </span>
          <a href="/" className="kw-home">← home</a>
        </div>

        <p className="kw-intro">
          A directory of Ko-fi links for people in the Kindle modding community. Tap a card to support them directly.
        </p>

        {submitted ? (
          <div className="kw-success-box">
            <p className="kw-success-title">✓ Submitted!</p>
            <p className="kw-success-sub">Your entry is pending review and will appear here once approved.</p>
          </div>
        ) : formOpen ? (
          <div className="kw-form">
            <p className="kw-section-label">// ADD YOURSELF TO THE WALL</p>

            <div className="kw-avatar-row">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="preview" className="kw-avatar-preview" />
              ) : (
                <div className="kw-avatar-placeholder">no pic</div>
              )}
              <label className="kw-file-btn">
                {avatarPreview ? "change photo" : "upload photo (optional)"}
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
              </label>
            </div>
            {avatarError && <p className="kw-error">⚠ {avatarError}</p>}

            <input
              className="kw-input"
              type="text"
              placeholder="your name"
              maxLength={64}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="kw-input"
              type="url"
              placeholder="your ko-fi link (https://ko-fi.com/...)"
              value={kofiUrl}
              onChange={(e) => setKofiUrl(e.target.value)}
            />
            <textarea
              className="kw-textarea"
              placeholder="what do you do in the Kindle community? (max 500 chars)"
              maxLength={500}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="kw-char">{description.length}/500</p>
            <input
              className="kw-input"
              type="email"
              placeholder="your email (optional, private, in case we need to reach you)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <span className="kw-hint">🔒 email is never shown publicly</span>

            <div className="kw-footer">
              <span>{error && <span className="kw-error">⚠ {error}</span>}</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="kw-btn" style={{ borderColor: "rgba(14,209,69,0.3)", color: "rgba(14,209,69,0.6)" }} onClick={() => setFormOpen(false)} disabled={loading}>
                  cancel
                </button>
                <button className="kw-btn" onClick={handleSubmit} disabled={loading}>
                  {loading ? "sending..." : "→ submit entry"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button className="kw-toggle" onClick={() => setFormOpen(true)}>
            + add yourself to the wall
          </button>
        )}

        <div className="kw-grid">
          {fetching ? (
            <p className="kw-empty">loading entries...</p>
          ) : entries.length === 0 ? (
            <p className="kw-empty">no entries yet — be the first.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="kw-card">
                <button
                  className="kw-dots-btn"
                  onClick={() => setOpenOptionsFor(entry)}
                  aria-label={`Options for ${entry.name}`}
                >
                  ⋮
                </button>
                <Avatar name={entry.name} url={entry.avatar_url} />
                <p className="kw-card-name">{entry.name}</p>
                <p className="kw-card-desc" title={entry.description}>{entry.description}</p>
                <a
                  className="kw-card-btn"
                  href={entry.kofi_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ☕ Donate on Ko-fi
                </a>
              </div>
            ))
          )}
        </div>
      </div>

      {openOptionsFor && (
        <EntryOptionsModal
          entryName={openOptionsFor.name}
          onClose={() => setOpenOptionsFor(null)}
        />
      )}
    </>
  );
}
