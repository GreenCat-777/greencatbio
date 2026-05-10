import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("vouches")
    .update({ user_confirmed: true })
    .eq("confirm_token", token)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, name: data.name });
}
