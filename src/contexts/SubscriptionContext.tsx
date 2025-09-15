import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

export type SubscriptionTier = 'free' | 'premium';

export interface SubscriptionContextType {
  tier: SubscriptionTier;
  isPremium: boolean;
  activatePremium: (code: string) => Promise<boolean>;
  deactivatePremium: () => void;
  activationCode: string;
  setActivationCode: (code: string) => void;
  isLaunched: boolean;
  hasSignedUp: boolean;
  setHasSignedUp: (signedUp: boolean) => void;
  toggleLaunch: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

const PREMIUM_ACTIVATION_CODE = 'FREEPALESTINE1!';

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [tier, setTier] = useLocalStorageState<SubscriptionTier>('subscriptionTier', 'free');
  const [activationCode, setActivationCode] = useState('');
  const [isLaunched, setIsLaunched] = useLocalStorageState<boolean>('isLaunched', false);
  const [hasSignedUp, setHasSignedUp] = useLocalStorageState<boolean>('hasSignedUp', false);

  const isPremium = tier === 'premium';

  const activatePremium = async (code: string): Promise<boolean> => {
    if (code === PREMIUM_ACTIVATION_CODE) {
      setTier('premium');
      setActivationCode('');
      return true;
    }
    return false;
  };

  const deactivatePremium = () => {
    setTier('free');
  };

  const toggleLaunch = () => {
    setIsLaunched(!isLaunched);
  };

  const value: SubscriptionContextType = {
    tier,
    isPremium,
    activatePremium,
    deactivatePremium,
    activationCode,
    setActivationCode,
    isLaunched,
    hasSignedUp,
    setHasSignedUp,
    toggleLaunch,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};