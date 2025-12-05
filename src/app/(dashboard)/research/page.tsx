"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  abstract: string;
  citationCount: number;
  url: string;
  pdfUrl: string | null;
  citations: {
    apa: string;
    mla: string;
    chicago: string;
  };
}

export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (query.trim().length < 3) {
      setError("Please enter at least 3 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 10 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search");
      }

      setPapers(data.papers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Research Assistant</h1>
        <p className="text-muted-foreground">
          Search 200M+ academic papers and generate citations instantly.
        </p>
      </div>

      {/* Search bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for academic papers... (e.g., 'climate change agriculture')"
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {papers.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Found {papers.length} papers for "{query}"
          </p>

          {papers.map((paper) => (
            <Card key={paper.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      <CardTitle className="text-lg leading-tight">
                        {paper.title}
                      </CardTitle>
                    </a>
                    <CardDescription className="mt-1">
                      {paper.authors.slice(0, 3).join(", ")}
                      {paper.authors.length > 3 && " et al."}
                      {paper.year && ` (${paper.year})`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary">
                      {paper.citationCount} citations
                    </Badge>
                    {paper.pdfUrl && (
                      <a
                        href={paper.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Badge variant="outline" className="cursor-pointer hover:bg-slate-100">
                          PDF
                        </Badge>
                      </a>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {paper.abstract}
                </p>

                <Tabs defaultValue="apa" className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Copy Citation:</span>
                    <TabsList className="h-8">
                      <TabsTrigger value="apa" className="text-xs px-2 py-1">
                        APA
                      </TabsTrigger>
                      <TabsTrigger value="mla" className="text-xs px-2 py-1">
                        MLA
                      </TabsTrigger>
                      <TabsTrigger value="chicago" className="text-xs px-2 py-1">
                        Chicago
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {(["apa", "mla", "chicago"] as const).map((format) => (
                    <TabsContent key={format} value={format} className="mt-0">
                      <div className="flex gap-2">
                        <div className="flex-1 bg-slate-50 p-3 rounded text-xs font-mono overflow-x-auto">
                          {paper.citations[format]}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(paper.citations[format], `${paper.id}-${format}`)
                          }
                        >
                          {copiedId === `${paper.id}-${format}` ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !loading && query ? (
        <Card className="h-64 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <span className="text-4xl block mb-2">🔍</span>
            <p>No papers found for "{query}"</p>
            <p className="text-sm">Try different keywords</p>
          </div>
        </Card>
      ) : (
        <Card className="h-64 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <span className="text-4xl block mb-2">📚</span>
            <p>Search for academic papers</p>
            <p className="text-sm">Access 200M+ papers from Semantic Scholar</p>
          </div>
        </Card>
      )}
    </div>
  );
}
