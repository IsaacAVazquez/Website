import { execFileSync } from "node:child_process";

/** One key of the Next config as a production build sees it. */
function loadProductionConfig<T>(expression: string): T {
  const script = [
    "import config from './next.config.mjs';",
    `process.stdout.write(JSON.stringify(${expression}));`,
  ].join("");

  return JSON.parse(
    execFileSync(process.execPath, ["--input-type=module", "--eval", script], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, NODE_ENV: "production" },
    })
  ) as T;
}

describe("build config", () => {
  // `removeConsole: true` strips console.error from server code as well as
  // client code. It left logger.error with an empty body, so a failing API
  // route on Netlify wrote nothing to the function log.
  it("keeps console.error and console.warn in production builds", () => {
    const compiler = loadProductionConfig<{ removeConsole?: unknown }>("config.compiler");
    expect(compiler.removeConsole).toEqual({ exclude: ["error", "warn"] });
  });
});
