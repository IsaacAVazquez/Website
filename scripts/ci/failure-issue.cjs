// One open issue per failure label. A failed run opens it or comments on it,
// and the next successful run comments and closes it. Workflows call this from
// actions/github-script, whose require() resolves paths from the workspace:
//   await require('./scripts/ci/failure-issue.cjs').open({ github, context }, label, title)
//   await require('./scripts/ci/failure-issue.cjs').close({ github, context }, label)

const listOpen = (github, context, label) =>
  github.rest.issues.listForRepo({ ...context.repo, state: "open", labels: label, per_page: 20 });

async function open({ github, context }, label, title, details = "") {
  const today = new Date().toISOString().slice(0, 10);
  const runUrl = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
  const { data } = await listOpen(github, context, label);
  if (data.length > 0) {
    await github.rest.issues.createComment({
      ...context.repo,
      issue_number: data[0].number,
      body: `Failed again on ${today}. Run: ${runUrl}`,
    });
    return;
  }
  const body = [
    `The **${context.workflow}** workflow failed on ${today}.`,
    "",
    `**Run:** ${runUrl}`,
    `**Commit:** ${context.sha}`,
    `**Trigger:** ${context.eventName}`,
    "",
    details || "Check the run logs to diagnose.",
    "",
    "This issue is updated if the next run also fails, and closed on the first successful run.",
  ].join("\n");
  await github.rest.issues.create({ ...context.repo, title: `${title} ${today}`, body, labels: [label, "automation"] });
}

async function close({ github, context }, label) {
  const { data } = await listOpen(github, context, label);
  for (const issue of data) {
    await github.rest.issues.createComment({
      ...context.repo,
      issue_number: issue.number,
      body: `The **${context.workflow}** workflow succeeded at ${new Date().toISOString()}. Closing.`,
    });
    await github.rest.issues.update({ ...context.repo, issue_number: issue.number, state: "closed" });
  }
}

module.exports = { open, close };
