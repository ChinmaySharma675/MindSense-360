import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CONSENT_KEY = 'mindsense_consent_accepted';

export function useConsentStatus(userId: string | undefined) {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Check local storage first for quick response
    const localConsent = localStorage.getItem(`${CONSENT_KEY}_${userId}`);
    if (localConsent === 'true') {
      setHasConsented(true);
      setIsLoading(false);
      return;
    }

    // If no local consent, user needs to accept
    setHasConsented(false);
    setIsLoading(false);
  }, [userId]);

  const acceptConsent = () => {
    if (userId) {
      localStorage.setItem(`${CONSENT_KEY}_${userId}`, 'true');
      setHasConsented(true);
    }
  };

  const revokeConsent = () => {
    if (userId) {
      localStorage.removeItem(`${CONSENT_KEY}_${userId}`);
      setHasConsented(false);
    }
  };

  return { hasConsented, isLoading, acceptConsent, revokeConsent };
}
