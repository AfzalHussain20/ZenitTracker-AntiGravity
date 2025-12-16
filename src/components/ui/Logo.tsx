import React from 'react';

export const Logo = ({ className }: { className?: string }) => (
    <svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3ea8ff" />
                <stop offset="100%" stopColor="#266bff" />
            </linearGradient>
        </defs>
        <path
            d="M 15 25 H 80 L 30 80 H 65"
            stroke="url(#logoGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="75" cy="28" r="6" fill="#24b0ff" />
    </svg>
);

export const LogoIcon = ({ className }: { className?: string }) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <defs>
            <linearGradient id="logoGradientSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3ea8ff" />
                <stop offset="100%" stopColor="#266bff" />
            </linearGradient>
        </defs>
        <path
            d="M 15 25 H 80 L 30 80 H 65"
            stroke="url(#logoGradientSmall)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="75" cy="28" r="6" fill="#24b0ff" />
    </svg>
)
