import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendDisclosureEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { disclosure, assignmentType, email } = body;

    if (!disclosure || !assignmentType) {
      return NextResponse.json(
        { error: "Missing disclosure or assignment type" },
        { status: 400 }
      );
    }

    // Use provided email or user's email
    const targetEmail = email || user.email;

    if (!targetEmail) {
      return NextResponse.json(
        { error: "No email address available" },
        { status: 400 }
      );
    }

    const result = await sendDisclosureEmail(targetEmail, disclosure, assignmentType);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Disclosure sent to ${targetEmail}`,
    });
  } catch (error) {
    console.error("Email disclosure error:", error);
    return NextResponse.json(
      { error: "Failed to send disclosure email" },
      { status: 500 }
    );
  }
}
