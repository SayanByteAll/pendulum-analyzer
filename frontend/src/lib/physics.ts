/** T/T₀ ≈ 1 + θ²/16 + 11θ⁴/3072 — то же, что backend/app/science/physics.py. */
export function amplitudeFactor(amplitudeDeg: number | null | undefined): number {
  if (!amplitudeDeg) return 1;
  const theta = (amplitudeDeg * Math.PI) / 180;
  return 1 + theta ** 2 / 16 + (11 * theta ** 4) / 3072;
}

/** L = g·T₀²/4π² (в сантиметрах) — длина идеального маятника с таким периодом. */
export function equivalentLength(t0: number, g: number): number {
  return ((g * t0 * t0) / (4 * Math.PI * Math.PI)) * 100;
}
