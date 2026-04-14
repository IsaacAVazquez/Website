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
});
