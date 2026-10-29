import type { ColorRange } from "../api/types";
import { type Msg, useI18n } from "../i18n";

interface Props {
  color: ColorRange;
  onChange: (color: ColorRange) => void;
}

const SLIDERS: { key: keyof ColorRange; label: Msg; max: number }[] = [
  { key: "h_min", label: { kk: "Реңк: бастап", ru: "Оттенок от", en: "Hue from" }, max: 179 },
  { key: "h_max", label: { kk: "Реңк: дейін", ru: "Оттенок до", en: "Hue to" }, max: 179 },
  { key: "s_min", label: { kk: "Қанықт.: бастап", ru: "Насыщ. от", en: "Sat. from" }, max: 255 },
  { key: "v_min", label: { kk: "Жарықтық: бастап", ru: "Яркость от", en: "Brightness from" }, max: 255 },
];

function hueSegments(c: ColorRange): { left: number; width: number }[] {
  const pct = (h: number) => (h / 180) * 100;
  if (c.h_min <= c.h_max) return [{ left: pct(c.h_min), width: pct(c.h_max - c.h_min + 1) }];
  // Диапазон «через ноль» (красный цвет): две части полосы.
  return [
    { left: pct(c.h_min), width: 100 - pct(c.h_min) },
    { left: 0, width: pct(c.h_max + 1) },
  ];
}

export function ColorControls({ color, onChange }: Props) {
  const { t } = useI18n();
  return (
    <div className="hsv-grid">
      <span />
      <div className="hue-strip" aria-hidden>
        {hueSegments(color).map((s, i) => (
          <span key={i} style={{ left: `${s.left}%`, width: `${s.width}%` }} />
        ))}
      </div>
      <span />
      {SLIDERS.map(({ key, label, max }) => (
        <label key={key} style={{ display: "contents" }}>
          <span className="secondary">{t(label)}</span>
          <input
            type="range"
            min={0}
            max={max}
            value={color[key]}
            onChange={(e) => onChange({ ...color, [key]: Number(e.target.value) })}
          />
          <span className="nums">{color[key]}</span>
        </label>
      ))}
    </div>
  );
}
