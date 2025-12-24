import React, { createContext, useContext, useEffect, useState } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../src/firebaseConfig';
import { EmotionProfile, EmotionMeters } from '../types';

interface EmotionContextType {
    emotionProfile: EmotionProfile | null;
    loading: boolean;
    hasAccess: boolean;
    updateMood: (value: number) => Promise<void>;
    updateTrust: (value: number) => Promise<void>;
    updateLove: (value: number) => Promise<void>;
    addComplaint: () => Promise<void>;
    resolveComplaint: () => Promise<void>;
    addPositiveAction: (value: number) => Promise<void>;
    setAccessThreshold: (threshold: number) => Promise<void>;
    setLockMessage: (message: string) => Promise<void>;
}

const EmotionContext = createContext<EmotionContextType | undefined>(undefined);

export const useEmotion = () => {
    const context = useContext(EmotionContext);
    if (!context) throw new Error('useEmotion must be used within an EmotionProvider');
    return context;
};

const DEFAULT_EMOTION_PROFILE: EmotionProfile = {
    mainProgress: 75, // Start with good relationship health
    meters: {
        mood: 50, // Neutral/Happy
        trust: 80, // High trust
        love: 90, // Strong love
        complaints: 10, // Few complaints
    },
    accessThreshold: 50, // Need 50% for full access
    lastUpdated: new Date().toISOString(),
};

// Calculate main progress based on meters
const calculateMainProgress = (meters: EmotionMeters): number => {
    // Mood: -100 to 100, normalize to 0-100
    const moodScore = ((meters.mood + 100) / 200) * 100;

    // Trust: 0 to 100 (already normalized)
    const trustScore = meters.trust;

    // Love: 0 to 100 (already normalized)
    const loveScore = meters.love;

    // Complaints: 0 to 100, but inverse (more complaints = lower score)
    const complaintsScore = 100 - meters.complaints;

    // Weighted average
    const mainProgress = (
        moodScore * 0.25 +      // 25% weight
        trustScore * 0.30 +     // 30% weight
        loveScore * 0.35 +      // 35% weight
        complaintsScore * 0.10  // 10% weight
    );

    return Math.max(0, Math.min(100, Math.round(mainProgress)));
};

export const EmotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [emotionProfile, setEmotionProfile] = useState<EmotionProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Real-time listener for emotion profile
    useEffect(() => {
        const emotionRef = ref(db, 'emotionProfile');

        const unsubscribe = onValue(emotionRef, async (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val() as EmotionProfile;
                // Recalculate main progress based on meters
                data.mainProgress = calculateMainProgress(data.meters);
                setEmotionProfile(data);
            } else {
                // Initialize with default profile
                await update(emotionRef, DEFAULT_EMOTION_PROFILE);
                setEmotionProfile(DEFAULT_EMOTION_PROFILE);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const hasAccess = emotionProfile
        ? emotionProfile.mainProgress >= emotionProfile.accessThreshold
        : true; // Default to true while loading

    const updateMood = async (value: number) => {
        if (!emotionProfile) return;

        const newMood = Math.max(-100, Math.min(100, value));
        const newMeters = { ...emotionProfile.meters, mood: newMood };
        const newMainProgress = calculateMainProgress(newMeters);

        await update(ref(db, 'emotionProfile'), {
            'meters/mood': newMood,
            mainProgress: newMainProgress,
            lastUpdated: new Date().toISOString(),
        });
    };

    const updateTrust = async (value: number) => {
        if (!emotionProfile) return;

        const newTrust = Math.max(0, Math.min(100, value));
        const newMeters = { ...emotionProfile.meters, trust: newTrust };
        const newMainProgress = calculateMainProgress(newMeters);

        await update(ref(db, 'emotionProfile'), {
            'meters/trust': newTrust,
            mainProgress: newMainProgress,
            lastUpdated: new Date().toISOString(),
        });
    };

    const updateLove = async (value: number) => {
        if (!emotionProfile) return;

        const newLove = Math.max(0, Math.min(100, value));
        const newMeters = { ...emotionProfile.meters, love: newLove };
        const newMainProgress = calculateMainProgress(newMeters);

        await update(ref(db, 'emotionProfile'), {
            'meters/love': newLove,
            mainProgress: newMainProgress,
            lastUpdated: new Date().toISOString(),
        });
    };

    const addComplaint = async () => {
        if (!emotionProfile) return;

        const newComplaints = Math.min(100, emotionProfile.meters.complaints + 10);
        const newMeters = { ...emotionProfile.meters, complaints: newComplaints };
        const newMainProgress = calculateMainProgress(newMeters);

        await update(ref(db, 'emotionProfile'), {
            'meters/complaints': newComplaints,
            mainProgress: newMainProgress,
            lastUpdated: new Date().toISOString(),
        });
    };

    const resolveComplaint = async () => {
        if (!emotionProfile) return;

        const newComplaints = Math.max(0, emotionProfile.meters.complaints - 15);
        const newMeters = { ...emotionProfile.meters, complaints: newComplaints };
        const newMainProgress = calculateMainProgress(newMeters);

        await update(ref(db, 'emotionProfile'), {
            'meters/complaints': newComplaints,
            mainProgress: newMainProgress,
            lastUpdated: new Date().toISOString(),
        });
    };

    const addPositiveAction = async (value: number) => {
        if (!emotionProfile) return;

        // Positive actions boost mood and trust slightly
        const newMood = Math.min(100, emotionProfile.meters.mood + value * 0.5);
        const newTrust = Math.min(100, emotionProfile.meters.trust + value * 0.3);
        const newMeters = { ...emotionProfile.meters, mood: newMood, trust: newTrust };
        const newMainProgress = calculateMainProgress(newMeters);

        await update(ref(db, 'emotionProfile'), {
            'meters/mood': newMood,
            'meters/trust': newTrust,
            mainProgress: newMainProgress,
            lastUpdated: new Date().toISOString(),
        });
    };

    const setAccessThreshold = async (threshold: number) => {
        const newThreshold = Math.max(0, Math.min(100, threshold));
        await update(ref(db, 'emotionProfile'), {
            accessThreshold: newThreshold,
            lastUpdated: new Date().toISOString(),
        });
    };

    const setLockMessage = async (message: string) => {
        await update(ref(db, 'emotionProfile'), {
            lockMessage: message,
            lastUpdated: new Date().toISOString(),
        });
    };

    return (
        <EmotionContext.Provider value={{
            emotionProfile,
            loading,
            hasAccess,
            updateMood,
            updateTrust,
            updateLove,
            addComplaint,
            resolveComplaint,
            addPositiveAction,
            setAccessThreshold,
            setLockMessage,
        }}>
            {children}
        </EmotionContext.Provider>
    );
};
