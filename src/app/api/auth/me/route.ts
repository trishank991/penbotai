import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name, plan")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || null,
        plan: profile?.plan || "free",
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { authenticated: false, user: null, error: "Failed to check auth" },
      { status: 500 }
    );
  }
}
