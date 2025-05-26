import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Download, Smartphone, Monitor, Zap } from 'lucide-react';
import { useIsMobile } from '@/hooks/useResponsive';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check for iOS standalone mode
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Show prompt after a delay if not dismissed recently
      const lastDismissed = localStorage.getItem('pwa-install-dismissed');
      const daysSinceDismissed = lastDismissed 
        ? (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)
        : 999;
      
      if (daysSinceDismissed > 7) { // Show again after 7 days
        setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstall]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error during installation:', error);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    onDismiss?.();
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !deferredPrompt || !showPrompt) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
            {isMobile ? (
              <Smartphone className="h-5 w-5 text-blue-600" />
            ) : (
              <Monitor className="h-5 w-5 text-blue-600" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-blue-900">Install ZAMC</h3>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                PWA
              </Badge>
            </div>
            
            <p className="text-sm text-blue-700 mb-3">
              Get the full app experience with offline access, push notifications, and faster loading.
            </p>
            
            <div className="flex items-center gap-2 text-xs text-blue-600 mb-3">
              <Zap className="h-3 w-3" />
              <span>Works offline</span>
              <span>•</span>
              <span>Native feel</span>
              <span>•</span>
              <span>Quick access</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {isInstalling ? 'Installing...' : 'Install App'}
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
              >
                Maybe Later
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Hook for PWA installation status
export const usePWAInstall = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return true;
      }
      
      return false;
    };

    if (checkInstalled()) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      setDeferredPrompt(null);
      setCanInstall(false);
      
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('Installation failed:', error);
      return false;
    }
  };

  return {
    isInstalled,
    canInstall,
    install,
  };
}; 