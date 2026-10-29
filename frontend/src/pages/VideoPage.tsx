import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";

import { api } from "../api/client";
import { keys, useTrack, useVideo, useVideoMutations } from "../api/hooks";
import type { ColorRange, Point, Segment, TrackingParams, Video } from "../api/types";
import { AmplitudeChart } from "../charts/AmplitudeChart";
import { PeriodsChart } from "../charts/PeriodsChart";
import { TrackChart } from "../charts/TrackChart";
import { ColorControls } from "../components/ColorControls";
import { FrameEditor, type Tool } from "../components/FrameEditor";
import { Kpi } from "../components/Kpi";
import { SegmentsPanel } from "../components/SegmentsPanel";
import { ErrorNotice, Loading } from "../components/Status";
import { VideoStatusBadge } from "../components/VideoStatusBadge";
import { countMsg, type Msg, UNITS, useI18n } from "../i18n";
import { translateServerMessage } from "../i18n/serverMessages";
import { DASH, ms, num, pct, pm } from "../lib/format";
import { useExperimentContext } from "./experimentContext";

type Settings = Omit<TrackingParams, "color" | "scale">;

const DEFAULT_SETTINGS: Settings = {
  method: "motion",
  roi: null,
  min_area: 30,
  motion_threshold: 25,
  polarity: "auto",
  t_start: null,
  t_end: null,
  axis: "auto",
  pivot: null,
};

