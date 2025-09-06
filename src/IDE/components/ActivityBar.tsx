

import React from 'react';
import { Icons } from './Icon';

interface ActivityBarProps {
    activeView: string;
    setActiveView: (view: string) => void;
}

const ActivityBar: React.FC<ActivityBarProps> = ({ activeView, setActiveView }) => {
    const views = [
        { id: 'explorer', icon: <Icons.Files className="w-6 h-6"/>, title: 'Explorer', disabled: false },
        { id: 'search', icon: <Icons.Search className="w-6 h-6"/>, title: 'Search', disabled: false },
        { id: 'source-control', icon: <Icons.GitFork className="w-6 h-6"/>, title: 'Source Control', disabled: false },
        { id: 'storyboard', icon: <Icons.LayoutDashboard className="w-6 h-6"/>, title: 'Storyboard', disabled: true },
        { id: 'image-to-code', icon: <Icons.Image className="w-6 h-6"/>, title: 'Image to Code', disabled: true },
        { id: 'figma', icon: <Icons.Figma className="w-6 h-6"/>, title: 'Figma Import', disabled: true },
        { id: 'plugins', icon: <Icons.Puzzle className="w-6 h-6"/>, title: 'Plugins', disabled: true },
        { id: 'settings', icon: <Icons.Settings className="w-6 h-6"/>, title: 'Settings', disabled: false },
    ];
    
    return (
        <div className="frost bg-[var(--background-secondary)]/70 backdrop-blur-md h-full w-12 flex flex-col items-center py-4 space-y-2 border border-[var(--border-color)] rounded-lg shadow-xl">
            {views.map(view => (
                <button
                    key={view.id}
                    title={view.title}
                    onClick={() => !view.disabled && setActiveView(view.id)}
                    disabled={view.disabled}
                    className={`p-2 rounded-lg transition-all duration-200 relative 
                        ${activeView === view.id ? 'text-[var(--foreground)]' : 'text-[var(--gray)]'}
                        ${view.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-[var(--foreground)] hover:bg-[var(--gray-dark)]/50'}
                    `}
                >
                    {activeView === view.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-[var(--accent)] rounded-r-full"></div>}
                    {view.icon}
                </button>
            ))}
        </div>
    );
};

export default ActivityBar;