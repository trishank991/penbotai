"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { exportDisclosureToDocx, exportDisclosureToTxt, downloadBlob } from "@/lib/export";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const AI_TOOLS = [
  { id: "chatgpt", name: "ChatGPT", icon: "🤖" },
  { id: "claude", name: "Claude", icon: "🟠" },
  { id: "gemini", name: "Gemini", icon: "💎" },
  { id: "copilot", name: "Copilot", icon: "✈️" },
  { id: "perplexity", name: "Perplexity", icon: "🔍" },
  { id: "grammarly", name: "Grammarly", icon: "✍️" },
  { id: "deepl", name: "DeepL", icon: "🌐" },
  { id: "midjourney", name: "Midjourney", icon: "🎨" },
  { id: "dalle", name: "DALL-E", icon: "🖼️" },
  { id: "other", name: "Other", icon: "📦" },
];

const PURPOSES = [
  { id: "brainstorming", name: "Brainstorming ideas" },
  { id: "research", name: "Research assistance" },
  { id: "drafting", name: "Initial drafting" },
  { id: "editing", name: "Editing & revision" },
  { id: "proofreading", name: "Proofreading" },
  { id: "summarizing", name: "Summarizing sources" },
  { id: "outlining", name: "Creating outlines" },
  { id: "coding", name: "Coding assistance" },
  { id: "translation", name: "Translation" },
  { id: "data_analysis", name: "Data analysis" },
  { id: "visualization", name: "Creating visualizations" },
];

// Template categories
const TEMPLATE_CATEGORIES = {
  citation: {
    name: "Citation Styles",
    icon: "📚",
    templates: [
      { id: "apa", name: "APA 7th Edition", description: "American Psychological Association" },
      { id: "mla", name: "MLA 9th Edition", description: "Modern Language Association" },
      { id: "chicago", name: "Chicago 17th", description: "Chicago Manual of Style" },
      { id: "ieee", name: "IEEE", description: "Engineering & Computer Science" },
      { id: "harvard", name: "Harvard Style", description: "Harvard Referencing System" },
    ],
  },
  regional_na: {
    name: "North America",
    icon: "🇺🇸",
    templates: [
      { id: "us_generic", name: "US Generic", description: "General US University Format" },
      { id: "canada", name: "Canadian Universities", description: "Format for Canadian Institutions" },
      { id: "ivy_league", name: "Ivy League", description: "Harvard, Yale, Princeton, etc." },
    ],
  },
  regional_eu: {
    name: "Europe",
    icon: "🇪🇺",
    templates: [
      { id: "eu_compliant", name: "EU AI Act Compliant", description: "European Union Transparency Standard" },
      { id: "uk_university", name: "UK Universities", description: "British Academic Standard" },
      { id: "oxbridge", name: "Oxford/Cambridge", description: "Oxbridge Academic Standard" },
      { id: "russell_group", name: "Russell Group (UK)", description: "Leading UK Research Universities" },
      { id: "germany", name: "German Universities", description: "Deutsche Hochschulen" },
      { id: "france", name: "French Universities", description: "Universités Françaises" },
      { id: "netherlands", name: "Dutch Universities", description: "Nederlandse Universiteiten" },
      { id: "switzerland", name: "Swiss Universities", description: "ETH Zurich, EPFL Standard" },
    ],
  },
  regional_apac: {
    name: "Asia Pacific",
    icon: "🌏",
    templates: [
      { id: "australia", name: "Australian Universities", description: "Group of Eight & Australian Standard" },
      { id: "group_of_eight", name: "Group of Eight (AU)", description: "Australia's Leading Universities" },
      { id: "new_zealand", name: "New Zealand", description: "NZ Higher Education" },
      { id: "singapore", name: "Singapore", description: "NUS, NTU & Singapore Standard" },
      { id: "hong_kong", name: "Hong Kong", description: "香港大學格式" },
      { id: "china", name: "Chinese Universities", description: "中国高校格式" },
      { id: "japan", name: "Japanese Universities", description: "日本の大学形式" },
      { id: "korea", name: "Korean Universities", description: "한국 대학교 형식" },
      { id: "taiwan", name: "Taiwan Universities", description: "臺灣大學格式" },
      { id: "india", name: "Indian Universities", description: "UGC & Indian Institution Format" },
      { id: "iit_iim", name: "IITs & IIMs (India)", description: "Premier Indian Institutions" },
      { id: "malaysia", name: "Malaysian Universities", description: "Malaysian Higher Education" },
      { id: "indonesia", name: "Indonesian Universities", description: "Indonesian Higher Education" },
      { id: "thailand", name: "Thai Universities", description: "Thai Higher Education" },
      { id: "vietnam", name: "Vietnamese Universities", description: "Vietnamese Higher Education" },
      { id: "philippines", name: "Philippine Universities", description: "Philippine Higher Education" },
    ],
  },
  regional_mea: {
    name: "Middle East & Africa",
    icon: "🌍",
    templates: [
      { id: "uae", name: "UAE Universities", description: "United Arab Emirates Format" },
      { id: "saudi", name: "Saudi Universities", description: "Kingdom of Saudi Arabia Format" },
      { id: "israel", name: "Israeli Universities", description: "Israeli Higher Education" },
      { id: "turkey", name: "Turkish Universities", description: "Turkish Higher Education" },
      { id: "south_africa", name: "South African Universities", description: "South African Higher Education" },
      { id: "egypt", name: "Egyptian Universities", description: "Egyptian Higher Education" },
      { id: "nigeria", name: "Nigerian Universities", description: "Nigerian Higher Education" },
      { id: "kenya", name: "Kenyan Universities", description: "Kenyan Higher Education" },
    ],
  },
  regional_latam: {
    name: "Latin America",
    icon: "🌎",
    templates: [
      { id: "brazil", name: "Brazilian Universities", description: "Universidades Brasileiras" },
      { id: "mexico", name: "Mexican Universities", description: "Universidades Mexicanas" },
      { id: "argentina", name: "Argentine Universities", description: "Universidades Argentinas" },
      { id: "chile", name: "Chilean Universities", description: "Universidades Chilenas" },
      { id: "colombia", name: "Colombian Universities", description: "Universidades Colombianas" },
    ],
  },
  publisher: {
    name: "Academic Publishers",
    icon: "📰",
    templates: [
      { id: "elsevier", name: "Elsevier Journals", description: "Elsevier Publication Standard" },
      { id: "springer", name: "Springer Nature", description: "Springer Nature Journals" },
      { id: "wiley", name: "Wiley Journals", description: "Wiley Publication Standard" },
      { id: "taylor_francis", name: "Taylor & Francis", description: "Taylor & Francis Journals" },
      { id: "sage", name: "SAGE Publications", description: "SAGE Journals" },
      { id: "ieee_journal", name: "IEEE Journals", description: "IEEE Publication Format" },
      { id: "science_nature", name: "Science/Nature", description: "High-Impact Journal Format" },
      { id: "plos", name: "PLOS Journals", description: "Public Library of Science" },
    ],
  },
  generic: {
    name: "Universal",
    icon: "🌐",
    templates: [
      { id: "generic", name: "Universal/Generic", description: "Works for any institution" },
      { id: "minimal", name: "Minimal Disclosure", description: "Brief statement for minor AI use" },
      { id: "comprehensive", name: "Comprehensive Disclosure", description: "Detailed disclosure for extensive AI use" },
    ],
  },
};

