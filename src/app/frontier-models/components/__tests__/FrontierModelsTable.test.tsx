import { fireEvent, render, screen, within } from "@testing-library/react";
import { FrontierModelsTable } from "../FrontierModelsTable";
import { MODELS } from "./fixtures/models";

function rowNames() {
  const body = screen.getAllByRole("rowgroup")[1];
  return within(body)
    .getAllByRole("button", { expanded: false })
    .map((button) => button.textContent);
}

function header(name: RegExp) {
  return screen.getByRole("columnheader", { name });
}

describe("FrontierModelsTable", () => {
  it("sorts newest first by default and marks the release column", () => {
    render(<FrontierModelsTable models={MODELS} selectedModelId={null} onSelectModel={jest.fn()} />);

    expect(rowNames()).toEqual(["Alpha", "Charlie", "Bravo"]);
    expect(header(/released/i)).toHaveAttribute("aria-sort", "descending");
    expect(header(/^model/i)).toHaveAttribute("aria-sort", "none");

    fireEvent.click(within(header(/released/i)).getByRole("button"));
    expect(rowNames()).toEqual(["Bravo", "Charlie", "Alpha"]);
    expect(header(/released/i)).toHaveAttribute("aria-sort", "ascending");
  });

  it("switches column with its default direction and flips on a second click", () => {
    render(<FrontierModelsTable models={MODELS} selectedModelId={null} onSelectModel={jest.fn()} />);

    fireEvent.click(within(header(/^model/i)).getByRole("button"));
    expect(rowNames()).toEqual(["Alpha", "Bravo", "Charlie"]);
    expect(header(/^model/i)).toHaveAttribute("aria-sort", "ascending");
    expect(header(/released/i)).toHaveAttribute("aria-sort", "none");

    fireEvent.click(within(header(/^model/i)).getByRole("button"));
    expect(rowNames()).toEqual(["Charlie", "Bravo", "Alpha"]);
    expect(header(/^model/i)).toHaveAttribute("aria-sort", "descending");

    fireEvent.click(within(header(/context/i)).getByRole("button"));
    expect(rowNames()).toEqual(["Charlie", "Alpha", "Bravo"]);

    // Input price sorts cheapest first and a missing price sinks to the bottom.
    fireEvent.click(within(header(/input/i)).getByRole("button"));
    expect(rowNames()).toEqual(["Alpha", "Charlie", "Bravo"]);

    fireEvent.click(within(header(/output/i)).getByRole("button"));
    expect(rowNames()).toEqual(["Bravo", "Alpha", "Charlie"]);
  });

  it("prints formatted context, prices, modalities, and the reasoning badge", () => {
    render(<FrontierModelsTable models={MODELS} selectedModelId={null} onSelectModel={jest.fn()} />);

    const alphaRow = screen.getByRole("button", { name: "Alpha" }).closest("tr") as HTMLElement;
    expect(within(alphaRow).getByText("1M")).toBeInTheDocument();
    expect(within(alphaRow).getByText("$1.25")).toBeInTheDocument();
    expect(within(alphaRow).getByText("$10")).toBeInTheDocument();
    expect(within(alphaRow).getByText("Reasoning")).toBeInTheDocument();
    expect(within(alphaRow).getByText("Mar 2026")).toBeInTheDocument();

    const bravoRow = screen.getByRole("button", { name: "Bravo" }).closest("tr") as HTMLElement;
    expect(within(bravoRow).getByText("128K")).toBeInTheDocument();
    expect(within(bravoRow).getByText("—")).toBeInTheDocument();
    expect(within(bravoRow).getByText("$0.40")).toBeInTheDocument();
    expect(within(bravoRow).getByText("Audio")).toBeInTheDocument();
    expect(within(bravoRow).queryByText("Reasoning")).toBeNull();
  });

  it("asks to open a row from the name button or a row click, and to close an open one", () => {
    const onSelect = jest.fn();
    const { rerender } = render(
      <FrontierModelsTable models={MODELS} selectedModelId={null} onSelectModel={onSelect} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Charlie" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenLastCalledWith("charlie");

    fireEvent.click(screen.getByText("2M").closest("tr") as HTMLElement);
    expect(onSelect).toHaveBeenLastCalledWith("charlie");

    rerender(<FrontierModelsTable models={MODELS} selectedModelId="charlie" onSelectModel={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Charlie" }));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("shows the detail row with docs link for the selected model", () => {
    render(<FrontierModelsTable models={MODELS} selectedModelId="alpha" onSelectModel={jest.fn()} />);

    const toggle = screen.getByRole("button", { name: "Alpha" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const detail = document.getElementById(toggle.getAttribute("aria-controls") as string) as HTMLElement;
    expect(detail).not.toBeNull();
    expect(within(detail).getByText("Alpha editorial note.")).toBeInTheDocument();
    expect(within(detail).getByText("64K tokens")).toBeInTheDocument();
    expect(within(detail).getByText("2025-10")).toBeInTheDocument();
    expect(within(detail).getByRole("link", { name: /provider docs/i })).toHaveAttribute(
      "href",
      "https://example.com/alpha"
    );
    expect(screen.queryByText("Bravo editorial note.")).toBeNull();
  });

  it("falls back when max output, cutoff, and docs are missing", () => {
    render(<FrontierModelsTable models={MODELS} selectedModelId="bravo" onSelectModel={jest.fn()} />);

    const toggle = screen.getByRole("button", { name: "Bravo" });
    const detail = document.getElementById(toggle.getAttribute("aria-controls") as string) as HTMLElement;
    expect(within(detail).getByText("Not published")).toBeInTheDocument();
    expect(within(detail).getByText("—")).toBeInTheDocument();
    expect(within(detail).queryByRole("link")).toBeNull();
    expect(screen.getByRole("button", { name: "Alpha" })).not.toHaveAttribute("aria-controls");
  });
});
