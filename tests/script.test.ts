import { generateFallbackScript } from "@/lib/script";

describe("generateFallbackScript", () => {
  it("creates a friendly script including goal and timing", () => {
    const script = generateFallbackScript({
      clientName: "Jordan",
      businessName: "Summit Dental",
      appointmentGoal: "Schedule a follow-up cleaning for Maria Lopez",
      preferredDate: "2024-12-01",
      preferredTimeWindow: "between 2-4 PM",
      notes: "She prefers Tuesdays."
    });

    expect(script).toContain("Jordan");
    expect(script).toContain("Summit Dental");
    expect(script).toContain("Schedule a follow-up cleaning for Maria Lopez");
    expect(script).toMatch(/between 2-4 PM/);
    expect(script).toMatch(/Additional context: She prefers Tuesdays\./);
  });

  it("falls back gracefully when date is invalid", () => {
    const script = generateFallbackScript({
      clientName: "Alex",
      businessName: "Northside Clinic",
      appointmentGoal: "Book a primary care consultation",
      preferredDate: "not-a-valid-date",
      preferredTimeWindow: "",
      notes: ""
    });

    expect(script).toContain("not-a-valid-date");
  });
});
