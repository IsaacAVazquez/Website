/**
 * @jest-environment node
 */
import { parseNewsFeed } from "../news-pulse-feed-parser";
import type { NewsFeedDefinition } from "../news-pulse-sources";

const feed = { id: "guardian", name: "The Guardian", url: "https://example.com/rss", color: "#052962" } as NewsFeedDefinition;

function rss(description: string): string {
  return `<?xml version="1.0"?><rss><channel><item><title>Pope visits France</title><link>https://example.com/a</link><description>${description}</description></item></channel></rss>`;
}

describe("parseNewsFeed", () => {
  it("strips markup that a feed sends entity-escaped inside its description", () => {
    const [article] = parseNewsFeed(
      rss("&lt;p&gt;The pope will deliver a &lt;strong&gt;landmark&lt;/strong&gt; speech.&lt;/p&gt;&lt;p&gt;&lt;a href=&quot;https://x.test&quot;&gt;Read more&lt;/a&gt;&lt;/p&gt;"),
      feed,
    );
    expect(article.description).toBe("The pope will deliver a landmark speech. Read more");
  });

  it("strips markup sent inside CDATA", () => {
    const [article] = parseNewsFeed(rss("<![CDATA[<p>Plain <em>text</em> here</p>]]>"), feed);
    expect(article.description).toBe("Plain text here");
  });

  it("keeps a description that only mentions angle brackets as text", () => {
    const [article] = parseNewsFeed(rss("Scores went 3 &lt; 5 overnight"), feed);
    expect(article.description).toBe("Scores went 3 < 5 overnight");
  });
});
