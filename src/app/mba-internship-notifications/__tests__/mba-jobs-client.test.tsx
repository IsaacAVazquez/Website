import { fireEvent, render, screen, within } from "@testing-library/react";
import { MBAJobsClient } from "../mba-jobs-client";
import { DEFAULT_MBA_JOBS_STATE } from "../mba-jobs-state";
import { MBA_COMPANIES } from "@/constants/mba-companies";
import type { MBAJob, MBAJobCandidate, MBATrackedApplication } from "@/types/mba-jobs";
import { useMBAJobs } from "@/hooks/useMBAJobs";
import { useMBAApplications, useMBAJobCandidates } from "@/hooks/useMBAApplications";
import { DISPLAY_TIME_ZONE, toLocalDateKey } from "@/lib/date-formatters";

// A YYYY-MM-DD key `days` from today, anchored at local noon so the calendar
// day is stable regardless of the test machine's clock or DST.
function dayKeyOffset(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date);
}

const mockPush = jest.fn();
let currentSearchParams = new URLSearchParams();
const mockUseMBAJobs = useMBAJobs as jest.MockedFunction<typeof useMBAJobs>;
const mockUseMBAApplications = useMBAApplications as jest.MockedFunction<typeof useMBAApplications>;
const mockUseMBAJobCandidates = useMBAJobCandidates as jest.MockedFunction<typeof useMBAJobCandidates>;

function buildCandidatesHookValue(
  overrides: Partial<ReturnType<typeof useMBAJobCandidates>> = {}
) {
  return {
    candidates: [] as MBAJobCandidate[],
    enabled: false,
    setTriage: jest.fn(),
    removeCandidate: jest.fn(),
    ...overrides,
  };
}

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
    // The feed defaults to full-time roles, so the shared fixture has to pass that filter.
    roleType: "full-time",
    roleFamilies: ["product"],
    ...overrides,
  };
}

