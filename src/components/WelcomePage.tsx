import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';
import SignUpModal from './SignUpModal';
import './WelcomePage.css';

const WelcomePage: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const navigate = useNavigate();
  const { isLaunched } = useSubscription();

  useEffect(() => {
    // Trigger animations after component mounts
    setTimeout(() => setIsLoaded(true), 100);
    setTimeout(() => setShowContent(true), 500);
  }, []);

  const handleEnterApp = () => {
    if (isLaunched) {
      setShowSignUpModal(true);
    } else {
      // Pre-launch: show signup modal
      setShowSignUpModal(true);
    }
  };

  const handleSignUpSuccess = () => {
    setShowSignUpModal(false);
    if (isLaunched) {
      navigate('/dashboard');
    }
  };

  return (
    <div className={`welcome-page ${isLoaded ? 'loaded' : ''}`}>
      <div className="welcome-background">
        <div className="gradient-overlay"></div>
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="welcome-content">
        <div className={`logo-container ${showContent ? 'animate-in' : ''}`}>
          <img
            src="/logo.svg"
            alt="MominAI Logo"
            className="logo"
          />
        </div>

        <div className={`title-container ${showContent ? 'animate-in-delay-1' : ''}`}>
          <h1 className="welcome-title">
            Welcome to <span className="gradient-text">MominAI</span>
          </h1>
          <p className="welcome-subtitle">
            The Ultimate AI Development Platform
          </p>
        </div>

        <div className={`description-container ${showContent ? 'animate-in-delay-2' : ''}`}>
          <p className="welcome-description">
            {isLaunched
              ? "Revolutionize your development workflow with cutting-edge AI tools, integrated IDE, and seamless collaboration features."
              : "Join the future of AI-powered development. Be among the first to experience our revolutionary platform."
            }
          </p>
        </div>

        <div className={`buttons-container ${showContent ? 'animate-in-delay-3' : ''}`}>
          <button
            className="enter-button primary"
            onClick={handleEnterApp}
          >
            {isLaunched ? 'Get Started' : 'Join Waitlist'}
          </button>
          <button
            className="enter-button secondary"
            onClick={() => navigate('/ide')}
          >
            Try IDE Demo
          </button>
        </div>

        <div className={`features-preview ${showContent ? 'animate-in-delay-4' : ''}`}>
          <div className="feature-item">
            <div className="feature-icon">🚀</div>
            <span>AI-Powered Development</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon">⚡</div>
            <span>Lightning Fast</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🔧</div>
            <span>Integrated Tools</span>
          </div>
        </div>
      </div>

      <SignUpModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        onSuccess={handleSignUpSuccess}
      />
    </div>
  );
};

export default WelcomePage;