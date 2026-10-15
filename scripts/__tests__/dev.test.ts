/** @jest-environment node */
const { getDevOptions } = require("../dev.cjs");

describe("development server binding", () => {
  it("enables private sync only on the default loopback listener", () => {
    const options = getDevOptions(["--port", "3014"], {});
    expect(options.args).toEqual(["dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3014"]);
    expect(options.env.JOB_SEARCH_PRIVATE_SYNC).toBe("1");
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
