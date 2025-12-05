/**
 * Safety Mode Service
 * ScholarSync Legal Compliance Framework
 *
 * Multi-layer content filtering for users with Safety Mode enabled.
 * Implements COPPA, KOSA, UK AADC, and AU OSA requirements.
 */

import { createClient } from "@/lib/supabase/server";
import {
  SafetyFilterCategory,
  SafetyFilterResult,
  SafetyFilteringLevel,
  AgeTier,
  getAgeTier,
  calculateAge,
} from "@/types";

// ==================== FILTER PATTERNS ====================
// These patterns are designed to catch harmful content while minimizing false positives
// for legitimate educational queries

interface FilterPattern {
  pattern: RegExp;
  category: SafetyFilterCategory;
  severity: "low" | "medium" | "high" | "critical";
  minLevel: SafetyFilteringLevel; // Minimum filtering level to trigger
  description: string;
}

// Self-harm related patterns
const SELF_HARM_PATTERNS: FilterPattern[] = [
  {
    pattern: /\b(how\s+to\s+)?(kill\s+myself|commit\s+suicide|end\s+(my\s+)?life|suicide\s+method)/i,
    category: "self_harm",
    severity: "critical",
    minLevel: "standard",
    description: "Suicide-related query",
  },
  {
    pattern: /\b(cutting|self.?harm|hurt\s+myself|ways\s+to\s+die)\b/i,
    category: "self_harm",
    severity: "critical",
    minLevel: "standard",
    description: "Self-harm query",
  },
  {
    pattern: /\b(ana|mia|thinspo|pro.?ana|fasting\s+tips|purging\s+methods)\b/i,
    category: "self_harm",
    severity: "high",
    minLevel: "standard",
    description: "Eating disorder content",
  },
  {
    pattern: /\b(dangerous\s+challenge|choking\s+game|blackout\s+challenge|tide\s+pod)\b/i,
    category: "self_harm",
    severity: "critical",
    minLevel: "standard",
    description: "Dangerous viral challenge",
  },
];

// Violence-related patterns
const VIOLENCE_PATTERNS: FilterPattern[] = [
  {
    pattern: /\b(how\s+to\s+)?(make|build|create)\s+(a\s+)?(bomb|explosive|weapon|gun)\b/i,
    category: "violence",
    severity: "critical",
    minLevel: "standard",
    description: "Weapon creation query",
  },
  {
    pattern: /\b(how\s+to\s+)?(kill|murder|assassinate|harm)\s+(someone|a\s+person|people)\b/i,
    category: "violence",
    severity: "critical",
    minLevel: "standard",
    description: "Violence against others",
  },
  {
    pattern: /\b(fight\s+techniques|how\s+to\s+punch|beat\s+up|attack\s+someone)\b/i,
    category: "violence",
    severity: "high",
    minLevel: "strict",
    description: "Fighting techniques",
  },
  {
    pattern: /\b(school\s+shoot|mass\s+shoot|terrorist\s+attack|bomb\s+threat)\b/i,
    category: "violence",
    severity: "critical",
    minLevel: "standard",
    description: "Mass violence content",
  },
];

// Sexual content patterns
const SEXUAL_PATTERNS: FilterPattern[] = [
  {
    pattern: /\b(porn|xxx|nsfw|hentai|explicit\s+sexual)\b/i,
    category: "sexual_content",
    severity: "high",
    minLevel: "standard",
    description: "Explicit content request",
  },
  {
    pattern: /\b(sext|nude|naked\s+pictures|send\s+me\s+photos)\b/i,
    category: "sexual_content",
    severity: "critical",
    minLevel: "standard",
    description: "Potential grooming pattern",
  },
  {
    pattern: /\b(how\s+old\s+are\s+you|where\s+do\s+you\s+live|are\s+you\s+alone)\b/i,
    category: "sexual_content",
    severity: "high",
    minLevel: "strict",
    description: "Potential grooming question",
  },
];

