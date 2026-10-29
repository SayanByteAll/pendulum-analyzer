import type { ReactNode } from "react";

import { type Lang, type Msg, useI18n } from "../i18n";

const M = {
  title: { kk: "Әдістеме", ru: "Методика", en: "Method" },
  intro: {
    kk: "Секундомер мен камераны әділ салыстыру үшін экспериментті қалай жүргізу керек және бағдарлама деректермен не істейді.",
    ru: "Как провести эксперимент, чтобы сравнение секундомера и камеры было честным, и что программа делает с данными.",
    en: "How to run the experiment so that the comparison of the stopwatch and the camera is fair, and what the program does with the data.",
  },
  setup: { kk: "1. Қондырғы", ru: "1. Установка", en: "1. Setup" },
  protocol: {
    kk: "2. Өлшеу хаттамасы",
    ru: "2. Протокол измерений",
    en: "2. Measurement protocol",
  },
  video: {
    kk: "3. Бағдарлама бейнеден периодты қалай табады",
    ru: "3. Как программа находит период по видео",
    en: "3. How the program finds the period from video",
  },
  amplitude: {
    kk: "4. Период және амплитуда",
    ru: "4. Период и амплитуда",
    en: "4. Period and amplitude",
  },
  compare: {
    kk: "5. Әдістер қалай салыстырылады",
    ru: "5. Как сравниваются методы",
    en: "5. How the methods are compared",
  },
  errors: {
    kk: "6. Қателік көздері",
    ru: "6. Источники погрешности",
    en: "6. Sources of error",
  },
} satisfies Record<string, Msg>;

const SETUP: Record<Lang, ReactNode> = {
  kk: (
    <ul>
      <li>Жіңішке созылмайтын жіпке ілінген кішкентай ауыр жүк (болат шарик, сомын); қатты бекітпе.</li>
      <li>V әрпі тәрізді екі жіпті аспа жүкті бір жазықтықта ұстайды — эллипс бойымен қозғалыс болмайды.</li>
      <li>
        L ұзындығын <strong>аспа нүктесінен жүктің центріне дейін</strong> өлшеңіз және оның σL қателігін
        жазып алыңыз (әдетте 0,2–0,5 см).
      </li>
      <li>
        Жүкпен контрастты бір түсті фон. Маркер міндетті емес: ақ қабырға алдындағы болат шарик өздігінен
        табылады. Серия кезінде кадрға жүктің жанына кірмеңіз.
      </li>
      <li>
        Телефон штативте, 1,5–2 м қашықтықта бүйірден, тербеліс жазықтығына перпендикуляр. Кадрда — аспа
        нүктесі және сызғыш (масштаб үшін).
      </li>
      <li>Жарық көп болсын: қысқа экспозицияда жүк төменгі нүктеде жайылып көрінбейді.</li>
    </ul>
  ),
  ru: (
    <ul>
      <li>Маленький тяжёлый груз (стальной шарик, гайка) на тонкой нерастяжимой нити; жёсткое крепление.</li>
      <li>Подвес на двух нитях буквой V удерживает груз в одной плоскости — без эллиптического движения.</li>
      <li>
        Длину L измеряйте <strong>от точки подвеса до центра груза</strong> и запишите её погрешность σL
        (обычно 0,2–0,5 см).
      </li>
      <li>
        Однотонный фон, контрастный к грузу. Маркер не обязателен: стальной шарик на белой стене находится
        сам. Во время серии не заходите в кадр рядом с грузом.
      </li>
      <li>
        Телефон на штативе в 1,5–2 м сбоку, перпендикулярно плоскости колебаний. В кадре — точка подвеса и
        линейка (для масштаба).
      </li>
      <li>Много света: короткая выдержка — груз не размазывается в нижней точке.</li>
    </ul>
  ),
  en: (
    <ul>
      <li>A small heavy bob (a steel ball, a nut) on a thin inextensible string; a rigid mount.</li>
      <li>A V-shaped suspension on two strings keeps the bob in one plane — no elliptical motion.</li>
      <li>
        Measure the length L <strong>from the pivot point to the centre of the bob</strong> and write down its
        uncertainty σL (usually 0.2–0.5 cm).
      </li>
      <li>
        A plain background that contrasts with the bob. A marker is not required: a steel ball against a white
        wall is found automatically. Do not step into the frame near the bob during a series.
      </li>
      <li>
        The phone on a tripod 1.5–2 m to the side, perpendicular to the plane of oscillation. The pivot point
        and a ruler (for scale) must be in the frame.
      </li>
      <li>Plenty of light: with a short exposure the bob is not blurred at the lowest point.</li>
    </ul>
  ),
};

