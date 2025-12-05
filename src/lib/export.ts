import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

// Export disclosure as .docx
export async function exportDisclosureToDocx(
  disclosure: string,
  metadata?: {
    title?: string;
    template?: string;
    createdAt?: string;
  }
): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: metadata?.title || "AI Disclosure Statement",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Format: ${metadata?.template || "Generic"}`,
                italics: true,
                size: 20,
              }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated: ${metadata?.createdAt || new Date().toLocaleDateString()}`,
                italics: true,
                size: 20,
              }),
            ],
            spacing: { after: 400 },
          }),
          ...disclosure.split("\n\n").map(
            (paragraph) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: paragraph,
                    size: 24,
                  }),
                ],
                spacing: { after: 200 },
              })
          ),
          new Paragraph({
            children: [
              new TextRun({
                text: "\n\nGenerated with PenBotAI - penbotai.com",
                italics: true,
                size: 18,
                color: "666666",
              }),
            ],
            spacing: { before: 400 },
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// Export disclosure as .txt
export function exportDisclosureToTxt(
  disclosure: string,
  metadata?: {
    title?: string;
    template?: string;
    createdAt?: string;
  }
): Blob {
  const content = `AI DISCLOSURE STATEMENT
========================

Format: ${metadata?.template || "Generic"}
Generated: ${metadata?.createdAt || new Date().toLocaleDateString()}

${disclosure}

---
Generated with PenBotAI - penbotai.com
`;

  return new Blob([content], { type: "text/plain" });
}

// Research paper types
export interface ResearchPaper {
  title: string;
  authors: string[];
  year: number;
  abstract?: string;
  url?: string;
  doi?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
}

// Generate BibTeX citation
export function generateBibTeX(paper: ResearchPaper, id?: string): string {
  const bibId = id || paper.title.split(" ").slice(0, 2).join("").toLowerCase().replace(/[^a-z0-9]/g, '') + paper.year;
  const authors = paper.authors.join(" and ");

  let bibtex = `@article{${bibId},
  title = {${paper.title}},
  author = {${authors}},
  year = {${paper.year}}`;

  if (paper.journal) bibtex += `,\n  journal = {${paper.journal}}`;
  if (paper.volume) bibtex += `,\n  volume = {${paper.volume}}`;
  if (paper.issue) bibtex += `,\n  number = {${paper.issue}}`;
  if (paper.pages) bibtex += `,\n  pages = {${paper.pages}}`;
  if (paper.doi) bibtex += `,\n  doi = {${paper.doi}}`;
  if (paper.url) bibtex += `,\n  url = {${paper.url}}`;

  bibtex += "\n}";

  return bibtex;
}

// Generate APA citation
export function generateAPACitation(paper: ResearchPaper): string {
  const authorStr = formatAuthorsAPA(paper.authors);
  let citation = `${authorStr} (${paper.year}). ${paper.title}.`;

  if (paper.journal) {
    citation += ` *${paper.journal}*`;
    if (paper.volume) citation += `, *${paper.volume}*`;
    if (paper.issue) citation += `(${paper.issue})`;
    if (paper.pages) citation += `, ${paper.pages}`;
    citation += ".";
  }

  if (paper.doi) {
    citation += ` https://doi.org/${paper.doi}`;
  } else if (paper.url) {
    citation += ` ${paper.url}`;
  }

  return citation;
}

// Generate MLA citation
export function generateMLACitation(paper: ResearchPaper): string {
  const authorStr = formatAuthorsMLA(paper.authors);
  let citation = `${authorStr}. "${paper.title}."`;

  if (paper.journal) {
    citation += ` *${paper.journal}*`;
    if (paper.volume) citation += `, vol. ${paper.volume}`;
    if (paper.issue) citation += `, no. ${paper.issue}`;
    citation += `, ${paper.year}`;
    if (paper.pages) citation += `, pp. ${paper.pages}`;
    citation += ".";
  }

  if (paper.doi) {
    citation += ` doi:${paper.doi}.`;
  } else if (paper.url) {
    citation += ` ${paper.url}.`;
  }

  return citation;
}

// Generate Chicago citation
export function generateChicagoCitation(paper: ResearchPaper): string {
  const authorStr = formatAuthorsChicago(paper.authors);
  let citation = `${authorStr}. "${paper.title}."`;

  if (paper.journal) {
    citation += ` *${paper.journal}*`;
    if (paper.volume) citation += ` ${paper.volume}`;
    if (paper.issue) citation += `, no. ${paper.issue}`;
    citation += ` (${paper.year})`;
    if (paper.pages) citation += `: ${paper.pages}`;
    citation += ".";
  }

  if (paper.doi) {
    citation += ` https://doi.org/${paper.doi}.`;
  } else if (paper.url) {
    citation += ` ${paper.url}.`;
  }

  return citation;
}

// Helper: Format authors for APA
function formatAuthorsAPA(authors: string[]): string {
  if (authors.length === 0) return "";
  if (authors.length === 1) return formatSingleAuthorAPA(authors[0]);
  if (authors.length === 2) {
    return `${formatSingleAuthorAPA(authors[0])} & ${formatSingleAuthorAPA(authors[1])}`;
  }
  if (authors.length <= 20) {
    const formatted = authors.slice(0, -1).map(formatSingleAuthorAPA).join(", ");
    return `${formatted}, & ${formatSingleAuthorAPA(authors[authors.length - 1])}`;
  }
  // More than 20 authors
  const first19 = authors.slice(0, 19).map(formatSingleAuthorAPA).join(", ");
  return `${first19}, ... ${formatSingleAuthorAPA(authors[authors.length - 1])}`;
}

function formatSingleAuthorAPA(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0];
  const lastName = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map((p) => `${p[0]}.`).join(" ");
  return `${lastName}, ${initials}`;
}

// Helper: Format authors for MLA
function formatAuthorsMLA(authors: string[]): string {
  if (authors.length === 0) return "";
  if (authors.length === 1) return formatSingleAuthorMLA(authors[0]);
  if (authors.length === 2) {
    return `${formatSingleAuthorMLA(authors[0])}, and ${authors[1]}`;
  }
  return `${formatSingleAuthorMLA(authors[0])}, et al.`;
}

function formatSingleAuthorMLA(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0];
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(" ");
  return `${lastName}, ${firstName}`;
}

// Helper: Format authors for Chicago
function formatAuthorsChicago(authors: string[]): string {
  if (authors.length === 0) return "";
  if (authors.length === 1) return formatSingleAuthorMLA(authors[0]); // Same format
  if (authors.length === 2) {
    return `${formatSingleAuthorMLA(authors[0])} and ${authors[1]}`;
  }
  if (authors.length === 3) {
    return `${formatSingleAuthorMLA(authors[0])}, ${authors[1]}, and ${authors[2]}`;
  }
  return `${formatSingleAuthorMLA(authors[0])} et al.`;
}

// Export multiple papers as BibTeX file
export function exportPapersToBibTeX(papers: ResearchPaper[]): Blob {
  const bibtexEntries = papers.map((paper, index) => generateBibTeX(paper, `ref${index + 1}`));
  const content = bibtexEntries.join("\n\n");
  return new Blob([content], { type: "application/x-bibtex" });
}

// Export papers as JSON for backup
export function exportPapersToJSON(papers: ResearchPaper[]): Blob {
  const content = JSON.stringify(papers, null, 2);
  return new Blob([content], { type: "application/json" });
}

// Download helper
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
