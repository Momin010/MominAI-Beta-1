import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../sections/Hero';
import Features from '../sections/Features';
import Pricing from '../sections/Pricing';
import Testimonials from '../sections/Testimonials';
import Logos from '../sections/Logos';
import Footer from '../components/Footer';
import Header from '../components/Header';
import CustomCursor from '../components/CustomCursor';
import SignUpModal from '../components/SignUpModal';
import { useSubscription } from '../contexts/SubscriptionContext';

const LandingPage: React.FC = () => {
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const navigate = useNavigate();
    const { isLaunched, hasSignedUp, toggleLaunch } = useSubscription();

    // Launch the platform automatically
    useEffect(() => {
        if (!isLaunched) {
            toggleLaunch();
            console.log('🚀 MominAI Platform Launched!');
        }

        // Add console commands for admin control
        (window as any).launchMominAI = () => {
            toggleLaunch();
            console.log('🚀 Launch status toggled!');
        };

        (window as any).checkLaunchStatus = () => {
            console.log('Current launch status:', isLaunched ? 'LAUNCHED' : 'PRE-LAUNCH');
        };

        return () => {
            delete (window as any).launchMominAI;
            delete (window as any).checkLaunchStatus;
        };
    }, [isLaunched, toggleLaunch]);

    const handleBuildNowClick = () => {
        setShowSignUpModal(true);
    };

    const handleLoginClick = () => {
        // Open login modal
        console.log('Login clicked');
        // TODO: Open login modal
    };

    const handleHobbyClick = () => {
        setShowSignUpModal(true);
    };

    const handleSignUpSuccess = () => {
        setShowSignUpModal(false);
        if (isLaunched) {
            navigate('/dashboard');
        }
    };

    return (
        <>
            <CustomCursor />
            <Header onBuildNowClick={handleBuildNowClick} onLoginClick={handleLoginClick} />
            <main>
                <Hero onBuildNowClick={handleBuildNowClick} />
                <Features />
                <Logos />
                <Pricing onHobbyClick={handleHobbyClick} />
                <Testimonials />
            </main>
            <Footer />
            <SignUpModal
                isOpen={showSignUpModal}
                onClose={() => setShowSignUpModal(false)}
                onSuccess={handleSignUpSuccess}
            />
        </>
    );
};

export default LandingPage;