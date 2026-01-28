'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
    onComplete: () => void;
    appName: string;
    tagline: string;
    accentColor: string;
    icon: React.ReactNode;
}

export function PremiumSplashScreen({ onComplete, appName, tagline, accentColor, icon }: SplashScreenProps) {
    const [phase, setPhase] = useState<'logo' | 'ripple' | 'text' | 'exit'>('logo');
    const [shouldShow, setShouldShow] = useState(true);

    useEffect(() => {
        // Check if splash was already shown this session
        const storageKey = `zenit_splash_${appName.toLowerCase()}`;
        const alreadyShown = sessionStorage.getItem(storageKey);

        if (alreadyShown) {
            setShouldShow(false);
            onComplete();
            return;
        }

        // Mark as shown
        sessionStorage.setItem(storageKey, 'true');
    }, [appName, onComplete]);

    const runSequence = useCallback(async () => {
        if (!shouldShow) return;

        await new Promise(r => setTimeout(r, 800));
        setPhase('ripple');
        await new Promise(r => setTimeout(r, 600));
        setPhase('text');
        await new Promise(r => setTimeout(r, 1200));
        setPhase('exit');
        await new Promise(r => setTimeout(r, 600));
        onComplete();
    }, [onComplete, shouldShow]);

    useEffect(() => {
        if (shouldShow) {
            runSequence();
        }
    }, [runSequence, shouldShow]);

    if (!shouldShow) return null;

    return (
        <AnimatePresence>
            {phase !== 'exit' && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}05 50%, ${accentColor}20 100%)` }}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
                >
                    {/* Animated Background Orbs */}
                    <motion.div
                        className="absolute w-[600px] h-[600px] rounded-full blur-[120px]"
                        style={{ backgroundColor: `${accentColor}30` }}
                        animate={{
                            scale: [1, 1.2, 1],
                            x: [0, 50, 0],
                            y: [0, -30, 0],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div
                        className="absolute w-[400px] h-[400px] rounded-full blur-[100px] -bottom-20 -right-20"
                        style={{ backgroundColor: `${accentColor}20` }}
                        animate={{
                            scale: [1, 1.3, 1],
                            x: [0, -30, 0],
                            y: [0, 20, 0],
                        }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    />

                    {/* Ripple Effect */}
                    <AnimatePresence>
                        {(phase === 'ripple' || phase === 'text') && (
                            <>
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute rounded-full border-2"
                                        style={{ borderColor: `${accentColor}40` }}
                                        initial={{ width: 100, height: 100, opacity: 0.8 }}
                                        animate={{
                                            width: [100, 600],
                                            height: [100, 600],
                                            opacity: [0.6, 0],
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            delay: i * 0.3,
                                            ease: 'easeOut',
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </AnimatePresence>

                    {/* Content Container */}
                    <div className="relative z-10 flex flex-col items-center">
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{
                                scale: phase === 'logo' ? 1 : 0.8,
                                rotate: 0,
                                y: phase === 'text' ? -20 : 0,
                            }}
                            transition={{
                                type: 'spring',
                                stiffness: 200,
                                damping: 15,
                            }}
                            className="mb-6"
                        >
                            <motion.div
                                className="p-6 rounded-3xl shadow-2xl"
                                style={{
                                    backgroundColor: 'white',
                                    boxShadow: `0 25px 80px ${accentColor}40`,
                                }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="w-16 h-16 flex items-center justify-center" style={{ color: accentColor }}>
                                    {icon}
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* App Name */}
                        <AnimatePresence>
                            {phase === 'text' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    className="text-center"
                                >
                                    <motion.h1
                                        className="text-5xl md:text-6xl font-bold tracking-tight mb-3"
                                        style={{ color: accentColor }}
                                    >
                                        {appName}
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-slate-500 text-lg font-medium tracking-wide"
                                    >
                                        {tagline}
                                    </motion.p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Loading Indicator */}
                        <motion.div
                            className="absolute -bottom-20 flex gap-1.5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            {[...Array(3)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: accentColor }}
                                    animate={{
                                        y: [0, -8, 0],
                                        opacity: [0.3, 1, 0.3],
                                    }}
                                    transition={{
                                        duration: 0.8,
                                        repeat: Infinity,
                                        delay: i * 0.15,
                                    }}
                                />
                            ))}
                        </motion.div>
                    </div>

                    {/* Bottom Branding */}
                    <motion.div
                        className="absolute bottom-8 flex items-center gap-2 text-slate-400"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                    >
                        <span className="text-xs tracking-widest uppercase font-medium">Powered by</span>
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Zenit</span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
