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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { SavedPaper } from "@/types";
import {
  generateBibTeX,
  generateAPACitation,
  generateMLACitation,
  generateChicagoCitation,
  exportPapersToBibTeX,
  downloadBlob,
} from "@/lib/export";

export default function ResearchLibraryPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<SavedPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [folders, setFolders] = useState<string[]>(["default"]);
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [editingPaper, setEditingPaper] = useState<SavedPaper | null>(null);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("saved_papers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPapers(data as SavedPaper[]);
      // Extract unique folders
      const uniqueFolders = [...new Set(data.map((p) => p.folder))];
      setFolders(uniqueFolders.length > 0 ? uniqueFolders : ["default"]);
    }
    setLoading(false);
  };

  const deletePaper = async (id: string) => {
    const supabase = createClient();
    await supabase.from("saved_papers").delete().eq("id", id);
    setPapers(papers.filter((p) => p.id !== id));
    setSelectedPapers(selectedPapers.filter((pid) => pid !== id));
  };

  const updatePaper = async (paper: SavedPaper) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("saved_papers")
      .update({
        notes: paper.notes,
        tags: paper.tags,
        folder: paper.folder,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paper.id);

    if (error) {
      console.error("Failed to update paper:", error);
      return;
    }

    setPapers(papers.map((p) => (p.id === paper.id ? paper : p)));
    setEditingPaper(null);
  };

  const togglePaperSelection = (id: string) => {
    setSelectedPapers((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const exportSelectedAsBibTeX = () => {
    const selected = papers.filter((p) => selectedPapers.includes(p.id));
    const exportPapers = selected.map((p) => ({
      title: p.title,
      authors: p.authors,
      year: p.year || new Date().getFullYear(),
      journal: p.journal || undefined,
      volume: p.volume || undefined,
      issue: p.issue || undefined,
      pages: p.pages || undefined,
      doi: p.doi || undefined,
      url: p.url || undefined,
    }));
    const blob = exportPapersToBibTeX(exportPapers);
    downloadBlob(blob, `penbotai-references-${Date.now()}.bib`);
  };

  const filteredPapers = papers.filter((paper) => {
    const matchesSearch =
      searchQuery === "" ||
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.authors.some((a) =>
        a.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      paper.tags?.some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesFolder =
      selectedFolder === "all" || paper.folder === selectedFolder;

    return matchesSearch && matchesFolder;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Research Library</h1>
          <p className="text-muted-foreground">
            Your saved papers and citations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/research")}>
            Search Papers
          </Button>
          {selectedPapers.length > 0 && (
            <Button onClick={exportSelectedAsBibTeX}>
              Export {selectedPapers.length} as BibTeX
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by title, author, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedFolder} onValueChange={setSelectedFolder}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by folder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Folders</SelectItem>
            {folders.map((folder) => (
              <SelectItem key={folder} value={folder}>
                {folder}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedPapers.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPapers([])}
          >
            Clear Selection ({selectedPapers.length})
          </Button>
        )}
      </div>

      {filteredPapers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {papers.length === 0
                ? "You haven't saved any papers yet."
                : "No papers match your search."}
            </p>
            <Button onClick={() => router.push("/research")}>
              Search for Papers
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Bulk actions */}
          {filteredPapers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={selectedPapers.length === filteredPapers.length}
                onChange={() => {
                  if (selectedPapers.length === filteredPapers.length) {
                    setSelectedPapers([]);
                  } else {
                    setSelectedPapers(filteredPapers.map((p) => p.id));
                  }
                }}
                className="rounded"
              />
              <span>
                Select all ({filteredPapers.length} paper
                {filteredPapers.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}

          {filteredPapers.map((paper) => (
            <Card
              key={paper.id}
              className={`hover:shadow-md transition-shadow ${
                selectedPapers.includes(paper.id) ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedPapers.includes(paper.id)}
                    onChange={() => togglePaperSelection(paper.id)}
                    className="mt-1 rounded"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium">
                      {paper.url ? (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 hover:underline"
                        >
                          {paper.title}
                        </a>
                      ) : (
                        paper.title
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {paper.authors.slice(0, 3).join(", ")}
                      {paper.authors.length > 3 && " et al."}
                      {paper.year && ` (${paper.year})`}
                      {paper.journal && ` • ${paper.journal}`}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{paper.folder}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {paper.abstract && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {paper.abstract}
                  </p>
                )}

                {paper.tags && paper.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {paper.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {/* Citation dialogs */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Get Citation
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Citation Formats</DialogTitle>
                        <DialogDescription>
                          Copy the citation in your preferred format
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            APA 7th Edition
                          </Label>
                          <div className="bg-slate-50 p-3 rounded text-sm mt-1">
                            {generateAPACitation({
                              title: paper.title,
                              authors: paper.authors,
                              year: paper.year || new Date().getFullYear(),
                              journal: paper.journal || undefined,
                              volume: paper.volume || undefined,
                              issue: paper.issue || undefined,
                              pages: paper.pages || undefined,
                              doi: paper.doi || undefined,
                              url: paper.url || undefined,
                            })}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                generateAPACitation({
                                  title: paper.title,
                                  authors: paper.authors,
                                  year: paper.year || new Date().getFullYear(),
                                  journal: paper.journal || undefined,
                                  doi: paper.doi || undefined,
                                  url: paper.url || undefined,
                                })
                              );
                            }}
                          >
                            Copy APA
                          </Button>
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">
                            MLA 9th Edition
                          </Label>
                          <div className="bg-slate-50 p-3 rounded text-sm mt-1">
                            {generateMLACitation({
                              title: paper.title,
                              authors: paper.authors,
                              year: paper.year || new Date().getFullYear(),
                              journal: paper.journal || undefined,
                              volume: paper.volume || undefined,
                              issue: paper.issue || undefined,
                              pages: paper.pages || undefined,
                              doi: paper.doi || undefined,
                              url: paper.url || undefined,
                            })}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                generateMLACitation({
                                  title: paper.title,
                                  authors: paper.authors,
                                  year: paper.year || new Date().getFullYear(),
                                  journal: paper.journal || undefined,
                                  doi: paper.doi || undefined,
                                  url: paper.url || undefined,
                                })
                              );
                            }}
                          >
                            Copy MLA
                          </Button>
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Chicago
                          </Label>
                          <div className="bg-slate-50 p-3 rounded text-sm mt-1">
                            {generateChicagoCitation({
                              title: paper.title,
                              authors: paper.authors,
                              year: paper.year || new Date().getFullYear(),
                              journal: paper.journal || undefined,
                              volume: paper.volume || undefined,
                              issue: paper.issue || undefined,
                              pages: paper.pages || undefined,
                              doi: paper.doi || undefined,
                              url: paper.url || undefined,
                            })}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                generateChicagoCitation({
                                  title: paper.title,
                                  authors: paper.authors,
                                  year: paper.year || new Date().getFullYear(),
                                  journal: paper.journal || undefined,
                                  doi: paper.doi || undefined,
                                  url: paper.url || undefined,
                                })
                              );
                            }}
                          >
                            Copy Chicago
                          </Button>
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground">
                            BibTeX
                          </Label>
                          <pre className="bg-slate-50 p-3 rounded text-xs mt-1 overflow-x-auto">
                            {generateBibTeX({
                              title: paper.title,
                              authors: paper.authors,
                              year: paper.year || new Date().getFullYear(),
                              journal: paper.journal || undefined,
                              volume: paper.volume || undefined,
                              issue: paper.issue || undefined,
                              pages: paper.pages || undefined,
                              doi: paper.doi || undefined,
                              url: paper.url || undefined,
                            })}
                          </pre>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                generateBibTeX({
                                  title: paper.title,
                                  authors: paper.authors,
                                  year: paper.year || new Date().getFullYear(),
                                  journal: paper.journal || undefined,
                                  doi: paper.doi || undefined,
                                  url: paper.url || undefined,
                                })
                              );
                            }}
                          >
                            Copy BibTeX
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Edit dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPaper(paper)}
                      >
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Paper</DialogTitle>
                      </DialogHeader>
                      {editingPaper && editingPaper.id === paper.id && (
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label>Folder</Label>
                            <Input
                              value={editingPaper.folder}
                              onChange={(e) =>
                                setEditingPaper({
                                  ...editingPaper,
                                  folder: e.target.value,
                                })
                              }
                              placeholder="e.g., Thesis, Project1"
                            />
                          </div>
                          <div>
                            <Label>Tags (comma-separated)</Label>
                            <Input
                              value={editingPaper.tags?.join(", ") || ""}
                              onChange={(e) =>
                                setEditingPaper({
                                  ...editingPaper,
                                  tags: e.target.value
                                    .split(",")
                                    .map((t) => t.trim())
                                    .filter(Boolean),
                                })
                              }
                              placeholder="machine learning, nlp, transformers"
                            />
                          </div>
                          <div>
                            <Label>Notes</Label>
                            <Textarea
                              value={editingPaper.notes || ""}
                              onChange={(e) =>
                                setEditingPaper({
                                  ...editingPaper,
                                  notes: e.target.value,
                                })
                              }
                              placeholder="Your notes about this paper..."
                              rows={4}
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => updatePaper(editingPaper)}
                          >
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => deletePaper(paper.id)}
                  >
                    Remove
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
