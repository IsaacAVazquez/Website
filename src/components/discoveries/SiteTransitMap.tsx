import Link from "next/link";
import styles from "./discoveries.module.css";

const LINES = [
  { id: "sports", name: "The Sports Line", note: "Frequent service. Occasional overtime.", stations: [
    ["/dashboards", "Dashboard Junction"], ["/fantasy-football", "Fantasy Football"], ["/nfl", "NFL"],
    ["/nba", "NBA"], ["/mlb", "MLB"], ["/premier-league", "Premier League"], ["/formula-1", "Formula 1"],
  ] },
  { id: "saturday", name: "The Saturday Line", note: "All stops worth getting off for.", stations: [
    ["/dashboards", "Dashboard Junction"], ["/museum-log", "Museum Log"], ["/food-map", "Food Map"],
    ["/wine-cellar", "Wine Cellar"], ["/recipe-finder", "Recipe Finder"], ["/travel", "Travel"],
  ] },
  { id: "orbit", name: "The Orbital Extension", note: "The train becomes a rocket after the last transfer.", stations: [
    ["/dashboards", "Dashboard Junction"], ["/bay-area-transit", "Bay Area Transit"], ["/earthquake-pulse", "Earthquake Pulse"],
    ["/spacex-mission-control", "Mission Control"],
  ] },
];

export function SiteTransitMap() {
  return <div className={styles.map}>
    {LINES.map((line) => <section key={line.id} className={styles.line} data-line={line.id} aria-label={line.name}>
      <h2>{line.name}</h2><p>{line.note}</p>
      <ol className={styles.stations}>{line.stations.map(([href, name]) => <li key={href}>
        <Link className={styles.station} href={href}>{name}</Link>
      </li>)}</ol>
    </section>)}
    <p className={styles.note}>Fictional railway. Actual destinations. Transfer between every line at Dashboard Junction.</p>
  </div>;
}
