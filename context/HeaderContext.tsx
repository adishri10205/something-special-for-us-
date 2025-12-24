import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define context shape
interface HeaderContextType {
    title: string;
    setTitle: (title: string) => void;
    subtitle: string;
    setSubtitle: (subtitle: string) => void;
    action: ReactNode | null;
    setAction: (action: ReactNode | null) => void;
    isMusicMode: boolean;
    setIsMusicMode: (isMusicMode: boolean) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [title, setTitle] = useState('EaseBook');
    const [subtitle, setSubtitle] = useState('');
    const [action, setAction] = useState<ReactNode | null>(null);
    const [isMusicMode, setIsMusicMode] = useState(false);

    return (
        <HeaderContext.Provider value={{ title, setTitle, subtitle, setSubtitle, action, setAction, isMusicMode, setIsMusicMode }}>
            {children}
        </HeaderContext.Provider>
    );
};

export const useHeader = () => {
    const context = useContext(HeaderContext);
    if (context === undefined) {
        throw new Error('useHeader must be used within a HeaderProvider');
    }
    return context;
};
