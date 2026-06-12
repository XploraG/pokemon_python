import React, { useEffect, useRef } from 'react';

export const PokemonCenterBanner: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear container
        containerRef.current.innerHTML = '';

        // Create the specific container div with the required ID
        const adContainer = document.createElement('div');
        adContainer.id = 'container-e1339b6f72fdf22772ea4046fe6b0eba';
        adContainer.style.width = '320px';
        adContainer.style.height = '50px';
        containerRef.current.appendChild(adContainer);

        // Create script loader for the invoke file
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.src = 'https://pl29719999.effectivecpmnetwork.com/e1339b6f72fdf22772ea4046fe6b0eba/invoke.js';
        containerRef.current.appendChild(script);
    }, []);

    return (
        <div 
            ref={containerRef} 
            style={{ 
                width: '320px', 
                height: '50px', 
                margin: '12px auto 4px auto', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }} 
        />
    );
};

export default PokemonCenterBanner;
