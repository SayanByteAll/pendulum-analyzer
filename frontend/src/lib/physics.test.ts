import { describe, expect, it } from "vitest";

import { amplitudeFactor, equivalentLength } from "./physics";

describe("physics", () => {
  it("matches the series expansion used by the backend", () => {
    expect(amplitudeFactor(null)).toBe(1);
    expect(amplitudeFactor(15)).toBeCloseTo(1.0043005, 6);
  });

  it("converts a period to the equivalent ideal-pendulum length", () => {
    // T₀ серии 40 см из реальной записи: центр качания ≈ на 3 см ниже точки замера.
    expect(equivalentLength(1.31493, 9.81)).toBeCloseTo(42.97, 1);
  });
});
