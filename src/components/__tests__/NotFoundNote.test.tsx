import { render, screen } from "@testing-library/react";
import { NotFoundNote, getNotFoundNote } from "@/components/NotFoundNote";

const usePathname = jest.fn<string, []>();
jest.mock("next/navigation", () => ({ usePathname: () => usePathname() }));

describe("getNotFoundNote", () => {
  it.each([
    ["/coffee", "/teapot"],
    ["/Espresso/", "/teapot"],
    ["/dashboard", "/dashboards"],
    ["/index.html", "/"],
    ["/cv", "/resume"],
    ["/easter-eggs", "/search?q=easter+eggs"],
  ])("sends %s on to %s", (path, href) => {
    expect(getNotFoundNote(path)?.link?.href).toBe(href);
  });

  it("answers scanners and the back room without a link", () => {
    for (const path of ["/wp-admin", "/wp-login.php", "/admin", "/login", "/xmlrpc.php", "/old/index.php"]) {
      const note = getNotFoundNote(path);
      expect(note?.text).toMatch(/no back room/);
      expect(note?.link).toBeUndefined();
    }
    expect(getNotFoundNote("/404")?.text).toMatch(/real 404/);
  });

  it("says nothing for an address that is just missing", () => {
    for (const path of ["/", "/dashboards", "/writing/old-post", "/cafeteria", "/resume"]) {
      expect(getNotFoundNote(path)).toBeNull();
    }
  });
});

describe("NotFoundNote", () => {
  it("prints the note and its link for a matching address", () => {
    usePathname.mockReturnValue("/coffee");
    render(<NotFoundNote className="note" />);
    expect(screen.getByText(/can't brew coffee/)).toHaveClass("note");
    expect(screen.getByRole("link", { name: /teapot/ })).toHaveAttribute("href", "/teapot");
  });

  it("renders nothing for a plain missing address", () => {
    usePathname.mockReturnValue("/nothing-here");
    const { container } = render(<NotFoundNote />);
    expect(container).toBeEmptyDOMElement();
  });
});
