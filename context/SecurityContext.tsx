import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../src/firebaseConfig';
import { ref, push, set, onValue, get, remove } from 'firebase/database';
import { useAuth } from './AuthContext';
import { SecurityLog, SecurityEventType, WhitelistedIP } from '../types';

interface SecurityContextType {
    logEvent: (type: SecurityEventType, details: string, metadata?: any) => Promise<void>;
    whitelistedIPs: WhitelistedIP[];
    addToWhitelist: (ip: string, label: string) => Promise<void>;
    removeFromWhitelist: (ip: string) => Promise<void>;
    checkAccess: () => Promise<boolean>;
    clientIP: string;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurity = () => {
    const context = useContext(SecurityContext);
    if (!context) throw new Error('useSecurity must be used within a SecurityProvider');
    return context;
};

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [clientIP, setClientIP] = useState<string>('');
    const [whitelistedIPs, setWhitelistedIPs] = useState<WhitelistedIP[]>([]);

    // Fetch Client IP
    useEffect(() => {
        const fetchIP = async () => {
            try {
                const res = await fetch('https://api.ipify.org?format=json');
                const data = await res.json();
                setClientIP(data.ip);
            } catch (error) {
                console.error("Failed to fetch IP", error);
            }
        };
        fetchIP();
    }, []);

    // Monitor Whitelist
    useEffect(() => {
        const whitelistRef = ref(db, 'whitelisted_ips');
        const unsubscribe = onValue(whitelistRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.values(data) as WhitelistedIP[];
                setWhitelistedIPs(list);
            } else {
                setWhitelistedIPs([]);
            }
        });
        return () => unsubscribe();
    }, []);

    const logEvent = async (type: SecurityEventType, details: string, metadata: any = {}) => {
        if (!clientIP) return; // Wait for IP? Or log 'unknown'?

        try {
            const logsRef = ref(db, 'security_logs');
            const newLogRef = push(logsRef);

            const logEntry: SecurityLog = {
                id: newLogRef.key as string,
                type,
                timestamp: new Date().toISOString(),
                ip: clientIP || 'unknown',
                userId: currentUser?.uid || 'anonymous',
                userEmail: currentUser?.email || undefined,
                details,
                metadata
            };

            await set(newLogRef, logEntry);
        } catch (error) {
            console.error("Failed to log security event", error);
        }
    };

    const addToWhitelist = async (ip: string, label: string) => {
        const ipKey = ip.replace(/[\.\#\$\/\[\]\:]/g, '_');
        await set(ref(db, `whitelisted_ips/${ipKey}`), {
            ip,
            label,
            addedBy: currentUser?.email || 'system',
            addedAt: new Date().toISOString()
        });
        await logEvent('ip_whitelist', `Added IP ${ip} to whitelist`);
    };

    const removeFromWhitelist = async (ip: string) => {
        const ipKey = ip.replace(/[\.\#\$\/\[\]\:]/g, '_');
        await remove(ref(db, `whitelisted_ips/${ipKey}`));
        await logEvent('ip_whitelist', `Removed IP ${ip} from whitelist`);
    };

    const checkAccess = async (): Promise<boolean> => {
        // Placeholder for strict mode logic if needed
        // Currently relying on existing 'banned_ips' logic in AuthContext
        // This could be expanded to enforce whitelist-only access
        return true;
    };

    return (
        <SecurityContext.Provider value={{
            logEvent,
            whitelistedIPs,
            addToWhitelist,
            removeFromWhitelist,
            checkAccess,
            clientIP
        }}>
            {children}
        </SecurityContext.Provider>
    );
};
