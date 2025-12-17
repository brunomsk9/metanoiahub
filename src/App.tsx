import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SOS from "./pages/SOS";
import Lesson from "./pages/Lesson";
import Tracks from "./pages/Tracks";
import TrackDetail from "./pages/TrackDetail";
import CourseDetail from "./pages/CourseDetail";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import ReadingPlan from "./pages/ReadingPlan";
import ChangePassword from "./pages/ChangePassword";
import Onboarding from "./pages/Onboarding";
import Library from "./pages/Library";
import NotFound from "./pages/NotFound";

// Optimized QueryClient with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trilhas" element={<Tracks />} />
        <Route path="/trilha/:id" element={<TrackDetail />} />
        <Route path="/curso/:id" element={<CourseDetail />} />
        <Route path="/sos" element={<SOS />} />
        <Route path="/biblioteca" element={<Library />} />
        <Route path="/aula/:id" element={<Lesson />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/plano/:id" element={<ReadingPlan />} />
        <Route path="/alterar-senha" element={<ChangePassword />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
