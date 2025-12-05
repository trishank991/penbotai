// User and Profile types
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  university: string | null;
  plan: 'free' | 'premium' | 'university';
  stripe_customer_id: string | null;
  // Age verification fields
  date_of_birth: string | null;
  age_verified: boolean;
  age_verification_date: string | null;
  // Safety mode fields
  safety_mode_enabled: boolean;
  safety_mode_locked: boolean; // Locked ON for under-13
  safety_filtering_level: SafetyFilteringLevel;
  // Parental control fields
  parent_email: string | null;
  parental_consent_date: string | null;
  parental_consent_method: ParentalConsentMethod | null;
  parent_link_code: string | null;
  parent_user_id: string | null; // Links to parent's profile
  // Time limits (set by parent)
  daily_time_limit_minutes: number | null;
  weekly_time_limit_minutes: number | null;
  created_at: string;
  updated_at: string;
}

// ==================== AGE VERIFICATION & SAFETY MODE TYPES ====================

// Age tier based on legal framework
export type AgeTier = 'under_13' | '13_14' | '14_17' | 'adult';

// Safety filtering strictness levels
export type SafetyFilteringLevel = 'standard' | 'strict' | 'maximum';

// Parental consent verification methods (COPPA 2025 compliant)
export type ParentalConsentMethod =
  | 'knowledge_based_auth'    // Security questions
  | 'government_id'           // Photo ID verification
  | 'credit_card'             // $0.50 charge verification
  | 'video_verification'      // Video call verification
  | 'signed_form'             // Signed consent form
  | 'text_message';           // SMS with follow-up verification

// Age verification constants
export const AGE_THRESHOLDS = {
  COPPA_AGE: 13,              // Verifiable parental consent required
  SAFETY_MODE_DEFAULT: 14,    // Safety mode ON by default below this
  MINOR_AGE: 18,              // Legal adult threshold
  KOSA_MINOR_AGE: 17,         // KOSA defines minor as under 17
} as const;

// Safety mode configuration by age tier
export const SAFETY_MODE_CONFIG: Record<AgeTier, {
  safetyModeDefault: boolean;
  safetyModeLocked: boolean;
  parentCanDisable: boolean;
  requiresParentalConsent: boolean;
  defaultFilteringLevel: SafetyFilteringLevel;
}> = {
  under_13: {
    safetyModeDefault: true,
    safetyModeLocked: true,      // Cannot be disabled
    parentCanDisable: false,      // Even parents cannot disable
    requiresParentalConsent: true,
    defaultFilteringLevel: 'maximum',
  },
  '13_14': {
    safetyModeDefault: true,
    safetyModeLocked: false,
    parentCanDisable: true,       // Parent can disable
    requiresParentalConsent: false,
    defaultFilteringLevel: 'strict',
  },
  '14_17': {
    safetyModeDefault: false,
    safetyModeLocked: false,
    parentCanDisable: true,       // Parent can enable
    requiresParentalConsent: false,
    defaultFilteringLevel: 'standard',
  },
  adult: {
    safetyModeDefault: false,
    safetyModeLocked: false,
    parentCanDisable: false,      // N/A
    requiresParentalConsent: false,
    defaultFilteringLevel: 'standard',
  },
} as const;

// Content filtering categories (blocked when Safety Mode is ON)
export type SafetyFilterCategory =
  | 'self_harm'         // Suicide, cutting, eating disorders, dangerous challenges
  | 'violence'          // Weapons, fighting, threats, graphic content
  | 'sexual_content'    // Explicit material, grooming patterns
  | 'substance_abuse'   // Drug/alcohol acquisition, usage
  | 'personal_info'     // Address, phone, school name requests
  | 'financial_scam'    // Payment info, crypto, gambling
  | 'illegal_activity'; // Hacking, theft, bypassing security

