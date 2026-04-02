import { render, screen } from "@testing-library/react";
import { SearchInterfaceClient } from "../SearchInterface.client";

type SearchInterfaceProps = {
  initialQuery?: string;
  initialType?: string;
  initialCategory?: string;
};

const mockRenderedSearchInterface = jest.fn<void, [SearchInterfaceProps]>();
const mockGet = jest.fn();
const mockToString = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockGet,
    toString: mockToString,
  }),
}));

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    return (props: SearchInterfaceProps) => {
      mockRenderedSearchInterface(props);
      return <div data-testid="search-interface" />;
    };
  },
}));

describe("SearchInterfaceClient", () => {
  beforeEach(() => {
    mockRenderedSearchInterface.mockReset();
    mockGet.mockReset();
    mockToString.mockReset();
  });

  it("prefers live URL params over seeded server props", () => {
    mockToString.mockReturnValue(
      "q=fantasy&type=project&category=Fantasy%20Football%20Analytics"
    );
    mockGet.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        q: "fantasy",
        type: "project",
        category: "Fantasy Football Analytics",
      };

      return values[key] ?? null;
    });

    render(
      <SearchInterfaceClient
        initialQuery="resume"
        initialType="page"
        initialCategory="Career Playbooks"
      />
    );

    expect(screen.getByTestId("search-interface")).toBeVisible();
    expect(mockRenderedSearchInterface).toHaveBeenCalledWith({
      initialQuery: "fantasy",
      initialType: "project",
      initialCategory: "Fantasy Football Analytics",
    });
  });

  it("resets to clean defaults after the URL params are cleared", () => {
    mockToString.mockReturnValue("");
    mockGet.mockReturnValue(null);

    render(
      <SearchInterfaceClient
        initialQuery="resume"
        initialType="page"
        initialCategory="Career Playbooks"
      />
    );

    expect(mockRenderedSearchInterface).toHaveBeenCalledWith({
      initialQuery: "",
      initialType: "all",
      initialCategory: "all",
    });
  });
});