// University AI Policy links organized by region
const UNIVERSITY_POLICIES = {
  "United States": [
    { name: "Harvard University", url: "https://provost.harvard.edu/guidelines-using-chatgpt-and-other-generative-ai-tools-harvard" },
    { name: "MIT", url: "https://genai.mit.edu/" },
    { name: "Stanford University", url: "https://teachingcommons.stanford.edu/news/stanford-guidance-ai-generated-text-assignments" },
    { name: "Yale University", url: "https://poorvucenter.yale.edu/AIguidance" },
    { name: "Princeton University", url: "https://libguides.princeton.edu/generativeAI" },
    { name: "Duke University", url: "https://lile.duke.edu/ai-and-teaching-at-duke-2/" },
    { name: "UC Berkeley", url: "https://teaching.berkeley.edu/resources/ai-pedagogy" },
  ],
  "United Kingdom": [
    { name: "University of Oxford", url: "https://academic.admin.ox.ac.uk/ai-and-education" },
    { name: "University of Cambridge", url: "https://www.cambridgeinternational.org/support-and-training-for-schools/artificial-intelligence/" },
    { name: "Imperial College London", url: "https://www.imperial.ac.uk/about/leadership-and-strategy/provost/artificial-intelligence/" },
    { name: "UCL", url: "https://www.ucl.ac.uk/teaching-learning/generative-ai-hub" },
  ],
  "Australia": [
    { name: "University of Melbourne", url: "https://academicintegrity.unimelb.edu.au/understanding-ai" },
    { name: "University of Sydney", url: "https://www.sydney.edu.au/students/academic-integrity/ai.html" },
    { name: "Monash University", url: "https://www.monash.edu/learning-teaching/teachhq/Teaching-practices/artificial-intelligence" },
    { name: "ANU", url: "https://www.anu.edu.au/students/academic-skills/academic-integrity/using-ai-tools" },
  ],
  "Asia": [
    { name: "NUS Singapore", url: "https://libguides.nus.edu.sg/AI" },
    { name: "University of Hong Kong", url: "https://tl.hku.hk/generative-ai/" },
    { name: "Peking University", url: "https://english.pku.edu.cn/" },
    { name: "University of Tokyo", url: "https://www.u-tokyo.ac.jp/en/" },
  ],
  "Europe": [
    { name: "ETH Zurich", url: "https://ethz.ch/staffnet/en/teaching/academic-integrity.html" },
    { name: "Sorbonne University", url: "https://www.sorbonne-universite.fr/en" },
    { name: "University of Amsterdam", url: "https://www.uva.nl/en" },
  ],
  "Canada": [
    { name: "University of Toronto", url: "https://www.viceprovostundergrad.utoronto.ca/strategic-priorities/digital-learning/artificial-intelligence/" },
    { name: "UBC", url: "https://ctlt.ubc.ca/resources/artificial-intelligence/" },
    { name: "McGill University", url: "https://www.mcgill.ca/tls/ai-teaching-and-learning" },
  ],
  "India": [
    { name: "IIT Bombay", url: "https://www.iitb.ac.in/" },
    { name: "IIT Delhi", url: "https://home.iitd.ac.in/" },
    { name: "IISc Bangalore", url: "https://www.iisc.ac.in/" },
  ],
};

