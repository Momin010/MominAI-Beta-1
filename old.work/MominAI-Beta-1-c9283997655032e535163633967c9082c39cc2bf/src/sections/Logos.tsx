import React, { useState } from 'react';

const Logos = () => {
    const logos = ["Netlify", "GitHub", "Figma", "Notion", "Stripe", "Vercel"];
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <section className="reveal frost py-16 sm:py-24 text-center overflow-hidden">
            <p className="text-[var(--gray)] mb-8 uppercase tracking-widest text-xs px-4">
                Trusted by the next generation of builders
            </p>
            <div 
                className="relative h-10"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div 
                    className="flex absolute top-0 left-0 w-max"
                    style={{ 
                        animation: 'scroll 40s linear infinite',
                        animationPlayState: isHovered ? 'paused' : 'running',
                     }}
                >
                    {[...logos, ...logos, ...logos].map((logo, i) => (
                        <div key={i} className="text-gray-400 text-xl mx-12 whitespace-nowrap font-medium">{logo}</div>
                    ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-transparent to-[var(--background)] pointer-events-none"></div>
            </div>
        </section>
    );
};

export default Logos;