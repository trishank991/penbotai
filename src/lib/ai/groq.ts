const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function generateWithGroq(
  messages: GroqMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model || "llama-3.3-70b-versatile",
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data: GroqResponse = await response.json();
  return data.choices[0]?.message?.content || "";
}

// Regional and format-specific disclosure templates
export const DISCLOSURE_TEMPLATES: Record<string, {
  name: string;
  description: string;
  category: string;
  instructions: string;
}> = {
  // Citation Styles
  apa: {
    name: "APA 7th Edition",
    description: "American Psychological Association",
    category: "citation",
    instructions: `Format according to APA 7th edition guidelines. Place disclosure in the Author Note section on the title page or in Methods section for research papers. Use formal academic language. Include specific AI tool names and versions if known.`,
  },
  mla: {
    name: "MLA 9th Edition",
    description: "Modern Language Association",
    category: "citation",
    instructions: `Format according to MLA 9th edition guidelines. Place disclosure in Works Cited or as an endnote. Use clear, direct language suitable for humanities papers.`,
  },
  chicago: {
    name: "Chicago 17th Edition",
    description: "Chicago Manual of Style",
    category: "citation",
    instructions: `Format according to Chicago Manual of Style 17th edition. Use footnote or endnote format. Maintain formal academic tone.`,
  },
  ieee: {
    name: "IEEE",
    description: "Institute of Electrical and Electronics Engineers",
    category: "citation",
    instructions: `Format according to IEEE guidelines. Use technical, concise language suitable for engineering and computer science papers. Include in acknowledgments section.`,
  },
  harvard: {
    name: "Harvard Style",
    description: "Harvard Referencing System",
    category: "citation",
    instructions: `Format according to Harvard referencing style. Use author-date format where applicable. Common in UK, Australia, and many international institutions.`,
  },

  // Regional - North America
  us_generic: {
    name: "US Generic",
    description: "General US University Format",
    category: "regional_na",
    instructions: `Use clear, professional academic language suitable for US institutions. Follow general academic integrity principles. Be transparent about AI tool usage, purpose, and how output was integrated. Include disclaimer that student verified all content.`,
  },
  canada: {
    name: "Canadian Universities",
    description: "Format for Canadian Institutions",
    category: "regional_na",
    instructions: `Format suitable for Canadian universities. Use bilingual-friendly language where appropriate. Follow Canadian academic integrity guidelines. Be explicit about human oversight and verification.`,
  },

  // Regional - Europe
  eu_compliant: {
    name: "EU AI Act Compliant",
    description: "European Union Transparency Standard",
    category: "regional_eu",
    instructions: `Format compliant with EU AI Act transparency requirements. Explicitly state: (1) AI system used, (2) Purpose of use, (3) Human oversight applied, (4) That output was verified for accuracy. Use formal language suitable for European academic institutions.`,
  },
  uk_university: {
    name: "UK Universities",
    description: "British Academic Standard",
    category: "regional_eu",
    instructions: `Format suitable for UK universities (Oxford, Cambridge, Russell Group). Follow UK academic integrity frameworks. Use British English spelling. Reference that work complies with institutional AI policy. Include acknowledgment of human authorship and responsibility.`,
  },
  germany: {
    name: "German Universities",
    description: "Deutsche Hochschulen",
    category: "regional_eu",
    instructions: `Format suitable for German universities. Use formal academic language. German institutions often require detailed methodology disclosure. Include statement of academic honesty (Eigenständigkeitserklärung) compatible format.`,
  },
  france: {
    name: "French Universities",
    description: "Universités Françaises",
    category: "regional_eu",
    instructions: `Format suitable for French universities. Use formal academic language. Comply with French higher education integrity requirements. Include statement of original work attestation compatible format.`,
  },
  netherlands: {
    name: "Dutch Universities",
    description: "Nederlandse Universiteiten",
    category: "regional_eu",
    instructions: `Format suitable for Dutch universities. Many Dutch institutions have progressive AI policies. Use clear, transparent language about AI assistance while maintaining academic rigor.`,
  },
  switzerland: {
    name: "Swiss Universities",
    description: "ETH Zurich, EPFL Standard",
    category: "regional_eu",
    instructions: `Format suitable for Swiss universities (ETH Zurich, EPFL, etc.). Use formal academic language. Swiss institutions value precision - be specific about AI tools, versions, and exact usage.`,
  },

  // Regional - Asia Pacific
  australia: {
    name: "Australian Universities",
    description: "Group of Eight & Australian Standard",
    category: "regional_apac",
    instructions: `Format suitable for Australian universities (Group of Eight, etc.). Follow Australian academic integrity frameworks. Use Australian English. Many Australian universities (like Monash) have detailed AI disclosure requirements - be comprehensive about tools, purpose, and verification.`,
  },
  india: {
    name: "Indian Universities",
    description: "UGC & Indian Institution Format",
    category: "regional_apac",
    instructions: `Format suitable for Indian universities following UGC guidelines. Use formal academic language. Include clear statement of original work and AI assistance transparency. Indian institutions increasingly require explicit AI disclosure.`,
  },
  china: {
    name: "Chinese Universities",
    description: "中国高校格式",
    category: "regional_apac",
    instructions: `Format suitable for Chinese universities. Use formal academic language. Chinese institutions (like Peking University) often have strict AI policies - be very explicit about what AI was and was NOT used for. Emphasize human authorship and critical thinking.`,
  },
  japan: {
    name: "Japanese Universities",
    description: "日本の大学形式",
    category: "regional_apac",
    instructions: `Format suitable for Japanese universities. Use respectful, formal academic language. Japanese academic culture values transparency and honesty - provide detailed disclosure of AI assistance while emphasizing original intellectual contribution.`,
  },
  korea: {
    name: "Korean Universities",
    description: "한국 대학교 형식",
    category: "regional_apac",
    instructions: `Format suitable for Korean universities. Use formal academic language. Korean institutions have been developing AI policies - be transparent about AI use while emphasizing student's original analysis and critical engagement.`,
  },
  singapore: {
    name: "Singapore Universities",
    description: "NUS, NTU & Singapore Standard",
    category: "regional_apac",
    instructions: `Format suitable for Singapore universities (NUS, NTU, SMU). Singapore institutions often have progressive but clear AI policies. Use formal English, be specific about AI tools and usage, emphasize academic integrity.`,
  },
  hong_kong: {
    name: "Hong Kong Universities",
    description: "香港大學格式",
    category: "regional_apac",
    instructions: `Format suitable for Hong Kong universities. Use formal academic English. HK institutions balance innovation with integrity - provide clear disclosure while demonstrating genuine learning and critical engagement.`,
  },
  taiwan: {
    name: "Taiwan Universities",
    description: "臺灣大學格式",
    category: "regional_apac",
    instructions: `Format suitable for Taiwan universities. Use formal academic language. Taiwanese institutions value academic integrity - be transparent about AI tools used and how output was verified and modified.`,
  },
  malaysia: {
    name: "Malaysian Universities",
    description: "Malaysian Higher Education",
    category: "regional_apac",
    instructions: `Format suitable for Malaysian universities. Use formal academic English. Be clear about AI assistance while emphasizing original intellectual contribution.`,
  },
  indonesia: {
    name: "Indonesian Universities",
    description: "Indonesian Higher Education",
    category: "regional_apac",
    instructions: `Format suitable for Indonesian universities. Use formal academic language. Be transparent about AI usage while emphasizing academic integrity and original work.`,
  },
  thailand: {
    name: "Thai Universities",
    description: "Thai Higher Education",
    category: "regional_apac",
    instructions: `Format suitable for Thai universities. Use formal academic English. Provide clear disclosure of AI assistance and human oversight.`,
  },
  vietnam: {
    name: "Vietnamese Universities",
    description: "Vietnamese Higher Education",
    category: "regional_apac",
    instructions: `Format suitable for Vietnamese universities. Use formal academic language. Vietnamese institutions increasingly focus on academic integrity - be explicit about AI use and verification.`,
  },
  philippines: {
    name: "Philippine Universities",
    description: "Philippine Higher Education",
    category: "regional_apac",
    instructions: `Format suitable for Philippine universities. Use formal academic English. Be transparent about AI assistance while demonstrating original intellectual engagement.`,
  },
  new_zealand: {
    name: "New Zealand Universities",
    description: "NZ Higher Education",
    category: "regional_apac",
    instructions: `Format suitable for New Zealand universities. Use formal academic English (NZ/AU spelling). Follow NZ academic integrity frameworks with clear AI disclosure.`,
  },

  // Regional - Middle East & Africa
  uae: {
    name: "UAE Universities",
    description: "United Arab Emirates Format",
    category: "regional_mea",
    instructions: `Format suitable for UAE universities. Use formal academic English. UAE institutions are developing AI frameworks - be transparent and comprehensive in disclosure while demonstrating academic integrity.`,
  },
  saudi: {
    name: "Saudi Universities",
    description: "Kingdom of Saudi Arabia Format",
    category: "regional_mea",
    instructions: `Format suitable for Saudi Arabian universities. Use formal academic language. Include clear statements of academic honesty and AI assistance transparency.`,
  },
  israel: {
    name: "Israeli Universities",
    description: "Israeli Higher Education",
    category: "regional_mea",
    instructions: `Format suitable for Israeli universities (Hebrew University, Technion, etc.). Use formal academic language. Israeli institutions value innovation but also integrity - be specific about AI use.`,
  },
  south_africa: {
    name: "South African Universities",
    description: "South African Higher Education",
    category: "regional_mea",
    instructions: `Format suitable for South African universities. Use formal academic English. Follow South African academic integrity frameworks while being transparent about AI assistance.`,
  },
  egypt: {
    name: "Egyptian Universities",
    description: "Egyptian Higher Education",
    category: "regional_mea",
    instructions: `Format suitable for Egyptian universities. Use formal academic language. Be clear about AI assistance and emphasize original intellectual contribution.`,
  },
  nigeria: {
    name: "Nigerian Universities",
    description: "Nigerian Higher Education",
    category: "regional_mea",
    instructions: `Format suitable for Nigerian universities. Use formal academic English. Be transparent about AI usage while emphasizing academic integrity.`,
  },
  kenya: {
    name: "Kenyan Universities",
    description: "Kenyan Higher Education",
    category: "regional_mea",
    instructions: `Format suitable for Kenyan universities. Use formal academic English. Provide clear disclosure of AI assistance.`,
  },
  turkey: {
    name: "Turkish Universities",
    description: "Turkish Higher Education",
    category: "regional_mea",
    instructions: `Format suitable for Turkish universities. Use formal academic language. Be transparent about AI tools and their specific usage.`,
  },

  // Regional - Latin America
  brazil: {
    name: "Brazilian Universities",
    description: "Universidades Brasileiras",
    category: "regional_latam",
    instructions: `Format suitable for Brazilian universities. Use formal academic language (Portuguese-compatible English). Brazilian institutions value transparency - provide comprehensive disclosure of AI assistance.`,
  },
  mexico: {
    name: "Mexican Universities",
    description: "Universidades Mexicanas",
    category: "regional_latam",
    instructions: `Format suitable for Mexican universities. Use formal academic language (Spanish-compatible English). Be comprehensive in AI disclosure while following Mexican academic integrity standards.`,
  },
  argentina: {
    name: "Argentine Universities",
    description: "Universidades Argentinas",
    category: "regional_latam",
    instructions: `Format suitable for Argentine universities. Use formal academic language. Be clear about AI assistance and human verification.`,
  },
  chile: {
    name: "Chilean Universities",
    description: "Universidades Chilenas",
    category: "regional_latam",
    instructions: `Format suitable for Chilean universities. Use formal academic language. Provide transparent AI disclosure.`,
  },
  colombia: {
    name: "Colombian Universities",
    description: "Universidades Colombianas",
    category: "regional_latam",
    instructions: `Format suitable for Colombian universities. Use formal academic language. Be explicit about AI usage and verification.`,
  },

  // Publisher Formats
  elsevier: {
    name: "Elsevier Journals",
    description: "Elsevier Publication Standard",
    category: "publisher",
    instructions: `Format according to Elsevier's AI disclosure requirements. Elsevier requires: (1) AI cannot be listed as author, (2) Authors accountable for all content, (3) Declaration in separate "AI declaration statement", (4) Basic grammar/spelling checks exempt. Place in dedicated AI declaration section.`,
  },
  springer: {
    name: "Springer Nature",
    description: "Springer Nature Journals",
    category: "publisher",
    instructions: `Format according to Springer Nature requirements. Document LLM use in Methods section. AI-assisted copy editing is exempt from disclosure. AI cannot be listed as author. Authors must be accountable for accuracy.`,
  },
  wiley: {
    name: "Wiley Journals",
    description: "Wiley Publication Standard",
    category: "publisher",
    instructions: `Format according to Wiley's AI policy. Disclose AI use for writing, analysis, or image generation. Place in acknowledgments or methods section as appropriate. AI cannot be credited as author.`,
  },
  taylor_francis: {
    name: "Taylor & Francis",
    description: "Taylor & Francis Journals",
    category: "publisher",
    instructions: `Format according to Taylor & Francis requirements. Disclose AI/LLM use in acknowledgments. Authors responsible for accuracy and integrity of all content. AI cannot be listed as author.`,
  },
  sage: {
    name: "SAGE Publications",
    description: "SAGE Journals",
    category: "publisher",
    instructions: `Format according to SAGE Publishing guidelines. Disclose AI assistance in acknowledgments section. Maintain author accountability for all content. AI tools cannot be credited as authors.`,
  },
  ieee_journal: {
    name: "IEEE Journals",
    description: "IEEE Publication Format",
    category: "publisher",
    instructions: `Format according to IEEE journal requirements. Disclose AI assistance in acknowledgments. Be specific about what tasks AI assisted with. Authors must verify all technical content.`,
  },
  science_nature: {
    name: "Science/Nature Journals",
    description: "High-Impact Journal Format",
    category: "publisher",
    instructions: `Format for high-impact journals (Science, Nature). State AI use in cover letter AND acknowledgments/methods. Be extremely specific about AI role. Authors must attest to accuracy of all claims.`,
  },
  plos: {
    name: "PLOS Journals",
    description: "Public Library of Science",
    category: "publisher",
    instructions: `Format according to PLOS requirements. Disclose AI assistance in Methods and/or Acknowledgments. Be specific about tools and purposes. Authors remain responsible for content accuracy.`,
  },

  // Institution-Specific
  ivy_league: {
    name: "Ivy League Standard",
    description: "Harvard, Yale, Princeton, etc.",
    category: "institution",
    instructions: `Format suitable for Ivy League institutions. These universities have strict academic integrity policies. Be comprehensive about AI tools used, specific purposes, human oversight, and verification. Include statement that work represents student's own understanding.`,
  },
  oxbridge: {
    name: "Oxford/Cambridge",
    description: "Oxbridge Academic Standard",
    category: "institution",
    instructions: `Format suitable for Oxford and Cambridge. Use British English. These institutions permit AI for study support but require explicit disclosure when allowed in assessments. Emphasize original intellectual contribution.`,
  },
  russell_group: {
    name: "Russell Group (UK)",
    description: "Leading UK Research Universities",
    category: "institution",
    instructions: `Format suitable for Russell Group universities. Follow UK academic integrity frameworks. Be transparent about AI assistance while demonstrating genuine learning and original thought.`,
  },
  group_of_eight: {
    name: "Group of Eight (AU)",
    description: "Australia's Leading Universities",
    category: "institution",
    instructions: `Format suitable for Australia's Group of Eight universities. Follow Australian academic integrity guidelines. Be comprehensive about AI tools, purposes, and verification processes.`,
  },
  iit_iim: {
    name: "IITs & IIMs (India)",
    description: "Premier Indian Institutions",
    category: "institution",
    instructions: `Format suitable for IITs, IIMs, and other premier Indian institutions. Use formal academic language. Be explicit about AI assistance while emphasizing rigorous intellectual contribution.`,
  },

  // Generic/Universal
  generic: {
    name: "Universal/Generic",
    description: "Works for any institution",
    category: "generic",
    instructions: `Use clear, professional academic language suitable for any institution worldwide. Be transparent about: (1) Which AI tools were used, (2) Purpose of AI assistance, (3) How output was integrated, (4) Human oversight and verification. This format prioritizes clarity and honesty.`,
  },
  minimal: {
    name: "Minimal Disclosure",
    description: "Brief statement for minor AI use",
    category: "generic",
    instructions: `Generate a brief, minimal disclosure for minor AI assistance (e.g., grammar checking, spell checking). Keep it concise - 1-2 sentences acknowledging the tool used and its limited scope.`,
  },
  comprehensive: {
    name: "Comprehensive Disclosure",
    description: "Detailed disclosure for extensive AI use",
    category: "generic",
    instructions: `Generate a comprehensive, detailed disclosure for extensive AI use. Include: all tools used with versions if known, specific prompts or types of queries, how each output was evaluated and modified, extent of human oversight, and statement of academic integrity. Suitable when AI played a significant role.`,
  },
};

