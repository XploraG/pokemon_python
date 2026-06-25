"use client";

import React, { useState, useEffect } from 'react';
import GameCanvas from '../components/GameCanvas';
import { supabase } from '../lib/supabase';
import pokemonSpeciesList from '../../public/assets/economy/pokemon_species.json';
import Script from 'next/script';

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

const STARTERS = [
    {
        name: "bulbasaur",
        displayName: "Bulbasaur",
        type: "Grass / Poison",
        sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
        description: "Lleva una semilla en su lomo desde que nace, la cual crece gradualmente con él.",
        bgColor: "#e8f5e9",
        borderColor: "#4caf50"
    },
    {
        name: "charmander",
        displayName: "Charmander",
        type: "Fire",
        sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png",
        description: "Prefiere las cosas calientes. Se dice que si su flama se apaga, fallece.",
        bgColor: "#fff3e0",
        borderColor: "#ff9800"
    },
    {
        name: "squirtle",
        displayName: "Squirtle",
        type: "Water",
        sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png",
        description: "Su caparazón no solo lo protege, sino que reduce la resistencia en el agua.",
        bgColor: "#e1f5fe",
        borderColor: "#03a9f4"
    }
];

const BASE_STAGE_POKEMON = new Set([
    'bulbasaur', 'charmander', 'squirtle', 'caterpie', 'weedle', 'pidgey', 'rattata', 'spearow',
    'ekans', 'pikachu', 'sandshrew', 'nidoran-f', 'nidoran-m', 'vulpix', 'jigglypuff', 'zubat',
    'oddish', 'paras', 'venonat', 'diglett', 'meowth', 'psyduck', 'mankey', 'growlithe',
    'poliwag', 'abra', 'machop', 'bellsprout', 'tentacool', 'geodude', 'ponyta', 'slowpoke',
    'magnemite', 'doduo', 'seel', 'grimer', 'shellder', 'gastly', 'onix', 'drowzee',
    'krabby', 'voltorb', 'exeggcute', 'cubone', 'hitmonlee', 'hitmonchan', 'lickitung', 'koffing',
    'rhyhorn', 'chansey', 'tangela', 'kangaskhan', 'horsea', 'goldeen', 'staryu', 'mr-mime',
    'scyther', 'jynx', 'electabuzz', 'magmar', 'pinsir', 'tauros', 'magikarp', 'lapras',
    'ditto', 'eevee', 'porygon', 'omanyte', 'kabuto', 'aerodactyl', 'snorlax', 'articuno',
    'zapdos', 'moltres', 'dratini', 'mewtwo', 'mew'
]);

