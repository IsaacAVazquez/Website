/**
 * Security tests for the admin CredentialsProvider authorize() logic.
 *
 * These lock in two hardening guarantees:
 *  1. Fail-closed when ADMIN_USERNAME / ADMIN_PASSWORD are not configured
 *     (no "undefined === undefined" bypass).
 *  2. Only the exact configured username + password authenticate.
 */

type AuthorizeFn = (
  credentials: Record<string, string> | undefined
) => Promise<unknown>;

function loadAuthorize(): AuthorizeFn {
  // Re-require with a fresh module registry so env changes take effect.
  let authOptions: import("next-auth").NextAuthOptions;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ authOptions } = require("../auth"));
  });
  // next-auth v4's CredentialsProvider returns a default config whose top-level
  // `authorize` is a `() => null` stub; the real user-supplied function lives in
  // `options.authorize` and is what next-auth invokes at runtime. Prefer it.
  const provider = authOptions!.providers[0] as unknown as {
    authorize?: AuthorizeFn;
    options?: { authorize?: AuthorizeFn };
  };
  const authorize = provider.options?.authorize ?? provider.authorize;
  if (!authorize) {
    throw new Error("Could not locate credentials authorize()");
  }
  return authorize;
}

describe("admin credentials authorize()", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("fails closed when admin credentials are not configured", async () => {
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
    const authorize = loadAuthorize();

    // Empty credentials must NOT authenticate (the old code returned a user
    // here via undefined === undefined).
    expect(await authorize({ username: "", password: "" })).toBeNull();
    expect(await authorize(undefined)).toBeNull();
    expect(
      await authorize({ username: "anything", password: "anything" })
    ).toBeNull();
  });

  it("rejects wrong credentials when configured", async () => {
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "s3cret";
    const authorize = loadAuthorize();

    expect(await authorize({ username: "admin", password: "wrong" })).toBeNull();
    expect(await authorize({ username: "nope", password: "s3cret" })).toBeNull();
    expect(await authorize({ username: "", password: "" })).toBeNull();
  });

  it("accepts the exact configured username and password", async () => {
    process.env.ADMIN_USERNAME = "admin";
    process.env.ADMIN_PASSWORD = "s3cret";
    const authorize = loadAuthorize();

    const user = await authorize({ username: "admin", password: "s3cret" });
    expect(user).toMatchObject({ id: "1", name: "Admin" });
  });
});
