import { createContext, useContext } from 'react';
import type { Notification } from '../types';

const NotificationContext = createContext<{ addNotification: (notification: Omit<Notification, 'id'>) => void; } | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
    return context;
};

export const NotificationProvider = NotificationContext.Provider;