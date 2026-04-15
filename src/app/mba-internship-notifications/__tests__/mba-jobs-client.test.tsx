import type { HTMLAttributes, ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MBAJobsClient } from "../mba-jobs-client";
import { DEFAULT_MBA_JOBS_STATE } from "../mba-jobs-state";
import { MBA_COMPANIES } from "@/constants/mba-companies";
import type { MBAJob } from "@/types/mba-jobs";
import { useMBAJobs } from "@/hooks/useMBAJobs";

const mockPush = jest.fn();
let currentSearchParams = new URLSearchParams();
const mockUseMBAJobs = useMBAJobs as jest.MockedFunction<typeof useMBAJobs>;

function buildJob(overrides: Partial<MBAJob> = {}): MBAJob {
  return {
    id: "stripe-1",
    companyId: "stripe",
    companyName: "Stripe",
    title: "MBA Product Intern",
    location: "San Francisco, CA",
    department: "Product",
    applyUrl: "https://example.com/stripe/apply",
    postedAt: "2026-04-14T16:00:00.000Z",
    atsType: "greenhouse",
    category: "fintech",
    snippet: "Summer associate role for product-minded MBA students.",
    roleType: "internship",
    roleFamilies: ["product"],
    ...overrides,
  };
}

function buildHookValue(overrides: Partial<ReturnType<typeof useMBAJobs>> = {}) {
  return {
    jobs: [buildJob()],
    isLoading: false,
    error: null,
    fetchErrors: [],
    lastFetchedAt: new Date("2026-04-14T18:30:00.000Z"),
    seenIds: new Set<string>(),
    watchedCompanyIds: new Set(
      MBA_COMPANIES.filter((company) => company.atsType !== "manual").map(
        (company) => company.id
      )
    ),
    notificationPermission: "unsupported" as const,
    newJobCount: 1,
    markJobSeen: jest.fn(),
    markAllSeen: jest.fn(),
    toggleCompany: jest.fn(),
    setAllCompanies: jest.fn(),
    requestNotificationPermission: jest.fn().mockResolvedValue(undefined),
    refresh: jest.fn(),
    sendEmailDigest: jest.fn().mockResolvedValue(undefined),
    emailSending: false,
    emailResult: null,
    clearEmailResult: jest.fn(),
    ...overrides,
  };
}

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
  useSearchParams: () => currentSearchParams,
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({
    children,
  }: {
    children: ReactNode;
    asChild?: boolean;
  }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuRadioGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuRadioItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/hooks/useMBAJobs", () => ({
  useMBAJobs: jest.fn(),
}));