// Get templates organized by category
export function getTemplatesByCategory() {
  const categories: Record<string, { name: string; templates: Array<{ id: string; name: string; description: string }> }> = {
    citation: { name: "Citation Styles", templates: [] },
    regional_na: { name: "North America", templates: [] },
    regional_eu: { name: "Europe", templates: [] },
    regional_apac: { name: "Asia Pacific", templates: [] },
    regional_mea: { name: "Middle East & Africa", templates: [] },
    regional_latam: { name: "Latin America", templates: [] },
    publisher: { name: "Academic Publishers", templates: [] },
    institution: { name: "Institution Types", templates: [] },
    generic: { name: "Universal", templates: [] },
  };

  for (const [id, template] of Object.entries(DISCLOSURE_TEMPLATES)) {
    const category = categories[template.category];
    if (category) {
      category.templates.push({
        id,
        name: template.name,
        description: template.description,
      });
    }
  }

  return categories;
}

// Disclosure statement generation prompt
export function generateDisclosurePrompt(input: {
  aiTools: string[];
  purpose: string;
  description: string;
  promptsUsed?: string[];
  outputUsage: string;
  template: string;
  institution?: string;
  assignmentType?: string;
}): { role: "system" | "user" | "assistant"; content: string }[] {
  const templateConfig = DISCLOSURE_TEMPLATES[input.template] || DISCLOSURE_TEMPLATES.generic;

  return [
    {
      role: "system",
      content: `You are an expert academic writing assistant specializing in AI disclosure statements for academic integrity.

Your task is to generate a professional, transparent AI disclosure statement for academic work.

TEMPLATE REQUIREMENTS:
${templateConfig.instructions}

CORE GUIDELINES:
- Be honest and transparent about AI usage
- Use appropriate academic language for the template
- Include all relevant details provided
- Maintain academic integrity principles
- The statement should be professional and suitable for formal submission

The statement MUST:
1. Clearly identify which AI tools were used
2. Explain the specific purpose(s) of AI assistance
3. Describe how the AI output was reviewed, verified, and integrated
4. Include a statement of human oversight and responsibility
5. Be formatted appropriately for the selected template/region

${input.institution ? `INSTITUTION CONTEXT: This is for ${input.institution}. Ensure compliance with typical policies for this type of institution.` : ""}
${input.assignmentType ? `ASSIGNMENT TYPE: ${input.assignmentType}` : ""}

Output ONLY the disclosure statement, no explanations, headers, or meta-commentary.`,
    },
    {
      role: "user",
      content: `Generate an AI disclosure statement with the following details:

AI Tools Used: ${input.aiTools.join(", ")}
Purpose of AI Assistance: ${input.purpose}
Description of AI Use: ${input.description}
${input.promptsUsed?.length ? `Types of Prompts/Queries Used: ${input.promptsUsed.join("; ")}` : ""}
How Output Was Used/Modified: ${input.outputUsage}

Template/Format: ${templateConfig.name} (${templateConfig.description})`,
    },
  ];
}

