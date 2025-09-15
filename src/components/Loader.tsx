import React from 'react';

const Loader = () => {
    return (
        <div className="frost flex justify-center items-center h-screen w-screen bg-transparent">
            <div className="flex space-x-2">
                <div className="w-4 h-4 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-4 h-4 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-4 h-4 bg-[var(--accent)] rounded-full animate-bounce"></div>
            </div>
        </div>
    );
};

export default Loader;
