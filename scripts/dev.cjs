const { spawn } = require("node:child_process");

function getDevOptions(args, env) {
  // Explicit hostname flags opt out of private file sync, even if the chosen
  // host is loopback. Never inherit an enabled flag into a network preview,
  // and keep an inherited 0, which is how Playwright starts its server.
  const hasHostname = args.some((arg) => arg === "--hostname" || arg.startsWith("--hostname=") || arg.startsWith("-H"));
  const sync = hasHostname || env.JOB_SEARCH_PRIVATE_SYNC === "0" ? "0" : "1";
  // IPv4 first binds localhost to 127.0.0.1, which every local client reaches.
  const nodeOptions = [env.NODE_OPTIONS, "--dns-result-order=ipv4first"].filter(Boolean).join(" ");
  return {
    // localhost stays on loopback and keeps the browser origin the docs and
    // bookmarks use, so localStorage-backed tools open with their saved data.
    args: ["dev", "--webpack", "--hostname", "localhost", ...args],
    // The page reads the public copy, so the server and the page turn sync on together.
    env: { ...env, JOB_SEARCH_PRIVATE_SYNC: sync, NEXT_PUBLIC_JOB_SEARCH_PRIVATE_SYNC: sync, NODE_OPTIONS: nodeOptions },
  };
}

module.exports = { getDevOptions };

if (require.main === module) {
  const options = getDevOptions(process.argv.slice(2), process.env);
  const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), ...options.args], {
    env: options.env,
    stdio: "inherit",
  });
  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
  child.on("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  child.on("exit", (code, signal) => {
    process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
  });
}
