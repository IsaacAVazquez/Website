import { schedule } from "@netlify/functions";

const handler = schedule("0 8 * * 3", async () => {
  console.log("Fantasy Netlify scheduler is retired for the public product.");

  return {
    statusCode: 410,
    body: JSON.stringify({
      status: "deprecated",
      message:
        "Public fantasy snapshots now update through the GitHub Actions fantasy snapshot workflow.",
    }),
  };
});

export { handler };
