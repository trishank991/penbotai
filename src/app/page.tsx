"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Theme types
type ThemeMode = "light" | "dark" | "colorful";

const features = [
  {
    title: "AI Disclosure Generator",
    description: "Generate professional AI usage statements for your assignments. 45+ institutional templates supported.",
    badge: "Unique",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    gradient: "from-violet-500 to-purple-500",
    lightGradient: "from-violet-400 to-purple-400",
  },
  {
    title: "Submission Ready",
    description: "Pre-submission scoring for topic relevance, completeness, and assignment alignment. Submit with confidence.",
    badge: "Smart",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12l2 2 4-4" />
        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.12 0 4.07.74 5.61 1.97" />
        <path d="M21 3v6h-6" />
      </svg>
    ),
    gradient: "from-cyan-500 to-teal-500",
    lightGradient: "from-cyan-400 to-teal-400",
  },
  {
    title: "Prompt Coach",
    description: "Score your prompts 0-100 and get suggestions to improve. Learn to communicate better with AI.",
    badge: "Educational",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    gradient: "from-amber-500 to-orange-500",
    lightGradient: "from-amber-400 to-orange-400",
  },
  {
    title: "Research Assistant",
    description: "Search 200M+ academic papers. Auto-generate citations in APA, MLA, Chicago, BibTeX formats.",
    badge: "Powerful",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="12" y1="6" x2="12" y2="10" />
        <line x1="12" y1="14" x2="12" y2="14" />
      </svg>
    ),
    gradient: "from-emerald-500 to-teal-500",
    lightGradient: "from-emerald-400 to-teal-400",
  },
  {
    title: "Grammar Check",
    description: "Advanced grammar, spelling, and style checker with regional English support (US, UK, AU, and more).",
    badge: "Free",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    gradient: "from-sky-500 to-blue-500",
    lightGradient: "from-sky-400 to-blue-400",
  },
  {
    title: "Chrome Extension",
    description: "Track AI usage across ChatGPT, Claude, Gemini & more. Works offline for grammar, prompts & disclosures!",
    badge: "Premium",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
    ),
    gradient: "from-indigo-500 to-violet-500",
    lightGradient: "from-indigo-400 to-violet-400",
  },
];

const pricing = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "5 prompt analyses/month",
      "3 disclosure statements/month",
      "5 research queries/month",
      "Basic grammar check",
      "3 submission checks/month",
    ],
    notIncluded: [
      "Export to .docx/.pdf",
      "Prompt history",
      "Research library",
      "Chrome extension",
      "Team accounts",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Premium",
    price: "$5",
    period: "/month",
    features: [
      "Unlimited prompt analyses",
      "Unlimited disclosures",
      "Unlimited research queries",
      "Advanced grammar & style",
      "Unlimited submission checks",
      "Export to .docx, .txt, BibTeX",
      "Prompt history & analytics",
      "Research library (save papers)",
      "Chrome extension tracking",
      "Priority support",
    ],
    notIncluded: [],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Team",
    price: "$15",
    period: "/month",
    features: [
      "Everything in Premium",
      "Up to 10 team members",
      "Admin dashboard",
      "Usage analytics",
      "API access (1000 calls/mo)",
      "Custom branding",
      "Dedicated support",
    ],
    notIncluded: [],
    cta: "Contact Sales",
    popular: false,
  },
];

// Unique strengths data
const strengths = [
  {
    number: "01",
    title: "All-In-One Academic Suite",
    description: "One platform for disclosures, research, grammar, and submission prep. No more juggling multiple tools.",
    emoji: "📚",
  },
  {
    number: "02",
    title: "Built for Transparency",
    description: "The only tool designed from the ground up for ethical AI disclosure. Not an afterthought.",
    emoji: "🛡️",
  },
  {
    number: "03",
    title: "Student-First Pricing",
    description: "Premium features at $5/month. We believe academic tools should be accessible to everyone.",
    emoji: "💰",
  },
  {
    number: "04",
    title: "Works Offline",
    description: "Grammar, prompts, and disclosures work without internet. Your data stays on your device.",
    emoji: "📴",
  },
  {
    number: "05",
    title: "45+ Institution Templates",
    description: "Pre-built disclosure formats for major universities. Your format, guaranteed compliant.",
    emoji: "🎓",
  },
  {
    number: "06",
    title: "200M+ Research Papers",
    description: "Access the largest academic database. Find, cite, and organize research in seconds.",
    emoji: "🔬",
  },
];

