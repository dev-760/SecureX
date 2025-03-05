import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState([]);

    // Add a new notification
    const showNotification = (message, type = 'info', duration = 5000) => {
        const id = Date.now();

        setNotifications(prev => [
            ...prev,
            {
                id,
                message,
                type, // 'info', 'success', 'warning', 'error'
                duration,
                timestamp: new Date()
            }
        ]);

        // Auto remove notification after duration
        if (duration > 0) {
            setTimeout(() => {
                closeNotification(id);
            }, duration);
        }

        return id;
    };

    // Close a notification by id
    const closeNotification = (id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    // Clear all notifications
    const clearAllNotifications = () => {
        setNotifications([]);
    };

    // Predefined notification methods
    const showSuccess = (message, duration = 5000) => {
        return showNotification(message, 'success', duration);
    };

    const showError = (message, duration = 5000) => {
        return showNotification(message, 'error', duration);
    };

    const showWarning = (message, duration = 5000) => {
        return showNotification(message, 'warning', duration);
    };

    const showInfo = (message, duration = 5000) => {
        return showNotification(message, 'info', duration);
    };

    // Listen for blockchain events (this would be connected to your WebSocket service)
    useEffect(() => {
        const connectToEventStream = () => {
            // This would typically be a WebSocket connection to your backend
            // For now we're just simulating it
            console.log('Connecting to event stream...');

            // Simulated event listener
            const eventHandler = (event) => {
                // Parse the event and show appropriate notification
                if (event.type === 'AlertTriggered') {
                    showWarning(`${t('newAlert')}: ${event.data.alertType} - ${t('severity')}: ${event.data.severity}`);
                } else if (event.type === 'DeviceRegistered') {
                    showInfo(`${t('newDevice')}: ${event.data.deviceName}`);
                } else if (event.type === 'AccessDenied') {
                    showError(`${t('accessDenied')}: ${event.data.reason}`);
                }
            };

            // Return cleanup function
            return () => {
                console.log('Disconnecting from event stream...');
                // Cleanup code would go here
            };
        };

        const cleanup = connectToEventStream();
        return cleanup;
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            showNotification,
            closeNotification,
            clearAllNotifications,
            showSuccess,
            showError,
            showWarning,
            showInfo
        }}>
        {children}
        </NotificationContext.Provider>
    );
};
