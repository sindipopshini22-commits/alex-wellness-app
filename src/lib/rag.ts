// Alex — RAG Retrieval Layer (D5 in architecture).
//
// Retrieves relevant clinical knowledge from the knowledge base to ground
// the conversational model's responses in evidence-based protocols.
//
// Uses a simple but effective approach:
//   1. Tokenize the query into keywords/tags
//   2. Score each knowledge entry by tag overlap + keyword match
//   3. Return top-K entries with relevance scores
//
// Designed to be swappable: can later replace with embedding-based retrieval
// (e.g., Upstash Vector, pgvector) without changing the rest of the system.

import { CLINICAL_KNOWLEDGE_BASE, type KnowledgeEntry } from "./clinicalKnowledge";

// ── Types ──────────────────────────────────────────────────────────────

export interface RetrievedKnowledge {
  entry: KnowledgeEntry;
  relevanceScore: number;
}

export interface RagContext {
  entries: RetrievedKnowledge[];
  /** Concatenated text block to inject into the system prompt */
  contextBlock: string;
}

// ── Keyword Extraction ────────────────────────────────────────────────

// Domain-specific term clusters for better matching
const TERM_CLUSTERS: Record<string, string[]> = {
  // Treatment modalities
  cbt: ["cbt", "cognitive", "behavioral", "thought record", "cognitive restructuring", "automatic thought"],
  act: ["act", "acceptance", "defusion", "commitment", "values", "observing self"],
  ipt: ["ipt", "interpersonal", "role dispute", "role transition", "grief", "bereavement"],
  dbt: ["dbt", "distress tolerance", "tipp", "emotional regulation", "dialectical"],
  mindfulness: ["mindfulness", "grounding", "meditation", "present moment", "awareness"],

  // Conditions
  depression: ["depression", "depressed", "numb", "hopeless", "empty", "anhedonia", "low mood"],
  anxiety: ["anxiety", "anxious", "panic", "panic attack", "worry", "fear", "phobia"],
  psychosis: ["psychosis", "psychotic", "delusion", "hallucination", "paranoid", "voices", "unreal"],
  ptsd: ["ptsd", "trauma", "flashback", "hypervigilance", "nightmare"],
  ocd: ["ocd", "obsessive", "compulsive", "intrusive", "ritual", "checking", "washing"],
  adhd: ["adhd", "attention", "focus", "distract", "hyperactive", "impulsive"],
  substance: ["substance", "alcohol", "drink", "drug", "addiction", "withdrawal", "overdose"],

  // Interventions
  crisis: ["crisis", "suicide", "suicidal", "self-harm", "harm", "c-ssrs", "safety plan", "988"],
  exposure: ["exposure", "hierarchy", "avoidance", "face fear", "graded"],
  activation: ["activation", "behavioral activation", "activity", "scheduling", "micro-action"],

  // Emotions
  anger: ["anger", "angry", "frustrated", "rage", "irritated"],
  grief: ["grief", "loss", "mourning", "bereavement", "sadness"],
  shame: ["shame", "guilt", "worthless", "inadequate", "failure"],
  loneliness: ["lonely", "loneliness", "alone", "isolated", "disconnected"],
};

/** Extract search terms from a query for matching against the knowledge base */
function extractTerms(query: string): Set<string> {
  const lower = query.toLowerCase();
  const terms = new Set<string>();

  // Extract individual words (3+ chars)
  const words = lower.match(/\b[a-z]{3,}\b/g) ?? [];
  for (const w of words) terms.add(w);

  // Extract bigrams
  for (let i = 0; i < words.length - 1; i++) {
    terms.add(words[i] + " " + words[i + 1]);
  }

  // Map query against term clusters
  for (const [cluster, keywords] of Object.entries(TERM_CLUSTERS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        terms.add(cluster);
        break;
      }
    }
  }

  return terms;
}

// ── Relevance Scoring ─────────────────────────────────────────────────

function scoreEntry(entry: KnowledgeEntry, queryTerms: Set<string>, query: string): number {
  const lower = query.toLowerCase();
  let score = 0;

  // Direct title match (highest weight)
  if (entry.title.toLowerCase().includes(lower)) score += 3;
  if (entry.title.toLowerCase().split(" ").some((w: string) => queryTerms.has(w))) score += 1.5;

  // Tag overlap (high weight)
  const tagOverlap = entry.tags.filter(t => {
    const tl = t.toLowerCase();
    return Array.from(queryTerms).some(qt => tl.includes(qt) || qt.includes(tl));
  });
  score += tagOverlap.length * 1.0;    // Category match
    if (queryTerms.has(entry.category.toLowerCase())) score += 2;

    // Modality match
    if (queryTerms.has(entry.modality)) score += 1.5;

  // Content keyword match (lower weight)
  const contentLower = entry.content.toLowerCase();
  let contentHits = 0;
  for (const term of queryTerms) {
    if (term.length >= 3 && contentLower.includes(term)) {
      contentHits++;
    }
  }
  score += contentHits * 0.3;

  // Summary match
  const summaryLower = entry.summary.toLowerCase();
  for (const term of queryTerms) {
    if (term.length >= 3 && summaryLower.includes(term)) {
      score += 0.5;
    }
  }

  return score;
}

// ── Main Retrieval Function ───────────────────────────────────────────

/**
 * Retrieve the most relevant knowledge entries for a given query.
 * Returns top-K entries sorted by relevance score.
 */
export function retrieveKnowledge(query: string, topK: number = 3): RetrievedKnowledge[] {
  if (!query || query.trim().length === 0) return [];

  const queryTerms = extractTerms(query);

  // Score all entries
  const scored = CLINICAL_KNOWLEDGE_BASE.map(entry => ({
    entry,
    relevanceScore: scoreEntry(entry, queryTerms, query),
  }));

  // Filter out zero-scored, sort descending, take top-K
  const results = scored
    .filter(s => s.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK);

  return results;
}

/**
 * Retrieve knowledge and build a context block for injection into the
 * system prompt.
 */
export function buildRagContext(
  query: string,
  topK: number = 3,
  minScore: number = 0.5
): RagContext {
  const entries = retrieveKnowledge(query, topK).filter(e => e.relevanceScore >= minScore);

  if (entries.length === 0) {
    return { entries: [], contextBlock: "" };
  }

  const contextBlock = [
    "\n\n--- RETRIEVED CLINICAL KNOWLEDGE ---",
    "The following evidence-based protocols are relevant to the user's current concern. Use them to ground your response in established techniques.",
    ...entries.map(
      (r, i) =>
        `\n[Knowledge ${i + 1}: ${r.entry.title} (${r.entry.modality.toUpperCase()}, source: ${r.entry.source})]\n${r.entry.content}`
    ),
    "\n--- END OF RETRIEVED KNOWLEDGE ---\n",
  ].join("\n");

  return { entries, contextBlock };
}

/**
 * Quick keyword-based technique suggestion — lighter than full RAG.
 * Returns the IDs of knowledge entries that match broad topic keywords.
 */
export function suggestTechniques(topic: string): string[] {
  const terms = extractTerms(topic);
  return CLINICAL_KNOWLEDGE_BASE
    .filter(e => {
      const tagMatch = e.tags.some(t => Array.from(terms).some(qt => t.includes(qt)));
      const catMatch = terms.has(e.category);
      const modalMatch = terms.has(e.modality);
      return tagMatch || catMatch || modalMatch;
    })
    .map(e => e.id)
    .slice(0, 5);
}
