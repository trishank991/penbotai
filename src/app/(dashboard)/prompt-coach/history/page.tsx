"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { PromptRecord } from "@/types";

export default function PromptHistoryPage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptRecord | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setPrompts(data as PromptRecord[]);
    }
    setLoading(false);
  };

  const deletePrompt = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prompt? This action cannot be undone.")) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("prompts").delete().eq("id", id);

    if (error) {
      alert("Failed to delete prompt. Please try again.");
      return;
    }

    setPrompts(prompts.filter((p) => p.id !== id));
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "bg-gray-100 text-gray-800";
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getScoreLabel = (score: number | null) => {
    if (!score) return "N/A";
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Work";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prompt History</h1>
          <p className="text-muted-foreground">
            View and re-analyze your previous prompts.
          </p>
        </div>
        <Button onClick={() => router.push("/prompt-coach")}>
          Analyze New Prompt
        </Button>
      </div>

      {prompts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You haven&apos;t analyzed any prompts yet.
            </p>
            <Button onClick={() => router.push("/prompt-coach")}>
              Get Started
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prompts.map((prompt) => (
            <Card key={prompt.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium line-clamp-2">
                      {prompt.original_prompt.substring(0, 100)}
                      {prompt.original_prompt.length > 100 ? "..." : ""}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(prompt.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {prompt.ai_model && (
                        <span className="ml-2">• Target: {prompt.ai_model}</span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge className={getScoreColor(prompt.score)}>
                    {prompt.score ? `${prompt.score}/100` : "N/A"} •{" "}
                    {getScoreLabel(prompt.score)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {prompt.feedback && (
                  <div className="flex gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Clarity:</span>
                      <span className="font-medium">
                        {prompt.feedback.breakdown?.clarity || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Specificity:</span>
                      <span className="font-medium">
                        {prompt.feedback.breakdown?.specificity || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Context:</span>
                      <span className="font-medium">
                        {prompt.feedback.breakdown?.context || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Structure:</span>
                      <span className="font-medium">
                        {prompt.feedback.breakdown?.structure || "N/A"}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPrompt(prompt)}
                      >
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Prompt Analysis Details</DialogTitle>
                        <DialogDescription>
                          Analyzed on{" "}
                          {new Date(prompt.created_at).toLocaleDateString()}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <h4 className="font-medium mb-2">Original Prompt</h4>
                          <div className="bg-slate-50 p-3 rounded-lg text-sm">
                            {prompt.original_prompt}
                          </div>
                        </div>

                        {prompt.improved_prompt && (
                          <div>
                            <h4 className="font-medium mb-2">Improved Version</h4>
                            <div className="bg-green-50 p-3 rounded-lg text-sm border border-green-200">
                              {prompt.improved_prompt}
                            </div>
                          </div>
                        )}

                        {prompt.feedback?.suggestions &&
                          prompt.feedback.suggestions.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Suggestions</h4>
                              <ul className="list-disc pl-4 space-y-1 text-sm">
                                {prompt.feedback.suggestions.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Copy to clipboard and navigate to prompt coach
                      navigator.clipboard.writeText(prompt.original_prompt);
                      router.push("/prompt-coach");
                    }}
                  >
                    Re-analyze
                  </Button>

                  {prompt.improved_prompt && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(prompt.improved_prompt!);
                      }}
                    >
                      Copy Improved
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => deletePrompt(prompt.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
