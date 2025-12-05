import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { calculateAge, getAgeTier } from "@/types";

/**
 * Parent Link API
 * Handles parent-child account linking
 */

// Generate a cryptographically secure random 8-character code
function generateLinkCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like O, 0, I, 1
  const bytes = randomBytes(8);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

// GET: Get current user's link code (for sharing with parent)
export async function GET(request: NextRequest) {
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

    // Get or generate link code
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("parent_link_code, parent_user_id, parent_email, date_of_birth")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    // Check if already linked
    if (profile.parent_user_id) {
      // Get parent info
      const { data: parent } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", profile.parent_user_id)
        .single();

      return NextResponse.json({
        linked: true,
        parentEmail: parent?.email || profile.parent_email,
        parentName: parent?.full_name,
      });
    }

    // Generate code if doesn't exist
    let linkCode = profile.parent_link_code;
    if (!linkCode) {
      linkCode = generateLinkCode();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ parent_link_code: linkCode })
        .eq("id", user.id);

      if (updateError) {
        console.error("Failed to persist link code:", updateError);
        return NextResponse.json(
          { error: "Failed to generate link code. Please try again." },
          { status: 500 }
        );
      }
    }

    // Calculate age info
    const age = profile.date_of_birth ? calculateAge(profile.date_of_birth) : null;
    const ageTier = profile.date_of_birth ? getAgeTier(profile.date_of_birth) : null;

    return NextResponse.json({
      linked: false,
      linkCode,
      age,
      ageTier,
      instructions:
        "Share this code with your parent. They can enter it in their PenBotAI account to link with yours.",
    });
  } catch (error) {
    console.error("Get link code error:", error);
    return NextResponse.json(
      { error: "Failed to get link code" },
      { status: 500 }
    );
  }
}

// POST: Link accounts using code OR create link request
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
    const { action, linkCode, parentEmail } = body;

    switch (action) {
      case "link_with_code": {
        // Parent is linking to child using child's code
        if (!linkCode || linkCode.length !== 8) {
          return NextResponse.json(
            { error: "Invalid link code. It should be 8 characters." },
            { status: 400 }
          );
        }

        // Find child with this code
        const { data: child, error: childError } = await supabase
          .from("profiles")
          .select("id, email, full_name, date_of_birth, parent_user_id")
          .eq("parent_link_code", linkCode.toUpperCase())
          .single();

        if (childError || !child) {
          return NextResponse.json(
            { error: "Invalid link code. Please check and try again." },
            { status: 404 }
          );
        }

        // Can't link to yourself
        if (child.id === user.id) {
          return NextResponse.json(
            { error: "You cannot link to your own account" },
            { status: 400 }
          );
        }

        // Check if already linked
        if (child.parent_user_id) {
          return NextResponse.json(
            { error: "This account is already linked to a parent" },
            { status: 400 }
          );
        }

        // Calculate child's age
        const age = child.date_of_birth ? calculateAge(child.date_of_birth) : null;

        // Check if parent is actually an adult
        const { data: parentProfile } = await supabase
          .from("profiles")
          .select("date_of_birth")
          .eq("id", user.id)
          .single();

        if (parentProfile?.date_of_birth) {
          const parentAge = calculateAge(parentProfile.date_of_birth);
          if (parentAge < 18) {
            return NextResponse.json(
              { error: "Only adults (18+) can be parent accounts" },
              { status: 400 }
            );
          }
        }

        // Link the accounts
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            parent_user_id: user.id,
            parent_email: user.email,
            parent_link_code: null, // Clear the code after use
            updated_at: new Date().toISOString(),
          })
          .eq("id", child.id);

        if (updateError) {
          throw updateError;
        }

        // Log the linking (no PII stored - only parent_id for correlation)
        await supabase.from("safety_activity_log").insert({
          user_id: child.id,
          activity_type: "safety_setting_changed",
          metadata: {
            action: "parent_linked",
            parent_id: user.id,
            // Note: parent_email intentionally omitted for GDPR/COPPA compliance
            // Use parent_id to look up parent details if needed
          },
        });

        return NextResponse.json({
          success: true,
          childEmail: child.email,
          childName: child.full_name,
          childAge: age,
          message: `Successfully linked to ${child.full_name || child.email}`,
        });
      }

      case "request_parent_link": {
        // Child is requesting a parent to link
        if (!parentEmail) {
          return NextResponse.json(
            { error: "Parent email is required" },
            { status: 400 }
          );
        }

        // Generate a new link code
        const newLinkCode = generateLinkCode();

        // Update child's profile with parent email and new code
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({
            parent_email: parentEmail,
            parent_link_code: newLinkCode,
          })
          .eq("id", user.id);

        if (profileUpdateError) {
          console.error("Failed to update profile with link code:", profileUpdateError);
          return NextResponse.json(
            { error: "Failed to create link request. Please try again." },
            { status: 500 }
          );
        }

        // Create a link request record
        const { error: insertError } = await supabase.from("parent_link_requests").insert({
          child_user_id: user.id,
          parent_email: parentEmail,
          link_code: newLinkCode,
          status: "pending",
        });

        if (insertError) {
          console.error("Failed to create link request record:", insertError);
          // Non-critical - profile was updated, log but continue
        }

        // TODO: Send email to parent with link instructions

        return NextResponse.json({
          success: true,
          linkCode: newLinkCode,
          message: `Link request sent to ${parentEmail}. Share your code: ${newLinkCode}`,
        });
      }

      case "regenerate_code": {
        // Generate a new link code
        const newCode = generateLinkCode();

        const { error: regenerateError } = await supabase
          .from("profiles")
          .update({ parent_link_code: newCode })
          .eq("id", user.id);

        if (regenerateError) {
          console.error("Failed to regenerate link code:", regenerateError);
          return NextResponse.json(
            { error: "Failed to regenerate code. Please try again." },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          linkCode: newCode,
        });
      }

      case "unlink": {
        // Child wants to unlink from parent
        const { data: profile } = await supabase
          .from("profiles")
          .select("parent_user_id")
          .eq("id", user.id)
          .single();

        if (!profile?.parent_user_id) {
          return NextResponse.json(
            { error: "No parent account linked" },
            { status: 400 }
          );
        }

        // Note: We might want to notify the parent here
        // For now, just unlink
        const { error: unlinkError } = await supabase
          .from("profiles")
          .update({
            parent_user_id: null,
            parent_email: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (unlinkError) {
          console.error("Failed to unlink parent account:", unlinkError);
          return NextResponse.json(
            { error: "Failed to unlink parent account. Please try again." },
            { status: 500 }
          );
        }

        // Log the unlinking (non-critical, log error but don't fail)
        const { error: logError } = await supabase.from("safety_activity_log").insert({
          user_id: user.id,
          activity_type: "safety_setting_changed",
          metadata: {
            action: "parent_unlinked",
            previous_parent_id: profile.parent_user_id,
          },
        });

        if (logError) {
          console.error("Failed to log unlink activity:", logError);
        }

        return NextResponse.json({
          success: true,
          message: "Parent account unlinked",
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Parent link error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
