import { render, screen } from "@testing-library/react";
import SearchPage, { metadata } from "../page";

type SearchInterfaceClientProps = {
  initialQuery?: string;
  initialType?: string;
  initialCategory?: string;
};

const mockSearchInterfaceClient = jest.fn<void, [SearchInterfaceClientProps]>();

jest.mock("@/components/search/SearchInterface.client", () => ({
  SearchInterfaceClient: (props: SearchInterfaceClientProps) => {
    mockSearchInterfaceClient(props);
    return <div data-testid="search-interface-client" />;
  },
}));

describe("SearchPage", () => {
  beforeEach(() => {
    mockSearchInterfaceClient.mockReset();
  });

  it("awaits promised search params and seeds the client search shell", async () => {
    const page = await SearchPage({
      searchParams: Promise.resolve({
        q: "resume",
        type: "page",
        category: "Career Playbooks",
      }),
    });

    render(page);

    expect(
      screen.getByRole("heading", { name: /search my portfolio, writing, and tools/i })
    ).toBeVisible();
    expect(screen.getByTestId("search-interface-client")).toBeVisible();
    expect(mockSearchInterfaceClient).toHaveBeenCalledWith({
      initialQuery: "resume",
      initialType: "page",
      initialCategory: "Career Playbooks",
    });
  });

  it("marks the route as noindex", () => {
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    });
  });
});
