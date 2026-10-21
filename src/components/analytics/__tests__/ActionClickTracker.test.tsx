import { render } from "@testing-library/react";
import { isAnalyticsEnabled, trackContactClick, trackResumeDownload } from "@/lib/analytics";
import { ActionClickTracker } from "../ActionClickTracker";

jest.mock("@/lib/analytics", () => ({
  isAnalyticsEnabled: jest.fn(() => true),
  trackContactClick: jest.fn(),
  trackResumeDownload: jest.fn(),
}));

function clickLink(href: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  // A nested child, so the tracker has to walk up to the anchor.
  const inner = document.createElement("span");
  anchor.appendChild(inner);
  document.body.appendChild(anchor);
  // Stop the navigation jsdom would otherwise attempt.
  anchor.addEventListener("click", (event) => event.preventDefault());
  inner.click();
  anchor.remove();
}

beforeEach(() => {
  jest.clearAllMocks();
  (isAnalyticsEnabled as jest.Mock).mockReturnValue(true);
});

it("reports email, LinkedIn, GitHub, and résumé clicks", () => {
  render(<ActionClickTracker />);

  clickLink("mailto:IsaacVazquez@berkeley.edu");
  clickLink("https://www.linkedin.com/in/isaac-vazquez");
  clickLink("https://github.com/IsaacAVazquez/");
  clickLink("/Isaac_Vazquez_Resume.pdf");

  expect((trackContactClick as jest.Mock).mock.calls.map(([p]) => p.contact_method)).toEqual([
    "email",
    "linkedin",
    "github",
  ]);
  expect(trackResumeDownload).toHaveBeenCalledTimes(1);
});

it("ignores other links, including other LinkedIn pages", () => {
  render(<ActionClickTracker />);

  clickLink("https://www.linkedin.com/jobs/search/?keywords=product");
  clickLink("/writing");

  expect(trackContactClick).not.toHaveBeenCalled();
  expect(trackResumeDownload).not.toHaveBeenCalled();
});

it("listens for nothing while analytics is disabled", () => {
  (isAnalyticsEnabled as jest.Mock).mockReturnValue(false);
  render(<ActionClickTracker />);

  clickLink("mailto:IsaacVazquez@berkeley.edu");

  expect(trackContactClick).not.toHaveBeenCalled();
});
