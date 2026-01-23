import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { ChurchProvider } from "@/contexts/ChurchContext";
import { Loader2 } from "lucide-react";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";

// Lazy load all pages for better initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SOS = lazy(() => import("./pages/SOS"));
const Lesson = lazy(() => import("./pages/Lesson"));
const Tracks = lazy(() => import("./pages/Tracks"));
const TrackDetail = lazy(() => import("./pages/TrackDetail"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const ReadingPlan = lazy(() => import("./pages/ReadingPlan"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Library = lazy(() => import("./pages/Library"));
const Achievements = lazy(() => import("./pages/Achievements"));
const MySchedules = lazy(() => import("./pages/MySchedules"));
const Discipleship = lazy(() => import("./pages/Discipleship"));
const Ministry = lazy(() => import("./pages/Ministry"));
const Resources = lazy(() => import("./pages/Resources"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Optimized QueryClient with aggressive caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <Suspense fallback={<PageLoader />}>
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
          <Route path="/super-admin" element={<SuperAdmin />} />
          <Route path="/plano/:id" element={<ReadingPlan />} />
          <Route path="/alterar-senha" element={<ChangePassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/conquistas" element={<Achievements />} />
          <Route path="/minhas-escalas" element={<MySchedules />} />
          <Route path="/discipulado" element={<Discipleship />} />
          <Route path="/ministerio" element={<Ministry />} />
          <Route path="/recursos" element={<Resources />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <ChurchProvider>
        <TooltipProvider delayDuration={300}>
          <ImpersonationBanner />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ChurchProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
