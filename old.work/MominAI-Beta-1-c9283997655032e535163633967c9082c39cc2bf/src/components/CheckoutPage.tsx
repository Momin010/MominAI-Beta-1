import React, { useState, useEffect } from 'react';
import Loader from './Loader.tsx';
import { MominAILogo, CheckIcon } from './icons.tsx';

declare const window: any;

interface CheckoutPageProps {
    plan: string | null;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ plan }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const publishableKey = 'pk_test_51RVscnRqAgvOqPULRsfgFqjGyM9Cxm419I5sPT4Ybp1rrZ0pjistFQ9AGQmfvv74SgX3kzOZEYeuI94t5UneUwRg00AAqA8OTU';
    
    // Plan details could be fetched from an API, but are hardcoded for simplicity.
    const planDetails = {
        name: 'Pro Plan',
        price: 20,
        features: [
            '5 Users',
            'Unlimited App Deployments',
            'Email Support',
            'Advanced Analytics',
            'AI-Powered Code Reviews'
        ]
    };

    const handleProceedToPayment = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch the checkout session ID from our serverless function.
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: plan }),
            });

            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error.message || 'Failed to create checkout session.');
            }
            
            const { sessionId } = await response.json();

            // 2. Initialize Stripe.js with the publishable key.
            const stripe = window.Stripe(publishableKey);
            if (!stripe) {
                 throw new Error('Stripe.js has not loaded yet.');
            }

            // 3. Redirect to Stripe's hosted checkout page.
            const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
            if (stripeError) {
                throw stripeError;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    return (
        <div className="frost flex flex-col items-center justify-center w-screen h-screen bg-transparent p-4">
             <div 
                className="w-full max-w-md bg-[var(--background-secondary)] p-8 rounded-2xl border border-[var(--border-color)] shadow-2xl text-center"
                style={{ animation: 'scaleIn 0.6s ease' }}
            >
                <div className="flex justify-center mb-6">
                     <MominAILogo width={120} height={28} />
                </div>
                <h1 className="text-2xl font-bold mb-2">Complete Your Purchase</h1>
                <p className="text-[var(--gray)] mb-6">You're about to subscribe to the MominAI {planDetails.name}.</p>

                <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--border-color)] text-left mb-6">
                    <p className="text-3xl font-bold mb-4">
                        ${planDetails.price}<span className="text-base text-[var(--gray)] font-normal">/mo</span>
                    </p>
                     <ul className="list-none p-0 m-0 space-y-2">
                        {planDetails.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-[var(--foreground)]">
                                <CheckIcon />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                
                <button
                    onClick={handleProceedToPayment}
                    disabled={isLoading}
                    className="w-full p-3 rounded-lg font-semibold text-sm transition-all duration-200 bg-transparent border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLoading ? <Loader /> : 'Proceed to Payment'}
                </button>

                 <a href="/" className="inline-block mt-4 text-xs text-[var(--gray)] hover:text-white transition-colors no-underline">
                    Cancel and return to homepage
                </a>
            </div>
        </div>
    );
};

export default CheckoutPage;