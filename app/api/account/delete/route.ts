import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data: userData } = await supabase.auth.getUser(authHeader.slice(7));
  const user = userData?.user;
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fully remove everything tied to this account before removing the auth user.
  await supabase.from("comments").delete().eq("user_id", user.id);
  await supabase.from("vouches").delete().eq("email", user.email.toLowerCase());
  // messages + profiles rows cascade-delete automatically when the auth user is removed.

  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "Failed to delete account." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
