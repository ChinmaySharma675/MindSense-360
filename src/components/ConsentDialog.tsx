import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Eye, Trash2, Lock, AlertTriangle } from 'lucide-react';

interface ConsentDialogProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentDialog({ open, onAccept, onDecline }: ConsentDialogProps) {
  const [understood, setUnderstood] = useState(false);
  const [notMedical, setNotMedical] = useState(false);

  const canAccept = understood && notMedical;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy & Consent
          </DialogTitle>
          <DialogDescription>
            Please review how MindSense handles your data before continuing.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-6">
            {/* Medical Disclaimer */}
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-foreground mb-1">
                    Important Medical Disclaimer
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    MindSense is designed for <strong>awareness and prevention only</strong>. 
                    It does NOT provide medical diagnosis, treatment recommendations, or 
                    clinical advice. If you are experiencing mental health concerns, please 
                    consult a qualified healthcare professional.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Practices */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Our Privacy Practices</h4>
              
              <div className="flex items-start gap-3">
                <Eye className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Data Minimization</p>
                  <p className="text-xs text-muted-foreground">
                    We only collect what's necessary: behavioral metrics, voice stress scores, 
                    and wearable data. No personal identifiers beyond your account.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Trash2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Voice Data Deletion</p>
                  <p className="text-xs text-muted-foreground">
                    Raw voice recordings are <strong>deleted immediately</strong> after processing. 
                    We only store the computed stress score and optional emotion label.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">UUID-Based Identity</p>
                  <p className="text-xs text-muted-foreground">
                    Your data is linked to an anonymous UUID, not your personal information. 
                    Admin analytics only see aggregated, de-identified statistics.
                  </p>
                </div>
              </div>
            </div>

            {/* What We Don't Do */}
            <div className="p-3 rounded-lg bg-muted/50">
              <h4 className="font-semibold text-sm mb-2">What We Don't Do</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>❌ Sell or share your data with third parties</li>
                <li>❌ Store raw voice recordings</li>
                <li>❌ Provide medical diagnoses or treatment</li>
                <li>❌ Track your location or personal contacts</li>
              </ul>
            </div>

            {/* Acknowledgments */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="understood"
                  checked={understood}
                  onCheckedChange={(checked) => setUnderstood(checked === true)}
                />
                <label htmlFor="understood" className="text-sm leading-tight cursor-pointer">
                  I understand how my data is collected, processed, and stored.
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="notMedical"
                  checked={notMedical}
                  onCheckedChange={(checked) => setNotMedical(checked === true)}
                />
                <label htmlFor="notMedical" className="text-sm leading-tight cursor-pointer">
                  I understand that MindSense is for awareness only and is not a 
                  substitute for professional medical advice.
                </label>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onDecline} className="w-full sm:w-auto">
            Decline & Sign Out
          </Button>
          <Button 
            onClick={onAccept} 
            disabled={!canAccept}
            className="w-full sm:w-auto"
          >
            I Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
