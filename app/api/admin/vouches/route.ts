import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { cookies } from "next/headers";

function isAuthed(req: Request): boolean {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin_session=([^;]+)/);
  return match?.[1] === process.env.ADMIN_SECRET;
}

export async function GET(req: Request) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("vouches")
    .select("id, name, body, email, user_confirmed, admin_approved, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ vouches: data });
}

export async function PATCH(req: Request) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, admin_approved } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("vouches")
    .update({ admin_approved })
    .eq("id", id);

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
  const { error } = await supabase.from("vouches").delete().eq("id", id);

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