const PROTOCOL: Record<Lang, ReactNode> = {
  kk: (
    <ol>
      <li>
        Жүкті 5–15°-қа ауытқытыңыз. Үлкен бұрыштарды бағдарлама түзетумен ескереді, бірақ секундомер мен
        формула үшін бұрыш неғұрлым кіші болса, соғұрлым жақсы: 15°-та период формуладағыдан 0,43 %-ға артық.
      </li>
      <li>Бейне жазуды қосыңыз (60 кадр/с жақсырақ), жүкті жіберіңіз, 1–2 тербеліс күтіңіз.</li>
      <li>
        <strong>Сонымен бір мезгілде</strong> секундомермен 10 тербелісті өлшеңіз: жүк төменгі нүктеден өткен
        сәтте басыңыз (онда ол ең жылдам қозғалады — сәт анығырақ көрінеді).
      </li>
      <li>
        Әр ұзындық үшін кемінде 10 рет қайталаңыз. Бейнені бір ұзақ жазбамен түсіруге болады: әртүрлі
        ұзындықтардың серияларын бағдарлама өзі табады.
      </li>
      <li>
        Қосымша бір ұзындық үшін: 1, 5, 10 және 20 тербеліс бойынша өлшемдер — қателіктің 1/N сияқты азаятынын
        көрсетеді.
      </li>
    </ol>
  ),
  ru: (
    <ol>
      <li>
        Отклоните груз на 5–15°. Большие углы программа учтёт поправкой, но для секундомера и формулы чем
        меньше угол, тем лучше: при 15° период уже на 0,43 % больше формульного.
      </li>
      <li>Включите запись видео (лучше 60 кадр/с), отпустите груз, подождите 1–2 колебания.</li>
      <li>
        <strong>Одновременно</strong> измеряйте секундомером 10 колебаний: нажимайте в момент прохождения
        груза через нижнюю точку (там он движется быстрее всего — момент виден чётче).
      </li>
      <li>
        Повторите не менее 10 раз для каждой длины. Видео можно снимать одной длинной записью: серии разных
        длин программа найдёт сама.
      </li>
      <li>
        Дополнительно для одной длины: замеры 1, 5, 10 и 20 колебаний — покажут, что ошибка падает как 1/N.
      </li>
    </ol>
  ),
  en: (
    <ol>
      <li>
        Pull the bob aside by 5–15°. The program corrects for larger angles, but for the stopwatch and the
        formula the smaller the angle the better: at 15° the period is already 0.43 % longer than the formula
        gives.
      </li>
      <li>Start recording video (60 fps is better), release the bob, wait for 1–2 oscillations.</li>
      <li>
        <strong>At the same time</strong> time 10 oscillations with the stopwatch: press when the bob passes
        the lowest point (it moves fastest there, so the moment is easier to see).
      </li>
      <li>
        Repeat at least 10 times for each length. The video can be one long recording: the program finds the
        series for different lengths by itself.
      </li>
      <li>
        In addition, for one length: trials of 1, 5, 10 and 20 oscillations show that the error falls as 1/N.
      </li>
    </ol>
  ),
};

