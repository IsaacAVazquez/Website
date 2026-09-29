/**
 * Cut from the FantasyPros in-season pages as they were served on 2026-09-27,
 * during Week 3. The envelopes and the rows are verbatim apart from the expert
 * id lists, which are trimmed to three, and one rest-of-season note, which is
 * cut short. A real board runs a few hundred rows deep, so every row past the
 * ones printed here is a copy of one of them with its own id, name, and rank.
 */

type FantasyProsRow = Record<string, string | number | null>;

interface FantasyProsEnvelope {
  sport: string;
  type: string;
  ranking_type_name: string;
  year: string;
  week: string;
  position_id: string;
  scoring: string;
  filters: string;
  count: number;
  total_experts: number;
  last_updated: string;
  last_updated_ts: number;
  experts_available: {
    total: number;
    included: number[];
    excluded: number[];
    ineligible: number[];
    last_update: number;
  };
  accessed: string;
}

export type FantasyProsWeeklyPageKind =
  | "qb"
  | "flex-ppr"
  | "flex-half"
  | "flex-std"
  | "ros-ppr";

export interface FantasyProsWeeklyPageOverrides {
  year?: number;
  week?: number;
  /** Unix seconds, the unit FantasyPros publishes last_updated_ts in. */
  lastUpdatedTs?: number;
}

const FLEX_ROWS: FantasyProsRow[] = [
  {"player_id":22968,"player_name":"Jahmyr Gibbs","player_team_id":"DET","player_position_id":"RB","player_positions":"RB","player_short_name":"J. Gibbs","player_eligibility":"RB","player_page_url":"https://www.fantasypros.com/nfl/players/jahmyr-gibbs.php","player_filename":"jahmyr-gibbs.php","player_bye_week":"6","player_owned_avg":99.9,"player_opponent":"vs. NYJ","player_opponent_id":"NYJ","player_game_kickoff_ts":1790528400,"player_game_status":"inprogress","player_ecr_delta":null,"rank_ecr":1,"rank_min":"1","rank_max":"4","rank_ave":"1.29","rank_std":"0.89","note":null,"tag":"start","recommendation":null,"pos_rank":"RB1"},
  {"player_id":23070,"player_name":"Jaxon Smith-Njigba","player_team_id":"SEA","player_position_id":"WR","player_positions":"WR","player_short_name":"J. Smith-Njigba","player_eligibility":"WR","player_page_url":"https://www.fantasypros.com/nfl/players/jaxon-smith-njigba.php","player_filename":"jaxon-smith-njigba.php","player_bye_week":"11","player_owned_avg":99.8,"player_opponent":"at WAS","player_opponent_id":"WAS","player_game_kickoff_ts":1790528400,"player_game_status":"inprogress","player_ecr_delta":null,"rank_ecr":2,"rank_min":"2","rank_max":"9","rank_ave":"2.68","rank_std":"1.14","note":null,"tag":"start","recommendation":null,"pos_rank":"WR1"},
  {"player_id":22936,"player_name":"Trey McBride","player_team_id":"ARI","player_position_id":"TE","player_positions":"TE","player_short_name":"T. McBride","player_eligibility":"TE","player_page_url":"https://www.fantasypros.com/nfl/players/trey-mcbride.php","player_filename":"trey-mcbride.php","player_bye_week":"14","player_owned_avg":99.7,"player_opponent":"at SF","player_opponent_id":"SF","player_game_kickoff_ts":1790539500,"player_game_status":"created","player_ecr_delta":null,"rank_ecr":15,"rank_min":"13","rank_max":"14","rank_ave":"13.90","rank_std":"0.30","note":null,"tag":"start","recommendation":null,"pos_rank":"TE1"},
];

