import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

async function getValidVouch(supabase: ReturnType<typeof createServerSupabase>, token: string) {
  const { data, error } = await supabase
    .from("vouches")
    .select("id, name, body, email, admin_approved, user_confirmed, admin_note, created_at, access_action, access_token_expires")
    .eq("access_token", token)
    .single();

  if (error || !data) return null;
  if (!data.access_token_expires || new Date(data.access_token_expires) < new Date()) return null;

  return data;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const supabase = createServerSupabase();
  const vouch = await getValidVouch(supabase, token);

  if (!vouch) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }

  // Export is read-only — burn the token as soon as it's been viewed.
  if (vouch.access_action === "export") {
    await supabase
      .from("vouches")
      .update({ access_token: null, access_token_expires: null, access_action: null })
      .eq("id", vouch.id);
  }

  return NextResponse.json({
    ok: true,
    action: vouch.access_action,
    vouch: {
      name: vouch.name,
      body: vouch.body,
      email: vouch.email,
      admin_approved: vouch.admin_approved,
      user_confirmed: vouch.user_confirmed,
      admin_note: vouch.admin_note,
      created_at: vouch.created_at,
    },
  });
}

export async function PATCH(req: Request) {
  const { token, name, body, email } = await req.json();
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });
  if (!name?.trim() || !body?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name, vouch, and email are all required." }, { status: 400 });
  }
  if (name.length > 64) return NextResponse.json({ error: "Name too long." }, { status: 400 });
  if (body.length > 1000) return NextResponse.json({ error: "Vouch too long (max 1000 chars)." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const vouch = await getValidVouch(supabase, token);

  if (!vouch || vouch.access_action !== "edit") {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }

  const { error } = await supabase
    .from("vouches")
    .update({
      name: name.trim(),
      body: body.trim(),
      email: email.trim().toLowerCase(),
      admin_approved: false, // edits go back into review
      access_token: null,
      access_token_expires: null,
      access_action: null,
    })
    .eq("id", vouch.id);

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const supabase = createServerSupabase();
  const vouch = await getValidVouch(supabase, token);

  if (!vouch || vouch.access_action !== "delete") {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
  }

  const { error } = await supabase.from("vouches").delete().eq("id", vouch.id);

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
