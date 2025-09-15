import React from 'react';

const Loader = () => {
    return (
        <div className="frost flex justify-center items-center h-screen w-screen bg-transparent">
            <div
                className="border-4 border-[rgba(255,255,255,0.2)] border-l-[var(--accent)] rounded-full w-12 h-12 animate-spin"
            ></div>
        </div>
    );
};

export default Loader;
