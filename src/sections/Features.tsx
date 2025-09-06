import React from 'react';
import { CodeIcon, DeployIcon, ScaleIcon } from '../components/icons.tsx';

interface FeatureCardProps {
    feature: {
        icon: React.ReactNode;
        title: string;
        description: string;
    };
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
    return (
        <div 
            className="bg-[var(--background-secondary)] p-8 rounded-xl border border-[var(--border-color)] text-left transition-all duration-300 hover:border-[var(--accent)] hover:bg-[#1C1833]"
        >
           <div className="mb-4 text-[var(--accent)]">{feature.icon}</div>
           <h3 className="text-xl mb-2 font-semibold">{feature.title}</h3>
           <p className="text-[var(--gray)] leading-relaxed">{feature.description}</p>
        </div>
    );
};


const Features = () => {
    const features = [
        { icon: <CodeIcon />, title: "Instant Code Generation", description: "Describe your app in plain English and watch our AI write clean, efficient code in real-time." },
        { icon: <DeployIcon />, title: "One-Click Deployment", description: "Go from concept to a globally deployed application on our serverless infrastructure with a single click." },
        { icon: <ScaleIcon />, title: "Infinite Scalability", description: "Built on a robust, auto-scaling backend, your application is ready for millions of users from day one." },
    ];
    
    return (
        <section id="features" className="reveal frost py-16 sm:py-24 px-8 text-center">
            <h2 className="text-[clamp(2rem,5vw,2.5rem)] font-bold mb-4">Develop at the speed of thought.</h2>
            <p className="text-[var(--gray)] max-w-2xl mx-auto mb-16">Our platform is engineered for velocity. Stop writing boilerplate and start focusing on what makes your application unique.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {features.map((feature, index) => (
                    <FeatureCard key={index} feature={feature} />
                ))}
            </div>
        </section>
    );
};

export default Features;