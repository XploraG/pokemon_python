import React, { useEffect, useRef, useState } from 'react';

const AD_ON_DURATION_MS  = 45_000; // 45 segundos con anuncio activo
const AD_OFF_DURATION_MS =  5_000; //  5 segundos de pausa

// Adsterra banner key — usado en AMBAS plataformas (Telegram + World App)
const ADSTERRA_BANNER_KEY = process.env.NEXT_PUBLIC_ADSTERRA_BANNER_KEY || 'ef8451479fc47e5125adbeab41214bcf';

/**
 * Inyecta el banner iframe de Adsterra dentro del contenedor dado.
 * Se limpia y se re-inyecta en cada ciclo ON.
 */
function injectAdsterraBanner(container: HTMLDivElement, width: number, height: number): void {
    container.innerHTML = '';

    const atOptionsScript = document.createElement('script');
    atOptionsScript.type = 'text/javascript';
    atOptionsScript.innerHTML = `
        atOptions = {
            'key' : '${ADSTERRA_BANNER_KEY}',
            'format' : 'iframe',
            'height' : ${height},
            'width' : ${width},
            'params' : {}
        };
    `;
    container.appendChild(atOptionsScript);

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = `https://www.highperformanceformat.com/${ADSTERRA_BANNER_KEY}/invoke.js`;
    container.appendChild(invokeScript);
}

interface MontetagBattleBannerProps {
    /** true mientras el combate está activo. false detiene y limpia el ciclo. */
    active: boolean;
    width?: number;
    height?: number;
}

/**
 * Banner de Adsterra rotativo para combates (Wild, NPC, Gym y PvP).
 * Ciclo: 45 s ON → 5 s vacío → 45 s ON → ... hasta que active=false.
 *
 * Funciona igual en Telegram Mini App y World App:
 * siempre muestra el banner iframe de Adsterra de 320×50.
 *
 * (Los videos de recompensa de Monetag solo se usan en AdManager
 *  para cofres, curación y duplicar recompensas — no en combate.)
 */
export const MontetagBattleBanner: React.FC<MontetagBattleBannerProps> = ({
    active,
    width  = 320,
    height = 50,
}) => {
    const containerRef  = useRef<HTMLDivElement>(null);
    const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [adVisible, setAdVisible]   = useState(false);

    const clearCycle = () => {
        if (cycleTimerRef.current) {
            clearTimeout(cycleTimerRef.current);
            cycleTimerRef.current = null;
        }
    };

    const runCycle = () => {
        setAdVisible(true);
        if (containerRef.current) {
            injectAdsterraBanner(containerRef.current, width, height);
        }

        // Después de 45 s: apagar 5 s y luego repetir
        cycleTimerRef.current = setTimeout(() => {
            setAdVisible(false);
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }

            cycleTimerRef.current = setTimeout(() => {
                runCycle();
            }, AD_OFF_DURATION_MS);
        }, AD_ON_DURATION_MS);
    };

    useEffect(() => {
        if (active) {
            runCycle();
        } else {
            clearCycle();
            setAdVisible(false);
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        }

        return clearCycle;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    return (
        <div
            className="battle-ad-container"
            style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: adVisible ? `${height}px` : '0px',
                overflow: 'hidden',
                transition: 'min-height 0.3s ease',
                marginTop: adVisible ? '6px' : '0px',
            }}
        >
            <div
                ref={containerRef}
                style={{
                    width: `${width}px`,
                    height: adVisible ? `${height}px` : '0px',
                    overflow: 'hidden',
                    transition: 'height 0.3s ease',
                }}
            />
        </div>
    );
};

export default MontetagBattleBanner;
