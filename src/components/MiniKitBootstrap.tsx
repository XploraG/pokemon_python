"use client";

import { useEffect } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

export default function MiniKitBootstrap({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                MiniKit.install();
                console.log("MiniKit installed successfully!");
            } catch (err) {
                console.error("Failed to initialize MiniKit:", err);
            }
        }
    }, []);

    return <>{children}</>;
}
