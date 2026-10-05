import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ButtonPreview from "./pages/ButtonPreview";
import NotFound from "./pages/NotFound";
import { useAndroidBackButton } from "@/hooks/useAndroidBackButton";
import { useOAuthRedirect } from "@/hooks/useOAuthRedirect";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const { user, loading } = useAuth();
  useAndroidBackButton();
  useOAuthRedirect();

  if (loading && window.location.pathname === '/auth') {
    return null;
  }

  return (
    <Routes>
      {/* Auth page - redirect to home if already logged in */}
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      
      {/* Visual Button Preview & Chooser */}
      <Route path="/preview" element={<ButtonPreview />} />

      {/* Main app - accessible to both guests and logged in users */}
      <Route path="/" element={<Index />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
