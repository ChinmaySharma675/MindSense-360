import { useSessionTracker } from '@/hooks/useSessionTracker';
import { Clock, Activity, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionIndicatorProps {
  isConnected?: boolean;
  className?: string;
}

export function SessionIndicator({ isConnected = false, className }: SessionIndicatorProps) {
  const { formattedDuration, isActive, activityCount } = useSessionTracker();

  return (
    <div className={cn("flex items-center gap-3 text-xs text-muted-foreground", className)}>
      {/* Connection status */}
      <div className="flex items-center gap-1" title={isConnected ? "Real-time connected" : "Polling mode"}>
        {isConnected ? (
          <Wifi className="h-3 w-3 text-success" />
        ) : (
          <WifiOff className="h-3 w-3 text-warning" />
        )}
        <span className="hidden sm:inline">
          {isConnected ? 'Live' : 'Polling'}
        </span>
      </div>

      {/* Session duration */}
      <div className="flex items-center gap-1" title="Session duration">
        <Clock className="h-3 w-3" />
        <span>{formattedDuration}</span>
      </div>

      {/* Activity status */}
      <div 
        className={cn(
          "flex items-center gap-1 transition-colors",
          isActive ? "text-success" : "text-muted-foreground"
        )}
        title={`${activityCount} interactions this session`}
      >
        <Activity className={cn("h-3 w-3", isActive && "animate-pulse")} />
        <span className="hidden sm:inline">
          {isActive ? 'Active' : 'Idle'}
        </span>
      </div>
    </div>
  );
}
