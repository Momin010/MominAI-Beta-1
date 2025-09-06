
import React, { useState, useEffect, useRef } from 'react';
import { MominAILogo, AppIcons } from './icons.tsx';

interface DashboardProps {
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const [activeView, setActiveView] = useState('projects');

    const handleOpenIDE = () => {
        window.location.href = '/?ide=true';
    };

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
        <div className="frost flex h-screen w-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onLogout={onLogout} />
                <main className="flex-1 overflow-y-auto p-8 bg-[rgba(11,8,24,0.8)]" style={{ animation: 'fadeIn 0.5s ease-out' }}>
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
        <aside className="w-64 bg-[rgba(18,15,36,0.5)] flex flex-col p-4 shadow-2xl">
            <div className="px-2 mb-10">
                <MominAILogo />
            </div>
            <nav className="flex-1 flex flex-col gap-2">
                {navItems.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-transparent bg-transparent ${activeView === item.id ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-[var(--gray)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--foreground)]'}`}
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
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors bg-transparent border-none">
                <img src="https://avatar.vercel.sh/momin" alt="User Avatar" className="w-8 h-8 rounded-full"/>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--background-secondary)] rounded-lg shadow-2xl py-2" style={{animation: 'scaleIn 0.1s ease-out'}}>
                    <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--gray)] hover:bg-white/5 hover:text-white transition-colors"><AppIcons.User className="w-4 h-4" /> Account</a>
                    <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--gray)] hover:bg-white/5 hover:text-white transition-colors"><AppIcons.Settings className="w-4 h-4" /> Settings</a>
                    <div className="my-2 h-px bg-[var(--border-color)]"></div>
                    <button onClick={onLogout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors bg-transparent border-none">
                        <AppIcons.LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

const Header: React.FC<{onLogout: () => void}> = ({ onLogout }) => (
    <header className="flex-shrink-0 h-20 flex items-center justify-between px-8 bg-transparent">
        <h1 className="text-xl font-semibold">Welcome Back, Momin</h1>
        <div className="flex items-center gap-4">
            <UserProfileDropdown onLogout={onLogout} />
        </div>
    </header>
);

const ProjectsView: React.FC<{onOpenIDE: () => void}> = ({ onOpenIDE }) => (
    <div>
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Projects</h2>
            <button className="flex items-center gap-2 bg-[var(--accent)] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:brightness-110 transition-all transform hover:scale-105 shadow-lg shadow-[var(--accent-glow)] border-none">
                <AppIcons.Plus className="w-5 h-5" />
                <span>New Project</span>
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-transparent backdrop-blur-sm p-6 rounded-xl shadow-lg flex flex-col gap-4 group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300" style={{ animation: 'fade-in-up 0.5s ease-out 0.1s backwards' }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center"><AppIcons.React className="w-8 h-8" /></div>
                    <h3 className="text-lg font-semibold flex-1">My Web App</h3>
                </div>
                <p className="text-sm text-[var(--gray)] flex-1">A production-ready web application generated by MominAI.</p>
                <div className="flex justify-between items-center text-xs text-[var(--gray)]">
                    <span>Updated 2 hours ago</span>
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-400"></div> Deployed</span>
                </div>
                 <button onClick={onOpenIDE} className="w-full mt-2 bg-transparent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--accent)] transition-colors duration-300 border border-[var(--border-color)] hover:border-[var(--accent)]">
                    Open IDE
                </button>
            </div>
            <div className="border-2 border-dashed border-[var(--border-color)] rounded-xl flex items-center justify-center text-center p-6 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-300 cursor-pointer" style={{ animation: 'fade-in-up 0.5s ease-out 0.2s backwards' }}>
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
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors duration-200 bg-transparent border-none ${activeTab === tab.id ? 'bg-[rgba(255,255,255,0.1)] text-white' : 'text-[var(--gray)] hover:bg-[rgba(255,255,255,0.05)]'}`}>
                           <tab.icon className="w-5 h-5"/>
                           <span>{tab.label}</span>
                        </button>
                   ))}
                </div>
                <div className="flex-1 bg-gradient-to-br from-[rgba(255,255,255,0.05)] to-transparent backdrop-blur-sm p-8 rounded-xl shadow-lg" style={{ animation: 'fadeIn 0.3s ease-out' }}>
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
                 <img src="https://avatar.vercel.sh/momin" alt="User Avatar" className="w-16 h-16 rounded-full"/>
                 <button className="bg-transparent border border-[var(--border-color)] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors">Upload new picture</button>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-[var(--gray)] mb-1 block">First Name</label>
                    <input type="text" value="Momin" className="w-full p-2 bg-[var(--background)] rounded-md outline-none focus:ring-2 ring-[var(--accent)] border border-[var(--border-color)]" />
                </div>
                 <div>
                    <label className="text-sm text-[var(--gray)] mb-1 block">Last Name</label>
                    <input type="text" value="Khan" className="w-full p-2 bg-[var(--background)] rounded-md outline-none focus:ring-2 ring-[var(--accent)] border border-[var(--border-color)]" />
                </div>
            </div>
             <div>
                <label className="text-sm text-[var(--gray)] mb-1 block">Email</label>
                <input type="email" value="momin@example.com" disabled className="w-full p-2 bg-[var(--background)] rounded-md opacity-60 cursor-not-allowed border border-[var(--border-color)]" />
            </div>
            <button type="submit" className="mt-4 bg-[var(--accent)] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:brightness-110 transition-all self-start border-none">
                Save Changes
            </button>
        </form>
    </div>
);

const BillingSettings = () => (
     <div>
        <h3 className="text-xl font-bold mb-6">Billing Information</h3>
        <div className="space-y-6">
            <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border-color)]">
                <h4 className="font-semibold mb-1">Current Plan</h4>
                <p className="text-3xl font-bold text-[var(--accent)] mb-2">Pro</p>
                <p className="text-sm text-[var(--gray)]">Your plan renews on July 30, 2024.</p>
            </div>
             <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border-color)]">
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
            <button className="flex items-center gap-2 bg-transparent border border-[var(--border-color)] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-white/20 transition-colors">
                <AppIcons.Plus className="w-5 h-5" />
                <span>Generate New Key</span>
            </button>
        </div>
        <div className="bg-[var(--background)] p-4 rounded-lg border border-[var(--border-color)]">
            <p className="text-sm text-[var(--gray)]">You don't have any API keys yet.</p>
        </div>
    </div>
);


export default Dashboard;
