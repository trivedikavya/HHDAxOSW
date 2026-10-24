import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/AppShell.jsx";
import { ScanProvider } from "./features/scan/ScanContext.jsx";
import { AiProvider } from "./features/ai/AiContext.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { LandingPage } from "./pages/LandingPage.jsx";
import { OverviewPage } from "./pages/OverviewPage.jsx";
import { ScanPage } from "./pages/ScanPage.jsx";
import { FindingsPage } from "./pages/FindingsPage.jsx";
import { ReportsPage } from "./pages/ReportsPage.jsx";
import { AboutPage } from "./pages/AboutPage.jsx";

/**
 * Route structure:
 *   "/"       - public landing page (marketing/explainer, no sidebar)
 *   "/app/*"  - the working dashboard (sidebar + topbar shell)
 *
 * Keeping these separate means the working dashboard stays calm and
 * non-marketing (per the product's design rules) while the landing page
 * gets full room to explain the product and link to both "try the live
 * demo" and "run it locally".
 */
export function App() {
  return (
    <ToastProvider>
      <ScanProvider>
        <AiProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/app" element={<AppShell />}>
                <Route index element={<OverviewPage />} />
                <Route path="scan" element={<ScanPage />} />
                <Route path="findings" element={<FindingsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="about" element={<AboutPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AiProvider>
      </ScanProvider>
    </ToastProvider>
  );
}
