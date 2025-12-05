-- Assignment Audit / Pre-Submission Review Feature
-- CIDI Framework: Evidence-based scoring with brutal truth, no hallucinations

-- Assignment Audits table
CREATE TABLE IF NOT EXISTS public.assignment_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Assignment metadata
  assignment_name TEXT NOT NULL,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN (
    'essay', 'research_paper', 'lab_report', 'case_study',
    'thesis', 'dissertation', 'creative_writing', 'technical_report',
    'literature_review', 'reflection', 'presentation', 'other'
  )),
  subject_area TEXT,
  word_count_target INTEGER,
  due_date TIMESTAMP WITH TIME ZONE,

  -- Content
  submission_content TEXT NOT NULL,
  rubric_content TEXT, -- Optional: paste rubric for requirement matching
  assignment_instructions TEXT, -- Optional: original assignment prompt

  -- CIDI Framework Scores (0-100 each, evidence-based)
  -- Context Score: Does the work provide sufficient background?
  context_score INTEGER CHECK (context_score >= 0 AND context_score <= 100),
  context_evidence JSONB, -- {"strengths": [], "gaps": [], "citations_found": 0}

  -- Integrity Score: Is the argument logically sound?
  integrity_score INTEGER CHECK (integrity_score >= 0 AND integrity_score <= 100),
  integrity_evidence JSONB, -- {"logical_flow": bool, "contradictions": [], "unsupported_claims": []}

  -- Details Score: Are specifics provided with evidence?
  details_score INTEGER CHECK (details_score >= 0 AND details_score <= 100),
  details_evidence JSONB, -- {"specific_examples": 0, "vague_statements": [], "data_points": 0}

  -- Insight Score: Does it show original thinking?
  insight_score INTEGER CHECK (insight_score >= 0 AND insight_score <= 100),
  insight_evidence JSONB, -- {"original_arguments": [], "generic_statements": [], "analysis_depth": "shallow|moderate|deep"}

  -- Overall relevance score (weighted average)
  relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100),

  -- Third-party perspective summary
  third_party_summary TEXT, -- "What a reader would take away from your work"

  -- Requirements analysis (if rubric provided)
  requirements_analysis JSONB, -- {"total": 10, "met": 7, "items": [{req: "", status: "met|partial|missing"}]}

  -- Gap analysis with priority
  gap_analysis JSONB, -- [{"gap": "", "priority": "high|medium|low", "fix_time_minutes": 30, "grade_impact": "+5 to +10"}]

  -- Actionable improvements
  improvements JSONB, -- [{"action": "", "location": "", "effort": "easy|medium|hard", "impact": "high|medium|low"}]

  -- Word and structure stats (factual, no hallucination)
  word_count INTEGER,
  paragraph_count INTEGER,
  sentence_count INTEGER,
  avg_sentence_length NUMERIC(5,1),
  reading_grade_level NUMERIC(4,1), -- Flesch-Kincaid grade level

  -- Source/citation analysis (factual count)
  citation_count INTEGER DEFAULT 0,
  citations_detected JSONB, -- [{text: "", type: "apa|mla|chicago|unknown"}]

  -- Potential issues (evidence-based flags)
  issues JSONB, -- [{type: "repetition|vague|unsupported|tangent", location: "", text: ""}]

  -- Comparison data (for re-audit feature)
  previous_audit_id UUID REFERENCES public.assignment_audits(id),
  score_change INTEGER, -- Difference from previous audit

  -- Metadata
  processing_time_ms INTEGER,
  model_used TEXT DEFAULT 'llama-3.3-70b-versatile',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_assignment_audits_user_id ON public.assignment_audits(user_id);
CREATE INDEX idx_assignment_audits_created_at ON public.assignment_audits(created_at DESC);
CREATE INDEX idx_assignment_audits_assignment_type ON public.assignment_audits(assignment_type);
CREATE INDEX idx_assignment_audits_relevance_score ON public.assignment_audits(relevance_score);

-- Enable RLS
ALTER TABLE public.assignment_audits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own audits" ON public.assignment_audits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audits" ON public.assignment_audits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audits" ON public.assignment_audits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own audits" ON public.assignment_audits
  FOR DELETE USING (auth.uid() = user_id);

-- Update usage table to include assignment_audit feature
-- Note: This requires modifying the CHECK constraint
-- In production, you'd need to drop and recreate the constraint
-- ALTER TABLE public.usage DROP CONSTRAINT usage_feature_check;
-- ALTER TABLE public.usage ADD CONSTRAINT usage_feature_check
--   CHECK (feature IN ('prompt_coach', 'disclosure', 'grammar', 'research', 'plagiarism', 'assignment_audit'));

-- Trigger for updated_at
CREATE TRIGGER update_assignment_audits_updated_at
  BEFORE UPDATE ON public.assignment_audits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Grant permissions
GRANT ALL ON public.assignment_audits TO authenticated;
GRANT SELECT ON public.assignment_audits TO anon;
