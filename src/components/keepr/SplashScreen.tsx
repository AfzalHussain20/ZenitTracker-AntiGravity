"use client";

import { motion, AnimatePresence } from "framer-motion";
import { KeeprLogo } from "./Logo";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
    return (
        <motion.div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            onAnimationComplete={(definition) => {
                // This is a bit tricky with exit animations. 
                // We'll use a timeout instead for the sequence.
            }}
        >
            <div className="relative flex flex-col items-center gap-6">
                <KeeprLogo className="w-20 h-20 text-primary" />
                <motion.h1
                    className="text-5xl font-bold font-instrument tracking-tight text-foreground"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.8 }}
                >
                    Keepr
                </motion.h1>
            </div>

            {/* Auto-complete sequence */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 3 }}
                onAnimationComplete={() => onComplete()}
            />
        </motion.div>
    );
}
