// ScholarSync - Grammar Detection and Correction Library
// Advanced grammar checking with suggestions

export interface GrammarIssue {
  type: 'spelling' | 'grammar' | 'punctuation' | 'style' | 'clarity';
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  text: string;
  startIndex: number;
  endIndex: number;
  suggestions: string[];
  rule: string;
}

export interface GrammarResult {
  score: number; // 0-100
  issues: GrammarIssue[];
  stats: {
    wordCount: number;
    sentenceCount: number;
    averageSentenceLength: number;
    readabilityScore: number; // Flesch-Kincaid
    gradeLevel: string;
  };
  summary: string;
}

// Common spelling mistakes
const SPELLING_MISTAKES: Record<string, string[]> = {
  'recieve': ['receive'],
  'seperate': ['separate'],
  'occured': ['occurred'],
  'occurence': ['occurrence'],
  'accomodate': ['accommodate'],
  'acheive': ['achieve'],
  'arguement': ['argument'],
  'begining': ['beginning'],
  'beleive': ['believe'],
  'calender': ['calendar'],
  'catagory': ['category'],
  'commited': ['committed'],
  'concensus': ['consensus'],
  'definately': ['definitely'],
  'embarass': ['embarrass'],
  'enviroment': ['environment'],
  'existance': ['existence'],
  'foriegn': ['foreign'],
  'goverment': ['government'],
  'harrass': ['harass'],
  'independant': ['independent'],
  'judgement': ['judgment'],
  'liason': ['liaison'],
  'maintainance': ['maintenance'],
  'millenium': ['millennium'],
  'neccessary': ['necessary'],
  'noticable': ['noticeable'],
  'occassion': ['occasion'],
  'paralell': ['parallel'],
  'persistant': ['persistent'],
  'posession': ['possession'],
  'priviledge': ['privilege'],
  'pronounciation': ['pronunciation'],
  'publically': ['publicly'],
  'questionaire': ['questionnaire'],
  'recomend': ['recommend'],
  'refered': ['referred'],
  'relevent': ['relevant'],
  'rythm': ['rhythm'],
  'sieze': ['seize'],
  'supercede': ['supersede'],
  'thier': ['their'],
  'tommorow': ['tomorrow'],
  'truely': ['truly'],
  'untill': ['until'],
  'wierd': ['weird'],
  'writting': ['writing'],
  'alot': ['a lot'],
  'aswell': ['as well'],
  'incase': ['in case'],
  'infact': ['in fact'],
  'alright': ['all right'],
  'its\'': ['its', "it's"],
};

