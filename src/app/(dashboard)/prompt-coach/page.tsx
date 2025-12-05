"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptAnalysis } from "@/types";

const AI_TARGETS = [
  { id: "chatgpt", name: "ChatGPT", icon: "🤖" },
  { id: "claude", name: "Claude", icon: "🟠" },
  { id: "gemini", name: "Gemini", icon: "💎" },
  { id: "general", name: "Any AI", icon: "🎯" },
];

const SCORE_COLORS = {
  excellent: { bg: "bg-green-100", text: "text-green-700", label: "Excellent" },
  good: { bg: "bg-blue-100", text: "text-blue-700", label: "Good" },
  fair: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Fair" },
  poor: { bg: "bg-red-100", text: "text-red-700", label: "Needs Work" },
};

function getScoreStyle(score: number) {
  if (score >= 80) return SCORE_COLORS.excellent;
  if (score >= 60) return SCORE_COLORS.good;
  if (score >= 40) return SCORE_COLORS.fair;
  return SCORE_COLORS.poor;
}

export default function PromptCoachPage() {
  const [prompt, setPrompt] = useState("");
  const [targetAI, setTargetAI] = useState("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PromptAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (prompt.trim().length < 10) {
      setError("Please enter a longer prompt (at least 10 characters)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/prompt-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          targetAI: targetAI !== "general" ? targetAI : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze prompt");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyImproved = () => {
    if (result?.improvedPrompt) {
      navigator.clipboard.writeText(result.improvedPrompt);
    }
  };

  const useImproved = () => {
    if (result?.improvedPrompt) {
      setPrompt(result.improvedPrompt);
      setResult(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Prompt Coach</h1>
        <p className="text-muted-foreground">
          Improve your prompts and get better results from AI tools.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input section */}
        <Card className="lg:sticky lg:top-24 h-fit">
          <CardHeader>
            <CardTitle>Your Prompt</CardTitle>
            <CardDescription>
              Enter the prompt you want to analyze and improve.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Target AI</label>
              <div className="flex flex-wrap gap-2">
                {AI_TARGETS.map((ai) => (
                  <button
                    key={ai.id}
                    onClick={() => setTargetAI(ai.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      targetAI === ai.id
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span>{ai.icon}</span>
                    {ai.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here. For example: 'Write me an essay about climate change'"
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {prompt.length} characters
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleAnalyze}
              disabled={loading || prompt.trim().length < 10}
            >
              {loading ? "Analyzing..." : "Analyze Prompt"}
            </Button>
          </CardContent>
        </Card>

        {/* Results section */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Score card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>Prompt Score</CardTitle>
                    <Badge className={`${getScoreStyle(result.score).bg} ${getScoreStyle(result.score).text}`}>
                      {getScoreStyle(result.score).label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="42"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="42"
                          fill="none"
                          stroke={result.score >= 60 ? "#3b82f6" : "#f59e0b"}
                          strokeWidth="8"
                          strokeDasharray={`${(result.score / 100) * 264} 264`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                        {result.score}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2">
                      {Object.entries(result.breakdown).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{key}</span>
                            <span>{value}/25</span>
                          </div>
                          <Progress value={(value / 25) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle>Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-blue-600">•</span>
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Improved prompt */}
              {result.improvedPrompt && (
                <Card>
                  <CardHeader>
                    <CardTitle>Improved Prompt</CardTitle>
                    <CardDescription>
                      Here&apos;s a suggested improvement based on our analysis.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                      <p className="text-sm whitespace-pre-wrap">{result.improvedPrompt}</p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={copyImproved}>
                        Copy
                      </Button>
                      <Button onClick={useImproved}>Use This Prompt</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="h-64 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <span className="text-4xl block mb-2">🎯</span>
                <p>Enter a prompt to see your analysis</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
