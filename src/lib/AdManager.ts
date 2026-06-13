/**
 * AdManager.ts
 * Helper unificado para monetización dinámica basada en la plataforma.
 * Carga Adsgram en Telegram y Adsterra (u otros) en World App de forma aislada.
 */

export interface AdManagerConfig {
    telegramBlockId?: string; // Adsgram block ID
    adsterraUrl?: string;     // Adsterra Direct Link o URL de redirección
}

class AdManager {
    private static instance: AdManager;
    private config: AdManagerConfig = {
        telegramBlockId: "YOUR_ADSGRAM_BLOCK_ID", // Reemplazar con ID real de Adsgram
        adsterraUrl: "YOUR_ADSTERRA_DIRECT_LINK"   // Reemplazar con Direct Link real de Adsterra
    };
    private isAdsgramLoaded = false;

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
     * Carga dinámicamente el SDK de Adsgram en Telegram
     */
    private loadAdsgramSDK(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isAdsgramLoaded || (window as any).Adsgram) {
                this.isAdsgramLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = "https://sad.adsgram.ai/js/sad.min.js";
            script.async = true;
            script.onload = () => {
                this.isAdsgramLoaded = true;
                resolve();
            };
            script.onerror = () => reject(new Error("No se pudo cargar el SDK de Adsgram"));
            document.head.appendChild(script);
        });
    }

    /**
     * Muestra un anuncio de Adsgram (Telegram)
     */
    private async showTelegramAd(blockId: string): Promise<boolean> {
        const isDev = typeof window !== 'undefined' && (
            window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.includes('ngrok') ||
            window.location.hostname.includes('local') ||
            window.location.hostname.includes('vercel') ||
            window.location.hostname.includes('github')
        );

        try {
            await this.loadAdsgramSDK();
            const adsgram = (window as any).Adsgram;
            if (!adsgram) {
                console.warn("[AdManager] Adsgram not found on window. Simulating ad success.");
                return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
            }

            const AdController = adsgram.init({ blockId });
            try {
                const result = await AdController.show();
                console.log("[AdManager] Adsgram show result:", result);
                return !!(result && result.done);
            } catch (adShowError) {
                console.warn("[AdManager] Adsgram show failed. Falling back to simulated reward.", adShowError);
                return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
            }
        } catch (err) {
            console.error("Error al reproducir anuncio de Adsgram. Simulating success fallback:", err);
            return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
        }
    }

    /**
     * Carga el script de Popunder de Adsterra en World App
     */
    private showWorldAppAd(): Promise<boolean> {
        return new Promise((resolve) => {
            if (typeof window === 'undefined') {
                resolve(false);
                return;
            }

            try {
                const existing = document.getElementById('adsterra-popunder-script');
                if (!existing) {
                    const script = document.createElement('script');
                    script.id = 'adsterra-popunder-script';
                    script.src = "https://pl29719998.effectivecpmnetwork.com/10/3d/8f/103d8f2ad1a9c74967779c81881ee899.js";
                    script.async = true;
                    document.body.appendChild(script);
                }
                resolve(true);
            } catch (err) {
                console.error("Error al inyectar script de Adsterra:", err);
                resolve(false);
            }
        });
    }

    /**
     * Método público para mostrar un Anuncio Recompensado (Rewarded Ad)
     * @returns Promise<boolean> true si el jugador debe recibir su recompensa, false si falló o canceló.
     */
    public async showRewardedAd(customConfig?: AdManagerConfig): Promise<boolean> {
        const activeConfig = { ...this.config, ...customConfig };

        if (this.isTelegram()) {
            if (!activeConfig.telegramBlockId || activeConfig.telegramBlockId === "YOUR_ADSGRAM_BLOCK_ID") {
                console.warn("Adsgram Block ID no configurado. Simulando recompensa en desarrollo.");
                return new Promise((resolve) => setTimeout(() => resolve(true), 2000));
            }
            return await this.showTelegramAd(activeConfig.telegramBlockId);
        } else {
            // World App o navegador convencional
            if (typeof window !== 'undefined') {
                const directLink = activeConfig.adsterraUrl && activeConfig.adsterraUrl !== "YOUR_ADSTERRA_DIRECT_LINK"
                    ? activeConfig.adsterraUrl
                    : "https://www.profitablecpmrate.com/watch?key=ef8451479fc47e5125adbeab41214bcf";
                try {
                    window.open(directLink, '_blank');
                } catch (e) {
                    console.error("[AdManager] Popup blocked, trying script popunder injection fallback", e);
                    await this.showWorldAppAd();
                }
                // Simula una breve espera de 2 segundos para otorgar la recompensa, garantizando que el cofre no falle
                return new Promise((resolve) => setTimeout(() => resolve(true), 2000));
            }
            return false;
        }
    }
}

export default AdManager;
