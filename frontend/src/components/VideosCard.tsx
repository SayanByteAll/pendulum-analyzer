import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";

import { keys, useVideoMutations } from "../api/hooks";
import type { ExperimentDetail } from "../api/types";
import { type Msg, tr, UNITS, useI18n } from "../i18n";
import { bytes, num } from "../lib/format";
import { VideoStatusBadge } from "./VideoStatusBadge";
import { VideoUpload } from "./VideoUpload";

const M = {
  title: { kk: "Бейнежазбалар", ru: "Видеозаписи", en: "Video recordings" },
  intro: {
    kk: "Бірнеше сериясы (жіптің әртүрлі ұзындықтары) бар бір ұзын жазбаны жүктеуге болады — бағдарлама тербеліс бөліктерін өзі табады, ал сіз оларды ұзындықтарға байланыстырасыз.",
    ru: "Можно загрузить одну длинную запись с несколькими сериями (разными длинами нити) — программа сама найдёт участки колебаний, а вы привяжете их к длинам.",
    en: "You can upload one long recording with several series (different string lengths): the program finds the oscillation segments itself, and you assign them to lengths.",
  },
  file: { kk: "Файл", ru: "Файл", en: "File" },
  status: { kk: "Күйі", ru: "Статус", en: "Status" },
  duration: { kk: "Ұзақтығы", ru: "Длительность", en: "Duration" },
  found: { kk: "Табылған сериялар", ru: "Серий найдено", en: "Series found" },
  assigned: { kk: "Байланыстырылған", ru: "Привязано", en: "Assigned" },
  setup: { kk: "Баптау", ru: "Настроить", en: "Set up" },
  open: { kk: "Ашу", ru: "Открыть", en: "Open" },
  deleteVideo: { kk: "Бейнені жою", ru: "Удалить видео", en: "Delete video" },
  confirmDelete: (name: string): Msg => ({
    kk: `${name} жойылсын ба?`,
    ru: `Удалить ${name}?`,
    en: `Delete ${name}?`,
  }),
};

interface Props {
  experiment: ExperimentDetail;
  /** Длина, со страницы которой загружают: ей достанется участок, если он в записи один. */
  seriesId?: number;
}

export function VideosCard({ experiment, seriesId }: Props) {
  const { t } = useI18n();
  const client = useQueryClient();
  const navigate = useNavigate();
  const mutations = useVideoMutations(experiment.id);
  const base = `/experiments/${experiment.id}`;
  const videos = seriesId
    ? experiment.videos.filter((v) => v.preferred_series_id === seriesId || v.segments.some((s) => s.series_id === seriesId))
    : experiment.videos;

  return (
    <section className="card stack">
      <div className="card__title">
        <h3>{t(M.title)}</h3>
        <span className="muted small">{experiment.videos.length}</span>
      </div>
      <p className="secondary small" style={{ margin: 0 }}>
        {t(M.intro)}
      </p>
      <VideoUpload
        experimentId={experiment.id}
        seriesId={seriesId}
        onUploaded={(video) => {
          void client.invalidateQueries({ queryKey: keys.experiment(experiment.id) });
          navigate(`${base}/videos/${video.id}`);
        }}
      />
      {videos.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t(M.file)}</th>
                <th className="left">{t(M.status)}</th>
                <th>{t(M.duration)}</th>
                <th>{t(M.found)}</th>
                <th>{t(M.assigned)}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id} className={v.excluded ? "excluded" : undefined}>
                  <td>
                    <Link to={`${base}/videos/${v.id}`}>{v.original_name}</Link>
                    <div className="muted small">
                      {v.width}×{v.height} · {num(v.fps_nominal, 0)} {t(UNITS.fps)} · {bytes(v.size_bytes)}
                    </div>
                  </td>
                  <td className="left">
                    <VideoStatusBadge video={v} />
                  </td>
                  <td>
                    {num(v.duration_s, 1)} {t(UNITS.s)}
                  </td>
                  <td>{v.segments.length}</td>
                  <td>{v.segments.filter((s) => s.series_id).length}</td>
                  <td className="actions">
                    <div className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
                      <Link className="button small" to={`${base}/videos/${v.id}`}>
                        {v.status === "uploaded" ? t(M.setup) : t(M.open)}
                      </Link>
                      <button
                        className="small ghost danger icon"
                        title={t(M.deleteVideo)}
                        aria-label={t(M.deleteVideo)}
                        onClick={() => confirm(tr(M.confirmDelete(v.original_name))) && mutations.remove.mutate(v.id)}
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
    </section>
  );
}
