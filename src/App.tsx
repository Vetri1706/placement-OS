import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LandingPage from "@/components/LandingPage";
import ProblemDetailPage from "@/pages/ProblemDetailPage";

const queryClient = new QueryClient();

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
            <Route path="/app" element={<Index />} />
            <Route path="/problem/:id" element={<ProblemDetailPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </div>

    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