// Substance abuse patterns
const SUBSTANCE_PATTERNS: FilterPattern[] = [
  {
    pattern: /\b(how\s+to\s+)?(buy|get|find|make)\s+(drugs|cocaine|heroin|meth|weed)\b/i,
    category: "substance_abuse",
    severity: "high",
    minLevel: "standard",
    description: "Drug acquisition query",
  },
  {
    pattern: /\b(get\s+drunk|buy\s+alcohol|fake\s+id|underage\s+drinking)\b/i,
    category: "substance_abuse",
    severity: "high",
    minLevel: "standard",
    description: "Underage alcohol query",
  },
  {
    pattern: /\b(vape|juul|nicotine|smoking\s+tips)\b/i,
    category: "substance_abuse",
    severity: "medium",
    minLevel: "strict",
    description: "Nicotine/vaping content",
  },
];

// Personal information patterns
const PERSONAL_INFO_PATTERNS: FilterPattern[] = [
  {
    pattern: /\b(my\s+)?(address\s+is|live\s+at|home\s+address|street\s+address)/i,
    category: "personal_info",
    severity: "high",
    minLevel: "standard",
    description: "Sharing home address",
  },
  {
    pattern: /\b(my\s+)?(phone\s+number|call\s+me\s+at|text\s+me\s+at)/i,
    category: "personal_info",
    severity: "high",
    minLevel: "standard",
    description: "Sharing phone number",
  },
  {
    pattern: /\b(my\s+)?(school\s+is|go\s+to\s+school\s+at|school\s+name)/i,
    category: "personal_info",
    severity: "medium",
    minLevel: "strict",
    description: "Sharing school information",
  },
  {
    pattern: /\b(social\s+security|ssn|passport\s+number|bank\s+account)\b/i,
    category: "personal_info",
    severity: "critical",
    minLevel: "standard",
    description: "Sensitive identity information",
  },
];

// Financial/scam patterns
const FINANCIAL_PATTERNS: FilterPattern[] = [
  {
    pattern: /\b(credit\s+card\s+number|debit\s+card|cvv|pin\s+number)\b/i,
    category: "financial_scam",
    severity: "critical",
    minLevel: "standard",
    description: "Financial information request",
  },
  {
    pattern: /\b(crypto\s+scheme|get\s+rich\s+quick|investment\s+opportunity|make\s+money\s+fast)\b/i,
    category: "financial_scam",
    severity: "medium",
    minLevel: "strict",
    description: "Potential scam content",
  },
  {
    pattern: /\b(gambling|online\s+casino|betting\s+site|poker\s+for\s+money)\b/i,
    category: "financial_scam",
    severity: "medium",
    minLevel: "strict",
    description: "Gambling content",
  },
];

// Illegal activity patterns
const ILLEGAL_PATTERNS: FilterPattern[] = [
  {
    pattern: /\b(hack\s+into|bypass\s+security|crack\s+password|steal\s+account)\b/i,
    category: "illegal_activity",
    severity: "high",
    minLevel: "standard",
    description: "Hacking/unauthorized access",
  },
  {
    pattern: /\b(steal|shoplift|how\s+to\s+rob|breaking\s+and\s+entering)\b/i,
    category: "illegal_activity",
    severity: "high",
    minLevel: "standard",
    description: "Theft-related query",
  },
  {
    pattern: /\b(fake\s+documents|forge|counterfeit|identity\s+theft)\b/i,
    category: "illegal_activity",
    severity: "high",
    minLevel: "standard",
    description: "Forgery/fraud",
  },
];

// Combine all patterns
const ALL_PATTERNS: FilterPattern[] = [
  ...SELF_HARM_PATTERNS,
  ...VIOLENCE_PATTERNS,
  ...SEXUAL_PATTERNS,
  ...SUBSTANCE_PATTERNS,
  ...PERSONAL_INFO_PATTERNS,
  ...FINANCIAL_PATTERNS,
  ...ILLEGAL_PATTERNS,
];

// Level hierarchy for pattern matching
const LEVEL_HIERARCHY: Record<SafetyFilteringLevel, number> = {
  standard: 1,
  strict: 2,
  maximum: 3,
};

// ==================== CORE FUNCTIONS ====================

/**
 * Check if content should be filtered based on safety mode settings
 */
