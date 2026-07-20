import { readDurableJson, writeDurableJson } from "@/lib/durableJsonCache";

describe("durableJsonCache outside Netlify", () => {
  it("is a safe no-op in local and test runtimes", async () => {
    const originalNetlify = process.env.NETLIFY;
    const originalLocal = process.env.NETLIFY_LOCAL;
    delete process.env.NETLIFY;
    delete process.env.NETLIFY_LOCAL;

    await expect(readDurableJson("test/key", 1_000)).resolves.toBeNull();
    await expect(writeDurableJson("test/key", { ok: true })).resolves.toBeUndefined();

    if (originalNetlify === undefined) delete process.env.NETLIFY;
    else process.env.NETLIFY = originalNetlify;
    if (originalLocal === undefined) delete process.env.NETLIFY_LOCAL;
    else process.env.NETLIFY_LOCAL = originalLocal;
  });
});
