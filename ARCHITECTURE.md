# ScholarSync - Zero-Cost Technical Architecture

> **📋 Master Document:** For the complete unified strategy with full task tracking, see [MASTER_STRATEGY.md](MASTER_STRATEGY.md)

## Overview

Built for $0/month until 10K+ users using best-in-class free tiers.

**Status:** MVP Complete - December 2025
**Platforms:** Web App, Chrome Extension, Mobile App (iOS/Android)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                  │
│                     Cloudflare Pages (Next.js 14)                   │
│                                                                     │
│  ✅ Unlimited bandwidth (FREE)                                      │
│  ✅ 300+ edge locations globally                                    │
│  ✅ Automatic SSL                                                   │
│  ✅ Commercial use allowed                                          │
│                                                                     │
│  Stack: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui         │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        EDGE FUNCTIONS                               │
│                      Cloudflare Workers                             │
│                                                                     │
│  ✅ 100,000 requests/day (FREE)                                     │
│  ✅ Zero cold starts                                                │
│  ✅ Global edge deployment                                          │
│                                                                     │
│  Routes:                                                            │
│  - /api/prompt-coach     → Analyze & score prompts                  │
│  - /api/disclosure       → Generate disclosure statements          │
│  - /api/grammar          → LanguageTool proxy                       │
│  - /api/research         → Semantic Scholar proxy                   │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     DATABASE + AUTH + STORAGE                       │
│                          Supabase                                   │
│                                                                     │
│  ✅ 500MB PostgreSQL (FREE)                                         │
│  ✅ 50,000 MAU auth (FREE)                                          │
│  ✅ 1GB file storage (FREE)                                         │
│  ✅ Realtime subscriptions                                          │
│  ✅ Row-level security                                              │
│                                                                     │
│  Tables:                                                            │
│  - users              → Auth, profile, preferences                  │
│  - prompts            → Saved prompts, scores, history              │
│  - disclosures        → Generated disclosures                       │
│  - usage              → Analytics, rate limiting                    │
│  - subscriptions      → Stripe subscription status                  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   AI / LLM      │   │  Grammar API    │   │  Research API   │
│                 │   │                 │   │                 │
│ Groq (FREE)     │   │ LanguageTool    │   │ Semantic Scholar│
│ - Llama 3.3 70B │   │ - FREE tier     │   │ - FREE, no key  │
│ - 14,400 req/day│   │ - 20 req/min    │   │ - 1000 req/sec  │
│                 │   │ - 30+ languages │   │ - 200M papers   │
│ Fallback:       │   │                 │   │                 │
│ Claude/GPT-4o   │   │ Self-hosted     │   │ OpenAlex        │
│ ($0.60/1M tok)  │   │ option (v2)     │   │ - FREE, CC0     │
└─────────────────┘   └─────────────────┘   └─────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      SUPPORTING SERVICES                            │
│                                                                     │
│  📧 Email: Resend (3,000/month FREE)                                │
│  💳 Payments: Stripe (2.9% + $0.30 per transaction)                 │
│  📊 Analytics: Umami (self-hosted, unlimited FREE)                  │
│  🔍 Error Tracking: Sentry (5K events/month FREE)                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack (Best-in-Class, Not Random)

### Frontend
| Choice | Why | Alternatives Considered |
|--------|-----|------------------------|
| **Next.js 14** | App Router, RSC, best DX | Remix (good), SvelteKit (less ecosystem) |
| **TypeScript** | Type safety, better DX | JavaScript (too error-prone) |
| **Tailwind CSS** | Fastest styling, utility-first | CSS Modules (slower), Styled Components (runtime cost) |
| **shadcn/ui** | Copy-paste, accessible, customizable | Chakra (heavier), MUI (too opinionated) |

### Hosting
| Choice | Why | Alternatives Considered |
|--------|-----|------------------------|
| **Cloudflare Pages** | Unlimited bandwidth FREE, commercial allowed | Vercel (no commercial on free), Netlify (100GB limit) |
| **Cloudflare Workers** | 100K req/day FREE, zero cold starts | Vercel Edge (limited), AWS Lambda (cold starts) |

