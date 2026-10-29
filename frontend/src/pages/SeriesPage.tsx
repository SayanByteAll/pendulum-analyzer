import { useCallback, useState } from "react";
import { Link, useParams } from "react-router";

import { useSeriesMutations, useTrialMutations } from "../api/hooks";
import type { TrialInput } from "../api/types";
import { LengthEditor } from "../components/LengthEditor";
import { Stopwatch } from "../components/Stopwatch";
import { Empty, ErrorNotice } from "../components/Status";
import { TrialsTable } from "../components/TrialsTable";
import { VideosCard } from "../components/VideosCard";
import { type Msg, UNITS, useI18n } from "../i18n";
import { DASH, ms, num, pm } from "../lib/format";
import { useExperimentContext } from "./experimentContext";

const M = {
  notFound: {
    kk: "Эксперименте мұндай ұзындық жоқ.",
    ru: "Такой длины нет в эксперименте.",
    en: "This length is not part of the experiment.",
  },
  measurements: { kk: "Өлшеулер", ru: "Измерения", en: "Measurements" },
  length: { kk: "Ұзындық", ru: "Длина", en: "Length" },
  angle: (deg: string): Msg => ({ kk: ` · бұрыш ≈ ${deg}°`, ru: ` · угол ≈ ${deg}°`, en: ` · angle ≈ ${deg}°` }),
  editLength: { kk: "✎ Ұзындықты түзету", ru: "✎ Исправить длину", en: "✎ Correct length" },
  stopwatch: { kk: "Секундомер", ru: "Секундомер", en: "Stopwatch" },
  manualTrials: { kk: "Қолмен өлшеулер", ru: "Ручные замеры", en: "Manual trials" },
  segmentsTitle: {
    kk: "Осы ұзындықтағы бейне бөліктері",
    ru: "Участки видео при этой длине",
    en: "Video segments at this length",
  },
  noSegments: {
    kk: "Бұл ұзындыққа әзірге бірде-бір бейне бөлігі байланыстырылмаған. Төменде бейне жүктеңіз (егер онда бір ғана серия болса, ол өзі байланысады) немесе бөлікті бейне бетінде байланыстырыңыз.",
    ru: "Пока ни один участок видео не привязан к этой длине. Загрузите видео ниже (если в нём одна серия, она привяжется сама) или привяжите участок на странице видео.",
    en: "No video segment is linked to this length yet. Upload a video below (if it contains a single run, it will be linked automatically) or link a segment on the video page.",
  },
  video: { kk: "Бейне", ru: "Видео", en: "Video" },
  time: { kk: "Уақыт", ru: "Время", en: "Time" },
  meanT: { kk: "Орташа T", ru: "T средний", en: "Mean T" },
  t0: { kk: "T₀ (кіші тербелістер)", ru: "T₀ (малые колеб.)", en: "T₀ (small osc.)" },
  eventError: { kk: "Мезет қателігі", ru: "Ошибка момента", en: "Timing error" },
  amplitude: { kk: "Амплитуда", ru: "Амплитуда", en: "Amplitude" },
};

export function SeriesPage() {
  const { experiment } = useExperimentContext();
  const seriesId = Number(useParams().seriesId);
  const series = experiment.series.find((s) => s.id === seriesId);
  const trials = useTrialMutations(experiment.id);
  const seriesMutations = useSeriesMutations(experiment.id);
  const { t } = useI18n();
  const [editingLength, setEditingLength] = useState(false);

  const createTrial = trials.create.mutate;
  const addTrial = useCallback(
    (input: TrialInput) => createTrial({ seriesId, input }),
    [createTrial, seriesId],
  );

  if (!series) return <Empty>{t(M.notFound)}</Empty>;
  const base = `/experiments/${experiment.id}`;

  return (
    <div className="stack">
      <div className="breadcrumbs">
        <Link to={base}>{t(M.measurements)}</Link> / L = {num(series.length_cm, 1)} {t(UNITS.cm)}
      </div>
      {editingLength ? (
        <LengthEditor
          series={series}
          busy={seriesMutations.update.isPending}
          onCancel={() => setEditingLength(false)}
          onSave={(patch) =>
            seriesMutations.update.mutate({ id: series.id, patch }, { onSuccess: () => setEditingLength(false) })
          }
        />
      ) : (
        <div className="row">
          <h2 style={{ margin: 0 }}>
            {t(M.length)} L = {num(series.length_cm, 1)} ± {num(series.length_sigma_cm, 1)} {t(UNITS.cm)}
            {series.amplitude_deg !== null && (
              <span className="secondary">{t(M.angle(num(series.amplitude_deg, 0)))}</span>
            )}
          </h2>
          <button className="small" onClick={() => setEditingLength(true)}>
            {t(M.editLength)}
          </button>
        </div>
      )}
      {seriesMutations.update.isError && <ErrorNotice error={seriesMutations.update.error} />}

      <div className="grid-2">
        <section className="card">
          <div className="card__title">
            <h3>{t(M.stopwatch)}</h3>
          </div>
          <Stopwatch
            defaultPeriods={experiment.main_periods}
            saving={trials.create.isPending}
            onSave={(input) => addTrial({ ...input, source: "app" })}
          />
        </section>

        <section className="card">
          <div className="card__title">
            <h3>{t(M.manualTrials)}</h3>
            <span className="muted small">{series.trials.length}</span>
          </div>
          <TrialsTable
            trials={series.trials}
            mainPeriods={experiment.main_periods}
            busy={trials.create.isPending}
            onAdd={addTrial}
            onToggle={(trial) => trials.toggleExcluded.mutate({ id: trial.id, excluded: !trial.excluded })}
            onDelete={(trial) => trials.remove.mutate(trial.id)}
          />
          {trials.create.isError && <ErrorNotice error={trials.create.error} />}
        </section>
      </div>

      <section className="card stack">
        <div className="card__title">
          <h3>{t(M.segmentsTitle)}</h3>
          <span className="muted small">{series.segments.length}</span>
        </div>
        {series.segments.length === 0 ? (
          <p className="secondary small" style={{ margin: 0 }}>
            {t(M.noSegments)}
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t(M.video)}</th>
                  <th>
                    {t(M.time)}, {t(UNITS.s)}
                  </th>
                  <th>
                    {t(M.meanT)}, {t(UNITS.s)}
                  </th>
                  <th>
                    {t(M.t0)}, {t(UNITS.s)}
                  </th>
                  <th>{t(M.eventError)}</th>
                  <th>{t(M.amplitude)}</th>
                </tr>
              </thead>
              <tbody>
                {series.segments.map((seg) => (
                  <tr key={seg.id} className={seg.excluded ? "excluded" : undefined}>
                    <td>
                      <Link to={`${base}/videos/${seg.video_id}`}>{seg.video_name}</Link>
                    </td>
                    <td>
                      {num(seg.t_start, 1)}–{num(seg.t_end, 1)}
                    </td>
                    <td>{seg.result ? pm(seg.result.period, seg.result.period_se, 5) : DASH}</td>
                    <td>{seg.result?.t0 ? pm(seg.result.t0, seg.result.t0_se, 5) : DASH}</td>
                    <td>{ms(seg.result?.event_sigma)}</td>
                    <td>
                      {seg.result?.theta_max_deg != null
                        ? `${num(seg.result.theta_max_deg, 0)}° → ${num(seg.result.theta_min_deg, 0)}°`
                        : DASH}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <VideosCard experiment={experiment} seriesId={series.id} />
    </div>
  );
}