const VIDEO: Record<Lang, ReactNode> = {
  kk: (
    <ol>
      <li>
        <strong>Маркерсіз жүк.</strong> Фон — кадрлардың медианасы: жүк әр нүктеде аз уақыт болады да,
        медианаға түспейді. Жүк — фоннан ерекшеленетін дақ; оның центрі айырмашылық шамасы бойынша өлшенеді
        (OpenCV, нейрондық желілерсіз). Түрлі түсті маркер үшін екінші режим бар — HSV түсі бойынша.
      </li>
      <li>
        <strong>Ұзақ жазба.</strong> Бағдарлама еркін тербеліс бөліктерін өзі табады: жүк көрінеді, жарты
        периодтар біркелкі, амплитуда өспейді (өсу — қолмен итеру). Содан кейін әр бөлік тек өз кадрларынан
        құрылған фонмен қайта трекингтеледі — әйтпесе іске қосар алдында қолмен ұсталған жүк фонға «басылып»
        қалады.
      </li>
      <li>
        Кадр уақыты «кадр нөмірі / 30» ретінде емес, файлдағы уақыт белгісінен алынады: телефондар жиі
        айнымалы кадр жиілігімен түсіреді, ал 30 орнына 29,97 — бұл қазірдің өзінде 0,1 % қателік.
      </li>
      <li>
        Сәттер <strong>тепе-теңдік күйінен өту</strong> бойынша анықталады: онда жылдамдық ең үлкен. Әр сәт
        екі көрші кадр бойынша емес, жарты тербелістің бүкіл орталық бөлігі бойынша нақтыланады
        (arcsin((x−c)/A) фазасы сызықты өседі).
      </li>
      <li>
        Барлық сәттер арқылы t = a + k·T/2 + q·k² қисығы жүргізіледі (q өшу салдарынан периодтың баяу ығысуын
        ескереді). Трекинг ақаулары алынып тасталады. Нүктелердің қисық маңындағы шашырауы — бір сәтті тіркеу
        қателігі.
      </li>
    </ol>
  ),
  ru: (
    <ol>
      <li>
        <strong>Груз без маркера.</strong> Фон — медиана кадров: груз в каждой точке бывает недолго и в
        медиану не попадает. Груз — пятно, отличающееся от фона; его центр взвешивается по величине отличия
        (OpenCV, без нейросетей). Для цветного маркера есть второй режим — по цвету HSV.
      </li>
      <li>
        <strong>Длинная запись.</strong> Программа сама находит участки свободных колебаний: груз виден,
        полупериоды регулярны, амплитуда не растёт (рост — это толчок рукой). Затем каждый участок трекается
        повторно с фоном только из его кадров — иначе груз, который держали рукой перед запуском,
        «впечатывается» в фон.
      </li>
      <li>
        Время кадра берётся из метки времени в файле, а не как «номер кадра / 30»: телефоны часто снимают с
        переменной частотой кадров, и 29,97 вместо 30 — это уже 0,1 % ошибки.
      </li>
      <li>
        Моменты определяются по <strong>прохождению положения равновесия</strong>: там скорость максимальна.
        Каждый момент уточняется по всей центральной части полуколебания (фаза arcsin((x−c)/A) растёт
        линейно), а не по двум соседним кадрам.
      </li>
      <li>
        Через все моменты проводится кривая t = a + k·T/2 + q·k² (q учитывает медленный дрейф периода из-за
        затухания). Сбои трекинга отбрасываются. Разброс точек вокруг кривой — погрешность фиксации одного
        момента.
      </li>
    </ol>
  ),
  en: (
    <ol>
      <li>
        <strong>Bob without a marker.</strong> The background is the median of the frames: the bob stays at
        any point only briefly and does not get into the median. The bob is a spot that differs from the
        background; its centre is weighted by the size of the difference (OpenCV, no neural networks). For a
        coloured marker there is a second mode — by HSV colour.
      </li>
      <li>
        <strong>Long recording.</strong> The program finds the sections of free oscillation by itself: the bob
        is visible, the half-periods are regular, the amplitude does not grow (growth means a push by hand).
        Then each section is tracked again with a background built only from its own frames — otherwise the
        bob that was held by hand before the release gets “printed” into the background.
      </li>
      <li>
        The time of each frame is taken from the timestamp in the file, not as “frame number / 30”: phones
        often record with a variable frame rate, and 29.97 instead of 30 is already a 0.1 % error.
      </li>
      <li>
        The moments are found from <strong>passing through the equilibrium position</strong>, where the speed
        is highest. Each moment is refined using the whole central part of the half-oscillation (the phase
        arcsin((x−c)/A) grows linearly), not just two neighbouring frames.
      </li>
      <li>
        A curve t = a + k·T/2 + q·k² is fitted through all the moments (q accounts for the slow drift of the
        period due to damping). Tracking glitches are discarded. The scatter of the points around the curve is
        the error of timing a single moment.
      </li>
    </ol>
  ),
};

