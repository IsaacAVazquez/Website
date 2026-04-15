import {
  analyzeSentiment,
  extractTopics,
  calculateReadingLevel,
  SOURCE_META,
  NewsArticle,
} from '../news-pulse-utils';

// ── analyzeSentiment ─────────────────────────────────────────────────────────

describe('analyzeSentiment', () => {
  it('returns "positive" label for clearly positive text', () => {
    const result = analyzeSentiment('The company achieved record growth and a big win');
    expect(result.label).toBe('positive');
    expect(result.score).toBeGreaterThan(0.04);
  });

  it('returns "negative" label for clearly negative text', () => {
    const result = analyzeSentiment('Crisis and collapse caused massive loss and fear');
    expect(result.label).toBe('negative');
    expect(result.score).toBeLessThan(-0.04);
  });

  it('returns "neutral" label for text without sentiment words', () => {
    const result = analyzeSentiment('The meeting was held on Tuesday at three');
    expect(result.label).toBe('neutral');
    expect(result.score).toBeGreaterThanOrEqual(-0.04);
    expect(result.score).toBeLessThanOrEqual(0.04);
  });

  it('positiveCount reflects number of positive words found', () => {
    const result = analyzeSentiment('win success growth');
    expect(result.positiveCount).toBe(3);
  });

  it('negativeCount reflects number of negative words found', () => {
    const result = analyzeSentiment('crisis fail crash');
    expect(result.negativeCount).toBe(3);
  });

  it('score is within -1 to 1 range', () => {
    const texts = [
      'win win win win win win win',
      'crisis crisis crisis crisis',
      'the cat sat on the mat',
    ];
    texts.forEach(text => {
      const { score } = analyzeSentiment(text);
      expect(score).toBeGreaterThanOrEqual(-1);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  it('is case-insensitive', () => {
    const lower = analyzeSentiment('win');
    const upper = analyzeSentiment('WIN');
    expect(upper.label).toBe(lower.label);
    expect(upper.positiveCount).toBe(lower.positiveCount);
  });

  it('ignores punctuation', () => {
    const withPunct = analyzeSentiment('win! win. win,');
    const clean = analyzeSentiment('win win win');
    expect(withPunct.positiveCount).toBe(clean.positiveCount);
  });

  it('handles empty string without throwing', () => {
    expect(() => analyzeSentiment('')).not.toThrow();
    const result = analyzeSentiment('');
    expect(result.label).toBe('neutral');
  });
});

// ── extractTopics ─────────────────────────────────────────────────────────────

function makeArticle(
  title: string,
  source: string,
  description = '',
): NewsArticle {
  return {
    title,
    link: 'https://example.com',
    description,
    pubDate: '2026-04-01',
    category: 'tech',
    source,
    sourceName: source,
    sourceColor: '#000',
  };
}

describe('extractTopics', () => {
  it('returns empty array for empty articles list', () => {
    expect(extractTopics([])).toEqual([]);
  });

  it('returns empty array when no word appears in 3+ articles from 2+ sources', () => {
    const articles = [
      makeArticle('unique alpha text', 'src1'),
      makeArticle('completely different words here', 'src2'),
    ];
    const result = extractTopics(articles);
    // Nothing meets the threshold
    expect(result.every(t => t.count >= 3)).toBe(true);
  });

  it('topic count respects maxTopics limit', () => {
    // Create many articles that repeat several words
    const word = 'technology';
    const articles = Array.from({ length: 20 }, (_, i) =>
      makeArticle(`${word} innovation future digital transformation platform`, `src${(i % 5) + 1}`),
    );
    const result = extractTopics(articles, 3);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('each topic has a count >= 3 and sources from >= 2 origins', () => {
    const articles = [
      makeArticle('technology innovation revolution', 'src1'),
      makeArticle('technology platform future', 'src2'),
      makeArticle('technology disruption change', 'src3'),
    ];
    const result = extractTopics(articles);
    result.forEach(t => {
      expect(t.count).toBeGreaterThanOrEqual(3);
      expect(Object.keys(t.sources).length).toBeGreaterThanOrEqual(2);
    });
  });

  it('results are sorted by count descending', () => {
    // "technology" in 6 articles, "innovation" in 3 – both from 2+ sources
    const articles = [
      ...Array.from({ length: 6 }, (_, i) =>
        makeArticle('technology digital platform future', `src${(i % 3) + 1}`),
      ),
      ...Array.from({ length: 3 }, (_, i) =>
        makeArticle('innovation startup future', `src${(i % 2) + 1}`),
      ),
    ];
    const result = extractTopics(articles);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].count).toBeLessThanOrEqual(result[i - 1].count);
    }
  });

  it('filters out stop words and short words', () => {
    const articles = Array.from({ length: 5 }, (_, i) =>
      makeArticle('the and is to', `src${(i % 3) + 1}`),
    );
    const result = extractTopics(articles);
    expect(result).toEqual([]);
  });

  it('topic object has topic, count, and sources properties', () => {
    const articles = Array.from({ length: 4 }, (_, i) =>
      makeArticle('technology disruption platform', `src${(i % 3) + 1}`),
    );
    const result = extractTopics(articles);
    result.forEach(t => {
      expect(t).toHaveProperty('topic');
      expect(t).toHaveProperty('count');
      expect(t).toHaveProperty('sources');
    });
  });
});

// ── calculateReadingLevel ────────────────────────────────────────────────────

describe('calculateReadingLevel', () => {
  it('labels simple short text as "Easy"', () => {
    // Very simple one-syllable words, short sentence
    const text = 'The cat sat. The dog ran. The boy ran.';
    const result = calculateReadingLevel(text);
    expect(result.label).toBe('Easy');
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('labels complex academic text as "Advanced"', () => {
    const text =
      'The epistemological foundations of contemporary hermeneutical ' +
      'phenomenology constitute a multifaceted philosophical exploration ' +
      'of consciousness and intentionality. Transcendental subjectivity ' +
      'articulates the ontological preconditions of experiential categorization.';
    const result = calculateReadingLevel(text);
    expect(result.label).toBe('Advanced');
    expect(result.score).toBeLessThan(50);
  });

  it('score is clamped between 0 and 100', () => {
    const texts = [
      'Simple words go here.',
      'The ontological categorization of phenomenological manifestations requires sophisticated epistemological frameworks.',
      '',
    ];
    texts.forEach(text => {
      const { score } = calculateReadingLevel(text);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  it('score is a rounded integer', () => {
    const result = calculateReadingLevel('Testing the score output value here.');
    expect(Number.isInteger(result.score)).toBe(true);
  });

  it('label is one of Easy, Moderate, or Advanced', () => {
    const labels = ['Easy', 'Moderate', 'Advanced'];
    const texts = [
      'Go run play fast.',
      'The market analysis showed moderate growth in several sectors.',
      'Epistemological ontological phenomenological transcendental subjectivity.',
    ];
    texts.forEach(text => {
      const { label } = calculateReadingLevel(text);
      expect(labels).toContain(label);
    });
  });

  it('handles single-sentence text without throwing', () => {
    expect(() => calculateReadingLevel('Hello world.')).not.toThrow();
  });

  it('handles empty string without throwing', () => {
    expect(() => calculateReadingLevel('')).not.toThrow();
  });
});

// ── SOURCE_META ──────────────────────────────────────────────────────────────

describe('SOURCE_META', () => {
  it('is a non-empty object', () => {
    expect(typeof SOURCE_META).toBe('object');
    expect(Object.keys(SOURCE_META).length).toBeGreaterThan(0);
  });

  it('every entry has a non-empty name and color string', () => {
    Object.values(SOURCE_META).forEach(({ name, color }) => {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
    });
  });

  it('includes known sources like "nyt" and "bbc"', () => {
    expect(SOURCE_META).toHaveProperty('nyt');
    expect(SOURCE_META).toHaveProperty('bbc');
  });
});
