import React, { useState, useEffect } from 'react';

const SplashScreen = ({ children }) => {
    const [showSplash, setShowSplash] = useState(false);

    useEffect(() => {
        // Customer app splash screen is disabled
        const isDelivery = window.location.pathname.startsWith('/delivery');
        if (!isDelivery) {
            return;
        }

        // Only show once per session for delivery route on mobile view
        const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
        const isMobile = window.innerWidth <= 768;

        if (hasSeenSplash || !isMobile) {
            return;
        }

        setShowSplash(true);

        const timer = setTimeout(() => {
            setShowSplash(false);
            sessionStorage.setItem('hasSeenSplash', 'true');
        }, 4000); // 4 seconds

        return () => clearTimeout(timer);
    }, []);

    if (showSplash) {
        return (
            <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center overflow-hidden lg:hidden">
                <img 
                    src="/driverinit page .png" 
                    alt="App Init" 
                    className="w-full h-full object-cover"
                />
            </div>
        );
    }

    return children;
};

export default SplashScreen;
