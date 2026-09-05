import React, { createContext, useContext, useState, useEffect } from 'react';

export const globalLoadingManager = {
    start: null,
    stop: null
};

const PageTransitionContext = createContext(null);

export const usePageTransition = () => useContext(PageTransitionContext);

export const PageTransitionProvider = ({ children }) => {
    const [isNetworkLoading, setIsNetworkLoading] = useState(false);

    const startLoading = () => {
        setIsNetworkLoading(true);
    };

    const stopLoading = () => {
        setIsNetworkLoading(false);
    };

    useEffect(() => {
        globalLoadingManager.start = () => setIsNetworkLoading(true);
        globalLoadingManager.stop = () => setIsNetworkLoading(false);

        return () => {
            globalLoadingManager.start = null;
            globalLoadingManager.stop = null;
        };
    }, []);

    return (
        <PageTransitionContext.Provider value={{ startLoading, stopLoading }}>
            {children}
        </PageTransitionContext.Provider>
    );
};
