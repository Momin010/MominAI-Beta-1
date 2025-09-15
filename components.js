// Reusable components for the welcome page

// Feature card component for showcasing features
export function FeatureCard({ title, description }) {
  return (
    <div className="feature-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

// Animated button component with hover effects
export function AnimatedButton({ text }) {
  return (
    <button className="animated-btn">{text}</button>
  );
}

// Logo component with simple text
export function Logo() {
  return <div className="logo">MominAI</div>;
}