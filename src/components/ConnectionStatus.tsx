import React from 'react';
import { useVMProvider } from '../IDE/VMProviderSwitcher';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Icons } from '../IDE/components/Icon';

interface ConnectionStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showDetails = false,
  compact = false
}) => {
  const { isConnected, error, provider, serverUrl } = useVMProvider();
  const { isPremium } = useSubscription();

  const getStatusInfo = () => {
    if (error) {
      return {
        status: 'error',
        color: 'text-red-500',
        bgColor: 'bg-red-500',
        icon: Icons.XCircle,
        message: 'Connection Error',
        details: error
      };
    }

    if (isConnected) {
      return {
        status: 'connected',
        color: 'text-green-500',
        bgColor: 'bg-green-500',
        icon: Icons.Info,
        message: 'Connected',
        details: `${provider === 'remote' ? 'Docker VM' : 'WebContainer'} • ${serverUrl || 'Local'}`
      };
    }

    return {
      status: 'connecting',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      icon: Icons.Settings,
      message: 'Connecting...',
      details: `Initializing ${provider === 'remote' ? 'Docker VM' : 'WebContainer'}`
    };
  };

  const statusInfo = getStatusInfo();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 ${statusInfo.bgColor} rounded-full ${statusInfo.status === 'connecting' ? 'animate-pulse' : ''}`} />
        <span className={`text-xs ${statusInfo.color}`}>{statusInfo.message}</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 ${statusInfo.bgColor} rounded-full ${statusInfo.status === 'connecting' ? 'animate-pulse' : ''}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{statusInfo.message}</span>
              {isPremium && provider === 'remote' && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs rounded-full">
                  Premium
                </span>
              )}
            </div>
            {showDetails && (
              <div className="text-xs text-gray-400 mt-1">{statusInfo.details}</div>
            )}
          </div>
        </div>

        {statusInfo.status === 'error' && (
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export const PremiumFeatureBanner: React.FC<{ feature: string; children: React.ReactNode }> = ({
  feature,
  children
}) => {
  const { isPremium } = useSubscription();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-sm flex items-center justify-center rounded-lg border-2 border-dashed border-yellow-500/50">
        <div className="text-center text-white p-4">
          <Icons.AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
          <div className="text-sm font-semibold mb-1">Premium Feature</div>
          <div className="text-xs opacity-80 mb-3">{feature}</div>
          <button className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-colors">
            Upgrade to Premium
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;