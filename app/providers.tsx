'use client';
import { ReactNode, Suspense } from 'react';
import { ThemeProvider } from './store/ThemeContext';

export default function Providers(props: Readonly<{children: ReactNode}>) {
    return (<ThemeProvider>
        <Suspense fallback={null}>{props.children}</Suspense>
    </ThemeProvider>)
}