export function filterContent(
  content: string,
  filteringLevel: SafetyFilteringLevel
): SafetyFilterResult {
  const matchedPatterns: FilterPattern[] = [];
  const categories = new Set<SafetyFilterCategory>();
  let highestSeverity: "low" | "medium" | "high" | "critical" = "low";

  const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };

  // Check each pattern
  for (const pattern of ALL_PATTERNS) {
    // Only apply patterns that match the current or lower filtering level
    if (LEVEL_HIERARCHY[pattern.minLevel] <= LEVEL_HIERARCHY[filteringLevel]) {
      if (pattern.pattern.test(content)) {
        matchedPatterns.push(pattern);
        categories.add(pattern.category);

        if (severityOrder[pattern.severity] > severityOrder[highestSeverity]) {
          highestSeverity = pattern.severity;
        }
      }
    }
  }

  if (matchedPatterns.length === 0) {
    return {
      blocked: false,
      categories: [],
      severity: "low",
      message: "",
    };
  }

  // Generate appropriate message
  const categoryList = Array.from(categories);
  const message = generateBlockMessage(categoryList, highestSeverity);
  const suggestedRephrase = generateRephraseHint(categoryList);

  return {
    blocked: true,
    categories: categoryList,
    severity: highestSeverity,
    message,
    suggestedRephrase,
  };
}

/**
 * Generate a user-friendly block message
 */
function generateBlockMessage(
  categories: SafetyFilterCategory[],
  severity: "low" | "medium" | "high" | "critical"
): string {
  const categoryDescriptions: Record<SafetyFilterCategory, string> = {
    self_harm: "content related to self-harm",
    violence: "violent or threatening content",
    sexual_content: "content that isn't appropriate for your age group",
    substance_abuse: "content about drugs or alcohol",
    personal_info: "personal information that shouldn't be shared online",
    financial_scam: "potentially unsafe financial content",
    illegal_activity: "content about illegal activities",
  };

  if (categories.length === 1) {
    return `This prompt has been filtered because it may contain ${categoryDescriptions[categories[0]]}.`;
  }

  return `This prompt has been filtered because it may contain content that isn't appropriate for your age group.`;
}

/**
 * Generate a hint for rephrasing
 */
function generateRephraseHint(categories: SafetyFilterCategory[]): string {
  const hints: Partial<Record<SafetyFilterCategory, string>> = {
    self_harm:
      "If you're struggling, please talk to a trusted adult or contact a helpline. You can also rephrase your question for educational purposes.",
    violence:
      "Consider rephrasing your question to focus on conflict resolution or historical/educational context.",
    personal_info:
      "Avoid sharing personal details like your address, phone number, or school name online.",
    substance_abuse:
      "If you have questions about health topics, consider speaking with a parent, teacher, or school counselor.",
  };

  for (const category of categories) {
    if (hints[category]) {
      return hints[category]!;
    }
  }

  return "Try rephrasing your question for educational purposes, or ask a parent to review and approve this request.";
}

// ==================== USER SAFETY CHECK ====================

export interface UserSafetyStatus {
  safetyModeEnabled: boolean;
  safetyModeLocked: boolean;
  filteringLevel: SafetyFilteringLevel;
  ageTier: AgeTier;
  age: number | null;
  requiresParentalConsent: boolean;
  hasParentalConsent: boolean;
  timeLimitExceeded: boolean;
  dailyMinutesUsed: number;
  dailyMinutesLimit: number | null;
}

/**
 * Get user's safety status from database
 */