### Database & Auth
| Choice | Why | Alternatives Considered |
|--------|-----|------------------------|
| **Supabase** | Postgres + Auth + Storage bundle, 500MB FREE | Firebase (NoSQL), PlanetScale (removed free tier), Neon (smaller free tier) |
| **Supabase Auth** | 50K MAU FREE (vs Clerk 10K) | Clerk (beautiful but expensive), Auth0 (7.5K MAU then $$$) |

### AI/LLM
| Choice | Why | Alternatives Considered |
|--------|-----|------------------------|
| **Groq** (primary) | 14,400 req/day FREE, Llama 3.3 70B, blazing fast | Together.ai (also good), OpenRouter (aggregator) |
| **Claude/GPT-4o mini** (fallback) | Best quality when needed, $0.60/1M tokens | GPT-4 (expensive), Claude Opus (expensive) |

### Grammar
| Choice | Why | Alternatives Considered |
|--------|-----|------------------------|
| **LanguageTool API** | FREE tier, open source, 30+ languages | Grammarly API (no public API), ProWritingAid (limited) |

### Research
| Choice | Why | Alternatives Considered |
|--------|-----|------------------------|
| **Semantic Scholar** | FREE, no API key needed, 200M papers | CrossRef (metadata only), OpenAlex (no abstracts) |
| **OpenAlex** (secondary) | FREE, CC0, 260M works | Google Scholar (no API), Scopus (expensive) |

### Payments
| Choice | Why | Alternatives Considered |
|--------|-----|------------------------|
| **Stripe** | 2.9% + $0.30 (lowest), best DX | Paddle (5% + MoR), LemonSqueezy (5%) |

### Email
| Choice | Why | Alternatives Considered |
|--------|-----|------------------------|
| **Resend** | 3,000/month FREE, modern API | Postmark (100/month free), SendGrid (complex) |

### Analytics
| Choice | Why | Alternatives Considered |
|--------|-----|------------------------|
| **Umami** (self-hosted) | Unlimited FREE, privacy-first | Plausible ($9/mo cloud), GA4 (privacy issues) |

---

## Database Schema

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  university TEXT,
  plan TEXT DEFAULT 'free', -- 'free', 'premium', 'university'
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompts history
CREATE TABLE public.prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_prompt TEXT NOT NULL,
  score INTEGER, -- 0-100
  feedback JSONB, -- {clarity: 80, specificity: 70, context: 90, suggestions: [...]}
  improved_prompt TEXT,
  ai_model TEXT, -- 'chatgpt', 'claude', 'gemini', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disclosures
CREATE TABLE public.disclosures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ai_tools_used TEXT[], -- ['chatgpt', 'claude']
  purpose TEXT, -- 'brainstorming', 'drafting', 'editing', 'research'
  description TEXT,
  prompts_used TEXT[],
  output_usage TEXT, -- How the output was used
  formatted_disclosure TEXT, -- Final formatted statement
  template TEXT, -- 'apa', 'mla', 'university-specific'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking (for rate limiting & analytics)
CREATE TABLE public.usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL, -- 'prompt_coach', 'disclosure', 'grammar', 'research'
  count INTEGER DEFAULT 1,
  period TEXT NOT NULL, -- '2024-01' (monthly)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature, period)
);

-- Subscriptions (synced with Stripe)
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL, -- 'premium', 'university'
  status TEXT NOT NULL, -- 'active', 'cancelled', 'past_due'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own prompts" ON public.prompts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own disclosures" ON public.disclosures
  FOR ALL USING (auth.uid() = user_id);
```

---

## API Routes

### `/api/prompt-coach` (POST)
```typescript
// Input
{
  prompt: string;      // User's prompt to analyze
  targetAI?: string;   // 'chatgpt' | 'claude' | 'gemini'
}

