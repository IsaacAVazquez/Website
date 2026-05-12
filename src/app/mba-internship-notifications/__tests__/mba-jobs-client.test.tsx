import type { HTMLAttributes, ReactNode } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MBAJobsClient } from "../mba-jobs-client";
import { DEFAULT_MBA_JOBS_STATE } from "../mba-jobs-state";
import { MBA_COMPANIES } from "@/constants/mba-companies";
import type { MBAJob, MBATrackedApplication } from "@/types/mba-jobs";
import { useMBAJobs } from "@/hooks/useMBAJobs";
import { useMBAApplications } from "@/hooks/useMBAApplications";

const mockPush = jest.fn();
let currentSearchParams = new URLSearchParams();
const mockUseMBAJobs = useMBAJobs as jest.MockedFunction<typeof useMBAJobs>;
const mockUseMBAApplications = useMBAApplications as jest.MockedFunction<typeof useMBAApplications>;

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

function buildApplication(
  overrides: Partial<MBATrackedApplication> = {}
): MBATrackedApplication {
  const job = buildJob();
  return {
    id: "app-1",
    jobId: job.id,
    jobSnapshot: {
      ...job,
      capturedAt: "2026-04-14T18:30:00.000Z",
      source: "live-feed",
    },
    status: "saved",
    priority: "medium",
    notes: "",
    contact: "",
    sourceUrl: job.applyUrl,
    followUpDate: null,
    deadline: null,
    createdAt: "2026-04-14T18:30:00.000Z",
    updatedAt: "2026-04-14T18:30:00.000Z",
    appliedAt: null,
    archivedAt: null,
    ...overrides,
  };
}

