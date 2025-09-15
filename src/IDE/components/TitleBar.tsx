

import React from 'react';
import { Icons } from './Icon';
import { EnhancedSubscriptionStatus } from '../../components/PremiumUI';

interface TitleBarProps {
  panelVisibility: { left: boolean; right: boolean; bottom: boolean };
  onTogglePanel: (panel: 'left' | 'right' | 'bottom') => void;
  onLogout: () => void;
  onClose?: () => void;
  isCrossOriginIsolated?: boolean;
}

const TitleBar: React.FC<TitleBarProps> = ({ panelVisibility, onTogglePanel, onLogout, onClose, isCrossOriginIsolated }) => {
  return (
    <div className="frost bg-[var(--ui-panel-bg-heavy)] text-white/90 px-4 py-2 flex items-center justify-between border border-[var(--ui-border)] flex-shrink-0 h-8 rounded-lg shadow-xl">
      <div className="flex items-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-secondary)]"><path d="m12 3-8.89 3.55a2 2 0 0 0-1.11 1.78V15.7a2 2 0 0 0 1.11 1.78L12 21l8.89-3.55a2 2 0 0 0 1.11-1.78V8.28a2 2 0 0 0-1.11-1.78L12 3Z"/><path d="M12 21v-8.52"/><path d="m20.89 8.28-8.89 3.55-8.89-3.55"/><path d="m3.11 8.28 8.89 3.55L20.89 8.28"/><path d="M12 3v8.52"/></svg>
        <EnhancedSubscriptionStatus />
        {isCrossOriginIsolated !== undefined && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${isCrossOriginIsolated ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isCrossOriginIsolated ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span>{isCrossOriginIsolated ? 'Isolated' : 'Not Isolated'}</span>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-1">
        <button title="Toggle Left Panel" onClick={() => onTogglePanel('left')} className={`p-1.5 rounded ${panelVisibility.left ? 'bg-white-10' : ''} hover:bg-white-20`}>
          <Icons.PanelLeftClose className="w-5 h-5" />
        </button>
        <button title="Toggle Bottom Panel" onClick={() => onTogglePanel('bottom')} className={`p-1.5 rounded ${panelVisibility.bottom ? 'bg-white-10' : ''} hover:bg-white-20`}>
          <Icons.PanelBottomClose className="w-5 h-5" />
        </button>
        <button title="Toggle Right Panel" onClick={() => onTogglePanel('right')} className={`p-1.5 rounded ${panelVisibility.right ? 'bg-white-10' : ''} hover:bg-white-20`}>
          <Icons.PanelRightClose className="w-5 h-5" />
        </button>
        <div className="w-px h-5 bg-[var(--ui-border)] mx-2"></div>
        {onClose && (
          <button title="Close IDE" onClick={onClose} className={`p-1.5 rounded text-gray-400 hover:bg-blue-500/20 hover:text-blue-400 transition-colors`}>
            <Icons.X className="w-5 h-5" />
          </button>
        )}
        <button title="Logout" onClick={onLogout} className={`p-1.5 rounded text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors`}>
          <Icons.LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;