// Output
{
  score: number;       // 0-100 overall score
  breakdown: {
    clarity: number;       // How clear is the request?
    specificity: number;   // How specific is it?
    context: number;       // Does it provide enough context?
    structure: number;     // Is it well-organized?
  };
  suggestions: string[];   // How to improve
  improvedPrompt?: string; // AI-suggested improvement
}
```

### `/api/disclosure` (POST)
```typescript
// Input
{
  aiTools: string[];      // ['chatgpt', 'claude']
  purpose: string;        // 'research', 'drafting', 'editing'
  description: string;    // What you used AI for
  promptsUsed?: string[]; // Optional: actual prompts
  outputUsage: string;    // How output was used
  template: string;       // 'apa', 'mla', 'chicago', 'custom'
}

// Output
{
  disclosure: string;     // Formatted disclosure statement
  format: string;         // Template used
}
```

### `/api/grammar` (POST)
```typescript
// Input
{
  text: string;           // Text to check
  language?: string;      // 'en-US', 'en-GB', etc.
}

// Output (LanguageTool format)
{
  matches: [{
    message: string;
    offset: number;
    length: number;
    replacements: string[];
    rule: { id: string; description: string; }
  }]
}
```

### `/api/research` (POST)
```typescript
// Input
{
  query: string;          // Search query
  limit?: number;         // Max results (default 10)
}

// Output
{
  papers: [{
    title: string;
    authors: string[];
    year: number;
    abstract: string;
    url: string;
    citationCount: number;
    citation: {
      apa: string;
      mla: string;
      chicago: string;
    }
  }]
}
```

---

## Cost Breakdown

### $0/month Phase (0-10K users)
| Service | Free Limit | Our Usage |
|---------|------------|-----------|
| Cloudflare Pages | Unlimited | ✅ |
| Cloudflare Workers | 100K req/day | ~30K/day at 10K users |
| Supabase | 500MB DB, 50K MAU | ~200MB, 10K MAU |
| Groq | 14,400 req/day | ~10K/day at 10K users |
| Resend | 3K emails/month | ~1K/month |
| Umami | Unlimited (self-hosted) | ✅ |
| **TOTAL** | | **$0/month** |

### $30-50/month Phase (10K-50K users)
| Service | Cost |
|---------|------|
| Cloudflare Workers | $5/month (10M requests) |
| Supabase Pro | $25/month (8GB, 100K MAU) |
| AI APIs (overflow) | $10-20/month |
| **TOTAL** | **$40-50/month** |

### Revenue at 50K users (1% conversion = 500 paid)
- $5/month × 500 = **$2,500/month**
- Costs: $50/month
- **Profit: $2,450/month**

---

## Security Considerations

1. **Row-Level Security (RLS)** - Users only access their own data
2. **API Rate Limiting** - Prevent abuse via Cloudflare Workers
3. **Input Sanitization** - Prevent XSS/injection in prompts
4. **Stripe Webhooks** - Verify signatures for subscription events
5. **HTTPS Everywhere** - Cloudflare handles SSL automatically
6. **Environment Variables** - Never commit API keys to git
7. **Origin Validation** - Chrome extension validates message origins using URL parsing
8. **Secure API Key Generation** - Uses crypto.getRandomValues() for API keys
9. **SQL Injection Prevention** - Parameterized queries for all database operations
10. **Secure Token Storage** - Mobile app uses SecureStore for sensitive data

---

## Chrome Extension Architecture

### Overview
Manifest V3 extension with service worker for background tasks and content scripts for AI platform tracking.

### Components

```
chrome-extension/
├── manifest.json          # Extension configuration
├── popup.html/js/css      # Main UI with all features
├── background.js          # Service worker for tracking
└── content.js             # AI platform detection
```

### Supported AI Platforms
- ChatGPT (chat.openai.com)
- Claude (claude.ai)
- Google Gemini (gemini.google.com)
- Perplexity (perplexity.ai, www.perplexity.ai)

### Features
- **Research Assistant** - Search Semantic Scholar directly
- **Disclosure Generator** - Create statements offline or via API
- **Prompt Coach** - Analyze and score prompts
- **Grammar Checker** - LanguageTool integration
- **Usage Tracking** - Track AI tool usage across platforms
- **Offline Mode** - Full functionality without account

### Security
- Origin validation using `new URL().origin` (not `.startsWith()`)
- Environment detection via manifest `update_url` and `key`
- XSS prevention via DOM-based escaping
- BibTeX key sanitization (diacritics, special characters)

---

## Mobile App Architecture

### Overview
React Native/Expo app with cross-platform iOS/Android support.

### Tech Stack
- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **Auth Storage**: expo-secure-store
- **State**: React hooks

### Screens
- HomeScreen - Dashboard with feature cards
- PromptCoachScreen - Prompt analysis
- DisclosureScreen - AI disclosure generator
- ResearchScreen - Academic paper search
- GrammarScreen - Grammar checking

### Security
- SecureStore for auth tokens (not AsyncStorage)
- API URL validation before requests
- Proper promise handling in storage adapters

---

## Scaling Path

### 0-10K Users: Current Architecture
- All free tiers
- Single Supabase project
- Cloudflare edge

### 10K-100K Users: Optimize
- Supabase Pro ($25/mo)
- Add caching (Cloudflare KV)
- Consider dedicated Groq plan

### 100K+ Users: Scale
- Multiple Supabase regions
- Custom AI model fine-tuning
- Consider self-hosted LLM (Llama)

---

## Development Setup

```bash
# Clone repo
git clone https://github.com/yourusername/scholarsync.git
cd scholarsync

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - GROQ_API_KEY
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
# - RESEND_API_KEY