function buildHookValue(overrides: Partial<ReturnType<typeof useMBAJobs>> = {}) {
  return {
    jobs: [buildJob()],
    isLoading: false,
    error: null,
    fetchErrors: [],
    sourceStatuses: [],
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

function buildApplicationsHookValue(
  overrides: Partial<ReturnType<typeof useMBAApplications>> = {}
) {
  return {
    applications: [],
    activeApplications: [],
    applicationsByJobId: new Map<string, MBATrackedApplication>(),
    getApplicationForJob: jest.fn(),
    trackJob: jest.fn(),
    addManualApplication: jest.fn(),
    updateApplication: jest.fn(),
    updateStatus: jest.fn(),
    updatePriority: jest.fn(),
    archiveApplication: jest.fn(),
    removeApplication: jest.fn(),
    importApplications: jest.fn(() => ({ imported: 0, total: 0 })),
    exportJson: jest.fn(() => "{}"),
    exportCsv: jest.fn(() => ""),
    searchApplications: jest.fn((query: string, source: MBATrackedApplication[] = []) => source),
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

jest.mock("@/hooks/useMBAApplications", () => ({
  useMBAApplications: jest.fn(),
}));

describe("MBAJobsClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockUseMBAJobs.mockReturnValue(buildHookValue());
    mockUseMBAApplications.mockReturnValue(buildApplicationsHookValue());
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

    const googleLinkedIn = screen.getByRole("link", {
      name: "LinkedIn search for Google",
    });
    const microsoftCareerPage = screen.getByRole("link", {
      name: "Career page for Microsoft",
    });
    const applyButton = screen.getByRole("link", {
      name: "Apply for MBA Product Intern at Stripe",
    });

    expect(googleLinkedIn).toHaveClass("home-button", "home-button-secondary");
    expect(microsoftCareerPage).toHaveClass("home-button", "home-button-primary");
    expect(applyButton).toHaveClass("home-button", "home-button-primary");
  });

  it("groups tracked companies by category and keeps job-card chips wrappable", () => {
    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(
      screen.getByText(/Manual-only targets stay separate in Manual checks below\./i)
    ).toBeVisible();
    const trackedCompaniesToggle = screen.getByRole("button", {
      name: /Tracked company feeds/i,
    });
    expect(trackedCompaniesToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Stripe" })).not.toBeInTheDocument();

    fireEvent.click(trackedCompaniesToggle);

    expect(trackedCompaniesToggle).toHaveAttribute("aria-expanded", "true");

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
    const atlassianDot = atlassianButton.querySelector("span");

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
      "background: color-mix(in srgb, var(--home-paper-alt) 78%, var(--home-elev-mix))"
    );
    expect(atlassianDot).not.toBeNull();
    expect(atlassianDot).toHaveStyle(
      "background: color-mix(in srgb, var(--home-ink) 68%, var(--home-stone) 32%)"
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

  it("hydrates location from the URL and filters jobs independently from keyword search", () => {
    currentSearchParams = new URLSearchParams("q=finance&location=remote");

    mockUseMBAJobs.mockReturnValue(buildHookValue({
      jobs: [
        buildJob({
          id: "remote-finance",
          title: "Remote Finance Manager",
          location: "Remote US",
          roleType: "full-time",
          roleFamilies: ["finance"],
          snippet: "Remote finance role.",
        }),
        buildJob({
          id: "new-york-finance",
          title: "New York Finance Manager",
          location: "New York, NY",
          roleType: "full-time",
          roleFamilies: ["finance"],
          snippet: "NY finance role.",
        }),
      ],
    }));

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(screen.getByLabelText("Search roles")).toHaveValue("finance");
    expect(screen.getByLabelText("Filter by location")).toHaveValue("remote");
    expect(screen.getByRole("tab", { name: "Remote · 1" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "New York · 1" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Remote Finance Manager" })).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "New York Finance Manager" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "New York · 1" }));

    expect(mockPush).toHaveBeenLastCalledWith(
      "/mba-internship-notifications?q=finance&location=New+York",
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

  it("renders outbound search shortcuts and toggles external leads through URL state", () => {
    currentSearchParams = new URLSearchParams("q=strategy&location=remote");

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(screen.getByText("Search elsewhere")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Search LinkedIn for the current role filters" })
    ).toHaveAttribute(
      "href",
      expect.stringContaining("https://www.linkedin.com/jobs/search/")
    );
    expect(
      screen.getByRole("link", { name: "Search Google for the current role filters" })
    ).toHaveAttribute("href", expect.stringContaining("strategy"));

    fireEvent.click(screen.getByRole("tab", { name: "Direct + external leads" }));

    expect(mockPush).toHaveBeenLastCalledWith(
      "/mba-internship-notifications?external=on&q=strategy&location=remote",
      { scroll: false }
    );
  });

  it("tracks live jobs and marks them applied without opening the apply link", () => {
    const trackJob = jest.fn();
    mockUseMBAApplications.mockReturnValue(buildApplicationsHookValue({
      trackJob,
    }));

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    fireEvent.click(screen.getByRole("button", { name: "Track" }));
    expect(trackJob).toHaveBeenCalledWith(expect.objectContaining({ id: "stripe-1" }), "saved");

    fireEvent.click(screen.getByRole("button", { name: "Mark applied" }));
    expect(trackJob).toHaveBeenCalledWith(expect.objectContaining({ id: "stripe-1" }), "applied");
  });

  it("shows tracked application state on feed cards", () => {
    const application = buildApplication({ status: "applied" });
    mockUseMBAApplications.mockReturnValue(buildApplicationsHookValue({
      applications: [application],
      activeApplications: [application],
      getApplicationForJob: jest.fn(() => application),
    }));

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(screen.getByText("Applied")).toBeVisible();
    expect(screen.getByRole("button", { name: "Tracked" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
  });

  it("passes external lead mode to the hook and labels external roles", () => {
    currentSearchParams = new URLSearchParams("external=on");
    mockUseMBAJobs.mockReturnValue(buildHookValue({
      jobs: [
        buildJob({
          id: "adzuna-1",
          companyId: "external-adzuna-1",
          companyName: "External Fintech",
          title: "Strategic Finance Associate",
          location: "Remote",
          department: "Finance Jobs",
          applyUrl: "https://adzuna.example.com/jobs/1",
          atsType: "external-api",
          category: "startup",
          roleType: "full-time",
          roleFamilies: ["finance"],
          sourceName: "Adzuna",
          sourceUrl: "https://adzuna.example.com/jobs/1",
        }),
      ],
    }));

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(mockUseMBAJobs).toHaveBeenCalledWith({ externalLeads: true });
    expect(screen.getByRole("heading", { name: "Strategic Finance Associate" })).toBeVisible();
    expect(screen.getByText("Adzuna lead")).toBeVisible();
    expect(screen.getByText(/Found through Adzuna/)).toBeVisible();
  });

  it("renders source health when the API reports feed statuses", () => {
    mockUseMBAJobs.mockReturnValue(buildHookValue({
      sourceStatuses: [
        {
          companyId: "stripe",
          companyName: "Stripe",
          atsType: "greenhouse",
          status: "ok",
          jobCount: 1,
        },
        {
          companyId: "external-adzuna",
          companyName: "Adzuna leads",
          atsType: "external-api",
          status: "external-disabled",
          jobCount: 0,
          message: "Set ADZUNA_APP_ID and ADZUNA_APP_KEY to enable external leads.",
        },
        {
          companyId: "microsoft",
          companyName: "Microsoft",
          atsType: "manual",
          status: "skipped",
          jobCount: 0,
          message: "Manual-only company; use the career page fallback.",
        },
      ],
    }));

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(screen.getByText("Source health")).toBeVisible();
    expect(screen.getByText("1 healthy")).toBeVisible();
    expect(screen.getByText("1 manual-only")).toBeVisible();
    expect(screen.getByText("1 external disabled")).toBeVisible();
    expect(screen.getByText(/Stripe · 1 roles/)).toBeVisible();
    expect(screen.getByText(/Adzuna leads · external-disabled/)).toBeVisible();
  });

  it("deep-links into the application pipeline and updates application status", () => {
    currentSearchParams = new URLSearchParams("view=applications");
    const updateStatus = jest.fn();
    const application = buildApplication({
      status: "interviewing",
      notes: "Follow up with recruiter.",
      followUpDate: "2026-04-15",
    });
    mockUseMBAApplications.mockReturnValue(buildApplicationsHookValue({
      applications: [application],
      activeApplications: [application],
      updateStatus,
    }));

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(screen.getByLabelText("Search applications")).toBeVisible();
    expect(screen.getByRole("heading", { name: "MBA Product Intern" })).toBeVisible();

    fireEvent.change(
      screen.getByLabelText("Application status for MBA Product Intern"),
      { target: { value: "offer" } }
    );

    expect(updateStatus).toHaveBeenCalledWith("app-1", "offer");
  });
});