export async function getUserSafetyStatus(
  userId: string
): Promise<UserSafetyStatus | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      `
      date_of_birth,
      safety_mode_enabled,
      safety_mode_locked,
      safety_filtering_level,
      parental_consent_date,
      daily_time_limit_minutes,
      weekly_time_limit_minutes
    `
    )
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return null;
  }

  // Calculate age and tier
  const age = profile.date_of_birth
    ? calculateAge(profile.date_of_birth)
    : null;
  const ageTier: AgeTier = profile.date_of_birth
    ? getAgeTier(profile.date_of_birth)
    : "adult";

  // Check time limits
  const { data: timeData } = await supabase.rpc("check_time_limit", {
    p_user_id: userId,
  });

  const timeLimitExceeded =
    timeData?.daily_exceeded || timeData?.weekly_exceeded || false;

  return {
    safetyModeEnabled: profile.safety_mode_enabled ?? false,
    safetyModeLocked: profile.safety_mode_locked ?? false,
    filteringLevel: (profile.safety_filtering_level as SafetyFilteringLevel) ?? "standard",
    ageTier,
    age,
    requiresParentalConsent: ageTier === "under_13",
    hasParentalConsent: !!profile.parental_consent_date,
    timeLimitExceeded,
    dailyMinutesUsed: timeData?.daily_used ?? 0,
    dailyMinutesLimit: profile.daily_time_limit_minutes,
  };
}

/**
 * Main function to check and filter user content
 * Call this before processing any AI prompt
 */
export async function checkAndFilterContent(
  userId: string,
  content: string,
  feature: string
): Promise<{
  allowed: boolean;
  filterResult: SafetyFilterResult | null;
  safetyStatus: UserSafetyStatus | null;
  blockedReason?: string;
}> {
  // Get user's safety status
  const safetyStatus = await getUserSafetyStatus(userId);

  if (!safetyStatus) {
    // If we can't determine safety status, allow (user might not have DOB set)
    return {
      allowed: true,
      filterResult: null,
      safetyStatus: null,
    };
  }

  // Check if under-13 without parental consent
  if (safetyStatus.requiresParentalConsent && !safetyStatus.hasParentalConsent) {
    return {
      allowed: false,
      filterResult: null,
      safetyStatus,
      blockedReason:
        "Parental consent is required to use this feature. Please ask a parent or guardian to complete the consent process.",
    };
  }

  // Check time limits
  if (safetyStatus.timeLimitExceeded) {
    return {
      allowed: false,
      filterResult: null,
      safetyStatus,
      blockedReason:
        "You've reached your daily time limit. Please try again tomorrow, or ask a parent to adjust your limits.",
    };
  }

  // If safety mode is not enabled, allow
  if (!safetyStatus.safetyModeEnabled) {
    return {
      allowed: true,
      filterResult: null,
      safetyStatus,
    };
  }

  // Filter the content
  const filterResult = filterContent(content, safetyStatus.filteringLevel);

  if (filterResult.blocked) {
    // Log the blocked prompt (categories only, not content)
    await logBlockedPrompt(userId, filterResult, feature);
  }

  return {
    allowed: !filterResult.blocked,
    filterResult,
    safetyStatus,
  };
}

/**
 * Log a blocked prompt for parent dashboard
 */
async function logBlockedPrompt(
  userId: string,
  filterResult: SafetyFilterResult,
  feature: string
): Promise<void> {
  const supabase = await createClient();

  // Log to blocked_prompts_log (categories only, NOT the actual content)
  await supabase.from("blocked_prompts_log").insert({
    user_id: userId,
    categories: filterResult.categories,
    severity: filterResult.severity,
    feature,
  });

  // Log to safety activity log
  await supabase.from("safety_activity_log").insert({
    user_id: userId,
    activity_type: "prompt_blocked",
    feature,
    blocked_category: filterResult.categories[0], // Primary category
    severity: filterResult.severity,
    metadata: {
      all_categories: filterResult.categories,
    },
  });

  // Check for mental health patterns that need parent notification
  if (filterResult.categories.includes("self_harm")) {
    await createMentalHealthAlert(userId, "self_harm_query", filterResult.severity);
  }
}

/**
 * Create a mental health alert for parent notification
 */
async function createMentalHealthAlert(
  userId: string,
  patternType: string,
  severity: "low" | "medium" | "high" | "critical"
): Promise<void> {
  const supabase = await createClient();

  const alertSeverity =
    severity === "critical"
      ? "critical"
      : severity === "high"
        ? "warning"
        : "concern";

  await supabase.from("mental_health_alerts").insert({
    user_id: userId,
    pattern_type: patternType,
    severity: alertSeverity,
    pattern_description: `User attempted to submit content related to ${patternType.replace(/_/g, " ")}`,
    resources_shown: true,
  });

  // TODO: Send notification to parent if linked
  // This would trigger an email or push notification
}

