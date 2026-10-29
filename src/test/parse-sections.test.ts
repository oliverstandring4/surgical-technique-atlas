import { describe, expect, it } from "vitest";
import { CONDITION_RULES, OPERATION_RULES, parseSections } from "@/lib/parse-sections";

describe("parseSections", () => {
  it("splits an operation note; pearls/pitfalls lines stay in the section they follow", () => {
    const r = parseSections(
      "Pre-op: CT pancreas protocol\nSetup\nSupine, arms out\nPorts & incisions: chevron\n## Key steps\n1. Kocher\nPearls: stay on SMA\nPitfalls\nRHCV bleed\nPost-op / ERAS\nPOD1 clears",
      OPERATION_RULES,
    );
    expect(r.pre_op).toBe("CT pancreas protocol");
    expect(r.setup).toBe("Supine, arms out\nchevron");
    expect(r.intra_op).toBe("1. Kocher\nPearls: stay on SMA\nPitfalls\nRHCV bleed");
    expect(r.post_op).toBe("POD1 clears");
  });
  it("splits a condition workup", () => {
    const r = parseSections(
      "H&P: neck mass\nLabs\nTSH\nImaging: US neck\nData\nBethesda\nRecommendations\nFNA if >1 cm",
      CONDITION_RULES,
    );
    expect(r).toEqual({
      history_physical: "neck mass",
      labs: "TSH",
      imaging: "US neck",
      data: "Bethesda",
      recommendations: "FNA if >1 cm",
    });
  });
  it("does not treat long sentences as headings", () => {
    expect(
      parseSections(
        "Setup\nPositioning is supine with both arms tucked and a bump under the right flank always",
        OPERATION_RULES,
      ).setup,
    ).toContain("Positioning is supine");
  });
});
