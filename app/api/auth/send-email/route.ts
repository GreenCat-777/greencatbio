import { NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { sendEmail, buildAuthEmail } from "@/lib/email";

type HookPayload = {
  user: { email: string };
  email_data: {
    token_hash: string;
    redirect_to: string;
    email_action_type: "signup" | "recovery" | "email_change" | "magiclink" | "invite";
  };
};

const SUBJECTS: Record<string, string> = {
  signup: "Confirm your GreenCat777 account",
  recovery: "Reset your GreenCat777 password",
  email_change: "Confirm your new email — GreenCat777",
};

export async function POST(req: Request) {
  try {
    const hookSecret = process.env.SEND_EMAIL_HOOK_SECRET;
    if (!hookSecret) {
      console.error("SEND_EMAIL_HOOK_SECRET is not set in this deployment's env vars.");
      return NextResponse.json(
        { error: { http_code: 500, message: "Server misconfigured: missing hook secret." } },
        { status: 500 }
      );
    }

    const rawBody = await req.text();
    const wh = new Webhook(hookSecret);

    let payload: HookPayload;
    try {
      payload = wh.verify(rawBody, {
        "webhook-id": req.headers.get("webhook-id") || "",
        "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
        "webhook-signature": req.headers.get("webhook-signature") || "",
      }) as HookPayload;
    } catch (verifyErr) {
      console.error("Webhook signature verification failed:", verifyErr);
      return NextResponse.json(
        { error: { http_code: 401, message: "Invalid webhook signature." } },
        { status: 401 }
      );
    }

    const { user, email_data } = payload;
    if (!user?.email || !email_data?.token_hash) {
      console.error("Malformed hook payload:", JSON.stringify(payload));
      return NextResponse.json(
        { error: { http_code: 400, message: "Malformed payload." } },
        { status: 400 }
      );
    }

    const { token_hash, redirect_to, email_action_type } = email_data;

    // Only signup / recovery / email_change are used by this app.
    if (!SUBJECTS[email_action_type]) {
      return NextResponse.json({ ok: true }); // nothing to send, don't error out
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("NEXT_PUBLIC_SUPABASE_URL is not set in this deployment's env vars.");
      return NextResponse.json(
        { error: { http_code: 500, message: "Server misconfigured: missing Supabase URL." } },
        { status: 500 }
      );
    }

    const confirmationUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`;

    await sendEmail({
      to: user.email,
      subject: SUBJECTS[email_action_type],
      html: buildAuthEmail({
        kind: email_action_type as "signup" | "recovery" | "email_change",
        confirmationUrl,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unhandled error in send-email hook:", err);
    return NextResponse.json(
      { error: { http_code: 500, message: err instanceof Error ? err.message : "Unknown error." } },
      { status: 500 }
    );
  }
}