/**
 * AdManager.ts
 * Helper unificado para monetización dinámica basada en la plataforma.
 * Usa Monetag en Telegram (rewarded interstitial) y Monetag/Adsterra en World App / web.
 */

export interface AdManagerConfig {
    monetagZoneId?: string;   // Monetag zone ID (expuesto como window.show_ZONE_ID)
    adsterraUrl?: string;     // Adsterra/Monetag Direct Link o URL de redirección
}

export interface AdResult {
    success: boolean;
    error?: string;
}

class AdManager {
    private static instance: AdManager;
    private config: AdManagerConfig = {
        monetagZoneId: '11150456',           // Zone ID de Monetag — reemplazar con el real
        adsterraUrl: 'https://www.profitablecpmrate.com/watch?key=ef8451479fc47e5125adbeab41214bcf',
    };

    private constructor() {}

    public static getInstance(): AdManager {
        if (!AdManager.instance) {
            AdManager.instance = new AdManager();
        }
        return AdManager.instance;
    }

    /**
     * Detecta si la app se ejecuta dentro de Telegram
     */
    private isTelegram(): boolean {
        return typeof window !== 'undefined' && !!(window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;
    }

    /**
     * Carga dinámicamente el SDK de Monetag para una zona específica.
     */
    private async loadMonetagSdk(zoneId: string): Promise<boolean> {
        if (typeof window === 'undefined') return false;
        if (typeof (window as any)[`show_${zoneId}`] === 'function') return true;

        return new Promise((resolve) => {
            console.log(`[AdManager] Loading Monetag SDK for zone ${zoneId}...`);
            const script = document.createElement('script');
            script.src = 'https://libtl.com/sdk.js';
            script.async = true;
            script.dataset.zone = zoneId;
            script.dataset.sdk = `show_${zoneId}`;

            script.onload = () => {
                const checkInterval = setInterval(() => {
                    if (typeof (window as any)[`show_${zoneId}`] === 'function') {
                        clearInterval(checkInterval);
                        console.log(`[AdManager] Monetag SDK for zone ${zoneId} loaded successfully.`);
                        resolve(true);
                    }
                }, 100);

                setTimeout(() => {
                    clearInterval(checkInterval);
                    if (typeof (window as any)[`show_${zoneId}`] === 'function') {
                        resolve(true);
                    } else {
                        console.warn(`[AdManager] Monetag SDK for zone ${zoneId} load timeout.`);
                        resolve(false);
                    }
                }, 5000);
            };

            script.onerror = (err) => {
                console.error(`[AdManager] Failed to load Monetag SDK for zone ${zoneId}:`, err);
                resolve(false);
            };

            document.body.appendChild(script);
        });
    }

    /**
     * Muestra un Rewarded Interstitial de Monetag en Telegram Mini App.
     * El SDK de Monetag expone window.show_ZONE_ID() al cargarse.
     */
    private async showMontetagTelegramAd(zoneId: string): Promise<AdResult> {
        const loaded = await this.loadMonetagSdk(zoneId);
        if (!loaded) {
            return { 
                success: false, 
                error: `Monetag SDK (show_${zoneId}) no se pudo cargar. Revisa tu conexión o desactiva tu AdBlock.` 
            };
        }

        return new Promise((resolve) => {
            const showFn = (window as any)[`show_${zoneId}`];
            if (typeof showFn !== 'function') {
                console.warn(`[AdManager] Monetag show_${zoneId} not available (SDK not loaded or AdBlock active).`);
                resolve({ success: false, error: `Monetag SDK (show_${zoneId}) no disponible` });
                return;
            }

            showFn()
                .then(() => {
                    resolve({ success: true });
                })
                .catch((err: any) => {
                    console.warn('[AdManager] Monetag ad failed or was closed early:', err);
                    resolve({
                        success: false,
                        error: err?.message || err?.description || JSON.stringify(err) || 'El anuncio fue cerrado o no se completó',
                    });
                });
        });
    }

    /**
     * Muestra un anuncio en World App / navegador convencional usando Monetag/Adsterra.
     * Para World App, intentamos forzar que se abra en el navegador externo del dispositivo
     * agregando el parámetro 'open_out_of_window=true' e iniciando un enlace <a> con
     * target="_blank" y rel="noopener noreferrer", lo cual tiene mejor soporte en Webviews
     * nativos para abrir el navegador del sistema en lugar de reemplazar la ventana de juego.
     */
    private async showWebAd(directLink: string): Promise<boolean> {
        if (typeof window === 'undefined') return false;
        let popupOpened = false;
        
        // Formatear el enlace para sugerir apertura fuera del Webview de World App
        let formattedLink = directLink;
        try {
            if (directLink.startsWith('http://') || directLink.startsWith('https://')) {
                const urlObj = new URL(directLink);
                urlObj.searchParams.set('open_out_of_window', 'true');
                formattedLink = urlObj.toString();
            }
        } catch (err) {
            console.warn('[AdManager] Error parsing directLink URL:', err);
        }

        try {
            // Crear un elemento de anclaje (a) dinámico y hacer clic programático
            // Esto es mucho más compatible con Webviews nativos móviles para abrir el navegador predeterminado
            const a = document.createElement('a');
            a.href = formattedLink;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            
            // Adjuntar temporalmente al documento para asegurar que el navegador registre la acción del clic
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            popupOpened = true;
        } catch (e) {
            console.error('[AdManager] Programmatic link click failed, using window.open fallback:', e);
            try {
                const win = window.open(formattedLink, '_blank');
                if (win) {
                    popupOpened = true;
                }
            } catch (winErr) {
                console.error('[AdManager] window.open fallback failed too:', winErr);
            }
        }

        if (!popupOpened) {
            console.log('[AdManager] Ad popup was blocked. Double reward is still granted to ensure smooth UX.');
        }

        // Breve espera para que el usuario tenga tiempo de ver el anuncio antes de recibir la recompensa
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return true;
    }

    /**
     * Método público para mostrar un Anuncio Recompensado (Rewarded Ad).
     * Telegram  → Monetag Rewarded Interstitial (show_ZONE_ID())
     * Web/World → Monetag/Adsterra Direct Link popup
     */
    public async showRewardedAd(customConfig?: AdManagerConfig): Promise<AdResult> {
        const activeConfig = { ...this.config, ...customConfig };

        if (this.isTelegram()) {
            let zoneId = activeConfig.monetagZoneId || '11150456';
            
            // Map old/invalid Adsgram block IDs or short IDs to the real, working Monetag zone ID
            if (zoneId === '34910' || zoneId === '34911' || zoneId === '34912' || zoneId === '34913' || zoneId.length < 7) {
                console.log(`[AdManager] Mapping invalid/old zone ID ${zoneId} to default Monetag zone 11150456`);
                zoneId = '11150456';
            }
            
            return await this.showMontetagTelegramAd(zoneId);
        } else {
            let directLink = activeConfig.adsterraUrl || this.config.adsterraUrl!;
            // Si el valor no está configurado, usar la URL fallback interna
            if (directLink === "YOUR_ADSTERRA_DIRECT_LINK") {
                directLink = this.config.adsterraUrl!;
            }
            const ok = await this.showWebAd(directLink);
            return ok
                ? { success: true }
                : { success: false, error: 'Error al mostrar el anuncio en web' };
        }
    }
}

export default AdManager;
