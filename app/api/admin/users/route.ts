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

  const { data: authList, error: authError } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (authError) return NextResponse.json({ error: "DB error" }, { status: 500 });

  const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_url");
  const profileById = new Map((profiles || []).map((p) => [p.id, p]));

  const users = authList.users.map((u) => ({
    id: u.id,
    email: u.email,
    email_confirmed: !!u.email_confirmed_at,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    username: profileById.get(u.id)?.username || null,
    avatar_url: profileById.get(u.id)?.avatar_url || null,
  }));

  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ ok: true, users });
}

export async function DELETE(req: Request) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const supabase = createServerSupabase();

  const { data: userData } = await supabase.auth.admin.getUserById(id);
  const email = userData?.user?.email;

  await supabase.from("comments").delete().eq("user_id", id);
  if (email) await supabase.from("vouches").delete().eq("email", email.toLowerCase());

  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
