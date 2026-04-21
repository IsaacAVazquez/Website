import {
  NEWS_SOURCE_IDS,
  SOURCE_META,
  type NewsFeedId,
} from "@/lib/news-pulse-sources";

export interface NewsArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  category: string;
  source: NewsFeedId;
  sourceName: string;
  sourceColor: string;
}

export interface SentimentResult {
  score: number;
  label: "positive" | "negative" | "neutral";
  positiveCount: number;
  negativeCount: number;
}

export interface TopicCluster {
  topic: string;
  count: number;
  sources: Partial<Record<NewsFeedId, number>>;
}

export interface ReadabilityResult {
  score: number;
  label: string;
}

export interface StoryCluster {
  id: string;
  label: string;
  totalCount: number;
  representative: NewsArticle;
  sources: Partial<Record<NewsFeedId, number>>;
  articles: NewsArticle[];
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

const CLUSTER_FILLER_WORDS = new Set([
  "analysis", "breaking", "briefing", "exclusive", "explainer", "headline",
  "headlines", "inside", "latest", "live", "morning", "newsletter", "opinion",
  "photo", "photos", "podcast", "report", "reports", "story", "stories",
  "tonight", "today", "update", "updates", "video", "watch",
]);

const OUTLET_FILLER_WORDS = new Set([
  "atlantic", "bbc", "guardian", "npr", "nyt", "post", "washington",
]);

const CLUSTER_MIN_SHARED_TOKENS = 2;
const CLUSTER_MIN_SIMILARITY = 0.2;
const STORY_CLUSTER_STOP_WORDS = new Set([
  ...Array.from(CLUSTER_FILLER_WORDS),
  ...Array.from(OUTLET_FILLER_WORDS),
]);

function normalizeToken(rawToken: string): string {
  let token = rawToken.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
  if (!token) return "";

  if (token.endsWith("'s")) token = token.slice(0, -2);
  if (token.length > 5 && token.endsWith("ies")) {
    token = `${token.slice(0, -3)}y`;
  } else if (
    token.length > 4 &&
    token.endsWith("s") &&
    !token.endsWith("is") &&
    !token.endsWith("ss") &&
    !token.endsWith("us")
  ) {
    token = token.slice(0, -1);
  }

  if (token.length > 5 && token.endsWith("ing")) {
    token = token.slice(0, -3);
  }

  return token;
}

function tokenize(text: string, extraStopWords?: Set<string>): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map(normalizeToken)
    .filter((token) => {
      if (token.length < 4) return false;
      if (STOP_WORDS.has(token)) return false;
      if (extraStopWords?.has(token)) return false;
      return true;
    });
}

function capitalizeWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function countSyllables(word: string): number {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, "");
  if (normalized.length <= 3) return 1;

  const vowelGroups = normalized.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;
  if (normalized.endsWith("e")) count = Math.max(1, count - 1);
  return count;
}

function buildSourceCounts(articles: NewsArticle[]) {
  return articles.reduce<Partial<Record<NewsFeedId, number>>>((counts, article) => {
    counts[article.source] = (counts[article.source] ?? 0) + 1;
    return counts;
  }, {});
}

function sharedTokenCount(left: Set<string>, right: Set<string>): number {
  let overlap = 0;
  left.forEach((token) => {
    if (right.has(token)) overlap++;
  });
  return overlap;
}

function jaccardSimilarity(left: Set<string>, right: Set<string>): number {
  const overlap = sharedTokenCount(left, right);
  const union = left.size + right.size - overlap;
  return union === 0 ? 0 : overlap / union;
}

export function analyzeSentiment(text: string): SentimentResult {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    if (POSITIVE_WORDS.has(word)) positiveCount++;
    if (NEGATIVE_WORDS.has(word)) negativeCount++;
  }

  const total = words.length || 1;
  const score = (positiveCount - negativeCount) / total;
  const label =
    score > 0.04 ? "positive" : score < -0.04 ? "negative" : "neutral";

  return { score, label, positiveCount, negativeCount };
}

