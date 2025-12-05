// ScholarSync - Advanced Research Assistant Library
// Multi-source academic paper search with AI-powered features

export interface ResearchPaper {
  id: string;
  title: string;
  authors: Author[];
  year: number | null;
  abstract: string;
  venue: string | null;
  citationCount: number;
  referenceCount: number;
  url: string;
  pdfUrl: string | null;
  doi: string | null;
  arxivId: string | null;
  fieldsOfStudy: string[];
  isOpenAccess: boolean;
  citations: {
    apa: string;
    mla: string;
    chicago: string;
    bibtex: string;
    harvard: string;
    ieee: string;
  };
}

export interface Author {
  id: string;
  name: string;
  affiliation?: string;
  paperCount?: number;
  citationCount?: number;
}

export interface SearchFilters {
  yearStart?: number;
  yearEnd?: number;
  fieldsOfStudy?: string[];
  minCitations?: number;
  openAccessOnly?: boolean;
  venue?: string;
}

export interface SearchResult {
  papers: ResearchPaper[];
  total: number;
  offset: number;
  hasMore: boolean;
}

// Fields of study categories
export const FIELDS_OF_STUDY = [
  'Computer Science',
  'Medicine',
  'Biology',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Engineering',
  'Psychology',
  'Economics',
  'Political Science',
  'Sociology',
  'Philosophy',
  'History',
  'Art',
  'Environmental Science',
  'Materials Science',
  'Geology',
  'Geography',
  'Business',
  'Law',
];

// Generate APA citation
function generateAPA(paper: ResearchPaper): string {
  const authors = paper.authors.slice(0, 7).map((a, i) => {
    const parts = a.name.split(' ');
    const lastName = parts.pop() || '';
    const initials = parts.map(p => p[0] + '.').join(' ');
    return i === paper.authors.length - 1 && paper.authors.length > 1
      ? `& ${lastName}, ${initials}`
      : `${lastName}, ${initials}`;
  });

  let authorStr = authors.join(', ');
  if (paper.authors.length > 7) authorStr += ', et al.';

  const year = paper.year ? `(${paper.year})` : '(n.d.)';
  const title = paper.title.endsWith('.') ? paper.title : paper.title + '.';
  const venue = paper.venue ? ` ${paper.venue}.` : '';
  const doi = paper.doi ? ` https://doi.org/${paper.doi}` : '';

  return `${authorStr} ${year}. ${title}${venue}${doi}`;
}

// Generate MLA citation
function generateMLA(paper: ResearchPaper): string {
  const firstAuthor = paper.authors[0];
  if (!firstAuthor) return paper.title;

  const parts = firstAuthor.name.split(' ');
  const lastName = parts.pop() || '';
  const firstName = parts.join(' ');

  let authorStr = `${lastName}, ${firstName}`;
  if (paper.authors.length === 2) {
    authorStr += `, and ${paper.authors[1].name}`;
  } else if (paper.authors.length > 2) {
    authorStr += ', et al.';
  }

  const title = `"${paper.title}"`;
  const venue = paper.venue || 'N.p.';
  const year = paper.year || 'n.d.';

  return `${authorStr}. ${title} ${venue}, ${year}.`;
}

// Generate Chicago citation
function generateChicago(paper: ResearchPaper): string {
  const authors = paper.authors.map((a, i) => {
    if (i === 0) {
      const parts = a.name.split(' ');
      const lastName = parts.pop() || '';
      return `${lastName}, ${parts.join(' ')}`;
    }
    return a.name;
  });

  let authorStr = authors.slice(0, 3).join(', ');
  if (paper.authors.length > 3) authorStr += ', et al.';

  const title = `"${paper.title}"`;
  const venue = paper.venue || '';
  const year = paper.year || 'n.d.';
  const doi = paper.doi ? ` https://doi.org/${paper.doi}.` : '';

  return `${authorStr}. ${title} ${venue} (${year}).${doi}`;
}

// Generate BibTeX citation
function generateBibTeX(paper: ResearchPaper): string {
  const key = paper.authors[0]?.name.split(' ').pop()?.toLowerCase() || 'unknown';
  const year = paper.year || 'nd';
  const citeKey = `${key}${year}`;

  const authors = paper.authors.map(a => a.name).join(' and ');
  const title = paper.title;
  const journalOrVenue = paper.venue || '';

  return `@article{${citeKey},
  author = {${authors}},
  title = {${title}},
  journal = {${journalOrVenue}},
  year = {${paper.year || ''}},
  doi = {${paper.doi || ''}}
}`;
}

// Generate Harvard citation
function generateHarvard(paper: ResearchPaper): string {
  const authors = paper.authors.slice(0, 3).map(a => {
    const parts = a.name.split(' ');
    const lastName = parts.pop() || '';
    const initials = parts.map(p => p[0] + '.').join('');
    return `${lastName}, ${initials}`;
  });

  let authorStr = authors.join(', ');
  if (paper.authors.length > 3) authorStr += ' et al.';

  const year = paper.year || 'n.d.';
  const title = paper.title;
  const venue = paper.venue ? `, ${paper.venue}` : '';

  return `${authorStr} (${year}) '${title}'${venue}.`;
}

