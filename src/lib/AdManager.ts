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
     * Muestra un Rewarded Interstitial de Monetag en Telegram Mini App.
     * El SDK de Monetag expone window.show_ZONE_ID() al cargarse.
     */
    private async showMontetagTelegramAd(zoneId: string): Promise<AdResult> {
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
     * Intenta abrir la Direct Link; si el popup está bloqueado, inyecta el popunder script.
     */
    private async showWebAd(directLink: string): Promise<boolean> {
        if (typeof window === 'undefined') return false;
        try {
            window.open(directLink, '_blank');
        } catch (e) {
            console.error('[AdManager] Popup blocked, trying popunder script injection fallback', e);
            try {
                const existing = document.getElementById('monetag-popunder-script');
                if (!existing) {
                    const script = document.createElement('script');
                    script.id = 'monetag-popunder-script';
                    // Popunder script de Monetag/Adsterra para World App
                    script.src = 'https://pl29719998.effectivecpmnetwork.com/10/3d/8f/103d8f2ad1a9c74967779c81881ee899.js';
                    script.async = true;
                    document.body.appendChild(script);
                }
            } catch (injectErr) {
                console.error('[AdManager] Failed to inject popunder script:', injectErr);
                return false;
            }
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
            const zoneId = activeConfig.monetagZoneId || '11150456';
            return await this.showMontetagTelegramAd(zoneId);
        } else {
            const directLink = activeConfig.adsterraUrl || this.config.adsterraUrl!;
            const ok = await this.showWebAd(directLink);
            return ok
                ? { success: true }
                : { success: false, error: 'Error al mostrar el anuncio en web' };
        }
    }
}

export default AdManager;
