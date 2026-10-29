import { useCallback, useEffect, useRef, useState } from "react";

import { UNITS, useI18n } from "../i18n";
import { clock, num } from "../lib/format";
import { readLocal, writeLocal } from "../lib/storage";

const M = {
  start: { kk: "Старт", ru: "Старт", en: "Start" },
  stop: { kk: "Стоп", ru: "Стоп", en: "Stop" },
  save: { kk: "Сақтау", ru: "Сохранить", en: "Save" },
  reset: { kk: "Нөлдеу", ru: "Сбросить", en: "Reset" },
  space: { kk: "Бос орын", ru: "Пробел", en: "Space" },
  hint: {
    kk: "— старт/стоп. Секундомерді жүк төменгі нүктеден өткен сәтте қосыңыз және тоқтатыңыз.",
    ru: "— старт/стоп. Включайте и выключайте в момент прохождения груза через нижнюю точку.",
    en: "— start/stop. Start and stop it at the moment the bob passes through the lowest point.",
  },
  periods: { kk: "Тербеліс саны N", ru: "Колебаний N", en: "Oscillations N" },
  operator: { kk: "Кім өлшеді", ru: "Кто измерял", en: "Measured by" },
  name: { kk: "Аты", ru: "Имя", en: "Name" },
  autoSave: {
    kk: "Тоқтатқаннан кейін өлшемді бірден сақтау",
    ru: "Сохранять замер сразу после остановки",
    en: "Save the trial right after stopping",
  },
};

interface Props {
  defaultPeriods: number;
  saving: boolean;
  onSave: (input: { periods: number; total_time_s: number; operator: string }) => void;
}

type State = { kind: "idle" } | { kind: "running"; start: number } | { kind: "stopped"; elapsed: number };

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");

/**
 * Встроенный секундомер. Момент нажатия берётся из event.timeStamp (время самого события
 * ввода), а не из времени обработки — так задержки браузера не добавляются к реакции человека.
 * Кнопка срабатывает на pointerdown, как настоящий секундомер, а не на отпускание.
 */
export function Stopwatch({ defaultPeriods, saving, onSave }: Props) {
  const { t } = useI18n();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [now, setNow] = useState(0);
  const [periods, setPeriods] = useState(String(defaultPeriods));
  const [operator, setOperator] = useState(() => readLocal("operator", ""));
  const [autoSave, setAutoSave] = useState(() => readLocal("autosave", "0") === "1");
  const frame = useRef(0);

  const n = Number(periods);
  const periodsValid = Number.isInteger(n) && n >= 1 && n <= 500;

  useEffect(() => writeLocal("operator", operator), [operator]);
  useEffect(() => writeLocal("autosave", autoSave ? "1" : "0"), [autoSave]);

  useEffect(() => {
    if (state.kind !== "running") return;
    const tick = () => {
      setNow(performance.now());
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [state.kind]);

  // Ref нужен, чтобы обработчик нажатия видел актуальное состояние без побочных эффектов
  // внутри setState (StrictMode вызывает функции-обновители дважды).
  const stateRef = useRef(state);
  const update = useCallback((next: State) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const save = useCallback(
    (elapsed: number) => {
      if (!periodsValid) return;
      onSave({ periods: n, total_time_s: Math.round(elapsed * 1000) / 1000, operator });
      update({ kind: "idle" });
    },
    [n, operator, onSave, periodsValid, update],
  );

  const toggle = useCallback(
    (timeStamp: number) => {
      const current = stateRef.current;
      if (current.kind === "running") {
        const elapsed = (timeStamp - current.start) / 1000;
        update({ kind: "stopped", elapsed });
        if (autoSave) save(elapsed);
      } else {
        setNow(timeStamp);
        update({ kind: "running", start: timeStamp });
      }
    },
    [autoSave, save, update],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target) || event.repeat) return;
      if (event.code === "Space") {
        event.preventDefault();
        toggle(event.timeStamp);
      } else if (event.key === "Enter" && state.kind === "stopped") {
        event.preventDefault();
        save(state.elapsed);
      } else if (event.key === "Escape") {
        update({ kind: "idle" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, save, state, update]);

  const elapsed =
    state.kind === "running" ? Math.max(now - state.start, 0) / 1000 : state.kind === "stopped" ? state.elapsed : 0;

  return (
    <div className="stack">
      <div className="stopwatch">
        <div className={`stopwatch__display ${state.kind === "running" ? "running" : ""}`} aria-live="off">
          {clock(elapsed)}
        </div>
        {state.kind === "stopped" && periodsValid && (
          <div className="secondary">
            T = {num(elapsed, 3)} / {n} = <strong>{num(elapsed / n, 4)} {t(UNITS.s)}</strong>
          </div>
        )}
        <button
          type="button"
          className={`stopwatch__button ${state.kind === "running" ? "" : "primary"}`}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            toggle(e.timeStamp);
          }}
          onKeyDown={(e) => e.preventDefault()}
        >
          {state.kind === "running" ? t(M.stop) : t(M.start)}
        </button>
        {state.kind === "stopped" && (
          <div className="row">
            <button className="primary" disabled={!periodsValid || saving} onClick={() => save(state.elapsed)}>
              {t(M.save)} <kbd>Enter</kbd>
            </button>
            <button onClick={() => update({ kind: "idle" })}>
              {t(M.reset)} <kbd>Esc</kbd>
            </button>
          </div>
        )}
        <div className="muted small">
          <kbd>{t(M.space)}</kbd> {t(M.hint)}
        </div>
      </div>
      <div className="form-row">
        <label className="field">
          {t(M.periods)}
          <input
            inputMode="numeric"
            value={periods}
            onChange={(e) => setPeriods(e.target.value)}
            aria-invalid={!periodsValid}
          />
        </label>
        <label className="field">
          {t(M.operator)}
          <input value={operator} onChange={(e) => setOperator(e.target.value)} placeholder={t(M.name)} maxLength={100} />
        </label>
      </div>
      <label className="row small secondary">
        <input type="checkbox" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} />
        {t(M.autoSave)}
      </label>
    </div>
  );
}
