"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";

const splashVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.5 } },
};

const logoVariants = {
    enter: {
        scale: 1,
        rotate: 0,
        opacity: 1,
        transition: { type: "spring", duration: 1 },
    },
    spin: {
        rotate: 1080, // spins multiple times fast
        transition: { duration: 1, ease: "easeInOut" },
    },
    exit: {
        x: "150vw",
        rotate: 720,
        transition: { duration: 0.7, ease: "easeIn" },
    },
};

const textVariants = {
    initial: { x: "-150vw", opacity: 0 },
    animate: {
        x: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 80, duration: 1 },
    },
    exit: { opacity: 0, transition: { duration: 0.5 } },
};

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
    const [stage, setStage] = useState("enter");

    useEffect(() => {
        const runSequence = async () => {
            await new Promise((res) => setTimeout(res, 1000));
            setStage("spin");
            await new Promise((res) => setTimeout(res, 1000));
            setStage("exit");
            await new Promise((res) => setTimeout(res, 800));
            setStage("text");
            await new Promise((res) => setTimeout(res, 1200));
            onComplete();
        };
        runSequence();
    }, [onComplete]);

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
                variants={splashVariants}
                initial="initial"
                animate="animate"
                exit="exit"
            >
                <AnimatePresence>
                    {stage !== "text" && (
                        <motion.div
                            key="logo"
                            className="absolute"
                            variants={logoVariants}
                            initial="enter"
                            animate={stage}
                            exit="exit"
                        >
                            <div className={"h-24 w-24"}>
                                <Logo isSpinning={stage === 'spin'} isTransparent={false} />
                            </div>
                        </motion.div>
                    )}

                    {stage === "text" && (
                        <motion.h1
                            key="text"
                            className="text-6xl font-bold font-syne tracking-wider text-primary"
                            variants={textVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            Wrklog
                        </motion.h1>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
}
