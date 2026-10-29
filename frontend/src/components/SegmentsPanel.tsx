import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { api } from "../api/client";
import { keys, useSegmentMutations } from "../api/hooks";
import type { ExperimentDetail, Segment, Video } from "../api/types";
import { type Msg, UNITS, useI18n } from "../i18n";
import { translateServerMessage } from "../i18n/serverMessages";
import { DASH, num, pm } from "../lib/format";
import { parseLengths } from "../lib/lengths";
import { equivalentLength } from "../lib/physics";
import { EquivalentLength } from "./EquivalentLength";
import { ErrorNotice } from "./Status";

const M = {
  autoResult: (linked: number, left: number): Msg => ({
    kk:
      `Период бойынша байланыстырылды: ${linked}.` +
      (left ? ` Байланыстырылмады: ${left} — бірде-бір ұзындық бірмәнді сәйкес келмейді, қолмен таңдаңыз.` : ""),
    ru:
      `Привязано по периоду: ${linked}.` +
      (left ? ` Не привязано: ${left} — ни одна длина не подходит однозначно, выберите вручную.` : ""),
    en:
      `Assigned by period: ${linked}.` +
      (left ? ` Not assigned: ${left}: no length matches unambiguously, choose manually.` : ""),
  }),
  needLengthsTitle: {
    kk: "Алдымен эксперимент бетінде ұзындықтарды қосыңыз",
    ru: "Сначала добавьте длины на странице эксперимента",
    en: "Add lengths on the experiment page first",
  },
  autoTitle: {
    kk: "Әрбір байланыстырылмаған бөлікті теориялық периоды T₀-ге ең жақын ұзындыққа байланыстырады",
    ru: "Каждый непривязанный участок — к длине, теоретический период которой ближе всего к T₀",
    en: "Assigns each unassigned segment to the length whose theoretical period is closest to T₀",
  },
  autoAssign: { kk: "Период бойынша байланыстыру", ru: "Привязать по периоду", en: "Assign by period" },
  needLengthsHint: {
    kk: "Алдымен сызғышпен өлшенген ұзындықтарды қосыңыз:",
    ru: "Сначала добавьте длины, измеренные линейкой:",
    en: "First add the lengths measured with a ruler:",
  },
  lengthsList: (list: string): Msg => ({
    kk: `Ұзындықтар: ${list} см`,
    ru: `Длины: ${list} см`,
    en: `Lengths: ${list} cm`,
  }),
  addLengthsAria: { kk: "Ұзындықтарды қосу, см", ru: "Добавить длины, см", en: "Add lengths, cm" },
  addLengths: { kk: "Ұзындықтарды қосу", ru: "Добавить длины", en: "Add lengths" },
  noSegments: { kk: "Әзірге бөліктер жоқ.", ru: "Участков пока нет.", en: "No segments yet." },
  time: { kk: "Уақыт, с", ru: "Время, с", en: "Time, s" },
  oscillations: { kk: "Тербеліс саны", ru: "Колебаний", en: "Oscillations" },
  meanT: { kk: "Орташа T, с", ru: "T средний, с", en: "Mean T, s" },
  t0: { kk: "T₀ (кіші тербел.), с", ru: "T₀ (малые колеб.), с", en: "T₀ (small osc.), s" },
  amplitude: { kk: "Амплитуда", ru: "Амплитуда", en: "Amplitude" },
  lFromPeriodTitle: {
    kk: "Осындай T₀ бар идеал маятниктің ұзындығы: L = g·T₀²/4π². Бұл өлшеу емес, период бойынша жасалған баға; жақшада — серия ұзындығынан айырмасы",
    ru: "Длина идеального маятника с таким T₀: L = g·T₀²/4π². Это не измерение, а оценка по периоду; в скобках — отличие от длины серии",
    en: "Length of an ideal pendulum with this T₀: L = g·T₀²/4π². This is not a measurement but an estimate from the period; in brackets is the difference from the series length",
  },
  lFromPeriod: { kk: "Период бойынша L, см", ru: "L по периоду, см", en: "L from period, cm" },
  seriesLength: { kk: "Серия ұзындығы", ru: "Длина серии", en: "Series length" },
  auto: { kk: "автоматты түрде табылған", ru: "найден автоматически", en: "found automatically" },
  manual: { kk: "қолмен берілген", ru: "задан вручную", en: "set manually" },
  notAssigned: { kk: "— байланыстырылмаған —", ru: "— не привязан —", en: "— not assigned —" },
  newLengthOption: { kk: "+ жаңа ұзындық…", ru: "+ новая длина…", en: "+ new length…" },
  editBounds: { kk: "Шекараларын өзгерту", ru: "Изменить границы", en: "Edit bounds" },
  include: { kk: "Есептеуге қайтару", ru: "Вернуть в расчёт", en: "Include in calculation" },
  exclude: { kk: "Есептеуден шығару", ru: "Исключить из расчёта", en: "Exclude from calculation" },
  deleteSegment: { kk: "Бөлікті жою", ru: "Удалить участок", en: "Delete segment" },
  newLengthFor: (from: string, to: string): Msg => ({
    kk: `${from}–${to} с бөлігі үшін жаңа ұзындық. Сызғышпен өлшенген ұзындықты енгізіңіз.`,
    ru: `Новая длина для участка ${from}–${to} с. Введите длину, измеренную линейкой.`,
    en: `New length for the segment ${from}–${to} s. Enter the length measured with a ruler.`,
  }),
  checkByPeriod: (value: string): Msg => ({
    kk: `Салыстыру үшін: период бойынша ≈ ${value} см`,
    ru: `Для сверки: по периоду ≈ ${value} см`,
    en: `For comparison: from the period ≈ ${value} cm`,
  }),
  checkByVideo: (value: string): Msg => ({
    kk: `, бейне бойынша (доға + масштаб) ≈ ${value} см`,
    ru: `, по видео (дуга + масштаб) ≈ ${value} см`,
    en: `, from the video (arc + scale) ≈ ${value} cm`,
  }),
  effectiveNote: {
    kk: ". Эффективті ұзындық әдетте өлшенгеннен 1–3 см артық болады — бұл қалыпты жағдай.",
    ru: ". Эффективная длина обычно на 1–3 см больше измеренной — это нормально.",
    en: ". The effective length is usually 1–3 cm longer than the measured one; this is normal.",
  },
  lengthLabel: { kk: "L, см", ru: "L, см", en: "L, cm" },
  example: { kk: "мысалы, 60", ru: "например, 60", en: "e.g. 60" },
  createAndAssign: { kk: "Құру және байланыстыру", ru: "Создать и привязать", en: "Create and assign" },
  cancel: { kk: "Болдырмау", ru: "Отмена", en: "Cancel" },
  customFrom: { kk: "Өз бөлігіңіз: басы, с", ru: "Свой участок: от, с", en: "Custom segment: from, s" },
  customTo: { kk: "соңы, с", ru: "до, с", en: "to, s" },
  addSegment: { kk: "Бөлік қосу", ru: "Добавить участок", en: "Add segment" },
};