// Grammar rules with patterns
const GRAMMAR_RULES: Array<{
  pattern: RegExp;
  message: string;
  type: 'grammar' | 'punctuation' | 'style';
  severity: 'error' | 'warning' | 'suggestion';
  suggestion: (match: string) => string[];
  rule: string;
}> = [
  // Double words
  {
    pattern: /\b(\w+)\s+\1\b/gi,
    message: 'Repeated word detected',
    type: 'grammar',
    severity: 'error',
    suggestion: (match) => [match.split(/\s+/)[0]],
    rule: 'repeated-word'
  },
  // Subject-verb agreement: "they was"
  {
    pattern: /\b(they|we|you)\s+(was|is)\b/gi,
    message: 'Subject-verb agreement error',
    type: 'grammar',
    severity: 'error',
    suggestion: (match) => {
      if (match.toLowerCase().includes('was')) return [match.replace(/was/i, 'were')];
      return [match.replace(/is/i, 'are')];
    },
    rule: 'subject-verb-agreement'
  },
  // "he/she were"
  {
    pattern: /\b(he|she|it)\s+were\b/gi,
    message: 'Subject-verb agreement error',
    type: 'grammar',
    severity: 'error',
    suggestion: (match) => [match.replace(/were/i, 'was')],
    rule: 'subject-verb-agreement'
  },
  // "a" before vowel
  {
    pattern: /\ba\s+([aeiou]\w+)/gi,
    message: 'Use "an" before words starting with vowel sounds',
    type: 'grammar',
    severity: 'error',
    suggestion: (match) => ['an ' + match.split(/\s+/)[1]],
    rule: 'article-agreement'
  },
  // "an" before consonant
  {
    pattern: /\ban\s+([bcdfghjklmnpqrstvwxyz]\w+)/gi,
    message: 'Use "a" before words starting with consonant sounds',
    type: 'grammar',
    severity: 'warning',
    suggestion: (match) => ['a ' + match.split(/\s+/)[1]],
    rule: 'article-agreement'
  },
  // Double negatives
  {
    pattern: /\b(don't|doesn't|didn't|won't|wouldn't|can't|couldn't|shouldn't)\s+\w*\s*(no|nothing|nobody|nowhere|neither|never)\b/gi,
    message: 'Double negative detected',
    type: 'grammar',
    severity: 'error',
    suggestion: () => ['Consider rephrasing to remove double negative'],
    rule: 'double-negative'
  },
  // Missing comma after introductory phrase
  {
    pattern: /^(However|Therefore|Moreover|Furthermore|Nevertheless|Consequently|Meanwhile|Afterward|Finally|Initially|Additionally|Subsequently)\s+[a-z]/gm,
    message: 'Missing comma after introductory word',
    type: 'punctuation',
    severity: 'warning',
    suggestion: (match) => [match.replace(/^(\w+)\s+/, '$1, ')],
    rule: 'comma-after-intro'
  },
  // Passive voice
  {
    pattern: /\b(was|were|is|are|been|being)\s+(written|done|made|given|taken|seen|found|told|asked|used|called|considered)\b/gi,
    message: 'Consider using active voice',
    type: 'style',
    severity: 'suggestion',
    suggestion: () => ['Consider rephrasing in active voice'],
    rule: 'passive-voice'
  },
  // Run-on sentences (very long without punctuation)
  {
    pattern: /[^.!?]{200,}[.!?]/g,
    message: 'Sentence may be too long. Consider breaking it up.',
    type: 'style',
    severity: 'warning',
    suggestion: () => ['Consider breaking this into multiple sentences'],
    rule: 'sentence-length'
  },
  // Missing period at end
  {
    pattern: /[a-z]\s*$/,
    message: 'Missing punctuation at end of text',
    type: 'punctuation',
    severity: 'warning',
    suggestion: (match) => [match + '.'],
    rule: 'end-punctuation'
  },
  // Multiple spaces
  {
    pattern: /\s{2,}/g,
    message: 'Multiple spaces detected',
    type: 'punctuation',
    severity: 'warning',
    suggestion: () => [' '],
    rule: 'multiple-spaces'
  },
  // Space before punctuation
  {
    pattern: /\s+[.,!?;:]/g,
    message: 'Remove space before punctuation',
    type: 'punctuation',
    severity: 'error',
    suggestion: (match) => [match.trim()],
    rule: 'space-before-punct'
  },
  // No space after punctuation
  {
    pattern: /[.,!?;:][A-Za-z]/g,
    message: 'Add space after punctuation',
    type: 'punctuation',
    severity: 'error',
    suggestion: (match) => [match[0] + ' ' + match[1]],
    rule: 'space-after-punct'
  },
  // Their/there/they're confusion
  {
    pattern: /\b(their|there|they're)\s+(going|coming|doing|making|taking|getting|having)\b/gi,
    message: "Check 'their/there/they're' usage",
    type: 'grammar',
    severity: 'warning',
    suggestion: () => ["they're"],
    rule: 'homophone-confusion'
  },
  // Your/you're confusion
  {
    pattern: /\byour\s+(going|coming|doing|making|taking|getting|having|being|right|wrong|welcome)\b/gi,
    message: "Should this be 'you're'?",
    type: 'grammar',
    severity: 'warning',
    suggestion: (match) => ["you're " + match.split(/\s+/)[1]],
    rule: 'homophone-confusion'
  },
  // Its/it's confusion
  {
    pattern: /\bit's\s+(own|self|way|place|time|name)\b/gi,
    message: "Should this be 'its' (possessive)?",
    type: 'grammar',
    severity: 'warning',
    suggestion: (match) => ['its ' + match.split(/\s+/)[1]],
    rule: 'homophone-confusion'
  },
  // Affect/effect confusion
  {
    pattern: /\bthe\s+affect\b/gi,
    message: "'affect' is usually a verb. Did you mean 'effect'?",
    type: 'grammar',
    severity: 'warning',
    suggestion: () => ['the effect'],
    rule: 'word-confusion'
  },
  // Then/than confusion
  {
    pattern: /\b(more|less|better|worse|greater|fewer|rather)\s+then\b/gi,
    message: "Use 'than' for comparisons",
    type: 'grammar',
    severity: 'error',
    suggestion: (match) => [match.replace(/then/i, 'than')],
    rule: 'word-confusion'
  },
  // Wordiness
  {
    pattern: /\b(in order to|due to the fact that|at this point in time|in the event that)\b/gi,
    message: 'Consider using a simpler phrase',
    type: 'style',
    severity: 'suggestion',
    suggestion: (match) => {
      const replacements: Record<string, string> = {
        'in order to': 'to',
        'due to the fact that': 'because',
        'at this point in time': 'now',
        'in the event that': 'if'
      };
      return [replacements[match.toLowerCase()] || match];
    },
    rule: 'wordiness'
  },
];

// Check spelling
function checkSpelling(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];
  const words = text.split(/\b/);
  let currentIndex = 0;

  for (const word of words) {
    const lowerWord = word.toLowerCase();
    if (SPELLING_MISTAKES[lowerWord]) {
      issues.push({
        type: 'spelling',
        severity: 'error',
        message: `Possible spelling mistake: "${word}"`,
        text: word,
        startIndex: currentIndex,
        endIndex: currentIndex + word.length,
        suggestions: SPELLING_MISTAKES[lowerWord],
        rule: 'spelling'
      });
    }
    currentIndex += word.length;
  }

  return issues;
}

