import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Use HashRouter for itch.io builds (works with any base path)
// BrowserRouter for regular builds (cleaner URLs)
const Router = import.meta.env.MODE === 'itch' ? HashRouter : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
