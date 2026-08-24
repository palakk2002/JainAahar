import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import LottieTransitionOverlay from '../components/shared/LottieTransitionOverlay';

export const globalLoadingManager = {
    start: null,
    stop: null
};

const PageTransitionContext = createContext(null);

export const usePageTransition = () => useContext(PageTransitionContext);

export const PageTransitionProvider = ({ children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isNetworkLoading, setIsNetworkLoading] = useState(false);
    const location = useLocation();
    const isFirstMount = useRef(true);
    const safetyTimerRef = useRef(null);

    // Trigger transition on route change
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            setIsVisible(true);
            // First mount: auto-hide after 400ms
            safetyTimerRef.current = setTimeout(() => {
                setIsVisible(false);
            }, 400);
            return;
        }

        setIsVisible(true);
        // Safety: always auto-hide page transitions after 400ms max
        if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = setTimeout(() => {
            setIsVisible(false);
        }, 400);

        return () => {
            if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
        };
    }, [location.pathname]);

    const handleAnimationComplete = useCallback(() => {
        // Only hide if it's a page transition (not a network loading state)
        if (!isNetworkLoading) {
            setIsVisible(false);
            if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
        }
    }, [isNetworkLoading]);

    useEffect(() => {
        const handleStart = () => {
            if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
            setIsNetworkLoading(true);
            setIsVisible(true);
        };
        const handleStop = () => {
            setIsNetworkLoading(false);
            setIsVisible(false);
        };

        globalLoadingManager.start = handleStart;
        globalLoadingManager.stop = handleStop;

        return () => {
            globalLoadingManager.start = null;
            globalLoadingManager.stop = null;
        };
    }, []);

    const startLoading = () => {
        if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
        setIsNetworkLoading(true);
        setIsVisible(true);
    };

    const stopLoading = () => {
        setIsNetworkLoading(false);
        setIsVisible(false);
    };

    return (
        <PageTransitionContext.Provider value={{ startLoading, stopLoading }}>
            {children}
            <LottieTransitionOverlay 
                isVisible={isVisible} 
                isNetworkLoading={isNetworkLoading} 
                onComplete={handleAnimationComplete}
            />
        </PageTransitionContext.Provider>
    );
};
