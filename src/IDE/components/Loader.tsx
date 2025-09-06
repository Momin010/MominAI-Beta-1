
import React from 'react';

const Loader = () => {
    return (
        <div className="flex flex-col justify-center items-center h-full w-full bg-transparent text-center">
            <div 
                className="border-4 border-[var(--gray-dark)] border-l-[var(--accent)] rounded-full w-12 h-12 animate-spin"
            ></div>
            <p className="mt-6 text-[var(--gray)] text-lg font-medium">Setting up your environment...</p>
        </div>
    );
};

export default Loader;
