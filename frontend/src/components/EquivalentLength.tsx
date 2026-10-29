import { useI18n } from "../i18n";
import { DASH, num } from "../lib/format";
import { equivalentLength } from "../lib/physics";

const M = {
  hint: {
    kk: "Осындай периоды бар идеал маятниктің ұзындығы. Өлшенген ұзындықтан айырмасы тербеліс центрінің шын мәнінде қай жерде екенін көрсетеді",
    ru: "Длина идеального маятника с таким периодом. Отличие от измеренной показывает, где на самом деле центр качания",
    en: "Length of an ideal pendulum with this period. The difference from the measured length shows where the centre of oscillation really is",
  },
};

interface Props {
  t0: number | null | undefined;
  g: number;
  /** Длина, измеренная линейкой (если серия привязана), — чтобы показать разницу. */
  measured?: number | null;
}

/**
 * Длина «по периоду» и её отличие от измеренной. Это не ошибка распознавания: у реального
 * маятника центр качания ниже точки, до которой мерили линейкой (центр шарика, ушко, перегиб
 * нити на крючке), поэтому эффективная длина обычно на 1–3 см больше.
 */
export function EquivalentLength({ t0, g, measured }: Props) {
  const { t } = useI18n();
  if (!t0) return <>{DASH}</>;
  const length = equivalentLength(t0, g);
  const delta = measured ? length - measured : null;
  return (
    <span title={t(M.hint)}>
      {num(length, 1)}
      {delta !== null && (
        <span className="muted small">
          {" "}
          ({delta >= 0 ? "+" : "−"}
          {num(Math.abs(delta), 1)})
        </span>
      )}
    </span>
  );
}
