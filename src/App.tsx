
import React, { StrictMode, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from '@/store/authStore';
import { LoginForm } from '@/components/auth/LoginForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import Board from "./pages/Board";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

// Create QueryClient outside of component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Separate the authenticated app component to properly use hooks
const AuthenticatedApp = () => {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  // Use effect in the component
  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DashboardLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/board" replace />} />
              <Route path="/board" element={<Board />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DashboardLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Main App component doesn't use hooks directly
const App = () => {
  return (
    <StrictMode>
      <AuthenticatedApp />
    </StrictMode>
  );
};

export default App;
