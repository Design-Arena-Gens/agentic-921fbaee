import { computeReadinessScore, readinessInsight } from "@/lib/readiness";

describe("computeReadinessScore", () => {
  it("rewards detailed inputs", () => {
    const score = computeReadinessScore({
      clientName: "Jordan",
      businessName: "Summit Dental",
      phoneNumber: "+15551231234",
      appointmentGoal: "Schedule a detailed oral surgery consultation for Maria",
      preferredDate: "2024-12-01",
      notes: "Mention insurance coverage",
      script: "Hello this is Jordan calling from Summit Dental..."
    });

    expect(score).toBeGreaterThan(80);
  });

  it("caps the score at 100", () => {
    const score = computeReadinessScore({
      clientName: "A",
      businessName: "B",
      phoneNumber: "+15551231234",
      appointmentGoal: "This is a sufficiently long goal string to trigger scoring",
      preferredDate: "2024-12-01",
      notes: "notes",
      script: "word ".repeat(100)
    });

    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("readinessInsight", () => {
  it("encourages script creation when missing", () => {
    const insight = readinessInsight(42, false);
    expect(insight).toMatch(/Generate or craft/);
  });

  it("praises high readiness", () => {
    const insight = readinessInsight(90, true);
    expect(insight).toMatch(/Excellent/);
  });
});