// Generate IEEE citation
function generateIEEE(paper: ResearchPaper): string {
  const authors = paper.authors.slice(0, 6).map(a => {
    const parts = a.name.split(' ');
    const lastName = parts.pop() || '';
    const initials = parts.map(p => p[0] + '.').join(' ');
    return `${initials} ${lastName}`;
  });

  let authorStr = authors.join(', ');
  if (paper.authors.length > 6) authorStr += ', et al.';

  const title = `"${paper.title}"`;
  const venue = paper.venue ? ` ${paper.venue}` : '';
  const year = paper.year ? `, ${paper.year}` : '';
  const doi = paper.doi ? ` doi: ${paper.doi}` : '';

  return `${authorStr}, ${title}${venue}${year}.${doi}`;
}

// Transform Semantic Scholar API response to our format
function transformSemanticScholarPaper(data: Record<string, unknown>): ResearchPaper {
  const authors = ((data.authors as Array<{ authorId: string; name: string }>) || []).map(a => ({
    id: a.authorId || '',
    name: a.name || 'Unknown Author',
  }));

  const paper: ResearchPaper = {
    id: (data.paperId as string) || '',
    title: (data.title as string) || 'Untitled',
    authors,
    year: (data.year as number) || null,
    abstract: (data.abstract as string) || 'No abstract available.',
    venue: (data.venue as string) || null,
    citationCount: (data.citationCount as number) || 0,
    referenceCount: (data.referenceCount as number) || 0,
    url: (data.url as string) || `https://www.semanticscholar.org/paper/${data.paperId}`,
    pdfUrl: ((data.openAccessPdf as { url?: string })?.url) || null,
    doi: (data.externalIds as Record<string, string>)?.DOI || null,
    arxivId: (data.externalIds as Record<string, string>)?.ArXiv || null,
    fieldsOfStudy: (data.fieldsOfStudy as string[]) || [],
    isOpenAccess: (data.isOpenAccess as boolean) || false,
    citations: {
      apa: '',
      mla: '',
      chicago: '',
      bibtex: '',
      harvard: '',
      ieee: '',
    },
  };

  // Generate all citation formats
  paper.citations = {
    apa: generateAPA(paper),
    mla: generateMLA(paper),
    chicago: generateChicago(paper),
    bibtex: generateBibTeX(paper),
    harvard: generateHarvard(paper),
    ieee: generateIEEE(paper),
  };

  return paper;
}

// Search papers using Semantic Scholar API
export async function searchPapers(
  query: string,
  filters?: SearchFilters,
  limit = 10,
  offset = 0
): Promise<SearchResult> {
  const fields = [
    'paperId',
    'title',
    'abstract',
    'year',
    'authors',
    'venue',
    'citationCount',
    'referenceCount',
    'url',
    'openAccessPdf',
    'externalIds',
    'fieldsOfStudy',
    'isOpenAccess',
  ].join(',');

  let url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
    query
  )}&limit=${limit}&offset=${offset}&fields=${fields}`;

  // Add year filter
  if (filters?.yearStart || filters?.yearEnd) {
    const start = filters.yearStart || 1900;
    const end = filters.yearEnd || new Date().getFullYear();
    url += `&year=${start}-${end}`;
  }

  // Add fields of study filter
  if (filters?.fieldsOfStudy?.length) {
    url += `&fieldsOfStudy=${filters.fieldsOfStudy.join(',')}`;
  }

  // Add open access filter
  if (filters?.openAccessOnly) {
    url += `&openAccessPdf`;
  }

  // Add venue filter
  if (filters?.venue) {
    url += `&venue=${encodeURIComponent(filters.venue)}`;
  }

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  const data = await response.json();

  let papers = (data.data || []).map(transformSemanticScholarPaper);

  // Apply min citations filter client-side (API doesn't support it)
  if (filters?.minCitations) {
    papers = papers.filter((p: ResearchPaper) => p.citationCount >= (filters.minCitations || 0));
  }

  return {
    papers,
    total: data.total || papers.length,
    offset,
    hasMore: offset + papers.length < (data.total || 0),
  };
}

// Get paper details by ID
export async function getPaperById(paperId: string): Promise<ResearchPaper | null> {
  const fields = [
    'paperId',
    'title',
    'abstract',
    'year',
    'authors',
    'venue',
    'citationCount',
    'referenceCount',
    'url',
    'openAccessPdf',
    'externalIds',
    'fieldsOfStudy',
    'isOpenAccess',
  ].join(',');

  const response = await fetch(
    `https://api.semanticscholar.org/graph/v1/paper/${paperId}?fields=${fields}`
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return transformSemanticScholarPaper(data);
}

