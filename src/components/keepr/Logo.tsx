'use client';
import { motion } from 'framer-motion';

interface KeeprLogoProps {
    className?: string;
}

export function KeeprLogo({ className }: KeeprLogoProps) {
    const shieldVariants = {
        hidden: { pathLength: 0, fill: 'rgba(0, 0, 0, 0)' },
        visible: {
            pathLength: 1,
            fill: 'hsl(var(--primary))',
            transition: {
                default: { duration: 1, ease: 'easeInOut' },
                fill: { duration: 1, ease: [1, 0, 0.8, 1] },
            },
        },
    };

    const checkVariants = {
        hidden: { pathLength: 0 },
        visible: {
            pathLength: 1,
            transition: {
                delay: 0.5,
                duration: 0.8,
            },
        },
    };

    return (
        <motion.svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            initial="hidden"
            animate="visible"
            className={className}
        >
            <motion.path
                d="M12 2L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 2Z"
                variants={shieldVariants}
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
            />
            <motion.path
                d="M12 12H19C18.47 16.11 15.73 19.78 12 20.93V12H5V6.3L12 3.2V12Z"
                variants={checkVariants}
                stroke="hsl(var(--primary-foreground))"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="transparent"
            />
        </motion.svg>
    );
}

