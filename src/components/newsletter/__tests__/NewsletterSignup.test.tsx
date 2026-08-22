import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsletterSignup } from "../NewsletterSignup";
import { trackNewsletterSubscribe } from "@/lib/analytics";

jest.mock("@/lib/analytics", () => ({
  trackNewsletterSubscribe: jest.fn(),
}));

const originalFetch = global.fetch;

describe("NewsletterSignup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("submits the source and reports a successful signup", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: "You are on the list.",
      }),
    }) as unknown as typeof fetch;
    const user = userEvent.setup();

    render(<NewsletterSignup source="agent_build_index" />);
    await user.type(
      screen.getByRole("textbox", { name: "Email address" }),
      "reader@example.com"
    );
    await user.click(screen.getByRole("button", { name: "Join the list" }));

    await screen.findByText("You are on the list.");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/newsletter/subscribe",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"source":"agent_build_index"'),
      })
    );
    expect(trackNewsletterSubscribe).toHaveBeenCalledWith({
      signup_location: "agent_build_index",
    });
  });

  it("keeps the form available when the endpoint rejects the signup", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        message: "Email signup is temporarily unavailable.",
      }),
    }) as unknown as typeof fetch;
    const user = userEvent.setup();

    render(<NewsletterSignup source="writing" />);
    await user.type(
      screen.getByRole("textbox", { name: "Email address" }),
      "reader@example.com"
    );
    await user.click(screen.getByRole("button", { name: "Join the list" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Email signup is temporarily unavailable."
      );
    });
    expect(screen.getByRole("button", { name: "Join the list" })).toBeEnabled();
    expect(trackNewsletterSubscribe).not.toHaveBeenCalled();
  });
});
