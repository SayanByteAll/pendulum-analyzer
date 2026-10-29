import type { Video } from "../api/types";
import { type Msg, useI18n } from "../i18n";
import { num } from "../lib/format";

const LABELS: Record<Video["status"], Msg> = {
  uploaded: { kk: "баптау қажет", ru: "нужна настройка", en: "needs setup" },
  queued: { kk: "кезекте", ru: "в очереди", en: "queued" },
  processing: { kk: "өңделуде", ru: "обработка", en: "processing" },
  done: { kk: "дайын", ru: "готово", en: "done" },
  failed: { kk: "қате", ru: "ошибка", en: "error" },
};

const EXCLUDED: Msg = { kk: "алынып тасталды", ru: "исключено", en: "excluded" };

export function VideoStatusBadge({ video }: { video: Video }) {
  const { t } = useI18n();
  if (video.excluded) return <span className="badge">{t(EXCLUDED)}</span>;
  const tone =
    video.status === "done"
      ? "badge--good"
      : video.status === "failed"
        ? "badge--critical"
        : video.status === "uploaded"
          ? "badge--warn"
          : "badge--accent";
  const icon = video.status === "done" ? "✓" : video.status === "failed" ? "!" : "•";
  const progress =
    video.status === "processing" ? ` ${num(video.progress * 100, 0)} %` : "";
  return (
    <span className={`badge ${tone}`}>
      {icon} {t(LABELS[video.status])}
      {progress}
    </span>
  );
}
