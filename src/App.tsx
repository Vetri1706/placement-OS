import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LandingPage from "@/components/LandingPage";
import ProblemDetailPage from "@/pages/ProblemDetailPage";
import StartupOrchestrator from "@/components/StartupOrchestrator";

const queryClient = new QueryClient();

/**
 * Wraps the main app shell with the StartupOrchestrator.
 * Checks run once per session; subsequent navigations skip the gate.
 */
function AppWithStartup() {
  const [startupDone, setStartupDone] = useState(false);

  if (!startupDone) {
    return <StartupOrchestrator onReady={() => setStartupDone(true)} />;
  }

  return <Index />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>

      <Toaster />
      <Sonner />

      <div className="app-shell">
        <HashRouter>
          <Routes>
            <Route index element={<LandingPage />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<AppWithStartup />} />
            <Route path="/problem/:id" element={<ProblemDetailPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </div>

    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