describe("MBAJobsClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockUseMBAJobs.mockReturnValue(buildHookValue());
  });

  it("shows company names in the partial-failure banner and button-styled manual links", () => {
    mockUseMBAJobs.mockReturnValue(buildHookValue({
      jobs: [buildJob()],
      fetchErrors: [
        { companyId: "stripe", companyName: "Stripe", message: "timeout" },
        { companyId: "reddit", companyName: "Reddit", message: "503" },
      ],
    }));

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(
      screen.getByText(/Some companies could not be reached: Stripe, Reddit\./i)
    ).toBeVisible();

    const plaidLinkedIn = screen.getByRole("link", {
      name: "LinkedIn search for Plaid",
    });
    const microsoftCareerPage = screen.getByRole("link", {
      name: "Career page for Microsoft",
    });
    const applyButton = screen.getByRole("link", {
      name: "Apply for MBA Product Intern at Stripe",
    });

    expect(plaidLinkedIn).toHaveClass("home-button", "home-button-secondary");
    expect(microsoftCareerPage).toHaveClass("home-button", "home-button-primary");
    expect(applyButton).toHaveClass("home-button", "home-button-primary");
  });

  it("groups tracked companies by category and keeps job-card chips wrappable", () => {
    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(
      screen.getByText(/Manual-only targets stay separate in Manual checks below\./i)
    ).toBeVisible();

    const fintechGroup = screen.getByTestId("tracked-companies-fintech");
    const startupGroup = screen.getByTestId("tracked-companies-startup");
    const bigTechGroup = screen.getByTestId("tracked-companies-big-tech");
    const chipRail = screen.getByTestId("job-card-stripe-1-chips");
    const fintechTracked = MBA_COMPANIES.filter(
      (company) => company.category === "fintech" && company.atsType !== "manual"
    ).length;
    const startupTracked = MBA_COMPANIES.filter(
      (company) => company.category === "startup" && company.atsType !== "manual"
    ).length;
    const bigTechTracked = MBA_COMPANIES.filter(
      (company) => company.category === "big-tech" && company.atsType !== "manual"
    ).length;
    const startupToggle = within(startupGroup).getByRole("button", { name: /Startup/i });
    const atlassianButton = within(bigTechGroup).getByRole("button", { name: "Atlassian" });

    expect(within(fintechGroup).getByRole("button", { name: "Stripe" })).toBeVisible();
    expect(within(startupGroup).getByRole("button", { name: "OpenAI" })).toBeVisible();
    expect(within(bigTechGroup).getByRole("button", { name: "Atlassian" })).toBeVisible();
    expect(within(fintechGroup).getByText(`${fintechTracked} / ${fintechTracked} watched`)).toBeVisible();
    expect(within(startupGroup).getByText(`${startupTracked} / ${startupTracked} watched`)).toBeVisible();
    expect(within(bigTechGroup).getByText(`${bigTechTracked} / ${bigTechTracked} watched`)).toBeVisible();
    expect(startupToggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(startupToggle);
    expect(startupToggle).toHaveAttribute("aria-expanded", "false");
    expect(
      within(startupGroup).queryByRole("button", { name: "OpenAI" })
    ).not.toBeInTheDocument();
    expect(atlassianButton).toHaveStyle(
      "background: color-mix(in srgb, var(--home-paper-alt) 78%, white)"
    );
    expect(chipRail).toHaveClass("flex-wrap");
    expect(chipRail).not.toHaveClass("shrink-0");
  });

  it("hydrates search state from the URL and ranks best matches first", () => {
    currentSearchParams = new URLSearchParams("q=product%20finance&sort=relevance");

    mockUseMBAJobs.mockReturnValue(buildHookValue({
      jobs: [
        buildJob({
          id: "combo",
          title: "Product Finance Manager",
          postedAt: "2026-04-12T10:00:00.000Z",
          roleType: "full-time",
          roleFamilies: ["product", "finance"],
          snippet: "Own product strategy and finance planning.",
        }),
        buildJob({
          id: "product",
          title: "Product Marketing Manager",
          companyId: "openai",
          companyName: "OpenAI",
          category: "startup",
          postedAt: "2026-04-14T10:00:00.000Z",
          roleType: "full-time",
          roleFamilies: ["product-marketing"],
          snippet: "Drive product positioning and GTM.",
        }),
        buildJob({
          id: "finance",
          title: "Strategic Finance Associate",
          companyId: "brex",
          companyName: "Brex",
          postedAt: "2026-04-15T10:00:00.000Z",
          roleType: "full-time",
          roleFamilies: ["strategy", "finance"],
          snippet: "Lead finance planning and strategy work.",
        }),
      ],
    }));

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(screen.getByLabelText("Search roles")).toHaveValue("product finance");
    const liveJobsGrid = screen.getByTestId("live-jobs-grid");

    expect(within(liveJobsGrid).getAllByRole("heading", { level: 3 }).map((node) => node.textContent)).toEqual([
      "Product Finance Manager",
      "Strategic Finance Associate",
      "Product Marketing Manager",
    ]);

    fireEvent.change(screen.getByLabelText("Search roles"), {
      target: { value: "pmm" },
    });

    expect(mockPush).toHaveBeenLastCalledWith(
      "/mba-internship-notifications?q=pmm",
      { scroll: false }
    );
  });

  it("filters by career type and role family, hides unclear roles, and clears filters", () => {
    currentSearchParams = new URLSearchParams("q=finance&roleType=full-time&roleFamily=finance");

    mockUseMBAJobs.mockReturnValue(buildHookValue({
      jobs: [
        buildJob({
          id: "finance-full-time",
          title: "Strategic Finance Associate",
          roleType: "full-time",
          roleFamilies: ["strategy", "finance"],
          snippet: "Corporate finance role.",
        }),
        buildJob({
          id: "finance-intern",
          title: "Finance Intern",
          roleType: "internship",
          roleFamilies: ["finance"],
          snippet: "Summer finance role.",
        }),
        buildJob({
          id: "unclear",
          title: "MBA Leadership Program",
          roleType: "unclear",
          roleFamilies: [],
          snippet: "MBA rotational program.",
        }),
      ],
    }));

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(screen.getByRole("heading", { name: "Strategic Finance Associate" })).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Finance Intern" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "MBA Leadership Program" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(screen.getByRole("heading", { name: "Finance Intern" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "MBA Leadership Program" })).toBeVisible();
    expect(mockPush).toHaveBeenLastCalledWith("/mba-internship-notifications", {
      scroll: false,
    });
  });
});
