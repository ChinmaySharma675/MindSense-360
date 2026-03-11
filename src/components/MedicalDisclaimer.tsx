import { AlertTriangle } from 'lucide-react';

interface MedicalDisclaimerProps {
  variant?: 'banner' | 'inline' | 'compact';
}

export function MedicalDisclaimer({ variant = 'banner' }: MedicalDisclaimerProps) {
  if (variant === 'compact') {
    return (
      <p className="text-xs text-muted-foreground text-center">
        <AlertTriangle className="h-3 w-3 inline mr-1" />
        For awareness only. Not medical advice.
      </p>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
        <span>
          This tool is for awareness only and does not provide medical diagnosis or treatment.
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-1">
            Important Disclaimer
          </h4>
          <p className="text-sm text-muted-foreground">
            MindSense is designed for <strong>mental health awareness and prevention</strong> only. 
            It does not provide medical diagnosis, treatment recommendations, or clinical advice. 
            If you are experiencing mental health concerns, please consult a qualified healthcare professional.
          </p>
        </div>
      </div>
    </div>
  );
}
