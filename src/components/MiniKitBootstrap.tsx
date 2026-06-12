"use client";

import { useEffect, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

export default function MiniKitBootstrap({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            try {
                // Pass correct App ID during installation
                MiniKit.install('app_6a783c64810d430744512e4207e07fce');
                console.log("MiniKit installed successfully!");
            } catch (err) {
                console.error("Failed to initialize MiniKit:", err);
            }
        }
    }, []);

    if (!mounted) {
        return null;
    }

    return <>{children}</>;
}
