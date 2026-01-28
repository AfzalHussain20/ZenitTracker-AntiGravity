'use client';

import { useEffect, useRef } from 'react';

export const AnimatedBackground = () => {
    return (
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
            {/* Deep Space / Aurora Gradient Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary opacity-80" />

            {/* Animated Orbs/Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: '1s' }} />

            {/* Grid overlay for 'Tech' feel (optional, keeps it clean for now) */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />
        </div>
    );
};
