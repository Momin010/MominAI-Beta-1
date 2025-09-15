import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { encryptionService } from '../IDE/services/encryptionService';

// Initialize encryption service
encryptionService.initialize().catch(error => {
    console.error('Failed to initialize encryption service:', error);
});

// A custom hook to synchronize state with localStorage with encryption support.
export const useLocalStorageState = <T,>(
    key: string, // The key to use in localStorage.
    initialValue: T, // The initial value if nothing is in localStorage.
    encrypt: boolean = false // Whether to encrypt the stored data.
): [T, Dispatch<SetStateAction<T>>, () => void] => {
    // 1. Initialize state from localStorage or the initial value.
    const [storedValue, setStoredValue] = useState<T>(() => {
        // This function is only called on the initial render.
        if (typeof window === 'undefined') {
            // If we're on the server (SSR), return the initial value.
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            if (!item) return initialValue;

            // Check if data is encrypted
            if (encrypt && encryptionService.isEncrypted(item)) {
                // Decrypt the data
                const decrypted = encryptionService.decryptFromStorage(item);
                return decrypted;
            } else {
                // Parse stored json or if none, return initialValue.
                return JSON.parse(item);
            }
        } catch (error) {
            // If parsing/decryption fails, log the error and return the initial value.
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // 2. Use useEffect to update localStorage when the state changes.
    useEffect(() => {
        // This effect runs whenever 'key', 'storedValue', or 'encrypt' changes.
        if (typeof window === 'undefined') {
            return;
        }

        const storeValue = async () => {
            try {
                let valueToStore: string;

                if (encrypt) {
                    // Encrypt the data before storing
                    valueToStore = await encryptionService.encryptForStorage(storedValue);
                } else {
                    // Stringify the value and save it to localStorage.
                    valueToStore = JSON.stringify(storedValue);
                }

                window.localStorage.setItem(key, valueToStore);
            } catch (error) {
                // If stringifying/encrypting or saving fails, log the error.
                console.error(`Error setting localStorage key "${key}":`, error);
            }
        };

        storeValue();
    }, [key, storedValue, encrypt]);

    // 3. Create a callback to clear the value from localStorage.
    const clearValue = useCallback(() => {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            // Remove the item from localStorage.
            window.localStorage.removeItem(key);
            // Reset the state to its initial value.
            setStoredValue(initialValue);
        } catch (error) {
            // If removal fails, log the error.
            console.error(`Error clearing localStorage key "${key}":`, error);
        }
    }, [key, initialValue, encrypt]);

    // 4. Return the state, setter, and clear function.
    return [storedValue, setStoredValue, clearValue];
};
