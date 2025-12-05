"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// English variants configuration
const ENGLISH_VARIANTS = {
  'en-US': {
    name: 'American English',
    flag: '🇺🇸',
    description: 'Standard American English spelling and grammar',
    examples: ['color', 'center', 'organize'],
  },
  'en-GB': {
    name: 'British English',
    flag: '🇬🇧',
    description: 'Standard British English spelling and grammar',
    examples: ['colour', 'centre', 'organise'],
  },
  'en-AU': {
    name: 'Australian English',
    flag: '🇦🇺',
    description: 'Australian English (follows British conventions)',
    examples: ['colour', 'centre', 'organise'],
  },
  'en-CA': {
    name: 'Canadian English',
    flag: '🇨🇦',
    description: 'Canadian English (mix of British and American)',
    examples: ['colour', 'center', 'organize'],
  },
  'en-NZ': {
    name: 'New Zealand English',
    flag: '🇳🇿',
    description: 'New Zealand English (follows British conventions)',
    examples: ['colour', 'centre', 'organise'],
  },
  'en-ZA': {
    name: 'South African English',
    flag: '🇿🇦',
    description: 'South African English (follows British conventions)',
    examples: ['colour', 'centre', 'organise'],
  },
  'en-IN': {
    name: 'Indian English',
    flag: '🇮🇳',
    description: 'Indian English (follows British conventions)',
    examples: ['colour', 'centre', 'organise'],
  },
} as const;

type EnglishVariant = keyof typeof ENGLISH_VARIANTS;

interface GrammarMatch {
  message: string;
  offset: number;
  length: number;
  replacements: string[];
  rule: {
    id: string;
    description: string;
    category: string;
    issueType?: string;
  };
  context: {
    text: string;
    offset: number;
    length: number;
  };
  isSpellingVariant?: boolean;
  isRegionalSpelling?: boolean;
  shortMessage?: string;
}

interface GrammarResult {
  matches: GrammarMatch[];
  language: {
    code: string;
    name: string;
    flag: string;
    detectedLanguage?: string | null;
  };
  stats: {
    errorCount: number;
    wordCount: number;
    characterCount: number;
    byCategory: Record<string, number>;
    spellingErrors: number;
    grammarErrors: number;
  };
}

