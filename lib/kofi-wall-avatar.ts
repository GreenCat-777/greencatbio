import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB, client already resizes/compresses before sending
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Decodes a `data:<mime>;base64,<data>` string, uploads it to the
 * public "kofi-wall" storage bucket, and returns the public URL.
 * Returns null (and never throws) if the input is missing/invalid so
 * callers can just skip setting avatar_url.
 */
export async function uploadKofiAvatar(
  supabase: SupabaseClient,
  dataUrl: string | undefined | null
): Promise<string | null> {
  if (!dataUrl) return null;

  const match = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;

  const mime = match[1];
  const ext = ALLOWED_TYPES[mime];
  if (!ext) return null;

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0 || buffer.length > MAX_BYTES) return null;

  const path = `avatars/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("kofi-wall")
    .upload(path, buffer, { contentType: mime, upsert: false });

  if (error) {
    console.error("kofi-wall avatar upload error:", error);
    return null;
  }

  const { data } = supabase.storage.from("kofi-wall").getPublicUrl(path);
  return data.publicUrl;
}
