# ScholarSync - Build Plan (Solo Developer with Claude)

> **📋 Master Document:** For the complete unified strategy with full task tracking, see [MASTER_STRATEGY.md](MASTER_STRATEGY.md)

## Timeline: 6 Weeks to MVP Launch

**Status: MVP Development Complete - December 2025**

---

## Week 1: Foundation ✅ COMPLETED

### Day 1-2: Project Setup
- [x] Create Next.js 14 project with TypeScript
- [x] Set up Tailwind CSS + shadcn/ui
- [x] Create GitHub repo
- [x] Set up Cloudflare Pages deployment
- [x] Configure Supabase project
- [x] Set up environment variables

### Day 3-4: Database & Auth
- [x] Create Supabase tables (schema from ARCHITECTURE.md)
- [x] Set up Row Level Security policies
- [x] Implement Supabase Auth (email + Google)
- [x] Create auth pages (login, signup, forgot password)
- [x] Protected route middleware

### Day 5-7: Landing Page
- [x] Hero section with value proposition
- [x] Features section (4 core features)
- [x] Pricing section (Free vs Premium)
- [x] Footer with links

**Deliverable:** ✅ Live landing page

---

## Week 2: AI Disclosure Generator (CORE FEATURE #1) ✅ COMPLETED

### Day 1-2: UI Components
- [x] Disclosure wizard multi-step form
- [x] AI tools selection (checkboxes)
- [x] Purpose dropdown
- [x] Description textarea
- [x] Prompts used input (optional)
- [x] Output usage textarea

### Day 3-4: Backend & Logic
- [x] `/api/disclosure` route
- [x] Groq/Claude integration for formatting
- [x] Template system (APA, MLA, Chicago, Generic)
- [x] Save disclosures to Supabase
- [x] View history of generated disclosures

### Day 5-7: Polish & Copy
- [x] Copy-to-clipboard functionality
- [x] Download as .txt or .docx
- [x] Rate limiting (3/month free, unlimited premium)
- [x] Usage tracking in database
- [x] Mobile responsive design

**Deliverable:** ✅ Working AI Disclosure Generator

---

## Week 3: AI Prompt Coach (CORE FEATURE #2) ✅ COMPLETED

### Day 1-2: Scoring Algorithm
- [x] Design prompt scoring rubric:
  - Clarity (0-25): Is the request understandable?
  - Specificity (0-25): How specific is the task?
  - Context (0-25): Is background provided?
  - Structure (0-25): Is it well-organized?
- [x] Build LLM prompt for analysis
- [x] Test with various prompt types

### Day 3-4: UI Components
- [x] Prompt input textarea
- [x] Target AI selector (ChatGPT, Claude, Gemini)
- [x] Score display (circular progress)
- [x] Breakdown chart (bar/radar chart)
- [x] Suggestions list
- [x] Improved prompt output

### Day 5-7: Backend & History
- [x] `/api/prompt-coach` route
- [x] Groq integration (free tier)
- [x] Save prompts & scores to Supabase
- [x] Prompt history page
- [x] Rate limiting (5/month free, unlimited premium)

**Deliverable:** ✅ Working Prompt Coach

---

## Week 4: Grammar & Research Integration ✅ COMPLETED

### Day 1-2: Grammar Check
- [x] LanguageTool API integration
- [x] `/api/grammar` proxy route
- [x] Text input with inline error highlighting
- [x] Suggestion cards with accept/ignore
- [x] Basic stats (errors found, readability)

### Day 3-4: Research Integration
- [x] Semantic Scholar API integration
- [x] `/api/research` route
- [x] Search interface with filters
- [x] Paper cards (title, authors, year, abstract)
- [x] Auto-generate citations (APA, MLA, Chicago)

### Day 5-7: Copy & Export
- [x] Copy citation button
- [x] Export citations as BibTeX
- [x] Save papers to "My Library"
- [x] Research history

**Deliverable:** ✅ Grammar checker + Research assistant

---

## Week 5: Payments & Premium ✅ COMPLETED

### Day 1-2: Stripe Setup
- [x] Create Stripe account & products
- [x] Premium plan: $5/month
- [x] Annual plan: $50/year (save $10)
- [x] Stripe Customer Portal

### Day 3-4: Subscription Flow
- [x] Pricing page with Stripe Checkout
- [x] Webhook handler for subscription events
- [x] Sync subscription status to Supabase
- [x] Gate premium features by plan

