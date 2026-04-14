import type { HTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MBAJobsClient } from "../mba-jobs-client";
import { DEFAULT_MBA_JOBS_STATE } from "../mba-jobs-state";
import { MBA_COMPANIES } from "@/constants/mba-companies";
import { useMBAJobs } from "@/hooks/useMBAJobs";

const mockPush = jest.fn();
const mockUseMBAJobs = useMBAJobs as jest.MockedFunction<typeof useMBAJobs>;

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
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
    mockPush.mockReset();
    mockUseMBAJobs.mockReturnValue({
      jobs: [
        {
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
        },
      ],
      isLoading: false,
      error: null,
      fetchErrors: [
        { companyId: "stripe", companyName: "Stripe", message: "timeout" },
        { companyId: "reddit", companyName: "Reddit", message: "503" },
      ],
      lastFetchedAt: new Date("2026-04-14T18:30:00.000Z"),
      seenIds: new Set<string>(),
      watchedCompanyIds: new Set(
        MBA_COMPANIES.filter((company) => company.atsType !== "manual").map(
          (company) => company.id
        )
      ),
      notificationPermission: "unsupported",
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
    });
  });

  it("shows company names in the partial-failure banner and button-styled manual links", () => {
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
});
