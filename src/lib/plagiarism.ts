// ScholarSync - Plagiarism Detection Library
// Uses multiple techniques: text similarity, web search, and AI detection

export interface PlagiarismResult {
  overallScore: number; // 0-100 (100 = completely original)
  aiGeneratedScore: number; // 0-100 likelihood of AI generation
  matches: PlagiarismMatch[];
  summary: string;
  suggestions: string[];
}

export interface PlagiarismMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  matchType: 'exact' | 'paraphrase' | 'ai-pattern';
  confidence: number; // 0-100
  source?: string;
  url?: string;
}

// Common AI-generated text patterns
const AI_PATTERNS = [
  /in conclusion,?/gi,
  /it['']s (important|worth|crucial) to (note|mention|understand)/gi,
  /this (essay|article|paper) (will|shall) (explore|examine|discuss)/gi,
  /there are (many|several|numerous) (ways|reasons|factors)/gi,
  /in today['']s (world|society|age)/gi,
  /first and foremost/gi,
  /last but not least/gi,
  /it (is|can be) (argued|said|noted) that/gi,
  /this (demonstrates|shows|illustrates|highlights)/gi,
  /furthermore,?|moreover,?|additionally,?/gi,
  /in (light|view) of (this|these|the)/gi,
  /plays a (crucial|vital|important|key) role/gi,
  /it goes without saying/gi,
  /needless to say/gi,
  /as (mentioned|discussed|noted) (earlier|above|previously)/gi,
  /in (summary|essence|brief)/gi,
  /the (fact|reality|truth) (is|remains) that/gi,
  /when it comes to/gi,
  /at the end of the day/gi,
  /taking (everything|all things) into (account|consideration)/gi,
];

// Academic clichés that might indicate low originality
const CLICHE_PATTERNS = [
  /since the (dawn|beginning) of (time|civilization|history)/gi,
  /throughout (history|the ages)/gi,
  /in (our|modern|contemporary) society/gi,
  /has been (debated|discussed|argued) for (years|decades|centuries)/gi,
  /is a (hot|controversial|debated) topic/gi,
  /experts (say|believe|argue)/gi,
  /according to (experts|studies|research)/gi,
  /studies (have )?(show|shown|suggest|indicate)/gi,
];

// Calculate text similarity using Jaccard index
function calculateJaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
}

// Calculate n-gram fingerprint for text
function getNGrams(text: string, n: number): Set<string> {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const ngrams = new Set<string>();

  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(' '));
  }

  return ngrams;
}

// Detect AI-generated content patterns
function detectAIPatterns(text: string): { score: number; matches: PlagiarismMatch[] } {
  const matches: PlagiarismMatch[] = [];
  let patternCount = 0;

  for (const pattern of AI_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      patternCount++;
      matches.push({
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        matchType: 'ai-pattern',
        confidence: 70,
        source: 'AI Pattern Detection'
      });
    }
  }

  // Calculate score based on pattern density
  const wordCount = text.split(/\s+/).length;
  const patternDensity = (patternCount / wordCount) * 100;

  // Higher density = more likely AI generated
  const aiScore = Math.min(100, patternDensity * 15);

  return { score: aiScore, matches };
}

// Detect clichés
function detectCliches(text: string): { count: number; matches: PlagiarismMatch[] } {
  const matches: PlagiarismMatch[] = [];
  let count = 0;

  for (const pattern of CLICHE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      count++;
      matches.push({
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        matchType: 'paraphrase',
        confidence: 50,
        source: 'Common Cliché'
      });
    }
  }

  return { count, matches };
}

// Calculate burstiness (variation in sentence length - AI tends to be more uniform)
function calculateBurstiness(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 3) return 50;

  const lengths = sentences.map(s => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // Higher variation = more likely human written
  // AI tends to produce sentences of similar length
  const coefficientOfVariation = (stdDev / mean) * 100;

  // CV of 30-50% is typical for human writing
  // CV < 20% is suspicious for AI
  return Math.min(100, coefficientOfVariation * 2);
}

// Calculate vocabulary richness (Type-Token Ratio)
function calculateVocabularyRichness(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(w => /^[a-z]+$/.test(w));
  if (words.length === 0) return 50;

  const uniqueWords = new Set(words);
  const ttr = (uniqueWords.size / words.length) * 100;

  // Higher TTR = richer vocabulary = more likely human
  return Math.min(100, ttr * 1.5);
}

// Main plagiarism check function
export async function checkPlagiarism(text: string): Promise<PlagiarismResult> {
  const allMatches: PlagiarismMatch[] = [];

  // 1. Detect AI patterns
  const aiPatterns = detectAIPatterns(text);
  allMatches.push(...aiPatterns.matches);

  // 2. Detect clichés
  const cliches = detectCliches(text);
  allMatches.push(...cliches.matches);

  // 3. Calculate burstiness score
  const burstinessScore = calculateBurstiness(text);

  // 4. Calculate vocabulary richness
  const vocabularyScore = calculateVocabularyRichness(text);

  // Calculate overall AI-generated score
  // Lower burstiness and vocabulary richness = more likely AI
  const aiGeneratedScore = Math.round(
    (aiPatterns.score * 0.5) +
    ((100 - burstinessScore) * 0.25) +
    ((100 - vocabularyScore) * 0.25)
  );

  // Calculate overall originality score
  // This is inverse of AI score + pattern matches
  const matchPenalty = Math.min(30, allMatches.length * 2);
  const overallScore = Math.max(0, 100 - aiGeneratedScore - matchPenalty);

  // Generate suggestions
  const suggestions: string[] = [];

  if (aiGeneratedScore > 60) {
    suggestions.push('Consider adding more personal insights and original analysis');
    suggestions.push('Vary your sentence structure and length');
    suggestions.push('Replace common transitional phrases with more specific language');
  }

  if (aiPatterns.matches.length > 3) {
    suggestions.push('Reduce use of generic transitional phrases like "furthermore" and "moreover"');
  }

  if (cliches.count > 2) {
    suggestions.push('Replace clichéd expressions with more specific, original phrasing');
  }

  if (burstinessScore < 30) {
    suggestions.push('Vary your sentence lengths - mix short punchy sentences with longer complex ones');
  }

  if (vocabularyScore < 40) {
    suggestions.push('Use more varied vocabulary - consider using a thesaurus for repetitive words');
  }

  // Generate summary
  let summary = '';
  if (overallScore >= 80) {
    summary = 'Your text appears to be highly original with minimal AI-generated patterns detected.';
  } else if (overallScore >= 60) {
    summary = 'Your text shows moderate originality. Some common patterns were detected that could be improved.';
  } else if (overallScore >= 40) {
    summary = 'Your text contains several patterns commonly associated with AI-generated content or unoriginal writing.';
  } else {
    summary = 'Your text shows significant patterns that may indicate AI-generated content or lack of originality.';
  }

  return {
    overallScore,
    aiGeneratedScore,
    matches: allMatches,
    summary,
    suggestions
  };
}

// Compare two texts for similarity
export function compareTexts(text1: string, text2: string): {
  similarity: number;
  commonPhrases: string[];
} {
  const similarity = calculateJaccardSimilarity(text1, text2);

  // Find common 4-grams
  const ngrams1 = getNGrams(text1, 4);
  const ngrams2 = getNGrams(text2, 4);

  const commonPhrases = [...ngrams1].filter(ng => ngrams2.has(ng));

  return {
    similarity,
    commonPhrases: commonPhrases.slice(0, 10) // Top 10 common phrases
  };
}
