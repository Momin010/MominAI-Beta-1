import React, { useState, useEffect } from 'react';
import { MominAILogo } from './icons.tsx';

interface HeaderProps {
    onBuildNowClick: () => void;
    onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBuildNowClick, onLoginClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isMenuOpen]);

    const handleLinkClick = () => {
        setIsMenuOpen(false);
    };

    const hamburgerLineStyle = (isOpen: boolean, position: 'top' | 'middle' | 'bottom'): React.CSSProperties => ({
        width: '100%',
        height: '2px',
        backgroundColor: 'var(--foreground)',
        borderRadius: '1px',
        transition: 'all 0.3s ease',
        transformOrigin: 'center',
        ...(isOpen && position === 'top' && { transform: 'translateY(7px) rotate(45deg)' }),
        ...(isOpen && position === 'middle' && { opacity: 0, transform: 'scale(0)' }),
        ...(isOpen && position === 'bottom' && { transform: 'translateY(-7px) rotate(-45deg)' }),
    });
    
    const NavLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
        <a href={href} className="text-[var(--gray)] hover:text-[var(--foreground)] transition-colors duration-200 text-sm no-underline">
            {children}
        </a>
    );

    const navLinks = [
        { href: "#features", label: "Features" },
        { href: "#testimonials", label: "Testimonials" },
        { href: "#pricing", label: "Pricing" }
    ];

    return (
        <>
            <header
                className={`frost fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-6xl px-4 py-3 flex justify-between items-center z-[100] transition-all duration-300
                ${isScrolled ? 'bg-[rgba(18,15,36,0.7)] backdrop-blur-lg border border-[var(--border-color)] shadow-lg' : 'bg-transparent border-transparent'} rounded-full`}
            >
                <a href="#" className="flex items-center font-semibold text-[var(--foreground)] no-underline">
                    <MominAILogo width={100} height={22} />
                </a>
                
                {/* Desktop Navigation */}
                <nav className="hidden lg:flex gap-6 items-center">
                    {navLinks.map(link => <NavLink key={link.href} href={link.href}>{link.label}</NavLink>)}
                </nav>
                 <div className="hidden lg:flex gap-4 items-center">
                    <button onClick={onLoginClick} className="px-5 py-2 rounded-full border font-semibold text-sm cursor-pointer transition-all duration-200 bg-transparent text-[var(--gray)] hover:text-white border-[var(--border-color)] hover:border-white/80">
                        Login
                    </button>
                    <button onClick={onBuildNowClick} className="px-5 py-2 rounded-full border font-semibold text-sm cursor-pointer transition-all duration-200 bg-transparent border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white hover:scale-105 active:scale-100">
                        Build Now
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button className="lg:hidden flex flex-col justify-around w-6 h-6 bg-transparent border-none z-[1001]" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
                    <div style={hamburgerLineStyle(isMenuOpen, 'top')}></div>
                    <div style={hamburgerLineStyle(isMenuOpen, 'middle')}></div>
                    <div style={hamburgerLineStyle(isMenuOpen, 'bottom')}></div>
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            <div className={`fixed inset-0 bg-black/90 backdrop-blur-lg z-[999] flex flex-col justify-center items-center gap-8 lg:hidden transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                {navLinks.map(link => <a key={link.href} href={link.href} className="text-white no-underline text-3xl font-semibold" onClick={handleLinkClick}>{link.label}</a>)}
                <div className="flex flex-col gap-6 items-center mt-8">
                    <button onClick={() => { onLoginClick(); handleLinkClick(); }} className="px-8 py-4 rounded-full border border-[var(--border-color)] text-2xl bg-transparent text-white hover:bg-white/10">
                        Login
                    </button>
                    <button onClick={() => { onBuildNowClick(); handleLinkClick(); }} className="px-8 py-4 rounded-full border border-[var(--accent)] text-2xl bg-transparent text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white">
                        Build Now
                    </button>
                </div>
            </div>
        </>
    );
};

export default Header;
