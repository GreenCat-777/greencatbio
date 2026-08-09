import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const supabase = createServerSupabase();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, action_type, action_token_expires, pending_email")
    .eq("action_token", token)
    .single();

  if (error || !profile || profile.action_type !== "change_email" || !profile.pending_email) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }
  if (!profile.action_token_expires || new Date(profile.action_token_expires) < new Date()) {
    return NextResponse.json({ error: "This link has expired." }, { status: 404 });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
    email: profile.pending_email,
    email_confirm: true,
  });
  if (updateError) {
    return NextResponse.json({ error: "Failed to update email." }, { status: 500 });
  }

  await supabase
    .from("profiles")
    .update({ action_token: null, action_token_expires: null, action_type: null, pending_email: null })
    .eq("id", profile.id);

  return NextResponse.json({ ok: true });
}