export function extractTopics(
  articles: NewsArticle[],
  maxTopics = 12,
): TopicCluster[] {
  const frequency = new Map<string, { count: number; sources: Partial<Record<NewsFeedId, number>> }>();

  for (const article of articles) {
    const seen = new Set<string>();
    for (const token of tokenize(`${article.title} ${article.description}`)) {
      if (seen.has(token)) continue;
      seen.add(token);

      const entry = frequency.get(token) ?? { count: 0, sources: {} };
      entry.count++;
      entry.sources[article.source] = (entry.sources[article.source] ?? 0) + 1;
      frequency.set(token, entry);
    }
  }

  return Array.from(frequency.entries())
    .filter(([, value]) => value.count >= 3 && Object.keys(value.sources).length >= 2)
    .sort((left, right) => right[1].count - left[1].count)
    .slice(0, maxTopics)
    .map(([topic, value]) => ({ topic, count: value.count, sources: value.sources }));
}

export function calculateReadingLevel(text: string): ReadabilityResult {
  const sentences = text.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0);
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  const sentenceCount = Math.max(sentences.length, 1);
  const wordCount = Math.max(words.length, 1);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  const score =
    206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount);
  const clampedScore = Math.max(0, Math.min(100, score));

  let label = "Advanced";
  if (clampedScore >= 70) label = "Easy";
  else if (clampedScore >= 50) label = "Moderate";

  return { score: Math.round(clampedScore), label };
}

export function getOrderedSourcesForArticles(articles: NewsArticle[]): NewsFeedId[] {
  const presentSources = new Set(articles.map((article) => article.source));
  return NEWS_SOURCE_IDS.filter((source) => presentSources.has(source));
}

export function clusterArticlesByStory(
  articles: NewsArticle[],
  maxClusters = 12,
): StoryCluster[] {
  const fingerprints = articles.map((article) => ({
    article,
    tokens: new Set(tokenize(`${article.title} ${article.description}`, STORY_CLUSTER_STOP_WORDS)),
  }));

  const rawClusters: Array<{
    members: typeof fingerprints;
    tokenCounts: Map<string, number>;
  }> = [];

  for (const fingerprint of fingerprints) {
    let bestClusterIndex = -1;
    let bestSimilarity = 0;

    for (let index = 0; index < rawClusters.length; index++) {
      const cluster = rawClusters[index];
      let clusterSimilarity = 0;
      let clusterOverlap = 0;

      for (const member of cluster.members) {
        const overlap = sharedTokenCount(fingerprint.tokens, member.tokens);
        const similarity = jaccardSimilarity(fingerprint.tokens, member.tokens);

        if (similarity > clusterSimilarity) {
          clusterSimilarity = similarity;
          clusterOverlap = overlap;
        }
      }

      if (
        clusterOverlap >= CLUSTER_MIN_SHARED_TOKENS &&
        clusterSimilarity >= CLUSTER_MIN_SIMILARITY &&
        clusterSimilarity > bestSimilarity
      ) {
        bestSimilarity = clusterSimilarity;
        bestClusterIndex = index;
      }
    }

    if (bestClusterIndex === -1) {
      rawClusters.push({
        members: [fingerprint],
        tokenCounts: new Map(Array.from(fingerprint.tokens).map((token) => [token, 1])),
      });
      continue;
    }

    const targetCluster = rawClusters[bestClusterIndex];
    targetCluster.members.push(fingerprint);
    fingerprint.tokens.forEach((token) => {
      targetCluster.tokenCounts.set(token, (targetCluster.tokenCounts.get(token) ?? 0) + 1);
    });
  }

  return rawClusters
    .map((cluster) => {
      const clusteredArticles = cluster.members.map((member) => member.article);
      const representative = clusteredArticles[0];
      const labelTokens = Array.from(cluster.tokenCounts.entries())
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .slice(0, 3)
        .map(([token]) => capitalizeWord(token));

      return {
        id: representative.link,
        label: labelTokens.join(" ") || representative.title,
        totalCount: clusteredArticles.length,
        representative,
        sources: buildSourceCounts(clusteredArticles),
        articles: clusteredArticles,
      };
    })
    .filter((cluster) => Object.keys(cluster.sources).length >= 2)
    .sort((left, right) => right.totalCount - left.totalCount)
    .slice(0, maxClusters);
}

export { SOURCE_META };
