import { type FormEvent, useState } from "react";
import { Link } from "react-router";

import { useSeriesMutations } from "../api/hooks";
import type { Series } from "../api/types";
import { ErrorNotice } from "../components/Status";
import { EquivalentLength } from "../components/EquivalentLength";
import { LengthEditor } from "../components/LengthEditor";
import { VideosCard } from "../components/VideosCard";
import { type Msg, tr, UNITS, useI18n } from "../i18n";
import { DASH, num } from "../lib/format";
import { useExperimentContext } from "./experimentContext";

const M = {
  title: { kk: "Маятник ұзындықтары", ru: "Длины маятника", en: "Pendulum lengths" },
  mainSeries: (n: number): Msg => ({
    kk: `Негізгі серия: бір өлшемге ${n} тербеліс`,
    ru: `Основная серия: ${n} колебаний на замер`,
    en: `Main series: ${n} oscillations per trial`,
  }),
  intro: {
    kk: "Тәжірибе жүргізетін ұзындықтарды қосыңыз. T ~ √L тәуелділігін тексеру үшін бір-бірінен 4 есе ерекшеленетін жұптарды алған ыңғайлы (20 және 80 см, 25 және 100 см).",
    ru: "Добавьте длины, при которых будете проводить опыты. Для проверки зависимости T ~ √L удобно брать пары, отличающиеся в 4 раза (20 и 80 см, 25 и 100 см).",
    en: "Add the lengths at which you will run the experiments. To check the relation T ~ √L it is convenient to take pairs that differ by a factor of 4 (20 and 80 cm, 25 and 100 cm).",
  },
  manualTrials: (n: number): Msg => ({
    kk: `Қолмен өлшеулер (N = ${n})`,
    ru: `Ручных замеров (N = ${n})`,
    en: `Manual trials (N = ${n})`,
  }),
  tStopwatch: { kk: "T секундомер", ru: "T секундомер", en: "T stopwatch" },
  videoSegments: { kk: "Бейне бөліктері", ru: "Участков видео", en: "Video segments" },
  tCamera: { kk: "T камера", ru: "T камера", en: "T camera" },
  t0Camera: { kk: "T₀ камера", ru: "T₀ камера", en: "T₀ camera" },
  lByPeriodHint: {
    kk: "Осындай T₀ бар идеал маятниктің ұзындығы: L = g·T₀²/4π². Бұл өлшеу емес, период бойынша баға",
    ru: "Длина идеального маятника с таким T₀: L = g·T₀²/4π². Не измерение, а оценка по периоду",
    en: "Length of an ideal pendulum with this T₀: L = g·T₀²/4π². Not a measurement but an estimate from the period",
  },
  lByPeriod: { kk: "Период бойынша L", ru: "L по периоду", en: "L from period" },
  open: { kk: "Ашу", ru: "Открыть", en: "Open" },
  editLength: { kk: "Ұзындықты түзету", ru: "Исправить длину", en: "Correct length" },
  deleteHint: {
    kk: "Ұзындықты қолмен өлшеулерімен бірге жою (бейнелер қалады, бөліктер ажыратылады)",
    ru: "Удалить длину вместе с ручными замерами (видео останутся, участки отвяжутся)",
    en: "Delete the length together with its manual trials (videos stay, segments get unlinked)",
  },
  confirmDelete: (cm: number): Msg => ({
    kk: `${cm} см ұзындығын және оның қолмен өлшеулерін жою керек пе?`,
    ru: `Удалить длину ${cm} см и её ручные замеры?`,
    en: `Delete the length ${cm} cm and its manual trials?`,
  }),
  delete: { kk: "Жою", ru: "Удалить", en: "Delete" },
  addTitle: { kk: "Ұзындық қосу", ru: "Добавить длину", en: "Add a length" },
  lengthField: {
    kk: "Ұзындық L, см (жүктің центріне дейін)",
    ru: "Длина L, см (до центра груза)",
    en: "Length L, cm (to the centre of the bob)",
  },
  sigmaField: { kk: "Қателік σL, см", ru: "Погрешность σL, см", en: "Uncertainty σL, cm" },
  angleField: {
    kk: "Ауытқу бұрышы, ° (міндетті емес)",
    ru: "Угол отклонения, ° (необязательно)",
    en: "Release angle, ° (optional)",
  },
  add: { kk: "Қосу", ru: "Добавить", en: "Add" },
  quick: { kk: "Жылдам:", ru: "Быстро:", en: "Quick:" },
};

const PRESET_LENGTHS = [20, 25, 40, 60, 80, 100];

function quickStats(series: Series, mainPeriods: number) {
  const trials = series.trials.filter((t) => !t.excluded && t.periods === mainPeriods);
  const swMean = trials.length ? trials.reduce((a, t) => a + t.period_s, 0) / trials.length : null;
  const done = series.segments.filter((s) => !s.excluded && s.result);
  const mean = (values: number[]) => (values.length ? values.reduce((a, v) => a + v, 0) / values.length : null);
  return {
    trials: trials.length,
    swMean,
    camMean: mean(done.map((s) => s.result!.period)),
    camT0: mean(done.flatMap((s) => (s.result!.t0 ? [s.result!.t0] : []))),
    segments: done.length,
  };
}

