import React from 'react';
import { Icons } from './Icon.tsx';

interface IDELayoutProps {
    children: React.ReactNode;
    isZenMode: boolean;
    toggleZenMode: () => void;
    onLogout: () => void;
    onClose?: () => void;
    panelVisibility: { activityBar: boolean; left: boolean; right: boolean; bottom: boolean };
    onTogglePanel: (panel: 'activityBar' | 'left' | 'right' | 'bottom') => void;
}

const IDELayout: React.FC<IDELayoutProps> = ({
    children,
    isZenMode,
    toggleZenMode,
    onLogout,
    onClose,
    panelVisibility,
    onTogglePanel
}) => {
    if (isZenMode) {
        return (
            <div className="fixed inset-0 z-[10000] glass-overlay">
                <div className="absolute top-4 right-4 z-[10001]">
                    <button
                        onClick={toggleZenMode}
                        className="p-2 glass-strong text-white rounded hover:bg-white/10 transition-colors"
                        title="Exit Zen Mode"
                    >
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>
                <div className="w-full h-full pt-16">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-transparent flex flex-col p-2 gap-2">
            {children}
        </div>
    );
};

export default IDELayout;