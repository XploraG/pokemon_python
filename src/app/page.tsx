"use client";

import React, { useState, useEffect } from 'react';
import GameCanvas from '../components/GameCanvas';
import { supabase } from '../lib/supabase';
import pokemonSpeciesList from '../../public/assets/economy/pokemon_species.json';

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

export default function Home() {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [activeSave, setActiveSave] = useState<SaveData | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMiniKitInstalled, setIsMiniKitInstalled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [mockAddressInput, setMockAddressInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Onboarding states for selecting starter Pokémon
    const [needsStarterSelection, setNeedsStarterSelection] = useState(false);
    const [pendingNewAddress, setPendingNewAddress] = useState<string | null>(null);
    const [pendingCustomName, setPendingCustomName] = useState<string | null>(null);
    const [selectedStarter, setSelectedStarter] = useState<string | null>(null);

    // Dev bypass states for normal browsers
    const [devClickCount, setDevClickCount] = useState(0);
    const [showDevPanel, setShowDevPanel] = useState(false);

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
                
                // Trigger transparent auto-login
                handleLoginWithWallet(tgId, tgName);
            } else {
                // Auto-login from cache (only if not in Telegram context)
                const savedWallet = localStorage.getItem('pixel_tamer_active_wallet');
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
        
        // Bulbapedia HP formula: Math.floor(((2 * base + iv) * level) / 100) + level + 10
        const baseHp = species ? species.hp : 40;
        const maxHp = Math.floor(((2 * baseHp + m.iv_hp) * m.nivel) / 100) + m.nivel + 10;
        
        let heldItems = m.held_items !== undefined && m.held_items !== null ? m.held_items : [null, null, null, null];
        while (heldItems.length < 4) {
            heldItems.push(null);
        }
        
        return {
            id: speciesName,
            id_captura: m.id_captura,
            rarity: species ? species.rarity.toLowerCase() : 'common',
            is_evolved: species ? (species as any).is_evolved || false : false,
            level: m.nivel,
            xp: m.xp,
            hp: m.hp_actual,
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

    const handleLoginWithWallet = async (address: string, customName?: string) => {
        setIsConnecting(true);
        setError(null);
        try {
            // Fetch save data from Supabase - case insensitive
            const { data, error: dbError } = await supabase
                .from('player_saves')
                .select('wallet_address, save_data, updated_at')
                .ilike('wallet_address', address)
                .maybeSingle();

            if (dbError) {
                console.error("Database query error:", dbError);
                setError("Error al conectar con la base de datos de guardado en la nube.");
                setIsConnecting(false);
                return;
            }

            if (data && data.save_data) {
                const databaseAddress = data.wallet_address || address;
                let saveState = { ...data.save_data };
                
                // Compare with local storage save to prevent data loss from network issues/unsaved states
                try {
                    const localSaves = JSON.parse(localStorage.getItem('pixel_tamer_saves') || '{}');
                    const localSave = localSaves[databaseAddress];
                    if (localSave && localSave.updated_at) {
                        const localTime = new Date(localSave.updated_at).getTime();
                        const dbTime = data.updated_at ? new Date(data.updated_at).getTime() : 0;
                        
                        if (localTime > dbTime + 1000) {
                            console.log("Local save is newer. Auto-syncing from local cache to cloud...", localSave);
                            saveState = { ...localSave };
                            
                            // Immediately sync the newer local save back to Supabase
                            await supabase
                                .from('player_saves')
                                .upsert({
                                    wallet_address: databaseAddress,
                                    save_data: saveState,
                                    updated_at: localSave.updated_at
                                });
                                
                            // Sync captured_monsters back to Supabase
                            const teamToSave = saveState.team_data || [];
                            const pcPokemonToSave = saveState.pc_pokemon || [];
                            const monsterRows = [
                                ...teamToSave.map((p: any, idx: number) => ({ ...p, is_team: true, team_order: idx })),
                                ...pcPokemonToSave.map((p: any, idx: number) => ({ ...p, is_team: false, team_order: idx }))
                            ].map((p: any) => {
                                const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === p.id.toLowerCase());
                                const specId = species ? species.id : 25;
                                return {
                                    id_captura: p.id_captura || generateUUID(),
                                    id_jugador: databaseAddress,
                                    especie_id: specId,
                                    nivel: p.level ?? 5,
                                    xp: p.xp ?? 0,
                                    hp_actual: p.hp ?? 10,
                                    iv_hp: p.ivs?.hp ?? 15,
                                    iv_ataque: p.ivs?.attack ?? 15,
                                    iv_defensa: p.ivs?.defense ?? 15,
                                    iv_velocidad: p.ivs?.speed ?? 15,
                                    es_shiny: p.is_shiny || false,
                                    moves: p.moves || [],
                                    is_team: p.is_team,
                                    team_order: p.team_order,
                                    unlocked_slots: p.unlocked_slots ?? 2,
                                    held_items: p.held_items || [null, null, null, null]
                                };
                            });
                            
                            if (monsterRows.length > 0) {
                                let { error: monstersUpsertErr } = await supabase
                                    .from('captured_monsters')
                                    .upsert(monsterRows);
                                if (monstersUpsertErr) {
                                    const fallbackRows = monsterRows.map(({ unlocked_slots, held_items, ...rest }) => rest);
                                    await supabase
                                        .from('captured_monsters')
                                        .upsert(fallbackRows);
                                }
                                
                                const activeIds = monsterRows.map(r => r.id_captura);
                                await supabase
                                    .from('captured_monsters')
                                    .delete()
                                    .eq('id_jugador', databaseAddress)
                                    .not('id_captura', 'in', `(${activeIds.join(',')})`);
                            }
                        }
                    }
                } catch (e) {
                    console.warn("Failed local save auto-sync:", e);
                }
                
                // Fetch captured monsters from Supabase
                const { data: dbMonsters, error: dbMonstersError } = await supabase
                    .from('captured_monsters')
                    .select('*')
                    .eq('id_jugador', databaseAddress);

                if (dbMonstersError) {
                    console.error("Error loading captured monsters:", dbMonstersError);
                }

                if (dbMonsters && dbMonsters.length > 0 && (!saveState.team_data || saveState.team_data.length === 0)) {
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
                            nivel: p.level ?? 5,
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
                            nivel: p.level ?? 5,
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
                localStorage.setItem('pixel_tamer_active_wallet', databaseAddress);
                setWalletAddress(databaseAddress);
                setActiveSave(saveState);
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

            const saveState: SaveData = {
                name: pendingCustomName || `Tamer-${pendingNewAddress.slice(0, 6)}`,
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
                        "tamer_ball": 5,
                        "potion": 3
                    }
                },
                team_data: [starterPoke],
                pc_pokemon: []
            };

            // First insert to captured_monsters
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

            // Referral processing disabled for now

            // Upsert to Supabase
            const { error: insertError } = await supabase
                .from('player_saves')
                .insert({
                    wallet_address: pendingNewAddress,
                    save_data: saveState
                });

            if (insertError) {
                console.error("Failed to initialize save state in database:", insertError);
                setError("No se pudo iniciar la partida en el servidor.");
                setIsConnecting(false);
                return;
            }

            // Save session credentials
            localStorage.setItem('pixel_tamer_active_wallet', pendingNewAddress);
            setWalletAddress(pendingNewAddress);
            setActiveSave(saveState);
            setNeedsStarterSelection(false);
            setPendingNewAddress(null);
            setPendingCustomName(null);
            setSelectedStarter(null);
        } catch (err) {
            console.error("Failed to save starter selection:", err);
            setError("Ocurrió un error inesperado al iniciar tu partida.");
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
    if (activeSave && walletAddress) {
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

    // Detect if Telegram and World App are active
    const isTelegram = typeof window !== 'undefined' && !!(window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;
    const isWorldApp = isMiniKitInstalled;
    const showRedirectPopup = !isTelegram && !isWorldApp;

    // Render Platform Redirect Screen for normal browsers (if developer bypass is not active)
    if (showRedirectPopup && !showDevPanel) {
        return (
            <div className="landing-container">
                <div className="landing-wrapper fade-in" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <h1 
                        className="landing-title retro-title"
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
                    >
                        Pixel Tamer
                    </h1>

                    <div className="pokemon-panel" style={{ padding: '20px', width: '100%', boxSizing: 'border-box', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '13px', color: '#d32f2f', textTransform: 'uppercase', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                            Acceso Restringido
                        </h2>
                        <p style={{ fontSize: '11px', color: '#3e2723', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                            Este juego está diseñado exclusivamente para ser jugado como una Mini App móvil dentro de **World App** o **Telegram**.
                        </p>
                        <p style={{ fontSize: '11px', color: '#5d4037', fontStyle: 'italic', margin: '0 0 20px 0' }}>
                            Por favor ingresa desde una de las siguientes opciones compatibles:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <a
                                href="https://t.me/PixelTamerBot/play"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pokemon-button success"
                                style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '11px', padding: '10px 0' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                                Jugar en Telegram (TMA)
                            </a>
                            <div style={{ fontSize: '9px', color: '#78909c', margin: '4px 0', fontWeight: 'bold', textTransform: 'uppercase' }}>ó</div>
                            <a
                                href="https://worldcoin.org/mini-app?app_id=app_6a783c64810d430744512e4207e07fce"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="pokemon-button"
                                style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '11px', padding: '10px 0', background: '#3e2723', color: '#fff' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                Descarga Pixel Tamer
                            </a>
                        </div>
                    </div>
                    <p style={{ fontSize: '9px', color: '#90a4ae', margin: 0 }}>
                        Pixel Tamer &copy; 2026
                    </p>
                </div>
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
                            {isWorldApp && (
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
                            )}

                            {/* Fallback Dev Login Box */}
                            {showDevPanel && (
                                <div className="create-form-card glass-panel fade-in" style={{ width: '100%', boxSizing: 'border-box' }}>
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

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowDevPanel(false);
                                            setDevClickCount(0);
                                        }}
                                        className="btn-secondary"
                                        style={{ width: '100%', fontSize: '10px', padding: '4px', marginTop: '10px', background: 'transparent', border: 'none', color: '#78909c', cursor: 'pointer' }}
                                    >
                                        &larr; Volver al bloqueo de plataforma
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

