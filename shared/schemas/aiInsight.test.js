import { describe, it, expect } from "vitest";
import {
  AiInsightSchema,
  AiInsightWireSchema,
  AiModelWireResponseSchema,
} from "./aiInsight.js";

function validInsight(overrides = {}) {
  return {
    findingId: "README_MISSING::root",
    explanation: "A README helps new contributors understand the project quickly.",
    priority: "medium",
    remediationSteps: ["Add a README.md with setup and usage instructions."],
    verificationSteps: ["Confirm README.md renders correctly on GitHub."],
    issueDraft: null,
    verifiedBy: "ai-suggestion",
    ...overrides,
  };
}

function validWireInsight(overrides = {}) {
  return {
    findingId: "README_MISSING::root",
    explanation: "A README helps new contributors understand the project quickly.",
    priority: "medium",
    remediationSteps: ["Add a README.md with setup and usage instructions."],
    verificationSteps: ["Confirm README.md renders correctly on GitHub."],
    hasIssueDraft: false,
    issueDraftTitle: "",
    issueDraftBody: "",
    referencedFiles: [],
    ...overrides,
  };
}

describe("AiInsightSchema", () => {
  it("accepts a well-formed insight", () => {
    expect(AiInsightSchema.safeParse(validInsight()).success).toBe(true);
  });

  it("rejects an insight claiming deterministic-rule verification", () => {
    const result = AiInsightSchema.safeParse(
      validInsight({ verifiedBy: "deterministic-rule" })
    );
    expect(result.success).toBe(false);
  });

  it("rejects an invalid priority value", () => {
    const result = AiInsightSchema.safeParse(validInsight({ priority: "urgent!!" }));
    expect(result.success).toBe(false);
  });

  it("requires at least one remediation step", () => {
    const result = AiInsightSchema.safeParse(validInsight({ remediationSteps: [] }));
    expect(result.success).toBe(false);
  });

  it("accepts a populated issue draft", () => {
    const result = AiInsightSchema.safeParse(
      validInsight({ issueDraft: { title: "Add README", body: "Please add a README." } })
    );
    expect(result.success).toBe(true);
  });
});

describe("AiInsightWireSchema / AiModelWireResponseSchema", () => {
  it("accepts a well-formed wire insight", () => {
    expect(AiInsightWireSchema.safeParse(validWireInsight()).success).toBe(true);
  });

  it("rejects a wire insight missing referencedFiles", () => {
    const wire = validWireInsight();
    delete wire.referencedFiles;
    expect(AiInsightWireSchema.safeParse(wire).success).toBe(false);
  });

  it("validates a full model response envelope", () => {
    const result = AiModelWireResponseSchema.safeParse({
      insights: [validWireInsight(), validWireInsight({ findingId: "LICENSE_MISSING::root" })],
    });
    expect(result.success).toBe(true);
  });

  it("rejects malformed JSON shape (wrong type for insights)", () => {
    const result = AiModelWireResponseSchema.safeParse({ insights: "not-an-array" });
    expect(result.success).toBe(false);
  });

  it("caps the number of insights accepted in one response", () => {
    const manyInsights = Array.from({ length: 51 }, (_, i) =>
      validWireInsight({ findingId: `RULE::file-${i}` })
    );
    const result = AiModelWireResponseSchema.safeParse({ insights: manyInsights });
    expect(result.success).toBe(false);
  });
});
