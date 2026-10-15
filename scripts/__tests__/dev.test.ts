/** @jest-environment node */
const { getDevOptions } = require("../dev.cjs");

describe("development server binding", () => {
  it("enables private sync only on the default loopback listener", () => {
    const options = getDevOptions(["--port", "3014"], {});
    expect(options.args).toEqual(["dev", "--webpack", "--hostname", "localhost", "--port", "3014"]);
    expect(options.env.JOB_SEARCH_PRIVATE_SYNC).toBe("1");
  });

  it("keeps private sync off when the caller already turned it off", () => {
    const options = getDevOptions([], { JOB_SEARCH_PRIVATE_SYNC: "0", PORT: "3100" });
    expect(options.env).toMatchObject({ JOB_SEARCH_PRIVATE_SYNC: "0", PORT: "3100" });
  });

  it("resolves localhost to IPv4 first and keeps the caller's Node options", () => {
    expect(getDevOptions([], {}).env.NODE_OPTIONS).toBe("--dns-result-order=ipv4first");
    expect(getDevOptions([], { NODE_OPTIONS: "--max-old-space-size=8192" }).env.NODE_OPTIONS).toBe(
      "--max-old-space-size=8192 --dns-result-order=ipv4first"
    );
  });

  it.each([
    ["--hostname", "0.0.0.0"],
    ["--hostname=0.0.0.0"],
    ["-H", "0.0.0.0"],
    ["-H0.0.0.0"],
  ])("disables private sync for hostname override %p", (...args) => {
    const options = getDevOptions(args, { JOB_SEARCH_PRIVATE_SYNC: "1" });
    expect(options.env.JOB_SEARCH_PRIVATE_SYNC).toBe("0");
  });
});
