export type NewsFeedId = "atlantic" | "nyt" | "guardian" | "bbc" | "npr" | "aljazeera";

export interface NewsFeedDefinition {
  id: NewsFeedId;
  name: string;
  url: string;
  color: string;
}

export const NEWS_FEEDS = [
  {
    id: "atlantic",
    name: "The Atlantic",
    url: "https://www.theatlantic.com/feed/all/",
    color: "#B22234",
  },
  {
    id: "nyt",
    name: "NYT",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    color: "#1A1A1A",
  },
  {
    id: "guardian",
    name: "The Guardian",
    url: "https://www.theguardian.com/world/rss",
    color: "#052962",
  },
  {
    id: "bbc",
    name: "BBC",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    color: "#BB1919",
  },
  {
    id: "npr",
    name: "NPR",
    url: "https://feeds.npr.org/1001/rss.xml",
    color: "#4A90D9",
  },
  {
    id: "aljazeera",
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    color: "#FA9000",
  },
] as const satisfies readonly NewsFeedDefinition[];

export const NEWS_SOURCE_IDS = NEWS_FEEDS.map((feed) => feed.id) as NewsFeedId[];

export const SOURCE_META = Object.fromEntries(
  NEWS_FEEDS.map((feed) => [feed.id, { name: feed.name, color: feed.color }]),
) as Record<NewsFeedId, { name: string; color: string }>;
