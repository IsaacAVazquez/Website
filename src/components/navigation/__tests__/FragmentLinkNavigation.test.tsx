import { render } from "@testing-library/react";
import { FragmentLinkNavigation } from "../FragmentLinkNavigation";

const CURRENT = "/investments?symbol=V&section=chart";
const STALE = "http://localhost/investments?view=research&symbol=V&section=chart";

function renderLink(attributes: Record<string, string> = {}, href = "#research-section") {
  const { container } = render(
    <>
      <FragmentLinkNavigation />
      <a href={href} {...attributes}>
        <span>Research</span>
      </a>
    </>,
  );
  return container.querySelector("a") as HTMLAnchorElement;
}

function click(target: Element, init: MouseEventInit = {}) {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init });
  target.dispatchEvent(event);
  return event;
}

describe("FragmentLinkNavigation", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", CURRENT);
  });

  // Firefox can hold a link's address from before the page rewrote its own
  // URL, and following that address loads the old URL as a new document.
  it("follows a fragment link from the page's current address, not the link's resolved one", () => {
    const link = renderLink();
    Object.defineProperty(link, "href", { get: () => `${STALE}#research-section` });

    const event = click(link);

    expect(event.defaultPrevented).toBe(true);
    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe(
      `${CURRENT}#research-section`,
    );
  });

  it("handles a click that lands on an element inside the link", () => {
    const link = renderLink();

    const event = click(link.querySelector("span") as HTMLSpanElement);

    expect(event.defaultPrevented).toBe(true);
    expect(window.location.hash).toBe("#research-section");
  });

  it.each([
    ["a command click", { metaKey: true }],
    ["a control click", { ctrlKey: true }],
    ["a shift click", { shiftKey: true }],
    ["an option click", { altKey: true }],
    ["a middle click", { button: 1 }],
  ])("leaves %s to the browser", (_name, init) => {
    const event = click(renderLink(), init);

    expect(event.defaultPrevented).toBe(false);
    expect(window.location.hash).toBe("");
  });

  it.each([
    ["opens in another tab", { target: "_blank" }],
    ["downloads", { download: "" }],
  ])("leaves a link that %s to the browser", (_name, attributes) => {
    const event = click(renderLink(attributes));

    expect(event.defaultPrevented).toBe(false);
    expect(window.location.hash).toBe("");
  });

  it("leaves a link to another page alone", () => {
    const event = click(renderLink({}, "/dashboards#fintech"));

    expect(event.defaultPrevented).toBe(false);
    expect(window.location.hash).toBe("");
  });

  it("stays out of a click another handler already took", () => {
    const link = renderLink();
    link.addEventListener("click", (event) => event.preventDefault());

    click(link);

    expect(window.location.hash).toBe("");
  });

  it("stops listening once it unmounts", () => {
    const { container, rerender } = render(
      <>
        <FragmentLinkNavigation />
        <a href="#research-section">Research</a>
      </>,
    );
    rerender(<a href="#research-section">Research</a>);

    const event = click(container.querySelector("a") as HTMLAnchorElement);

    expect(event.defaultPrevented).toBe(false);
  });
});
