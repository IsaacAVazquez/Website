import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { MetricTooltip } from "@/components/investments/MetricTooltip";

describe("MetricTooltip", () => {
  it("renders an accessible tooltip on focus and closes it on blur", async () => {
    render(<MetricTooltip term="Beta 5Y" />);

    const trigger = screen.getByRole("button", { name: "What is Beta 5Y?" });
    fireEvent.focus(trigger);

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "5-year beta measures volatility relative to the broader market"
    );
    expect(trigger).toHaveAttribute(
      "aria-describedby",
      screen.getByRole("tooltip").getAttribute("id")
    );

    fireEvent.blur(trigger);

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("does not bubble clicks into a surrounding interactive row", () => {
    const onRowClick = jest.fn();

    render(
      <div onClick={onRowClick}>
        <MetricTooltip term="Market Cap" />
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: "What is Market Cap?" }));

    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("finds the definition for a sentence-case label", async () => {
    render(<MetricTooltip term="Gross margin" />);

    fireEvent.focus(screen.getByRole("button", { name: "What is Gross margin?" }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Revenue minus cost of goods sold"
    );
  });

  it("renders nothing when a definition is unavailable", () => {
    const { container } = render(<MetricTooltip term="Unknown metric" />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("MetricTooltip text trigger", () => {
  it("reveals the definition on hover over the label itself, with no icon", async () => {
    render(
      <MetricTooltip term="vs ADP" definition="Market ADP minus the consensus rank.">
        vs ADP
      </MetricTooltip>
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    const trigger = screen.getByText("vs ADP");

    fireEvent.mouseEnter(trigger);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Market ADP minus the consensus rank."
    );

    fireEvent.mouseLeave(trigger);
    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("keeps the trigger out of the tab order so it stays valid inside an aria-hidden header", () => {
    render(
      <MetricTooltip term="Avg" definition="The mean of the contributing expert ranks.">
        Avg
      </MetricTooltip>
    );

    const trigger = screen.getByText("Avg");
    expect(trigger.tagName).toBe("SPAN");
    expect(trigger).not.toHaveAttribute("tabindex");
  });
});

describe("MetricTooltip token scope", () => {
  it("carries the nearest data-tooltip-scope onto the element it portals, so a route's tokens reach the bubble", async () => {
    render(
      <div data-tooltip-scope="ffb-scope">
        <section>
          <MetricTooltip term="Market ADP" definition="Where the market drafts him." />
        </section>
      </div>
    );

    fireEvent.focus(screen.getByRole("button", { name: "What is Market ADP?" }));

    const bubble = await screen.findByRole("tooltip");
    const portalled = bubble.parentElement as HTMLElement;
    await waitFor(() => expect(portalled).toHaveClass("ffb-scope"));
    // The bubble sits outside the scope's own subtree, which is why the class has to travel with it.
    expect(bubble.closest("[data-tooltip-scope]")).toBeNull();
    expect(portalled).toHaveAttribute("data-c97-surface", "paper");
  });

  it("adds no class when nothing above the trigger names a scope, so an Investments tooltip is unchanged", async () => {
    render(<MetricTooltip term="Beta 5Y" />);

    fireEvent.mouseEnter(screen.getByRole("button", { name: "What is Beta 5Y?" }));

    const bubble = await screen.findByRole("tooltip");
    const portalled = bubble.parentElement as HTMLElement;
    await waitFor(() => expect(bubble).toHaveStyle({ opacity: "1" }));
    expect(portalled).not.toHaveAttribute("class");
    expect(portalled).toHaveAttribute("data-c97-surface", "paper");
  });
});

describe("MetricTooltip trigger kinds", () => {
  it("marks the chip and the text trigger, so a route's stylesheet can fit each to its label", () => {
    render(
      <>
        <MetricTooltip term="Market Cap" />
        <MetricTooltip term="vs ADP" definition="Market ADP minus the consensus rank." focusable>
          vs ADP
        </MetricTooltip>
      </>
    );

    expect(screen.getByRole("button", { name: "What is Market Cap?" })).toHaveAttribute("data-metric-trigger", "chip");
    expect(screen.getByRole("button", { name: "What is vs ADP?" })).toHaveAttribute("data-metric-trigger", "text");
  });
});
