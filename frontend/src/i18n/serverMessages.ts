import type { Lang } from "./index";

// Сервер (backend/app) возвращает ошибки по-русски. Здесь — их переводы на kk и en.
// Сообщение может быть составным (ошибки валидации 422 склеиваются клиентом через "; ",
// pydantic добавляет префикс "Value error, "), поэтому известные фрагменты заменяются
// внутри строки. Неизвестный текст остаётся как есть.

type Target = Exclude<Lang, "ru">;
type Texts = Record<Target, string>;
/** Группы совпадения шаблона (не больше двух). */
type Groups = [string, string];
type Builder = (groups: Groups, lang: Target) => string;

/** Сообщения без подстановок — точный текст сервера или клиента. */
const LITERALS: Record<string, Texts> = {
  "Эксперимент не найден": {
    kk: "Эксперимент табылмады",
    en: "Experiment not found",
  },
  "Эта длина не относится к эксперименту": {
    kk: "Бұл ұзындық экспериментке жатпайды",
    en: "This length does not belong to the experiment",
  },
  "Не удалось закодировать кадр": {
    kk: "Кадрды кодтау мүмкін болмады",
    en: "Could not encode the frame",
  },
  "Не удалось закодировать маску": {
    kk: "Масканы кодтау мүмкін болмады",
    en: "Could not encode the mask",
  },
  "Видео уже обрабатывается": {
    kk: "Бейне қазір өңделуде",
    en: "The video is already being processed",
  },
  "Траектория ещё не построена": {
    kk: "Траектория әлі құрылмаған",
    en: "The trajectory has not been built yet",
  },
  "Обработка видео отключена в онлайн-версии: на сервере мало памяти. Готовые результаты доступны для просмотра.": {
    kk: "Онлайн-нұсқада бейнені өңдеу өшірілген: серверде жад аз. Дайын нәтижелерді қарауға болады.",
    en: "Video processing is turned off in the online version because the server has little memory. Finished results can still be viewed.",
  },
  "Сначала обработайте видео": {
    kk: "Алдымен бейнені өңдеңіз",
    en: "Process the video first",
  },
  "Конец участка должен быть позже начала": {
    kk: "Бөліктің соңы басынан кейін болуы керек",
    en: "The segment end must be after its start",
  },
  "Конец интервала должен быть позже начала": {
    kk: "Аралықтың соңы басынан кейін болуы керек",
    en: "The interval end must be after its start",
  },
  "Для метода «Цвет маркера» выберите цвет": {
    kk: "«Маркер түсі» әдісі үшін түсті таңдаңыз",
    en: "Choose a color for the “Marker color” method",
  },
  "На записи меньше одного полного колебания — проверьте настройки трекинга и обрезку.": {
    kk: "Жазбада бір толық тербелістен аз — трекинг баптаулары мен кесуді тексеріңіз.",
    en: "The recording contains less than one full oscillation — check the tracking settings and trimming.",
  },
  "Не удалось надёжно найти моменты прохождения положения равновесия.": {
    kk: "Тепе-теңдік күйінен өту сәттерін сенімді табу мүмкін болмады.",
    en: "Could not reliably find the moments when the bob passes the equilibrium position.",
  },
  "Переходы через равновесие идут нерегулярно — проверьте трекинг.": {
    kk: "Тепе-теңдік күйінен өтулер біркелкі емес — трекингті тексеріңіз.",
    en: "Equilibrium crossings are irregular — check the tracking.",
  },
  "Недостаточно переходов для вычисления периода.": {
    kk: "Периодты есептеу үшін өтулер жеткіліксіз.",
    en: "Not enough crossings to compute the period.",
  },
  "OpenCV не смог создать видеофайл.": {
    kk: "OpenCV бейнефайлды жасай алмады.",
    en: "OpenCV could not create the video file.",
  },
  "Не удалось открыть видео — формат не поддерживается или файл повреждён.": {
    kk: "Бейнені ашу мүмкін болмады — пішімге қолдау көрсетілмейді немесе файл зақымдалған.",
    en: "Could not open the video — the format is not supported or the file is damaged.",
  },
  "В видео не найдено ни одного кадра.": {
    kk: "Бейнеде бірде-бір кадр табылмады.",
    en: "No frames were found in the video.",
  },
  "Не выбран цвет маркера.": {
    kk: "Маркер түсі таңдалмаған.",
    en: "The marker color is not selected.",
  },
  "Точка вне кадра.": {
    kk: "Нүкте кадрдан тыс.",
    en: "The point is outside the frame.",
  },
  "Слишком короткий интервал для построения фона.": {
    kk: "Фонды құру үшін аралық тым қысқа.",
    en: "The interval is too short to build the background.",
  },
  "В выбранном интервале слишком мало кадров.": {
    kk: "Таңдалған аралықта кадрлар тым аз.",
    en: "Too few frames in the selected interval.",
  },
  "Обработка прервана перезапуском сервера — запустите её снова.": {
    kk: "Өңдеу сервердің қайта іске қосылуына байланысты үзілді — оны қайта бастаңыз.",
    en: "Processing was interrupted by a server restart — start it again.",
  },
  "Внутренняя ошибка обработки, подробности в логе сервера.": {
    kk: "Өңдеудің ішкі қатесі, толығырақ сервер журналында.",
    en: "Internal processing error, see the server log for details.",
  },
  "Не найдено ни одного участка регулярных колебаний (нужно хотя бы 4 колебания подряд). Проверьте график движения: виден ли груз, не мешают ли руки, верна ли область поиска.":
    {
      kk:
        "Тұрақты тербелістердің бірде-бір бөлігі табылмады (қатарынан кемінде 4 тербеліс қажет). " +
        "Қозғалыс графигін тексеріңіз: жүк көріне ме, қолдар кедергі жасамай ма, іздеу аймағы дұрыс па.",
      en:
        "No section of regular oscillations was found (at least 4 oscillations in a row are needed). " +
        "Check the motion graph: is the bob visible, are hands getting in the way, is the search area correct?",
    },
  "Видео ещё не обработано.": {
    kk: "Бейне әлі өңделмеген.",
    en: "The video has not been processed yet.",
  },
  "Нет связи с сервером": {
    kk: "Сервермен байланыс жоқ",
    en: "No connection to the server",
  },
};

