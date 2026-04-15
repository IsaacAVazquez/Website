import { matchMBAJobRole } from "../mba-job-matching";

describe("matchMBAJobRole", () => {
  it("rejects new-grad business-role titles without explicit MBA signals", () => {
    expect(
      matchMBAJobRole({
        title: "Associate Product Manager, New Graduate",
        department: "Product",
        snippet: "University graduate program for undergraduates.",
      })
    ).toBeNull();
  });

  it("rejects undergraduate internships even when the function area is relevant", () => {
    expect(
      matchMBAJobRole({
        title: "Product Management Intern",
        department: "Product",
        snippet: "Internship for undergraduate students.",
      })
    ).toBeNull();
  });

  it("rejects software-engineering roles even when they carry internship language", () => {
    expect(
      matchMBAJobRole({
        title: "Software Engineering Intern",
        department: "Engineering",
        snippet: "Campus internship for CS students.",
      })
    ).toBeNull();
  });

  it("keeps MBA leadership programs that carry explicit MBA and business-program signals", () => {
    expect(
      matchMBAJobRole({
        title: "MBA Leadership Program",
        department: "Business",
        snippet: "General management rotational program for MBA candidates.",
      })
    ).toEqual({
      roleFamilies: [],
      roleType: "unclear",
    });
  });

  it("matches adjacent business roles without requiring MBA in the title", () => {
    const match = matchMBAJobRole({
      title: "Product Operations Manager",
      department: "Strategy & Operations",
      snippet: "Own GTM operations and commercial planning for a product-led business.",
    });

    expect(match?.roleType).toBe("full-time");
    expect(match?.roleFamilies).toEqual(expect.arrayContaining(["operations"]));
  });

  it("matches decision science and lifecycle marketing roles as MBA-adjacent", () => {
    const decisionScienceMatch = matchMBAJobRole({
      title: "Senior Manager, Decision Science",
      department: "Strategy & Analytics",
      snippet: "Lead market intelligence and business insights for growth planning.",
    });

    expect(decisionScienceMatch?.roleType).toBe("full-time");
    expect(decisionScienceMatch?.roleFamilies).toEqual(
      expect.arrayContaining(["strategy", "analytics"])
    );

    expect(
      matchMBAJobRole({
        title: "Lifecycle Marketing Lead",
        department: "Growth",
        snippet: "Own retention, CRM, and acquisition programs.",
      })
    ).toEqual({
      roleFamilies: ["growth"],
      roleType: "full-time",
    });
  });

  it("matches risk and revenue strategy roles while keeping engineering exclusions", () => {
    const match = matchMBAJobRole({
      title: "Risk Strategy Manager",
      department: "Risk",
      snippet: "Partner with finance and operations leaders on risk management programs.",
    });

    expect(match?.roleType).toBe("full-time");
    expect(match?.roleFamilies).toEqual(
      expect.arrayContaining(["strategy", "finance"])
    );
  });
});
