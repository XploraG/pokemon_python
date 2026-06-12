import React, { useEffect, useRef } from 'react';

interface AdsterraBannerProps {
    bannerKey?: string;
    width?: number;
    height?: number;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({
    bannerKey,
    width = 320,
    height = 50
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const activeKey = bannerKey || process.env.NEXT_PUBLIC_ADSTERRA_BANNER_KEY || "ef8451479fc47e5125adbeab41214bcf";

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear container first
        containerRef.current.innerHTML = '';

        // Inject Adsterra configurations
        const atOptionsScript = document.createElement('script');
        atOptionsScript.type = 'text/javascript';
        atOptionsScript.innerHTML = `
            atOptions = {
                'key' : '${activeKey}',
                'format' : 'iframe',
                'height' : ${height},
                'width' : ${width},
                'params' : {}
            };
        `;
        containerRef.current.appendChild(atOptionsScript);

        // Inject Adsterra invoke loader
        const invokeScript = document.createElement('script');
        invokeScript.type = 'text/javascript';
        invokeScript.src = `https://www.highperformanceformat.com/${activeKey}/invoke.js`;
        containerRef.current.appendChild(invokeScript);
    }, [activeKey, width, height]);

    return (
        <div 
            ref={containerRef} 
            style={{ 
                width: `${width}px`, 
                height: `${height}px`, 
                margin: '12px auto 4px auto', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }} 
        />
    );
};

export default AdsterraBanner;
