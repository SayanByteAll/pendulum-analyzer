import { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SegmentResult } from "../api/types";
import { type Msg, UNITS, useI18n } from "../i18n";
import { num, pm } from "../lib/format";
import { amplitudeFactor } from "../lib/physics";
import { LegendItem, TooltipBox } from "./ChartTooltip";
import { SERIES } from "./series";

const M = {
  noAngle: {
    kk: "Амплитуда бұрышы анықталмады: аспа нүктесін немесе масштабты белгілеңіз, не болмаса амплитуда аспа нүктесін доға бойынша табуға тым кіші.",
    ru: "Угол амплитуды не определён: отметьте точку подвеса или масштаб, либо амплитуда слишком мала, чтобы найти подвес по дуге.",
    en: "The amplitude angle could not be determined: mark the pivot point or the scale, or the amplitude is too small to find the pivot from the arc.",
  },
  periods: { kk: "Жеке периодтар", ru: "Отдельные периоды", en: "Individual periods" },
  theory: { kk: "Теория T₀(1 + θ²/16 + …)", ru: "Теория T₀(1 + θ²/16 + …)", en: "Theory T₀(1 + θ²/16 + …)" },
  fit: (k: string, theory: string): Msg => ({
    kk: `Жуықтау: k = ${k} (теория бойынша ${theory})`,
    ru: `Подгонка: k = ${k} (теория ${theory})`,
    en: `Fit: k = ${k} (theory ${theory})`,
  }),
  xAxis: { kk: "амплитуда θ", ru: "амплитуда θ", en: "amplitude θ" },
  yAxis: { kk: "T − T₀, мс", ru: "T − T₀, мс", en: "T − T₀, ms" },
  period: { kk: "Период", ru: "Период", en: "Period" },
  t0Note: (t0: string): Msg => ({
    kk: `T₀ = ${t0} с — кіші тербелістер кезіндегі период. Амплитуданы бұрышқа айналдыру үшін жіп ұзындығы:`,
    ru: `T₀ = ${t0} с — период при малых колебаниях. Длина нити для пересчёта амплитуды в угол:`,
    en: `T₀ = ${t0} s is the period for small oscillations. String length used to convert amplitude to angle:`,
  }),
  sourceArc: {
    kk: "траектория доғасы бойынша (аспа нүктесі автоматты түрде табылды)",
    ru: "по дуге траектории (подвес найден автоматически)",
    en: "from the arc of the trajectory (pivot found automatically)",
  },
  sourcePivot: { kk: "белгіленген аспа нүктесінен", ru: "от отмеченной точки подвеса", en: "from the marked pivot point" },
  sourceScale: {
    kk: "масштаб пен жазылған ұзындық бойынша",
    ru: "по масштабу и записанной длине",
    en: "from the scale and the recorded length",
  },
};

interface Point {
  theta: number;
  dt: number;
  period: number;
}

/**
 * Отдельные периоды против амплитуды: превышение над T₀ (мс). Теория — T₀·(1 + θ²/16 + …);
 * если точки ложатся на кривую, поправка на амплитуду подтверждена экспериментально.
 */
export function AmplitudeChart({ result }: { result: SegmentResult }) {
  const { t } = useI18n();
  const t0 = result.t0;
  const { points, theory, fit } = useMemo(() => {
    if (t0 === null) return { points: [], theory: [], fit: [] };
    const pts: Point[] = result.period_values.map((period, i) => ({
      theta: result.period_amplitudes_deg[i] ?? 0,
      dt: (period - t0) * 1000,
      period,
    }));
    const thetas = pts.map((p) => p.theta);
    const lo = Math.max(0, Math.min(...thetas) - 2);
    const hi = Math.max(...thetas) + 2;
    const grid = Array.from({ length: 40 }, (_, i) => lo + ((hi - lo) * i) / 39);
    const k = result.amplitude_k;
    const rad2 = (deg: number) => ((deg * Math.PI) / 180) ** 2;
    // Свободная подгонка T = a·(1 + k·θ²): свой свободный член a, а не T₀ серии.
    const a =
      k === null
        ? t0
        : pts.reduce((sum, p) => sum + p.period, 0) / pts.reduce((sum, p) => sum + 1 + k * rad2(p.theta), 0);
    return {
      points: pts,
      theory: grid.map((theta) => ({ theta, dt: t0 * (amplitudeFactor(theta) - 1) * 1000 })),
      fit: k === null ? [] : grid.map((theta) => ({ theta, dt: (a * (1 + k * rad2(theta)) - t0) * 1000 })),
    };
  }, [result, t0]);

  if (t0 === null || points.length === 0) {
    return (
      <p className="muted small">{t(M.noAngle)}</p>
    );
  }

  return (
    <div>
      <div className="chart-legend">
        <LegendItem color={SERIES.camera} label={t(M.periods)} />
        <LegendItem color={SERIES.theory} label={t(M.theory)} kind="dashed" />
        {fit.length > 0 && (
          <LegendItem
            color={SERIES.fit}
            label={t(M.fit(pm(result.amplitude_k, result.amplitude_k_se), num(0.0625, 4)))}
            kind="line"
          />
        )}
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
            <CartesianGrid stroke={SERIES.grid} vertical={false} />
            <XAxis
              dataKey="theta"
              type="number"
              domain={["dataMin", "dataMax"]}
              stroke={SERIES.axis}
              tickFormatter={(v: number) => `${num(v, 0)}°`}
              label={{ value: t(M.xAxis), position: "insideBottomRight", offset: -14 }}
            />
            <YAxis
              type="number"
              domain={["auto", "auto"]}
              width={56}
              stroke={SERIES.axis}
              tickFormatter={(v: number) => num(v, 1)}
              label={{ value: t(M.yAxis), angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as Point | undefined;
                if (!active || !row || row.period === undefined) return null;
                return (
                  <TooltipBox
                    title={`θ = ${num(row.theta, 1)}°`}
                    rows={[
                      { color: SERIES.camera, label: t(M.period), value: `${num(row.period, 5)} ${t(UNITS.s)}` },
                      { label: "T − T₀", value: `${num(row.dt, 2)} ${t(UNITS.ms)}` },
                    ]}
                  />
                );
              }}
            />
            <Line data={theory} dataKey="dt" stroke={SERIES.theory} strokeDasharray="5 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            {fit.length > 0 && (
              <Line data={fit} dataKey="dt" stroke={SERIES.fit} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            )}
            <Scatter data={points} dataKey="dt" fill={SERIES.camera} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="muted small" style={{ margin: 0 }}>
        {t(M.t0Note(pm(t0, result.t0_se)))}{" "}
        {t(result.length_px_source === "arc" ? M.sourceArc : result.length_px_source === "pivot" ? M.sourcePivot : M.sourceScale)}.
      </p>
    </div>
  );
}
