import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/prompt-coach";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if this is a new user (created in the last minute)
      const createdAt = new Date(data.user.created_at);
      const now = new Date();
      const isNewUser = now.getTime() - createdAt.getTime() < 60000; // 1 minute

      if (isNewUser) {
        // Send welcome email for new users
        const email = data.user.email;
        const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name;

        if (email) {
          sendWelcomeEmail(email, name).catch(console.error);
        }
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL("/login?error=auth_failed", requestUrl.origin));
}
