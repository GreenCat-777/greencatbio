import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { uploadKofiAvatar } from "@/lib/kofi-wall-avatar";
import { sendEmail, buildKofiSubmissionEmail } from "@/lib/email";

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { name, kofi_url, description, avatar_base64, email } = await req.json();

    if (!name?.trim() || !kofi_url?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Name, Ko-fi link, and description are required." }, { status: 400 });
    }
    if (name.length > 64) return NextResponse.json({ error: "Name too long." }, { status: 400 });
    if (description.length > 500) return NextResponse.json({ error: "Description too long (max 500 chars)." }, { status: 400 });
    if (!isValidUrl(kofi_url.trim())) {
      return NextResponse.json({ error: "Enter a valid link (must start with https://)." }, { status: 400 });
    }
    if (email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const avatar_url = await uploadKofiAvatar(supabase, avatar_base64);

    const { data, error } = await supabase
      .from("kofi_wall")
      .insert([
        {
          name: name.trim(),
          kofi_url: kofi_url.trim(),
          description: description.trim(),
          avatar_url,
          email: email?.trim() ? email.trim().toLowerCase() : null,
          admin_approved: false,
          added_by_admin: false,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save entry." }, { status: 500 });
    }

    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL!,
        subject: `New Ko-fi wall submission from ${name.trim()}`,
        html: buildKofiSubmissionEmail({
          name: name.trim(),
          kofiUrl: kofi_url.trim(),
          description: description.trim(),
          entryId: data.id,
          siteUrl: "https://www.greencat777.xyz",
        }),
      });
    } catch (emailErr) {
      console.error("Failed to send admin email:", emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Kofi wall submission error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
