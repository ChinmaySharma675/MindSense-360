import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
  interval: number; // milliseconds
  enabled?: boolean;
  immediate?: boolean;
}

export function usePolling(
  callback: () => void | Promise<void>,
  options: UsePollingOptions
) {
  const { interval, enabled = true, immediate = true } = options;
  const savedCallback = useRef(callback);
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const tick = useCallback(async () => {
    await savedCallback.current();
  }, []);

  // Set up the interval
  useEffect(() => {
    if (!enabled) {
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }
      return;
    }

    // Immediate execution if requested
    if (immediate) {
      tick();
    }

    intervalId.current = setInterval(tick, interval);

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }
    };
  }, [interval, enabled, immediate, tick]);

  // Manual trigger
  const refresh = useCallback(() => {
    tick();
  }, [tick]);

  return { refresh };
}