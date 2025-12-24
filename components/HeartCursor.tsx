import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Heart {
    id: number;
    x: number;
    y: number;
    size: number;
    rotation: number;
    color: string;
}

const COLORS = ['#FF4D6D', '#FF8FA3', '#FFB3C1', '#FFF0F3', '#C9184A'];

const HeartCursor: React.FC = () => {
    const [hearts, setHearts] = useState<Heart[]>([]);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const lastTime = useRef(Date.now());
    const requestRef = useRef<number>();
    const idCounter = useRef(0);

    // Check and spawn hearts based on distance moved (emulating "speed")
    const handleMouseMove = (e: MouseEvent) => {
        const currentTime = Date.now();
        const { clientX, clientY } = e;

        const dx = clientX - lastMousePos.current.x;
        const dy = clientY - lastMousePos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If moved significantly or enough time passed
        // High distance = fast move = frequent spawning naturally happens if we threshold low
        // But we want "more" hearts if fast.

        // Threshold: Spawn a heart every ~5px of movement (Higher density)
        if (distance > 5) {
            addHeart(clientX, clientY);
            lastMousePos.current = { x: clientX, y: clientY };
            lastTime.current = currentTime;
        }
    };

    const addHeart = (x: number, y: number) => {
        const id = idCounter.current++;
        const newHeart: Heart = {
            id,
            x,
            y,
            size: Math.random() * 20 + 15, // 15-35px
            rotation: Math.random() * 60 - 30, // -30 to 30 deg
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };

        setHearts(prev => [...prev.slice(-80), newHeart]); // Keep max 80 hearts

        // Auto remove after animation time (handled by Framer Motion exit, but state cleanup needed)
        setTimeout(() => {
            setHearts(prev => prev.filter(h => h.id !== id));
        }, 1000);
    };

    // Idle "Slow" Heartbeat
    useEffect(() => {
        const idleInterval = setInterval(() => {
            // Use last known position for idle hearts
            // addHeart(lastMousePos.current.x, lastMousePos.current.y);
            // Actually, user said "if not move or slow the popu slow"
            // So we add a heart occasionally at current mouse pos
            addHeart(lastMousePos.current.x + (Math.random() * 20 - 10), lastMousePos.current.y + (Math.random() * 20 - 10));
        }, 800); // Every 800ms when idle/slow

        return () => clearInterval(idleInterval);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            <AnimatePresence>
                {hearts.map(heart => (
                    <motion.div
                        key={heart.id}
                        initial={{ opacity: 1, scale: 0, x: heart.x, y: heart.y }}
                        animate={{
                            opacity: 0,
                            scale: 1,
                            y: heart.y - 100, // Float up
                            x: heart.x + (Math.random() * 40 - 20) // Slight drift
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{
                            position: 'absolute',
                            width: heart.size,
                            height: heart.size,
                            rotate: heart.rotation,
                            color: heart.color
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-sm">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default HeartCursor;
