import React from 'react';
import { MominAILogo } from './icons.tsx';

const Footer = () => {
    return (
        <footer className="frost py-16 px-8 text-center bg-[var(--background)] relative mt-24">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-center items-center mb-8">
                    <MominAILogo width={120} height={28} />
                </div>
                <div className="flex justify-center flex-wrap gap-6 sm:gap-8 mb-8">
                    <a href="#features" className="text-[var(--gray)] no-underline transition-colors duration-200 hover:text-[var(--foreground)] text-sm">Features</a>
                    <a href="#testimonials" className="text-[var(--gray)] no-underline transition-colors duration-200 hover:text-[var(--foreground)] text-sm">Testimonials</a>
                    <a href="#pricing" className="text-[var(--gray)] no-underline transition-colors duration-200 hover:text-[var(--foreground)] text-sm">Pricing</a>
                    <a href="#" className="text-[var(--gray)] no-underline transition-colors duration-200 hover:text-[var(--foreground)] text-sm">Docs</a>
                </div>
                <p className="text-[var(--gray)] text-xs">© 2025 MominAI Inc. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;