// Get paper references
export async function getPaperReferences(
  paperId: string,
  limit = 10
): Promise<ResearchPaper[]> {
  const fields = [
    'paperId',
    'title',
    'abstract',
    'year',
    'authors',
    'venue',
    'citationCount',
  ].join(',');

  const response = await fetch(
    `https://api.semanticscholar.org/graph/v1/paper/${paperId}/references?limit=${limit}&fields=${fields}`
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return (data.data || [])
    .filter((ref: { citedPaper: unknown }) => ref.citedPaper)
    .map((ref: { citedPaper: Record<string, unknown> }) => transformSemanticScholarPaper(ref.citedPaper));
}

// Get papers that cite this paper
export async function getPaperCitations(
  paperId: string,
  limit = 10
): Promise<ResearchPaper[]> {
  const fields = [
    'paperId',
    'title',
    'abstract',
    'year',
    'authors',
    'venue',
    'citationCount',
  ].join(',');

  const response = await fetch(
    `https://api.semanticscholar.org/graph/v1/paper/${paperId}/citations?limit=${limit}&fields=${fields}`
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return (data.data || [])
    .filter((ref: { citingPaper: unknown }) => ref.citingPaper)
    .map((ref: { citingPaper: Record<string, unknown> }) => transformSemanticScholarPaper(ref.citingPaper));
}

// Get author details
export async function getAuthorById(authorId: string): Promise<Author | null> {
  const response = await fetch(
    `https://api.semanticscholar.org/graph/v1/author/${authorId}?fields=name,affiliations,paperCount,citationCount`
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return {
    id: data.authorId,
    name: data.name,
    affiliation: data.affiliations?.[0] || undefined,
    paperCount: data.paperCount,
    citationCount: data.citationCount,
  };
}

// Get author's papers
export async function getAuthorPapers(
  authorId: string,
  limit = 10
): Promise<ResearchPaper[]> {
  const fields = [
    'paperId',
    'title',
    'abstract',
    'year',
    'authors',
    'venue',
    'citationCount',
  ].join(',');

  const response = await fetch(
    `https://api.semanticscholar.org/graph/v1/author/${authorId}/papers?limit=${limit}&fields=${fields}`
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return (data.data || []).map(transformSemanticScholarPaper);
}

// Search papers from arXiv (supplementary source)
export async function searchArxiv(query: string, limit = 10): Promise<ResearchPaper[]> {
  const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
    query
  )}&start=0&max_results=${limit}`;

  const response = await fetch(url);
  if (!response.ok) {
    return [];
  }

  const text = await response.text();
  // Parse XML response (simplified - in production use proper XML parser)
  const papers: ResearchPaper[] = [];

  const entries = text.split('<entry>').slice(1);
  for (const entry of entries) {
    const getTag = (tag: string) => {
      const match = entry.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
      return match ? match[1].trim() : '';
    };

    const id = getTag('id').split('/abs/')[1] || '';
    const title = getTag('title').replace(/\s+/g, ' ');
    const summary = getTag('summary').replace(/\s+/g, ' ');
    const published = getTag('published');

    // Extract authors
    const authorMatches = entry.matchAll(/<author>\s*<name>([^<]+)<\/name>/g);
    const authors = Array.from(authorMatches).map((m, i) => ({
      id: `arxiv-${id}-${i}`,
      name: m[1].trim(),
    }));

    if (id && title) {
      const paper: ResearchPaper = {
        id: `arxiv:${id}`,
        title,
        authors,
        year: published ? new Date(published).getFullYear() : null,
        abstract: summary,
        venue: 'arXiv',
        citationCount: 0,
        referenceCount: 0,
        url: `https://arxiv.org/abs/${id}`,
        pdfUrl: `https://arxiv.org/pdf/${id}.pdf`,
        doi: null,
        arxivId: id,
        fieldsOfStudy: [],
        isOpenAccess: true,
        citations: {
          apa: '',
          mla: '',
          chicago: '',
          bibtex: '',
          harvard: '',
          ieee: '',
        },
      };

      paper.citations = {
        apa: generateAPA(paper),
        mla: generateMLA(paper),
        chicago: generateChicago(paper),
        bibtex: generateBibTeX(paper),
        harvard: generateHarvard(paper),
        ieee: generateIEEE(paper),
      };

      papers.push(paper);
    }
  }

  return papers;
}

// Generate a literature review summary using AI (placeholder - would use Groq API)
export function generateLiteratureReviewPrompt(papers: ResearchPaper[]): string {
  const paperSummaries = papers.map((p, i) =>
    `[${i + 1}] ${p.authors.map(a => a.name).join(', ')} (${p.year || 'n.d.'}): "${p.title}" - ${p.abstract.slice(0, 200)}...`
  ).join('\n\n');

  return `Based on the following academic papers, write a brief literature review summary highlighting key themes, findings, and research gaps:\n\n${paperSummaries}`;
}

// Export all citation formats for a paper
export function exportAllCitations(paper: ResearchPaper): string {
  return `=== ${paper.title} ===

APA:
${paper.citations.apa}

MLA:
${paper.citations.mla}

Chicago:
${paper.citations.chicago}

Harvard:
${paper.citations.harvard}

IEEE:
${paper.citations.ieee}

BibTeX:
${paper.citations.bibtex}
`;
}