// Check grammar rules
function checkGrammarRules(text: string): GrammarIssue[] {
  const issues: GrammarIssue[] = [];

  for (const rule of GRAMMAR_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Skip some false positives
      if (rule.rule === 'article-agreement') {
        // Skip words that sound like they start with consonants despite starting with vowels
        const nextWord = match[1]?.toLowerCase();
        const exceptions = ['university', 'uniform', 'union', 'unique', 'unit', 'use', 'user', 'usual', 'european', 'one'];
        if (exceptions.some(e => nextWord?.startsWith(e))) continue;
      }

      issues.push({
        type: rule.type,
        severity: rule.severity,
        message: rule.message,
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        suggestions: rule.suggestion(match[0]),
        rule: rule.rule
      });
    }
  }

  return issues;
}

// Calculate Flesch-Kincaid readability score
function calculateReadability(text: string): { score: number; gradeLevel: string } {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);

  if (sentences.length === 0 || words.length === 0) {
    return { score: 0, gradeLevel: 'N/A' };
  }

  // Count syllables (simplified)
  const countSyllables = (word: string): number => {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');

    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  };

  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  // Flesch Reading Ease Score
  const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  const boundedScore = Math.max(0, Math.min(100, fleschScore));

  // Flesch-Kincaid Grade Level
  const gradeLevel = (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59;

  let gradeLevelText: string;
  if (gradeLevel <= 5) gradeLevelText = 'Elementary';
  else if (gradeLevel <= 8) gradeLevelText = 'Middle School';
  else if (gradeLevel <= 12) gradeLevelText = 'High School';
  else if (gradeLevel <= 16) gradeLevelText = 'College';
  else gradeLevelText = 'Graduate';

  return { score: Math.round(boundedScore), gradeLevel: gradeLevelText };
}

// Main grammar check function
export async function checkGrammar(text: string): Promise<GrammarResult> {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      issues: [],
      stats: {
        wordCount: 0,
        sentenceCount: 0,
        averageSentenceLength: 0,
        readabilityScore: 0,
        gradeLevel: 'N/A'
      },
      summary: 'No text provided'
    };
  }

  // Collect all issues
  const spellingIssues = checkSpelling(text);
  const grammarIssues = checkGrammarRules(text);

  const allIssues = [...spellingIssues, ...grammarIssues];

  // Sort by position
  allIssues.sort((a, b) => a.startIndex - b.startIndex);

  // Calculate statistics
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const { score: readabilityScore, gradeLevel } = calculateReadability(text);

  // Calculate grammar score
  // Start at 100, deduct points for issues
  const errorDeduction = allIssues.filter(i => i.severity === 'error').length * 5;
  const warningDeduction = allIssues.filter(i => i.severity === 'warning').length * 2;
  const suggestionDeduction = allIssues.filter(i => i.severity === 'suggestion').length * 0.5;

  const totalDeduction = Math.min(100, errorDeduction + warningDeduction + suggestionDeduction);
  const grammarScore = Math.round(100 - totalDeduction);

  // Generate summary
  let summary: string;
  const errorCount = allIssues.filter(i => i.severity === 'error').length;
  const warningCount = allIssues.filter(i => i.severity === 'warning').length;

  if (grammarScore >= 90) {
    summary = 'Excellent! Your text has very few issues.';
  } else if (grammarScore >= 75) {
    summary = `Good writing with ${errorCount} error(s) and ${warningCount} warning(s) to review.`;
  } else if (grammarScore >= 50) {
    summary = `Several issues found: ${errorCount} error(s) and ${warningCount} warning(s). Review the suggestions below.`;
  } else {
    summary = `Multiple issues detected (${errorCount} errors, ${warningCount} warnings). Consider careful revision.`;
  }

  return {
    score: grammarScore,
    issues: allIssues,
    stats: {
      wordCount: words.length,
      sentenceCount: sentences.length,
      averageSentenceLength: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
      readabilityScore,
      gradeLevel
    },
    summary
  };
}

// Apply a suggestion to fix an issue
export function applySuggestion(text: string, issue: GrammarIssue, suggestionIndex: number = 0): string {
  if (suggestionIndex >= issue.suggestions.length) return text;

  const before = text.substring(0, issue.startIndex);
  const after = text.substring(issue.endIndex);

  return before + issue.suggestions[suggestionIndex] + after;
}

// Get all corrections applied
export function applyAllCorrections(text: string, issues: GrammarIssue[]): string {
  // Sort issues by position (descending) to avoid index shifting
  const sortedIssues = [...issues]
    .filter(i => i.severity === 'error' && i.suggestions.length > 0)
    .sort((a, b) => b.startIndex - a.startIndex);

  let correctedText = text;
  for (const issue of sortedIssues) {
    correctedText = applySuggestion(correctedText, issue, 0);
  }

  return correctedText;
}
