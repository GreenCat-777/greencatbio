import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { cookies } from "next/headers";

async function isAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return session?.value === process.env.ADMIN_SECRET;
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("vouches")
    .select("id, name, body, user_confirmed, admin_approved, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ vouches: data });
}

export async function PATCH(req: Request) {
  if (!(await isAuthed())) {
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
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = createServerSupabase();
  const { error } = await supabase.from("vouches").delete().eq("id", id);

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