// Stats data
const stats = [
  { value: "200M+", label: "Research Papers" },
  { value: "45+", label: "Institution Templates" },
  { value: "100%", label: "Privacy Focused" },
  { value: "24/7", label: "Offline Ready" },
];

// Theme configurations
const themeConfigs = {
  light: {
    bg: "bg-gradient-to-b from-sky-50 via-white to-violet-50",
    navBg: "bg-white/90 border-slate-200",
    text: "text-slate-900",
    textMuted: "text-slate-600",
    cardBg: "bg-white border-slate-200",
    accent: "from-violet-600 to-indigo-600",
    buttonBg: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
  },
  dark: {
    bg: "bg-slate-950",
    navBg: "bg-slate-950/90 border-white/10",
    text: "text-white",
    textMuted: "text-slate-400",
    cardBg: "bg-slate-900/50 border-slate-800",
    accent: "from-violet-400 to-indigo-400",
    buttonBg: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500",
  },
  colorful: {
    bg: "bg-gradient-to-br from-pink-100 via-purple-100 to-cyan-100",
    navBg: "bg-white/80 border-purple-200",
    text: "text-purple-900",
    textMuted: "text-purple-700",
    cardBg: "bg-white/80 border-purple-200",
    accent: "from-pink-500 via-purple-500 to-cyan-500",
    buttonBg: "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-400 hover:via-purple-400 hover:to-cyan-400",
  },
};

