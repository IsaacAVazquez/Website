// ---------------------------------------------------------------------------
// News Pulse – client-side text analysis utilities
// Sentiment (lexicon-based), topic extraction, and readability scoring.
// No external dependencies.
// ---------------------------------------------------------------------------

export interface NewsArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  category: string;
  source: string;
  sourceName: string;
  sourceColor: string;
}

// ── Sentiment ───────────────────────────────────────────────────────────────

export interface SentimentResult {
  score: number; // -1 … 1
  label: "positive" | "negative" | "neutral";
  positiveCount: number;
  negativeCount: number;
}

const POSITIVE_WORDS = new Set([
  "gain", "growth", "win", "success", "improve", "boost", "surge", "rise",
  "support", "advance", "achieve", "benefit", "celebrate", "create", "discover",
  "earn", "expand", "flourish", "honor", "innovate", "launch", "lead",
  "milestone", "optimism", "progress", "prosper", "rally", "recover", "reform",
  "relief", "resolve", "restore", "reward", "save", "secure", "soar",
  "solution", "strengthen", "thrive", "triumph", "upgrade", "uplift", "victory",
  "breakthrough", "empower", "excel", "hope", "inspire", "peace", "promise",
  "record", "revive", "safe", "stable", "strong", "transform", "unite",
]);

const NEGATIVE_WORDS = new Set([
  "crisis", "fail", "crash", "loss", "decline", "threat", "attack", "war",
  "cut", "fear", "arrest", "ban", "blame", "block", "breach", "cancel",
  "chaos", "collapse", "conflict", "corrupt", "damage", "danger", "dead",
  "death", "defeat", "deficit", "destroy", "disaster", "doubt", "emergency",
  "exploit", "fire", "fraud", "guilty", "hack", "harm", "hate", "hurt",
  "illegal", "injure", "kill", "lawsuit", "layoff", "murder", "poverty",
  "protest", "recession", "reject", "resign", "risk", "scandal", "scam",
  "shoot", "shutdown", "slump", "strike", "struggle", "suffer", "suspect",
  "terror", "toxic", "tragic", "violate", "violence", "warn", "weapon",
]);

export function analyzeSentiment(text: string): SentimentResult {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/);
  let pos = 0;
  let neg = 0;
  for (const w of words) {
    if (POSITIVE_WORDS.has(w)) pos++;
    if (NEGATIVE_WORDS.has(w)) neg++;
  }
  const total = words.length || 1;
  const score = (pos - neg) / total;
  const label =
    score > 0.04 ? "positive" : score < -0.04 ? "negative" : "neutral";
  return { score, label, positiveCount: pos, negativeCount: neg };
}

// ── Topic extraction ────────────────────────────────────────────────────────

export interface TopicCluster {
  topic: string;
  count: number;
  sources: Record<string, number>;
}

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "also", "am",
  "an", "and", "any", "are", "as", "at", "be", "because", "been", "before",
  "being", "below", "between", "both", "but", "by", "can", "come", "could",
  "day", "did", "do", "does", "doing", "don", "down", "during", "each",
  "even", "every", "few", "first", "for", "from", "get", "go", "going",
  "got", "had", "has", "have", "having", "he", "her", "here", "hers",
  "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is",
  "it", "its", "itself", "just", "know", "last", "like", "ll", "long",
  "look", "made", "make", "many", "may", "me", "might", "more", "most",
  "much", "must", "my", "myself", "new", "news", "no", "nor", "not", "now",
  "of", "off", "on", "once", "one", "only", "or", "other", "our", "ours",
  "ourselves", "out", "over", "own", "part", "people", "per", "re", "s",
  "said", "same", "say", "says", "she", "should", "show", "since", "so",
  "some", "still", "such", "t", "take", "tell", "than", "that", "the",
  "their", "theirs", "them", "themselves", "then", "there", "these", "they",
  "this", "those", "through", "time", "to", "too", "under", "until", "up",
  "us", "use", "ve", "very", "want", "was", "way", "we", "well", "were",
  "what", "when", "where", "which", "while", "who", "whom", "why", "will",
  "with", "won", "would", "year", "years", "you", "your", "yours",
  "yourself", "yourselves",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
}

export function extractTopics(
  articles: NewsArticle[],
  maxTopics = 12,
): TopicCluster[] {
  const freq = new Map<string, { count: number; sources: Record<string, number> }>();

  for (const a of articles) {
    const text = `${a.title} ${a.description}`;
    const seen = new Set<string>();
    for (const word of tokenize(text)) {
      if (seen.has(word)) continue;
      seen.add(word);
      const entry = freq.get(word) ?? { count: 0, sources: {} };
      entry.count++;
      entry.sources[a.source] = (entry.sources[a.source] ?? 0) + 1;
      freq.set(word, entry);
    }
  }

  return [...freq.entries()]
    .filter(([, v]) => v.count >= 3 && Object.keys(v.sources).length >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, maxTopics)
    .map(([topic, v]) => ({ topic, count: v.count, sources: v.sources }));
}

// ── Readability ─────────────────────────────────────────────────────────────

export interface ReadabilityResult {
  score: number;
  label: string;
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const vowelGroups = w.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;
  if (w.endsWith("e")) count = Math.max(1, count - 1);
  return count;
}

export function calculateReadingLevel(text: string): ReadabilityResult {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const sentenceCount = Math.max(sentences.length, 1);
  const wordCount = Math.max(words.length, 1);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  // Flesch Reading Ease
  const score =
    206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount);
  const clamped = Math.max(0, Math.min(100, score));

  let label: string;
  if (clamped >= 70) label = "Easy";
  else if (clamped >= 50) label = "Moderate";
  else label = "Advanced";

  return { score: Math.round(clamped), label };
}

// ── Source metadata ─────────────────────────────────────────────────────────

export const SOURCE_META: Record<string, { name: string; color: string }> = {
  atlantic: { name: "The Atlantic", color: "#B22234" },
  nyt: { name: "NYT", color: "#1A1A1A" },
  guardian: { name: "The Guardian", color: "#052962" },
  bbc: { name: "BBC", color: "#BB1919" },
  npr: { name: "NPR", color: "#4A90D9" },
  wapo: { name: "Washington Post", color: "#2E2E2E" },
};
