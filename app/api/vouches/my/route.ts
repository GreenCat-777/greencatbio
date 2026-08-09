import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

async function getVerifiedEmail(req: Request, supabase: ReturnType<typeof createServerSupabase>) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const { data } = await supabase.auth.getUser(authHeader.slice(7));
  if (!data?.user?.email) return null;
  return data.user.email.toLowerCase();
}

export async function GET(req: Request) {
  const supabase = createServerSupabase();
  const email = await getVerifiedEmail(req, supabase);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("vouches")
    .select("id, name, body, admin_approved, user_confirmed, admin_note, created_at")
    .eq("email", email)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  return NextResponse.json({ ok: true, vouches: data });
}

export async function PATCH(req: Request) {
  const supabase = createServerSupabase();
  const email = await getVerifiedEmail(req, supabase);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, body } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  if (!name?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "Name and vouch body are required." }, { status: 400 });
  }
  if (name.length > 64) return NextResponse.json({ error: "Name too long." }, { status: 400 });
  if (body.length > 1000) return NextResponse.json({ error: "Vouch too long (max 1000 chars)." }, { status: 400 });

  const { data: existing } = await supabase.from("vouches").select("id, email").eq("id", id).single();
  if (!existing || existing.email.toLowerCase() !== email) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { error } = await supabase
    .from("vouches")
    .update({ name: name.trim(), body: body.trim(), admin_approved: false })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = createServerSupabase();
  const email = await getVerifiedEmail(req, supabase);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const { data: existing } = await supabase.from("vouches").select("id, email").eq("id", id).single();
  if (!existing || existing.email.toLowerCase() !== email) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { error } = await supabase.from("vouches").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
