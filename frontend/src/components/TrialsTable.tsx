import { type FormEvent, useMemo, useState } from "react";

import type { Trial, TrialInput } from "../api/types";
import { UNITS, useI18n } from "../i18n";
import { DASH, num } from "../lib/format";

const M = {
  periods: { kk: "Тербеліс саны N", ru: "N колебаний", en: "N oscillations" },
  time: {
    kk: "Уақыт t, с (сыртқы секундомерден)",
    ru: "Время t, с (с внешнего секундомера)",
    en: "Time t, s (from an external stopwatch)",
  },
  add: { kk: "Қосу", ru: "Добавить", en: "Add" },
  empty: { kk: "Әзірге өлшемдер жоқ.", ru: "Замеров пока нет.", en: "No trials yet." },
  who: { kk: "Кім", ru: "Кто", en: "Who" },
  outlierHint: {
    kk: "Басқаларынан қатты ерекшеленеді — тербелістерді санағанда қателесіп кеткен болуы мүмкін",
    ru: "Сильно отличается от остальных — возможно, сбились со счёта колебаний",
    en: "Differs strongly from the others — the oscillation count may have been lost",
  },
  outlier: { kk: "! шығыңқы мән?", ru: "! выброс?", en: "! outlier?" },
  sourceApp: { kk: "кіріктірілген секундомер", ru: "встроенный секундомер", en: "built-in stopwatch" },
  sourceManual: { kk: "қолмен енгізілген", ru: "введено вручную", en: "entered manually" },
  include: { kk: "Есептеуге қайтару", ru: "Вернуть в расчёт", en: "Include in calculation" },
  exclude: { kk: "Есептеуден шығару", ru: "Исключить из расчёта", en: "Exclude from calculation" },
  remove: { kk: "Өлшемді жою", ru: "Удалить замер", en: "Delete trial" },
};

interface Props {
  trials: Trial[];
  mainPeriods: number;
  busy: boolean;
  onAdd: (input: TrialInput) => void;
  onToggle: (trial: Trial) => void;
  onDelete: (trial: Trial) => void;
}

function stats(values: number[]) {
  if (values.length === 0) return null;
  const mean = values.reduce((a, v) => a + v, 0) / values.length;
  const std =
    values.length > 1
      ? Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / (values.length - 1))
      : null;
  return { mean, std, n: values.length };
}

export function TrialsTable({ trials, mainPeriods, busy, onAdd, onToggle, onDelete }: Props) {
  const { t } = useI18n();
  const [periods, setPeriods] = useState(String(mainPeriods));
  const [time, setTime] = useState("");

  const groups = useMemo(() => {
    const byN = new Map<number, number[]>();
    for (const t of trials) {
      if (t.excluded) continue;
      byN.set(t.periods, [...(byN.get(t.periods) ?? []), t.period_s]);
    }
    return [...byN.entries()]
      .sort(([a], [b]) => a - b)
      .map(([periods, values]) => ({ periods, ...stats(values)! }));
  }, [trials]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const total = Number(time.replace(",", "."));
    const n = Number(periods);
    if (!(total > 0) || !(n >= 1)) return;
    onAdd({ periods: n, total_time_s: total, source: "manual" });
    setTime("");
  };

  return (
    <div className="stack">
      <form className="form-row" onSubmit={submit}>
        <label className="field">
          {t(M.periods)}
          <input inputMode="numeric" value={periods} onChange={(e) => setPeriods(e.target.value)} />
        </label>
        <label className="field">
          {t(M.time)}
          <input
            inputMode="decimal"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="15,62"
          />
        </label>
        <button type="submit" disabled={!time || busy}>
          {t(M.add)}
        </button>
      </form>

      {groups.length > 0 && (
        <div className="row small secondary">
          {groups.map((g) => (
            <span key={g.periods} className="badge">
              N = {g.periods}: T̄ = {num(g.mean, 4)} {t(UNITS.s)}, σ = {g.std === null ? DASH : num(g.std, 4)} {t(UNITS.s)}
              (n = {g.n})
            </span>
          ))}
        </div>
      )}

      {trials.length === 0 ? (
        <p className="muted small">{t(M.empty)}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>N</th>
                <th>t, {t(UNITS.s)}</th>
                <th>T = t/N, {t(UNITS.s)}</th>
                <th className="left">{t(M.who)}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {trials.map((trial, i) => (
                <tr key={trial.id} className={trial.excluded ? "excluded" : undefined}>
                  <td>{i + 1}</td>
                  <td>{trial.periods}</td>
                  <td>{num(trial.total_time_s, 2)}</td>
                  <td>
                    {num(trial.period_s, 4)}{" "}
                    {trial.suspected_outlier && !trial.excluded && (
                      <span className="badge badge--warn" title={t(M.outlierHint)}>
                        {t(M.outlier)}
                      </span>
                    )}
                  </td>
                  <td className="left secondary" title={t(trial.source === "app" ? M.sourceApp : M.sourceManual)}>
                    {trial.operator || DASH}
                    {trial.source === "app" ? " ⏱" : ""}
                  </td>
                  <td className="actions">
                    <div className="row" style={{ gap: 2, flexWrap: "nowrap" }}>
                      <button
                        className="small ghost icon"
                        title={t(trial.excluded ? M.include : M.exclude)}
                        aria-label={t(trial.excluded ? M.include : M.exclude)}
                        onClick={() => onToggle(trial)}
                      >
                        {trial.excluded ? "↺" : "⊘"}
                      </button>
                      <button
                        className="small ghost danger icon"
                        title={t(M.remove)}
                        aria-label={t(M.remove)}
                        onClick={() => onDelete(trial)}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
