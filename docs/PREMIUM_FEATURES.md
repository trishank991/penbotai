# ScholarSync - Premium Features Roadmap

> **📋 Master Document:** For the complete unified strategy with full task tracking, see [../MASTER_STRATEGY.md](../MASTER_STRATEGY.md)

## Overview

This document outlines premium features prioritized by **competitive differentiation** and **value to students**.

**Key Insight (Dec 2025):** The market has more competitors than initially anticipated. Our primary differentiator is **Prompt Coach** - no competitor offers student-focused prompt scoring. All feature development should strengthen this advantage.

---

## Current Free vs Premium

### FREE TIER (Hook)
- 5 prompt analyses/month
- 3 disclosure statements/month
- 5 research queries/month
- Basic grammar check (LanguageTool)

### PREMIUM: $5/month
- Unlimited everything above
- Export to PDF/DOCX
- Disclosure history
- Priority support

---

## Premium Features Missing in Market

### 1. AI Citation Verifier (HIGH VALUE)

**The Problem:**
- 47% of AI-generated citations are wrong/fake ([Source](https://originality.ai/blog/ai-hallucination-factual-error-problems))
- Students can't verify every citation manually
- Getting caught with fake citations = academic misconduct

**Our Solution:**
```
Input: AI-generated citation
Output:
- ✅ Verified (exists, details correct)
- ⚠️ Partial Match (exists but details wrong)
- ❌ Not Found (likely hallucinated)
- 📎 Corrected citation if found
```

**How it works:**
1. Extract citation details (author, title, year, journal)
2. Query Semantic Scholar / CrossRef / OpenAlex APIs
3. Fuzzy match to find real paper
4. Return verification status + correct citation

**Competitor Status:** NO TOOL DOES THIS

---

### 2. AI Contribution Tracker (MEDIUM VALUE)

**The Problem:**
- Students use AI across multiple sessions
- Hard to remember what AI helped with
- Disclosure requires specifics

**Our Solution:**
- Browser extension or copy-paste tracker
- Log: "Used ChatGPT for [brainstorming] on [date]"
- Auto-generate disclosure from logs
- Export AI usage report

**Competitor Status:** Grammarly Authorship does this BUT only in Grammarly

---

### 3. Research Mode with Real Sources (HIGH VALUE)

**The Problem:**
- AI hallucinates sources
- Students need verified academic papers
- Tab-switching between AI and Google Scholar is tedious

**Our Solution:**
```
User: "Find sources about climate change impact on agriculture"

Response:
1. [Real Paper] Smith et al. (2023) - "Climate Impact on Crops"
   - Citation: [APA] [MLA] [Chicago] [Copy]
   - Abstract: ...
   - Relevance Score: 94%

2. [Real Paper] Johnson (2022) - "Agricultural Adaptation"
   ...
```

**APIs to use:**
- Semantic Scholar (200M papers, FREE)
- OpenAlex (260M works, FREE, CC0)
- CrossRef (for DOI verification)

**Competitor Status:** Elicit does this but $10/month and not student-focused

---

### 4. Prompt Templates Library (MEDIUM VALUE)

**The Problem:**
- Students don't know how to prompt effectively
- Each discipline has different needs
- Trial and error wastes time

**Our Solution:**
```
Categories:
├── Essay Writing
│   ├── Thesis statement generator
│   ├── Outline creator
│   └── Counterargument finder
├── Research
│   ├── Literature review helper
│   ├── Methodology explainer
│   └── Data analysis prompt
├── STEM
│   ├── Code explanation
│   ├── Math problem breakdown
│   └── Lab report structure
└── Citations
    ├── Paraphrase with citation
    └── Quote integration
```

**Each template includes:**
- Pre-built prompt structure
- Customization fields
- Expected output example
- Score prediction

**Competitor Status:** Generic prompt libraries exist, none student-specific

---

### 5. Assignment Breakdown Assistant (HIGH VALUE)

**The Problem:**
- Large assignments are overwhelming
- Students procrastinate
- AI use becomes desperate last-minute cheating

**Our Solution:**
```
Input: Paste assignment instructions

Output:
1. Task Breakdown
   - Research phase (estimated 3 hours)
   - Outline phase (estimated 1 hour)
   - Writing phase (estimated 4 hours)
   - Revision phase (estimated 2 hours)

2. AI Use Recommendations
   ✅ OK to use AI for: Brainstorming, grammar check
   ⚠️ Check with professor: Outline generation
   ❌ Avoid AI for: Writing full sections

3. Disclosure Template
   Pre-filled based on likely AI usage
```

**Competitor Status:** NO TOOL DOES THIS

---

### 6. Multi-Format Export (LOW VALUE, EASY TO BUILD)

**The Problem:**
- Students need disclosures in different formats
- Copy-paste loses formatting

**Our Solution:**
- Export as PDF (formatted)
- Export as DOCX (editable)
- Export as plain text
- Export as LaTeX

---

### 7. Course-Specific AI Policy Decoder (MEDIUM VALUE)

**The Problem:**
- Each professor has different AI policies
- Policies are buried in syllabi
- Students misunderstand what's allowed

**Our Solution:**
```
Input: Paste syllabus text or AI policy

Output:
📊 AI Policy Summary

Allowed:
✅ Grammar checking
✅ Brainstorming ideas

Requires Disclosure:
⚠️ Using AI for outlines
⚠️ Paraphrasing assistance

Not Allowed:
❌ AI-generated content submission
❌ AI for coding assignments

Recommended Disclosure Template:
[Auto-generated based on policy]
```

**Competitor Status:** NO TOOL DOES THIS

---

### 8. Collaboration Mode (FUTURE - University Tier)

**The Problem:**
- Writing centers need to help multiple students
- No standardized disclosure process
- Instructors want visibility

**Our Solution (University Tier - $20/month for 5 seats):**
- Shared disclosure templates
- Usage analytics dashboard
- Bulk export for reporting
- LMS integration (Canvas, Blackboard)

---

## Feature Priority Matrix (Revised Dec 2025)

| Feature | Value to Students | Build Effort | Competitive Advantage | Priority |
|---------|-------------------|--------------|----------------------|----------|
| **Prompt Templates Library** | HIGH | Low | HIGH (no competitor) | **P1** |
| **Prompt Coach Gamification** | HIGH | Medium | HIGH (unique) | **P1** |
| AI Citation Verifier | HIGH | Medium | LOW (competitors exist) | **P2** |
| Assignment Breakdown | HIGH | Low | MEDIUM | **P2** |
| Policy Decoder | MEDIUM | Low | MEDIUM | **P3** |
| LMS Canvas Integration | HIGH | Medium | CRITICAL | **P1** |
| AI Contribution Tracker | MEDIUM | High | LOW | **P4** |
| Multi-Format Export | LOW | Low | LOW | **P3** |

**Strategy:** Double down on Prompt Coach features (P1) since this is our unique differentiator. Citation verification has competitors (GPTZero, Citea, etc.) so it's lower priority.

---

## Recommended Premium Tiers

### FREE ($0)
- 5 prompt analyses/month
- 3 disclosure statements/month
- 5 research queries/month
- Basic grammar check

### PRO ($5/month)
- Unlimited analyses
- Unlimited disclosures
- Unlimited research
- **AI Citation Verifier** ⭐
- **Prompt Templates Library** ⭐
- Multi-format export
- Disclosure history

### UNIVERSITY ($20/month for 5 seats)
- Everything in Pro
- **Policy Decoder** ⭐
- **Assignment Breakdown** ⭐
- Team collaboration
- Admin dashboard
- Usage analytics
- Priority support

---

## Revenue Projections

### Assumptions
- 10,000 free users after 6 months
- 2% conversion to Pro = 200 users × $5 = $1,000/month
- 10 university accounts × $20 = $200/month
- **Total: $1,200/month at 6 months**

### Year 2 Target
- 50,000 free users
- 3% conversion = 1,500 Pro users × $5 = $7,500/month
- 50 university accounts × $20 = $1,000/month
- **Total: $8,500/month**

---

## Build Order

### Phase 1 (MVP - Weeks 1-6) ✅ COMPLETED
1. ✅ Disclosure Generator
2. ✅ Prompt Coach
3. ✅ Research Assistant (basic)
4. ✅ Grammar Check
5. ✅ Plagiarism Checker

### Phase 2 (Premium - Weeks 7-10) ✅ COMPLETED
1. ✅ Multi-format Export (TXT, DOCX)
2. ✅ BibTeX Export for citations
3. ✅ Research Paper Library with folders/tags
4. [ ] AI Citation Verifier
5. [ ] Prompt Templates Library

### Phase 3 (Growth - Months 3-4) ✅ IN PROGRESS
1. ✅ Chrome Extension with full features
2. ✅ Mobile App (iOS/Android)
3. [ ] Assignment Breakdown
4. [ ] Policy Decoder
5. ✅ Research Mode Enhanced (library, saved papers)

### Phase 4 (Scale - Months 5-6) ✅ IN PROGRESS
1. ✅ University/Team Tier
2. ✅ API Keys Management
3. ✅ LMS Integrations Framework
4. [ ] AI Contribution Tracker (full)
5. [ ] Advanced Analytics

---

*Last Updated: December 2025*
