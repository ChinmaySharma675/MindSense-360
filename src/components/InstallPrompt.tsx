import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function InstallPrompt() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already installed, not installable, or dismissed
  if (isInstalled || !isInstallable || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installApp();
    if (!success) {
      // User declined, dismiss the prompt
      setDismissed(true);
    }
  };

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 border-primary/30 bg-card/95 backdrop-blur-sm shadow-xl animate-slide-in">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">Install MindSense</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Add to your home screen for quick access and offline support.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleInstall} className="flex-1">
                <Download className="h-3 w-3 mr-1" />
                Install
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setDismissed(true)}
                className="px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
