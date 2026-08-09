import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function DELETE(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data: userData } = await supabase.auth.getUser(authHeader.slice(7));
  const user = userData?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const { data: existing } = await supabase.from("comments").select("id, user_id").eq("id", id).single();
  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
