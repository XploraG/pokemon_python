"use client";

import React, { useState, useEffect } from 'react';
import GameCanvas from '../components/GameCanvas';
import { supabase } from '../lib/supabase';

interface SaveData {
    name: string;
    time: number;
    player_coordinates: [number, number];
    map: string;
    economy_data?: any;
    inventory_data?: any;
    team_data?: any[];
    pc_pokemon?: any[];
}

export default function Home() {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [activeSave, setActiveSave] = useState<SaveData | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMiniKitInstalled, setIsMiniKitInstalled] = useState(false);
    const [mockAddressInput, setMockAddressInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Detect if MiniKit is available
        const checkMiniKit = async () => {
            try {
                const { MiniKit } = await import('@worldcoin/minikit-js');
                setIsMiniKitInstalled(MiniKit.isInstalled());
            } catch (err) {
                console.warn("Could not import MiniKit:", err);
            }
        };
        checkMiniKit();

        // Auto-login from cache
        const savedWallet = localStorage.getItem('pixel_tamer_active_wallet');
        if (savedWallet) {
            handleLoginWithWallet(savedWallet);
        }
    }, []);

    const handleLoginWithWallet = async (address: string) => {
        setIsConnecting(true);
        setError(null);
        try {
            // Fetch save data from Supabase
            const { data, error: dbError } = await supabase
                .from('player_saves')
                .select('save_data')
                .eq('wallet_address', address)
                .single();

            if (dbError && dbError.code !== 'PGRST116') {
                console.error("Database query error:", dbError);
                setError("Error al conectar con la base de datos de guardado en la nube.");
                setIsConnecting(false);
                return;
            }

            let saveState: SaveData;
            if (data && data.save_data) {
                saveState = data.save_data;
            } else {
                // Initialize new character save state for new user
                saveState = {
                    name: `Tamer-${address.slice(0, 6)}`,
                    time: 0,
                    player_coordinates: [632, 428],
                    map: "/assets/maps/tutorial/main.json",
                    economy_data: {
                        coins: 500,
                        pusdt: 0.0,
                        login_streak: 1,
                        last_login_date: new Date().toISOString().split('T')[0],
                        last_passive_claim: '',
                        defeated_gyms: {},
                        trainer_cooldowns: {},
                        gym_cooldowns: {},
                        daily_missions_progress: {},
                        total_coins_earned: 0,
                        achievements_unlocked: [],
                        level: 1,
                        heals_today: 0,
                        last_heal_date: ''
                    },
                    inventory_data: {
                        items: {
                            "pokeball": 5,
                            "potion": 3
                        }
                    },
                    team_data: [
                        { id: "pikachu", rarity: "uncommon", is_evolved: false }
                    ],
                    pc_pokemon: []
                };

                // Upsert to Supabase
                const { error: insertError } = await supabase
                    .from('player_saves')
                    .insert({
                        wallet_address: address,
                        save_data: saveState
                    });

                if (insertError) {
                    console.error("Failed to initialize save state in database:", insertError);
                }
            }

            // Save session credentials
            localStorage.setItem('pixel_tamer_active_wallet', address);
            setWalletAddress(address);
            setActiveSave(saveState);
        } catch (err) {
            console.error("Login flow error:", err);
            setError("Ocurrió un error inesperado al cargar tu progreso.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleConnectWorldApp = async () => {
        setError(null);
        setIsConnecting(true);
        try {
            const { MiniKit } = await import('@worldcoin/minikit-js');
            if (!MiniKit.isInstalled()) {
                setError("MiniKit no está instalado. Si estás probando en navegador local, utiliza la caja de abajo.");
                setIsConnecting(false);
                return;
            }

            // Trigger SIWE request
            const result = await MiniKit.walletAuth({
                nonce: Math.random().toString(36).substring(2, 15),
                statement: "Inicia sesión en Pixel Tamer",
                expirationTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
            });

            if (result.executedWith === "fallback") {
                setError("La autenticación de la billetera fue cancelada.");
                setIsConnecting(false);
                return;
            }

            if (result.data && result.data.address) {
                await handleLoginWithWallet(result.data.address);
            } else {
                setError("No se pudo obtener la dirección de billetera de la respuesta.");
            }
        } catch (err) {
            console.error("World App Auth Error:", err);
            setError("Error al conectar con World App.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleLogOut = () => {
        localStorage.removeItem('pixel_tamer_active_wallet');
        setWalletAddress(null);
        setActiveSave(null);
    };

    // If game is active, render canvas
    if (activeSave && walletAddress) {
        return (
            <div className="w-full h-full">
                <GameCanvas
                    saveName={activeSave.name}
                    playerCoordinates={activeSave.player_coordinates}
                    initialMapPath={activeSave.map}
                    economyData={activeSave.economy_data}
                    inventoryData={activeSave.inventory_data}
                    teamData={activeSave.team_data}
                    pcPokemonData={activeSave.pc_pokemon || []}
                    walletAddress={walletAddress}
                    onBackToMenu={handleLogOut}
                />
            </div>
        );
    }

    return (
        <div className="landing-container">
            <div className="landing-wrapper fade-in">
                {/* Glowing Title */}
                <h1 className="landing-title retro-title">Pixel Tamer</h1>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {isConnecting ? (
                        <div className="saves-list-empty glass-panel" style={{ textAlign: 'center', padding: '24px' }}>
                            <div className="spinner" style={{ border: '4px solid rgba(0, 0, 0, 0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: '#3e2723', animation: 'spin 1s linear infinite', margin: '0 auto 12px auto' }}></div>
                            Cargando partida desde la nube...
                        </div>
                    ) : (
                        <>
                            {/* Connect World App Button */}
                            <button
                                onClick={handleConnectWorldApp}
                                className="worldcoin-connect-btn"
                            >
                                <img 
                                    src="https://cdn.auth0.com/marketplace/catalog/content/assets/creators/worldcoin/worldcoin-avatar.png" 
                                    alt="Connection icon" 
                                    style={{ width: '22px', height: '22px', borderRadius: '50%' }}
                                />
                                <span>Continue with World</span>
                            </button>


                            {/* Fallback Dev Login Box */}
                            {!isMiniKitInstalled && (
                                <div className="create-form-card glass-panel fade-in" style={{ marginTop: '20px', width: '100%', boxSizing: 'border-box' }}>
                                    <h2 className="form-title" style={{ fontSize: '13px', textTransform: 'uppercase', color: '#ffb300', margin: '0 0 4px 0' }}>
                                        [ Desarrollador / Fallback ]
                                    </h2>
                                    <p className="form-subtitle" style={{ fontSize: '11px', margin: '0 0 12px 0', color: '#5d4037' }}>
                                        Para pruebas en navegadores tradicionales, ingresa una dirección de wallet mock:
                                    </p>
                                    <input
                                        type="text"
                                        value={mockAddressInput}
                                        onChange={(e) => setMockAddressInput(e.target.value)}
                                        placeholder="Ej. 0xMockWalletAddress..."
                                        className="form-input"
                                        style={{ fontFamily: 'monospace', fontSize: '11px', padding: '8px', width: '100%', boxSizing: 'border-box', marginBottom: '10px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const trimmed = mockAddressInput.trim();
                                            if (!trimmed) {
                                                setError("Por favor ingresa una dirección mock válida.");
                                                return;
                                            }
                                            handleLoginWithWallet(trimmed);
                                        }}
                                        className="btn-secondary"
                                        style={{ width: '100%', fontSize: '11px', padding: '8px' }}
                                    >
                                        Mock Login &rarr;
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Custom Modal Error Dialog */}
            {error && (
                <div className="modal-overlay" style={{ zIndex: 100 }}>
                    <div className="modal-card pokemon-panel" style={{ maxWidth: '360px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Alerta</h3>
                            <button onClick={() => setError(null)} className="modal-close-btn">&times;</button>
                        </div>
                        <div className="modal-body" style={{ color: '#3e2723' }}>
                            <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
                                {error}
                            </p>
                            <button
                                onClick={() => setError(null)}
                                className="pokemon-button success"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
