

import React from 'react';
import { Icons } from './Icon';
import { PremiumTooltip, CrownIcon } from '../../components/PremiumUI';

interface ActivityBarProps {
    activeView: string;
    setActiveView: (view: string) => void;
}

const ActivityBar: React.FC<ActivityBarProps> = ({ activeView, setActiveView }) => {
    const views = [
        { id: 'explorer', icon: <Icons.Files className="w-6 h-6"/>, title: 'Explorer', disabled: false },
        { id: 'search', icon: <Icons.Search className="w-6 h-6"/>, title: 'Search', disabled: false },
        { id: 'source-control', icon: <Icons.GitFork className="w-6 h-6"/>, title: 'Source Control', disabled: false },
        {
            id: 'storyboard',
            icon: <Icons.LayoutDashboard className="w-6 h-6"/>,
            title: 'Storyboard - Premium Feature',
            disabled: true,
            premium: true,
            benefits: ['Visual project planning', 'Component prototyping', 'Interactive wireframes']
        },
        {
            id: 'image-to-code',
            icon: <Icons.Image className="w-6 h-6"/>,
            title: 'Image to Code - Premium Feature',
            disabled: true,
            premium: true,
            benefits: ['Convert designs to code', 'AI-powered conversion', 'Multiple frameworks support']
        },
        {
            id: 'figma',
            icon: <Icons.Figma className="w-6 h-6"/>,
            title: 'Figma Import - Premium Feature',
            disabled: true,
            premium: true,
            benefits: ['Import Figma designs', 'Auto-generate components', 'Design-to-code workflow']
        },
        {
            id: 'plugins',
            icon: <Icons.Puzzle className="w-6 h-6"/>,
            title: 'Advanced Plugins - Premium Feature',
            disabled: true,
            premium: true,
            benefits: ['AI Code Review', 'Live Deployment', 'Advanced AI tools']
        },
        { id: 'settings', icon: <Icons.Settings className="w-6 h-6"/>, title: 'Settings', disabled: false },
    ];
    
    return (
        <div className="frost bg-[var(--background-secondary)]/70 backdrop-blur-md h-full w-12 flex flex-col items-center py-4 space-y-2 border border-[var(--border-color)] rounded-lg shadow-xl">
            {views.map(view => {
                const button = (
                    <button
                        key={view.id}
                        title={view.title}
                        onClick={() => !view.disabled && setActiveView(view.id)}
                        disabled={view.disabled}
                        className={`p-2 rounded-lg transition-all duration-200 relative group
                            ${activeView === view.id ? 'text-[var(--foreground)]' : 'text-[var(--gray)]'}
                            ${view.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-[var(--foreground)] hover:bg-[var(--gray-dark)]/50'}
                            ${view.premium ? 'relative' : ''}
                        `}
                    >
                        {activeView === view.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-[var(--accent)] rounded-r-full"></div>}
                        {view.icon}
                        {view.premium && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                                <CrownIcon className="w-2 h-2 text-white" />
                            </div>
                        )}
                    </button>
                );

                if (view.premium) {
                    return (
                        <PremiumTooltip
                            key={view.id}
                            content={`Unlock ${view.title.split(' - ')[0]} with Premium`}
                            benefits={view.benefits}
                        >
                            {button}
                        </PremiumTooltip>
                    );
                }

                return button;
            })}
        </div>
    );
};

export default ActivityBar;