function buildCandidate(overrides: Partial<MBAJobCandidate> = {}): MBAJobCandidate {
  const job = buildJob();
  return {
    id: "cand-1",
    job: { ...job, capturedAt: "2026-10-01T10:00:00.000Z", source: "live-feed" },
    triage: "sourced",
    fit: { score: 82, rationale: "Product role at a fintech I already follow.", scoredAt: "2026-10-01T10:00:00.000Z" },
    sourcedAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
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
    privateSync: null,
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

jest.mock("@/hooks/useMBAJobs", () => ({
  useMBAJobs: jest.fn(),
}));

jest.mock("@/hooks/useMBAApplications", () => ({
  useMBAApplications: jest.fn(),
  useMBAJobCandidates: jest.fn(),
}));

describe("MBAJobsClient", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    mockPush.mockReset();
    mockUseMBAJobs.mockReturnValue(buildHookValue());
    mockUseMBAApplications.mockReturnValue(buildApplicationsHookValue());
    mockUseMBAJobCandidates.mockReturnValue(buildCandidatesHookValue());
  });

  it("hides the Candidates view in production and falls back to the feed for ?view=candidates", () => {
    currentSearchParams = new URLSearchParams("view=candidates");

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    const toggle = screen.getByRole("group", { name: "Job tracker view" });
    expect(within(toggle).queryByRole("button", { name: "Candidates" })).not.toBeInTheDocument();
    expect(within(toggle).getByRole("button", { name: "Role feed", pressed: true })).toBeVisible();
    expect(screen.getByTestId("live-jobs-grid")).toBeInTheDocument();
    expect(screen.queryByTestId("candidates-grid")).not.toBeInTheDocument();
  });

  it("renders sourced candidates by fit and wires promote and dismiss", () => {
    currentSearchParams = new URLSearchParams("view=candidates");
    const trackJob = jest.fn();
    const setTriage = jest.fn();
    const removeCandidate = jest.fn();
    const strong = buildCandidate({
      id: "cand-strong",
      job: { ...buildCandidate().job, id: "job-strong", title: "Chief of Staff", companyName: "Brex" },
      fit: { score: 91, rationale: "Chief of staff seat under a product leader.", scoredAt: "2026-10-02T10:00:00.000Z" },
      sourcedAt: "2026-09-30T10:00:00.000Z",
    });
    const weaker = buildCandidate({ id: "cand-weaker", fit: { score: 64, rationale: "Adjacent operations role.", scoredAt: "2026-10-02T10:00:00.000Z" } });
    mockUseMBAApplications.mockReturnValue(buildApplicationsHookValue({ trackJob }));
    mockUseMBAJobCandidates.mockReturnValue(
      buildCandidatesHookValue({ enabled: true, candidates: [strong, weaker], setTriage, removeCandidate })
    );

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(screen.getByRole("button", { name: "Candidates", pressed: true })).toBeVisible();
    const headings = within(screen.getByTestId("candidates-grid")).getAllByRole("heading", { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual(["Chief of Staff", "MBA Product Intern"]);
    expect(screen.getByText("Fit 91")).toBeVisible();

    const [promote] = screen.getAllByRole("button", { name: "Save to pipeline" });
    fireEvent.click(promote);
    expect(trackJob).toHaveBeenCalledWith(strong.job);
    expect(removeCandidate).toHaveBeenCalledWith("cand-strong");

    const [dismiss] = screen.getAllByRole("button", { name: "Dismiss" });
    fireEvent.click(dismiss);
    expect(setTriage).toHaveBeenCalledWith("cand-strong", "dismissed");
  });

  it("shows the fit tag and the sync line only when the private data is there", () => {
    currentSearchParams = new URLSearchParams("view=applications");
    const application = buildApplication({
      fit: { score: 88, rationale: "Strong match.", scoredAt: "2026-10-02T10:00:00.000Z" },
      appliedVia: "Referral",
      materialsDir: "private/job-search/roles/stripe-pm",
      interviewRounds: [{ label: "Recruiter screen", date: "2026-10-09", outcome: "scheduled", notes: "" }],
      facts: [{ label: "Base pay", value: "$143,000 plus equity" }],
    });
    mockUseMBAApplications.mockReturnValue(
      buildApplicationsHookValue({
        applications: [application],
        activeApplications: [application],
        privateSync: { lastSyncedAt: "2026-10-07T15:04:00.000Z", error: null },
      })
    );

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(screen.getByText("Fit 88")).toBeVisible();
    expect(screen.getByText("Applied via Referral")).toBeVisible();
    expect(screen.getByText("private/job-search/roles/stripe-pm")).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy path" })).toBeVisible();
    expect(within(screen.getByRole("list", { name: "Interview rounds" })).getByText(/Recruiter screen/)).toBeVisible();
    expect(within(screen.getByRole("list", { name: "Posting facts" })).getByText(/Base pay · \$143,000 plus equity/)).toBeVisible();
    expect(screen.getByRole("status", { name: "" })).toHaveTextContent(
      /Synced with private\/job-search\/pipeline\.json, last sync/
    );
    expect(screen.getByRole("button", { name: "By fit", pressed: false })).toBeVisible();
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

    expect(googleLinkedIn).toHaveClass("c97-btn-ghost");
    expect(microsoftCareerPage).toHaveClass("c97-btn");
    expect(applyButton).toHaveClass("c97-btn");
  });

  it("shows the fetched date of the list it displays, however old the list is", () => {
    const fetchedAt = new Date("2026-09-20T18:30:00.000Z");
    mockUseMBAJobs.mockReturnValue(buildHookValue({ lastFetchedAt: fetchedAt }));

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    const shown = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: DISPLAY_TIME_ZONE,
      timeZoneName: "short",
    }).format(fetchedAt);
    expect(screen.getByText(`Updated ${shown}`)).toBeVisible();
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
    const chipRail = screen.getByTestId("job-card-stripe-1-chips");
    const fintechTracked = MBA_COMPANIES.filter(
      (company) => company.category === "fintech" && company.atsType !== "manual"
    ).length;
    const startupTracked = MBA_COMPANIES.filter(
      (company) => company.category === "startup" && company.atsType !== "manual"
    ).length;
    const startupToggle = within(startupGroup).getByRole("button", { name: /Startup/i });
    const stripeButton = within(fintechGroup).getByRole("button", { name: "Stripe" });
    const stripeDot = stripeButton.querySelector("span");

    expect(stripeButton).toBeVisible();
    expect(within(startupGroup).getByRole("button", { name: "OpenAI" })).toBeVisible();
    // Big Tech polls only the boards Pinterest and Roblox publish. The rest,
    // Atlassian included since its Lever board closed, stay manual checks.
    const bigTechTracked = MBA_COMPANIES.filter(
      (company) => company.category === "big-tech" && company.atsType !== "manual"
    ).length;
    const bigTechGroup = screen.getByTestId("tracked-companies-big-tech");
    expect(within(bigTechGroup).getByText(`${bigTechTracked} / ${bigTechTracked} watched`)).toBeVisible();
    expect(screen.getByRole("link", { name: "Career page for Atlassian" })).toBeVisible();
    expect(within(fintechGroup).getByText(`${fintechTracked} / ${fintechTracked} watched`)).toBeVisible();
    expect(within(startupGroup).getByText(`${startupTracked} / ${startupTracked} watched`)).toBeVisible();
    expect(startupToggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(startupToggle);
    expect(startupToggle).toHaveAttribute("aria-expanded", "false");
    expect(
      within(startupGroup).queryByRole("button", { name: "OpenAI" })
    ).not.toBeInTheDocument();
    // The field tint and the hover come from .mba-toggle in mba-jobs.css.
    expect(stripeButton).toHaveClass("mba-toggle");
    expect(stripeDot).not.toBeNull();
    // jsdom drops color-mix() values, so the active dot's category colour can't be
    // read back from its style. Check the colour it is given and that the active dot
    // does not fall back to the inactive rule colour.
    expect(MBA_COMPANIES.find((company) => company.id === "stripe")?.color).toBe(
      "color-mix(in srgb, var(--c97-positive) 62%, var(--c97-ink) 38%)"
    );
    expect(stripeDot).not.toHaveStyle("background: var(--c97-rule)");
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
    expect(screen.getByRole("button", { name: "Remote · 1", pressed: true })).toBeVisible();
    expect(screen.getByRole("button", { name: "New York · 1", pressed: false })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Remote Finance Manager" })).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "New York Finance Manager" })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New York · 1" }));

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

    // Clearing lands on the full-time default, so the intern and unclear roles stay hidden.
    expect(screen.getByRole("heading", { name: "Strategic Finance Associate" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Finance Intern" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "MBA Leadership Program" })
    ).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenLastCalledWith("/mba-internship-notifications", {
      scroll: false,
    });

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(mockPush).toHaveBeenLastCalledWith(
      "/mba-internship-notifications?roleType=all",
      { scroll: false }
    );
    expect(screen.getByRole("heading", { name: "Finance Intern" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "MBA Leadership Program" })).toBeVisible();
  });

  it("paginates the live grid and resets to the first page when a filter changes", () => {
    const jobs = Array.from({ length: 75 }, (_, i) =>
      buildJob({
        id: `job-${i}`,
        title: `Role ${i}`,
        postedAt: `2026-04-${String((i % 27) + 1).padStart(2, "0")}T10:00:00.000Z`,
      })
    );
    mockUseMBAJobs.mockReturnValue(buildHookValue({ jobs }));

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    const liveJobsGrid = screen.getByTestId("live-jobs-grid");
    expect(within(liveJobsGrid).getAllByRole("heading", { level: 3 })).toHaveLength(60);
    expect(screen.getByRole("button", { name: "Show more (60 of 75 shown)" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /Show more/ }));
    expect(within(liveJobsGrid).getAllByRole("heading", { level: 3 })).toHaveLength(75);
    expect(screen.queryByRole("button", { name: /Show more/ })).not.toBeInTheDocument();

    // A filter change (not a data refresh) starts back at the first page.
    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "oldest" } });
    expect(within(liveJobsGrid).getAllByRole("heading", { level: 3 })).toHaveLength(60);
    expect(screen.getByRole("button", { name: "Show more (60 of 75 shown)" })).toBeVisible();
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

    fireEvent.click(screen.getByRole("button", { name: "Direct + external leads" }));

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

    const heading = screen.getByRole("heading", { name: "Know which feeds answered." });
    expect(heading).toBeVisible();
    expect(screen.getByText("1 healthy")).toBeVisible();
    expect(screen.getByText("1 manual-only")).toBeVisible();
    expect(screen.getByText("1 external disabled")).toBeVisible();

    // The counts stay in view. The tag for each source opens on request.
    const stripe = screen.getByText(/Stripe · 1 roles/);
    expect(stripe).not.toBeVisible();
    fireEvent.click(screen.getByText("Show all 3 sources"));
    expect(stripe).toBeVisible();
    expect(screen.getByText(/Adzuna leads · external-disabled/)).toBeVisible();

    // Source health prints after the roles, with a link to it beside them.
    const roles = screen.getByRole("heading", { name: "Current openings across the tracked boards." });
    expect(roles.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("link", { name: "Source health" })).toHaveAttribute(
      "href",
      "#mba-source-health-heading"
    );
  });

  it("puts the search and the roles ahead of the company toggles and the outside boards", () => {
    mockUseMBAJobs.mockReturnValue(buildHookValue({ jobs: [buildJob()] }));

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    const order = [
      screen.getByRole("group", { name: "Job tracker view" }),
      screen.getByRole("textbox", { name: "Search roles" }),
      screen.getByTestId("live-jobs-grid"),
      screen.getByRole("heading", { name: "Choose which live feeds stay in view." }),
      screen.getByRole("heading", { name: "Open the same search on outside boards." }),
    ];
    order.slice(1).forEach((element, index) => {
      expect(order[index].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  it("opens the location, role, company, and source filters on request on a phone", () => {
    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    const toggle = screen.getByRole("button", { name: /location, role, company, and source filters/ });
    const filters = document.getElementById("mba-role-refinements")!;
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "mba-role-refinements");
    // Hidden below 768px only, so a wider window always prints them.
    expect(filters).toHaveClass("hidden", "md:flex");
    expect(within(filters).getByRole("group", { name: "Filter by role family" })).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(filters).not.toHaveClass("hidden");
  });

  it("holds the pipeline funnel back to a short prompt until a role is tracked", () => {
    const { unmount } = render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(screen.getByText("Track a role below to start filling this in.")).toBeVisible();
    expect(screen.queryByText("Response rate")).not.toBeInTheDocument();
    expect(screen.getByText("Live roles tracked")).toBeVisible();
    expect(screen.queryByText("Active applications")).not.toBeInTheDocument();
    unmount();

    const applications = [buildApplication({ id: "a1", jobId: "j1", status: "applied" })];
    mockUseMBAApplications.mockReturnValue(
      buildApplicationsHookValue({ applications, activeApplications: applications })
    );
    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(screen.queryByText("Track a role below to start filling this in.")).not.toBeInTheDocument();
    expect(screen.getByText("Response rate")).toBeVisible();
    expect(screen.getByText("Active applications")).toBeVisible();
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

  it("asks for a second click before deleting a tracked application", () => {
    currentSearchParams = new URLSearchParams("view=applications");
    const removeApplication = jest.fn();
    const application = buildApplication({ status: "interviewing" });
    mockUseMBAApplications.mockReturnValue(buildApplicationsHookValue({
      applications: [application],
      activeApplications: [application],
      removeApplication,
    }));

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(removeApplication).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Keep it" }));
    expect(screen.getByRole("button", { name: "Delete" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    expect(removeApplication).toHaveBeenCalledWith("app-1");
  });

  it("summarizes the pipeline funnel and conversion rates in the applications view", () => {
    currentSearchParams = new URLSearchParams("view=applications");
    const applications = [
      buildApplication({ id: "a1", jobId: "j1", status: "saved" }),
      buildApplication({ id: "a2", jobId: "j2", status: "applied" }),
      buildApplication({ id: "a3", jobId: "j3", status: "applied" }),
      buildApplication({ id: "a4", jobId: "j4", status: "interviewing" }),
      buildApplication({ id: "a5", jobId: "j5", status: "offer" }),
    ];
    mockUseMBAApplications.mockReturnValue(
      buildApplicationsHookValue({ applications, activeApplications: applications })
    );

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    // submitted = applied(2) + interviewing(1) + offer(1) = 4; responded = 2.
    expect(screen.getByText("Response rate")).toBeVisible();
    expect(screen.getByText("2 of 4 heard back")).toBeVisible();
    expect(screen.getByText("Pipeline funnel")).toBeVisible();
    // The old ad-hoc stat cards are gone.
    expect(screen.queryByText("Overdue follow-ups")).not.toBeInTheDocument();
  });

  it("surfaces overdue follow-ups in the needs-attention panel and clears them", () => {
    currentSearchParams = new URLSearchParams("view=applications");
    const updateApplication = jest.fn();
    const application = buildApplication({
      status: "applied",
      followUpDate: dayKeyOffset(-3),
      jobSnapshot: {
        ...buildApplication().jobSnapshot,
        companyName: "Acme",
        title: "Strategy Manager",
      },
    });
    mockUseMBAApplications.mockReturnValue(
      buildApplicationsHookValue({
        applications: [application],
        activeApplications: [application],
        updateApplication,
      })
    );

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(screen.getByText("What to chase today.")).toBeVisible();
    expect(screen.getByText("Follow-up overdue by 3 days")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Mark done" }));
    expect(updateApplication).toHaveBeenCalledWith("app-1", { followUpDate: null });
  });

  it("marks an approaching-deadline role applied straight from the attention panel", () => {
    currentSearchParams = new URLSearchParams("view=applications");
    const updateStatus = jest.fn();
    const application = buildApplication({
      status: "saved",
      deadline: dayKeyOffset(2),
    });
    mockUseMBAApplications.mockReturnValue(
      buildApplicationsHookValue({
        applications: [application],
        activeApplications: [application],
        updateStatus,
      })
    );

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    expect(screen.getByText("Deadline in 2 days")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Mark applied" }));
    expect(updateStatus).toHaveBeenCalledWith("app-1", "applied");
  });

  it("shows an all-caught-up state and changes priority inline from a card", () => {
    currentSearchParams = new URLSearchParams("view=applications");
    const updatePriority = jest.fn();
    const application = buildApplication({ status: "applied", priority: "medium" });
    mockUseMBAApplications.mockReturnValue(
      buildApplicationsHookValue({
        applications: [application],
        activeApplications: [application],
        updatePriority,
      })
    );

    render(<MBAJobsClient initialState={DEFAULT_MBA_JOBS_STATE} />);

    // No follow-ups or deadlines are pending, so the panel reassures instead.
    expect(screen.getByText(/You.re all caught up\./)).toBeVisible();

    fireEvent.change(
      screen.getByLabelText("Priority for MBA Product Intern"),
      { target: { value: "high" } }
    );
    expect(updatePriority).toHaveBeenCalledWith("app-1", "high");
  });
});
