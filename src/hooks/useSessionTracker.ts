import { useState, useEffect, useCallback } from 'react';

interface SessionInfo {
  startTime: Date;
  duration: number; // in seconds
  isActive: boolean;
  activityCount: number;
}

export function useSessionTracker() {
  const [session, setSession] = useState<SessionInfo>({
    startTime: new Date(),
    duration: 0,
    isActive: true,
    activityCount: 0,
  });

  // Track session duration
  useEffect(() => {
    const startTime = new Date();
    setSession((prev) => ({ ...prev, startTime }));

    const interval = setInterval(() => {
      setSession((prev) => ({
        ...prev,
        duration: Math.floor((Date.now() - startTime.getTime()) / 1000),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Track user activity
  useEffect(() => {
    let inactivityTimeout: NodeJS.Timeout;

    const handleActivity = () => {
      setSession((prev) => ({
        ...prev,
        isActive: true,
        activityCount: prev.activityCount + 1,
      }));

      // Reset inactivity timer
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        setSession((prev) => ({ ...prev, isActive: false }));
      }, 60000); // Mark inactive after 1 minute
    };

    // Listen to user interactions
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial activity
    handleActivity();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimeout(inactivityTimeout);
    };
  }, []);

  // Format duration as readable string
  const formatDuration = useCallback((seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }, []);

  return {
    ...session,
    formattedDuration: formatDuration(session.duration),
  };
}
