import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

function isAuthed(req: Request): boolean {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin_session=([^;]+)/);
  return match?.[1] === process.env.ADMIN_SECRET;
}

export async function GET(req: Request) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("comments")
    .select("id, username, body, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  return NextResponse.json({ ok: true, comments: data });
}

export async function DELETE(req: Request) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const supabase = createServerSupabase();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
