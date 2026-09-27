import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { useClientNow } from "../useClientNow";

function Stamp() {
  const now = useClientNow();
  return <p>{now === null ? "pending" : `at ${now}`}</p>;
}

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("useClientNow", () => {
  it("is null on the server, so time-relative text is never baked into the HTML", () => {
    expect(renderToString(<Stamp />)).toBe("<p>pending</p>");
  });

  it("hydrates without a mismatch and then reads the client clock", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Stamp />);
    document.body.appendChild(container);
    const errors = jest.spyOn(console, "error").mockImplementation(() => {});
    const recoverable: unknown[] = [];

    await act(async () => {
      hydrateRoot(container, <Stamp />, { onRecoverableError: (error) => recoverable.push(error) });
    });

    expect(recoverable).toEqual([]);
    expect(errors).not.toHaveBeenCalled();
    expect(container.textContent).toMatch(/^at \d+$/);
    expect(Number(container.textContent?.slice(3)) % 60_000).toBe(0);
    errors.mockRestore();
    container.remove();
  });
});