export default function DisclosurePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Form state
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [otherTool, setOtherTool] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");
  const [promptsUsed, setPromptsUsed] = useState("");
  const [outputUsage, setOutputUsage] = useState("");
  const [template, setTemplate] = useState("generic");
  const [selectedCategory, setSelectedCategory] = useState("generic");

  const toggleTool = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((t) => t !== toolId)
        : [...prev, toolId]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    const aiTools = selectedTools.map((id) => {
      if (id === "other" && otherTool) return otherTool;
      return AI_TOOLS.find((t) => t.id === id)?.name || id;
    });

    try {
      const response = await fetch("/api/disclosure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiTools,
          purpose,
          description,
          promptsUsed: promptsUsed ? promptsUsed.split("\n").filter(Boolean) : [],
          outputUsage,
          template,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate disclosure");
      }

      setResult(data.disclosure);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const emailDisclosure = async () => {
    if (!result) return;

    setEmailing(true);
    setEmailSent(false);

    try {
      const response = await fetch("/api/disclosure/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disclosure: result,
          assignmentType: purpose || "Assignment",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setEmailing(false);
    }
  };

  const startOver = () => {
    setStep(1);
    setSelectedTools([]);
    setOtherTool("");
    setPurpose("");
    setDescription("");
    setPromptsUsed("");
    setOutputUsage("");
    setTemplate("generic");
    setSelectedCategory("generic");
    setResult(null);
    setError(null);
    setCopied(false);
  };

  const getSelectedTemplateName = () => {
    for (const category of Object.values(TEMPLATE_CATEGORIES)) {
      const found = category.templates.find((t) => t.id === template);
      if (found) return found.name;
    }
    return "Generic";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Disclosure Generator</h1>
        <p className="text-muted-foreground">
          Generate professional AI usage statements for your academic work.
        </p>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <span className="text-amber-600 text-xl">⚠️</span>
          <div>
            <p className="text-sm text-amber-800 font-medium">Important Disclaimer</p>
            <p className="text-sm text-amber-700 mt-1">
              AI disclosure requirements vary by institution, course, and assignment. Always verify your specific
              requirements with your professor or institution&apos;s academic integrity policy before submitting.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" className="text-amber-700 p-0 h-auto mt-1">
                  View university AI policies →
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>University AI Policy Links</DialogTitle>
                  <DialogDescription>
                    Direct links to AI usage policies at major universities worldwide
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <Accordion type="single" collapsible className="w-full">
                    {Object.entries(UNIVERSITY_POLICIES).map(([region, universities]) => (
                      <AccordionItem key={region} value={region}>
                        <AccordionTrigger>{region}</AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2">
                            {universities.map((uni) => (
                              <li key={uni.name}>
                                <a
                                  href={uni.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  {uni.name} →
                                </a>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s === 4 && step === 4 ? "✓" : s}
            </div>
            {s < 4 && (
              <div
                className={`w-16 sm:w-24 h-1 mx-2 ${
                  step > s ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Step 1: Select AI Tools */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Which AI tools did you use?</CardTitle>
            <CardDescription>
              Select all the AI tools you used for this assignment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {AI_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => toggleTool(tool.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    selectedTools.includes(tool.id)
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{tool.icon}</span>
                  <p className="font-medium mt-1 text-sm">{tool.name}</p>
                </button>
              ))}
            </div>

            {selectedTools.includes("other") && (
              <div className="mt-4">
                <Label htmlFor="otherTool">Specify other tool</Label>
                <Input
                  id="otherTool"
                  value={otherTool}
                  onChange={(e) => setOtherTool(e.target.value)}
                  placeholder="e.g., Jasper AI, Writesonic"
                />
              </div>
            )}

            <Button
              className="w-full mt-6"
              onClick={() => setStep(2)}
              disabled={selectedTools.length === 0}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Describe Usage */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>How did you use AI?</CardTitle>
            <CardDescription>
              Describe the purpose and extent of your AI usage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Purpose of AI assistance</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {PURPOSES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPurpose(p.name)}
                    className={`p-3 rounded-lg border text-left text-sm transition-colors ${
                      purpose === p.name
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Describe what you used AI for</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., I used ChatGPT to help brainstorm initial thesis ideas and generate an outline for my essay..."
                className="mt-2"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="prompts">Prompts used (optional)</Label>
              <Textarea
                id="prompts"
                value={promptsUsed}
                onChange={(e) => setPromptsUsed(e.target.value)}
                placeholder="Enter each prompt on a new line (optional)"
                className="mt-2"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Including prompts increases transparency
              </p>
            </div>

            <div>
              <Label htmlFor="outputUsage">How did you use the AI output?</Label>
              <Textarea
                id="outputUsage"
                value={outputUsage}
                onChange={(e) => setOutputUsage(e.target.value)}
                placeholder="e.g., I reviewed the suggestions and significantly rewrote them in my own words, using them as a starting point..."
                className="mt-2"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={() => setStep(3)}
                disabled={!purpose || !description || !outputUsage}
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Choose Template */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose a format</CardTitle>
            <CardDescription>
              Select the format that matches your institution, region, or citation style requirements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category Tabs */}
            <Tabs defaultValue="generic" value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent">
                {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                  >
                    <span className="mr-1">{category.icon}</span>
                    <span className="hidden sm:inline">{category.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
                <TabsContent key={key} value={key} className="mt-4">
                  <div className="grid gap-2">
                    {category.templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTemplate(t.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          template === t.id
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-medium">{t.name}</p>
                        <p className="text-sm text-muted-foreground">{t.description}</p>
                      </button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <Separator />

            {/* Selected template display */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Selected format:</p>
              <p className="font-medium">{getSelectedTemplateName()}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleGenerate} disabled={loading}>
                {loading ? "Generating..." : "Generate Disclosure"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Result */}
      {step === 4 && result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your AI Disclosure Statement</CardTitle>
                <CardDescription>
                  Copy this statement and include it in your assignment.
                </CardDescription>
              </div>
              <Badge variant="secondary">{getSelectedTemplateName()}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 p-4 rounded-lg border mb-4">
              <p className="whitespace-pre-wrap">{result}</p>
            </div>

            {/* Reminder */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Remember:</strong> This disclosure is generated as a starting point.
                Review and adjust it to accurately reflect your specific AI usage, and verify
                it meets your institution&apos;s requirements.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={startOver}>
                Generate Another
              </Button>
              <Button className="flex-1" onClick={copyToClipboard}>
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
            </div>

            {/* Download options */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-3">Download your disclosure:</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const blob = await exportDisclosureToDocx(result, {
                        title: "AI Disclosure Statement",
                        template: getSelectedTemplateName(),
                        createdAt: new Date().toLocaleDateString(),
                      });
                      downloadBlob(blob, `ai-disclosure-${Date.now()}.docx`);
                    } catch (err) {
                      setError("Failed to export document");
                    }
                  }}
                >
                  Download .docx
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = exportDisclosureToTxt(result, {
                      title: "AI Disclosure Statement",
                      template: getSelectedTemplateName(),
                      createdAt: new Date().toLocaleDateString(),
                    });
                    downloadBlob(blob, `ai-disclosure-${Date.now()}.txt`);
                  }}
                >
                  Download .txt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={emailDisclosure}
                  disabled={emailing}
                >
                  {emailing ? "Sending..." : emailSent ? "Sent!" : "Email to me"}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-2">Where to place this disclosure:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>APA:</strong> Author Note section or Methods</li>
                <li>• <strong>MLA:</strong> Works Cited or endnote</li>
                <li>• <strong>Chicago:</strong> Footnote or endnote</li>
                <li>• <strong>Coursework:</strong> Beginning or end of your paper</li>
                <li>• <strong>Journal submission:</strong> Acknowledgments or Methods section</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
