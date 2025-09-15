import React from 'react';
import { Icons } from './Icon.tsx';

interface ToolbarProps {
    fileTreeCollapsed: boolean;
    onToggleFileTree: () => void;
    showPreview: boolean;
    onTogglePreview: () => void;
    terminalVisible: boolean;
    onToggleTerminal: () => void;
    showAutonomousPanel?: boolean;
    onToggleAutonomousPanel?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
    fileTreeCollapsed,
    onToggleFileTree,
    showPreview,
    onTogglePreview,
    terminalVisible,
    onToggleTerminal,
    showAutonomousPanel = false,
    onToggleAutonomousPanel
}) => {
    return (
        <div className="p-2 border-b border-white/15 glass-light flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
                <button
                    onClick={onToggleFileTree}
                    className="p-1.5 rounded hover:bg-white-10 transition-colors"
                    title={fileTreeCollapsed ? "Show File Tree" : "Hide File Tree"}
                >
                    <Icons.Folder className="w-4 h-4" />
                </button>
                <button
                    onClick={onTogglePreview}
                    className={`p-1.5 rounded transition-colors ${showPreview ? 'bg-[var(--accent)]' : 'hover:bg-white-10'}`}
                    title={showPreview ? "Show Code Editor" : "Show Preview"}
                >
                    <Icons.Eye className="w-4 h-4" />
                </button>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onToggleTerminal}
                    className={`p-1.5 rounded transition-colors ${terminalVisible && !showAutonomousPanel ? 'bg-[var(--accent)]' : 'hover:bg-white-10'}`}
                    title={terminalVisible ? "Hide Setup Panel" : "Show Setup Panel"}
                >
                    <Icons.Settings className="w-4 h-4" />
                </button>
                {onToggleAutonomousPanel && (
                    <button
                        onClick={onToggleAutonomousPanel}
                        className={`p-1.5 rounded transition-colors ${showAutonomousPanel ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'hover:bg-white-10'}`}
                        title={showAutonomousPanel ? "Hide AI Developer" : "Show AI Developer"}
                    >
                        <Icons.Bot className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Toolbar;