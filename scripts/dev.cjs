const { spawn } = require("node:child_process");

function getDevOptions(args, env) {
  // Explicit hostname flags opt out of private file sync, even if the chosen
  // host is loopback. Never inherit an enabled flag into a network preview.
  const hasHostname = args.some((arg) => arg === "--hostname" || arg.startsWith("--hostname=") || arg.startsWith("-H"));
  return {
    args: ["dev", "--webpack", "--hostname", "127.0.0.1", ...args],
    env: { ...env, JOB_SEARCH_PRIVATE_SYNC: hasHostname ? "0" : "1" },
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
