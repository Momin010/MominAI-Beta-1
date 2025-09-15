import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

// A custom hook to synchronize state with localStorage.
export const useLocalStorageState = <T,>(
    key: string, // The key to use in localStorage.
    initialValue: T // The initial value if nothing is in localStorage.
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
            // Parse stored json or if none, return initialValue.
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            // If parsing fails, log the error and return the initial value.
            console.error(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    // 2. Use useEffect to update localStorage when the state changes.
    useEffect(() => {
        // This effect runs whenever 'key' or 'storedValue' changes.
        if (typeof window === 'undefined') {
            return;
        }
        try {
            // Stringify the value and save it to localStorage.
            const valueToStore = JSON.stringify(storedValue);
            window.localStorage.setItem(key, valueToStore);
        } catch (error) {
            // If stringifying or saving fails, log the error.
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }, [key, storedValue]);

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
            console.error(`Error clearing localStorage key “${key}”:`, error);
        }
    }, [key, initialValue]);

    // 4. Return the state, setter, and clear function.
    return [storedValue, setStoredValue, clearValue];
};
