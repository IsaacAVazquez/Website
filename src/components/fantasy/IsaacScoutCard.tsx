"use client";

export function IsaacScoutCard({ onLeave }: { onLeave: () => void }) {
  return <section className="ffb-empty ffb-rk-scout" aria-label="Isaac's novelty scouting report">
    <p className="ffb-label">Unranked prospect · Novelty card</p>
    <h2 className="ffb-h2">Isaac Vazquez</h2>
    <dl className="ffb-facts ffb-facts-sm">
      <div className="ffb-fact"><dt>Position</dt><dd>Spreadsheet specialist</dd></div>
      <div className="ffb-fact"><dt>Strengths</dt><dd>Will research the backup&apos;s backup</dd></div>
      <div className="ffb-fact"><dt>Weaknesses</dt><dd>Still researching when the pick clock runs out</dd></div>
      <div className="ffb-fact"><dt>Designation</dt><dd>Questionable, MBA workload</dd></div>
      <div className="ffb-fact"><dt>Draft outlook</dt><dd>Likely to build his own rankings tool</dd></div>
    </dl>
    <p className="ffb-method">A scouting report for the person who built the board. No NFL roster spot, ADP, or actual ranking.</p>
    <button type="button" className="ffb-btn" onClick={onLeave}>Leave on waivers</button>
  </section>;
}