export default function Home() {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [activeSave, setActiveSave] = useState<SaveData | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMiniKitInstalled, setIsMiniKitInstalled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Onboarding states for selecting starter Pokémon
    const [needsStarterSelection, setNeedsStarterSelection] = useState(false);
    const [pendingNewAddress, setPendingNewAddress] = useState<string | null>(null);
    const [pendingCustomName, setPendingCustomName] = useState<string | null>(null);
    const [selectedStarter, setSelectedStarter] = useState<string | null>(null);

    // Landing page states
    const [startedPlaying, setStartedPlaying] = useState(false);
    const [showRedirectModal, setShowRedirectModal] = useState(false);
    const [showSolanaManualModal, setShowSolanaManualModal] = useState(false);
    const [manualSolanaAddress, setManualSolanaAddress] = useState('');
    const [clickStartAttempted, setClickStartAttempted] = useState(false);
    const [devClickCount, setDevClickCount] = useState<number>(0);
    const [showDevPanel, setShowDevPanel] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
        // Check for referral code in query params
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const refVal = params.get('ref');
            if (refVal) {
                localStorage.setItem('pixel_tamer_referrer', refVal);
                console.log("Referral code stored:", refVal);
            }
        }
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

        // Detect if Telegram WebApp is available and execute auto-login
        const checkTelegram = () => {
            const tg = (window as any).Telegram?.WebApp;
            if (tg && tg.initDataUnsafe?.user?.id) {
                tg.ready();
                tg.expand();
                const user = tg.initDataUnsafe.user;
                const tgId = `telegram_${user.id}`;
                const tgName = user.username 
                    ? `@${user.username}` 
                    : `${user.first_name || 'Tamer'}${user.last_name ? ' ' + user.last_name : ''}`;
                
                // Extract Telegram referral code
                const startParam = tg.initDataUnsafe.start_param;
                if (startParam) {
                    const refVal = startParam.startsWith('ref_') ? startParam.replace('ref_', '') : startParam;
                    localStorage.setItem('pixel_tamer_referrer', refVal);
                    console.log("Telegram referral code stored from start_param:", refVal);
                }
                
                // Trigger transparent auto-login
                handleLoginWithWallet(tgId, tgName);
            } else {
                // Auto-login from cache (only if not in Telegram context)
                const savedWallet = localStorage.getItem('pixel_tamer_active_wallet') || sessionStorage.getItem('pixel_tamer_active_wallet');
                if (savedWallet) {
                    handleLoginWithWallet(savedWallet);
                }
            }
        };

        const timer = setTimeout(checkTelegram, 100);
        return () => clearTimeout(timer);
    }, []);

    const generateUUID = () => {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
            return window.crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const mapDbToPoke = (m: any) => {
        const species = pokemonSpeciesList.find((s: any) => s.id === m.especie_id);
        const speciesName = species ? species.name.toLowerCase() : 'pikachu';
        
        // Cap level at 99
        const level = Math.min(m.nivel ?? 5, 99);
        // Bulbapedia HP formula: Math.floor(((2 * base + iv) * level) / 100) + level + 10
        const baseHp = species ? species.hp : 40;
        const maxHp = Math.floor(((2 * baseHp + m.iv_hp) * level) / 100) + level + 10;
        
        let heldItems = m.held_items !== undefined && m.held_items !== null ? m.held_items : [null, null, null, null];
        while (heldItems.length < 4) {
            heldItems.push(null);
        }
        
        return {
            id: speciesName,
            id_captura: m.id_captura,
            especie_id: m.especie_id,
            rarity: species ? species.rarity.toLowerCase() : 'common',
            is_evolved: !BASE_STAGE_POKEMON.has(speciesName),
            level: level,
            xp: m.xp,
            hp: Math.min(m.hp_actual, maxHp),
            maxHp: maxHp,
            moves: m.moves || [],
            is_shiny: m.es_shiny,
            ivs: {
                hp: m.iv_hp,
                attack: m.iv_ataque,
                defense: m.iv_defensa,
                speed: m.iv_velocidad
            },
            unlocked_slots: m.unlocked_slots !== undefined && m.unlocked_slots !== null ? m.unlocked_slots : 2,
            held_items: heldItems
        };
    };

    const handleLoginWithWallet = async (address: string, customName?: string, autoStart: boolean = false) => {
        setIsConnecting(true);
        setError(null);
        try {
            if (address.startsWith('free_local_')) {
                // Check sessionStorage for local saves
                const localSaves = JSON.parse(sessionStorage.getItem('pixel_tamer_saves') || '{}');
                const savedData = localSaves[address];
                if (savedData) {
                    sessionStorage.setItem('pixel_tamer_active_wallet', address);
                    setWalletAddress(address);
                    setActiveSave(savedData);
                    if (autoStart || clickStartAttempted) {
                        setStartedPlaying(true);
                    }
                } else {
                    // Trigger starter selection onboarding for new local free user
                    setPendingNewAddress(address);
                    setPendingCustomName(customName || null);
                    setNeedsStarterSelection(true);
                }
                setIsConnecting(false);
                return;
            }

            // Fetch save data from Supabase - case insensitive
            const { data, error: dbError } = await supabase
                .from('player_saves')
                .select('wallet_address, save_data, updated_at')
                .ilike('wallet_address', address)
                .maybeSingle();

            if (dbError) {
                // If it's a permissions/RLS error on SELECT, treat as a new player
                // instead of blocking them with an error screen.
                const isPermissionError = dbError.code === '42501' || dbError.message?.toLowerCase().includes('permission') || dbError.message?.toLowerCase().includes('policy');
                if (!isPermissionError) {
                    console.error("Database query error:", dbError);
                    setError("Error al conectar con la base de datos de guardado en la nube.");
                    setIsConnecting(false);
                    return;
                }
                // Fall through: treat as new user
                console.warn("DB SELECT error (likely RLS), treating as new player:", dbError);
            }

            if (data && data.save_data) {
                const databaseAddress = data.wallet_address || address;
                let saveState = { ...data.save_data };
                
                // Fetch captured monsters from Supabase
                const { data: dbMonsters, error: dbMonstersError } = await supabase
                    .from('captured_monsters')
                    .select('*')
                    .eq('id_jugador', databaseAddress);

                if (dbMonstersError) {
                    console.error("Error loading captured monsters:", dbMonstersError);
                }

                if (dbMonsters && dbMonsters.length > 0) {
                    // Split into team and PC
                    const teamMonsters = dbMonsters
                        .filter((m: any) => m.is_team)
                        .sort((a: any, b: any) => a.team_order - b.team_order)
                        .map(mapDbToPoke);
                    const pcMonsters = dbMonsters
                        .filter((m: any) => !m.is_team)
                        .sort((a: any, b: any) => a.team_order - b.team_order)
                        .map(mapDbToPoke);

                    saveState.team_data = teamMonsters;
                    saveState.pc_pokemon = pcMonsters;
                } else if (saveState.team_data && saveState.team_data.length > 0) {
                    // Perform Lazy Migration for legacy save
                    console.log("Lazy migration triggered for wallet:", databaseAddress);
                    const migratedTeam: any[] = [];
                    const migratedPc: any[] = [];
                    const dbRowsToInsert: any[] = [];

                    (saveState.team_data || []).forEach((p: any, idx: number) => {
                        const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === p.id.toLowerCase());
                        const specId = species ? species.id : 25;
                        const ivs = {
                            hp: Math.floor(Math.random() * 32),
                            attack: Math.floor(Math.random() * 32),
                            defense: Math.floor(Math.random() * 32),
                            speed: Math.floor(Math.random() * 32)
                        };
                        const uuid = generateUUID();
                        
                        migratedTeam.push({
                            ...p,
                            id_captura: uuid,
                            ivs: ivs
                        });

                        dbRowsToInsert.push({
                            id_captura: uuid,
                            id_jugador: databaseAddress,
                            especie_id: specId,
                            nivel: Math.min(p.level ?? 5, 99),
                            xp: p.xp ?? 0,
                            hp_actual: p.hp ?? 10,
                            iv_hp: ivs.hp,
                            iv_ataque: ivs.attack,
                            iv_defensa: ivs.defense,
                            iv_velocidad: ivs.speed,
                            es_shiny: p.is_shiny || false,
                            moves: p.moves || [],
                            is_team: true,
                            team_order: idx,
                            unlocked_slots: p.unlocked_slots ?? 2,
                            held_items: p.held_items || [null, null, null, null]
                        });
                    });

                    (saveState.pc_pokemon || []).forEach((p: any, idx: number) => {
                        const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === p.id.toLowerCase());
                        const specId = species ? species.id : 25;
                        const ivs = {
                            hp: Math.floor(Math.random() * 32),
                            attack: Math.floor(Math.random() * 32),
                            defense: Math.floor(Math.random() * 32),
                            speed: Math.floor(Math.random() * 32)
                        };
                        const uuid = generateUUID();
                        
                        migratedPc.push({
                            ...p,
                            id_captura: uuid,
                            ivs: ivs
                        });

                        dbRowsToInsert.push({
                            id_captura: uuid,
                            id_jugador: databaseAddress,
                            especie_id: specId,
                            nivel: Math.min(p.level ?? 5, 99),
                            xp: p.xp ?? 0,
                            hp_actual: p.hp ?? 10,
                            iv_hp: ivs.hp,
                            iv_ataque: ivs.attack,
                            iv_defensa: ivs.defense,
                            iv_velocidad: ivs.speed,
                            es_shiny: p.is_shiny || false,
                            moves: p.moves || [],
                            is_team: false,
                            team_order: idx,
                            unlocked_slots: p.unlocked_slots ?? 2,
                            held_items: p.held_items || [null, null, null, null]
                        });
                    });

                    if (dbRowsToInsert.length > 0) {
                        let { error: migrationError } = await supabase
                            .from('captured_monsters')
                            .insert(dbRowsToInsert);
                        
                        if (migrationError) {
                            console.warn("Migration insert error with new columns, retrying fallback:", migrationError);
                            const fallbackRows = dbRowsToInsert.map(({ unlocked_slots, held_items, ...rest }) => rest);
                            const { error: fallbackError } = await supabase
                                .from('captured_monsters')
                                .insert(fallbackRows);
                            migrationError = fallbackError;
                        } else {
                            console.log("Successfully migrated pokemon to captured_monsters for address:", databaseAddress);
                        }
                    }

                    saveState.team_data = migratedTeam;
                    saveState.pc_pokemon = migratedPc;
                }

                // Save session credentials
                if (databaseAddress.startsWith('free_local_')) {
                    sessionStorage.setItem('pixel_tamer_active_wallet', databaseAddress);
                } else {
                    localStorage.setItem('pixel_tamer_active_wallet', databaseAddress);
                }
                setWalletAddress(databaseAddress);
                setActiveSave(saveState);
                if (autoStart || clickStartAttempted) {
                    setStartedPlaying(true);
                }
            } else {
                // Trigger starter selection onboarding for new user
                setPendingNewAddress(address);
                setPendingCustomName(customName || null);
                setNeedsStarterSelection(true);
            }
        } catch (err) {
            console.error("Login flow error:", err);
            setError("Ocurrió un error inesperado al cargar tu progreso.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleConfirmStarter = async () => {
        if (!pendingNewAddress || !selectedStarter) return;
        setIsConnecting(true);
        setError(null);
        try {
            const uuid = generateUUID();
            const ivs = {
                hp: Math.floor(Math.random() * 32),
                attack: Math.floor(Math.random() * 32),
                defense: Math.floor(Math.random() * 32),
                speed: Math.floor(Math.random() * 32)
            };
            const isShiny = Math.random() < 0.001;
            const starterSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === selectedStarter.toLowerCase());
            const specId = starterSpecies ? starterSpecies.id : 25;
            const baseHp = starterSpecies ? starterSpecies.hp : 40;
            const maxHp = Math.floor(((2 * baseHp + ivs.hp) * 1) / 100) + 1 + 10;

            const starterPoke = {
                id: selectedStarter,
                id_captura: uuid,
                especie_id: specId,
                rarity: "common",
                is_evolved: false,
                level: 1,
                xp: 0,
                hp: maxHp,
                maxHp: maxHp,
                moves: [],
                is_shiny: isShiny,
                ivs: ivs
            };

            // Check for referrer
            const referrer = typeof window !== 'undefined' ? localStorage.getItem('pixel_tamer_referrer') : null;
            // Check deadline: Wednesday, June 24, 2026 23:59:59 UTC-5 = 1782363599000
            const isBeforeDeadline = Date.now() < 1782363599000;
            
            let initialCoins = 500;
            let initialItems: Record<string, number> = {
                "tamer_ball": 5,
                "potion": 3
            };
            let registeredReferrer: string | undefined = undefined;

            if (referrer && isBeforeDeadline) {
                initialCoins += 500; // Extra 500 coins (total 1000)
                initialItems["lucky_egg"] = 1; // 1 lucky egg
                initialItems["potion"] = 8; // 3 + 5 = 8 potions
                initialItems["super_ball"] = 2; // 2 super balls
                registeredReferrer = referrer;
            }

            const saveState: SaveData = {
                name: pendingCustomName || `Tamer-${pendingNewAddress.slice(0, 6)}`,
                time: 0,
                player_coordinates: [632, 428],
                map: "/assets/maps/tutorial/main.json",
                economy_data: {
                    coins: initialCoins,
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
                    last_heal_date: '',
                    referred_by: registeredReferrer,
                    claimed_referrals: []
                },
                inventory_data: {
                    items: initialItems
                },
                team_data: [starterPoke],
                pc_pokemon: []
            };

            if (!pendingNewAddress.startsWith('free_local_')) {
                // First upsert to Supabase (safe on retry — avoids unique constraint violations)
                // This also ensures the player profile exists before inserting to captured_monsters (satisfying foreign key)
                const { error: insertError } = await supabase
                    .from('player_saves')
                    .upsert({
                        wallet_address: pendingNewAddress,
                        save_data: saveState
                    }, { onConflict: 'wallet_address' });

                if (insertError) {
                    console.error("Failed to initialize save state in database:", insertError);
                    setError("No se pudo iniciar la partida en el servidor.");
                    setIsConnecting(false);
                    return;
                }

                // Then insert to captured_monsters
                const insertPayload: any = {
                    id_captura: uuid,
                    id_jugador: pendingNewAddress,
                    especie_id: specId,
                    nivel: 1,
                    xp: 0,
                    hp_actual: maxHp,
                    iv_hp: ivs.hp,
                    iv_ataque: ivs.attack,
                    iv_defensa: ivs.defense,
                    iv_velocidad: ivs.speed,
                    es_shiny: isShiny,
                    moves: [],
                    is_team: true,
                    team_order: 0,
                    unlocked_slots: 2,
                    held_items: [null, null, null, null]
                };

                let { error: monsterError } = await supabase
                    .from('captured_monsters')
                    .insert(insertPayload);

                if (monsterError) {
                    console.warn("Failed to save starter with unlocked_slots/held_items in captured_monsters, retrying fallback:", monsterError);
                    const { unlocked_slots, held_items, ...fallbackPayload } = insertPayload;
                    const { error: fallbackError } = await supabase
                        .from('captured_monsters')
                        .insert(fallbackPayload);
                    monsterError = fallbackError;
                }

                if (monsterError) {
                    console.error("Failed to save starter in captured_monsters:", monsterError);
                    setError("No se pudo registrar tu Pokémon inicial.");
                    setIsConnecting(false);
                    return;
                }
            } else {
                // Guardar localmente en sessionStorage para cuentas libres
                const localSaves = JSON.parse(sessionStorage.getItem('pixel_tamer_saves') || '{}');
                localSaves[pendingNewAddress] = saveState;
                sessionStorage.setItem('pixel_tamer_saves', JSON.stringify(localSaves));
            }

            // Save session credentials
            if (pendingNewAddress.startsWith('free_local_')) {
                sessionStorage.setItem('pixel_tamer_active_wallet', pendingNewAddress);
            } else {
                localStorage.setItem('pixel_tamer_active_wallet', pendingNewAddress);
            }
            setWalletAddress(pendingNewAddress);
            setActiveSave(saveState);
            setNeedsStarterSelection(false);
            setPendingNewAddress(null);
            setPendingCustomName(null);
            setSelectedStarter(null);
            setStartedPlaying(true);
        } catch (err) {
            console.error("Failed to save starter selection:", err);
            setError("Ocurrió un error inesperado al iniciar tu partida.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleConnectSolana = async () => {
        setError(null);
        setIsConnecting(true);
        try {
            const provider = (window as any).solana;
            if (provider && provider.isPhantom) {
                const response = await provider.connect();
                const pubKey = response.publicKey.toString();
                await handleLoginWithWallet(pubKey, `Solana Tamer`);
            } else {
                setShowSolanaManualModal(true);
            }
        } catch (err: any) {
            console.error("Solana connection error:", err);
            setError(err.message || "Error al conectar con Solana Wallet.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleManualSolanaLogin = () => {
        if (!manualSolanaAddress.trim()) return;
        setShowSolanaManualModal(false);
        handleLoginWithWallet(manualSolanaAddress.trim(), `Solana Tamer`);
    };

    const handlePlayFree = () => {
        const randomId = Math.random().toString(36).substring(2, 8);
        const freeAddress = `free_local_${randomId}`;
        handleLoginWithWallet(freeAddress, `Free Tamer`, true);
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
                await handleLoginWithWallet(result.data.address, undefined, true);
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
        sessionStorage.removeItem('pixel_tamer_active_wallet');
        setWalletAddress(null);
        setActiveSave(null);
        setStartedPlaying(false);
        setClickStartAttempted(false);
    };

    const handleStartJourney = () => {
        setClickStartAttempted(true);
        if (walletAddress && activeSave) {
            setStartedPlaying(true);
            return;
        }
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (!mounted) {
        return (
            <div className="landing-container">
                <div className="landing-wrapper" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <h1 className="landing-title retro-title">Pixel Tamer</h1>
                    <div className="saves-list-empty glass-panel" style={{ display: 'inline-block', padding: '24px' }}>
                        <div className="spinner" style={{ border: '4px solid rgba(0, 0, 0, 0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: '#3e2723', animation: 'spin 1s linear infinite', margin: '0 auto 12px auto' }}></div>
                        Iniciando juego...
                    </div>
                </div>
            </div>
        );
    }

    // If game is active, render canvas
    if (activeSave && walletAddress && startedPlaying) {
        return (
            <div className="w-full h-full">
                <GameCanvas
                    saveName={activeSave.name}
                    playerCoordinates={(() => {
                        const savedMap = activeSave.map || '';
                        if (savedMap.includes('procedural://')) {
                            return [632, 428];
                        }
                        return activeSave.player_coordinates || [632, 428];
                    })()}
                    initialMapPath={(() => {
                        const saved = activeSave.map || '/assets/maps/tutorial/main.json';
                        if (saved.includes('procedural://')) {
                            return '/assets/maps/tutorial/main.json';
                        }
                        // Known playable maps — redirect to tutorial if player is on a removed/broken map
                        const knownMaps = [
                            'tutorial', 'route1',
                            'pokecenter', 'pokemart', 'gym',
                            'redhouse', 'cave'
                        ];
                        const isSafe = knownMaps.some(m => saved.includes(m));
                        if (!isSafe) {
                            console.warn(`[MapFix] Map "${saved}" no encontrado — redirigiendo a Tutorial`);
                            return '/assets/maps/tutorial/main.json';
                        }
                        return saved;
                    })()}
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

    // Render Starter Selection UI if player is new
    if (needsStarterSelection && pendingNewAddress) {
        return (
            <div className="landing-container">
                <div className="landing-wrapper fade-in" style={{ maxWidth: '560px' }}>
                    <h1 className="landing-title retro-title" style={{ fontSize: '20px', marginBottom: '8px' }}>Elige tu Inicial</h1>
                    <p style={{ color: '#5d4037', fontSize: '11px', textAlign: 'center', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        ¡Bienvenido, Entrenador! Selecciona a tu primer compañero de aventuras:
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', width: '100%', marginBottom: '20px' }}>
                        {STARTERS.map((s) => {
                            const isSelected = selectedStarter === s.name;
                            return (
                                <button
                                    key={s.name}
                                    onClick={() => setSelectedStarter(s.name)}
                                    className={`starter-card ${isSelected ? 'selected' : ''}`}
                                    style={{
                                        background: s.bgColor,
                                        border: `3px solid ${isSelected ? '#3e2723' : '#b0bec5'}`,
                                        borderRadius: '8px',
                                        padding: '12px 8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        transition: 'all 0.2s ease',
                                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                                        boxShadow: isSelected ? '0 4px 8px rgba(0,0,0,0.15)' : 'none'
                                    }}
                                >
                                    <img 
                                        src={s.sprite} 
                                        alt={s.displayName} 
                                        style={{ width: '64px', height: '64px', objectFit: 'contain', filter: isSelected ? 'drop-shadow(0 4px 4px rgba(0,0,0,0.25))' : 'none' }} 
                                    />
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#3e2723', textTransform: 'capitalize', marginTop: '6px' }}>{s.displayName}</span>
                                    <span style={{ fontSize: '9px', color: '#78909c', marginTop: '2px', fontWeight: 'bold' }}>{s.type}</span>
                                </button>
                            );
                        })}
                    </div>

                    {selectedStarter && (
                        <div className="pokemon-panel fade-in" style={{ padding: '12px', width: '100%', boxSizing: 'border-box', marginBottom: '20px', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <p style={{ fontSize: '10px', color: '#5d4037', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                Descripción de {selectedStarter}:
                            </p>
                            <p style={{ fontSize: '11px', color: '#3e2723', margin: 0, fontStyle: 'italic', lineHeight: '1.4' }}>
                                "{STARTERS.find(s => s.name === selectedStarter)?.description}"
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                        <button
                            onClick={() => {
                                setNeedsStarterSelection(false);
                                setPendingNewAddress(null);
                                setPendingCustomName(null);
                                setSelectedStarter(null);
                            }}
                            className="btn-secondary"
                            style={{ flex: 1, fontSize: '11px', padding: '10px' }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmStarter}
                            disabled={!selectedStarter || isConnecting}
                            className="pokemon-button success"
                            style={{ flex: 2, fontSize: '11px', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        >
                            {isConnecting ? "Registrando..." : "Comenzar Aventura"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default: render the Landing Page!
    return (
        <div className="w-full max-w-[480px] mx-auto h-screen overflow-y-auto bg-[#f8f9fb] text-[#1a1a1a] font-sans antialiased relative border-x-2 border-[#2d3748]">
            <Script src="https://cdn.tailwindcss.com?plugins=forms,container-queries" strategy="afterInteractive" />
            
            {/* Fonts */}
            <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Press+Start+2P&display=swap" rel="stylesheet" />
            
            {/* BEGIN: HeroSection */}
            <section className="relative w-full h-screen min-h-[650px] overflow-hidden flex flex-col items-center justify-center py-12" data-purpose="hero-banner" id="hero">
                {/* Full-width Background Image */}
                <div className="absolute inset-0 z-0">
                    <img 
                        alt="Pixel Tamer Hero World" 
                        className="w-full h-full object-cover" 
                        src="/assets/imgs/hero_bg.jpg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80"></div>
                </div>
                {/* Title Overlay */}
                <div className="relative z-10 text-center px-4 flex flex-col items-center w-full max-w-[420px] mx-auto">
                    <h1 
                        onClick={() => {
                            setDevClickCount(prev => {
                                const next = prev + 1;
                                if (next >= 5) {
                                    setShowDevPanel(true);
                                    return 0;
                                }
                                return next;
                            });
                        }}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        className="pixel-font text-white text-4xl tracking-tighter leading-tight text-shadow-pixel mb-3 uppercase"
                    >
                        PIXEL<br/>TAMER
                    </h1>

                    {/* Badge: Lanzamiento Liga Tamer */}
                    <div className="bg-[#9945FF]/20 backdrop-blur-md px-4 py-2 border-2 border-[#14F195] rounded-lg shadow-[0_0_15px_rgba(20,241,149,0.3)] mb-4 w-full">
                        <p className="text-[#14F195] text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase font-sans">
                            🏆 Lanzamiento Liga Tamer
                        </p>
                        <p className="text-white text-[9px] font-semibold uppercase tracking-[0.05em] mt-0.5">
                            Explora, compite e intercambia
                        </p>
                    </div>

                    {/* Hook Text: Sé el Mejor Entrenador de la Web3 */}
                    <div className="mb-6">
                        <p className="pixel-font text-yellow-400 text-[10px] tracking-widest uppercase text-shadow-sm animate-pulse">
                            Sé el Mejor Entrenador de la Web3
                        </p>
                    </div>

                    {/* Login/Connection Options */}
                    <div className="flex flex-col gap-3.5 w-full mt-2">
                        {/* 1. Primary Button: Solana Wallet Connection */}
                        <button 
                            onClick={handleConnectSolana}
                            disabled={isConnecting}
                            className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black font-extrabold pixel-border px-6 py-4.5 rounded-md transition-all hover:scale-105 active:scale-98 cursor-pointer flex items-center justify-center gap-3 w-full shadow-[0_0_20px_rgba(153,69,255,0.6)]"
                        >
                            <img 
                                src="https://cryptologos.cc/logos/solana-sol-logo.png" 
                                alt="Solana Logo" 
                                className="w-5 h-5 object-contain"
                            />
                            <span className="pixel-font text-xs uppercase tracking-wider text-black">
                                {isConnecting ? "CONECTANDO..." : "CONECTAR SOLANA WALLET"}
                            </span>
                        </button>

                        <div className="flex items-center justify-between w-full px-2 my-1">
                            <span className="h-0.5 bg-white/20 flex-1"></span>
                            <span className="text-white/60 text-[9px] font-bold uppercase mx-3 tracking-widest">o inicia sesión con</span>
                            <span className="h-0.5 bg-white/20 flex-1"></span>
                        </div>

                        {/* 2. World App & Telegram Buttons */}
                        <div className="flex flex-col gap-2.5 w-full">
                            <button
                                onClick={() => {
                                    if (isMiniKitInstalled) {
                                        handleConnectWorldApp();
                                    } else {
                                        window.open('https://worldcoin.org/mini-app?app_id=app_6a783c64810d430744512e4207e07fce', '_blank');
                                    }
                                }}
                                disabled={isConnecting}
                                className="bg-black hover:bg-gray-900 text-white pixel-border px-5 py-3 rounded-md transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer w-full"
                            >
                                <img 
                                    src="https://cdn.auth0.com/marketplace/catalog/content/assets/creators/worldcoin/worldcoin-avatar.png" 
                                    alt="Worldcoin" 
                                    className="w-4 h-4 rounded-full"
                                />
                                <span className="pixel-font text-[9px] uppercase tracking-wider">Jugar desde World App</span>
                            </button>

                            <button
                                onClick={() => {
                                    const tg = (window as any).Telegram?.WebApp;
                                    if (tg && tg.initDataUnsafe?.user?.id) {
                                        setStartedPlaying(true);
                                    } else {
                                        window.open('https://t.me/PixelTamerBot/play', '_blank');
                                    }
                                }}
                                disabled={isConnecting}
                                className="bg-[#0088cc] hover:bg-[#0077b3] text-white pixel-border px-5 py-3 rounded-md transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer w-full"
                            >
                                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                                    <path d="m22 2-7 20-4-9-9-4Z"/>
                                    <path d="M22 2 11 13"/>
                                </svg>
                                <span className="pixel-font text-[9px] uppercase tracking-wider">Jugar desde Telegram</span>
                            </button>
                        </div>

                        {/* 3. Free Play Local Mode */}
                        <div className="mt-4 border-t border-white/10 pt-4 w-full flex flex-col items-center">
                            <button 
                                onClick={handlePlayFree}
                                className="text-yellow-400 hover:text-yellow-300 underline font-medium transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                                🎮 Prueba el juego de manera free
                            </button>
                            <p className="text-white/60 text-[8px] leading-normal mt-2 text-center max-w-[280px]">
                                * El progreso se guardará localmente en la pestaña del navegador y se perderá por completo al cerrarlo, a menos que conectes una wallet.
                            </p>
                        </div>
                    </div>
                    
                    {/* Subtle status indicators for auto-login */}
                    {isConnecting && (
                        <p className="text-white text-[10px] font-bold mt-4 animate-pulse uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded pixel-border-sm">
                            Conectando con el servidor...
                        </p>
                    )}
                    
                    {walletAddress && activeSave && !isConnecting && (
                        <div className="mt-4 bg-black/60 p-2.5 rounded pixel-border-sm w-full flex flex-col items-center">
                            <p className="text-green-400 text-[9px] font-bold uppercase tracking-widest">
                                Sesión lista como: {activeSave.name}
                            </p>
                            <button
                                onClick={() => setStartedPlaying(true)}
                                className="mt-2 bg-[#2d5a27] hover:bg-[#3d7a35] text-white pixel-border-sm px-4 py-2 text-[9px] pixel-font w-full uppercase"
                            >
                                Reanudar Partida
                            </button>
                        </div>
                    )}
                </div>
            </section>
            {/* END: HeroSection */}

            {/* BEGIN: FeatureHighlights */}
            <section className="relative py-24 px-6 overflow-hidden" data-purpose="game-features" id="features">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img 
                        alt="Features Background" 
                        className="w-full h-full object-cover" 
                        src="/assets/imgs/features_bg.png"
                    />
                    <div className="absolute inset-0 bg-white/85"></div>
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="pixel-font text-lg md:text-xl tracking-tight uppercase text-gray-900 mb-4">Destacados del Mundo</h2>
                        <div className="h-1.5 w-32 bg-[#2d5a27] mx-auto pixel-border-sm shadow-none border-none"></div>
                    </div>
                    <div className="grid grid-cols-1 gap-12">
                        {/* Feature 1: Capture, Combat & Explore */}
                        <div className="group">
                            <div className="pixel-border bg-white overflow-hidden mb-6 aspect-[3/2] relative transition-transform group-hover:-translate-y-2">
                                <div className="absolute inset-0 overflow-hidden">
                                    {/* Mapping IMAGE_17 sprite: Row 1, Col 1 */}
                                    <img alt="Capture Icon" className="absolute w-[300%] h-[200%] top-0 left-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfbFhNeCx06vB-QHOGt7f-MyeA0eWdkrFhf9FOzHiGs1AfnzfON81LY-LLP4q3GfzDCGGihwJqWgSOjkastxt-ODqyexJ3xr-R6LbVUa3pSqPDb4WfBtn2JUi_cb1DNgAH3VYpvNFlb9BEsjzIN3NPsYnn7B8p1Ma98s3IxElggIWmeO8tjNy3WVfnd6975NpADZAbKZWLIPh01DMicfooWnRYhmO_qRHb6DLH-24BWLoJ_WyjEUXUifFCo8xNRWmTEq86RRvtlg6h" />
                                </div>
                            </div>
                            <h3 className="pixel-font text-sm mb-3 text-[#2d5a27]">CAPTURA, COMBATE Y EXPLORA</h3>
                            <p className="text-gray-800 font-medium leading-relaxed text-xs">Domestica criaturas salvajes, enfréntate a otros domadores en duelos estratégicos por turnos y descubre vastos mundos pixelados llenos de secretos.</p>
                        </div>
                        
                        {/* Feature 2: Train, Collect & Sell */}
                        <div className="group">
                            <div className="pixel-border bg-white overflow-hidden mb-6 aspect-[3/2] relative transition-transform group-hover:-translate-y-2">
                                <div className="absolute inset-0 overflow-hidden">
                                    {/* Mapping IMAGE_17 sprite: Row 2, Col 1 */}
                                    <img alt="Train Icon" className="absolute w-[300%] h-[200%] top-[-100%] left-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfbFhNeCx06vB-QHOGt7f-MyeA0eWdkrFhf9FOzHiGs1AfnzfON81LY-LLP4q3GfzDCGGihwJqWgSOjkastxt-ODqyexJ3xr-R6LbVUa3pSqPDb4WfBtn2JUi_cb1DNgAH3VYpvNFlb9BEsjzIN3NPsYnn7B8p1Ma98s3IxElggIWmeO8tjNy3WVfnd6975NpADZAbKZWLIPh01DMicfooWnRYhmO_qRHb6DLH-24BWLoJ_WyjEUXUifFCo8xNRWmTEq86RRvtlg6h" />
                                </div>
                            </div>
                            <h3 className="pixel-font text-sm mb-3 text-[#2d5a27]">ENTRENA, COLECCIONA Y VENDE</h3>
                            <p className="text-gray-800 font-medium leading-relaxed text-xs">Mejora las habilidades de tus aliados para desbloquear su evolución, completa tu Pixel-Dex con especies legendarias y comercia en el mercado global.</p>
                        </div>
                    </div>
                </div>
            </section>
            {/* END: FeatureHighlights */}

            {/* BEGIN: PVPBanner */}
            <section className="relative py-32 px-6 overflow-hidden" data-purpose="pvp-announcement">
                <div className="absolute inset-0 z-0">
                    <img alt="PvP Arena Background" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBsS_8KyeLFvu8D1y-TqMRKoZKFt6ZerftOgpl5_2POt92HbQpl63VGCOlls8nMMIeiAJnHRea32ElsmnUPOQkNCjap0fAhxwUYlYkfi8adKp9UTSLai2slPljgejciuFdfh3wKn39rx7-EVWVZXIG-1OZvWQPmi9Xcl37UYpYFbd4yjgeMoyxnMxT4jAa-QbIDPRKoiZtswZ6rritWq5xs1bAEzMYRUC9XLO4Fk6xtFpBnC9IiJbyuFakYQ7YvgbaWJq_3RIGrc7aE" />
                    <div className="absolute inset-0 bg-black/50"></div>
                </div>
                <div className="max-w-4xl mx-auto relative z-10 text-center flex flex-col items-center">
                    <div className="inline-block bg-yellow-400 text-black px-6 py-2 pixel-border-sm mb-8 font-bold uppercase text-[9px] pixel-font">
                        Evento Global
                    </div>
                    <h2 className="pixel-font text-white text-xl md:text-2xl leading-tight mb-10 text-shadow-pixel uppercase">
                        TORNEOS PVP CON PREMIOS REALES
                    </h2>
                    <button 
                        onClick={handleStartJourney}
                        className="bg-[#e11d48] hover:bg-[#fb7185] text-white pixel-border px-10 py-5 transition-all active:scale-95 group cursor-pointer"
                    >
                        <span className="pixel-font text-xs md:text-sm">¡ÚNETE AHORA!</span>
                    </button>
                    <p className="mt-10 text-white text-base font-bold italic drop-shadow-md">
                        ¿Tienes lo necesario para ser el campeón mundial?
                    </p>
                    
                    <a
                        href="https://chat.whatsapp.com/IsfbMxWuzW33zpedjmZcLB"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 bg-[#25D366] hover:bg-[#20ba5a] text-white pixel-border px-6 py-4 transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                    >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" style={{ display: 'inline' }}>
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.623-1.023-5.086-2.884-6.948C16.636 2.002 14.17 1.01 11.55 1.01c-5.44 0-9.866 4.372-9.87 9.802 0 1.96.512 3.878 1.483 5.581L2.126 20.4l4.52-1.246z"/>
                            <path d="M17.18 14.072c-.282-.14-.1.666-.35-.826-.226-.453-.68-.748-1.127-.923-.448-.175-1.63-.673-1.848-.76-.217-.087-.375-.13-.532.11-.157.24-.608.76-.745.92-.138.156-.275.175-.558.035-.282-.14-1.192-.44-2.27-1.402-.838-.748-1.405-1.67-1.57-1.95-.164-.28-.018-.433.123-.572.127-.125.282-.33.424-.495.143-.165.19-.28.285-.468.096-.188.048-.352-.024-.495-.072-.14-.608-1.464-.83-1.996-.217-.523-.473-.447-.648-.456-.17-.008-.363-.01-.557-.01-.193 0-.508.073-.775.362-.266.29-1.018.995-1.018 2.428 0 1.433 1.04 2.818 1.185 3.01.144.193 2.05 3.13 4.965 4.387.694.3 1.235.478 1.657.612.697.22 1.332.19 1.833.115.558-.083 1.713-.7 1.955-1.378.243-.677.243-1.258.17-1.377-.072-.116-.265-.187-.547-.327z"/>
                        </svg>
                        <span className="pixel-font text-[9px] uppercase ml-1">Unirse a WhatsApp</span>
                    </a>
                </div>
            </section>
            {/* END: PVPBanner */}

            {/* Modal de Conexión Manual de Solana */}
            {showSolanaManualModal && (
                <div className="fixed inset-0 max-w-[480px] mx-auto z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in animate-duration-200">
                    <div className="bg-white pixel-border max-w-sm w-full p-6 relative">
                        <button 
                            onClick={() => setShowSolanaManualModal(false)}
                            className="absolute top-2 right-4 text-3xl font-bold hover:text-red-600 transition-colors"
                        >
                            &times;
                        </button>
                        <h2 className="pixel-font text-[#9945FF] text-xs md:text-sm uppercase mb-4 text-center">
                            Conectar Solana Wallet
                        </h2>
                        <p className="text-gray-700 text-[10px] leading-relaxed mb-6 text-center">
                            No detectamos una billetera de Solana (como Phantom) en tu navegador. Puedes instalar la extensión o ingresar tu dirección públicamente para cargar tu progreso:
                        </p>
                        
                        <div className="flex flex-col gap-4">
                            <input 
                                type="text"
                                placeholder="Dirección pública de Solana (Base58)"
                                value={manualSolanaAddress}
                                onChange={(e) => setManualSolanaAddress(e.target.value)}
                                className="w-full px-3 py-2 text-xs border-2 border-black rounded focus:outline-none focus:border-[#9945FF]"
                            />
                            
                            <button
                                onClick={handleManualSolanaLogin}
                                className="bg-[#9945FF] hover:bg-[#803bd4] text-white pixel-border-sm px-6 py-3 text-center transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <span className="pixel-font text-[9px] uppercase">Cargar Dirección</span>
                            </button>

                            <div className="text-center text-[9px] font-bold text-gray-400 uppercase">ó</div>

                            <a
                                href="https://phantom.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-black hover:bg-gray-900 text-white pixel-border-sm px-6 py-3 text-center transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <span className="pixel-font text-[9px] uppercase">Descargar Phantom Wallet</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}



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
                .pixel-font {
                    font-family: 'Press Start 2P', cursive;
                }
                .pixel-border {
                    border: 4px solid #000;
                    box-shadow: 4px 4px 0px rgba(0,0,0,1);
                }
                .pixel-border-sm {
                    border: 2px solid #000;
                    box-shadow: 2px 2px 0px rgba(0,0,0,1);
                }
                .text-shadow-pixel {
                    text-shadow: 4px 4px 0px #000;
                }
                .grid-background {
                    background-image: 
                        linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                        linear-gradient(to bottom, #e5e7eb 1px, transparent 1px);
                    background-size: 24px 24px;
                }
                .cta-glow-primary {
                    box-shadow: 0 0 20px rgba(45, 90, 39, 0.4), 6px 6px 0px #000;
                }
                .cta-glow-primary:hover {
                    box-shadow: 0 0 30px rgba(45, 90, 39, 0.6), 4px 4px 0px #000;
                    transform: translate(2px, 2px);
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

