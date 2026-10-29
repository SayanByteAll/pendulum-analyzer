import { type DragEvent, type ReactNode, useRef, useState } from "react";

import { api } from "../api/client";
import type { Video } from "../api/types";
import { type Lang, type Msg, useI18n } from "../i18n";
import { num } from "../lib/format";
import { ErrorNotice } from "./Status";

const ACCEPT = ".mp4,.mov,.m4v,.avi,.mkv,.webm,video/*";

const DROP: Record<Lang, ReactNode> = {
  kk: (
    <>
      <strong>Бейнені осында сүйреп әкеліңіз</strong> немесе файлды таңдау үшін басыңыз
    </>
  ),
  ru: (
    <>
      <strong>Перетащите видео сюда</strong> или нажмите, чтобы выбрать файл
    </>
  ),
  en: (
    <>
      <strong>Drag a video here</strong> or click to choose a file
    </>
  ),
};

const M = {
  hint: {
    kk: "MP4, MOV, AVI, MKV, WEBM · 60 кадр/с жақсырақ, камера штативте",
    ru: "MP4, MOV, AVI, MKV, WEBM · лучше 60 кадр/с, камера на штативе",
    en: "MP4, MOV, AVI, MKV, WEBM · 60 fps preferred, camera on a tripod",
  },
  uploading: { kk: "Жүктелуде…", ru: "Загрузка…", en: "Uploading…" },
} satisfies Record<string, Msg>;

interface Props {
  experimentId: number;
  seriesId?: number;
  onUploaded: (video: Video) => void;
}

export function VideoUpload({ experimentId, seriesId, onUploaded }: Props) {
  const { t, lang } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<unknown>(null);

  const upload = async (file: File) => {
    setError(null);
    setProgress(0);
    try {
      const video = await api.uploadVideo(experimentId, file, setProgress, seriesId);
      onUploaded(video);
    } catch (err) {
      setError(err);
    } finally {
      setProgress(null);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    const file = event.dataTransfer.files[0];
    if (file) void upload(file);
  };

  return (
    <div className="stack">
      <div
        className={`dropzone ${over ? "over" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => progress === null && input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        {progress === null ? (
          <>
            {DROP[lang]}
            <div className="small muted">{t(M.hint)}</div>
          </>
        ) : (
          <div className="stack">
            <div>
              {t(M.uploading)} {num(progress * 100, 0)} %
            </div>
            <div className="progress">
              <div style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        )}
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void upload(file);
          }}
        />
      </div>
      {error !== null && <ErrorNotice error={error} />}
    </div>
  );
}