// Safety filter result
export interface SafetyFilterResult {
  blocked: boolean;
  categories: SafetyFilterCategory[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedRephrase?: string;
}

// Parent dashboard data
export interface ParentDashboardData {
  childProfile: {
    id: string;
    email: string;
    full_name: string | null;
    date_of_birth: string | null;
    age: number;
    ageTier: AgeTier;
    safety_mode_enabled: boolean;
    safety_mode_locked: boolean;
    safety_filtering_level: SafetyFilteringLevel;
  };
  usageSummary: {
    totalSessionsThisWeek: number;
    totalMinutesThisWeek: number;
    blockedPromptsThisWeek: number;
    featuresUsed: Record<string, number>;
  };
  blockedCategories: Record<SafetyFilterCategory, number>;
  recentActivity: Array<{
    date: string;
    feature: string;
    duration_minutes: number;
    blocked_count: number;
  }>;
  mentalHealthAlerts: Array<{
    date: string;
    pattern: string;
    severity: 'concern' | 'warning' | 'critical';
  }>;
  timeLimits: {
    daily_limit_minutes: number | null;
    weekly_limit_minutes: number | null;
    daily_used_minutes: number;
    weekly_used_minutes: number;
  };
}

// Parent-child link request
export interface ParentLinkRequest {
  id: string;
  child_user_id: string;
  parent_email: string;
  link_code: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

// Safety mode activity log (for parent dashboard)
export interface SafetyActivityLog {
  id: string;
  user_id: string;
  activity_type: 'session_start' | 'session_end' | 'prompt_blocked' | 'feature_used' | 'mental_health_flag';
  feature: string | null;
  blocked_category: SafetyFilterCategory | null;
  duration_minutes: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Helper function to calculate age tier from date of birth
export function getAgeTier(dateOfBirth: Date | string): AgeTier {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < AGE_THRESHOLDS.COPPA_AGE) return 'under_13';
  if (age < AGE_THRESHOLDS.SAFETY_MODE_DEFAULT) return '13_14';
  if (age < AGE_THRESHOLDS.MINOR_AGE) return '14_17';
  return 'adult';
}

// Helper to calculate age from DOB
export function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

// ==================== REGIONAL ENGLISH VARIANTS ====================

// Supported English variants for grammar checking
export type EnglishVariant =
  | 'en-US'   // American English
  | 'en-GB'   // British English
  | 'en-AU'   // Australian English
  | 'en-CA'   // Canadian English
  | 'en-NZ'   // New Zealand English
  | 'en-ZA'   // South African English
  | 'en-IN';  // Indian English

// Regional English configuration
export const ENGLISH_VARIANTS: Record<EnglishVariant, {
  name: string;
  flag: string;
  description: string;
  examples: {
    spelling: string[];  // [US spelling, regional spelling]
    vocabulary: string[];
  };
}> = {
  'en-US': {
    name: 'American English',
    flag: '🇺🇸',
    description: 'Standard American English spelling and grammar',
    examples: {
      spelling: ['color', 'center', 'organize', 'analyze'],
      vocabulary: ['apartment', 'elevator', 'sidewalk', 'truck'],
    },
  },
  'en-GB': {
    name: 'British English',
    flag: '🇬🇧',
    description: 'Standard British English spelling and grammar',
    examples: {
      spelling: ['colour', 'centre', 'organise', 'analyse'],
      vocabulary: ['flat', 'lift', 'pavement', 'lorry'],
    },
  },
  'en-AU': {
    name: 'Australian English',
    flag: '🇦🇺',
    description: 'Australian English spelling (follows British conventions)',
    examples: {
      spelling: ['colour', 'centre', 'organise', 'analyse'],
      vocabulary: ['flat', 'lift', 'footpath', 'ute'],
    },
  },
  'en-CA': {
    name: 'Canadian English',
    flag: '🇨🇦',
    description: 'Canadian English (mix of British and American)',
    examples: {
      spelling: ['colour', 'center', 'organize', 'analyse'],
      vocabulary: ['apartment', 'elevator', 'sidewalk', 'truck'],
    },
  },
  'en-NZ': {
    name: 'New Zealand English',
    flag: '🇳🇿',
    description: 'New Zealand English spelling (follows British conventions)',
    examples: {
      spelling: ['colour', 'centre', 'organise', 'analyse'],
      vocabulary: ['flat', 'lift', 'footpath', 'truck'],
    },
  },
  'en-ZA': {
    name: 'South African English',
    flag: '🇿🇦',
    description: 'South African English spelling (follows British conventions)',
    examples: {
      spelling: ['colour', 'centre', 'organise', 'analyse'],
      vocabulary: ['flat', 'lift', 'pavement', 'bakkie'],
    },
  },
  'en-IN': {
    name: 'Indian English',
    flag: '🇮🇳',
    description: 'Indian English spelling (follows British conventions)',
    examples: {
      spelling: ['colour', 'centre', 'organise', 'analyse'],
      vocabulary: ['flat', 'lift', 'footpath', 'lorry'],
    },
  },
};

// Common spelling differences between variants
export const SPELLING_DIFFERENCES: Array<{
  pattern: string;
  us: string;
  british: string;
  category: string;
}> = [
  // -or vs -our
  { pattern: 'color/colour', us: 'color', british: 'colour', category: '-or/-our' },
  { pattern: 'favor/favour', us: 'favor', british: 'favour', category: '-or/-our' },
  { pattern: 'honor/honour', us: 'honor', british: 'honour', category: '-or/-our' },
  { pattern: 'labor/labour', us: 'labor', british: 'labour', category: '-or/-our' },
  { pattern: 'neighbor/neighbour', us: 'neighbor', british: 'neighbour', category: '-or/-our' },
  { pattern: 'behavior/behaviour', us: 'behavior', british: 'behaviour', category: '-or/-our' },

  // -er vs -re
  { pattern: 'center/centre', us: 'center', british: 'centre', category: '-er/-re' },
  { pattern: 'theater/theatre', us: 'theater', british: 'theatre', category: '-er/-re' },
  { pattern: 'meter/metre', us: 'meter', british: 'metre', category: '-er/-re' },
  { pattern: 'fiber/fibre', us: 'fiber', british: 'fibre', category: '-er/-re' },

  // -ize vs -ise
  { pattern: 'organize/organise', us: 'organize', british: 'organise', category: '-ize/-ise' },
  { pattern: 'recognize/recognise', us: 'recognize', british: 'recognise', category: '-ize/-ise' },
  { pattern: 'realize/realise', us: 'realize', british: 'realise', category: '-ize/-ise' },
  { pattern: 'analyze/analyse', us: 'analyze', british: 'analyse', category: '-ize/-ise' },

  // -yze vs -yse
  { pattern: 'analyze/analyse', us: 'analyze', british: 'analyse', category: '-yze/-yse' },
  { pattern: 'paralyze/paralyse', us: 'paralyze', british: 'paralyse', category: '-yze/-yse' },

  // -ense vs -ence
  { pattern: 'defense/defence', us: 'defense', british: 'defence', category: '-ense/-ence' },
  { pattern: 'offense/offence', us: 'offense', british: 'offence', category: '-ense/-ence' },
  { pattern: 'license/licence', us: 'license', british: 'licence', category: '-ense/-ence' },

  // -og vs -ogue
  { pattern: 'catalog/catalogue', us: 'catalog', british: 'catalogue', category: '-og/-ogue' },
  { pattern: 'dialog/dialogue', us: 'dialog', british: 'dialogue', category: '-og/-ogue' },

  // Double consonants
  { pattern: 'traveling/travelling', us: 'traveling', british: 'travelling', category: 'Double consonants' },
  { pattern: 'canceled/cancelled', us: 'canceled', british: 'cancelled', category: 'Double consonants' },
  { pattern: 'modeled/modelled', us: 'modeled', british: 'modelled', category: 'Double consonants' },

  // Other common differences
  { pattern: 'gray/grey', us: 'gray', british: 'grey', category: 'Other' },
  { pattern: 'check/cheque', us: 'check', british: 'cheque', category: 'Other' },
  { pattern: 'program/programme', us: 'program', british: 'programme', category: 'Other' },
  { pattern: 'jewelry/jewellery', us: 'jewelry', british: 'jewellery', category: 'Other' },
  { pattern: 'fulfill/fulfil', us: 'fulfill', british: 'fulfil', category: 'Other' },
  { pattern: 'skillful/skilful', us: 'skillful', british: 'skilful', category: 'Other' },
];

// Prompt Coach types
export interface PromptAnalysis {
  score: number;
  breakdown: {
    clarity: number;
    specificity: number;
    context: number;
    structure: number;
  };
  suggestions: string[];
  improvedPrompt?: string;
}

export interface PromptRecord {
  id: string;
  user_id: string;
  original_prompt: string;
  score: number | null;
  feedback: PromptAnalysis | null;
  improved_prompt: string | null;
  ai_model: string | null;
  created_at: string;
}

// Disclosure types
export interface DisclosureInput {
  aiTools: string[];
  purpose: string;
  description: string;
  promptsUsed?: string[];
  outputUsage: string;
  template: 'apa' | 'mla' | 'chicago' | 'generic';
}

export interface DisclosureRecord {
  id: string;
  user_id: string;
  ai_tools: string[];
  purpose: string;
  description: string;
  prompts_used: string[] | null;
  output_usage: string;
  formatted_disclosure: string;
  template: string;
  created_at: string;
}

// Grammar types
export interface GrammarMatch {
  message: string;
  offset: number;
  length: number;
  replacements: string[];
  rule: {
    id: string;
    description: string;
  };
}

export interface GrammarResult {
  matches: GrammarMatch[];
}

// Research types
export interface ResearchPaper {
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  url: string;
  citationCount: number;
  citation: {
    apa: string;
    mla: string;
    chicago: string;
  };
}

// Usage tracking
export interface UsageRecord {
  id: string;
  user_id: string;
  feature: 'prompt_coach' | 'disclosure' | 'grammar' | 'research' | 'plagiarism';
  count: number;
  period: string;
  created_at: string;
}

// Subscription types
export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  plan: 'premium' | 'university';
  status: 'active' | 'cancelled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Usage limits for free tier
export const FREE_TIER_LIMITS = {
  prompt_coach: 5,
  disclosure: 3,
  grammar: 10,
  research: 5,
  plagiarism: 5,
  assignment_audit: 1, // Premium feature, 1 free trial
} as const;

// Plagiarism types
export interface PlagiarismResult {
  overallScore: number;
  aiGeneratedScore: number;
  matches: PlagiarismMatch[];
  summary: string;
  suggestions: string[];
}

export interface PlagiarismMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  matchType: 'exact' | 'paraphrase' | 'ai-pattern';
  confidence: number;
  source?: string;
  url?: string;
}

// Saved paper types (Research Library)
export interface SavedPaper {
  id: string;
  user_id: string;
  title: string;
  authors: string[];
  year: number | null;
  abstract: string | null;
  url: string | null;
  doi: string | null;
  journal: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  citation_count: number | null;
  source: 'semantic_scholar' | 'openalex' | 'manual';
  external_id: string | null;
  tags: string[];
  notes: string | null;
  folder: string;
  created_at: string;
  updated_at: string;
}

// Team types
export interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string | null;
  institution: string | null;
  plan: 'team' | 'enterprise';
  max_members: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: 'admin' | 'member';
  invited_by: string | null;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

// API Key types
export interface ApiKey {
  id: string;
  user_id: string;
  team_id: string | null;
  name: string;
  key_prefix: string;
  scopes: string[];
  rate_limit: number;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

// LMS Integration types
export interface LMSIntegration {
  id: string;
  team_id: string | null;
  user_id: string | null;
  provider: 'canvas' | 'blackboard' | 'moodle' | 'google_classroom';
  provider_url: string | null;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== ASSIGNMENT AUDIT TYPES ====================
// CIDI Framework: Context, Integrity, Details, Insight

export type AssignmentType =
  | 'essay'
  | 'research_paper'
  | 'lab_report'
  | 'case_study'
  | 'thesis'
  | 'dissertation'
  | 'creative_writing'
  | 'technical_report'
  | 'literature_review'
  | 'reflection'
  | 'presentation'
  | 'other';

export type GapPriority = 'high' | 'medium' | 'low';
export type EffortLevel = 'easy' | 'medium' | 'hard';
export type ImpactLevel = 'high' | 'medium' | 'low';
export type AnalysisDepth = 'shallow' | 'moderate' | 'deep';
export type RequirementStatus = 'met' | 'partial' | 'missing';

// Input for creating an audit
export interface AssignmentAuditInput {
  assignmentName: string;
  assignmentType: AssignmentType;
  subjectArea?: string;
  wordCountTarget?: number;
  dueDate?: string;
  submissionContent: string;
  rubricContent?: string; // Optional rubric for requirement matching
  assignmentInstructions?: string; // Original assignment prompt
  previousAuditId?: string; // For re-audit comparison
}

// CIDI Evidence Types (factual, no hallucination)
export interface ContextEvidence {
  strengths: string[]; // Direct quotes/observations from text
  gaps: string[]; // Missing context elements
  citationsFound: number; // Actual count
  backgroundProvided: boolean;
  audienceClarity: boolean;
}

export interface IntegrityEvidence {
  logicalFlow: boolean;
  contradictions: Array<{
    statement1: string;
    statement2: string;
    location: string;
  }>;
  unsupportedClaims: Array<{
    claim: string;
    location: string;
  }>;
  transitionQuality: 'poor' | 'adequate' | 'strong';
}

export interface DetailsEvidence {
  specificExamples: number; // Actual count
  vagueStatements: Array<{
    text: string;
    location: string;
    suggestion: string;
  }>;
  dataPoints: number;
  concreteLanguage: boolean;
}

export interface InsightEvidence {
  originalArguments: string[]; // Actual novel points found
  genericStatements: Array<{
    text: string;
    location: string;
  }>;
  analysisDepth: AnalysisDepth;
  criticalThinking: boolean;
  synthesisPresent: boolean;
}

// Requirement analysis (rubric matching)
export interface RequirementItem {
  requirement: string;
  status: RequirementStatus;
  evidence?: string; // Where in text it's met
  notes?: string;
}

export interface RequirementsAnalysis {
  total: number;
  met: number;
  partial: number;
  missing: number;
  items: RequirementItem[];
}

// Gap analysis with actionable priority
export interface GapItem {
  gap: string;
  priority: GapPriority;
  fixTimeMinutes: number;
  gradeImpact: string; // e.g., "+5 to +10 points"
  howToFix: string;
}

// Improvement suggestions
export interface ImprovementItem {
  action: string;
  location: string; // Paragraph/section reference
  effort: EffortLevel;
  impact: ImpactLevel;
  example?: string; // Optional example of improvement
}

// Issue detection (evidence-based)
export interface IssueItem {
  type: 'repetition' | 'vague' | 'unsupported' | 'tangent' | 'grammar' | 'structure';
  location: string;
  text: string;
  suggestion?: string;
}

// Citation detection
export interface CitationDetected {
  text: string;
  type: 'apa' | 'mla' | 'chicago' | 'ieee' | 'harvard' | 'unknown';
  isValid: boolean;
}

// Full audit result
export interface AssignmentAuditResult {
  // CIDI Scores (0-100 each)
  contextScore: number;
  contextEvidence: ContextEvidence;

