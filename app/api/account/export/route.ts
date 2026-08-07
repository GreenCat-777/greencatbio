import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data: userData } = await supabase.auth.getUser(authHeader.slice(7));
  const user = userData?.user;
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profileRes, vouchesRes, sentRes, receivedRes, commentsRes] = await Promise.all([
    supabase.from("profiles").select("username, avatar_url, created_at").eq("id", user.id).maybeSingle(),
    supabase.from("vouches").select("id, name, body, admin_approved, user_confirmed, admin_note, created_at").eq("email", user.email.toLowerCase()),
    supabase.from("messages").select("id, recipient_id, body, created_at, read_at").eq("sender_id", user.id),
    supabase.from("messages").select("id, sender_id, body, created_at, read_at").eq("recipient_id", user.id),
    supabase.from("comments").select("id, username, body, created_at").eq("user_id", user.id),
  ]);

  return NextResponse.json({
    ok: true,
    account: {
      email: user.email,
      email_verified: !!user.email_confirmed_at,
      account_created: user.created_at,
    },
    profile: profileRes.data || null,
    vouches: vouchesRes.data || [],
    messages_sent: sentRes.data || [],
    messages_received: receivedRes.data || [],
    comments: commentsRes.data || [],
  });
}
