"use client";

import { motion } from "framer-motion";

interface LogoProps {
    isSpinning?: boolean;
    isTransparent?: boolean;
    className?: string;
}

export function Logo({ isSpinning, isTransparent, className }: LogoProps) {
    return (
        <motion.svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            animate={isSpinning ? { rotate: 360 } : {}}
            transition={isSpinning ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
        >
            <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="10 5"
                className={isTransparent ? "text-primary/20" : "text-primary"}
            />
            <path
                d="M50 20V50L70 70"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                className="text-primary"
            />
            <motion.circle
                cx="50"
                cy="50"
                r="3"
                fill="currentColor"
                className="text-primary"
            />
        </motion.svg>
    );
}
