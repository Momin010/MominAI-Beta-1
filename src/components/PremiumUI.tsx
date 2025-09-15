import React, { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';

// Premium Badge Component
export const PremiumBadge: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'sm',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <span className={`premium-badge inline-flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-full shadow-lg ${sizeClasses[size]} ${className}`}>
      <CrownIcon className="w-3 h-3" />
      Premium
    </span>
  );
};

// Crown Icon Component
export const CrownIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 16L3 5l5.5 4L12 3l3.5 6L21 5l-2 11H5z"/>
    <circle cx="12" cy="18" r="2"/>
  </svg>
);

// Star Icon Component
export const StarIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

// Upgrade Prompt Component
export const UpgradePrompt: React.FC<{
  feature: string;
  benefits?: string[];
  onUpgrade?: () => void;
  className?: string;
}> = ({ feature, benefits = [], onUpgrade, className = '' }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className={`upgrade-prompt bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg border border-blue-500/30 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <CrownIcon className="w-6 h-6 text-yellow-300 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg mb-1">Unlock {feature}</h3>
            <p className="text-blue-100 mb-3">Upgrade to Premium to access this feature and more!</p>
            {benefits.length > 0 && (
              <ul className="text-sm text-blue-100 space-y-1 mb-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <StarIcon className="w-3 h-3 text-yellow-300" />
                    {benefit}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={onUpgrade}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-blue-200 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Feature Gate Overlay Component
export const FeatureGate: React.FC<{
  children: React.ReactNode;
  feature: string;
  benefits?: string[];
  onUpgrade?: () => void;
  showOverlay?: boolean;
}> = ({ children, feature, benefits, onUpgrade, showOverlay = true }) => {
  const { isPremium } = useSubscription();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {children}
      {showOverlay && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
          <div className="text-center text-white p-6 max-w-sm">
            <CrownIcon className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
            <h3 className="text-xl font-bold mb-2">{feature}</h3>
            <p className="text-gray-200 mb-4">This feature requires a Premium subscription</p>
            {benefits && benefits.length > 0 && (
              <ul className="text-sm text-gray-300 space-y-1 mb-4 text-left">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <StarIcon className="w-3 h-3 text-yellow-400" />
                    {benefit}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={onUpgrade}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Premium Tooltip Component
export const PremiumTooltip: React.FC<{
  children: React.ReactNode;
  content: string;
  benefits?: string[];
}> = ({ children, content, benefits }) => {
  const { isPremium } = useSubscription();
  const [isVisible, setIsVisible] = useState(false);

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 min-w-max">
          <div className="flex items-center gap-2 mb-1">
            <CrownIcon className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold">Premium Feature</span>
          </div>
          <p className="text-gray-300">{content}</p>
          {benefits && benefits.length > 0 && (
            <ul className="text-xs text-gray-400 mt-2 space-y-1">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-1">
                  <StarIcon className="w-2 h-2 text-yellow-400" />
                  {benefit}
                </li>
              ))}
            </ul>
          )}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// Enhanced Subscription Status with Trial Info
export const EnhancedSubscriptionStatus: React.FC = () => {
  const { tier, isPremium } = useSubscription();

  // Mock trial data - in real app this would come from subscription context
  const trialDaysLeft = 14;
  const isTrial = !isPremium && trialDaysLeft > 0;

  return (
    <div className="flex items-center gap-2">
      {isPremium ? (
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          <CrownIcon className="w-4 h-4" />
          <span>Premium</span>
        </div>
      ) : isTrial ? (
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          <StarIcon className="w-4 h-4" />
          <span>Free Trial</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{trialDaysLeft} days left</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-gray-600 text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
          <span>Free</span>
          <button className="text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full transition-colors">
            Upgrade
          </button>
        </div>
      )}
    </div>
  );
};

// Contextual Upgrade CTA Component
export const ContextualUpgradeCTA: React.FC<{
  trigger: 'feature-access' | 'limit-reached' | 'time-based';
  feature?: string;
  className?: string;
}> = ({ trigger, feature, className = '' }) => {
  const { isPremium } = useSubscription();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isPremium || isDismissed) return null;

  const messages = {
    'feature-access': {
      title: `Unlock ${feature || 'Premium Features'}`,
      description: 'Get access to advanced tools and unlimited usage.',
      cta: 'Upgrade Now'
    },
    'limit-reached': {
      title: 'Ready for Unlimited Access?',
      description: 'You\'ve reached the free tier limit. Upgrade for unlimited usage.',
      cta: 'Remove Limits'
    },
    'time-based': {
      title: 'Love MominAI?',
      description: 'Upgrade to Premium and unlock the full potential of your development workflow.',
      cta: 'Go Premium'
    }
  };

  const message = messages[trigger];

  return (
    <div className={`contextual-upgrade bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-lg shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CrownIcon className="w-8 h-8 text-yellow-300" />
          <div>
            <h3 className="font-semibold">{message.title}</h3>
            <p className="text-sm text-indigo-100">{message.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
            {message.cta}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-indigo-200 hover:text-white p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};