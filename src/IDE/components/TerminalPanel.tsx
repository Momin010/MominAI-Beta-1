import React from 'react';
import { Terminal } from './Terminal.tsx';

interface TerminalPanelProps {
    terminalVisible: boolean;
    showPreview: boolean;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({
    terminalVisible,
    showPreview
}) => {
    return (
        <>
            {/* Terminal (Toggleable) */}
            {terminalVisible && (
                <div className="h-64 border-t border-white/15 glass-overlay rounded-b-xl">
                    <Terminal
                        shouldRunSetup={true}
                    />
                </div>
            )}

            {/* Hidden Terminal for Background Setup - Only when preview is shown and terminal is hidden */}
            {!terminalVisible && showPreview && (
                <div className="hidden">
                    <Terminal
                        shouldRunSetup={true}
                    />
                </div>
            )}
        </>
    );
};

export default TerminalPanel;