### Day 5-7: Usage Limits
- [x] Implement usage tracking
- [x] Free tier limits:
  - 3 disclosures/month
  - 5 prompt analyses/month
  - 5 research queries/month
- [x] Upgrade prompts when limit reached
- [x] Usage dashboard in settings

**Deliverable:** ✅ Working payment system

---

## Week 6: Polish & Launch ✅ COMPLETED

### Day 1-2: Dashboard
- [x] Main dashboard with stats
- [x] Recent activity feed
- [x] Quick actions (new disclosure, analyze prompt)
- [x] Usage meters (free tier remaining)

### Day 3-4: Settings & Profile
- [x] Profile settings (name, university)
- [x] Account deletion
- [x] Export all data (GDPR)

### Day 5: Testing & Bug Fixes
- [x] End-to-end testing all flows
- [x] Mobile responsiveness check
- [x] Fix critical bugs
- [x] Performance optimization

### Day 6-7: Launch Prep
- [x] Final copy review
- [x] SEO meta tags

**Deliverable:** ✅ Production-ready MVP

---

## Post-Launch (Week 7+)

### Immediate (Week 7-8) ✅ IN PROGRESS
- [x] Monitor errors (Sentry)
- [x] Respond to user feedback
- [x] Fix critical bugs (CodeRabbit security review completed)
- [ ] Begin university outreach

### Short-term (Month 2-3) ✅ COMPLETED
- [x] Chrome extension for AI usage tracking
  - Full-featured popup with all core features
  - Prompt tracking across AI platforms
  - Offline mode support
  - Secure origin validation
- [x] Mobile app (React Native/Expo)
  - Prompt Coach
  - Disclosure Generator
  - Research Assistant
  - Grammar Checker
- [ ] University partnership program
- [ ] Content marketing (blog, YouTube)
- [ ] SEO optimization

### Medium-term (Month 4-6) ✅ PARTIALLY COMPLETE
- [x] Team accounts for writing centers
- [x] LMS integrations framework (Canvas, Blackboard, Moodle, Google Classroom)
- [x] API keys management system
- [ ] Advanced analytics
- [x] API for third-party integrations

---

## Daily Schedule (Suggested)

```
Morning (2-3 hours):
- Code new features with Claude assistance
- Solve complex problems

Afternoon (2-3 hours):
- UI/UX implementation
- Testing and debugging

Evening (1-2 hours):
- Documentation
- Planning next day
- Community engagement (Reddit, Twitter)
```

---

## Tools for Building Faster

### AI Assistance
- **Claude**: Architecture, complex logic, debugging
- **Cursor/Copilot**: Code completion, boilerplate

### UI Components (Don't Reinvent)
- **shadcn/ui**: All base components
- **Lucide Icons**: Icon library
- **Recharts**: Charts for scores/stats

### Templates to Reference
- **Taxonomy** (shadcn): Dashboard layout
- **Next.js SaaS Starter**: Auth + Stripe patterns

### Testing
- **Playwright**: E2E tests (later)
- **Manual testing**: MVP phase

---

## Definition of Done (MVP) ✅ ALL COMPLETE

- [x] User can sign up/login
- [x] User can generate AI disclosure statements
- [x] User can analyze prompt quality
- [x] User can check grammar
- [x] User can search academic papers
- [x] Free tier limits work correctly
- [x] Stripe payments work
- [x] Mobile responsive
- [x] No critical bugs (CodeRabbit security review complete)
- [x] Deployed to production

## Additional Features Implemented

### Chrome Extension
- [x] Full-featured popup with all core features
- [x] AI usage tracking across ChatGPT, Claude, Gemini, Perplexity
- [x] Automatic prompt detection via content scripts
- [x] Offline mode with local analysis
- [x] Secure message origin validation
- [x] BibTeX citation generation with proper sanitization

### Mobile App (React Native/Expo)
- [x] Cross-platform iOS/Android support
- [x] Secure token storage with SecureStore
- [x] All core features: Prompt Coach, Disclosure, Research, Grammar
- [x] Native navigation

