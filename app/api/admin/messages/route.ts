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

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, body, created_at, read_at")
    .order("created_at", { ascending: true })
    .limit(1000);

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  const { data: profiles } = await supabase.from("profiles").select("id, username");
  const usernameById = new Map((profiles || []).map((p) => [p.id, p.username]));

  const enriched = (messages || []).map((m) => ({
    ...m,
    // whichever side isn't null is the real user; the null side is GreenCat
    other_id: m.sender_id ?? m.recipient_id,
    other_username: usernameById.get(m.sender_id ?? m.recipient_id ?? "") || "unknown",
    from_admin: m.sender_id === null,
  }));

  return NextResponse.json({ ok: true, messages: enriched });
}

export async function POST(req: Request) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipientId, body } = await req.json();
  if (!recipientId || !body?.trim()) {
    return NextResponse.json({ error: "Missing recipientId or body." }, { status: 400 });
  }
  if (body.length > 2000) return NextResponse.json({ error: "Message too long." }, { status: 400 });

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("messages")
    .insert([{ sender_id: null, recipient_id: recipientId, body: body.trim() }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  return NextResponse.json({ ok: true, message: data });
}

export async function PATCH(req: Request) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { otherId } = await req.json();
  if (!otherId) return NextResponse.json({ error: "Missing otherId." }, { status: 400 });

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", otherId)
    .is("recipient_id", null)
    .is("read_at", null);

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const supabase = createServerSupabase();
  const { error } = await supabase.from("messages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