const QB_ROWS: FantasyProsRow[] = [
  {"player_id":17298,"player_name":"Josh Allen","player_team_id":"BUF","player_position_id":"QB","player_positions":"QB","player_short_name":"J. Allen","player_eligibility":"QB","player_page_url":"https://www.fantasypros.com/nfl/players/josh-allen-qb.php","player_filename":"josh-allen-qb.php","player_bye_week":"7","player_owned_avg":99.9,"player_opponent":"vs. LAC","player_opponent_id":"LAC","player_game_kickoff_ts":1790528400,"player_game_status":"inprogress","player_ecr_delta":null,"rank_ecr":1,"rank_min":"1","rank_max":"2","rank_ave":"1.02","rank_std":"0.15","note":null,"tag":"start","recommendation":null,"pos_rank":"QB1","start_sit_grade":"A+","r2p_pts":"24.5"},
  {"player_id":17233,"player_name":"Lamar Jackson","player_team_id":"BAL","player_position_id":"QB","player_positions":"QB","player_short_name":"L. Jackson","player_eligibility":"QB","player_page_url":"https://www.fantasypros.com/nfl/players/lamar-jackson.php","player_filename":"lamar-jackson.php","player_bye_week":"13","player_owned_avg":99.8,"player_opponent":"at DAL","player_opponent_id":"DAL","player_game_kickoff_ts":1790540700,"player_game_status":"created","player_ecr_delta":null,"rank_ecr":2,"rank_min":"1","rank_max":"5","rank_ave":"2.19","rank_std":"0.66","note":null,"tag":"start","recommendation":null,"pos_rank":"QB2","start_sit_grade":"A","r2p_pts":"23.0"},
];

const ROS_ROWS: FantasyProsRow[] = [
  {"player_id":22968,"player_name":"Jahmyr Gibbs","player_team_id":"DET","player_position_id":"RB","player_positions":"RB","player_short_name":"J. Gibbs","player_eligibility":"RB","player_page_url":"https://www.fantasypros.com/nfl/players/jahmyr-gibbs.php","player_filename":"jahmyr-gibbs.php","player_bye_week":"6","player_owned_avg":99.9,"player_ecr_delta":null,"rank_ecr":1,"rank_min":"1","rank_max":"1","rank_ave":"1.00","rank_std":"0.00","note":null,"tag":null,"recommendation":null,"pos_rank":"RB1"},
  {"player_id":19788,"player_name":"Ja'Marr Chase","player_team_id":"CIN","player_position_id":"WR","player_positions":"WR","player_short_name":"J. Chase","player_eligibility":"WR","player_page_url":"https://www.fantasypros.com/nfl/players/jamarr-chase.php","player_filename":"jamarr-chase.php","player_bye_week":"6","player_owned_avg":99.8,"player_ecr_delta":null,"rank_ecr":3,"rank_min":"2","rank_max":"7","rank_ave":"3.50","rank_std":"2.14","note":null,"tag":null,"recommendation":null,"pos_rank":"WR1"},
  {"player_id":17298,"player_name":"Josh Allen","player_team_id":"BUF","player_position_id":"QB","player_positions":"QB","player_short_name":"J. Allen","player_eligibility":"QB","player_page_url":"https://www.fantasypros.com/nfl/players/josh-allen-qb.php","player_filename":"josh-allen-qb.php","player_bye_week":"7","player_owned_avg":99.9,"player_ecr_delta":null,"rank_ecr":24,"rank_min":"25","rank_max":"25","rank_ave":"25.00","rank_std":"0.00","note":"Don't get me wrong, Josh Allen is still ","tag":"sell","recommendation":null,"pos_rank":"QB1"},
];

const PAGES: Record<
  FantasyProsWeeklyPageKind,
  { envelope: FantasyProsEnvelope; rows: FantasyProsRow[] }
> = {
  qb: {
    envelope: {"sport":"NFL","type":"Weekly","ranking_type_name":"weekly","year":"2026","week":"3","position_id":"QB","scoring":"STD","filters":"960,621,1139","count":64,"total_experts":45,"last_updated":"9/27","last_updated_ts":1790528397,"experts_available":{"total":180,"included":[960,621,1139],"excluded":[101,7647,670],"ineligible":[],"last_update":1790528397},"accessed":"2026-09-27 19:03:54"},
    rows: QB_ROWS,
  },
  "flex-ppr": {
    envelope: {"sport":"NFL","type":"Weekly PPR","ranking_type_name":"weekly","year":"2026","week":"3","position_id":"FLX","scoring":"PPR","filters":"1139,285,7666","count":406,"total_experts":43,"last_updated":"9/27","last_updated_ts":1790528378,"experts_available":{"total":172,"included":[1139,285,7666],"excluded":[101,7647,670],"ineligible":[],"last_update":1790528378},"accessed":"2026-09-27 19:04:52"},
    rows: FLEX_ROWS,
  },
  "flex-half": {
    envelope: {"sport":"NFL","type":"Weekly Half PPR","ranking_type_name":"weekly","year":"2026","week":"3","position_id":"FLX","scoring":"HALF","filters":"1139,285,7666","count":402,"total_experts":44,"last_updated":"9/27","last_updated_ts":1790528377,"experts_available":{"total":172,"included":[1139,285,7666],"excluded":[101,7647,670],"ineligible":[],"last_update":1790528377},"accessed":"2026-09-27 19:44:22"},
    rows: FLEX_ROWS,
  },
  "flex-std": {
    envelope: {"sport":"NFL","type":"Weekly","ranking_type_name":"weekly","year":"2026","week":"3","position_id":"FLX","scoring":"STD","filters":"1139,285,7666","count":400,"total_experts":42,"last_updated":"9/27","last_updated_ts":1790528378,"experts_available":{"total":172,"included":[1139,285,7666],"excluded":[101,7647,670],"ineligible":[],"last_update":1790528378},"accessed":"2026-09-27 19:44:12"},
    rows: FLEX_ROWS,
  },
  "ros-ppr": {
    envelope: {"sport":"NFL","type":"ROS PPR","ranking_type_name":"ros","year":"2026","week":"0","position_id":"ALL","scoring":"PPR","filters":"22,1139,1204","count":396,"total_experts":6,"last_updated":"9/24","last_updated_ts":1790278741,"experts_available":{"total":30,"included":[22,1139,1204],"excluded":[7266,5874,1080],"ineligible":[],"last_update":1790278741},"accessed":"2026-09-27 19:05:32"},
    rows: ROS_ROWS,
  },
};

