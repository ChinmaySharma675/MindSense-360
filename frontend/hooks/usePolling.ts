import { useEffect, useRef, useState } from 'react';

interface UsePollingOptions {
    interval?: number;
    enabled?: boolean;
}

export function usePolling(
    callback: () => Promise<void>,
    { interval = 30000, enabled = true }: UsePollingOptions = {}
) {
    const [isPolling, setIsPolling] = useState(enabled);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const callbackRef = useRef(callback);

    // Update callback ref when it changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!isPolling || !enabled) return;

        const poll = async () => {
            try {
                await callbackRef.current();
                setLastUpdated(new Date());
            } catch (error) {
                console.error('Polling error:', error);
            }
        };

        const intervalId = setInterval(poll, interval);

        return () => clearInterval(intervalId);
    }, [interval, isPolling, enabled]);

    return {
        isPolling,
        setIsPolling,
        lastUpdated,
    };
}