  integrityScore: number;
  integrityEvidence: IntegrityEvidence;

  detailsScore: number;
  detailsEvidence: DetailsEvidence;

  insightScore: number;
  insightEvidence: InsightEvidence;

  // Overall (weighted: Context 20%, Integrity 30%, Details 25%, Insight 25%)
  relevanceScore: number;

  // Third-party perspective
  thirdPartySummary: string;

  // Requirements (if rubric provided)
  requirementsAnalysis?: RequirementsAnalysis;

  // Gaps and improvements
  gapAnalysis: GapItem[];
  improvements: ImprovementItem[];

  // Text statistics (factual)
  stats: {
    wordCount: number;
    paragraphCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    readingGradeLevel: number;
  };

  // Citations
  citationCount: number;
  citationsDetected: CitationDetected[];

  // Issues
  issues: IssueItem[];

  // Comparison (if re-audit)
  previousScore?: number;
  scoreChange?: number;
}

// Database record type
export interface AssignmentAuditRecord {
  id: string;
  user_id: string;
  assignment_name: string;
  assignment_type: AssignmentType;
  subject_area: string | null;
  word_count_target: number | null;
  due_date: string | null;
  submission_content: string;
  rubric_content: string | null;
  assignment_instructions: string | null;
  context_score: number | null;
  context_evidence: ContextEvidence | null;
  integrity_score: number | null;
  integrity_evidence: IntegrityEvidence | null;
  details_score: number | null;
  details_evidence: DetailsEvidence | null;
  insight_score: number | null;
  insight_evidence: InsightEvidence | null;
  relevance_score: number | null;
  third_party_summary: string | null;
  requirements_analysis: RequirementsAnalysis | null;
  gap_analysis: GapItem[] | null;
  improvements: ImprovementItem[] | null;
  word_count: number | null;
  paragraph_count: number | null;
  sentence_count: number | null;
  avg_sentence_length: number | null;
  reading_grade_level: number | null;
  citation_count: number | null;
  citations_detected: CitationDetected[] | null;
  issues: IssueItem[] | null;
  previous_audit_id: string | null;
  score_change: number | null;
  processing_time_ms: number | null;
  model_used: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== GAMIFICATION TYPES ====================

// XP Action types for awarding points
export type XPAction =
  | 'prompt_analyze'
  | 'disclosure_generate'
  | 'audit_complete'
  | 'audit_improve'
  | 'research_query'
  | 'paper_save'
  | 'grammar_check'
  | 'daily_challenge'
  | 'high_score'
  | 'certification_module'
  | 'streak_bonus'
  | 'badge_earned';

// XP rewards per action
export const XP_REWARDS: Record<XPAction, number> = {
  prompt_analyze: 10,
  disclosure_generate: 15,
  audit_complete: 20,
  audit_improve: 25, // +25 for 10+ point improvement on re-audit
  research_query: 5,
  paper_save: 5,
  grammar_check: 3,
  daily_challenge: 50,
  high_score: 100, // New high score or 90+ score
  certification_module: 200,
  streak_bonus: 10, // Base, multiplied for milestones
  badge_earned: 0, // XP defined per badge
} as const;

// Badge categories
export type BadgeCategory = 'skill' | 'streak' | 'special' | 'milestone';

// Badge definition
export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string;
  xp_reward: number;
  unlock_condition: BadgeUnlockCondition;
  sort_order: number;
  created_at: string;
}

// Badge unlock conditions
export interface BadgeUnlockCondition {
  action: string;
  count?: number;
  min_score?: number;
  min_improvement?: number;
  percentage?: number;
  days?: number;
  level?: number;
  amount?: number;
  type?: string;
}

// User earned badge
export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  trigger_reference_type: string | null;
  trigger_reference_id: string | null;
  badge?: Badge; // Joined data
}

// Level definition
export interface LevelDefinition {
  level: number;
  title: string;
  xp_required: number;
  unlock_description: string | null;
}

// User gamification state
export interface UserGamification {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  highest_prompt_score: number;
  highest_audit_score: number;
  total_prompts_analyzed: number;
  total_disclosures_generated: number;
  total_audits_completed: number;
  total_research_queries: number;
  total_papers_saved: number;
  total_grammar_checks: number;
  created_at: string;
  updated_at: string;
}

// XP transaction record
export interface XPTransaction {
  id: string;
  user_id: string;
  action: XPAction;
  xp_amount: number;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Daily challenge
export interface DailyChallenge {
  id: string;
  challenge_type: string;
  title: string;
  description: string;
  xp_reward: number;
  target_action: string;
  target_count: number;
  active_date: string;
  created_at: string;
}

// User challenge progress
export interface UserChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  current_count: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  challenge?: DailyChallenge; // Joined data
}

// Gamification dashboard data (aggregate)
export interface GamificationDashboard {
  user: UserGamification;
  currentLevel: LevelDefinition;
  nextLevel: LevelDefinition | null;
  xpToNextLevel: number;
  progressToNextLevel: number; // 0-100 percentage
  recentBadges: UserBadge[];
  totalBadges: number;
  dailyChallenges: Array<DailyChallenge & { progress: UserChallengeProgress | null }>;
  recentXP: XPTransaction[];
}

// XP award result
export interface XPAwardResult {
  xpAwarded: number;
  totalXP: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  newBadges: Badge[];
  streakUpdate: {
    currentStreak: number;
    streakBroken: boolean;
    bonusXP: number;
  } | null;
}