const AMPLITUDE: Record<Lang, ReactNode> = {
  kk: (
    <>
      <p>
        Жүк центрі аспа нүктесінде жатқан шеңбер доғасы бойымен қозғалады, сондықтан траекторияға шеңбер
        сәйкестендіру пайдаланушы басуынсыз аспа нүктесін және жіптің пиксельдегі ұзындығын береді, демек, әр
        тербелістің амплитуда бұрышын да береді. Әр жеке период кіші амплитудаға келтіріледі: T₀ = T / (1 +
        θ²/16 + 11θ⁴/3072). T = T₀(1 + k·θ²) сәйкестендіруі теорияны тексереді: k ≈ 1/16 шығуы керек.
      </p>
      <p>
        Мұны секундомер істей алмайды: 25° бұрышта период «формуладағыдан» 1,2 %-ға артық, ал серия бойы,
        амплитуда өшкен сайын, ол бірнеше миллисекундқа біртіндеп кемиді.
      </p>
    </>
  ),
  ru: (
    <>
      <p>
        Груз движется по дуге окружности с центром в точке подвеса, поэтому подгонка окружности к траектории
        даёт подвес и длину нити в пикселях без клика пользователя, а значит, и угол амплитуды каждого
        колебания. Каждый отдельный период приводится к малой амплитуде: T₀ = T / (1 + θ²/16 + 11θ⁴/3072).
        Подгонка T = T₀(1 + k·θ²) проверяет теорию: должно получиться k ≈ 1/16.
      </p>
      <p>
        Это то, чего не может секундомер: при угле 25° период больше «формульного» на 1,2 %, и за серию, пока
        амплитуда затухает, он плавно уменьшается на несколько миллисекунд.
      </p>
    </>
  ),
  en: (
    <>
      <p>
        The bob moves along a circular arc centred at the pivot point, so fitting a circle to the trajectory
        gives the pivot and the string length in pixels without any click by the user, and therefore the
        amplitude angle of every oscillation. Each individual period is reduced to small amplitude: T₀ = T /
        (1 + θ²/16 + 11θ⁴/3072). The fit T = T₀(1 + k·θ²) tests the theory: it should give k ≈ 1/16.
      </p>
      <p>
        This is something a stopwatch cannot do: at an angle of 25° the period is 1.2 % longer than the
        formula gives, and during a series, as the amplitude decays, it gradually decreases by a few
        milliseconds.
      </p>
    </>
  ),
};

const COMPARE: Record<Lang, ReactNode> = {
  kk: (
    <>
      <p>
        Секундомер да, камера да екі оқиға арасындағы аралықты өлшейді, сондықтан N тербеліс бойынша период
        қателігі √2·σ/N-ге тең, мұндағы σ — бір сәтті тіркеу қателігі. Секундомер үшін σ қайталанған
        өлшемдердің шашырауы бойынша, камера үшін — регрессия қалдықтары бойынша бағаланады. Екі әдістің σ
        мәндерін F-тестпен салыстыру — жоба гипотезасын тексерудің өзі.
      </p>
      <p>
        Формуламен салыстыруға әдетте таймер емес, ұзындық кедергі болады: ΔT/T = ½·ΔL/L. Сондықтан өлшенген
        деректер бойынша T²-тың L-ге тәуелділік графигін салған жөн: көлбеулігі g-ні береді, ал осьтен қиып
        өтетін кесінді — ұзындыққа ескерілмеген қосымшаны (мысалы, жүктің масса центріне дейінгі қашықтықты).
      </p>
    </>
  ),
  ru: (
    <>
      <p>
        И секундомер, и камера измеряют интервал между двумя событиями, поэтому ошибка периода по N колебаниям
        равна √2·σ/N, где σ — погрешность фиксации одного момента. Для секундомера σ оценивается по разбросу
        повторных замеров, для камеры — по остаткам регрессии. Сравнение σ двух методов F-тестом и есть
        проверка гипотезы проекта.
      </p>
      <p>
        Сравнение с формулой обычно упирается не в таймер, а в длину: ΔT/T = ½·ΔL/L. Поэтому по измеренным
        данным стоит построить график T² от L: наклон даёт g, а отрезок на оси — неучтённую добавку к длине
        (например, расстояние до центра масс груза).
      </p>
    </>
  ),
  en: (
    <>
      <p>
        Both the stopwatch and the camera measure the interval between two events, so the error of the period
        over N oscillations is √2·σ/N, where σ is the error of timing a single moment. For the stopwatch σ is
        estimated from the scatter of repeated trials, for the camera from the regression residuals. Comparing
        the σ of the two methods with an F-test is exactly the test of the project's hypothesis.
      </p>
      <p>
        The comparison with the formula is usually limited not by the timer but by the length: ΔT/T = ½·ΔL/L.
        That is why it is worth plotting T² against L from the measured data: the slope gives g, and the
        intercept gives an unaccounted addition to the length (for example, the distance to the bob's centre
        of mass).
      </p>
    </>
  ),
};

