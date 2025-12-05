'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PlagiarismMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  matchType: 'exact' | 'paraphrase' | 'ai-pattern';
  confidence: number;
  source?: string;
}

interface PlagiarismResult {
  overallScore: number;
  aiGeneratedScore: number;
  matches: PlagiarismMatch[];
  summary: string;
  suggestions: string[];
  stats: {
    wordCount: number;
    characterCount: number;
    matchCount: number;
  };
}

export default function PlagiarismPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!text.trim() || text.length < 50) {
      setError('Please enter at least 50 characters to check.');
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch('/api/plagiarism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check plagiarism');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error checking plagiarism. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getSeverityBadge = (match: PlagiarismMatch) => {
    const colors: Record<string, string> = {
      'exact': 'bg-red-100 text-red-800',
      'paraphrase': 'bg-yellow-100 text-yellow-800',
      'ai-pattern': 'bg-purple-100 text-purple-800'
    };
    return colors[match.matchType] || 'bg-gray-100 text-gray-800';
  };

  const highlightText = () => {
    if (!result || result.matches.length === 0) return text;

    let highlighted = text;
    const sortedMatches = [...result.matches].sort((a, b) => b.startIndex - a.startIndex);

    for (const match of sortedMatches) {
      const before = highlighted.substring(0, match.startIndex);
      const matchText = highlighted.substring(match.startIndex, match.endIndex);
      const after = highlighted.substring(match.endIndex);

      const color = match.matchType === 'ai-pattern' ? 'bg-purple-200' :
                    match.matchType === 'exact' ? 'bg-red-200' : 'bg-yellow-200';

      highlighted = `${before}<mark class="${color} px-0.5 rounded">${matchText}</mark>${after}`;
    }

    return highlighted;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Plagiarism & AI Detection</h1>
        <p className="text-muted-foreground">
          Check your text for originality and detect AI-generated content patterns
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Enter Your Text</CardTitle>
              <CardDescription>
                Paste your essay, paper, or any text to check for originality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste your text here (minimum 50 characters)...

For best results, enter at least 200 words. The analysis checks for:
- AI-generated content patterns
- Common clichés and overused phrases
- Sentence variation and vocabulary richness"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-muted-foreground">
                  {text.split(/\s+/).filter(w => w.length > 0).length} words | {text.length} chars
                </span>
                <Button onClick={handleCheck} disabled={isChecking || text.length < 50}>
                  {isChecking ? 'Analyzing...' : 'Check Originality'}
                </Button>
              </div>
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Highlighted Text */}
          {result && result.matches.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Highlighted Issues</CardTitle>
                <CardDescription>
                  <span className="inline-flex gap-3 mt-2">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 bg-purple-200 rounded" /> AI Pattern
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 bg-yellow-200 rounded" /> Cliché
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 bg-red-200 rounded" /> Match
                    </span>
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="p-4 bg-slate-50 rounded-lg text-sm leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: highlightText() }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Originality Score */}
              <Card className={`border ${getScoreBg(result.overallScore)}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Originality Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}>
                    {result.overallScore}%
                  </div>
                  <Progress
                    value={result.overallScore}
                    className="mt-2 h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {result.overallScore >= 80 ? 'Highly Original' :
                     result.overallScore >= 60 ? 'Moderately Original' :
                     result.overallScore >= 40 ? 'Some Concerns' : 'Needs Improvement'}
                  </p>
                </CardContent>
              </Card>

              {/* AI Detection Score */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    AI-Generated Likelihood
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(100 - result.aiGeneratedScore)}`}>
                    {result.aiGeneratedScore}%
                  </div>
                  <Progress
                    value={result.aiGeneratedScore}
                    className="mt-2 h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {result.aiGeneratedScore < 30 ? 'Likely human-written' :
                     result.aiGeneratedScore < 60 ? 'Mixed patterns detected' :
                     'High AI-generated likelihood'}
                  </p>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                  {result.stats && (
                    <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                      <span>{result.stats.wordCount} words</span>
                      <span>{result.stats.matchCount} issues</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Issues Found */}
              {result.matches.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Issues Found ({result.matches.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                    {result.matches.slice(0, 10).map((match, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded text-xs">
                        <Badge className={`${getSeverityBadge(match)} text-xs mb-1`}>
                          {match.matchType === 'ai-pattern' ? 'AI Pattern' :
                           match.matchType === 'paraphrase' ? 'Cliché' : 'Match'}
                        </Badge>
                        <p className="font-mono truncate">&ldquo;{match.text}&rdquo;</p>
                        {match.source && (
                          <p className="text-muted-foreground mt-1">{match.source}</p>
                        )}
                      </div>
                    ))}
                    {result.matches.length > 10 && (
                      <p className="text-xs text-center text-muted-foreground">
                        +{result.matches.length - 10} more issues
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Suggestions to Improve</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-sm flex gap-2">
                          <span className="text-blue-600 flex-shrink-0">•</span>
                          <span className="text-muted-foreground">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Ready to Check</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your text and click &ldquo;Check Originality&rdquo; to analyze for plagiarism and AI-generated content.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.414 1.415l.708-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
              </svg>
              AI Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Identifies patterns commonly found in AI-generated text like ChatGPT, Claude, and others.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              Writing Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Analyzes sentence variation, vocabulary richness, and writing patterns for authenticity.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Improvement Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get actionable suggestions to make your writing more original and authentic.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
