"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { XPNotification } from "@/components/gamification";
import {
  AssignmentAuditResult,
  AssignmentType,
  GapItem,
  ImprovementItem,
  IssueItem,
  XPAwardResult,
} from "@/types";

const ASSIGNMENT_TYPES: { id: AssignmentType; name: string; icon: string }[] = [
  { id: "essay", name: "Essay", icon: "📝" },
  { id: "research_paper", name: "Research Paper", icon: "📄" },
  { id: "lab_report", name: "Lab Report", icon: "🧪" },
  { id: "case_study", name: "Case Study", icon: "📊" },
  { id: "thesis", name: "Thesis", icon: "🎓" },
  { id: "literature_review", name: "Literature Review", icon: "📚" },
  { id: "reflection", name: "Reflection", icon: "💭" },
  { id: "technical_report", name: "Technical Report", icon: "⚙️" },
  { id: "other", name: "Other", icon: "📋" },
];

const SCORE_COLORS = {
  excellent: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", label: "Excellent" },
  good: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", label: "Good" },
  fair: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", label: "Fair" },
  poor: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", label: "Needs Work" },
};

function getScoreStyle(score: number) {
  if (score >= 80) return SCORE_COLORS.excellent;
  if (score >= 60) return SCORE_COLORS.good;
  if (score >= 40) return SCORE_COLORS.fair;
  return SCORE_COLORS.poor;
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high": return "bg-red-100 text-red-700";
    case "medium": return "bg-yellow-100 text-yellow-700";
    case "low": return "bg-green-100 text-green-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

function getEffortColor(effort: string) {
  switch (effort) {
    case "easy": return "bg-green-100 text-green-700";
    case "medium": return "bg-yellow-100 text-yellow-700";
    case "hard": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

function getIssueTypeIcon(type: string) {
  switch (type) {
    case "repetition": return "🔁";
    case "vague": return "☁️";
    case "unsupported": return "❓";
    case "tangent": return "↪️";
    case "grammar": return "📖";
    case "structure": return "🏗️";
    default: return "⚠️";
  }
}

interface AuditHistory {
  id: string;
  assignment_name: string;
  assignment_type: AssignmentType;
  relevance_score: number;
  score_change: number | null;
  created_at: string;
}

export default function AssignmentAuditPage() {
  // Form state
  const [step, setStep] = useState(1);
  const [assignmentName, setAssignmentName] = useState("");
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("essay");
  const [subjectArea, setSubjectArea] = useState("");
  const [wordCountTarget, setWordCountTarget] = useState<number | undefined>();
  const [submissionContent, setSubmissionContent] = useState("");
  const [rubricContent, setRubricContent] = useState("");
  const [assignmentInstructions, setAssignmentInstructions] = useState("");
  const [includeRubric, setIncludeRubric] = useState(false);
  const [includeInstructions, setIncludeInstructions] = useState(false);

  // Analysis state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssignmentAuditResult | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  // Gamification state
  const [xpResult, setXpResult] = useState<XPAwardResult | null>(null);

  // History state
  const [history, setHistory] = useState<AuditHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/assignment-audit?limit=5");
      const data = await response.json();
      if (data.audits) {
        setHistory(data.audits);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAnalyze = async () => {
    if (submissionContent.trim().length < 100) {
      setError("Please enter at least 100 characters of content");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/assignment-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentName: assignmentName || `${assignmentType} Audit`,
          assignmentType,
          subjectArea: subjectArea || undefined,
          wordCountTarget: wordCountTarget || undefined,
          submissionContent,
          rubricContent: includeRubric ? rubricContent : undefined,
          assignmentInstructions: includeInstructions ? assignmentInstructions : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze assignment");
      }

      setResult(data);
      setResultId(data.id);
      setStep(3);
      fetchHistory(); // Refresh history

      // Show XP notification if XP was awarded
      if (data.xp) {
        setXpResult({
          xpAwarded: data.xp.xpAwarded,
          totalXP: data.xp.totalXP,
          previousLevel: data.xp.newLevel - (data.xp.leveledUp ? 1 : 0),
          newLevel: data.xp.newLevel,
          leveledUp: data.xp.leveledUp,
          newBadges: data.xp.newBadges || [],
          streakUpdate: data.xp.streakUpdate,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleReAudit = async () => {
    if (!resultId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/assignment-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentName: assignmentName || `${assignmentType} Re-Audit`,
          assignmentType,
          subjectArea: subjectArea || undefined,
          wordCountTarget: wordCountTarget || undefined,
          submissionContent,
          rubricContent: includeRubric ? rubricContent : undefined,
          assignmentInstructions: includeInstructions ? assignmentInstructions : undefined,
          previousAuditId: resultId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to re-analyze assignment");
      }

      setResult(data);
      setResultId(data.id);
      fetchHistory();

      // Show XP notification if XP was awarded
      if (data.xp) {
        setXpResult({
          xpAwarded: data.xp.xpAwarded,
          totalXP: data.xp.totalXP,
          previousLevel: data.xp.newLevel - (data.xp.leveledUp ? 1 : 0),
          newLevel: data.xp.newLevel,
          leveledUp: data.xp.leveledUp,
          newBadges: data.xp.newBadges || [],
          streakUpdate: data.xp.streakUpdate,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const startNewAudit = () => {
    setStep(1);
    setAssignmentName("");
    setSubjectArea("");
    setWordCountTarget(undefined);
    setSubmissionContent("");
    setRubricContent("");
    setAssignmentInstructions("");
    setIncludeRubric(false);
    setIncludeInstructions(false);
    setResult(null);
    setResultId(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* XP Notification */}
      <XPNotification result={xpResult} onDismiss={() => setXpResult(null)} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Assignment Audit</h1>
        <p className="text-muted-foreground">
          Get brutally honest feedback on your work before you submit. CIDI Framework: Context, Integrity, Details, Insight.
        </p>
      </div>

      {step < 3 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 1: Assignment Details</CardTitle>
                  <CardDescription>
                    Tell us about your assignment to get better feedback.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Assignment Name</label>
                    <Input
                      value={assignmentName}
                      onChange={(e) => setAssignmentName(e.target.value)}
                      placeholder="e.g., Research Paper on Climate Change"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Assignment Type</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {ASSIGNMENT_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setAssignmentType(type.id)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-colors ${
                            assignmentType === type.id
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <span className="text-xl">{type.icon}</span>
                          <span className="text-xs">{type.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Subject Area (optional)</label>
                      <Input
                        value={subjectArea}
                        onChange={(e) => setSubjectArea(e.target.value)}
                        placeholder="e.g., Environmental Science"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Target Word Count (optional)</label>
                      <Input
                        type="number"
                        value={wordCountTarget || ""}
                        onChange={(e) => setWordCountTarget(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="e.g., 2000"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeRubric}
                        onChange={(e) => setIncludeRubric(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Include rubric for requirement matching</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeInstructions}
                        onChange={(e) => setIncludeInstructions(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Include assignment instructions</span>
                    </label>
                  </div>

                  {includeInstructions && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Assignment Instructions</label>
                      <Textarea
                        value={assignmentInstructions}
                        onChange={(e) => setAssignmentInstructions(e.target.value)}
                        placeholder="Paste your assignment prompt or instructions here..."
                        rows={4}
                      />
                    </div>
                  )}

                  {includeRubric && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rubric</label>
                      <Textarea
                        value={rubricContent}
                        onChange={(e) => setRubricContent(e.target.value)}
                        placeholder="Paste your grading rubric here..."
                        rows={4}
                      />
                    </div>
                  )}

                  <Button className="w-full" onClick={() => setStep(2)}>
                    Continue to Content
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Your Submission</CardTitle>
                  <CardDescription>
                    Paste your completed work below for analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Textarea
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      placeholder="Paste your essay, paper, or assignment content here..."
                      rows={16}
                      className="resize-none font-mono text-sm"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{submissionContent.split(/\s+/).filter(w => w.length > 0).length} words</span>
                      <span>{submissionContent.length} characters</span>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleAnalyze}
                      disabled={loading || submissionContent.trim().length < 100}
                    >
                      {loading ? "Analyzing..." : "Analyze My Work"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar: Recent audits */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Audits</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No previous audits</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((audit) => (
                      <div
                        key={audit.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm truncate">
                            {audit.assignment_name}
                          </span>
                          <Badge className={`${getScoreStyle(audit.relevance_score).bg} ${getScoreStyle(audit.relevance_score).text} text-xs`}>
                            {audit.relevance_score}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{audit.assignment_type.replace("_", " ")}</span>
                          {audit.score_change !== null && (
                            <span className={audit.score_change > 0 ? "text-green-600" : "text-red-600"}>
                              {audit.score_change > 0 ? "+" : ""}{audit.score_change}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Results */}
      {step === 3 && result && (
        <div className="space-y-6">
          {/* Actions bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={startNewAudit}>
                New Audit
              </Button>
              <Button variant="outline" onClick={() => setStep(2)}>
                Edit & Re-audit
              </Button>
              <Button onClick={handleReAudit} disabled={loading}>
                {loading ? "Analyzing..." : "Re-audit After Changes"}
              </Button>
            </div>
            {result.scoreChange !== undefined && (
              <Badge className={result.scoreChange > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                {result.scoreChange > 0 ? "+" : ""}{result.scoreChange} from previous
              </Badge>
            )}
          </div>

          {/* Overall Score Card */}
          <Card className={`border-2 ${getScoreStyle(result.relevanceScore).border}`}>
            <CardContent className="py-6">
              <div className="flex items-center gap-8">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke={result.relevanceScore >= 60 ? "#3b82f6" : "#f59e0b"}
                      strokeWidth="12"
                      strokeDasharray={`${(result.relevanceScore / 100) * 352} 352`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{result.relevanceScore}</span>
                    <span className="text-xs text-muted-foreground">RELEVANCE</span>
                  </div>
                </div>

                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">
                    {getScoreStyle(result.relevanceScore).label}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {result.thirdPartySummary}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{result.contextScore}</div>
                      <div className="text-xs text-muted-foreground">Context (20%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{result.integrityScore}</div>
                      <div className="text-xs text-muted-foreground">Integrity (30%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{result.detailsScore}</div>
                      <div className="text-xs text-muted-foreground">Details (25%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{result.insightScore}</div>
                      <div className="text-xs text-muted-foreground">Insight (25%)</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Card>
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold">{result.stats.wordCount}</div>
                <div className="text-xs text-muted-foreground">Words</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold">{result.stats.paragraphCount}</div>
                <div className="text-xs text-muted-foreground">Paragraphs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold">{result.stats.avgSentenceLength}</div>
                <div className="text-xs text-muted-foreground">Avg Sentence</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold">{result.stats.readingGradeLevel}</div>
                <div className="text-xs text-muted-foreground">Grade Level</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <div className="text-2xl font-bold">{result.citationCount}</div>
                <div className="text-xs text-muted-foreground">Citations</div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="gaps" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="gaps">Gaps ({result.gapAnalysis.length})</TabsTrigger>
              <TabsTrigger value="improvements">Improvements ({result.improvements.length})</TabsTrigger>
              <TabsTrigger value="issues">Issues ({result.issues.length})</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              {result.requirementsAnalysis && (
                <TabsTrigger value="requirements">
                  Requirements ({result.requirementsAnalysis.met}/{result.requirementsAnalysis.total})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="gaps" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gap Analysis</CardTitle>
                  <CardDescription>
                    Critical gaps in your work with estimated fix time and grade impact.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {result.gapAnalysis.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No significant gaps found!</p>
                  ) : (
                    <div className="space-y-4">
                      {result.gapAnalysis.map((gap: GapItem, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(gap.priority)}>
                                {gap.priority.toUpperCase()}
                              </Badge>
                              <span className="font-medium">{gap.gap}</span>
                            </div>
                            <span className="text-sm text-green-600 font-medium">
                              {gap.gradeImpact}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{gap.howToFix}</p>
                          <div className="text-xs text-muted-foreground">
                            Est. time: {gap.fixTimeMinutes} minutes
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="improvements" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Suggested Improvements</CardTitle>
                  <CardDescription>
                    Specific actions to improve your work, organized by effort and impact.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {result.improvements.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No improvements suggested - great work!</p>
                  ) : (
                    <div className="space-y-4">
                      {result.improvements.map((item: ImprovementItem, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getEffortColor(item.effort)}>
                              {item.effort}
                            </Badge>
                            <Badge className={getPriorityColor(item.impact === 'high' ? 'high' : item.impact === 'medium' ? 'medium' : 'low')}>
                              {item.impact} impact
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {item.location}
                            </span>
                          </div>
                          <p className="font-medium mb-1">{item.action}</p>
                          {item.example && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <span className="text-muted-foreground">Example: </span>
                              {item.example}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="issues" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Issues Detected</CardTitle>
                  <CardDescription>
                    Problems found in your writing that need attention.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {result.issues.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No issues detected!</p>
                  ) : (
                    <div className="space-y-4">
                      {result.issues.map((issue: IssueItem, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{getIssueTypeIcon(issue.type)}</span>
                            <Badge variant="outline" className="capitalize">
                              {issue.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {issue.location}
                            </span>
                          </div>
                          <p className="text-sm bg-red-50 p-2 rounded mb-2 font-mono">
                            &ldquo;{issue.text}&rdquo;
                          </p>
                          {issue.suggestion && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Fix: </span>
                              {issue.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evidence" className="mt-4">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Context Evidence */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Context</CardTitle>
                      <Badge className={`${getScoreStyle(result.contextScore).bg} ${getScoreStyle(result.contextScore).text}`}>
                        {result.contextScore}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-green-700 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {result.contextEvidence.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex gap-2">
                            <span>+</span>{s}
                          </li>
                        ))}
                        {result.contextEvidence.strengths.length === 0 && (
                          <li className="text-sm text-muted-foreground">No strengths identified</li>
                        )}
                      </ul>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-red-700 mb-2">Gaps</h4>
                      <ul className="space-y-1">
                        {result.contextEvidence.gaps.map((g, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex gap-2">
                            <span>-</span>{g}
                          </li>
                        ))}
                        {result.contextEvidence.gaps.length === 0 && (
                          <li className="text-sm text-muted-foreground">No gaps identified</li>
                        )}
                      </ul>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className={result.contextEvidence.backgroundProvided ? "text-green-600" : "text-red-600"}>
                        {result.contextEvidence.backgroundProvided ? "✓" : "✗"} Background
                      </span>
                      <span className={result.contextEvidence.audienceClarity ? "text-green-600" : "text-red-600"}>
                        {result.contextEvidence.audienceClarity ? "✓" : "✗"} Audience Clear
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Integrity Evidence */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Integrity</CardTitle>
                      <Badge className={`${getScoreStyle(result.integrityScore).bg} ${getScoreStyle(result.integrityScore).text}`}>
                        {result.integrityScore}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4 text-sm">
                      <span className={result.integrityEvidence.logicalFlow ? "text-green-600" : "text-red-600"}>
                        {result.integrityEvidence.logicalFlow ? "✓" : "✗"} Logical Flow
                      </span>
                      <span className="text-muted-foreground">
                        Transitions: {result.integrityEvidence.transitionQuality}
                      </span>
                    </div>
                    {result.integrityEvidence.contradictions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-700 mb-2">Contradictions</h4>
                        {result.integrityEvidence.contradictions.map((c, i) => (
                          <div key={i} className="text-sm bg-red-50 p-2 rounded mb-2">
                            <p>&ldquo;{c.statement1}&rdquo;</p>
                            <p className="text-red-600">vs</p>
                            <p>&ldquo;{c.statement2}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {result.integrityEvidence.unsupportedClaims.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-yellow-700 mb-2">Unsupported Claims</h4>
                        {result.integrityEvidence.unsupportedClaims.map((c, i) => (
                          <div key={i} className="text-sm text-muted-foreground mb-1">
                            &ldquo;{c.claim}&rdquo; <span className="text-xs">({c.location})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Details Evidence */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Details</CardTitle>
                      <Badge className={`${getScoreStyle(result.detailsScore).bg} ${getScoreStyle(result.detailsScore).text}`}>
                        {result.detailsScore}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-bold">{result.detailsEvidence.specificExamples}</div>
                        <div className="text-xs text-muted-foreground">Specific Examples</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-bold">{result.detailsEvidence.dataPoints}</div>
                        <div className="text-xs text-muted-foreground">Data Points</div>
                      </div>
                    </div>
                    {result.detailsEvidence.vagueStatements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-yellow-700 mb-2">Vague Statements</h4>
                        {result.detailsEvidence.vagueStatements.slice(0, 3).map((v, i) => (
                          <div key={i} className="text-sm bg-yellow-50 p-2 rounded mb-2">
                            <p className="font-mono text-xs">&ldquo;{v.text}&rdquo;</p>
                            <p className="text-yellow-700 mt-1">→ {v.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Insight Evidence */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Insight</CardTitle>
                      <Badge className={`${getScoreStyle(result.insightScore).bg} ${getScoreStyle(result.insightScore).text}`}>
                        {result.insightScore}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4 text-sm">
                      <span className={result.insightEvidence.criticalThinking ? "text-green-600" : "text-red-600"}>
                        {result.insightEvidence.criticalThinking ? "✓" : "✗"} Critical Thinking
                      </span>
                      <span className={result.insightEvidence.synthesisPresent ? "text-green-600" : "text-red-600"}>
                        {result.insightEvidence.synthesisPresent ? "✓" : "✗"} Synthesis
                      </span>
                    </div>
                    <div className="text-sm">
                      Analysis Depth: <span className="font-medium capitalize">{result.insightEvidence.analysisDepth}</span>
                    </div>
                    {result.insightEvidence.originalArguments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-green-700 mb-2">Original Arguments</h4>
                        {result.insightEvidence.originalArguments.map((a, i) => (
                          <p key={i} className="text-sm text-muted-foreground mb-1">&ldquo;{a}&rdquo;</p>
                        ))}
                      </div>
                    )}
                    {result.insightEvidence.genericStatements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-yellow-700 mb-2">Generic Statements (improve these)</h4>
                        {result.insightEvidence.genericStatements.slice(0, 3).map((g, i) => (
                          <p key={i} className="text-sm text-muted-foreground mb-1">
                            &ldquo;{g.text}&rdquo; <span className="text-xs">({g.location})</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {result.requirementsAnalysis && (
              <TabsContent value="requirements" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements Checklist</CardTitle>
                    <CardDescription>
                      How well your submission matches the rubric requirements.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 mb-6">
                      <div className="text-center p-3 bg-green-50 rounded-lg flex-1">
                        <div className="text-2xl font-bold text-green-700">{result.requirementsAnalysis.met}</div>
                        <div className="text-xs text-green-600">Met</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg flex-1">
                        <div className="text-2xl font-bold text-yellow-700">{result.requirementsAnalysis.partial}</div>
                        <div className="text-xs text-yellow-600">Partial</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg flex-1">
                        <div className="text-2xl font-bold text-red-700">{result.requirementsAnalysis.missing}</div>
                        <div className="text-xs text-red-600">Missing</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {result.requirementsAnalysis.items.map((item, index) => (
                        <div
                          key={index}
                          className={`p-3 border rounded-lg ${
                            item.status === 'met' ? 'border-green-200 bg-green-50' :
                            item.status === 'partial' ? 'border-yellow-200 bg-yellow-50' :
                            'border-red-200 bg-red-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span>
                              {item.status === 'met' ? '✓' : item.status === 'partial' ? '◐' : '✗'}
                            </span>
                            <span className="font-medium text-sm">{item.requirement}</span>
                          </div>
                          {item.evidence && (
                            <p className="text-xs text-muted-foreground ml-6">{item.evidence}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </div>
  );
}
