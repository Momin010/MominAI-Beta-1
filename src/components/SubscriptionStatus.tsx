import React from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useVMProvider } from '../IDE/VMProviderSwitcher';

const SubscriptionStatus: React.FC = () => {
  const { tier, isPremium } = useSubscription();
  const { isConnected, error, provider } = useVMProvider();

  const getConnectionStatus = () => {
    if (error) return { status: 'error', color: 'bg-red-500', text: 'Error' };
    if (isConnected) return { status: 'connected', color: 'bg-green-500', text: 'Connected' };
    return { status: 'connecting', color: 'bg-yellow-500', text: 'Connecting' };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium">
      {isPremium ? (
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full">
          <span className={`w-2 h-2 ${connectionStatus.color} rounded-full ${connectionStatus.status === 'connecting' ? 'animate-pulse' : ''}`}></span>
          <span>Premium</span>
          <span className="text-xs opacity-80">({provider === 'remote' ? 'Docker' : 'WebContainer'})</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-gray-600 text-gray-300 px-3 py-1 rounded-full">
          <span className={`w-2 h-2 ${connectionStatus.color} rounded-full ${connectionStatus.status === 'connecting' ? 'animate-pulse' : ''}`}></span>
          <span>Free</span>
          <span className="text-xs opacity-80">(WebContainer)</span>
        </div>
      )}

      {/* Connection Status Indicator */}
      <div className="flex items-center gap-1 text-xs">
        <span className={`w-1.5 h-1.5 ${connectionStatus.color} rounded-full ${connectionStatus.status === 'connecting' ? 'animate-pulse' : ''}`}></span>
        <span className="text-gray-400">{connectionStatus.text}</span>
      </div>
    </div>
  );
};

export const PremiumFeatureIndicator: React.FC<{ children: React.ReactNode; feature?: string }> = ({
  children,
  feature = "Premium Feature"
}) => {
  const { isPremium } = useSubscription();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
        <div className="text-center text-white">
          <div className="text-sm font-semibold mb-1">🔒 {feature}</div>
          <div className="text-xs opacity-80">Requires Premium</div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatus;