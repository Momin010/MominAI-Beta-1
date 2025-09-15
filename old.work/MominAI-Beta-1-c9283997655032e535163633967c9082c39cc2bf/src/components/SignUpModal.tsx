import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

declare const window: any;

interface SignUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const SignUpModal = ({ isOpen, onClose, onSuccess }: SignUpModalProps) => {
    
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        if (!isOpen || !window.google) return;

        window.google.accounts.id.initialize({
            // Replaced the demo Client ID with the user's provided one.
            client_id: "601307193094-i9r4kscn6tqkilon3g9c352igtt9ta40.apps.googleusercontent.com",
            callback: (response: any) => {
                console.log("Google Sign-In successful, token:", response.credential);
                // In a real app, you would send this token to your backend for verification
                onSuccess();
            }
        });

        const googleButtonContainer = document.getElementById('google-signin-button');
        if (googleButtonContainer) {
            window.google.accounts.id.renderButton(
                googleButtonContainer,
                { theme: 'filled_black', size: 'large', type: 'standard', text: 'signup_with', shape: 'pill', width: '320' }
            );
        }
    }, [isOpen, onSuccess]);


    if (!isOpen) return null;

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onSuccess();
    };

    return createPortal(
        <div
            className="frost fixed inset-0 bg-[rgba(11,8,24,0.8)] flex justify-center items-center z-[1000] backdrop-blur-md p-4"
            style={{ animation: 'fadeIn 0.6s ease' }}
            onClick={onClose}
        >
            <div 
                className="bg-[#101010] p-8 rounded-2xl w-full max-w-sm relative shadow-2xl text-center"
                style={{ animation: 'scaleIn 0.6s ease' }}
                onClick={e => e.stopPropagation()}
            >
                <button 
                    className="absolute top-4 right-4 bg-transparent border-none text-[var(--gray)] text-2xl cursor-pointer hover:text-white transition-colors" 
                    onClick={onClose} 
                    aria-label="Close modal"
                >&times;</button>
                
                <h2 className="mb-2 text-2xl font-bold">Create Your Account</h2>
                <p className="text-[var(--gray)] mb-6 text-sm">Join millions of developers building the future.</p>
                
                <div id="google-signin-button" className="flex justify-center w-full"></div>

                <div className="flex items-center text-center text-[var(--gray)] my-6 text-xs uppercase">
                    <div className="flex-1 border-b border-[var(--border-color)]" />
                    <span className="px-4">OR</span>
                    <div className="flex-1 border-b border-[var(--border-color)]" />
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <input className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--background-secondary)] text-[var(--foreground)] text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] outline-none" type="email" placeholder="Email Address" required aria-label="Email Address" />
                    <input className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--background-secondary)] text-[var(--foreground)] text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] outline-none" type="password" placeholder="Password" required aria-label="Password"/>
                    <button type="submit" className="p-3 rounded-lg font-semibold text-sm transition-all duration-200 bg-transparent border border-[var(--accent)] text-[var(--accent)] mt-2 hover:bg-[var(--accent)] hover:text-white">
                        Continue with Email
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default SignUpModal;