// Prompt coaching analysis prompt
export function generatePromptAnalysisPrompt(
  prompt: string,
  targetAI?: string
): { role: "system" | "user" | "assistant"; content: string }[] {
  return [
    {
      role: "system",
      content: `You are an expert prompt engineering coach. Analyze prompts and provide detailed feedback.

Score each prompt on these criteria (0-25 each, total 100):
1. CLARITY (0-25): Is the request clear and unambiguous?
2. SPECIFICITY (0-25): How specific is the task or request?
3. CONTEXT (0-25): Is sufficient background/context provided?
4. STRUCTURE (0-25): Is it well-organized and formatted?

Respond in JSON format:
{
  "score": <total 0-100>,
  "breakdown": {
    "clarity": <0-25>,
    "specificity": <0-25>,
    "context": <0-25>,
    "structure": <0-25>
  },
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "improvedPrompt": "An improved version of the prompt"
}

Be constructive but honest. Focus on actionable improvements.`,
    },
    {
      role: "user",
      content: `Analyze this prompt${targetAI ? ` (intended for ${targetAI})` : ""}:

"${prompt}"`,
    },
  ];
}

// ==================== ASSIGNMENT AUDIT PROMPTS ====================
// CIDI Framework: Context, Integrity, Details, Insight
// Brutal truth scoring with evidence-based analysis, NO hallucinations