const ERRORS: Record<Lang, ReactNode> = {
  kk: (
    <ul>
      <li>Басу кезіндегі адам реакциясы (секундомер үшін негізгісі, бір басуға ~30–60 мс).</li>
      <li>Тербелістерді санаудағы қате — бағдарлама мұндай өлшемдерді шығыңқы мәндер деп белгілейді.</li>
      <li>Ұзындықтың дәл өлшенбеуі және санақ нүктесінің қате алынуы (жүктің масса центрі).</li>
      <li>Шекті амплитуда және оның өшуі — әр период үшін θ²/16 түзетуімен ескеріледі.</li>
      <li>
        «Ілмек арқылы өткен жіп» аспасы нүктелік емес: үлкен бұрыштарда жіп иіліп, тиімді ұзындық өзгереді.
        Жіпті екі пластинаның арасына қысқан сенімдірек.
      </li>
      <li>
        Перспектива мен масштаб <em>периодқа</em> дерлік әсер етпейді: центрден өту сәті оларға тәуелсіз. Олар
        тек амплитуданы градусқа айналдыру үшін маңызды.
      </li>
      <li>Ауаның кедергісі: амплитуданы азайтады, периодқа әсері елеусіз аз.</li>
    </ul>
  ),
  ru: (
    <ul>
      <li>Реакция человека при нажатии (основная для секундомера, ~30–60 мс на нажатие).</li>
      <li>Ошибка счёта колебаний — программа помечает такие замеры как выбросы.</li>
      <li>Неточная длина и неверная точка отсчёта (центр масс груза).</li>
      <li>Конечная амплитуда и её затухание — учитываются поправкой θ²/16 для каждого периода.</li>
      <li>
        Подвес «нить через крючок» не точечный: при больших углах нить перегибается и эффективная длина
        меняется. Надёжнее зажать нить между двумя пластинками.
      </li>
      <li>
        Перспектива и масштаб на <em>период</em> почти не влияют: момент прохождения центра от них не зависит.
        Они важны только для пересчёта амплитуды в градусы.
      </li>
      <li>Сопротивление воздуха: уменьшает амплитуду, на период влияет пренебрежимо мало.</li>
    </ul>
  ),
  en: (
    <ul>
      <li>Human reaction time when pressing (the main one for the stopwatch, ~30–60 ms per press).</li>
      <li>Miscounting the oscillations — the program marks such trials as outliers.</li>
      <li>An inaccurate length and a wrong reference point (the bob's centre of mass).</li>
      <li>Finite amplitude and its decay — corrected for each period with the θ²/16 term.</li>
      <li>
        A “string over a hook” suspension is not a point: at large angles the string bends and the effective
        length changes. It is more reliable to clamp the string between two plates.
      </li>
      <li>
        Perspective and scale have almost no effect on the <em>period</em>: the moment of passing the centre
        does not depend on them. They matter only for converting the amplitude into degrees.
      </li>
      <li>Air resistance: it reduces the amplitude, its effect on the period is negligible.</li>
    </ul>
  ),
};

export function MethodPage() {
  const { t, lang } = useI18n();
  return (
    <div className="stack methodology">
      <div>
        <h1>{t(M.title)}</h1>
        <p className="secondary">{t(M.intro)}</p>
      </div>

      <section className="card">
        <h2>{t(M.setup)}</h2>
        {SETUP[lang]}
      </section>

      <section className="card">
        <h2>{t(M.protocol)}</h2>
        {PROTOCOL[lang]}
      </section>

      <section className="card">
        <h2>{t(M.video)}</h2>
        {VIDEO[lang]}
      </section>

      <section className="card">
        <h2>{t(M.amplitude)}</h2>
        {AMPLITUDE[lang]}
      </section>

      <section className="card">
        <h2>{t(M.compare)}</h2>
        {COMPARE[lang]}
      </section>

      <section className="card">
        <h2>{t(M.errors)}</h2>
        {ERRORS[lang]}
      </section>
    </div>
  );
}