export default function Home() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const config = themeConfigs[theme];

  // Detect system preference on mount
  useEffect(() => {
    // Check for saved preference
    const saved = localStorage.getItem("penbotai-theme") as ThemeMode | null;
    if (saved && saved in themeConfigs) {
      setTheme(saved);
      return;
    }

    // Check system preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem("penbotai-theme", newTheme);
  };

  return (
    <div className={`flex min-h-screen flex-col ${config.bg} ${config.text} transition-colors duration-300`}>
      {/* Background decorations */}
      {theme === "dark" && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 left-1/2 w-[400px] h-[400px] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
        </div>
      )}

      {theme === "colorful" && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-pink-300/40 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 right-1/4 w-[350px] h-[350px] bg-cyan-300/40 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-1/2 w-[300px] h-[300px] bg-purple-300/40 rounded-full blur-[80px]" />
        </div>
      )}

      {/* Navigation */}
      <nav className={`relative border-b ${config.navBg} backdrop-blur-xl sticky top-0 z-50`}>
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${config.accent} flex items-center justify-center shadow-lg`}>
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className={`text-2xl font-bold bg-gradient-to-r ${config.accent} bg-clip-text text-transparent`}>
              PenBotAI
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Theme Selector */}
            <div className={`flex items-center gap-1 p-1 rounded-lg ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}>
              <button
                onClick={() => handleThemeChange("light")}
                className={`p-2 rounded-md transition-all ${theme === "light" ? "bg-white shadow-sm" : theme === "dark" ? "hover:bg-slate-700" : "hover:bg-slate-200"}`}
                title="Light Mode"
              >
                ☀️
              </button>
              <button
                onClick={() => handleThemeChange("dark")}
                className={`p-2 rounded-md transition-all ${theme === "dark" ? "bg-slate-700 shadow-sm" : "hover:bg-slate-200"}`}
                title="Dark Mode"
              >
                🌙
              </button>
              <button
                onClick={() => handleThemeChange("colorful")}
                className={`p-2 rounded-md transition-all ${theme === "colorful" ? "bg-white shadow-sm" : theme === "dark" ? "hover:bg-slate-700" : "hover:bg-slate-200"}`}
                title="Colorful Mode (Kids-Friendly)"
              >
                🌈
              </button>
            </div>

            <Link href="/login">
              <Button variant="ghost" className={`${config.textMuted} font-medium`}>
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className={`${config.buttonBg} shadow-lg font-semibold text-white`}>
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-20 pb-28 text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${theme === "dark" ? "bg-violet-500/10 border-violet-500/20" : theme === "colorful" ? "bg-pink-200/80 border-purple-300" : "bg-violet-100 border-violet-200"} border mb-8`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className={`text-sm font-semibold ${theme === "dark" ? "text-violet-300" : theme === "colorful" ? "text-purple-700" : "text-violet-700"}`}>
            Built for Ethical AI Learning
          </span>
        </div>

        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          <span className={theme === "dark" ? "bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent" : ""}>
            Use AI
          </span>
          <br />
          <span className={`bg-gradient-to-r ${config.accent} bg-clip-text text-transparent`}>
            Transparently
          </span>
        </h1>

        <p className={`mx-auto max-w-2xl text-xl ${config.textMuted} mb-12 leading-relaxed`}>
          The complete academic toolkit for students who want to use AI the right way.
          Disclosures. Research. Grammar. Pre-submission checks. All in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="/signup">
            <Button size="lg" className={`w-full sm:w-auto text-lg px-10 py-7 ${config.buttonBg} shadow-2xl font-semibold rounded-2xl group text-white`}>
              Start Free - No Credit Card
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className={`w-full sm:w-auto text-lg px-10 py-7 border-2 ${theme === "dark" ? "border-slate-700 hover:border-violet-500/50 hover:bg-violet-500/10 text-slate-300" : "border-slate-300 hover:border-violet-400 hover:bg-violet-50"} font-semibold rounded-2xl bg-transparent`}>
              Explore Features
            </Button>
          </Link>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`text-3xl lg:text-4xl font-bold bg-gradient-to-r ${config.accent} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className={`text-sm ${config.textMuted} font-medium mt-1`}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-us" className={`relative py-28 ${theme === "dark" ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" : theme === "colorful" ? "bg-gradient-to-b from-purple-50 to-pink-50" : "bg-gradient-to-b from-slate-50 to-white"}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className={`mb-6 px-5 py-2 text-sm font-semibold ${theme === "dark" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : theme === "colorful" ? "bg-green-200 text-green-700 border-green-300" : "bg-emerald-100 text-emerald-700 border-emerald-200"}`}>
              Why Students Choose Us
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Built Different, Built Better
            </h2>
            <p className={`${config.textMuted} max-w-2xl mx-auto text-lg`}>
              Not just another writing tool. The first platform designed specifically for ethical AI use in academics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {strengths.map((strength) => (
              <Card
                key={strength.title}
                className={`group relative overflow-hidden ${config.cardBg} hover:shadow-xl transition-all duration-500 hover:-translate-y-2`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl">{strength.emoji}</span>
                    <span className={`text-5xl font-black ${theme === "dark" ? "text-slate-800" : "text-slate-200"} group-hover:text-slate-300 transition-colors`}>
                      {strength.number}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-bold">
                    {strength.title}
                  </CardTitle>
                  <CardDescription className={config.textMuted}>
                    {strength.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative container mx-auto px-4 py-28">
        <div className="text-center mb-16">
          <Badge className={`mb-6 px-5 py-2 text-sm font-semibold ${theme === "dark" ? "bg-violet-500/10 text-violet-400 border-violet-500/20" : theme === "colorful" ? "bg-purple-200 text-purple-700 border-purple-300" : "bg-violet-100 text-violet-700 border-violet-200"}`}>
            Complete Toolkit
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Everything You Need In One Place
          </h2>
          <p className={`${config.textMuted} max-w-2xl mx-auto text-lg`}>
            From AI disclosures to pre-submission checks - tools designed specifically for academic integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className={`group relative overflow-hidden ${config.cardBg} hover:shadow-xl transition-all duration-500 hover:-translate-y-2`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${theme === "dark" ? feature.gradient : feature.lightGradient} text-white shadow-lg`}>
                    {feature.icon}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      feature.badge === "Premium"
                        ? theme === "dark" ? "border-violet-500/30 text-violet-400 bg-violet-500/10" : "border-violet-300 text-violet-600 bg-violet-50"
                        : feature.badge === "Unique"
                        ? theme === "dark" ? "border-amber-500/30 text-amber-400 bg-amber-500/10" : "border-amber-300 text-amber-600 bg-amber-50"
                        : feature.badge === "Educational"
                        ? theme === "dark" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-emerald-300 text-emerald-600 bg-emerald-50"
                        : feature.badge === "Smart"
                        ? theme === "dark" ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" : "border-cyan-300 text-cyan-600 bg-cyan-50"
                        : feature.badge === "Powerful"
                        ? theme === "dark" ? "border-teal-500/30 text-teal-400 bg-teal-500/10" : "border-teal-300 text-teal-600 bg-teal-50"
                        : theme === "dark" ? "border-slate-600 text-slate-400 bg-slate-800" : "border-slate-300 text-slate-600 bg-slate-50"
                    }
                  >
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                <CardDescription className={config.textMuted}>
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Submission Ready Highlight */}
        <div className="mt-12 max-w-5xl mx-auto">
          <div className={`relative overflow-hidden rounded-3xl ${theme === "dark" ? "bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600" : theme === "colorful" ? "bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400" : "bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500"} p-1`}>
            <div className={`rounded-[22px] ${theme === "dark" ? "bg-slate-950" : "bg-white"} p-8 md:p-10`}>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className={`w-20 h-20 rounded-2xl ${theme === "dark" ? "bg-cyan-500/20 border-cyan-500/30" : "bg-cyan-100 border-cyan-200"} border flex items-center justify-center`}>
                    <span className="text-4xl">✅</span>
                  </div>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <Badge className={theme === "dark" ? "mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "mb-4 bg-cyan-100 text-cyan-700 border-cyan-200"}>New Feature</Badge>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">Submission Ready</h3>
                  <p className={`${config.textMuted} text-lg mb-4`}>
                    Check your work before you submit. Get instant scores for topic relevance, assignment alignment,
                    completeness, and structure.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                    <span className={`px-3 py-1 rounded-full ${theme === "dark" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-cyan-100 text-cyan-700 border-cyan-200"} text-sm border`}>Topic Relevance Score</span>
                    <span className={`px-3 py-1 rounded-full ${theme === "dark" ? "bg-teal-500/10 text-teal-400 border-teal-500/20" : "bg-teal-100 text-teal-700 border-teal-200"} text-sm border`}>Completeness Check</span>
                    <span className={`px-3 py-1 rounded-full ${theme === "dark" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-100 text-emerald-700 border-emerald-200"} text-sm border`}>Structure Analysis</span>
                  </div>
                </div>
                <Link href="/signup" className="flex-shrink-0">
                  <Button size="lg" className={`font-semibold shadow-lg ${theme === "dark" ? "bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500" : "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400"} text-white`}>
                    Try It Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={`relative py-28 ${theme === "dark" ? "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" : theme === "colorful" ? "bg-gradient-to-b from-pink-50 to-purple-50" : "bg-gradient-to-b from-slate-50 to-white"}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className={`mb-6 px-5 py-2 text-sm font-semibold ${theme === "dark" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : theme === "colorful" ? "bg-yellow-200 text-orange-700 border-orange-300" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
              Student-Friendly Pricing
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Start Free, Upgrade When Ready
            </h2>
            <p className={`${config.textMuted} max-w-xl mx-auto text-lg`}>
              No hidden fees. No credit card required. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <Card
                key={plan.name}
                className={`relative overflow-hidden transition-all duration-500 ${
                  plan.popular
                    ? theme === "dark"
                      ? "bg-gradient-to-b from-violet-900/50 to-slate-900 border-2 border-violet-500/50 shadow-2xl shadow-violet-500/20 scale-105 z-10"
                      : "bg-gradient-to-b from-violet-50 to-white border-2 border-violet-400 shadow-2xl shadow-violet-200 scale-105 z-10"
                    : config.cardBg
                }`}
              >
                {plan.popular && (
                  <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-center py-2 text-sm font-bold tracking-wide">
                    MOST POPULAR
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center gap-1 mt-4">
                    <span className={`text-5xl font-extrabold bg-gradient-to-r ${config.accent} bg-clip-text text-transparent`}>
                      {plan.price}
                    </span>
                    <span className={config.textMuted}>{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={theme === "dark" ? "text-slate-300" : "text-slate-700"}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.notIncluded && plan.notIncluded.length > 0 && (
                    <ul className="space-y-3 mb-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                      {plan.notIncluded.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm">
                          <svg className={`w-5 h-5 ${theme === "dark" ? "text-slate-600" : "text-slate-300"} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className={theme === "dark" ? "text-slate-500" : "text-slate-400"}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href="/signup" className="block">
                    <Button
                      className={`w-full font-semibold py-6 text-base rounded-xl text-white ${
                        plan.popular
                          ? config.buttonBg + " shadow-lg"
                          : theme === "dark" ? "bg-slate-800 hover:bg-slate-700 border border-slate-700" : "bg-slate-900 hover:bg-slate-800"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative container mx-auto px-4 py-16 mb-16">
        <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-r ${theme === "colorful" ? "from-pink-500 via-purple-500 to-cyan-500" : "from-violet-600 via-purple-600 to-indigo-600"} p-1`}>
          <div className={`rounded-[calc(2rem-4px)] bg-gradient-to-r ${theme === "colorful" ? "from-pink-500/90 via-purple-500/90 to-cyan-500/90" : "from-violet-600/90 via-purple-600/90 to-indigo-600/90"} backdrop-blur-xl p-12 md:p-16`}>
            <div className="relative text-center">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Ready to Use AI
                <br />
                the Right Way?
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Join thousands of students who are using AI transparently and learning more effectively.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className={`text-lg px-10 py-7 font-bold shadow-xl rounded-2xl ${theme === "colorful" ? "bg-white text-purple-700 hover:bg-white/90" : "bg-white text-violet-700 hover:bg-white/90"} border-0`}>
                    Get Started Free
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" className="text-lg px-10 py-7 font-semibold rounded-2xl border-2 border-white/30 text-white hover:bg-white/10 bg-transparent">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative border-t ${theme === "dark" ? "border-slate-800 bg-slate-950" : theme === "colorful" ? "border-purple-200 bg-gradient-to-b from-purple-50 to-white" : "border-slate-200 bg-white"} py-16`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.accent} flex items-center justify-center`}>
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className={`text-xl font-bold bg-gradient-to-r ${config.accent} bg-clip-text text-transparent`}>
                  PenBotAI
                </span>
              </div>
              <p className={`text-sm ${config.textMuted}`}>
                Ethical AI Learning Assistant
              </p>
            </div>
            <div className={`flex gap-8 text-sm ${config.textMuted}`}>
              <Link href="/privacy" className="hover:text-violet-600 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-violet-600 transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-violet-600 transition-colors">Contact</Link>
              <Link href="/blog" className="hover:text-violet-600 transition-colors">Blog</Link>
            </div>
          </div>
          <div className={`text-center mt-12 pt-8 border-t ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`}>
            <p className={`text-sm ${theme === "dark" ? "text-slate-600" : "text-slate-400"}`}>
              © {new Date().getFullYear()} PenBotAI. All rights reserved. Made with care for students worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
