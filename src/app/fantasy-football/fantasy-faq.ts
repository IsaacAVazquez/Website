export const FANTASY_FOOTBALL_FAQ = [
  {
    question: "How often are the fantasy rankings updated?",
    answer:
      "The rankings show when FantasyPros last updated its consensus rankings and when this site last published the snapshot.",
  },
  {
    question: "Can I view overall and position-only rankings?",
    answer:
      "Yes. Use the Overall view or a position filter. If FantasyPros does not publish a scoring and position combination, the page labels it unavailable instead of filling it with a different ranking.",
  },
  {
    question: "Does the draft tracker use the same rankings data?",
    answer:
      "Yes. The draft tracker and rankings board read the same published snapshot, so the ranks stay aligned.",
  },
  {
    question: "What do the tiers and cliff lines mean?",
    answer:
      "Tiers group players the expert consensus treats as close in value, and the dashed cliff lines mark where the average rank drops sharply from one tier to the next. The bigger the drop, the more space the board leaves before the next tier, so the gaps themselves show where the board falls off.",
  },
  {
    question: "What do the Value and Reach labels mean?",
    answer:
      "They compare a player's consensus rank with market ADP. Value means rooms usually let the player fall past the consensus rank, and Reach means rooms take the player earlier than the experts would. The labels hide when the ADP source is stale or the mock-draft sample is too thin to trust.",
  },
  {
    question: "How does the queue work?",
    answer:
      "The star on each row adds a player to a queue saved in your browser, and the Queued toggle filters the board down to those players. The queue stays on your device, so it never uploads or shares anything.",
  },
] as const;
