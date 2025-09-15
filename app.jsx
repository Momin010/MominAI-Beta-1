import React from 'react';
import './styles.css';
import { FeatureCard, AnimatedButton, Logo } from './components.js';

// Main App component for the welcome page
function App() {
  return (
    <div className="app">
      {/* Welcome Section with animated header */}
      <header className="welcome-header">
        <Logo />
        <h1>Welcome to MominAI</h1>
        <p>Experience the future of AI-powered development</p>
        <AnimatedButton text="Get Started" />
      </header>

      {/* Features Section showcasing key capabilities */}
      <section className="features">
        <FeatureCard title="AI Assistant" description="Intelligent code suggestions and debugging" />
        <FeatureCard title="Live Preview" description="See changes in real-time" />
        <FeatureCard title="Collaboration" description="Work together seamlessly" />
      </section>
    </div>
  );
}

export default App;