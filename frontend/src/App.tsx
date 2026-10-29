import { lazy, Suspense } from "react";
import { Link, NavLink, Route, Routes } from "react-router";

import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { Loading } from "./components/Status";
import { APP_TITLE, useI18n } from "./i18n";
import { ExperimentLayout } from "./pages/ExperimentLayout";
import { ExperimentsPage } from "./pages/ExperimentsPage";
import { MeasurementsPage } from "./pages/MeasurementsPage";
import { MethodPage } from "./pages/MethodPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SeriesPage } from "./pages/SeriesPage";

// Страница видео тянет Recharts — грузим её отдельным чанком по требованию.
const VideoPage = lazy(() => import("./pages/VideoPage").then((m) => ({ default: m.VideoPage })));

const M = {
  experiments: { kk: "Эксперименттер", ru: "Эксперименты", en: "Experiments" },
  method: { kk: "Әдістеме", ru: "Методика", en: "Method" },
};

export function App() {
  const { t } = useI18n();
  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/" className="brand">
            <img src="/favicon.svg" alt="" />
            <span className="brand__name">{t(APP_TITLE)}</span>
          </Link>
          <nav className="nav">
            <NavLink to="/" end>
              {t(M.experiments)}
            </NavLink>
            <NavLink to="/method">{t(M.method)}</NavLink>
          </nav>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="container">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route index element={<ExperimentsPage />} />
            <Route path="method" element={<MethodPage />} />
            <Route path="experiments/:experimentId" element={<ExperimentLayout />}>
              <Route index element={<MeasurementsPage />} />
              <Route path="series/:seriesId" element={<SeriesPage />} />
              <Route path="videos/:videoId" element={<VideoPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}
