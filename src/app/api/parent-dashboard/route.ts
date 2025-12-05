import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getBlockedPromptsSummary,
  getMentalHealthAlerts,
  acknowledgeMentalHealthAlert,
} from "@/lib/safety-mode";
import { calculateAge, getAgeTier, type SafetyFilteringLevel } from "@/types";

/**
 * Parent Dashboard API
 * Allows parents to view and manage their linked children's safety settings
 */

// GET: Fetch parent dashboard data for all linked children
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

    // Get all children linked to this parent
    const { data: children, error: childrenError } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        date_of_birth,
        safety_mode_enabled,
        safety_mode_locked,
        safety_filtering_level,
        daily_time_limit_minutes,
        weekly_time_limit_minutes,
        created_at
      `)
      .eq("parent_user_id", user.id);

    if (childrenError) {
      console.error("Error fetching children:", childrenError);
      return NextResponse.json(
        { error: "Failed to fetch linked accounts" },
        { status: 500 }
      );
    }

    if (!children || children.length === 0) {
      return NextResponse.json({
        children: [],
        message: "No linked accounts found. Share your parent link code with your child to connect.",
      });
    }

    // Fetch additional data for each child
    const childrenWithDetails = await Promise.all(
      children.map(async (child) => {
        const age = child.date_of_birth ? calculateAge(child.date_of_birth) : null;
        const ageTier = child.date_of_birth ? getAgeTier(child.date_of_birth) : null;

        // Get blocked prompts summary
        const blockedCategories = await getBlockedPromptsSummary(child.id, 7);

        // Get unacknowledged mental health alerts
        const mentalHealthAlerts = await getMentalHealthAlerts(child.id, false);

        // Get usage time for today and this week
        const { data: timeData } = await supabase.rpc("check_time_limit", {
          p_user_id: child.id,
        });

        // Get recent activity
        const { data: recentActivity } = await supabase
          .from("safety_activity_log")
          .select("activity_type, feature, created_at")
          .eq("user_id", child.id)
          .order("created_at", { ascending: false })
          .limit(10);

        return {
          id: child.id,
          email: child.email,
          fullName: child.full_name,
          dateOfBirth: child.date_of_birth,
          age,
          ageTier,
          safetySettings: {
            safetyModeEnabled: child.safety_mode_enabled,
            safetyModeLocked: child.safety_mode_locked,
            filteringLevel: child.safety_filtering_level,
          },
          timeLimits: {
            dailyLimit: child.daily_time_limit_minutes,
            weeklyLimit: child.weekly_time_limit_minutes,
            dailyUsed: timeData?.daily_used || 0,
            weeklyUsed: timeData?.weekly_used || 0,
            dailyExceeded: timeData?.daily_exceeded || false,
            weeklyExceeded: timeData?.weekly_exceeded || false,
          },
          blockedCategories,
          mentalHealthAlerts: mentalHealthAlerts.length,
          hasUnacknowledgedAlerts: mentalHealthAlerts.length > 0,
          recentActivity: recentActivity || [],
          accountCreated: child.created_at,
        };
      })
    );

    return NextResponse.json({
      children: childrenWithDetails,
      parentId: user.id,
    });
  } catch (error) {
    console.error("Parent dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load parent dashboard" },
      { status: 500 }
    );
  }
}

// POST: Update child's safety settings
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
    const {
      action,
      childId,
      safetyModeEnabled,
      filteringLevel,
      dailyTimeLimitMinutes,
      weeklyTimeLimitMinutes,
      alertId,
    } = body;

    // Verify parent-child relationship
    const { data: child, error: childError } = await supabase
      .from("profiles")
      .select("id, parent_user_id, safety_mode_locked, date_of_birth")
      .eq("id", childId)
      .single();

    if (childError || !child || child.parent_user_id !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to manage this account" },
        { status: 403 }
      );
    }

    switch (action) {
      case "update_safety_mode": {
        // Check if safety mode is locked (under 13)
        if (child.safety_mode_locked) {
          return NextResponse.json(
            { error: "Safety Mode cannot be disabled for users under 13" },
            { status: 400 }
          );
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            safety_mode_enabled: safetyModeEnabled,
            updated_at: new Date().toISOString(),
          })
          .eq("id", childId);

        if (updateError) {
          throw updateError;
        }

        // Log the change
        await supabase.from("safety_activity_log").insert({
          user_id: childId,
          activity_type: "safety_setting_changed",
          metadata: {
            changed_by: "parent",
            parent_id: user.id,
            setting: "safety_mode_enabled",
            new_value: safetyModeEnabled,
          },
        });

        return NextResponse.json({ success: true, safetyModeEnabled });
      }

      case "update_filtering_level": {
        if (!["standard", "strict", "maximum"].includes(filteringLevel)) {
          return NextResponse.json(
            { error: "Invalid filtering level" },
            { status: 400 }
          );
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            safety_filtering_level: filteringLevel as SafetyFilteringLevel,
            updated_at: new Date().toISOString(),
          })
          .eq("id", childId);

        if (updateError) {
          throw updateError;
        }

        await supabase.from("safety_activity_log").insert({
          user_id: childId,
          activity_type: "safety_setting_changed",
          metadata: {
            changed_by: "parent",
            parent_id: user.id,
            setting: "filtering_level",
            new_value: filteringLevel,
          },
        });

        return NextResponse.json({ success: true, filteringLevel });
      }

      case "update_time_limits": {
        // Validate time limits
        if (dailyTimeLimitMinutes !== undefined && dailyTimeLimitMinutes !== null) {
          if (typeof dailyTimeLimitMinutes !== 'number' || dailyTimeLimitMinutes < 0 || dailyTimeLimitMinutes > 1440) {
            return NextResponse.json(
              { error: "Daily time limit must be between 0 and 1440 minutes" },
              { status: 400 }
            );
          }
        }
        if (weeklyTimeLimitMinutes !== undefined && weeklyTimeLimitMinutes !== null) {
          if (typeof weeklyTimeLimitMinutes !== 'number' || weeklyTimeLimitMinutes < 0 || weeklyTimeLimitMinutes > 10080) {
            return NextResponse.json(
              { error: "Weekly time limit must be between 0 and 10080 minutes" },
              { status: 400 }
            );
          }
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            daily_time_limit_minutes: dailyTimeLimitMinutes ?? null,
            weekly_time_limit_minutes: weeklyTimeLimitMinutes ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", childId);

        if (updateError) {
          throw updateError;
        }

        await supabase.from("safety_activity_log").insert({
          user_id: childId,
          activity_type: "safety_setting_changed",
          metadata: {
            changed_by: "parent",
            parent_id: user.id,
            setting: "time_limits",
            daily: dailyTimeLimitMinutes,
            weekly: weeklyTimeLimitMinutes,
          },
        });

        return NextResponse.json({
          success: true,
          dailyTimeLimitMinutes,
          weeklyTimeLimitMinutes,
        });
      }

      case "acknowledge_alert": {
        if (!alertId) {
          return NextResponse.json(
            { error: "Alert ID required" },
            { status: 400 }
          );
        }

        const success = await acknowledgeMentalHealthAlert(alertId, user.id);

        if (!success) {
          return NextResponse.json(
            { error: "Failed to acknowledge alert" },
            { status: 400 }
          );
        }

        return NextResponse.json({ success: true });
      }

      case "get_mental_health_alerts": {
        const alerts = await getMentalHealthAlerts(childId, true);
        return NextResponse.json({ alerts });
      }

      case "unlink_child": {
        // Remove parent link but keep the child's account
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            parent_user_id: null,
            parent_email: null,
            parent_link_code: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", childId);

        if (updateError) {
          throw updateError;
        }

        return NextResponse.json({ success: true, message: "Account unlinked" });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Parent dashboard action error:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: 500 }
    );
  }
}