export function MeasurementsPage() {
  const { experiment } = useExperimentContext();
  const { t } = useI18n();
  const { create, update, remove } = useSeriesMutations(experiment.id);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [length, setLength] = useState("");
  const [sigma, setSigma] = useState("0.3");
  const [angle, setAngle] = useState("");

  const existing = new Set(experiment.series.map((s) => s.length_cm));
  const parse = (v: string) => Number(v.replace(",", "."));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(
      {
        length_cm: parse(length),
        length_sigma_cm: parse(sigma),
        amplitude_deg: angle ? parse(angle) : null,
      },
      { onSuccess: () => setLength("") },
    );
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="card__title">
          <h2>{t(M.title)}</h2>
          <span className="muted small">
            {t(M.mainSeries(experiment.main_periods))}
          </span>
        </div>
        {experiment.series.length === 0 ? (
          <p className="secondary">
            {t(M.intro)}
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>L, {t(UNITS.cm)}</th>
                  <th>σL, {t(UNITS.cm)}</th>
                  <th>{t(M.manualTrials(experiment.main_periods))}</th>
                  <th>
                    {t(M.tStopwatch)}, {t(UNITS.s)}
                  </th>
                  <th>{t(M.videoSegments)}</th>
                  <th>
                    {t(M.tCamera)}, {t(UNITS.s)}
                  </th>
                  <th>
                    {t(M.t0Camera)}, {t(UNITS.s)}
                  </th>
                  <th title={t(M.lByPeriodHint)}>
                    {t(M.lByPeriod)}, {t(UNITS.cm)}
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {experiment.series.map((s) => {
                  const q = quickStats(s, experiment.main_periods);
                  return (
                    <tr key={s.id}>
                      {editingId === s.id ? (
                        <td colSpan={2}>
                          <LengthEditor
                            series={s}
                            busy={update.isPending}
                            onCancel={() => setEditingId(null)}
                            onSave={(patch) =>
                              update.mutate({ id: s.id, patch }, { onSuccess: () => setEditingId(null) })
                            }
                          />
                        </td>
                      ) : (
                        <>
                          <td>
                            <Link to={`series/${s.id}`}>
                              <strong>{num(s.length_cm, 1)}</strong>
                            </Link>
                          </td>
                          <td>{num(s.length_sigma_cm, 1)}</td>
                        </>
                      )}
                      <td>{q.trials || DASH}</td>
                      <td>{num(q.swMean, 4)}</td>
                      <td>{q.segments || DASH}</td>
                      <td>{num(q.camMean, 5)}</td>
                      <td>{num(q.camT0, 5)}</td>
                      <td>
                        <EquivalentLength t0={q.camT0} g={experiment.g_reference} measured={s.length_cm} />
                      </td>
                      <td className="actions">
                        <div className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
                          <Link className="button small" to={`series/${s.id}`}>
                            {t(M.open)}
                          </Link>
                          <button
                            className="small ghost icon"
                            title={t(M.editLength)}
                            aria-label={t(M.editLength)}
                            onClick={() => setEditingId(s.id)}
                          >
                            ✎
                          </button>
                          <button
                            className="small ghost danger"
                            title={t(M.deleteHint)}
                            onClick={() => {
                              if (confirm(tr(M.confirmDelete(s.length_cm))))
                                remove.mutate(s.id);
                            }}
                          >
                            {t(M.delete)}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <VideosCard experiment={experiment} />

      <form className="card stack" onSubmit={submit}>
        <h3>{t(M.addTitle)}</h3>
        <div className="form-row">
          <label className="field">
            {t(M.lengthField)}
            <input
              inputMode="decimal"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="60"
              required
            />
          </label>
          <label className="field">
            {t(M.sigmaField)}
            <input inputMode="decimal" value={sigma} onChange={(e) => setSigma(e.target.value)} />
          </label>
          <label className="field">
            {t(M.angleField)}
            <input
              inputMode="decimal"
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              placeholder="5–7"
            />
          </label>
          <button className="primary" type="submit" disabled={!length || create.isPending}>
            {t(M.add)}
          </button>
        </div>
        <div className="row small">
          <span className="muted">{t(M.quick)}</span>
          {PRESET_LENGTHS.filter((l) => !existing.has(l)).map((l) => (
            <button
              key={l}
              type="button"
              className="small"
              disabled={create.isPending}
              onClick={() => create.mutate({ length_cm: l, length_sigma_cm: parse(sigma) || 0.3 })}
            >
              {l} {t(UNITS.cm)}
            </button>
          ))}
        </div>
        {create.isError && <ErrorNotice error={create.error} />}
      </form>
    </div>
  );
}
