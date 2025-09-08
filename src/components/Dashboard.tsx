
import React, { useState, useEffect, useRef } from 'react';
import { MominAILogo, AppIcons } from './icons.tsx';
import IDE from '../IDE/App';

interface DashboardProps {
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const [activeView, setActiveView] = useState('projects');
    const [showIDE, setShowIDE] = useState(false);

    // Check for IDE parameter on mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('ide') === 'true') {
            setShowIDE(true);
        }
    }, []);

    const handleOpenIDE = () => {
        setShowIDE(true);
        window.history.pushState({}, '', '/?ide=true');
    };

    const handleCloseIDE = () => {
        setShowIDE(false);
        window.history.pushState({}, '', '/');
    };

    // If IDE is active, show IDE component
    if (showIDE) {
        return <IDE onLogout={onLogout} onClose={handleCloseIDE} />;
    }

    const renderView = () => {
        switch(activeView) {
            case 'projects':
                return <ProjectsView onOpenIDE={handleOpenIDE} />;
            case 'settings':
                return <SettingsView />;
            case 'account':
                 return <SettingsView />;
            default:
                return <ProjectsView onOpenIDE={handleOpenIDE} />;
        }
    };
    
    return (
        <div className="flex h-screen w-screen bg-[#F5F5DC] text-[var(--foreground)] font-sans">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onLogout={onLogout} />
                <main className="flex-1 overflow-y-auto p-8" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

const Sidebar: React.FC<{activeView: string, setActiveView: (view: string) => void}> = ({ activeView, setActiveView }) => {
    const navItems = [
        { id: 'projects', label: 'Projects', icon: AppIcons.Briefcase },
        { id: 'account', label: 'Account', icon: AppIcons.User },
        { id: 'settings', label: 'Settings', icon: AppIcons.Settings },
    ];

    return (
        <aside className="w-64 glass-sidebar flex flex-col p-4 shadow-2xl m-4">
            <div className="px-2 mb-10">
                <MominAILogo />
            </div>
            <nav className="flex-1 flex flex-col gap-2">
                {navItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-transparent glass-button ${activeView === item.id ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-gray-700 hover:bg-white/20 hover:text-black'}`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );
};

const UserProfileDropdown: React.FC<{onLogout: () => void}> = ({ onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 p-1 rounded-full hover:bg-white-10 transition-colors bg-transparent border-none">
                <img src="/avatar.jpg" alt="User Avatar" className="w-8 h-8 rounded-full"/>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 glass-card shadow-2xl py-2" style={{animation: 'scaleIn 0.1s ease-out'}}>
                    <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-white/20 hover:text-black transition-colors rounded-lg mx-2"><AppIcons.User className="w-4 h-4" /> Account</a>
                    <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-white/20 hover:text-black transition-colors rounded-lg mx-2"><AppIcons.Settings className="w-4 h-4" /> Settings</a>
                    <div className="my-2 h-px bg-white/30 mx-2"></div>
                    <button onClick={onLogout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-500/20 hover:text-red-700 transition-colors bg-transparent border-none rounded-lg mx-2">
                        <AppIcons.LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

const Header: React.FC<{onLogout: () => void}> = ({ onLogout }) => (
    <header className="flex-shrink-0 h-20 flex items-center justify-between px-8 glass-panel m-4 rounded-xl">
        <h1 className="text-xl font-semibold text-gray-800">Welcome Back, Momin</h1>
        <div className="flex items-center gap-4">
            <UserProfileDropdown onLogout={onLogout} />
        </div>
    </header>
);

const ProjectsView: React.FC<{onOpenIDE: () => void}> = ({ onOpenIDE }) => (
    <div>
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Projects</h2>
            <button className="flex items-center gap-2 glass-button bg-primary text-white px-4 py-2 font-semibold text-sm hover:bg-primary/80 border-none">
                <AppIcons.Plus className="w-5 h-5" />
                <span>New Project</span>
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-card flex flex-col gap-4 group" style={{ animation: 'fade-in-up 0.5s ease-out 0.1s backwards' }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white-10 rounded-lg flex items-center justify-center"><AppIcons.React className="w-8 h-8" /></div>
                    <h3 className="text-lg font-semibold flex-1">My Web App</h3>
                </div>
                <p className="text-sm text-[var(--gray)] flex-1">A production-ready web application generated by MominAI.</p>
                <div className="flex justify-between items-center text-xs text-[var(--gray)]">
                    <span>Updated 2 hours ago</span>
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-400"></div> Deployed</span>
                </div>
                 <button onClick={onOpenIDE} className="w-full mt-2 glass-button text-gray-700 px-4 py-2.5 text-sm font-semibold hover:bg-white/20 border border-white/30">
                    Open IDE
                 </button>
            </div>
            <div className="glass-card border-2 border-dashed border-white/30 flex items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-white/10 transition-all duration-300" style={{ animation: 'fade-in-up 0.5s ease-out 0.2s backwards' }}>
                <div>
                    <AppIcons.Plus className="w-8 h-8 mx-auto mb-2 text-[var(--gray)]" />
                    <span className="font-semibold text-[var(--gray)]">Create New Project</span>
                </div>
            </div>
        </div>
    </div>
);

const SettingsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const tabs = [
        { id: 'profile', label: 'Profile', icon: AppIcons.User },
        { id: 'billing', label: 'Billing', icon: AppIcons.CreditCard },
        { id: 'apiKeys', label: 'API Keys', icon: AppIcons.Key },
    ];

    const renderContent = () => {
        switch(activeTab) {
            case 'profile': return <ProfileSettings />;
            case 'billing': return <BillingSettings />;
            case 'apiKeys': return <ApiKeysSettings />;
            default: return null;
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-8">Settings</h2>
            <div className="flex gap-8 items-start">
                <div className="w-48 flex-shrink-0 flex flex-col gap-2">
                   {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all duration-200 glass-button border-none ${activeTab === tab.id ? 'bg-primary/20 text-black shadow-lg' : 'text-gray-700 hover:bg-white/20'}`}>
                           <tab.icon className="w-5 h-5"/>
                           <span>{tab.label}</span>
                        </button>
                   ))}
                </div>
                <div className="flex-1 glass-card p-8" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                   {renderContent()}
                </div>
            </div>
        </div>
    );
};

const ProfileSettings = () => (
    <div>
        <h3 className="text-xl font-bold mb-6">Public Profile</h3>
        <form className="flex flex-col gap-6 max-w-lg">
             <div className="flex items-center gap-4">
                 <img src="/avatar.jpg" alt="User Avatar" className="w-16 h-16 rounded-full"/>
                 <button className="glass-button border border-white/30 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white/20">Upload new picture</button>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-[var(--gray)] mb-1 block">First Name</label>
                    <input type="text" value="Momin" className="w-full p-2 glass-input text-gray-800" />
                </div>
                 <div>
                    <label className="text-sm text-[var(--gray)] mb-1 block">Last Name</label>
                    <input type="text" value="Khan" className="w-full p-2 glass-input text-gray-800" />
                </div>
            </div>
             <div>
                <label className="text-sm text-[var(--gray)] mb-1 block">Email</label>
                <input type="email" value="momin@example.com" disabled className="w-full p-2 glass-input opacity-60 cursor-not-allowed text-gray-800" />
            </div>
            <button type="submit" className="mt-4 glass-button bg-primary text-white px-6 py-2.5 font-semibold text-sm hover:bg-primary/80 self-start border-none">
                Save Changes
            </button>
        </form>
    </div>
);

const BillingSettings = () => (
     <div>
        <h3 className="text-xl font-bold mb-6">Billing Information</h3>
        <div className="space-y-6">
            <div className="glass-card p-6">
                <h4 className="font-semibold mb-1">Current Plan</h4>
                <p className="text-3xl font-bold text-[var(--accent)] mb-2">Pro</p>
                <p className="text-sm text-[var(--gray)]">Your plan renews on July 30, 2024.</p>
            </div>
             <div className="glass-card p-6">
                <h4 className="font-semibold mb-2">Payment Method</h4>
                <div className="flex items-center gap-4">
                    <AppIcons.CreditCard className="w-8 h-8 text-[var(--gray)]"/>
                    <div>
                        <p className="font-medium">Visa ending in 1234</p>
                        <p className="text-sm text-[var(--gray)]">Expires 12/2026</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const ApiKeysSettings = () => (
     <div>
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">API Keys</h3>
            <button className="flex items-center gap-2 glass-button text-gray-700 px-4 py-2 font-semibold text-sm hover:bg-white/20 border border-white/30">
                <AppIcons.Plus className="w-5 h-5" />
                <span>Generate New Key</span>
            </button>
        </div>
        <div className="glass-card p-4">
            <p className="text-sm text-gray-600">You don't have any API keys yet.</p>
        </div>
    </div>
);


export default Dashboard;
