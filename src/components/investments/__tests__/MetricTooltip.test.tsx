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