const M = {
  toolRoi: { kk: "Іздеу аймағы", ru: "Область поиска", en: "Search area" },
  toolRoiHint: {
    kk: "Жүк тербелетін аймақты жақтаумен қоршаңыз (артық қозғалатын заттарсыз)",
    ru: "Обведите рамкой зону, где качается груз (без лишних движущихся предметов)",
    en: "Draw a box around the area where the bob swings (without other moving objects)",
  },
  toolColor: { kk: "Маркер түсі", ru: "Цвет маркера", en: "Marker colour" },
  toolColorHint: {
    kk: "Жүктегі түрлі түсті маркерді басыңыз",
    ru: "Кликните по цветному маркеру на грузе",
    en: "Click the coloured marker on the bob",
  },
  toolPivot: { kk: "Аспа нүктесі", ru: "Точка подвеса", en: "Pivot point" },
  toolPivotHint: {
    kk: "Міндетті емес: аспа нүктесі траектория доғасы бойынша өзі табылады. Амплитуда кіші болса, белгілеңіз",
    ru: "Необязательно: подвес находится сам по дуге траектории. Отметьте, если амплитуда маленькая",
    en: "Optional: the pivot is found automatically from the arc of the trajectory. Mark it if the amplitude is small",
  },
  toolScale: { kk: "Масштаб", ru: "Масштаб", en: "Scale" },
  toolScaleHint: {
    kk: "Сызғыштың екі нүктесін басып, арақашықтықты енгізіңіз — бейне бойынша жіп ұзындығын аласыз",
    ru: "Кликните по двум точкам линейки и введите расстояние — получите длину нити по видео",
    en: "Click two points on the ruler and enter the distance to get the string length from the video",
  },
  measurements: { kk: "Өлшеулер", ru: "Измерения", en: "Measurements" },
  frames: (n: number) => countMsg(n, { kk: "кадр", ru: ["кадр", "кадра", "кадров"], en: ["frame", "frames"] }),
  minusFrame: { kk: "−кадр", ru: "−кадр", en: "−frame" },
  plusFrame: { kk: "+кадр", ru: "+кадр", en: "+frame" },
  frameTime: { kk: "Кадр уақыты", ru: "Время кадра", en: "Frame time" },
  buildingBackground: {
    kk: "Алдын ала қарау үшін фон құрылуда…",
    ru: "Строю фон для предпросмотра…",
    en: "Building the background for the preview…",
  },
  found: (x: string, y: string, area: number): Msg => ({
    kk: `✓ Бұл кадрда жүк табылды: (${x}; ${y}), дақ ауданы ${area} px. Слайдермен бірнеше кадрды тексеріңіз.`,
    ru: `✓ Груз найден на этом кадре: (${x}; ${y}), площадь пятна ${area} px. Проверьте несколько кадров слайдером.`,
    en: `✓ Bob found in this frame: (${x}; ${y}), blob area ${area} px. Check a few frames with the slider.`,
  }),
  markerNotFound: {
    kk: "! Бұл кадрда маркер табылмады — түс ауқымын кеңейтіңіз немесе іздеу аймағын тексеріңіз.",
    ru: "! На этом кадре маркер не найден — расширьте диапазон цвета или проверьте область поиска.",
    en: "! No marker found in this frame: widen the colour range or check the search area.",
  },
  bobNotFound: {
    kk: "! Бұл кадрда жүк табылмады — мүмкін, ол қазір қозғалмай тұр (қолмен ұстап тұр) немесе фоннан айырмашылық шегі тым жоғары.",
    ru: "! На этом кадре груз не найден — возможно, он сейчас неподвижен (держат рукой) или порог отличия от фона слишком высок.",
    en: "! No bob found in this frame: it may be standing still right now (held by hand), or the background difference threshold is too high.",
  },
  howToFind: { kk: "Жүкті қалай іздеу керек", ru: "Как искать груз", en: "How to find the bob" },
  methodMotion: { kk: "Қозғалыс (маркерсіз)", ru: "Движение (без маркера)", en: "Motion (no marker)" },
  pickColorTool: {
    kk: "«Маркер түсі» құралын таңдап, кадрдағы маркерді басыңыз.",
    ru: "Выберите инструмент «Цвет маркера» и кликните по маркеру на кадре.",
    en: "Choose the “Marker colour” tool and click the marker in the frame.",
  },
  motionExplain: {
    kk: "Фон — кадрлардың медианасы, жүк — одан ерекшеленетін бөлік. Кез келген жүкке, соның ішінде маркерсіз болат шарикке де жарайды.",
    ru: "Фон — медиана кадров, груз — то, что от него отличается. Подходит для любого груза, в том числе стального шарика без маркера.",
    en: "The background is the median of the frames; the bob is whatever differs from it. Works for any bob, including a steel ball without a marker.",
  },
  threshold: { kk: "Фоннан айырмашылық шегі:", ru: "Порог отличия от фона:", en: "Background difference threshold:" },
  polarity: { kk: "Жүк фонмен салыстырғанда", ru: "Груз относительно фона", en: "Bob compared with the background" },
  polarityAuto: { kk: "Автоматты түрде анықтау", ru: "Определить автоматически", en: "Detect automatically" },
  polarityDark: { kk: "Фоннан қараңғырақ", ru: "Темнее фона", en: "Darker than the background" },
  polarityBright: { kk: "Фоннан ашығырақ", ru: "Светлее фона", en: "Brighter than the background" },
  minArea: { kk: "Дақтың ең аз ауданы, px", ru: "Минимальная площадь пятна, px", en: "Minimum blob area, px" },
  intervalGeometry: { kk: "Аралық және геометрия", ru: "Интервал и геометрия", en: "Interval and geometry" },
  start: { kk: "Басы, с", ru: "Начало, с", en: "Start, s" },
  end: { kk: "Соңы, с", ru: "Конец, с", en: "End, s" },
  intervalNote: {
    kk: "Әдетте қажет емес: ұзақ жазбадағы тербеліс сериялары автоматты түрде табылады.",
    ru: "Обычно не нужно: серии колебаний в длинной записи находятся автоматически.",
    en: "Usually not needed: oscillation runs in a long recording are found automatically.",
  },
  axis: { kk: "Тербеліс осі", ru: "Ось колебаний", en: "Oscillation axis" },
  axisAuto: { kk: "Автоматты түрде", ru: "Автоматически", en: "Automatic" },
  axisX: { kk: "Көлденең (x)", ru: "Горизонтальная (x)", en: "Horizontal (x)" },
  axisY: { kk: "Тік (y)", ru: "Вертикальная (y)", en: "Vertical (y)" },
  searchArea: { kk: "Іздеу аймағы:", ru: "Область поиска:", en: "Search area:" },
  wholeFrame: { kk: "бүкіл кадр", ru: "весь кадр", en: "whole frame" },
  reset: { kk: "қалпына келтіру", ru: "сбросить", en: "reset" },
  pivot: { kk: "Аспа нүктесі:", ru: "Точка подвеса:", en: "Pivot point:" },
  pivotAuto: { kk: "доға бойынша табылады", ru: "найдётся по дуге", en: "found from the arc" },
  scaleDistance: {
    kk: "Масштаб: нүктелер арасындағы қашықтық, см",
    ru: "Масштаб: расстояние между точками, см",
    en: "Scale: distance between the points, cm",
  },
  scaleExample: { kk: "мысалы, 30", ru: "например, 30", en: "e.g. 30" },
  scaleFirst: { kk: "алдымен 2 нүктені белгілеңіз", ru: "сначала отметьте 2 точки", en: "mark 2 points first" },
  pxPerCm: { kk: "px/см", ru: "px/см", en: "px/cm" },
  rerun: { kk: "Қайта өңдеу", ru: "Обработать заново", en: "Process again" },
  runTracking: { kk: "Трекингті іске қосу", ru: "Запустить трекинг", en: "Start tracking" },
  queued: { kk: "Кезекте…", ru: "В очереди…", en: "Queued…" },
  processing: (p: string): Msg => ({ kk: `Өңделуде: ${p} %`, ru: `Обработка: ${p} %`, en: `Processing: ${p} %` }),
  applyGeometry: {
    kk: "Аспа нүктесі мен масштабты қолдану (трекингті қайталамай)",
    ru: "Применить подвес и масштаб (без повторного трекинга)",
    en: "Apply pivot and scale (without re-tracking)",
  },
  vfr: (jitter: string, dropped: number): Msg => ({
    kk: `! Кадр жиілігі тұрақсыз (аралықтардың шашырауы ${jitter}${dropped > 0 ? `, өткізіп алынған кадрлар: ${dropped}` : ""}). Әр кадрдың уақыты файлдағы уақыт белгісінен алынған, сондықтан бұл нәтижеге әсер етпейді, бірақ есепте атап өткен жөн.`,
    ru: `! Переменная частота кадров (разброс интервалов ${jitter}${dropped > 0 ? `, пропусков: ${dropped}` : ""}). Время каждого кадра взято из метки времени файла, поэтому на результат это не влияет, но для отчёта стоит отметить.`,
    en: `! Variable frame rate (interval spread ${jitter}${dropped > 0 ? `, dropped frames: ${dropped}` : ""}). Each frame's time is taken from the file's timestamp, so this does not affect the result, but it is worth mentioning in the report.`,
  }),
  runsTitle: { kk: "Табылған тербеліс сериялары", ru: "Найденные серии колебаний", en: "Detected oscillation runs" },
  runsSummary: (rate: string, assigned: number, total: number): Msg => ({
    kk: `жүк кадрлардың ${rate} бөлігінде табылды · ұзындықтарға байланған: ${total} ішінен ${assigned}`,
    ru: `груз найден на ${rate} кадров · привязано к длинам: ${assigned} из ${total}`,
    en: `bob found in ${rate} of frames · assigned to lengths: ${assigned} of ${total}`,
  }),
  runsExplain: {
    kk: "Әр серия — қолсыз еркін тербелістер бөлігі. Оны жіп ұзындығына байлаңыз: талдауға тек байланған бөліктер кіреді. T₀ — кіші амплитудаға келтірілген период; формуламен дәл осыны салыстыру керек.",
    ru: "Каждая серия — отрезок свободных колебаний без рук. Привяжите её к длине нити: в анализ попадают только привязанные участки. T₀ — период, пересчитанный к малой амплитуде; его и стоит сравнивать с формулой.",
    en: "Each run is a stretch of free oscillation with no hands involved. Assign it to a string length: only assigned runs are included in the analysis. T₀ is the period converted to small amplitude; this is the value to compare with the formula.",
  },
  motionTitle: { kk: "Жүктің қозғалысы", ru: "Движение груза", en: "Bob motion" },
  motionSegment: (a: string, b: string): Msg => ({
    kk: `Жүктің қозғалысы: ${a}–${b} с бөлігі`,
    ru: `Движение груза: участок ${a}–${b} с`,
    en: `Bob motion: section ${a}–${b} s`,
  }),
  wholeRecording: { kk: "Бүкіл жазба", ru: "Вся запись", en: "Whole recording" },
  downloadCsv: { kk: "CSV жүктеп алу", ru: "Скачать CSV", en: "Download CSV" },
  meanPeriod: { kk: "Орташа период T", ru: "Средний период T", en: "Mean period T" },
  meanPeriodHint: {
    kk: "секундомер өлшегендей, бірақ дәлірек",
    ru: "как измерил бы секундомер, но точнее",
    en: "what a stopwatch would measure, but more precisely",
  },
  t0: { kk: "Кіші амплитудадағы период T₀", ru: "Период при малой амплитуде T₀", en: "Small-amplitude period T₀" },
  t0Hint: {
    kk: "әр период үшін θ²/16 түзетуін ескере отырып",
    ru: "с учётом поправки θ²/16 для каждого периода",
    en: "with the θ²/16 correction applied to each period",
  },
  noAngle: { kk: "амплитуда бұрышы анықталмады", ru: "угол амплитуды не определён", en: "amplitude angle not determined" },
  eventError: { kk: "Мезетті тіркеу қателігі", ru: "Ошибка фиксации момента", en: "Timing error per event" },
  eventErrorHint: {
    kk: "секундомерде әдетте 30–60 мс",
    ru: "у секундомера обычно 30–60 мс",
    en: "typically 30–60 ms for a stopwatch",
  },
  amplitude: { kk: "Амплитуда", ru: "Амплитуда", en: "Amplitude" },
  damping: (g: string): Msg => ({ kk: `өшу γ = ${g} 1/с`, ru: `затухание γ = ${g} 1/с`, en: `damping γ = ${g} 1/s` }),
  oscillations: { kk: "Бөліктегі тербелістер саны", ru: "Колебаний на участке", en: "Oscillations in the section" },
  periodsHint: (n: number, outliers: number): Msg => ({
    kk: `${n} жеке период${outliers ? `, алынып тасталған ақаулар: ${outliers}` : ""}`,
    ru: `${n} отдельных периодов${outliers ? `, отброшено сбоев: ${outliers}` : ""}`,
    en: `${n} individual periods${outliers ? `, glitches discarded: ${outliers}` : ""}`,
  }),
  videoLength: { kk: "Бейне бойынша жіп ұзындығы", ru: "Длина нити по видео", en: "String length from video" },
  videoLengthHint: {
    kk: "траектория доғасы мен масштаб бойынша",
    ru: "по дуге траектории и масштабу",
    en: "from the arc of the trajectory and the scale",
  },
  periodVsAmplitude: { kk: "Периодтың амплитудаға тәуелділігі", ru: "Период от амплитуды", en: "Period vs amplitude" },
  periodsOverTime: {
    kk: "Жеке периодтардың уақыт бойынша өзгерісі",
    ru: "Отдельные периоды по времени",
    en: "Individual periods over time",
  },
};

