import { describe, expect, it } from "vitest";
import { findPhi } from "@/lib/phi-check";
import { parseFormattedNote } from "@/lib/parse-note";

describe("privacy warning", () => {
  it("flags a long digit string as MRN-like", () => {
    expect(findPhi(["MRN 12345678"]).map((w) => w.kind)).toContain("MRN-like number");
  });
  it("flags a full date", () => {
    expect(findPhi(["done 3/14/2025"]).map((w) => w.kind)).toContain("Full date");
  });
  it("flags a phone number", () => {
    expect(findPhi(["call 617-555-1234"]).map((w) => w.kind)).toEqual(["Phone number"]);
  });
  it("does not flag month/year or normal technique text", () => {
    expect(findPhi(["Mar 2025, 12mm port, 5-0 prolene, 30 degree scope"])).toEqual([]);
  });
  it("ignores digits inside image URLs", () => {
    expect(findPhi(['<img src="https://x/y?token=123456789012">'])).toEqual([]);
  });
});

describe("paste formatted note", () => {
  it("splits headings into the five fields", () => {
    const r = parseFormattedNote(
      "Indications:\nPDAC head\n\nSetup\nSupine, arms out\n## Key Steps\n1. Kocher\nPearls: stay on SMA\nPitfalls\nRHCV bleed",
    );
    expect(r.indications).toBe("PDAC head");
    expect(r.setup).toBe("Supine, arms out");
    expect(r.key_steps).toBe("1. Kocher");
    expect(r.pearls).toBe("stay on SMA");
    expect(r.pitfalls).toBe("RHCV bleed");
  });
});
