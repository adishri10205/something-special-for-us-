import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Root context
import { useSecurity } from '../context/SecurityContext'; // Root context
import { db } from '../src/firebaseConfig'; // This might need adjustment if firebaseConfig is in root src
import { ref, update, onDisconnect, set, serverTimestamp } from 'firebase/database';

const SecurityMonitor: React.FC = () => {
    const location = useLocation();
    const { currentUser } = useAuth();
    const { logEvent, clientIP } = useSecurity();
    const startTimeRef = useRef<number>(Date.now());
    const currentPathRef = useRef<string>(location.pathname);
    const anonIdRef = useRef<string>('');

    // Generate or retrieve Anonymous ID
    useEffect(() => {
        let storedId = localStorage.getItem('anon_security_id');
        if (!storedId) {
            storedId = 'anon_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('anon_security_id', storedId);
        }
        anonIdRef.current = storedId;
    }, []);

    const getUserId = () => currentUser ? currentUser.uid : anonIdRef.current;

    // Track Page Changes and Duration
    useEffect(() => {
        const handleRouteChange = async () => {
            const now = Date.now();
            const duration = now - startTimeRef.current;
            const previousPath = currentPathRef.current;
            const userId = getUserId();

            if (userId && duration > 1000) { // Only log if > 1s
                // Log Page View
                await logEvent('page_view', `Visited ${location.pathname}`, {
                    duration: 0, // start of view
                    previousPage: previousPath,
                    previousDuration: duration,
                    isAnonymous: !currentUser
                });
            }

            // Update References
            startTimeRef.current = now;
            currentPathRef.current = location.pathname;

            // Update Current Status in DB
            if (userId) {
                const presenceRef = ref(db, `user_activity/${userId}`);
                const activityData: any = {
                    isOnline: true,
                    status: 'online',
                    lastSeen: new Date().toISOString(),
                    lastPageEnter: now,
                    currentPath: location.pathname,
                    ip: clientIP
                };

                // Add anonymous metadata if applicable
                if (!currentUser) {
                    activityData.displayName = 'Anonymous Guest';
                    activityData.photoURL = 'https://ui-avatars.com/api/?name=Anonymous&background=random';
                    activityData.isAnonymous = true;
                }

                update(presenceRef, activityData);
            }
        };

        handleRouteChange();

        return () => {
            // Cleanup if needed
        };
    }, [location.pathname, currentUser, clientIP]);

    // Presence / Online Status System
    useEffect(() => {
        const userId = getUserId();
        if (!userId) return;

        const userStatusRef = ref(db, `user_activity/${userId}`);

        const updateData: any = {
            isOnline: true,
            status: 'online',
            lastSeen: new Date().toISOString(),
            lastPageEnter: Date.now(),
            ip: clientIP
        };

        if (!currentUser) {
            updateData.displayName = 'Anonymous Guest';
            updateData.isAnonymous = true;
        }

        // 1. Set values when connected
        update(userStatusRef, updateData);

        // 2. Set values when disconnected (using onDisconnect from Firebase)
        onDisconnect(userStatusRef).update({
            isOnline: false,
            status: 'offline',
            lastSeen: serverTimestamp()
        });

    }, [currentUser, clientIP]);

    return null; // Invisible Component
};

export default SecurityMonitor;