const PAGE_KIND_BY_PATH: Record<string, FantasyProsWeeklyPageKind> = {
  "/nfl/rankings/qb.php": "qb",
  "/nfl/rankings/ppr-flex.php": "flex-ppr",
  "/nfl/rankings/half-point-ppr-flex.php": "flex-half",
  "/nfl/rankings/flex.php": "flex-std",
  "/nfl/rankings/ros-ppr-overall.php": "ros-ppr",
};

function expandRows(rows: FantasyProsRow[], count: number): FantasyProsRow[] {
  const lastPublishedRank = Math.max(...rows.map((row) => Number(row.rank_ecr)));
  return Array.from({ length: count }, (_, index) => {
    if (index < rows.length) return rows[index];
    const template = rows[index % rows.length];
    const rank = lastPublishedRank + 1 + index - rows.length;
    return {
      ...template,
      player_id: 900_000 + index,
      player_name: `${template.player_name} ${index}`,
      rank_ecr: rank,
      rank_min: String(rank),
      rank_max: String(rank + 4),
      rank_ave: (rank + 0.5).toFixed(2),
      pos_rank: `${template.player_position_id}${index + 1}`,
      tag: null,
    };
  });
}

export function fantasyProsWeeklyPage(
  kind: FantasyProsWeeklyPageKind,
  overrides: FantasyProsWeeklyPageOverrides = {}
): string {
  const { envelope, rows } = PAGES[kind];
  const lastUpdatedTs = overrides.lastUpdatedTs ?? envelope.last_updated_ts;
  // The key order is the page's own, with the rows in the middle.
  const { last_updated_ts: _ts, experts_available, accessed, ...head } = envelope;
  const ecrData = {
    ...head,
    year: String(overrides.year ?? envelope.year),
    week: String(overrides.week ?? envelope.week),
    players: expandRows(rows, envelope.count),
    last_updated_ts: lastUpdatedTs,
    experts_available: { ...experts_available, last_update: lastUpdatedTs },
    accessed,
  };

  return `<!DOCTYPE html>
<html lang="en">
  <head><title>Fantasy Football Rankings | FantasyPros</title></head>
  <body>
    <script>
    FP.ready(function () { FPLoader.load({"css":[],"js":["\\/\\/cdn.fantasypros.com\\/assets\\/js\\/min\\/pages\\/launchpad-modal\\/bundle.js"]}});

    var ecrData = ${JSON.stringify(ecrData)};
    var sosData = {"ARI":{"qb_stars":1.9,"rb_stars":3.5,"wr_stars":2.1,"te_stars":1.3,"k_stars":1,"dst_stars":1}};
    </script>
  </body>
</html>
`;
}

/** The page FantasyPros serves at a rankings URL, for a fetch stub to hand back. */
export function fantasyProsWeeklyPageForUrl(
  url: string,
  overrides: FantasyProsWeeklyPageOverrides = {}
): string {
  const kind = PAGE_KIND_BY_PATH[new URL(url).pathname];
  if (!kind) {
    throw new Error(`No FantasyPros fixture page for ${url}.`);
  }
  return fantasyProsWeeklyPage(kind, overrides);
}