const TOOLS: { id: Tool; label: Msg; hint: Msg; colorOnly?: boolean }[] = [
  { id: "roi", label: M.toolRoi, hint: M.toolRoiHint },
  { id: "color", label: M.toolColor, hint: M.toolColorHint, colorOnly: true },
  { id: "pivot", label: M.toolPivot, hint: M.toolPivotHint },
  { id: "scale", label: M.toolScale, hint: M.toolScaleHint },
];

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const parseNum = (v: string) => (v ? Number(v.replace(",", ".")) : null);

export function VideoPage() {
  const videoId = Number(useParams().videoId);
  const query = useVideo(videoId);
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorNotice error={query.error} />;
  return <VideoWorkspace key={query.data.id} video={query.data} />;
}

function VideoWorkspace({ video }: { video: Video }) {
  const { t, lang } = useI18n();
  const { experiment } = useExperimentContext();
  const client = useQueryClient();
  const base = `/experiments/${experiment.id}`;
  const mutations = useVideoMutations(experiment.id);

  const [color, setColor] = useState<ColorRange | null>(video.params?.color ?? null);
  const [settings, setSettings] = useState<Settings>(() => {
    const stored: Partial<TrackingParams> = { ...video.params };
    delete stored.color;
    delete stored.scale;
    return { ...DEFAULT_SETTINGS, ...stored };
  });
  const [time, setTime] = useState(() => Math.min(video.params?.t_start ?? 0.5, video.duration_s / 2));
  const [tool, setTool] = useState<Tool>(video.params?.method === "color" && !video.params.color ? "color" : "roi");
  const [scalePoints, setScalePoints] = useState<Point[]>(() =>
    video.params?.scale ? [video.params.scale.p1, video.params.scale.p2] : [],
  );
  const [scaleCm, setScaleCm] = useState(() => String(video.params?.scale?.distance_cm ?? ""));
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const frameStep = 1 / (video.timing?.fps_measured || video.fps_nominal || 30);
  const busy = video.status === "queued" || video.status === "processing";
  const isColor = settings.method === "color";
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((s) => ({ ...s, [key]: value }));

  // Когда обработка завершилась — обновить сводку эксперимента.
  const previousStatus = useRef(video.status);
  useEffect(() => {
    if (previousStatus.current !== video.status && (video.status === "done" || video.status === "failed")) {
      void client.invalidateQueries({ queryKey: keys.experiment(experiment.id) });
    }
    previousStatus.current = video.status;
  }, [video.status, client, experiment.id]);

  const scale = useMemo(() => {
    const distance = parseNum(scaleCm);
    if (scalePoints.length !== 2 || !distance || !(distance > 0)) return null;
    return { p1: scalePoints[0]!, p2: scalePoints[1]!, distance_cm: distance };
  }, [scalePoints, scaleCm]);

  const fullParams: TrackingParams | null = useMemo(
    () => (isColor && !color ? null : { ...settings, color: isColor ? color : null, scale }),
    [settings, color, scale, isColor],
  );

  const previewInput = useDebounced(fullParams ? { time_s: time, params: fullParams } : null, 250);
  const preview = useQuery({
    queryKey: ["preview", video.id, previewInput],
    queryFn: () => api.preview(video.id, previewInput!),
    enabled: previewInput !== null,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    retry: false,
  });

  const sample = useMutation({
    mutationFn: (p: Point) => api.sampleColor(video.id, { time_s: time, x: Math.round(p.x), y: Math.round(p.y) }),
    onSuccess: (c) => {
      setColor(c);
      setTool("roi");
    },
  });

  const track = useTrack(video);
  const selected: Segment | null = video.segments.find((s) => s.id === selectedId) ?? null;
  const axis = video.track_info?.axis ?? "x";

  const onPoint = (p: Point) => {
    if (tool === "color") sample.mutate(p);
    else if (tool === "pivot") set("pivot", p);
    else if (tool === "scale") setScalePoints((pts) => (pts.length >= 2 ? [p] : [...pts, p]));
  };

  const run = () => {
    setSelectedId(null);
    if (fullParams) mutations.track.mutate({ id: video.id, params: fullParams });
  };

  const sameJson = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const geometryChanged =
    !!video.params && (!sameJson(video.params.pivot, settings.pivot) || !sameJson(video.params.scale, scale));
  const timing = video.timing;
  const previewData = previewInput ? preview.data : undefined;
  const tools = TOOLS.filter((item) => !item.colorOnly || isColor);
  const activeHint = tools.find((item) => item.id === tool)?.hint;
  const assigned = video.segments.filter((s) => s.series_id && !s.excluded).length;

  return (
    <div className="stack">
      <div className="breadcrumbs">
        <Link to={base}>{t(M.measurements)}</Link> / {video.original_name}
      </div>
      <div className="row">
        <h2 style={{ margin: 0 }}>{video.original_name}</h2>
        <VideoStatusBadge video={video} />
        <span className="muted small">
          {video.width}×{video.height} · {num(video.fps_nominal, 2)} {t(UNITS.fps)} · {num(video.duration_s, 1)} {t(UNITS.s)} ·{" "}
          {t(M.frames(video.frame_count))}
        </span>
      </div>

      <div className="video-layout">
        <section className="card stack">
          <div className="segmented" role="tablist">
            {tools.map((item) => (
              <button key={item.id} className={tool === item.id ? "active" : ""} onClick={() => setTool(item.id)}>
                {t(item.label)}
              </button>
            ))}
          </div>
          <div className="small secondary">{activeHint && t(activeHint)}</div>
          <FrameEditor
            src={api.frameUrl(video.id, time)}
            videoWidth={video.width}
            videoHeight={video.height}
            tool={tool}
            roi={settings.roi}
            pivot={settings.pivot ?? selected?.result?.pivot_px ?? null}
            scalePoints={scalePoints}
            detection={previewData?.found ? { x: previewData.x!, y: previewData.y! } : null}
            mask={previewData ? { png: previewData.mask_png, roi: previewData.roi } : null}
            onPoint={onPoint}
            onRoi={(roi) => set("roi", roi)}
          />
          <div className="row">
            <button className="small" onClick={() => setTime((prev) => Math.max(prev - 1, 0))}>
              −1 {t(UNITS.s)}
            </button>
            <button className="small" onClick={() => setTime((prev) => Math.max(prev - frameStep, 0))}>
              {t(M.minusFrame)}
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(video.duration_s - frameStep, 0)}
              step={frameStep}
              value={time}
              onChange={(e) => setTime(Number(e.target.value))}
              style={{ flex: 1, minWidth: 120 }}
              aria-label={t(M.frameTime)}
            />
            <button className="small" onClick={() => setTime((prev) => Math.min(prev + frameStep, video.duration_s))}>
              {t(M.plusFrame)}
            </button>
            <button className="small" onClick={() => setTime((prev) => Math.min(prev + 1, video.duration_s))}>
              +1 {t(UNITS.s)}
            </button>
            <span className="nums small">{num(time, 3)} {t(UNITS.s)}</span>
          </div>
          {sample.isError && <ErrorNotice error={sample.error} />}
          {preview.isError && previewInput && <ErrorNotice error={preview.error} />}
          {preview.isFetching && !previewData && <div className="muted small">{t(M.buildingBackground)}</div>}
          {previewData && (
            <div className={`notice ${previewData.found ? "notice--good" : "notice--warn"}`}>
              {previewData.found
                ? t(M.found(num(previewData.x, 1), num(previewData.y, 1), previewData.area))
                : isColor
                  ? t(M.markerNotFound)
                  : t(M.bobNotFound)}
            </div>
          )}
        </section>

        <aside className="stack">
          <section className="card stack">
            <h3>{t(M.howToFind)}</h3>
            <div className="segmented">
              <button className={!isColor ? "active" : ""} onClick={() => set("method", "motion")}>
                {t(M.methodMotion)}
              </button>
              <button
                className={isColor ? "active" : ""}
                onClick={() => {
                  set("method", "color");
                  if (!color) setTool("color");
                }}
              >
                {t(M.toolColor)}
              </button>
            </div>
            {isColor ? (
              color ? (
                <ColorControls color={color} onChange={setColor} />
              ) : (
                <p className="secondary small">{t(M.pickColorTool)}</p>
              )
            ) : (
              <>
                <p className="secondary small" style={{ margin: 0 }}>
                  {t(M.motionExplain)}
                </p>
                <label className="field">
                  {t(M.threshold)} {settings.motion_threshold}
                  <input
                    type="range"
                    min={8}
                    max={80}
                    value={settings.motion_threshold}
                    onChange={(e) => set("motion_threshold", Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  {t(M.polarity)}
                  <select value={settings.polarity} onChange={(e) => set("polarity", e.target.value as Settings["polarity"])}>
                    <option value="auto">{t(M.polarityAuto)}</option>
                    <option value="dark">{t(M.polarityDark)}</option>
                    <option value="bright">{t(M.polarityBright)}</option>
                  </select>
                </label>
              </>
            )}
            <label className="field">
              {t(M.minArea)}
              <input
                type="number"
                min={1}
                value={settings.min_area}
                onChange={(e) => set("min_area", Math.max(1, Number(e.target.value)))}
              />
            </label>
          </section>

          <section className="card stack">
            <h3>{t(M.intervalGeometry)}</h3>
            <div className="form-row">
              <label className="field">
                {t(M.start)}
                <input
                  inputMode="decimal"
                  value={settings.t_start ?? ""}
                  placeholder="0"
                  onChange={(e) => set("t_start", parseNum(e.target.value))}
                />
              </label>
              <label className="field">
                {t(M.end)}
                <input
                  inputMode="decimal"
                  value={settings.t_end ?? ""}
                  placeholder={num(video.duration_s, 1)}
                  onChange={(e) => set("t_end", parseNum(e.target.value))}
                />
              </label>
            </div>
            <p className="muted small" style={{ margin: 0 }}>
              {t(M.intervalNote)}
            </p>
            <label className="field">
              {t(M.axis)}
              <select value={settings.axis} onChange={(e) => set("axis", e.target.value as Settings["axis"])}>
                <option value="auto">{t(M.axisAuto)}</option>
                <option value="x">{t(M.axisX)}</option>
                <option value="y">{t(M.axisY)}</option>
              </select>
            </label>
            <div className="small secondary">
              {t(M.searchArea)} {settings.roi ? `${settings.roi.w}×${settings.roi.h} px` : t(M.wholeFrame)}{" "}
              {settings.roi && (
                <button className="small ghost" onClick={() => set("roi", null)}>
                  {t(M.reset)}
                </button>
              )}
            </div>
            <div className="small secondary">
              {t(M.pivot)}{" "}
              {settings.pivot ? `(${num(settings.pivot.x, 0)}; ${num(settings.pivot.y, 0)})` : t(M.pivotAuto)}{" "}
              {settings.pivot && (
                <button className="small ghost" onClick={() => set("pivot", null)}>
                  {t(M.reset)}
                </button>
              )}
            </div>
            <label className="field">
              {t(M.scaleDistance)}
              <input
                inputMode="decimal"
                value={scaleCm}
                onChange={(e) => setScaleCm(e.target.value)}
                placeholder={scalePoints.length === 2 ? t(M.scaleExample) : t(M.scaleFirst)}
              />
            </label>
            {scale && (
              <div className="small secondary">
                {num(Math.hypot(scale.p1.x - scale.p2.x, scale.p1.y - scale.p2.y) / scale.distance_cm, 2)} {t(M.pxPerCm)}
              </div>
            )}
          </section>

          <section className="card stack">
            <button className="primary" disabled={!fullParams || busy || mutations.track.isPending} onClick={run}>
              {video.status === "done" || video.status === "failed" ? t(M.rerun) : t(M.runTracking)}
            </button>
            {busy && (
              <div className="stack">
                <div className="progress">
                  <div style={{ width: `${video.progress * 100}%` }} />
                </div>
                <div className="small secondary">
                  {video.status === "queued" ? t(M.queued) : t(M.processing(num(video.progress * 100, 0)))}
                </div>
              </div>
            )}
            {geometryChanged && video.status === "done" && (
              <button
                disabled={mutations.geometry.isPending}
                onClick={() => mutations.geometry.mutate({ id: video.id, body: { pivot: settings.pivot, scale } })}
              >
                {t(M.applyGeometry)}
              </button>
            )}
            {video.status === "failed" && video.error && <div className="notice notice--critical">{translateServerMessage(video.error, lang)}</div>}
            {mutations.track.isError && <ErrorNotice error={mutations.track.error} />}
            {mutations.geometry.isError && <ErrorNotice error={mutations.geometry.error} />}
          </section>
        </aside>
      </div>

      {timing && (timing.variable_frame_rate || timing.dropped_frames > 0) && (
        <div className="notice notice--warn">
          {t(M.vfr(pct(timing.frame_interval_jitter * 100, 1), timing.dropped_frames))}
        </div>
      )}

      {video.track_info && (
        <section className="card stack">
          <div className="card__title">
            <h3>{t(M.runsTitle)}</h3>
            <span className="muted small">
              {t(M.runsSummary(pct(video.track_info.detection_rate * 100, 1), assigned, video.segments.length))}
            </span>
          </div>
          <p className="secondary small" style={{ margin: 0 }}>
            {t(M.runsExplain)}
          </p>
          <SegmentsPanel video={video} experiment={experiment} selectedId={selectedId} onSelect={setSelectedId} />
        </section>
      )}

      {track.data && (
        <section className="card">
          <div className="card__title">
            <h3>{selected ? t(M.motionSegment(num(selected.t_start, 1), num(selected.t_end, 1))) : t(M.motionTitle)}</h3>
            <div className="row">
              {selected && (
                <button className="small" onClick={() => setSelectedId(null)}>
                  {t(M.wholeRecording)}
                </button>
              )}
              <a className="button small" href={api.trackCsvUrl(video.id)} download>
                {t(M.downloadCsv)}
              </a>
            </div>
          </div>
          <TrackChart track={track.data} axis={axis} segments={video.segments} selected={selected} onSelect={setSelectedId} />
        </section>
      )}

      {selected?.result && <SegmentDetails segment={selected} />}
    </div>
  );
}

function SegmentDetails({ segment }: { segment: Segment }) {
  const { t } = useI18n();
  const r = segment.result!;
  const s = t(UNITS.s);
  return (
    <>
      <div className="kpis">
        <Kpi label={t(M.meanPeriod)} value={`${pm(r.period, r.period_se, 5)} ${s}`} hint={t(M.meanPeriodHint)} />
        <Kpi
          label={t(M.t0)}
          value={r.t0 ? `${pm(r.t0, r.t0_se, 5)} ${s}` : DASH}
          hint={r.t0 ? t(M.t0Hint) : t(M.noAngle)}
        />
        <Kpi label={t(M.eventError)} value={ms(r.event_sigma)} hint={t(M.eventErrorHint)} />
        <Kpi
          label={t(M.amplitude)}
          value={r.theta_max_deg != null ? `${num(r.theta_max_deg, 1)}° → ${num(r.theta_min_deg, 1)}°` : `${num(r.amplitude_start_px, 0)} px`}
          hint={r.damping != null ? t(M.damping(num(r.damping, 4))) : undefined}
        />
        <Kpi
          label={t(M.oscillations)}
          value={num(r.periods_observed, 1)}
          hint={t(M.periodsHint(r.period_values.length, r.outliers))}
        />
        {r.length_from_video_cm != null && (
          <Kpi label={t(M.videoLength)} value={`${num(r.length_from_video_cm, 1)} ${t(UNITS.cm)}`} hint={t(M.videoLengthHint)} />
        )}
      </div>
      <div className="grid-2">
        <section className="card">
          <h3>{t(M.periodVsAmplitude)}</h3>
          <AmplitudeChart result={r} />
        </section>
        <section className="card">
          <h3>{t(M.periodsOverTime)}</h3>
          <PeriodsChart result={r} />
        </section>
      </div>
    </>
  );
}
