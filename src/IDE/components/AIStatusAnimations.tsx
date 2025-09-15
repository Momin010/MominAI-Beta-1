import React, { useState, useEffect } from 'react';

// Add CSS animations
const styles = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export type AIStatusPhase = 'thinking' | 'reasoning' | 'working' | 'idle';

interface AIStatusAnimationsProps {
  phase: AIStatusPhase;
  className?: string;
}

const ThinkingAnimation: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        {/* Brain icon with pulsing effect */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center animate-pulse">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        {/* Animated brain waves */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-300 animate-pulse">Thinking</span>
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

const ReasoningAnimation: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        {/* Code analysis icon */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        {/* Scanning lines */}
        <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-spin opacity-30"></div>
        <div className="absolute inset-1 rounded-full border border-teal-400 animate-pulse"></div>
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-gray-300">Analyzing code</span>
        <div className="flex items-center gap-1 mt-1">
          <div className="h-1 bg-gray-600 rounded-full w-16 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-teal-500 animate-pulse w-full transform -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WorkingAnimation: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        {/* Typing/Code icon */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        {/* Typing cursor */}
        <div className="absolute -top-1 -right-1 w-1 h-4 bg-orange-400 animate-pulse"></div>
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-gray-300">Generating code</span>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-gray-400 font-mono">
            {Array.from({ length: 20 }, (_, i) => (
              <span
                key={i}
                className="inline-block animate-pulse"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1.5s'
                }}
              >
                {['{', '}', '[', ']', '<', '>', '(', ')', '=', '+', '-', '*', '/', '.', ',', ';'][i % 14]}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
};

const AIStatusAnimations: React.FC<AIStatusAnimationsProps> = ({ phase, className = '' }) => {
  const [currentPhase, setCurrentPhase] = useState<AIStatusPhase>(phase);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (phase !== currentPhase) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setCurrentPhase(phase);
        setIsTransitioning(false);
      }, 300); // Transition duration
      return () => clearTimeout(timer);
    }
  }, [phase, currentPhase]);

  if (phase === 'idle') {
    return null;
  }

  return (
    <div className={`transition-all duration-300 ease-in-out ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'} ${className}`}>
      {currentPhase === 'thinking' && <ThinkingAnimation />}
      {currentPhase === 'reasoning' && <ReasoningAnimation />}
      {currentPhase === 'working' && <WorkingAnimation />}
    </div>
  );
};

export default AIStatusAnimations;