// ==================== MENTAL HEALTH RESOURCES ====================

export interface MentalHealthResource {
  name: string;
  description: string;
  contact: string;
  url?: string;
  country: string;
}

export const MENTAL_HEALTH_RESOURCES: MentalHealthResource[] = [
  {
    name: "National Suicide Prevention Lifeline",
    description: "Free, confidential support 24/7",
    contact: "988 (call or text)",
    url: "https://988lifeline.org",
    country: "US",
  },
  {
    name: "Crisis Text Line",
    description: "Text-based crisis support",
    contact: "Text HOME to 741741",
    url: "https://www.crisistextline.org",
    country: "US",
  },
  {
    name: "Childline",
    description: "Free helpline for children and young people",
    contact: "0800 1111",
    url: "https://www.childline.org.uk",
    country: "UK",
  },
  {
    name: "Kids Helpline",
    description: "Free, private, and confidential phone and online counseling",
    contact: "1800 55 1800",
    url: "https://kidshelpline.com.au",
    country: "AU",
  },
  {
    name: "Youthline",
    description: "Support for young people",
    contact: "0800 376 633",
    url: "https://www.youthline.co.nz",
    country: "NZ",
  },
];

/**
 * Get mental health resources based on user's location
 */
export function getMentalHealthResources(
  countryCode?: string
): MentalHealthResource[] {
  if (!countryCode) {
    return MENTAL_HEALTH_RESOURCES;
  }

  const countryResources = MENTAL_HEALTH_RESOURCES.filter(
    (r) => r.country === countryCode.toUpperCase()
  );

  // Always include US resources as fallback
  if (countryResources.length === 0) {
    return MENTAL_HEALTH_RESOURCES.filter((r) => r.country === "US");
  }

  return countryResources;
}

// ==================== PARENT DASHBOARD HELPERS ====================

/**
 * Get summary of blocked prompts for parent dashboard
 */
export async function getBlockedPromptsSummary(
  childUserId: string,
  days: number = 7
): Promise<Record<SafetyFilterCategory, number>> {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from("blocked_prompts_log")
    .select("categories")
    .eq("user_id", childUserId)
    .gte("created_at", startDate.toISOString());

  const summary: Record<SafetyFilterCategory, number> = {
    self_harm: 0,
    violence: 0,
    sexual_content: 0,
    substance_abuse: 0,
    personal_info: 0,
    financial_scam: 0,
    illegal_activity: 0,
  };

  if (data) {
    for (const row of data) {
      for (const category of row.categories as SafetyFilterCategory[]) {
        summary[category]++;
      }
    }
  }

  return summary;
}

/**
 * Get mental health alerts for parent
 */
export async function getMentalHealthAlerts(
  childUserId: string,
  acknowledged: boolean = false
): Promise<
  Array<{
    id: string;
    pattern_type: string;
    severity: string;
    pattern_description: string;
    created_at: string;
  }>
> {
  const supabase = await createClient();

  const query = supabase
    .from("mental_health_alerts")
    .select("id, pattern_type, severity, pattern_description, created_at")
    .eq("user_id", childUserId)
    .order("created_at", { ascending: false });

  if (!acknowledged) {
    query.eq("acknowledged_by_parent", false);
  }

  const { data } = await query;
  return data ?? [];
}

/**
 * Acknowledge a mental health alert
 */
export async function acknowledgeMentalHealthAlert(
  alertId: string,
  parentUserId: string
): Promise<boolean> {
  const supabase = await createClient();

  // Verify the parent has access to this alert
  const { data: alert } = await supabase
    .from("mental_health_alerts")
    .select("user_id")
    .eq("id", alertId)
    .single();

  if (!alert) return false;

  // Verify parent-child relationship
  const { data: child } = await supabase
    .from("profiles")
    .select("parent_user_id")
    .eq("id", alert.user_id)
    .single();

  if (child?.parent_user_id !== parentUserId) return false;

  // Acknowledge the alert
  const { error } = await supabase
    .from("mental_health_alerts")
    .update({
      acknowledged_by_parent: true,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", alertId);

  return !error;
}