export default function GrammarPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GrammarResult | null>(null);
  const [appliedFixes, setAppliedFixes] = useState<Set<number>>(new Set());
  const [selectedVariant, setSelectedVariant] = useState<EnglishVariant>("en-US");
  const [showVariantInfo, setShowVariantInfo] = useState(false);

  // Try to detect user's region from browser
  useEffect(() => {
    try {
      const browserLang = navigator.language;
      if (browserLang.startsWith("en-")) {
        const langCode = browserLang as EnglishVariant;
        if (langCode in ENGLISH_VARIANTS) {
          setSelectedVariant(langCode);
        } else if (browserLang.includes("GB") || browserLang.includes("UK")) {
          setSelectedVariant("en-GB");
        } else if (browserLang.includes("AU")) {
          setSelectedVariant("en-AU");
        } else if (browserLang.includes("CA")) {
          setSelectedVariant("en-CA");
        }
      }
    } catch {
      // Keep default
    }
  }, []);

  const handleCheck = async () => {
    if (text.trim().length < 5) {
      setError("Please enter at least 5 characters");
      return;
    }

    setLoading(true);
    setError(null);
    setAppliedFixes(new Set());

    try {
      const response = await fetch("/api/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: selectedVariant }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check grammar");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const applyFix = (match: GrammarMatch, replacement: string, index: number) => {
    const before = text.slice(0, match.offset);
    const after = text.slice(match.offset + match.length);
    setText(before + replacement + after);
    setAppliedFixes(new Set([...appliedFixes, index]));

    // Re-check after applying
    setResult(null);
  };

  const ignoreError = (index: number) => {
    setAppliedFixes(new Set([...appliedFixes, index]));
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "grammar":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "typos":
      case "spelling":
      case "possible typo":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "punctuation":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "style":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "typography":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const activeMatches = result?.matches.filter((_, i) => !appliedFixes.has(i)) || [];
  const currentVariant = ENGLISH_VARIANTS[selectedVariant];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Grammar Check</h1>
        <p className="text-muted-foreground">
          Check your writing for grammar, spelling, and style issues with regional English support.
        </p>
      </div>

      {/* Language Selector Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">English Variant</label>
              <Select
                value={selectedVariant}
                onValueChange={(value) => setSelectedVariant(value as EnglishVariant)}
              >
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <span>{currentVariant.flag}</span>
                      <span>{currentVariant.name}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ENGLISH_VARIANTS).map(([code, variant]) => (
                    <SelectItem key={code} value={code}>
                      <span className="flex items-center gap-2">
                        <span>{variant.flag}</span>
                        <span>{variant.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TooltipProvider>
              <Tooltip open={showVariantInfo} onOpenChange={setShowVariantInfo}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowVariantInfo(!showVariantInfo)}
                  >
                    <span className="text-lg">{currentVariant.flag}</span>
                    <span>About {currentVariant.name}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs p-4">
                  <div className="space-y-2">
                    <p className="font-medium">{currentVariant.name}</p>
                    <p className="text-sm text-muted-foreground">{currentVariant.description}</p>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Example spellings:</p>
                      <div className="flex flex-wrap gap-1">
                        {currentVariant.examples.map((ex) => (
                          <Badge key={ex} variant="secondary" className="text-xs">
                            {ex}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Regional Info Banner */}
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{currentVariant.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{currentVariant.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Spellings like <span className="font-mono">{currentVariant.examples.join(", ")}</span> will be considered correct.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Text</CardTitle>
            <CardDescription>
              Paste or type your text below to check for errors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Paste your text here to check for grammar and spelling errors...\n\nTip: Using ${currentVariant.name} rules for spelling like "${currentVariant.examples[0]}" and "${currentVariant.examples[1]}"`}
              rows={15}
              className="resize-none font-mono text-sm"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {text.split(/\s+/).filter(Boolean).length} words
                </span>
                <span className="text-sm text-muted-foreground">
                  {text.length} chars
                </span>
              </div>
              <Button onClick={handleCheck} disabled={loading || text.length < 5}>
                {loading ? "Checking..." : "Check Grammar"}
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Issues Found</CardTitle>
                <CardDescription>
                  {result
                    ? `${activeMatches.length} issue${activeMatches.length !== 1 ? "s" : ""} remaining`
                    : "Check your text to see issues"}
                </CardDescription>
              </div>
              {result && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    {result.language.flag} {result.language.name}
                  </Badge>
                  <Badge variant={activeMatches.length === 0 ? "default" : "secondary"}>
                    {activeMatches.length === 0 ? "All Clear!" : `${activeMatches.length} issues`}
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Stats bar */}
            {result && result.stats.errorCount > 0 && (
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    <span>{result.stats.spellingErrors} spelling</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span>{result.stats.grammarErrors} grammar</span>
                  </div>
                  {Object.entries(result.stats.byCategory).slice(0, 3).map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-1 text-muted-foreground">
                      <span>{cat}: {count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result ? (
              activeMatches.length > 0 ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {result.matches.map((match, index) => {
                      if (appliedFixes.has(index)) return null;

                      return (
                        <div
                          key={index}
                          className={`p-4 border rounded-lg space-y-3 ${
                            match.isRegionalSpelling
                              ? "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20"
                              : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getCategoryColor(match.rule.category)}>
                                {match.rule.category}
                              </Badge>
                              {match.isRegionalSpelling && (
                                <Badge variant="outline" className="text-amber-600 border-amber-300">
                                  Regional Spelling
                                </Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-sm">{match.message}</p>

                          <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-sm font-mono">
                            <span className="text-slate-500">
                              {match.context.text.slice(0, match.context.offset)}
                            </span>
                            <span className="bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-0.5 rounded">
                              {match.context.text.slice(
                                match.context.offset,
                                match.context.offset + match.context.length
                              )}
                            </span>
                            <span className="text-slate-500">
                              {match.context.text.slice(
                                match.context.offset + match.context.length
                              )}
                            </span>
                          </div>

                          {match.replacements.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs text-muted-foreground">
                                Suggestions:
                              </span>
                              {match.replacements.map((replacement, i) => (
                                <button
                                  key={i}
                                  onClick={() => applyFix(match, replacement, index)}
                                  className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                >
                                  {replacement || "(remove)"}
                                </button>
                              ))}
                            </div>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => ignoreError(index)}
                            className="text-xs"
                          >
                            Ignore
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <span className="text-4xl block mb-2">✅</span>
                    <p className="font-medium">No issues found!</p>
                    <p className="text-sm">Your text looks good in {result.language.name}.</p>
                  </div>
                </div>
              )
            ) : (
              <div className="h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <span className="text-4xl block mb-2">✍️</span>
                  <p>Enter some text and click "Check Grammar"</p>
                  <p className="text-sm mt-2">
                    Currently using <strong>{currentVariant.flag} {currentVariant.name}</strong>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Regional English Info Panel */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">About Regional English Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(ENGLISH_VARIANTS).map(([code, variant]) => (
              <button
                key={code}
                onClick={() => setSelectedVariant(code as EnglishVariant)}
                className={`p-3 rounded-lg border text-center transition-all ${
                  selectedVariant === code
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <span className="text-2xl block mb-1">{variant.flag}</span>
                <span className="text-xs font-medium block truncate">{variant.name.replace(" English", "")}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Different regions use different spelling conventions. For example, "color" (US) vs "colour" (UK/AU/NZ),
            or "center" (US) vs "centre" (UK). Select your preferred variant to get accurate suggestions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
