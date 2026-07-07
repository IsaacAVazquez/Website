import { fireEvent, render, screen } from "@testing-library/react";
import ApplicationEditDialog from "../ApplicationEditDialog";
import type { MBAJob, MBATrackedApplication } from "@/types/mba-jobs";

function buildApplication(
  overrides: Partial<MBATrackedApplication> = {}
): MBATrackedApplication {
  const job: MBAJob = {
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
  };
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

describe("ApplicationEditDialog", () => {
  it("keeps Save disabled until both company and role have non-blank values", () => {
    const onSave = jest.fn();
    render(
      <ApplicationEditDialog
        isOpen
        application={null}
        onClose={jest.fn()}
        onSave={onSave}
      />
    );

    const saveButton = screen.getByRole("button", { name: "Save application" });
    expect(saveButton).toBeDisabled();

    // Whitespace-only company does not satisfy the trim() gate.
    fireEvent.change(screen.getByLabelText("Company"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText("Role"), {
      target: { value: "Product Intern" },
    });
    expect(saveButton).toBeDisabled();

    // Real company but blank role still blocks saving.
    fireEvent.change(screen.getByLabelText("Company"), {
      target: { value: "Stripe" },
    });
    fireEvent.change(screen.getByLabelText("Role"), {
      target: { value: "   " },
    });
    expect(saveButton).toBeDisabled();

    // Both non-blank enables it.
    fireEvent.change(screen.getByLabelText("Role"), {
      target: { value: "Product Intern" },
    });
    expect(saveButton).toBeEnabled();

    fireEvent.click(saveButton);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: "Stripe", title: "Product Intern" }),
      null
    );
  });

  it("opens enabled when seeded with a populated application", () => {
    const application = buildApplication();
    const onSave = jest.fn();
    render(
      <ApplicationEditDialog
        isOpen
        application={application}
        onClose={jest.fn()}
        onSave={onSave}
      />
    );

    expect(screen.getByRole("heading", { name: "Edit application" })).toBeVisible();
    const saveButton = screen.getByRole("button", { name: "Save application" });
    expect(saveButton).toBeEnabled();

    fireEvent.click(saveButton);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: "Stripe",
        title: "MBA Product Intern",
      }),
      application
    );
  });
});
