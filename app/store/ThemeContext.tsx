"use client";
import React, { createContext, useState, useEffect, ReactNode } from 'react';

export const ThemeContext = createContext< { theme: string; toggleTheme: () => void; }|null>(null);

export const ThemeProvider = ({ children }: {
    children: ReactNode
}) => {
    const [theme, setTheme] = useState('');

    // Step 2: Toggle theme and save to localStorage
    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        window.localStorage?.setItem('theme', newTheme);
    };

    // Step 3: Effect to update the documentElement based on theme
    useEffect(() => {
        const root = document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        const savedTheme = window.localStorage?.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme ?? (prefersDark ? 'dark' : 'light');
        setTheme(initialTheme)

        // If the initial theme is not light, apply it to the documentElement immediately
        if (initialTheme && initialTheme !== 'light') {
            document.documentElement.classList.add(initialTheme);
        }
    }, []);
    if (!theme) {
        return null
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => React.useContext(ThemeContext);
