import React, { useState, useCallback, ReactNode } from 'react';
import { NotificationProvider } from '../hooks/useNotifications.ts';
import { Icons } from './Icon.tsx';
import type { Notification } from '../types.ts';

const NotificationItem: React.FC<{ notification: Notification; onDismiss: () => void }> = ({ notification, onDismiss }) => {
    const colorClasses = {
        info: 'bg-blue-500/80',
        success: 'bg-green-500/80',
        warning: 'bg-yellow-500/80',
        error: 'bg-red-500/80',
    };
    return (
        <div className={`flex items-center justify-between w-full max-w-sm p-3 text-white rounded-lg shadow-lg ${colorClasses[notification.type]} backdrop-blur-md animate-fade-in-up`}>
            <p className="text-sm">{notification.message}</p>
            <button onClick={onDismiss} className="p-1 rounded-full hover:bg-white-20">
                <Icons.X className="w-4 h-4" />
            </button>
        </div>
    );
};

const NotificationContainer: React.FC<{ notifications: Notification[]; removeNotification: (id: string) => void }> = ({ notifications, removeNotification }) => (
    <div className="fixed bottom-16 right-4 z-[9999] flex flex-col items-end space-y-2">
        {notifications.map(n => (
            <NotificationItem key={n.id} notification={n} onDismiss={() => removeNotification(n.id)} />
        ))}
    </div>
);

interface NotificationSystemProps {
    children: ReactNode;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(current => current.filter(n => n.id !== id));
    }, []);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications(current => [...current, { ...notification, id }]);
        const duration = notification.duration || 5000;
        setTimeout(() => removeNotification(id), duration);
    }, [removeNotification]);

    return (
        <NotificationProvider value={{ addNotification }}>
            {children}
            <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
        </NotificationProvider>
    );
};

export default NotificationSystem;