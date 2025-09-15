import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSubscription } from '../contexts/SubscriptionContext';

declare const window: any;

interface SignUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const SignUpModal = ({ isOpen, onClose, onSuccess }: SignUpModalProps) => {
    const { activatePremium, activationCode, setActivationCode, isLaunched, hasSignedUp, setHasSignedUp } = useSubscription();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [errors, setErrors] = React.useState<{email?: string; password?: string; activationCode?: string}>({});

    // Validation functions
    const validateEmail = (email: string): string | null => {
        if (!email.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Please enter a valid email address';
        if (email.length > 254) return 'Email address is too long';
        return null;
    };

    const validatePassword = (password: string): string | null => {
        if (!password) return 'Password is required';
        if (password.length < 8) return 'Password must be at least 8 characters long';
        if (password.length > 128) return 'Password must be less than 128 characters';
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
            return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
        return null;
    };

    const validateActivationCode = (code: string): string | null => {
        if (!code.trim()) return null; // Optional field
        if (code.length < 5) return 'Activation code must be at least 5 characters long';
        return null;
    };

    const sanitizeInput = (input: string): string => {
        return input.trim().replace(/[<>'"&]/g, '');
    };

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

                // Handle launch gating
                if (!isLaunched) {
                    setHasSignedUp(true);
                    alert('Thank you for signing up! We are launching soon. You will be notified when we go live.');
                    onClose();
                    return;
                }

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

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        const sanitizedEmail = sanitizeInput(email);
        const sanitizedPassword = sanitizeInput(password);
        const sanitizedActivationCode = sanitizeInput(activationCode);

        const emailError = validateEmail(sanitizedEmail);
        const passwordError = validatePassword(sanitizedPassword);
        const activationCodeError = validateActivationCode(sanitizedActivationCode);

        if (emailError || passwordError || activationCodeError) {
            setErrors({
                email: emailError || undefined,
                password: passwordError || undefined,
                activationCode: activationCodeError || undefined
            });
            return;
        }

        setErrors({});

        // Try to activate premium if activation code is provided
        if (sanitizedActivationCode) {
            const premiumActivated = await activatePremium(sanitizedActivationCode);
            if (!premiumActivated) {
                setErrors({
                    activationCode: 'Invalid activation code'
                });
                return;
            }
        }

        // Here you would typically send the sanitized data to your backend
        console.log('Form submitted with:', {
            email: sanitizedEmail,
            password: sanitizedPassword,
            premiumActivated: !!sanitizedActivationCode
        });

        // Handle launch gating
        if (!isLaunched) {
            setHasSignedUp(true);
            // Show launch message instead of proceeding
            alert('Thank you for signing up! We are launching soon. You will be notified when we go live.');
            onClose();
            return;
        }

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
                    <div>
                        <input
                            className={`p-3 rounded-lg border bg-[var(--background-secondary)] text-[var(--foreground)] text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-[var(--accent)] outline-none w-full ${errors.email ? 'border-red-500' : 'border-[var(--border-color)] focus:border-[var(--accent)]'}`}
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            aria-label="Email Address"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <input
                            className={`p-3 rounded-lg border bg-[var(--background-secondary)] text-[var(--foreground)] text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-[var(--accent)] outline-none w-full ${errors.password ? 'border-red-500' : 'border-[var(--border-color)] focus:border-[var(--accent)]'}`}
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            aria-label="Password"
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>
                    <div>
                        <input
                            className={`p-3 rounded-lg border bg-[var(--background-secondary)] text-[var(--foreground)] text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-[var(--accent)] outline-none w-full ${errors.activationCode ? 'border-red-500' : 'border-[var(--border-color)] focus:border-[var(--accent)]'}`}
                            type="text"
                            placeholder="Activation Code (Optional - for Premium)"
                            value={activationCode}
                            onChange={(e) => setActivationCode(e.target.value)}
                            aria-label="Activation Code"
                        />
                        {errors.activationCode && <p className="text-red-500 text-xs mt-1">{errors.activationCode}</p>}
                        <p className="text-gray-400 text-xs mt-1">Enter activation code to unlock premium features</p>
                    </div>
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
