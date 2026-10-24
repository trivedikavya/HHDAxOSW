import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/AppShell.jsx";
import { ScanProvider } from "./features/scan/ScanContext.jsx";
import { AiProvider } from "./features/ai/AiContext.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { OverviewPage } from "./pages/OverviewPage.jsx";
import { ScanPage } from "./pages/ScanPage.jsx";
import { FindingsPage } from "./pages/FindingsPage.jsx";
import { ReportsPage } from "./pages/ReportsPage.jsx";
import { AboutPage } from "./pages/AboutPage.jsx";

export function App() {
  return (
    <ToastProvider>
      <ScanProvider>
        <AiProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppShell />}>
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
