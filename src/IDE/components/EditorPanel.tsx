import React from 'react';
import EditorPane from './EditorPane.tsx';
import LivePreview from './LivePreview.tsx';
import FileExplorer from './FileExplorer.tsx';
import type { FileSystemNode, Diagnostic } from '../types.ts';

interface EditorPanelProps {
    openFiles: string[];
    activeTab: string | null;
    onTabSelect: (path: string) => void;
    onTabClose: (path: string) => void;
    fileContent: string;
    onContentChange: (path: string, content: string) => void;
    diagnostics: Diagnostic[];
    showPreview: boolean;
    onTogglePreview: () => void;
    fileTreeCollapsed: boolean;
    fs: FileSystemNode;
    onFileSelect: (path: string, line?: number) => void;
    createNode: (path: string, type: 'file' | 'directory', content?: string) => Promise<void>;
    deleteNode: (path: string) => Promise<void>;
    renameNode: (oldPath: string, newPath: string) => Promise<void>;
    moveNode: (oldPath: string, newPath: string) => Promise<void>;
    openAiFileGenerator: (path: string) => void;
    automationState?: {
        isInstalling: boolean;
        isStartingDev: boolean;
        installProgress: number;
        devProgress: number;
        currentStep: string;
        error: string | null;
    };
}

const EditorPanel: React.FC<EditorPanelProps> = ({
    openFiles,
    activeTab,
    onTabSelect,
    onTabClose,
    fileContent,
    onContentChange,
    diagnostics,
    showPreview,
    onTogglePreview,
    fileTreeCollapsed,
    fs,
    onFileSelect,
    createNode,
    deleteNode,
    renameNode,
    moveNode,
    openAiFileGenerator,
    automationState
}) => {
    return (
        <div className="w-2/3 glass-light overflow-hidden flex flex-col rounded-xl">
            {/* File Tree (Collapsible) */}
            {!fileTreeCollapsed && (
                <div className="w-64 border-r border-white/15 glass-overlay rounded-l-xl">
                    <FileExplorer
                        fs={fs}
                        onFileSelect={onFileSelect}
                        createNode={createNode}
                        deleteNode={deleteNode}
                        renameNode={renameNode}
                        moveNode={moveNode}
                        openAiFileGenerator={openAiFileGenerator}
                    />
                </div>
            )}

            {/* Editor/Preview Area */}
            <div className="flex-grow flex flex-col">
                {showPreview ? (
                    <LivePreview
                        isVisible={true}
                        onToggle={onTogglePreview}
                        automationState={automationState}
                    />
                ) : (
                    <EditorPane
                        openFiles={openFiles}
                        activeTab={activeTab}
                        onTabSelect={onTabSelect}
                        onTabClose={onTabClose}
                        fileContent={fileContent}
                        onContentChange={onContentChange}
                        editorActions={[]}
                        diagnostics={diagnostics}
                        breakpoints={[]}
                        onBreakpointsChange={() => {}}
                        pluginViews={{}}
                    />
                )}
            </div>
        </div>
    );
};

export default EditorPanel;