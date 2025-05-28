import React, { StrictMode, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from '@/store/authStore';
import { useNotificationSubscriptions } from '@/hooks/useNotificationSubscriptions';
import { LoginForm } from '@/components/auth/LoginForm';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { PWAInstallPrompt } from '@/components/ui/PWAInstallPrompt';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { CampaignBuilderPage } from '@/pages/CampaignBuilderPage';
import { AssetManagerPage } from '@/pages/AssetManagerPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TestingPage } from '@/pages/TestingPage';
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
  const { user, isAuthenticated, isLoading, initialize } = useAuthStore();
  
  // Initialize notification subscriptions
  useNotificationSubscriptions();

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

  // Show onboarding if user hasn't completed it
  if (!user?.onboardingCompleted) {
    return <OnboardingWizard />;
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
              <Route path="/dashboard" element={<Navigate to="/board" replace />} />
              <Route path="/board" element={<Board />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/campaigns/new" element={<CampaignBuilderPage />} />
              <Route path="/campaigns/:id/edit" element={<CampaignBuilderPage />} />
              <Route path="/assets" element={<AssetManagerPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/testing" element={<TestingPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DashboardLayout>
          
          {/* PWA Install Prompt */}
          <PWAInstallPrompt />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Main App component with error boundary
const App = () => {
  return (
    <StrictMode>
      <ErrorBoundary>
        <AuthenticatedApp />
      </ErrorBoundary>
    </StrictMode>
  );
};

export default App;
