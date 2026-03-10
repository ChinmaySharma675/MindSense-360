import { useEffect, useState } from 'react';

interface LiveIndicatorProps {
    lastUpdated: Date;
    isLive: boolean;
}

export default function LiveIndicator({ lastUpdated, isLive }: LiveIndicatorProps) {
    const [relativeTime, setRelativeTime] = useState('');

    useEffect(() => {
        const updateRelativeTime = () => {
            const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);

            if (seconds < 5) {
                setRelativeTime('just now');
            } else if (seconds < 60) {
                setRelativeTime(`${seconds}s ago`);
            } else if (seconds < 3600) {
                const minutes = Math.floor(seconds / 60);
                setRelativeTime(`${minutes}m ago`);
            } else {
                const hours = Math.floor(seconds / 3600);
                setRelativeTime(`${hours}h ago`);
            }
        };

        updateRelativeTime();
        const interval = setInterval(updateRelativeTime, 1000);

        return () => clearInterval(interval);
    }, [lastUpdated]);

    return (
        <div className="flex items-center space-x-2 text-sm">
            {isLive && (
                <div className="flex items-center space-x-1">
                    <div className="relative">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    </div>
                    <span className="text-green-600 font-medium">Live</span>
                </div>
            )}
            <span className="text-gray-500" title={lastUpdated.toLocaleString()}>
                Updated {relativeTime}
            </span>
        </div>
    );
}