# Run Supabase locally (optional)
npx supabase start

# Start dev server
npm run dev
```

---

## File Structure

```
scholarsync/
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   ├── (auth)/                   # Auth routes
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/              # Protected routes
│   │   │   ├── prompt-coach/
│   │   │   │   └── history/          # Prompt history
│   │   │   ├── disclosure/
│   │   │   ├── research/
│   │   │   │   └── library/          # Saved papers library
│   │   │   ├── grammar/
│   │   │   ├── plagiarism/           # Plagiarism checker
│   │   │   ├── pricing/
│   │   │   └── settings/
│   │   │       ├── api-keys/         # API key management
│   │   │       ├── integrations/     # LMS integrations
│   │   │       └── team/             # Team management
│   │   ├── api/                      # API routes
│   │   │   ├── prompt-coach/
│   │   │   ├── disclosure/
│   │   │   ├── grammar/
│   │   │   ├── research/
│   │   │   ├── plagiarism/
│   │   │   ├── library/              # Research library
│   │   │   ├── auth/
│   │   │   └── stripe/
│   │   │       ├── checkout/
│   │   │       └── webhook/
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   └── signout/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css
│   ├── components/                   # React components
│   │   └── ui/                       # shadcn/ui components
│   ├── lib/                          # Utilities
│   │   ├── supabase/                 # Supabase client
│   │   │   ├── client.ts             # Browser client
│   │   │   └── server.ts             # Server client
│   │   ├── export.ts                 # Citation export (BibTeX, APA, MLA, Chicago)
│   │   └── utils.ts
│   ├── types/                        # TypeScript types
│   │   └── index.ts                  # All type definitions
│   └── middleware.ts                 # Auth middleware
├── chrome-extension/                 # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js                      # Full-featured popup
│   ├── background.js                 # Service worker
│   ├── content.js                    # AI platform tracking
│   └── styles.css
├── mobile-app/                       # React Native/Expo App
│   ├── src/
│   │   ├── screens/                  # Screen components
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── PromptCoachScreen.tsx
│   │   │   ├── DisclosureScreen.tsx
│   │   │   ├── ResearchScreen.tsx
│   │   │   └── GrammarScreen.tsx
│   │   ├── services/
│   │   │   └── supabase.ts           # SecureStore adapter
│   │   └── navigation/
│   ├── app.json
│   └── package.json
├── supabase/                         # Supabase config
│   └── setup.sql                     # Database schema & RLS
├── docs/                             # Documentation
│   ├── MARKET_RESEARCH.md
│   ├── PREMIUM_FEATURES.md
│   └── COMPETITIVE_ANALYSIS.md
├── ARCHITECTURE.md
├── BUILD_PLAN.md
├── STRATEGY.md
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```
