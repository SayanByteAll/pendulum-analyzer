import { Link } from "react-router";

import { Empty } from "../components/Status";
import { useI18n } from "../i18n";

const M = {
  title: { kk: "Бет табылмады", ru: "Страница не найдена", en: "Page not found" },
  back: { kk: "Эксперименттер тізіміне", ru: "К списку экспериментов", en: "Back to experiments" },
};

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <Empty>
      <h1>{t(M.title)}</h1>
      <Link to="/">{t(M.back)}</Link>
    </Empty>
  );
}
