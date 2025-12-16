'use client';

import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ZenitSplashAnimation = () => {
    const [show, setShow] = useState(true);
    const [inView, setInView] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Start animation immediately on mount
        setInView(true);

        // Auto-dismiss after 3.5 seconds
        const timer = setTimeout(() => {
            setShow(false);
        }, 3500);

        return () => clearTimeout(timer);
    }, []);

    const textVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.42, 0, 0.58, 1],
            },
        },
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    key="splash-overlay"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    onClick={() => setShow(false)} // Fail-safe: Tap to dismiss immediately
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-background cursor-pointer"
                >
                    <div ref={ref} className="flex flex-col items-center justify-center w-full h-full min-h-[250px]">
                        <svg viewBox="0 0 100 100" className="w-[120px] h-[120px] overflow-visible">
                            {/* The Z Path that draws itself and serves as the motion path */}
                            <path
                                key={inView ? 'z-path-animate' : 'z-path-hidden'}
                                id="z-path"
                                className={cn('z-path-in-view', inView && 'animate')}
                                d="M 15 25 H 80 L 30 80 H 65"
                                stroke="hsl(var(--primary))"
                                strokeWidth="8"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Dot that travels along the Z path in reverse */}
                            <circle
                                r="6"
                                fill="hsl(var(--primary))"
                                visibility="hidden"
                            >
                                <animate
                                    key={inView ? 'dot-visibility-animate' : 'dot-visibility-hidden'}
                                    attributeName="visibility"
                                    from="hidden"
                                    to="visible"
                                    dur="0.01s"
                                    begin="2.2s"
                                    fill="freeze"
                                />
                                <animateMotion
                                    key={inView ? 'dot-animate' : 'dot-hidden'}
                                    dur="0.8s"
                                    begin="2.2s"
                                    fill="freeze"
                                    keyPoints="1;0.37"
                                    keyTimes="0;1"
                                    calcMode="linear"
                                >
                                    <mpath href="#z-path" />
                                </animateMotion>
                            </circle>
                        </svg>

                        <motion.div
                            key={inView ? 'text-animate' : 'text-hidden'}
                            initial="hidden"
                            animate={inView ? 'visible' : 'hidden'}
                            variants={{ visible: { transition: { staggerChildren: 0.2, delayChildren: 2.8 } } }}
                            className="text-center mt-4"
                        >
                            <motion.h1
                                variants={textVariants}
                                className="text-4xl font-headline font-bold text-foreground"
                            >
                                Zenit Tracker
                            </motion.h1>
                            <motion.p
                                variants={textVariants}
                                className="text-muted-foreground mt-2 text-lg"
                            >
                                Precision in Every Test.
                            </motion.p>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ZenitSplashAnimation;
