import React from 'react';
import { CheckIcon } from '../components/icons.tsx';

interface PricingCardProps {
    plan: {
        name: string;
        price: string;
        description: string;
        features: string[];
        popular: boolean;
    };
    onHobbyClick: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, onHobbyClick }) => {
    const renderButton = () => {
        const commonClasses = "w-full mt-4 p-3 rounded-lg cursor-pointer font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-100 flex items-center justify-center no-underline";
        const popularClasses = `bg-transparent border-2 border-[var(--accent)] text-white hover:bg-[var(--accent)]`;
        const defaultClasses = `bg-transparent border border-[var(--border-color)] text-[var(--foreground)] hover:bg-white/10`;

        switch (plan.name) {
            case 'Hobby':
                return (
                    <button onClick={onHobbyClick} className={`${commonClasses} ${plan.popular ? popularClasses : defaultClasses}`}>
                        Get Started
                    </button>
                );
            case 'Pro':
                return (
                    <a href="/?checkout=pro" className={`${commonClasses} ${plan.popular ? popularClasses : defaultClasses}`}>
                        Get Started
                    </a>
                );
            case 'Enterprise':
                return (
                    <a href="mailto:sales@momin.ai" className={`${commonClasses} ${plan.popular ? popularClasses : defaultClasses}`}>
                        Contact Sales
                    </a>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className={`relative h-full bg-[var(--background-secondary)] p-8 rounded-xl border text-left flex flex-col ${plan.popular ? 'border-[var(--accent)]' : 'border-[var(--border-color)]'}`}>
            {plan.popular && <div className="absolute -top-4 right-6 bg-[var(--accent)] text-[var(--accent-text)] px-3 py-1 rounded-full text-xs font-semibold">Most Popular</div>}
            <div className="flex-grow">
                <h3 className="text-xl mb-2 font-semibold">{plan.name}</h3>
                <p className="text-4xl font-bold mb-2">{plan.price}<span className="text-base text-[var(--gray)] font-normal">{plan.price !== 'Custom' && '/mo'}</span></p>
                <p className="text-[var(--gray)] mb-8 min-h-[40px] text-sm">{plan.description}</p>
                <ul className="list-none p-0 m-0 mb-8 flex flex-col gap-3">
                    {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm"><CheckIcon /><span>{feature}</span></li>
                    ))}
                </ul>
            </div>
            {renderButton()}
        </div>
    );
};

interface PricingProps {
    onHobbyClick: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onHobbyClick }) => {
    const plans = [
        { name: 'Hobby', price: '$0', description: 'For personal projects & experiments.', features: ['1 User', '1 App Deployment', 'Community Support'], popular: false },
        { name: 'Pro', price: '$20', description: 'For professional developers & teams.', features: ['5 Users', 'Unlimited App Deployments', 'Email Support', 'Advanced Analytics'], popular: true },
        { name: 'Enterprise', price: 'Custom', description: 'For large-scale applications.', features: ['Unlimited Users', 'Dedicated Infrastructure', '24/7 Priority Support', 'Custom Integrations'], popular: false },
    ];
    
    return (
        <section id="pricing" className="reveal frost py-16 sm:py-24 px-8 text-center">
            <h2 className="text-[clamp(2rem,5vw,2.5rem)] font-bold mb-4">Fair, transparent pricing</h2>
            <p className="text-[var(--gray)] max-w-xl mx-auto mb-16">Choose the plan that's right for you. Start for free, and scale to millions.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
                {plans.map((plan, index) => (
                    <PricingCard key={index} plan={plan} onHobbyClick={onHobbyClick} />
                ))}
            </div>
        </section>
    );
}

export default Pricing;