/** Названия объектов из api/deps.py: "{what} не найден(о)". */
const OBJECTS: Record<string, Texts> = {
  Эксперимент: { kk: "Эксперимент", en: "Experiment" },
  Серия: { kk: "Серия", en: "Series" },
  Замер: { kk: "Өлшем", en: "Trial" },
  Видео: { kk: "Бейне", en: "Video" },
  Участок: { kk: "Бөлік", en: "Segment" },
};

/** Python печатает дробные числа с точкой; в kk — десятичная запятая. */
function localNumber(value: string, lang: Target): string {
  return lang === "kk" ? value.replace(".", ",") : value;
}

/** Сообщения с подставленными значениями (числа, имена, размеры). */
const PATTERNS: { re: RegExp; build: Builder }[] = [
  {
    re: /(Эксперимент|Серия|Замер|Видео|Участок) не найден\(о\)/g,
    build: ([what], lang) => `${OBJECTS[what]?.[lang] ?? what} ${lang === "kk" ? "табылмады" : "not found"}`,
  },
  {
    re: /Формат без расширения не поддерживается\. Допустимо: ([^;]+)/g,
    build: ([allowed], lang) =>
      lang === "kk"
        ? `Кеңейтімі жоқ файлға қолдау көрсетілмейді. Рұқсат етілгендер: ${allowed}`
        : `Files without an extension are not supported. Allowed: ${allowed}`,
  },
  {
    re: /Формат (\S+) не поддерживается\. Допустимо: ([^;]+)/g,
    build: ([format, allowed], lang) =>
      lang === "kk"
        ? `${format} пішіміне қолдау көрсетілмейді. Рұқсат етілгендер: ${allowed}`
        : `Format ${format} is not supported. Allowed: ${allowed}`,
  },
  {
    re: /Файл больше (\d+(?:[.,]\d+)?) МБ/g,
    build: ([size], lang) =>
      lang === "kk" ? `Файл ${localNumber(size, lang)} МБ-тан үлкен` : `The file is larger than ${size} MB`,
  },
  {
    re: /Нет такого метода API: (\S+)/g,
    build: ([path], lang) =>
      lang === "kk" ? `Мұндай API әдісі жоқ: ${path}` : `No such API method: ${path}`,
  },
  {
    re: /Груз найден только на (\d+) кадрах — нужно хотя бы (\d+)\./g,
    build: ([found, need], lang) =>
      lang === "kk"
        ? `Жүк тек ${found} кадрда табылды — кемінде ${need} кадр қажет.`
        : `The bob was found in only ${found} frames — at least ${need} are needed.`,
  },
  {
    re: /Не удалось прочитать кадр на (\d+(?:\.\d+)?) с\./g,
    build: ([time], lang) =>
      lang === "kk"
        ? `${localNumber(time, lang)} с уақыттағы кадрды оқу мүмкін болмады.`
        : `Could not read the frame at ${time} s.`,
  },
  {
    re: /Ошибка сервера \((\d+)\)/g,
    build: ([status], lang) => (lang === "kk" ? `Сервер қатесі (${status})` : `Server error (${status})`),
  },
];

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Длинные фразы раньше коротких, чтобы фрагмент не перехватил более полное сообщение.
const LITERAL_RE = new RegExp(
  "(?:Value error, )?(" +
    Object.keys(LITERALS)
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
      .join("|") +
    ")",
  "g",
);

export function translateServerMessage(message: string, lang: Lang): string {
  if (lang === "ru" || !message) return message;
  let result = message;
  // Сначала шаблоны: "Эксперимент не найден(о)" не должен попасть под точную фразу "Эксперимент не найден".
  for (const { re, build } of PATTERNS) {
    // Аргументы replace: совпадение, группы, смещение, исходная строка.
    result = result.replace(re, (...args: string[]) => build(args.slice(1, -2) as Groups, lang));
  }
  // Префикс pydantic "Value error, " перед известной фразой убирается вместе с ней.
  return result.replace(LITERAL_RE, (_match, phrase: string) => LITERALS[phrase]?.[lang] ?? phrase);
}