export function generateAssignmentAuditPrompt(input: {
  submissionContent: string;
  assignmentType: string;
  rubricContent?: string;
  assignmentInstructions?: string;
  subjectArea?: string;
  wordCountTarget?: number;
}): { role: "system" | "user" | "assistant"; content: string }[] {
  const hasRubric = !!input.rubricContent;
  const hasInstructions = !!input.assignmentInstructions;

  return [
    {
      role: "system",
      content: `You are a BRUTALLY HONEST academic reviewer applying the CIDI Framework to evaluate student work. Your job is to tell the HARSH TRUTH about what works and what doesn't - students need honest feedback, not encouragement.

## CRITICAL RULES - FOLLOW EXACTLY:
1. **NO HALLUCINATIONS**: Only reference text that ACTUALLY EXISTS in the submission. Quote directly.
2. **EVIDENCE-BASED**: Every claim must have a quote or specific location reference.
3. **BRUTAL HONESTY**: If something is weak, say it clearly. Students can't improve from false praise.
4. **ACTIONABLE**: Every criticism must include how to fix it.
5. **NO FILLER**: Don't pad with generic advice. Be specific to THIS submission.

## CIDI FRAMEWORK SCORING (0-100 each):

### CONTEXT SCORE (20% weight)
Measures: Does the work establish sufficient background for the reader?
- Is there a clear thesis/purpose statement?
- Is the audience apparent?
- Is necessary background provided?
- Are terms defined when needed?
- Score 0-30: Missing thesis, no context
- Score 31-60: Basic thesis, limited background
- Score 61-80: Clear thesis, adequate context
- Score 81-100: Excellent framing, comprehensive context

### INTEGRITY SCORE (30% weight)
Measures: Is the argument logically sound and consistent?
- Do arguments follow logically?
- Are there contradictions?
- Are claims supported by evidence?
- Are transitions smooth?
- Score 0-30: Major logical flaws, contradictions
- Score 31-60: Some unsupported claims, weak transitions
- Score 61-80: Generally logical, minor issues
- Score 81-100: Airtight logic, excellent flow

### DETAILS SCORE (25% weight)
Measures: Are specifics provided rather than vague generalities?
- Are there specific examples?
- Are data/statistics cited?
- Is language concrete vs abstract?
- Are claims quantified when possible?
- Score 0-30: Mostly vague, no specifics
- Score 31-60: Some specifics, many generalizations
- Score 61-80: Good detail, occasional vagueness
- Score 81-100: Rich in specifics, concrete throughout

### INSIGHT SCORE (25% weight)
Measures: Does the work show original thinking?
- Are there novel arguments/perspectives?
- Does it go beyond summary to analysis?
- Is there synthesis of multiple sources/ideas?
- Is critical thinking evident?
- Score 0-30: Purely descriptive, no analysis
- Score 31-60: Some analysis, mostly summary
- Score 61-80: Good analysis, some original thought
- Score 81-100: Deep insight, original contribution

${hasRubric ? `
## RUBRIC REQUIREMENTS
Match each rubric requirement to evidence in the text. Be strict - partial matches are "partial", not "met".
` : ''}

${hasInstructions ? `
## ASSIGNMENT INSTRUCTIONS
Evaluate how well the submission addresses the specific requirements.
` : ''}

## OUTPUT FORMAT (JSON):
\`\`\`json
{
  "contextScore": <0-100>,
  "contextEvidence": {
    "strengths": ["quote or observation from text"],
    "gaps": ["what's missing"],
    "citationsFound": <actual number>,
    "backgroundProvided": <boolean>,
    "audienceClarity": <boolean>
  },
  "integrityScore": <0-100>,
  "integrityEvidence": {
    "logicalFlow": <boolean>,
    "contradictions": [{"statement1": "quote", "statement2": "quote", "location": "paragraph X"}],
    "unsupportedClaims": [{"claim": "quote", "location": "paragraph X"}],
    "transitionQuality": "poor|adequate|strong"
  },
  "detailsScore": <0-100>,
  "detailsEvidence": {
    "specificExamples": <count>,
    "vagueStatements": [{"text": "quote", "location": "paragraph X", "suggestion": "how to make specific"}],
    "dataPoints": <count>,
    "concreteLanguage": <boolean>
  },
  "insightScore": <0-100>,
  "insightEvidence": {
    "originalArguments": ["quote of original point"],
    "genericStatements": [{"text": "quote", "location": "paragraph X"}],
    "analysisDepth": "shallow|moderate|deep",
    "criticalThinking": <boolean>,
    "synthesisPresent": <boolean>
  },
  "thirdPartySummary": "What a professor/reader would take away from this work in 2-3 sentences. Be honest about strengths AND weaknesses.",
  ${hasRubric ? `"requirementsAnalysis": {
    "total": <number>,
    "met": <number>,
    "partial": <number>,
    "missing": <number>,
    "items": [{"requirement": "text", "status": "met|partial|missing", "evidence": "where found or why missing"}]
  },` : ''}
  "gapAnalysis": [
    {
      "gap": "what's missing",
      "priority": "high|medium|low",
      "fixTimeMinutes": <estimate>,
      "gradeImpact": "+X to +Y points",
      "howToFix": "specific action to take"
    }
  ],
  "improvements": [
    {
      "action": "specific improvement",
      "location": "paragraph/section",
      "effort": "easy|medium|hard",
      "impact": "high|medium|low",
      "example": "optional example of better version"
    }
  ],
  "issues": [
    {
      "type": "repetition|vague|unsupported|tangent|grammar|structure",
      "location": "paragraph X",
      "text": "problematic text quote",
      "suggestion": "how to fix"
    }
  ]
}
\`\`\`

Remember: Students trust you to tell them the truth. Generic feedback helps no one. Be specific, be honest, be helpful.`,
    },
    {
      role: "user",
      content: `Analyze this ${input.assignmentType}${input.subjectArea ? ` for ${input.subjectArea}` : ''}${input.wordCountTarget ? ` (target: ${input.wordCountTarget} words)` : ''}:

${hasInstructions ? `## ASSIGNMENT INSTRUCTIONS:\n${input.assignmentInstructions}\n\n` : ''}${hasRubric ? `## RUBRIC:\n${input.rubricContent}\n\n` : ''}## SUBMISSION:
${input.submissionContent}`,
    },
  ];
}

// Text statistics helper functions (pure logic, no AI)
export function calculateTextStats(text: string): {
  wordCount: number;
  paragraphCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  readingGradeLevel: number;
} {
  // Word count
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Paragraph count (split by double newlines or multiple newlines)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  // Sentence count (approximate using punctuation)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  // Average sentence length
  const avgSentenceLength = Number((wordCount / sentenceCount).toFixed(1));

  // Flesch-Kincaid Grade Level (simplified)
  // Grade = 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
  // Simplified syllable count: count vowel groups
  const syllables = words.reduce((total, word) => {
    const syllableMatches = word.toLowerCase().match(/[aeiouy]+/g);
    return total + (syllableMatches ? syllableMatches.length : 1);
  }, 0);
  const avgSyllablesPerWord = syllables / Math.max(1, wordCount);
  const readingGradeLevel = Math.max(0,
    Math.min(18,
      Number((0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59).toFixed(1))
    )
  );

  return {
    wordCount,
    paragraphCount,
    sentenceCount,
    avgSentenceLength,
    readingGradeLevel,
  };
}

// Citation detection (pattern matching, no AI)
export function detectCitations(text: string): Array<{
  text: string;
  type: 'apa' | 'mla' | 'chicago' | 'ieee' | 'harvard' | 'unknown';
  isValid: boolean;
}> {
  const citations: Array<{
    text: string;
    type: 'apa' | 'mla' | 'chicago' | 'ieee' | 'harvard' | 'unknown';
    isValid: boolean;
  }> = [];

  // APA pattern: (Author, Year) or (Author, Year, p. X)
  const apaPattern = /\([A-Z][a-z]+(?:\s(?:&|and)\s[A-Z][a-z]+)*,\s\d{4}(?:,\sp\.\s?\d+)?\)/g;
  const apaMatches = text.match(apaPattern) || [];
  apaMatches.forEach(match => {
    citations.push({ text: match, type: 'apa', isValid: true });
  });

  // MLA pattern: (Author Page) or (Author "Title")
  const mlaPattern = /\([A-Z][a-z]+(?:\s\d+)?(?:\s"[^"]+")?\)/g;
  const mlaMatches = text.match(mlaPattern) || [];
  mlaMatches.forEach(match => {
    if (!citations.some(c => c.text === match)) {
      citations.push({ text: match, type: 'mla', isValid: true });
    }
  });

  // IEEE pattern: [1] or [1, 2]
  const ieeePattern = /\[\d+(?:,\s?\d+)*\]/g;
  const ieeeMatches = text.match(ieeePattern) || [];
  ieeeMatches.forEach(match => {
    citations.push({ text: match, type: 'ieee', isValid: true });
  });

  // Generic citation indicators
  const genericPatterns = [
    /according to [A-Z][a-z]+/gi,
    /[A-Z][a-z]+ (?:states|argues|claims|suggests|notes) that/gi,
    /as (?:cited|quoted) in/gi,
  ];

  genericPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      if (!citations.some(c => c.text.includes(match))) {
        citations.push({ text: match, type: 'unknown', isValid: true });
      }
    });
  });

  return citations;
}

// Calculate overall relevance score with weights
export function calculateRelevanceScore(scores: {
  context: number;
  integrity: number;
  details: number;
  insight: number;
}): number {
  // Weights: Context 20%, Integrity 30%, Details 25%, Insight 25%
  const weighted = (
    scores.context * 0.20 +
    scores.integrity * 0.30 +
    scores.details * 0.25 +
    scores.insight * 0.25
  );
  return Math.round(weighted);
}

// University AI Policy Links
export const UNIVERSITY_AI_POLICIES: Record<string, { name: string; url: string; region: string }> = {
  // US
  harvard: { name: "Harvard University", url: "https://provost.harvard.edu/guidelines-using-chatgpt-and-other-generative-ai-tools-harvard", region: "US" },
  mit: { name: "MIT", url: "https://genai.mit.edu/", region: "US" },
  stanford: { name: "Stanford University", url: "https://teachingcommons.stanford.edu/news/stanford-guidance-ai-generated-text-assignments", region: "US" },
  yale: { name: "Yale University", url: "https://poorvucenter.yale.edu/AIguidance", region: "US" },
  princeton: { name: "Princeton University", url: "https://libguides.princeton.edu/generativeAI", region: "US" },
  columbia: { name: "Columbia University", url: "https://ctl.columbia.edu/resources-and-technology/resources/ai-tools/", region: "US" },
  upenn: { name: "UPenn", url: "https://provost.upenn.edu/initiatives/artificial-intelligence", region: "US" },
  duke: { name: "Duke University", url: "https://lile.duke.edu/ai-and-teaching-at-duke-2/", region: "US" },
  berkeley: { name: "UC Berkeley", url: "https://teaching.berkeley.edu/resources/ai-pedagogy", region: "US" },
  ucla: { name: "UCLA", url: "https://www.teaching.ucla.edu/ai", region: "US" },
  nyu: { name: "NYU", url: "https://www.nyu.edu/faculty/teaching-and-learning-resources/ai-in-teaching-and-learning.html", region: "US" },

  // UK
  oxford: { name: "University of Oxford", url: "https://academic.admin.ox.ac.uk/ai-and-education", region: "UK" },
  cambridge: { name: "University of Cambridge", url: "https://www.cambridgeinternational.org/support-and-training-for-schools/artificial-intelligence/", region: "UK" },
  imperial: { name: "Imperial College London", url: "https://www.imperial.ac.uk/about/leadership-and-strategy/provost/artificial-intelligence/", region: "UK" },
  ucl: { name: "UCL", url: "https://www.ucl.ac.uk/teaching-learning/generative-ai-hub", region: "UK" },
  lse: { name: "LSE", url: "https://www.lse.ac.uk/", region: "UK" },
  edinburgh: { name: "University of Edinburgh", url: "https://www.ed.ac.uk/", region: "UK" },
  manchester: { name: "University of Manchester", url: "https://www.manchester.ac.uk/", region: "UK" },

  // Australia
  melbourne: { name: "University of Melbourne", url: "https://academicintegrity.unimelb.edu.au/understanding-ai", region: "AU" },
  sydney: { name: "University of Sydney", url: "https://www.sydney.edu.au/students/academic-integrity/ai.html", region: "AU" },
  monash: { name: "Monash University", url: "https://www.monash.edu/learning-teaching/teachhq/Teaching-practices/artificial-intelligence", region: "AU" },
  anu: { name: "Australian National University", url: "https://www.anu.edu.au/students/academic-skills/academic-integrity/using-ai-tools", region: "AU" },
  unsw: { name: "UNSW Sydney", url: "https://www.unsw.edu.au/", region: "AU" },
  queensland: { name: "University of Queensland", url: "https://www.uq.edu.au/", region: "AU" },

  // Asia
  nus: { name: "National University of Singapore", url: "https://libguides.nus.edu.sg/AI", region: "SG" },
  ntu_sg: { name: "Nanyang Technological University", url: "https://www.ntu.edu.sg/education/teaching-learning/ai", region: "SG" },
  hku: { name: "University of Hong Kong", url: "https://tl.hku.hk/generative-ai/", region: "HK" },
  cuhk: { name: "Chinese University of Hong Kong", url: "https://www.cuhk.edu.hk/", region: "HK" },
  tokyo: { name: "University of Tokyo", url: "https://www.u-tokyo.ac.jp/en/", region: "JP" },
  kyoto: { name: "Kyoto University", url: "https://www.kyoto-u.ac.jp/en", region: "JP" },
  peking: { name: "Peking University", url: "https://english.pku.edu.cn/", region: "CN" },
  tsinghua: { name: "Tsinghua University", url: "https://www.tsinghua.edu.cn/en/", region: "CN" },
  seoul: { name: "Seoul National University", url: "https://en.snu.ac.kr/", region: "KR" },
  kaist: { name: "KAIST", url: "https://www.kaist.ac.kr/en/", region: "KR" },
  ntu_taiwan: { name: "National Taiwan University", url: "https://www.ntu.edu.tw/english/", region: "TW" },

  // Europe
  eth: { name: "ETH Zurich", url: "https://ethz.ch/staffnet/en/teaching/academic-integrity.html", region: "CH" },
  epfl: { name: "EPFL", url: "https://www.epfl.ch/en/", region: "CH" },
  lmu: { name: "LMU Munich", url: "https://www.lmu.de/en/", region: "DE" },
  tu_munich: { name: "TU Munich", url: "https://www.tum.de/en/", region: "DE" },
  heidelberg: { name: "Heidelberg University", url: "https://www.uni-heidelberg.de/en", region: "DE" },
  sorbonne: { name: "Sorbonne University", url: "https://www.sorbonne-universite.fr/en", region: "FR" },
  sciences_po: { name: "Sciences Po", url: "https://www.sciencespo.fr/en/", region: "FR" },
  amsterdam: { name: "University of Amsterdam", url: "https://www.uva.nl/en", region: "NL" },
  delft: { name: "TU Delft", url: "https://www.tudelft.nl/en/", region: "NL" },
  kth: { name: "KTH Royal Institute", url: "https://www.kth.se/en", region: "SE" },

  // Canada
  toronto: { name: "University of Toronto", url: "https://www.viceprovostundergrad.utoronto.ca/strategic-priorities/digital-learning/artificial-intelligence/", region: "CA" },
  ubc: { name: "University of British Columbia", url: "https://ctlt.ubc.ca/resources/artificial-intelligence/", region: "CA" },
  mcgill: { name: "McGill University", url: "https://www.mcgill.ca/tls/ai-teaching-and-learning", region: "CA" },
  waterloo: { name: "University of Waterloo", url: "https://uwaterloo.ca/", region: "CA" },

  // India
  iit_bombay: { name: "IIT Bombay", url: "https://www.iitb.ac.in/", region: "IN" },
  iit_delhi: { name: "IIT Delhi", url: "https://home.iitd.ac.in/", region: "IN" },
  iisc: { name: "IISc Bangalore", url: "https://www.iisc.ac.in/", region: "IN" },
  iim_ahmedabad: { name: "IIM Ahmedabad", url: "https://www.iima.ac.in/", region: "IN" },
  du: { name: "University of Delhi", url: "https://www.du.ac.in/", region: "IN" },
  jnu: { name: "JNU", url: "https://www.jnu.ac.in/", region: "IN" },

  // Middle East
  kaust: { name: "KAUST", url: "https://www.kaust.edu.sa/en", region: "SA" },
  aud: { name: "American University Dubai", url: "https://www.aud.edu/", region: "AE" },
  tau: { name: "Tel Aviv University", url: "https://english.tau.ac.il/", region: "IL" },
  technion: { name: "Technion", url: "https://www.technion.ac.il/en/", region: "IL" },

  // Latin America
  usp: { name: "University of São Paulo", url: "https://www5.usp.br/english/", region: "BR" },
  unicamp: { name: "UNICAMP", url: "https://www.unicamp.br/unicamp/english", region: "BR" },
  unam: { name: "UNAM Mexico", url: "https://www.unam.mx/", region: "MX" },
  tec: { name: "Tecnológico de Monterrey", url: "https://tec.mx/en", region: "MX" },
  uc_chile: { name: "Pontificia Universidad Católica", url: "https://www.uc.cl/en", region: "CL" },

  // Africa
  uct: { name: "University of Cape Town", url: "https://www.uct.ac.za/", region: "ZA" },
  wits: { name: "University of the Witwatersrand", url: "https://www.wits.ac.za/", region: "ZA" },
  cairo: { name: "Cairo University", url: "https://cu.edu.eg/Home", region: "EG" },
  nairobi: { name: "University of Nairobi", url: "https://www.uonbi.ac.ke/", region: "KE" },
};

export function getPoliciesByRegion() {
  const regionNames: Record<string, string> = {
    US: "United States",
    UK: "United Kingdom",
    AU: "Australia",
    SG: "Singapore",
    HK: "Hong Kong",
    JP: "Japan",
    CN: "China",
    KR: "South Korea",
    TW: "Taiwan",
    CH: "Switzerland",
    DE: "Germany",
    FR: "France",
    NL: "Netherlands",
    SE: "Sweden",
    CA: "Canada",
    IN: "India",
    SA: "Saudi Arabia",
    AE: "UAE",
    IL: "Israel",
    BR: "Brazil",
    MX: "Mexico",
    CL: "Chile",
    ZA: "South Africa",
    EG: "Egypt",
    KE: "Kenya",
  };

  const regions: Record<string, { name: string; universities: Array<{ id: string; name: string; url: string }> }> = {};

  for (const [id, policy] of Object.entries(UNIVERSITY_AI_POLICIES)) {
    if (!regions[policy.region]) {
      regions[policy.region] = {
        name: regionNames[policy.region] || policy.region,
        universities: [],
      };
    }
    regions[policy.region].universities.push({ id, name: policy.name, url: policy.url });
  }

  return regions;
}
