import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

// This webhook can be configured in Supabase to trigger on new user signup
// Database -> Webhooks -> Add webhook on auth.users INSERT
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (optional but recommended)
    const webhookSecret = request.headers.get("x-webhook-secret");
    if (
      process.env.SUPABASE_WEBHOOK_SECRET &&
      webhookSecret !== process.env.SUPABASE_WEBHOOK_SECRET
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Supabase sends the record in different formats depending on the event
    const { type, record, table } = body;

    // Handle new user signup
    if (table === "users" && type === "INSERT") {
      const email = record.email;
      const name = record.raw_user_meta_data?.full_name || record.raw_user_meta_data?.name;

      if (email) {
        await sendWelcomeEmail(email, name);
        console.log(`Welcome email sent to ${email}`);
      }

      return NextResponse.json({ success: true, action: "welcome_email_sent" });
    }

    return NextResponse.json({ success: true, action: "no_action" });
  } catch (error) {
    console.error("Supabase webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
