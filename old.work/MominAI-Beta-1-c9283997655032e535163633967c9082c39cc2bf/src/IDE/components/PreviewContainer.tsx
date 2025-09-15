

import React, { useState } from 'react';
import { Icons } from './Icon';

interface PreviewContainerProps {
  isVisible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  previewContext: { html: string } | null;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onToggleInspector: () => void;
  isInspectorActive: boolean;
}

const PreviewContainer: React.FC<PreviewContainerProps> = ({ 
  isVisible, 
  title, 
  children, 
  onClose, 
  previewContext, 
  iframeRef,
  onToggleInspector,
  isInspectorActive
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleOpenInNewTab = () => {
    if (!previewContext) return;
    const blob = new Blob([previewContext.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (!isVisible) {
    return null;
  }

  const containerClasses = isMaximized
    ? 'fixed inset-2 bg-[var(--background-secondary)]/90 backdrop-blur-lg z-50 flex flex-col rounded-lg shadow-2xl border border-[var(--border-color)]'
    : 'h-full w-full bg-[var(--background-secondary)]/70 backdrop-blur-md flex flex-col rounded-lg border border-[var(--border-color)] shadow-xl';
    
  return (
    <div className={containerClasses}>
      <div className="p-2 border-b border-[var(--border-color)] bg-[var(--gray-dark)]/50 rounded-t-lg flex justify-between items-center flex-shrink-0">
        <h2 className="text-sm font-bold uppercase tracking-wider pl-2">{title || 'Preview'}</h2>
        <div className="flex items-center space-x-1">
           <button
            title={isInspectorActive ? 'Deactivate Inspector' : 'Activate Inspector'}
            onClick={onToggleInspector}
            className={`p-1.5 rounded-md ${isInspectorActive ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--gray-light)]'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l.79-.79"></path></svg>
          </button>
          <button
            title="Open in new tab"
            onClick={handleOpenInNewTab}
            disabled={!previewContext}
            className="p-1.5 rounded-md hover:bg-[var(--gray-light)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icons.ExternalLink className="w-4 h-4" />
          </button>
          <button
            title={isMaximized ? 'Restore' : 'Maximize'}
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 rounded-md hover:bg-[var(--gray-light)]"
          >
            {isMaximized ? <Icons.Minimize className="w-4 h-4" /> : <Icons.Maximize className="w-4 h-4" />}
          </button>
          <button
            title="Close Preview"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[var(--gray-light)]"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        {React.Children.map(children, child =>
            React.isValidElement(child) ? React.cloneElement(child, { ref: iframeRef } as any) : child
        )}
      </div>
    </div>
  );
};

export default PreviewContainer;