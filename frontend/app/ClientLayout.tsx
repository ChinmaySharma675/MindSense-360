'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ConsentModal from '@/components/ConsentModal';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [showConsent, setShowConsent] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Check if user has already consented
        const hasConsented = localStorage.getItem('mindsense_consent');
        // Don't show on login/register pages
        const isAuthPage = pathname === '/login' || pathname === '/register';

        if (!hasConsented && !isAuthPage) {
            setShowConsent(true);
        }
    }, [pathname]);

    const handleAcceptConsent = () => {
        localStorage.setItem('mindsense_consent', 'true');
        setShowConsent(false);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex-grow">
                {children}
            </div>

            {/* Privacy Footer */}
            <footer className="bg-white border-t border-gray-200 py-6 mt-12">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <div>
                        © {new Date().getFullYear()} MindSense. All rights reserved.
                    </div>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
                            Data Controls
                        </Link>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center">
                            <span className="mr-1">🛡️</span> Secure & Private
                        </span>
                    </div>
                </div>
            </footer>

            <ConsentModal
                isOpen={showConsent}
                onAccept={handleAcceptConsent}
            />
        </div>
    );
}
