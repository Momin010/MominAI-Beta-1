import React from 'react';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      <section className="hero bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white py-20 text-center">
        <h1 className="text-5xl font-bold">Welcome to My Application</h1>
        <p className="mt-4 text-lg">Empowering your productivity like never before.</p>
        <button className="mt-6 p-3 rounded-lg bg-white text-purple-800 font-semibold hover:bg-gray-200 transition duration-200">Get Started</button>
      </section>
      <section className="features py-20">
        <h2 className="text-3xl font-semibold text-center">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          <div className="feature bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold">Feature One</h3>
            <p className="mt-2">Description of feature one goes here.</p>
          </div>
          <div className="feature bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold">Feature Two</h3>
            <p className="mt-2">Description of feature two goes here.</p>
          </div>
          <div className="feature bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold">Feature Three</h3>
            <p className="mt-2">Description of feature three goes here.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
