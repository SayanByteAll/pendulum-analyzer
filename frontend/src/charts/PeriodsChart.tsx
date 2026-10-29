import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SegmentResult } from "../api/types";
import { type Msg, UNITS, useI18n } from "../i18n";
import { num } from "../lib/format";
import { LegendItem, TooltipBox } from "./ChartTooltip";
import { SERIES } from "./series";

const M = {
  deviationLegend: {
    kk: "Жеке периодтың орташадан ауытқуы, мс",
    ru: "Отдельный период минус средний, мс",
    en: "Individual period minus mean, ms",
  },
  meanT: (value: string): Msg => ({
    kk: `Орташа T = ${value} с`,
    ru: `Средний T = ${value} с`,
    en: `Mean T = ${value} s`,
  }),
  tAxis: { kk: "t, с", ru: "t, с", en: "t, s" },
  period: { kk: "Период", ru: "Период", en: "Period" },
  deviation: { kk: "Ауытқу", ru: "Отклонение", en: "Deviation" },
};

/** Каждый отдельный период по видео: видно и случайный разброс, и медленный дрейф с амплитудой. */
export function PeriodsChart({ result }: { result: SegmentResult }) {
  const { t } = useI18n();
  const data = result.period_values.map((value, i) => ({
    t: result.period_value_times[i] ?? 0,
    ms: (value - result.period) * 1000,
    value,
  }));
  if (data.length === 0) return null;

  return (
    <div>
      <div className="chart-legend">
        <LegendItem color={SERIES.camera} label={t(M.deviationLegend)} />
        <LegendItem color={SERIES.theory} label={t(M.meanT(num(result.period, 5)))} kind="line" />
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 12, bottom: 20, left: 4 }}>
            <CartesianGrid stroke={SERIES.grid} vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: number) => num(v, 0)}
              stroke={SERIES.axis}
              label={{ value: t(M.tAxis), position: "insideBottomRight", offset: -12 }}
            />
            <YAxis
              dataKey="ms"
              type="number"
              width={52}
              tickFormatter={(v: number) => num(v, 1)}
              stroke={SERIES.axis}
            />
            <ReferenceLine y={0} stroke={SERIES.theory} strokeWidth={1.5} />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as (typeof data)[number] | undefined;
                if (!active || !row) return null;
                return (
                  <TooltipBox
                    title={`t ≈ ${num(row.t, 2)} ${t(UNITS.s)}`}
                    rows={[
                      { color: SERIES.camera, label: t(M.period), value: `${num(row.value, 4)} ${t(UNITS.s)}` },
                      { label: t(M.deviation), value: `${num(row.ms, 2)} ${t(UNITS.ms)}` },
                    ]}
                  />
                );
              }}
            />
            <Scatter data={data} fill={SERIES.camera} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
