import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Shield, ChevronDown, Eye, Trash2, Lock, AlertTriangle } from 'lucide-react';

export function PrivacyInfo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-between text-muted-foreground hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy & Data Handling
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="rounded-lg border border-border bg-card p-4 space-y-4 text-sm">
          {/* Medical Disclaimer Banner */}
          <div className="flex items-start gap-2 p-3 rounded-md bg-warning/10 border border-warning/30">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Not Medical Advice:</strong> MindSense provides 
              awareness insights only. Consult a healthcare professional for medical concerns.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <Eye className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Minimal Data Collection</p>
                <p className="text-xs text-muted-foreground">
                  Only essential metrics for risk assessment.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Trash2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Voice Data Deleted</p>
                <p className="text-xs text-muted-foreground">
                  Raw recordings removed after processing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Anonymous Analysis</p>
                <p className="text-xs text-muted-foreground">
                  UUID-based identity, no personal data shared.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
