'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
    title: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export function PageShell({ title, description, children, actions, className }: PageShellProps) {
    return (
        <div className={cn("p-6 space-y-8 w-full max-w-7xl mx-auto", className)}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
                <div className="space-y-1">
                    <h1 className="text-4xl font-headline font-bold text-gradient inline-block tracking-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-muted-foreground text-lg max-w-2xl font-body">
                            {description}
                        </p>
                    )}
                </div>

                {actions && (
                    <div className="flex items-center gap-4">
                        {actions}
                    </div>
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                className="relative"
            >
                {children}
            </motion.div>
        </div>
    );
}