### Enterprise Features
- [x] Team management system
- [x] API key generation with scopes
- [x] LMS integration framework
- [x] Research paper library with folders and tags
- [x] Plagiarism checking (premium)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Scope creep | Stick to MVP features only |
| Burnout | Max 4-6 hours/day coding |
| Perfectionism | "Good enough" ships, perfect doesn't |
| Tech issues | Use proven stack (Next.js + Supabase) |
| No users | Launch quickly, iterate based on feedback |

---

## Success Metrics (6-Week MVP) ✅ ACHIEVED

- **Week 1**: Landing page live, 50+ waitlist signups
- **Week 2**: Disclosure generator working
- **Week 3**: Prompt coach working
- **Week 4**: All features integrated
- **Week 5**: Payments working
- **Week 6**: Launched, first 10 users

---

## 2026 Roadmap: Professional Tier Launch 🆕

See [PROFESSIONAL_TIER.md](docs/PROFESSIONAL_TIER.md) for detailed global market analysis.

### Q1 2026: Professional Tier Launch

#### January 2026
- [ ] Professional tier pricing page ($15/mo, $29/user, $49/user)
- [ ] Compliance template system architecture
- [ ] US state compliance templates (Colorado, Illinois, NYC)
- [ ] Certification badge system
- [ ] Professional onboarding flow

#### February 2026
- [ ] Team analytics dashboard
- [ ] Admin controls for Team tier
- [ ] Usage reporting and export
- [ ] Product Hunt Professional launch
- [ ] Partner with 5 US compliance consultants

#### March 2026
- [ ] UK and Australia market localization
- [ ] Singapore compliance templates
- [ ] Professional marketing website
- [ ] Content marketing: "AI Compliance for [State]" guides

**Q1 Target:** $5K MRR, 500 professional users

---

### Q2 2026: EU Expansion

#### April 2026
- [ ] German language support
- [ ] EU AI Act Article 4 training templates
- [ ] GDPR + AI Processing Notice template
- [ ] German marketing localization

#### May 2026
- [ ] French language support
- [ ] French market compliance templates
- [ ] EU partner program launch
- [ ] Attend European compliance conferences

#### June 2026
- [ ] Netherlands, Nordic expansion
- [ ] EU AI Act full compliance toolkit
- [ ] European marketing campaigns
- [ ] SSO/SAML for enterprise tier

**Q2 Target:** $12K MRR, 1,200 professional users

---

### Q3 2026: APAC Preparation & EU Full Enforcement

#### July 2026
- [ ] Japanese language support (prep for AI Basic Act)
- [ ] Korean language support (AI Basic Act active)
- [ ] South Korea compliance templates
- [ ] Japan market research

#### August 2026 (EU AI Act Full Enforcement)
- [ ] EU AI Act high-risk compliance features
- [ ] Audit log system for Enterprise tier
- [ ] EU compliance marketing push
- [ ] Partner with EU AI Act consultants

#### September 2026
- [ ] Japan AI Basic Act templates
- [ ] APAC partner program
- [ ] Custom integrations for Enterprise
- [ ] SLA guarantees for Enterprise

**Q3 Target:** $20K MRR, 2,500 professional users

---

### Q4 2026: Global Scale

#### October-December 2026
- [ ] Singapore AI Governance templates
- [ ] Australia guardrails compliance
- [ ] Advanced analytics dashboard
- [ ] API v2 for third-party integrations
- [ ] Mobile app Professional features
- [ ] Annual planning for 2027

**Q4 Target:** $30K MRR, 4,000 professional users

---

## 2026 Key Milestones

| Date | Milestone | Regulatory Catalyst |
|------|-----------|---------------------|
| Jan 2026 | South Korea AI Basic Act active | APAC opportunity opens |
| Feb 2026 | Professional tier launch | - |
| Feb 2026 | Colorado AI Act effective | US state compliance demand |
| May 2026 | EU expansion begins | EU AI Act prep |
| Aug 2026 | EU AI Act full enforcement | Peak EU demand |
| Q4 2026 | APAC market entry | Japan AI Basic Act |

---

## 2026 Revenue Targets

| Quarter | MRR Target | ARR | Cumulative Users |
|---------|------------|-----|------------------|
| Q1 2026 | $5,000 | $60,000 | 500 |
| Q2 2026 | $12,000 | $144,000 | 1,200 |
| Q3 2026 | $20,000 | $240,000 | 2,500 |
| Q4 2026 | $30,000 | $360,000 | 4,000 |

**Combined 2026 Target (Student + Professional):** $35K MRR ($420K ARR)
