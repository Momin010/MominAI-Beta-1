import React from 'react';

interface HeroProps {
    onBuildNowClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onBuildNowClick }) => {
    return (
        <section
            className="frost min-h-screen flex flex-col justify-center items-center text-center p-8 pt-32"
        >
            <h1 
                className="text-[clamp(2.5rem,8vw,5.5rem)] font-extrabold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent leading-tight"
            >
                Conceive. Generate. Deploy.
            </h1>
            <p 
                className="text-[clamp(1rem,2vw,1.25rem)] text-[var(--gray)] max-w-2xl mb-8"
            >
                The AI platform for building and deploying production-grade applications and websites in seconds. Go from idea to live URL instantly.
            </p>
            <div 
                className="flex flex-col sm:flex-row gap-4"
            >
                <button onClick={onBuildNowClick} className="px-6 py-3 rounded-lg font-semibold text-base transition-all duration-200 bg-[var(--accent)] text-black hover:brightness-110 hover:scale-105 active:scale-100">
                    Build Now
                </button>
                <a href="#pricing" className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-base transition-all duration-200 bg-transparent text-[var(--foreground)] border border-[var(--border-color)] no-underline hover:bg-[var(--background-secondary)] hover:scale-105 active:scale-100">
                    Contact Sales
                </a>
            </div>
        </section>
    );
};

export default Hero;