interface Props {
  video: Video;
  experiment: ExperimentDetail;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

const parse = (v: string) => Number(v.replace(",", "."));

const periodOf = (segment: Segment) => segment.result?.t0 ?? segment.result?.period ?? null;

export function SegmentsPanel({ video, experiment, selectedId, onSelect }: Props) {
  const { t, lang } = useI18n();
  const mutations = useSegmentMutations(experiment.id, video.id);
  const client = useQueryClient();
  const invalidateExperiment = () => client.invalidateQueries({ queryKey: keys.experiment(experiment.id) });
  const [editing, setEditing] = useState<{ id: number; from: string; to: string } | null>(null);
  const [manual, setManual] = useState({ from: "", to: "" });
  const [creating, setCreating] = useState<number | null>(null);
  const [createError, setCreateError] = useState<unknown>(null);
  const error =
    mutations.update.error ?? mutations.create.error ?? mutations.remove.error ?? mutations.autoAssign.error ?? createError;
  const [autoResult, setAutoResult] = useState<{ linked: number; left: number } | null>(null);
  const lengthOf = (id: number | null) => experiment.series.find((x) => x.id === id)?.length_cm ?? null;
  const unassigned = video.segments.filter((x) => x.series_id === null && !x.excluded && x.result).length;

  const [lengthsInput, setLengthsInput] = useState("");
  const [addingLengths, setAddingLengths] = useState(false);
  const addLengths = async () => {
    const existing = new Set(experiment.series.map((x) => x.length_cm));
    const values = parseLengths(lengthsInput).filter((v) => !existing.has(v));
    if (values.length === 0) return;
    setAddingLengths(true);
    setCreateError(null);
    try {
      for (const length_cm of values) await api.createSeries(experiment.id, { length_cm });
      setLengthsInput("");
      await invalidateExperiment();
    } catch (err) {
      setCreateError(err);
    } finally {
      setAddingLengths(false);
    }
  };

  const runAutoAssign = () => {
    const before = new Set(video.segments.filter((x) => x.series_id !== null).map((x) => x.id));
    mutations.autoAssign.mutate(undefined, {
      onSuccess: (updated) => {
        const linked = updated.segments.filter((x) => x.series_id !== null && !before.has(x.id)).length;
        const left = updated.segments.filter((x) => x.series_id === null && !x.excluded).length;
        setAutoResult({ linked, left });
      },
    });
  };

  const [newLength, setNewLength] = useState<{ segment: Segment; value: string } | null>(null);

  const assign = (segment: Segment, value: string) => {
    if (value === "new") {
      // Поле пустое: длину задаёт человек по линейке. Оценки по видео и по периоду —
      // только подсказки рядом с полем, а не готовое значение.
      setNewLength({ segment, value: "" });
      return;
    }
    mutations.update.mutate({ id: segment.id, patch: { series_id: value ? Number(value) : null } });
  };

  const createSeries = async () => {
    if (!newLength || !(parse(newLength.value) > 0)) return;
    const { segment } = newLength;
    setCreating(segment.id);
    setCreateError(null);
    try {
      const series = await api.createSeries(experiment.id, { length_cm: parse(newLength.value) });
      await mutations.update.mutateAsync({ id: segment.id, patch: { series_id: series.id } });
      setNewLength(null);
    } catch (err) {
      setCreateError(err);
    } finally {
      setCreating(null);
    }
  };

  const saveBounds = () => {
    if (!editing) return;
    const original = video.segments.find((x) => x.id === editing.id);
    const unchanged =
      original &&
      Math.abs(parse(editing.from) - original.t_start) < 0.01 &&
      Math.abs(parse(editing.to) - original.t_end) < 0.01;
    if (unchanged) return setEditing(null); // ничего не меняли — участок остаётся автоматическим
    mutations.update.mutate(
      { id: editing.id, patch: { t_start: parse(editing.from), t_end: parse(editing.to) } },
      { onSuccess: () => setEditing(null) },
    );
  };

  return (
    <div className="stack">
      {video.segments.length > 0 && (
        <div className="row">
          <button
            onClick={runAutoAssign}
            disabled={!unassigned || experiment.series.length === 0 || mutations.autoAssign.isPending}
            title={experiment.series.length === 0 ? t(M.needLengthsTitle) : t(M.autoTitle)}
          >
            {t(M.autoAssign)}
          </button>
          <span className="muted small">
            {experiment.series.length === 0
              ? t(M.needLengthsHint)
              : t(M.lengthsList(experiment.series.map((x) => num(x.length_cm, 1)).join("; ")))}
          </span>
          <span className="spacer" />
          <form
            className="row"
            style={{ gap: 4 }}
            onSubmit={(e) => {
              e.preventDefault();
              void addLengths();
            }}
          >
            <input
              aria-label={t(M.addLengthsAria)}
              placeholder="60 40 20"
              style={{ width: 120 }}
              value={lengthsInput}
              onChange={(e) => setLengthsInput(e.target.value)}
            />
            <button type="submit" className="small" disabled={addingLengths || parseLengths(lengthsInput).length === 0}>
              {t(M.addLengths)}
            </button>
          </form>
        </div>
      )}
      {autoResult && <div className="notice">{t(M.autoResult(autoResult.linked, autoResult.left))}</div>}
      {video.segments.length === 0 ? (
        <p className="secondary small">{t(M.noSegments)}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{t(M.time)}</th>
                <th>{t(M.oscillations)}</th>
                <th>{t(M.meanT)}</th>
                <th>{t(M.t0)}</th>
                <th>{t(M.amplitude)}</th>
                <th title={t(M.lFromPeriodTitle)}>{t(M.lFromPeriod)}</th>
                <th className="left">{t(M.seriesLength)}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {video.segments.map((s, i) => {
                const r = s.result;
                const isEditing = editing?.id === s.id;
                return (
                  <tr
                    key={s.id}
                    className={s.excluded ? "excluded" : undefined}
                    style={s.id === selectedId ? { background: "var(--accent-soft)" } : undefined}
                  >
                    <td>
                      <button className="small ghost" onClick={() => onSelect(s.id === selectedId ? null : s.id)}>
                        {i + 1} {s.id === selectedId ? "▾" : "▸"}
                      </button>
                    </td>
                    <td>
                      {isEditing ? (
                        <span className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
                          <input
                            style={{ width: 70 }}
                            value={editing.from}
                            onChange={(e) => setEditing({ ...editing, from: e.target.value })}
                          />
                          –
                          <input
                            style={{ width: 70 }}
                            value={editing.to}
                            onChange={(e) => setEditing({ ...editing, to: e.target.value })}
                          />
                          <button className="small primary" onClick={saveBounds}>
                            ✓
                          </button>
                          <button className="small ghost" onClick={() => setEditing(null)}>
                            ✕
                          </button>
                        </span>
                      ) : (
                        <span title={s.auto ? t(M.auto) : t(M.manual)}>
                          {num(s.t_start, 1)}–{num(s.t_end, 1)}
                          {!s.auto && " ✎"}
                        </span>
                      )}
                    </td>
                    <td>{r ? num(r.periods_observed, 1) : DASH}</td>
                    <td>
                      {r ? (
                        pm(r.period, r.period_se, 5)
                      ) : (
                        <span className="badge badge--critical">! {s.error && translateServerMessage(s.error, lang)}</span>
                      )}
                    </td>
                    <td>{r?.t0 ? pm(r.t0, r.t0_se, 5) : DASH}</td>
                    <td>
                      {r?.theta_max_deg != null
                        ? `${num(r.theta_max_deg, 0)}° → ${num(r.theta_min_deg, 0)}°`
                        : r
                          ? `${num(r.amplitude_start_px, 0)} px`
                          : DASH}
                    </td>
                    <td>
                      <EquivalentLength t0={periodOf(s)} g={experiment.g_reference} measured={lengthOf(s.series_id)} />
                    </td>
                    <td className="left">
                      <select
                        value={s.series_id ?? ""}
                        disabled={creating === s.id || mutations.update.isPending}
                        onChange={(e) => assign(s, e.target.value)}
                        aria-label={t(M.seriesLength)}
                      >
                        <option value="">{t(M.notAssigned)}</option>
                        {experiment.series.map((series) => (
                          <option key={series.id} value={series.id}>
                            L = {num(series.length_cm, 1)} {t(UNITS.cm)}
                          </option>
                        ))}
                        <option value="new">{t(M.newLengthOption)}</option>
                      </select>
                    </td>
                    <td className="actions">
                      <div className="row" style={{ gap: 2, flexWrap: "nowrap" }}>
                        <button
                          className="small ghost icon"
                          title={t(M.editBounds)}
                          aria-label={t(M.editBounds)}
                          onClick={() => setEditing({ id: s.id, from: num(s.t_start, 2), to: num(s.t_end, 2) })}
                        >
                          ✎
                        </button>
                        <button
                          className="small ghost icon"
                          title={s.excluded ? t(M.include) : t(M.exclude)}
                          aria-label={s.excluded ? t(M.include) : t(M.exclude)}
                          onClick={() => mutations.update.mutate({ id: s.id, patch: { excluded: !s.excluded } })}
                        >
                          {s.excluded ? "↺" : "⊘"}
                        </button>
                        <button
                          className="small ghost danger icon"
                          title={t(M.deleteSegment)}
                          aria-label={t(M.deleteSegment)}
                          onClick={() => {
                            if (s.id === selectedId) onSelect(null);
                            mutations.remove.mutate(s.id);
                          }}
                        >
                          ✕
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

      {newLength && (
        <form
          className="notice stack"
          onSubmit={(e) => {
            e.preventDefault();
            void createSeries();
          }}
        >
          <div>
            {t(M.newLengthFor(num(newLength.segment.t_start, 1), num(newLength.segment.t_end, 1)))}{" "}
            <span className="muted">
              {t(
                M.checkByPeriod(
                  num(
                    periodOf(newLength.segment) && equivalentLength(periodOf(newLength.segment)!, experiment.g_reference),
                    1,
                  ),
                ),
              )}
              {newLength.segment.result?.length_from_video_cm != null &&
                t(M.checkByVideo(num(newLength.segment.result.length_from_video_cm, 1)))}
              {t(M.effectiveNote)}
            </span>
          </div>
          <div className="form-row">
            <label className="field">
              {t(M.lengthLabel)}
              <input
                inputMode="decimal"
                autoFocus
                placeholder={t(M.example)}
                value={newLength.value}
                onChange={(e) => setNewLength({ ...newLength, value: e.target.value })}
              />
            </label>
            <button className="primary" type="submit" disabled={creating !== null || !(parse(newLength.value) > 0)}>
              {t(M.createAndAssign)}
            </button>
            <button type="button" onClick={() => setNewLength(null)}>
              {t(M.cancel)}
            </button>
          </div>
        </form>
      )}

      <form
        className="form-row"
        onSubmit={(e) => {
          e.preventDefault();
          mutations.create.mutate(
            { t_start: parse(manual.from), t_end: parse(manual.to) },
            { onSuccess: () => setManual({ from: "", to: "" }) },
          );
        }}
      >
        <label className="field">
          {t(M.customFrom)}
          <input inputMode="decimal" value={manual.from} onChange={(e) => setManual({ ...manual, from: e.target.value })} />
        </label>
        <label className="field">
          {t(M.customTo)}
          <input inputMode="decimal" value={manual.to} onChange={(e) => setManual({ ...manual, to: e.target.value })} />
        </label>
        <button type="submit" disabled={!manual.from || !manual.to || mutations.create.isPending}>
          {t(M.addSegment)}
        </button>
      </form>
      {error ? <ErrorNotice error={error} /> : null}
    </div>
  );
}
