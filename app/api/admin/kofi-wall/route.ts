import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { uploadKofiAvatar } from "@/lib/kofi-wall-avatar";

function isAuthed(req: Request): boolean {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin_session=([^;]+)/);
  return match?.[1] === process.env.ADMIN_SECRET;
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("kofi_wall")
    .select("id, name, kofi_url, description, avatar_url, email, admin_approved, added_by_admin, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ entries: data });
}

// Admin adding an entry directly — auto-approved, no email needed.
export async function POST(req: Request) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, kofi_url, description, avatar_base64 } = await req.json();

  if (!name?.trim() || !kofi_url?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Name, Ko-fi link, and description are required." }, { status: 400 });
  }
  if (!isValidUrl(kofi_url.trim())) {
    return NextResponse.json({ error: "Enter a valid link (must start with https://)." }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const avatar_url = await uploadKofiAvatar(supabase, avatar_base64);

  const { data, error } = await supabase
    .from("kofi_wall")
    .insert([
      {
        name: name.trim(),
        kofi_url: kofi_url.trim(),
        description: description.trim(),
        avatar_url,
        admin_approved: true,
        added_by_admin: true,
      },
    ])
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: "Failed to create entry." }, { status: 500 });

  return NextResponse.json({ ok: true, entry: data });
}

export async function PATCH(req: Request) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, admin_approved, name, kofi_url, description, avatar_base64 } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = createServerSupabase();
  const update: Record<string, unknown> = {};

  if (admin_approved !== undefined) update.admin_approved = admin_approved;
  if (name !== undefined) {
    if (!name.trim()) return NextResponse.json({ error: "Name can't be empty." }, { status: 400 });
    update.name = name.trim();
  }
  if (kofi_url !== undefined) {
    if (!isValidUrl(kofi_url.trim())) return NextResponse.json({ error: "Invalid Ko-fi link." }, { status: 400 });
    update.kofi_url = kofi_url.trim();
  }
  if (description !== undefined) {
    if (!description.trim()) return NextResponse.json({ error: "Description can't be empty." }, { status: 400 });
    update.description = description.trim();
  }
  if (avatar_base64) {
    const avatar_url = await uploadKofiAvatar(supabase, avatar_base64);
    if (avatar_url) update.avatar_url = avatar_url;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase.from("kofi_wall").update(update).eq("id", id);

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = createServerSupabase();
  const { error } = await supabase.from("kofi_wall").delete().eq("id", id);

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
