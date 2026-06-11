"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Economy, EconomySaveData } from '../lib/Economy';
import { Inventory, InventorySaveData } from '../lib/Inventory';
import dailyMissions from '../../public/assets/economy/daily_missions.json';
import passiveRates from '../../public/assets/economy/passive_rates.json';
import pokemonSpeciesList from '../../public/assets/economy/pokemon_species.json';
import economyConfig from '../../public/assets/economy/config.json';
import { supabase } from '../lib/supabase';

interface GameCanvasProps {
    saveName: string;
    playerCoordinates: [number, number];
    initialMapPath: string;
    economyData?: EconomySaveData;
    inventoryData?: InventorySaveData;
    teamData?: any[];
    pcPokemonData?: any[];
    walletAddress?: string;
    onBackToMenu: () => void;
}

interface TileComponent {
    type: string;
    size: [number, number];
    image: string;
    imgElement?: HTMLImageElement;
}

interface MapEntity {
    location: string;
    x: number;
    y: number;
    w: number;
    h: number;
    name: string;
    dialog?: string;
    imgElement?: HTMLCanvasElement | HTMLImageElement;
    scale: number;
    frame?: { x: number; y: number; w: number; h: number };
}

interface WildBattle {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    captureRate: number;
}

// Helper function to remove background key color dynamically in canvas
const makeColorTransparent = (imgElement: HTMLImageElement, colorHex: string): HTMLCanvasElement | HTMLImageElement => {
    if (typeof window === 'undefined') return imgElement;
    try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imgElement.width;
        tempCanvas.height = imgElement.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return imgElement;

        tempCtx.drawImage(imgElement, 0, 0);
        const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imgData.data;

        // Target color. Default to parsed colorHex, fallback to top-left pixel (0,0) if opaque
        let rTarget = 200;
        let gTarget = 191;
        let bTarget = 231;
        let hasTarget = false;

        if (colorHex) {
            const cleanHex = colorHex.replace('#', '');
            if (cleanHex.length === 6) {
                rTarget = parseInt(cleanHex.slice(0, 2), 16);
                gTarget = parseInt(cleanHex.slice(2, 4), 16);
                bTarget = parseInt(cleanHex.slice(4, 6), 16);
                hasTarget = true;
            }
        }

        // If top-left pixel has alpha > 0, we prioritize it as it matches the actual drawn pixels in canvas context
        if (data[3] > 0) {
            rTarget = data[0];
            gTarget = data[1];
            bTarget = data[2];
            hasTarget = true;
        }

        if (hasTarget) {
            const tolerance = 25; // High tolerance to handle color profile compressions
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                // Make transparent if it matches target color and has alpha > 0
                if (a > 0 && Math.abs(r - rTarget) < tolerance && Math.abs(g - gTarget) < tolerance && Math.abs(b - bTarget) < tolerance) {
                    data[i + 3] = 0;
                }
            }
        }

        tempCtx.putImageData(imgData, 0, 0);
        return tempCanvas;
    } catch (e) {
        console.warn("Could not make color transparent:", e);
        return imgElement;
    }
};

export default function GameCanvas({
    saveName,
    playerCoordinates,
    initialMapPath,
    economyData,
    inventoryData,
    teamData = [],
    pcPokemonData = [],
    walletAddress,
    onBackToMenu
}: GameCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 640, height: 480 });
    
    // Core game state
    const [economy, setEconomy] = useState<Economy>(() => new Economy(economyData));
    const [inventory, setInventory] = useState<Inventory>(() => new Inventory(inventoryData));
    const [team, setTeam] = useState<any[]>(() => {
        return teamData.map((p: any) => ({
            ...p,
            hp: p.hp !== undefined ? p.hp : 100,
            maxHp: p.maxHp !== undefined ? p.maxHp : 100
        }));
    });
    const [pcPokemon, setPcPokemon] = useState<any[]>(() => {
        return pcPokemonData.map((p: any) => ({
            ...p,
            hp: p.hp !== undefined ? p.hp : 100,
            maxHp: p.maxHp !== undefined ? p.maxHp : 100
        }));
    });
    const [currentMapPath, setCurrentMapPath] = useState(initialMapPath);
    
    // HUD and Modal States
    const [activeDialog, setActiveDialog] = useState<string | null>(null);
    const [dialogName, setDialogName] = useState<string>('');
    const [showShop, setShowShop] = useState(false);
    const [showDaily, setShowDaily] = useState(false);
    const [showMissions, setShowMissions] = useState(false);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showPcModal, setShowPcModal] = useState(false);
    const [isBicycleActive, setIsBicycleActive] = useState(false);
    const [showNurseJoyModal, setShowNurseJoyModal] = useState(false);
    const [isHudMinimized, setIsHudMinimized] = useState(false);
    const [showPassiveModal, setShowPassiveModal] = useState(false);
    const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);
    const [activeWildBattle, setActiveWildBattle] = useState<WildBattle | null>(null);
    const [battleMessage, setBattleMessage] = useState<string>('¿Qué hará tu Pokémon?');
    const [showBallSelect, setShowBallSelect] = useState<boolean>(false);

    const showNotification = (title: string, message: string) => {
        setNotification({ title, message });
    };

    const formatTimeRemaining = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) {
            return `${h}h ${m}m`;
        }
        return `${m}m`;
    };

    const handleExecuteClaim = () => {
        const coinsClaimed = economyRef.current.claimPassiveIncome(team);
        if (coinsClaimed > 0) {
            showNotification("Reclamo Exitoso", `¡Has reclamado ${coinsClaimed.toLocaleString()} Coins generadas por tu equipo!`);
            economyRef.current.updateMissionProgress('claim');
            saveLocalEconomy();
            setEconomy(new Economy(economyRef.current.toSaveData()));
        } else {
            const timeRemaining = economyRef.current.getPassiveTimeRemaining();
            const mins = Math.ceil(timeRemaining / 60);
            showNotification("No Disponible", `Ya has reclamado hoy. Tiempo restante: ${mins} minutos.`);
        }
    };
    
    // Engine loading flags
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Loading assets...');

    // Refs to keep state variables fresh inside async loop and listeners
    const currentMapPathRef = useRef(currentMapPath);
    const activeDialogRef = useRef(activeDialog);
    const economyRef = useRef(economy);
    const inventoryRef = useRef(inventory);
    const teamRef = useRef(team);
    const pcPokemonRef = useRef(pcPokemon);
    const activeWildBattleRef = useRef(activeWildBattle);

    useEffect(() => { currentMapPathRef.current = currentMapPath; }, [currentMapPath]);
    useEffect(() => { activeWildBattleRef.current = activeWildBattle; }, [activeWildBattle]);
    useEffect(() => { activeDialogRef.current = activeDialog; }, [activeDialog]);
    useEffect(() => { economyRef.current = economy; }, [economy]);
    useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
    useEffect(() => { teamRef.current = team; }, [team]);
    useEffect(() => { pcPokemonRef.current = pcPokemon; }, [pcPokemon]);

    // Player position & movement states
    const playerRef = useRef({
        x: playerCoordinates[0],
        y: playerCoordinates[1],
        targetX: playerCoordinates[0],
        targetY: playerCoordinates[1],
        isMoving: false,
        moveDirection: 'down',
        animFrame: 0,
        animTimer: 0,
        speed: 4 // pixels per frame during interpolation (perfect divisor of 32)
    });
    
    // Return coordinates tracking when entering interior maps
    const returnCoordsRef = useRef<[number, number]>([playerCoordinates[0], playerCoordinates[1]]);

    // Map grids & preloaded entities references
    const mapDataRef = useRef<{
        grid: string[][];
        tileComponents: Record<string, TileComponent>;
        colliders: { x: number; y: number; w: number; h: number; dialog?: string; name: string }[];
        entities: MapEntity[];
        width: number;
        height: number;
        tileSize: number;
    }>({
        grid: [],
        tileComponents: {},
        colliders: [],
        entities: [],
        width: 0,
        height: 0,
        tileSize: 32
    });

    const playerSpriteRef = useRef<HTMLCanvasElement | HTMLImageElement | null>(null);
    const keysPressed = useRef<Record<string, boolean>>({});

    // Track layout resizing and client dimensions
    useEffect(() => {
        if (typeof window === 'undefined' || !wrapperRef.current) return;

        const handleResize = () => {
            if (wrapperRef.current) {
                setCanvasSize({
                    width: wrapperRef.current.clientWidth,
                    height: wrapperRef.current.clientHeight
                });
            }
        };

        handleResize();

        const observer = new ResizeObserver(() => {
            handleResize();
        });
        observer.observe(wrapperRef.current);

        window.addEventListener('resize', handleResize);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Load map assets and config JSON files
    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        async function loadGameAssets() {
            try {
                setLoadingMessage('Loading configuration...');
                
                const playerImg = new Image();
                playerImg.crossOrigin = "anonymous";
                playerImg.src = '/assets/entities/player/sprites.png';
                const playerImgPromise = new Promise((res) => {
                    playerImg.onload = res;
                    playerImg.onerror = res;
                });

                // Load player config, player sprites, and map JSON in parallel
                const [playerConfig, _, mapJson] = await Promise.all([
                    fetch('/assets/entities/player/main.json').then(r => r.json()),
                    playerImgPromise,
                    fetch(currentMapPath).then(r => r.json())
                ]);

                const playerColorKey = playerConfig.color_to_be_erased ?? '#C8BFE7';
                playerSpriteRef.current = makeColorTransparent(playerImg, playerColorKey);

                setLoadingMessage('Preloading map grid and sprites...');

                const gridPath = mapJson.map.replace('src/assets/', '/assets/');
                const tileSize = mapJson.tile_size ?? 32;

                // Prepare tile components preloading
                const tileComponents: Record<string, TileComponent> = {};
                const componentPromises = mapJson.components.map(async (comp: any) => {
                    const img = new Image();
                    const cleanPath = comp.image.startsWith('data:') ? comp.image : comp.image.replace('src/assets/', '/assets/');
                    if (!comp.image.startsWith('data:')) {
                        img.crossOrigin = "anonymous";
                    }
                    img.src = cleanPath;
                    await new Promise((res) => {
                        img.onload = res;
                        img.onerror = res;
                    });
                    tileComponents[comp.type] = {
                        type: comp.type,
                        size: comp.size,
                        image: cleanPath,
                        imgElement: img
                    };
                });

                // Prepare entity config & sprite preloading
                const entityDataPromises = mapJson.entities.map(async (ent: any) => {
                    const cleanLoc = ent.location.replace('src/assets/', '/assets/');
                    const entRes = await fetch(cleanLoc);
                    const entMeta = await entRes.json();

                    const cleanImgPath = entMeta.img.replace('src/assets/', '/assets/');
                    const entImg = new Image();
                    entImg.crossOrigin = "anonymous";
                    entImg.src = cleanImgPath;
                    await new Promise((res) => {
                        entImg.onload = res;
                        entImg.onerror = res;
                    });

                    return { ent, entMeta, entImg };
                });

                // Fetch grid text, preload tiles, and preload entities all in parallel!
                const [gridText, _tileComponentResults, entityDatas] = await Promise.all([
                    fetch(gridPath).then(r => r.text()),
                    Promise.all(componentPromises),
                    Promise.all(entityDataPromises)
                ]);

                // Synchronous processing begins
                const grid = gridText.trim().split('\n').map(line => line.trim().split(/\s+/));
                const height = grid.length * tileSize;
                const width = grid[0] ? grid[0].length * tileSize : 0;

                const preloadedEntities: MapEntity[] = [];
                const colliders: typeof mapDataRef.current.colliders = [];

                // Add automatic colliders for solid grid tiles (walls W1, counters C1, statues S1)
                for (let r = 0; r < grid.length; r++) {
                    for (let c = 0; c < grid[r].length; c++) {
                        const tileType = grid[r][c];
                        if (tileType === 'W1' || tileType === 'C1' || tileType === 'S1') {
                            colliders.push({
                                x: c * tileSize,
                                y: r * tileSize,
                                w: tileSize,
                                h: tileSize,
                                name: `Wall_${tileType}_${r}_${c}`
                            });
                        }
                    }
                }

                // Setup preloaded entities and their colliders
                for (const { ent, entMeta, entImg } of entityDatas) {
                    const colorKey = entMeta.color_to_be_erased ?? '#000000';
                    const transparentEntImg = makeColorTransparent(entImg, colorKey);

                    const scale = entMeta.scale ?? 2;
                    const firstFrame = entMeta.down?.[0] || entMeta.up?.[0] || entMeta.left?.[0] || entMeta.right?.[0];
                    const w = (firstFrame?.w ?? 32) * scale;
                    const h = (firstFrame?.h ?? 32) * scale;

                    const addEntityCoords = (x: number, y: number) => {
                        preloadedEntities.push({
                            location: ent.location,
                            x,
                            y,
                            w,
                            h,
                            name: entMeta.name,
                            dialog: entMeta.dialog,
                            imgElement: transparentEntImg,
                            scale,
                            frame: firstFrame
                        });
                        
                        const lowerName = entMeta.name.toLowerCase();
                        const lowerLoc = ent.location.toLowerCase();

                        // 1. Tree Colliders: centered trunk only, allowing player to walk behind leaves
                        if (lowerName.includes('tree') || lowerName.includes('arbol')) {
                            const trunkW = 24;
                            const trunkH = 32; // thick enough to prevent grid jumping
                            colliders.push({
                                x: x + (w - trunkW) / 2,
                                y: y + h - trunkH,
                                w: trunkW,
                                h: trunkH,
                                dialog: entMeta.dialog,
                                name: entMeta.name
                            });
                        } 
                        // 2. Pokemon Center Collider (leaves door open at bottom center)
                        else if (lowerLoc.includes('pokemoncenter')) {
                            const doorW = 32;
                            const doorX1 = x + 80 - doorW / 2;
                            const doorX2 = x + 80 + doorW / 2;
                            const baseTop = y + h * 0.45;
                            const baseBottom = y + h;

                            // Left base wall
                            colliders.push({
                                x: x,
                                y: baseTop,
                                w: doorX1 - x,
                                h: baseBottom - baseTop,
                                name: entMeta.name + " Left"
                            });

                            // Right base wall
                            colliders.push({
                                x: doorX2,
                                y: baseTop,
                                w: (x + w) - doorX2,
                                h: baseBottom - baseTop,
                                name: entMeta.name + " Right"
                            });

                            // Back wall inside door alcove (player gets blocked 24px deep into the door)
                            colliders.push({
                                x: doorX1,
                                y: baseTop,
                                w: doorW,
                                h: (baseBottom - 24) - baseTop,
                                name: entMeta.name + " Back"
                            });
                        } 
                        // 3. PokeMart Collider (leaves door open at bottom center)
                        else if (lowerLoc.includes('pokemonmarket')) {
                            const doorW = 32;
                            const doorX1 = x + 80 - doorW / 2;
                            const doorX2 = x + 80 + doorW / 2;
                            const baseTop = y + h * 0.45;
                            const baseBottom = y + h;

                            // Left base wall
                            colliders.push({
                                x: x,
                                y: baseTop,
                                w: doorX1 - x,
                                h: baseBottom - baseTop,
                                name: entMeta.name + " Left"
                            });

                            // Right base wall
                            colliders.push({
                                x: doorX2,
                                y: baseTop,
                                w: (x + w) - doorX2,
                                h: baseBottom - baseTop,
                                name: entMeta.name + " Right"
                            });

                            // Back wall inside door alcove
                            colliders.push({
                                x: doorX1,
                                y: baseTop,
                                w: doorW,
                                h: (baseBottom - 24) - baseTop,
                                name: entMeta.name + " Back"
                            });
                        } 
                        // 4. Other buildings and large structures
                        else if (
                            lowerName.includes('casa') || 
                            lowerName.includes('house') || 
                            lowerName.includes('gym') ||
                            lowerName.includes('comercio') ||
                            lowerName.includes('fountain') ||
                            lowerName.includes('greenhouse')
                        ) {
                            const baseTop = y + h * 0.45;
                            const baseBottom = y + h - 8;
                            colliders.push({
                                x: x,
                                y: baseTop,
                                w: w,
                                h: baseBottom - baseTop,
                                dialog: entMeta.dialog,
                                name: entMeta.name
                            });
                        } 
                        // 5. Bench / streetlights / small structures
                        else if (lowerName.includes('bench')) {
                            colliders.push({
                                x: x,
                                y: y + h * 0.3,
                                w: w,
                                h: h * 0.7 - 8,
                                dialog: entMeta.dialog,
                                name: entMeta.name
                            });
                        } 
                        // 6. Characters, Pokeballs, small NPCs
                        else {
                            const pw = w * 0.7;
                            const ph = h * 0.4;
                            colliders.push({
                                x: x + (w - pw) / 2,
                                y: y + h - ph,
                                w: pw,
                                h: ph,
                                dialog: entMeta.dialog,
                                name: entMeta.name
                            });
                        }
                    };

                    if (Array.isArray(ent.coordinates)) {
                        for (const coord of ent.coordinates) {
                            addEntityCoords(coord.x, coord.y);
                        }
                    } else if (ent.coordinates) {
                        addEntityCoords(ent.coordinates.x, ent.coordinates.y);
                    }
                }

                if (isMounted) {
                    mapDataRef.current = {
                        grid,
                        tileComponents,
                        colliders,
                        entities: preloadedEntities,
                        width,
                        height,
                        tileSize
                    };

                    // Sanitize/align player coordinates to match the grid offset of the loaded map
                    const isOutdoor = currentMapPath.includes('tutorial') || currentMapPath.includes('route1');
                    const pxCoord = playerRef.current.x;
                    const pyCoord = playerRef.current.y;
                    const cellX = Math.floor(pxCoord / tileSize);
                    const cellY = Math.floor(pyCoord / tileSize);
                    
                    if (isOutdoor) {
                        playerRef.current.x = cellX * tileSize + 24;
                        playerRef.current.y = cellY * tileSize + 12;
                    } else {
                        // All interior maps
                        playerRef.current.x = cellX * tileSize + 16;
                        playerRef.current.y = cellY * tileSize;
                    }
                    playerRef.current.targetX = playerRef.current.x;
                    playerRef.current.targetY = playerRef.current.y;
                    playerRef.current.isMoving = false;

                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to load map:", err);
                if (isMounted) {
                    setLoadingMessage('Error loading game assets. Please refresh.');
                }
            }
        }

        loadGameAssets();

        return () => {
            isMounted = false;
        };
    }, [currentMapPath]);

    // Handle game input and loops
    useEffect(() => {
        if (loading) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                keysPressed.current[key] = true;
                e.preventDefault();
            }
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleInteraction();
            }
            if (key === 'q') {
                e.preventDefault();
                setShowMenuModal(prev => !prev);
            }
            if (key === 'b') {
                e.preventDefault();
                setIsBicycleActive(prev => !prev);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key in keysPressed.current) {
                keysPressed.current[key] = false;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Core Render & Animation loop
        let animationFrameId: number;

        const updateAndRender = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) {
                animationFrameId = requestAnimationFrame(updateAndRender);
                return;
            }

            // 1. Process movement animation & inputs
            processMovement();

            // 2. Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 3. Camera centering
            const player = playerRef.current;
            const mapData = mapDataRef.current;
            
            const camX = Math.max(0, Math.min(player.x - canvas.width / 2, mapData.width - canvas.width));
            const camY = Math.max(0, Math.min(player.y - canvas.height / 2, mapData.height - canvas.height));

            // Offset centering if map size is smaller than the canvas resolution
            const offsetX = canvas.width > mapData.width ? Math.floor((canvas.width - mapData.width) / 2) : 0;
            const offsetY = canvas.height > mapData.height ? Math.floor((canvas.height - mapData.height) / 2) : 0;

            // 4. Render Grid layer
            const startCol = Math.max(0, Math.floor(camX / mapData.tileSize));
            const endCol = Math.min(mapData.grid[0]?.length ?? 0, Math.ceil((camX + canvas.width) / mapData.tileSize));
            const startRow = Math.max(0, Math.floor(camY / mapData.tileSize));
            const endRow = Math.min(mapData.grid.length, Math.ceil((camY + canvas.height) / mapData.tileSize));

            for (let r = startRow; r < endRow; r++) {
                for (let c = startCol; c < endCol; c++) {
                    const tileType = mapData.grid[r][c];
                    const tile = mapData.tileComponents[tileType];
                    if (tile && tile.imgElement) {
                        ctx.drawImage(
                            tile.imgElement,
                            c * mapData.tileSize - camX + offsetX,
                            r * mapData.tileSize - camY + offsetY,
                            mapData.tileSize,
                            mapData.tileSize
                        );
                    }
                }
            }

            // 5. Y-Sorted rendering (Player, NPCs, and Buildings drawn according to their bottom Y coordinate)
            const drawables: Array<{
                ySort: number;
                draw: (c: CanvasRenderingContext2D) => void;
            }> = [];

            // Add structures / NPCs
            for (const ent of mapData.entities) {
                drawables.push({
                    ySort: ent.y + ent.h,
                    draw: (c) => {
                        if (ent.imgElement) {
                            if (ent.frame) {
                                c.drawImage(
                                    ent.imgElement,
                                    ent.frame.x,
                                    ent.frame.y,
                                    ent.frame.w,
                                    ent.frame.h,
                                    ent.x - camX + offsetX,
                                    ent.y - camY + offsetY,
                                    ent.w,
                                    ent.h
                                );
                            } else {
                                c.drawImage(
                                    ent.imgElement,
                                    ent.x - camX + offsetX,
                                    ent.y - camY + offsetY,
                                    ent.w,
                                    ent.h
                                );
                            }
                        }
                    }
                });
            }

            // Add Player
            drawables.push({
                ySort: player.y, // stand player on coordinate
                draw: (c) => {
                    const sprite = playerSpriteRef.current;
                    if (sprite) {
                        let dirOffset = 0;
                        if (player.moveDirection === 'left') dirOffset = 48;
                        else if (player.moveDirection === 'up') dirOffset = 96;
                        else if (player.moveDirection === 'right') dirOffset = 144;

                        const frameWidth = 15;
                        const frameHeight = 20;
                        const scale = 2.5;

                        ctx.drawImage(
                            sprite,
                            dirOffset + player.animFrame * 16, // source x
                            12, // source y
                            frameWidth,
                            frameHeight,
                            player.x - camX - (frameWidth * scale) / 2 + offsetX, // center player on coordinate
                            player.y - camY - frameHeight * scale + offsetY, // stand player on coordinate
                            frameWidth * scale,
                            frameHeight * scale
                        );
                    }
                }
            });

            // Sort and Draw
            drawables.sort((a, b) => a.ySort - b.ySort);
            for (const drawable of drawables) {
                drawable.draw(ctx);
            }

            animationFrameId = requestAnimationFrame(updateAndRender);
        };

        animationFrameId = requestAnimationFrame(updateAndRender);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(animationFrameId);
        };
    }, [loading]);

    // Grid-based movement interpolation logic
    const processMovement = () => {
        const player = playerRef.current;
        const mapData = mapDataRef.current;

        // Set speed based on Bicycle mount state
        player.speed = isBicycleActive ? 8 : 4;

        if (player.isMoving) {
            let dx = player.targetX - player.x;
            let dy = player.targetY - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= player.speed) {
                player.x = player.targetX;
                player.y = player.targetY;
                player.isMoving = false;
                player.animFrame = 0;
                
                // Automatically check if player stepped onto a door tile
                const isWarped = checkAutoDoorEntry(player.x, player.y);
                if (!isWarped) {
                    // Check for wild encounter in tall grass (G2) on Route 1
                    const isRoute1 = currentMapPathRef.current.includes('route1');
                    const col = Math.floor(player.x / mapData.tileSize);
                    const row = Math.floor((player.y - 1) / mapData.tileSize);
                    const tileType = mapData.grid[row]?.[col];

                    if (isRoute1 && tileType === 'G2') {
                        const hasActivePoke = teamRef.current.some((p: any) => p.hp > 0);
                        if (hasActivePoke && Math.random() < 0.15) {
                            // Stop player movement
                            keysPressed.current = {};
                            player.isMoving = false;
                            player.animFrame = 0;

                            const playerLevel = economyRef.current.level;
                            const wildLvl = Math.max(1, playerLevel * 2 + Math.floor(Math.random() * 3) - 1);
                            const wildHp = 30 + wildLvl * 5;

                            setDialogName("Hierba Alta");
                            setActiveDialog(`¡Un Pikachu salvaje de Nvl. ${wildLvl} apareció!`);
                            
                            setBattleMessage("¿Qué hará tu Pokémon?");
                            setShowBallSelect(false);
                            setActiveWildBattle({
                                name: "Pikachu",
                                level: wildLvl,
                                hp: wildHp,
                                maxHp: wildHp,
                                captureRate: 0.35
                            });
                        }
                    }
                }
            } else {
                player.x += (dx / dist) * player.speed;
                player.y += (dy / dist) * player.speed;
 
                // Animate walk frames (faster if on bicycle!)
                player.animTimer += isBicycleActive ? 2 : 1;
                if (player.animTimer >= 8) {
                    player.animFrame = (player.animFrame + 1) % 3;
                    player.animTimer = 0;
                }
            }
        } else {
            // Block input and movement if any modal is active or dialog is open
            if (
                showMenuModal || 
                showNurseJoyModal || 
                showShop || 
                showDaily || 
                showMissions || 
                showInventoryModal || 
                activeWildBattleRef.current !== null ||
                activeDialogRef.current !== null
            ) {
                return;
            }
            let moveX = 0;
            let moveY = 0;
            let dir = player.moveDirection;

            if (keysPressed.current['w'] || keysPressed.current['arrowup']) {
                moveY = -1;
                dir = 'up';
            } else if (keysPressed.current['s'] || keysPressed.current['arrowdown']) {
                moveY = 1;
                dir = 'down';
            } else if (keysPressed.current['a'] || keysPressed.current['arrowleft']) {
                moveX = -1;
                dir = 'left';
            } else if (keysPressed.current['d'] || keysPressed.current['arrowright']) {
                moveX = 1;
                dir = 'right';
            }

            if (moveX !== 0 || moveY !== 0) {
                player.moveDirection = dir;
                
                const gridMoveDist = 32;
                const nextX = player.x + moveX * gridMoveDist;
                const nextY = player.y + moveY * gridMoveDist;

                // Collision bounds check
                if (nextX >= 0 && nextX < mapData.width && nextY >= 0 && nextY < mapData.height) {
                    // Bounding Box Check against solid structure colliders
                    // Player feet hitbox: 18px wide and 8px high centered at feet base
                    const pw = 18;
                    const ph = 8;
                    const px = nextX - pw / 2;
                    const py = nextY - ph;
                    let collides = false;

                    for (const collider of mapData.colliders) {
                        if (
                            px < collider.x + collider.w &&
                            px + pw > collider.x &&
                            py < collider.y + collider.h &&
                            py + ph > collider.y
                        ) {
                            collides = true;
                            break;
                        }
                    }

                    if (!collides) {
                        player.targetX = nextX;
                        player.targetY = nextY;
                        player.isMoving = true;
                        player.animFrame = 1;
                        player.animTimer = 0;
                        
                        setActiveDialog(null);
                    }
                }
            }
        }
    };

    // Check if player is standing on a door tile and automatically enter/interact
    const checkAutoDoorEntry = (x: number, y: number) => {
        const currentPath = currentMapPathRef.current;

        if (currentPath.includes('tutorial')) {
            // 1. Pokémon Center door check
            if (x >= 580 && x <= 620 && y >= 710 && y <= 730) {
                setDialogName("Centro Pokemon");
                setActiveDialog("Entering the Pokémon Center...");
                returnCoordsRef.current = [600, 748]; // Spawn below door when returning
                setTimeout(() => {
                    playerRef.current.x = 144;
                    playerRef.current.y = 224;
                    playerRef.current.targetX = 144;
                    playerRef.current.targetY = 224;
                    playerRef.current.isMoving = false;
                    setCurrentMapPath('/assets/maps/pokecenter/main.json');
                    setActiveDialog(null);
                }, 500);
                return true;
            }

            // 2. PokeMart door check
            if (x >= 560 && x <= 600 && y >= 1000 && y <= 1022) {
                setDialogName("Comercio Pokemon");
                setActiveDialog("Entering the PokeMart Store...");
                returnCoordsRef.current = [580, 1040]; // Spawn below door when returning
                setTimeout(() => {
                    playerRef.current.x = 144;
                    playerRef.current.y = 224;
                    playerRef.current.targetX = 144;
                    playerRef.current.targetY = 224;
                    playerRef.current.isMoving = false;
                    setCurrentMapPath('/assets/maps/pokemart/main.json');
                    setActiveDialog(null);
                }, 500);
                return true;
            }

            // 3. Gym door check
            if (x >= 370 && x <= 410 && y >= 180 && y <= 204) {
                setDialogName("Gimnasio");
                setActiveDialog("Entering the Gym...");
                returnCoordsRef.current = [396, 228];
                setTimeout(() => {
                    playerRef.current.x = 176;
                    playerRef.current.y = 288;
                    playerRef.current.targetX = 176;
                    playerRef.current.targetY = 288;
                    playerRef.current.isMoving = false;
                    setCurrentMapPath('/assets/maps/gym/main.json');
                    setActiveDialog(null);
                }, 500);
                return true;
            }

            // 4. House 1 door check
            if (x >= 140 && x <= 170 && y >= 700 && y <= 724) {
                setDialogName("Casa");
                setActiveDialog("Entering house...");
                returnCoordsRef.current = [154, 748];
                setTimeout(() => {
                    playerRef.current.x = 144;
                    playerRef.current.y = 224;
                    playerRef.current.targetX = 144;
                    playerRef.current.targetY = 224;
                    playerRef.current.isMoving = false;
                    setCurrentMapPath('/assets/maps/redhouse/main.json');
                    setActiveDialog(null);
                }, 500);
                return true;
            }

            // 5. House 2 door check
            if (x >= 310 && x <= 340 && y >= 700 && y <= 724) {
                setDialogName("Casa");
                setActiveDialog("Entering house...");
                returnCoordsRef.current = [329, 748];
                setTimeout(() => {
                    playerRef.current.x = 144;
                    playerRef.current.y = 224;
                    playerRef.current.targetX = 144;
                    playerRef.current.targetY = 224;
                    playerRef.current.isMoving = false;
                    setCurrentMapPath('/assets/maps/redhouse/main.json');
                    setActiveDialog(null);
                }, 500);
                return true;
            }

            // 6. Bottom edge warp to Route 1
            if (y >= 1060 && x >= 96 && x <= 680) {
                setDialogName("Ruta 1");
                setActiveDialog("Entering Route 1...");
                setTimeout(() => {
                    playerRef.current.x = x; // Keep same X coordinate
                    playerRef.current.y = 44; // Spawn at row 1 of Route 1 (y = 44) to prevent instant return warp
                    playerRef.current.targetX = x;
                    playerRef.current.targetY = 44;
                    playerRef.current.isMoving = false;
                    setCurrentMapPath('/assets/maps/route1/main.json');
                    setActiveDialog(null);
                }, 500);
                return true;
            }
        } else if (currentPath.includes('route1')) {
            // Top edge warp to Tutorial Town
            if (y <= 12) {
                setDialogName("Pueblo Tutorial");
                setActiveDialog("Returning to Town...");
                setTimeout(() => {
                    playerRef.current.x = x; // Keep same X coordinate
                    playerRef.current.y = 1036; // Spawn at row 32 of Town (y = 1036) to prevent instant return warp
                    playerRef.current.targetX = x;
                    playerRef.current.targetY = 1036;
                    playerRef.current.isMoving = false;
                    setCurrentMapPath('/assets/maps/tutorial/main.json');
                    setActiveDialog(null);
                }, 500);
                return true;
            }
        } else {
            // Interior maps exit checks: trigger warp if player steps on exit carpet (CP)
            const mapData = mapDataRef.current;
            const tileSize = mapData.tileSize || 32;
            const col = Math.floor(x / tileSize);
            const row = Math.floor((y - 1) / tileSize);
            const tileType = mapData.grid[row]?.[col];

            if (tileType === 'CP') {
                setDialogName("Exit");
                setActiveDialog("Exiting building...");
                setTimeout(() => {
                    const rx = returnCoordsRef.current[0];
                    const ry = returnCoordsRef.current[1];
                    playerRef.current.x = rx;
                    playerRef.current.y = ry;
                    playerRef.current.targetX = rx;
                    playerRef.current.targetY = ry;
                    playerRef.current.isMoving = false;
                    setCurrentMapPath('/assets/maps/tutorial/main.json');
                    setActiveDialog(null);
                }, 500);
                return true;
            }
        }

        return false;
    };

    // Interaction checks (facing building door or characters)
    const handleInteraction = () => {
        if (activeDialogRef.current !== null) {
            if (showNurseJoyModal) {
                return; // Don't close text bubble with Space while Joy's menu is open
            }
            setActiveDialog(null);
            return;
        }

        const player = playerRef.current;
        const mapData = mapDataRef.current;

        let rx = player.x - 16;
        let ry = player.y - 16;
        let rw = 32;
        let rh = 32;

        const interactDist = 64; // Check up to 2 tiles ahead to reach across counters
        if (player.moveDirection === 'up') {
            rx = player.x - 16;
            ry = player.y - interactDist;
            rw = 32;
            rh = interactDist;
        } else if (player.moveDirection === 'down') {
            rx = player.x - 16;
            ry = player.y;
            rw = 32;
            rh = interactDist;
        } else if (player.moveDirection === 'left') {
            rx = player.x - interactDist;
            ry = player.y - 16;
            rw = interactDist;
            rh = 32;
        } else if (player.moveDirection === 'right') {
            rx = player.x;
            ry = player.y - 16;
            rw = interactDist;
            rh = 32;
        }

        // Check if facing any structure or character
        for (const entity of mapData.entities) {
            const ex = entity.x;
            const ey = entity.y;
            const ew = entity.w;
            const eh = entity.h;

            if (
                rx < ex + ew &&
                rx + rw > ex &&
                ry < ey + eh &&
                ry + rh > ey
            ) {
                const lowerName = entity.name.toLowerCase();
                
                // Specific NPC interactions inside buildings
                if (entity.name === "Nurse Joy") {
                    setDialogName(entity.name);
                    setActiveDialog("¡Hola! ¿Qué te gustaría hacer hoy?");
                    setShowNurseJoyModal(true);
                    economyRef.current.updateMissionProgress('visit');
                }
                else if (entity.name === "Clerk") {
                    setDialogName(entity.name);
                    setActiveDialog("Welcome to the PokeMart! Talk to me to buy items.");
                    setShowShop(true);
                }
                else if (entity.name === "Gym Leader Brock") {
                    setDialogName(entity.name);

                    // Check if there is at least one active Pokemon
                    const activePokes = teamRef.current.filter(p => p.hp > 0);
                    if (activePokes.length === 0) {
                        setActiveDialog("¡Tus Pokémon están debilitados! Ve al Centro Pokémon para curarlos antes de retarme.");
                        return;
                    }

                    const result = economyRef.current.getGymReward(1);
                    if (result.coins > 0) {
                        setActiveDialog(`Impressive battle! You earned the Rock Medal and ${result.coins} Coins!`);
                        economyRef.current.updateMissionProgress('battle');
                        
                        // Simulate taking damage in battle
                        const updatedTeam = teamRef.current.map(p => {
                            const dmg = Math.floor(Math.random() * 40) + 15; // 15-55 damage
                            const newHp = Math.max(0, p.hp - dmg);
                            return { ...p, hp: newHp };
                        });
                        setTeam(updatedTeam);
                        saveLocalEconomy(updatedTeam);
                        setEconomy(new Economy(economyRef.current.toSaveData()));
                    } else {
                        setActiveDialog("Hello! Keep training hard to become a true Pokémon Master.");
                    }
                }
                else if (entity.name === "Grandma Rose") {
                    setDialogName(entity.name);
                    setActiveDialog(entity.dialog || "Hello young traveler!");
                }
                // Outer building interactions (on tutorial map)
                else if (lowerName.includes('comercio') || lowerName.includes('market') || lowerName.includes('mart')) {
                    setDialogName(entity.name);
                    setActiveDialog("Walk inside the PokeMart door to enter!");
                } 
                else if (lowerName.includes('centro') || lowerName.includes('center')) {
                    setDialogName(entity.name);
                    setActiveDialog("Walk inside the Pokémon Center door to heal your team!");
                }
                else if (lowerName.includes('gym')) {
                    setDialogName(entity.name);
                    setActiveDialog("Walk inside the Gym door to challenge Brock!");
                }
                else if (lowerName.includes('casa') || lowerName.includes('house') || lowerName.includes('redhouse')) {
                    setDialogName(entity.name);
                    setActiveDialog("Walk inside the door to visit!");
                }
                // Other general dialog NPCs
                else if (entity.dialog) {
                    setDialogName(entity.name);
                    setActiveDialog(entity.dialog);
                }
                break;
            }
        }
    };

    const saveLocalEconomy = async (updatedTeam?: any[], updatedPcPokemon?: any[]) => {
        const economyData = economyRef.current.toSaveData();
        const inventoryData = inventoryRef.current.toSaveData();
        const teamToSave = updatedTeam !== undefined ? updatedTeam : teamRef.current;
        const pcPokemonToSave = updatedPcPokemon !== undefined ? updatedPcPokemon : pcPokemonRef.current;
        
        const saveState = {
            name: saveName,
            time: 0,
            player_coordinates: [playerRef.current.x, playerRef.current.y],
            map: currentMapPathRef.current,
            economy_data: economyData,
            inventory_data: inventoryData,
            team_data: teamToSave,
            pc_pokemon: pcPokemonToSave
        };

        // 1. Save locally to localStorage
        const fullSaves = JSON.parse(localStorage.getItem('pixel_tamer_saves') || '{}');
        fullSaves[saveName] = saveState;
        localStorage.setItem('pixel_tamer_saves', JSON.stringify(fullSaves));

        // 2. Cloud sync to Supabase
        if (walletAddress) {
            try {
                const { error: syncError } = await supabase
                    .from('player_saves')
                    .upsert({
                        wallet_address: walletAddress,
                        save_data: saveState,
                        updated_at: new Date().toISOString()
                    });
                if (syncError) {
                    console.error("Failed to sync progress to cloud:", syncError);
                }
            } catch (err) {
                console.error("Cloud sync error:", err);
            }
        }
    };

    const handleMoveToPc = (index: number) => {
        if (team.length <= 1) {
            showNotification("Almacenamiento PC", "No puedes enviar tu último Pokémon a la PC. Debes tener al menos 1 en tu equipo.");
            return;
        }
        const pokemonToMove = team[index];
        const updatedTeam = team.filter((_, idx) => idx !== index);
        const updatedPc = [...pcPokemon, pokemonToMove];
        setTeam(updatedTeam);
        setPcPokemon(updatedPc);
        saveLocalEconomy(updatedTeam, updatedPc);
        showNotification("Almacenamiento PC", `¡${pokemonToMove.id} ha sido movido a la PC!`);
    };

    const handleMoveToTeam = (index: number) => {
        if (team.length >= 6) {
            showNotification("Almacenamiento PC", "Tu equipo está lleno (máximo 6 Pokémon). Envía uno a la PC primero.");
            return;
        }
        const pokemonToMove = pcPokemon[index];
        const updatedPc = pcPokemon.filter((_, idx) => idx !== index);
        const updatedTeam = [...team, pokemonToMove];
        setTeam(updatedTeam);
        setPcPokemon(updatedPc);
        saveLocalEconomy(updatedTeam, updatedPc);
        showNotification("Almacenamiento PC", `¡${pokemonToMove.id} se ha unido a tu equipo!`);
    };

    const handleBattleAttack = () => {
        if (!activeWildBattle) return;

        // Find active player pokemon (first with HP > 0)
        const activePokeIdx = team.findIndex((p: any) => p.hp > 0);
        if (activePokeIdx === -1) {
            showNotification("Centro Pokémon", "¡Todos tus Pokémon están debilitados!");
            setActiveWildBattle(null);
            return;
        }

        const activePoke = team[activePokeIdx];
        
        // 1. Player attacks wild Pokémon
        const playerDmg = Math.floor(Math.random() * 16) + 15; // 15-30 dmg
        const newWildHp = Math.max(0, activeWildBattle.hp - playerDmg);
        
        if (newWildHp <= 0) {
            // Wild Pokémon defeated!
            const minCoins = economyConfig.wild_battle_min_coins ?? 30;
            const maxCoins = economyConfig.wild_battle_max_coins ?? 50;
            const coinsEarned = Math.floor(Math.random() * (maxCoins - minCoins + 1)) + minCoins;
            economyRef.current.addCoins(coinsEarned);
            economyRef.current.updateMissionProgress('battle');
            
            showNotification(
                "¡Victoria!", 
                `¡Tu ${activePoke.id} causó ${playerDmg} de daño y derrotó al ${activeWildBattle.name} salvaje! Ganaste ${coinsEarned} Coins.`
            );
            setActiveWildBattle(null);
            saveLocalEconomy();
            setEconomy(new Economy(economyRef.current.toSaveData()));
            return;
        }

        // 2. Wild Pokémon counterattacks
        const wildDmg = Math.floor(Math.random() * 11) + 8; // 8-18 dmg
        const newPlayerHp = Math.max(0, activePoke.hp - wildDmg);

        const updatedTeam = [...team];
        updatedTeam[activePokeIdx] = { ...activePoke, hp: newPlayerHp };
        setTeam(updatedTeam);

        if (newPlayerHp <= 0) {
            // Active Pokémon fainted!
            const nextActiveIdx = updatedTeam.findIndex((p: any) => p.hp > 0);
            if (nextActiveIdx === -1) {
                // Entire team fainted! Blackout!
                showNotification(
                    "Derrota",
                    `¡Tu ${activePoke.id} se debilitó! Todo tu equipo ha sido debilitado. Fuiste llevado de urgencia al Centro Pokémon.`
                );
                
                // Warp to Pokemon Center
                playerRef.current.x = 144;
                playerRef.current.y = 224;
                playerRef.current.targetX = 144;
                playerRef.current.targetY = 224;
                playerRef.current.isMoving = false;
                setCurrentMapPath('/assets/maps/pokecenter/main.json');
                
                // Full heal team
                const fullyHealedTeam = updatedTeam.map((p: any) => ({ ...p, hp: p.maxHp }));
                setTeam(fullyHealedTeam);
                saveLocalEconomy(fullyHealedTeam);
                setActiveWildBattle(null);
                return;
            } else {
                setBattleMessage(
                    `¡Tu ${activePoke.id} recibió ${wildDmg} de daño y se debilitó! ¡Adelante, ${updatedTeam[nextActiveIdx].id}!`
                );
            }
        } else {
            setBattleMessage(
                `¡Tu ${activePoke.id} infligió ${playerDmg} de daño! El ${activeWildBattle.name} salvaje contraatacó con ${wildDmg} de daño.`
            );
        }

        saveLocalEconomy(updatedTeam);
    };

    const handleBattleCatch = (ballId: string) => {
        if (!activeWildBattle) return;

        // Check if player has the ball
        if (!inventoryRef.current.hasItem(ballId)) {
            showNotification("Mochila", "¡No tienes esa Pokeball!");
            return;
        }

        // Consume the ball
        inventoryRef.current.removeItem(ballId);
        setInventory(new Inventory(inventoryRef.current.toSaveData()));

        // Capture calculations
        let ballRate = 0.3;
        if (ballId === 'great_ball') ballRate = 0.5;
        else if (ballId === 'ultra_ball') ballRate = 0.75;
        else if (ballId === 'master_ball') ballRate = 1.0;

        const hpFactor = activeWildBattle.hp <= activeWildBattle.maxHp * 0.3 ? 1.5 : 1.0;
        const finalChance = ballRate * hpFactor;

        const success = Math.random() < finalChance;

        if (success) {
            // Find rarity and stats from species list
            const nameLower = activeWildBattle.name.toLowerCase();
            const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === nameLower);
            const rarity = species ? species.rarity.toLowerCase() : "uncommon";

            const newPoke = {
                id: activeWildBattle.name.toLowerCase(),
                rarity: rarity,
                is_evolved: false,
                hp: 100,
                maxHp: 100
            };

            economyRef.current.updateMissionProgress('capture');
            const newEconomyData = economyRef.current.toSaveData();

            if (team.length >= 6) {
                const updatedPc = [...pcPokemon, newPoke];
                setPcPokemon(updatedPc);
                saveLocalEconomy(team, updatedPc);
                
                showNotification(
                    "¡Capturado!", 
                    `¡Capturaste a ${activeWildBattle.name}! Pero tu equipo está lleno. Fue enviado a tu almacenamiento PC.`
                );
            } else {
                const updatedTeam = [...team, newPoke];
                setTeam(updatedTeam);
                saveLocalEconomy(updatedTeam, pcPokemon);
                
                showNotification(
                    "¡Capturado!",
                    `¡Felicidades! Capturaste a ${activeWildBattle.name} y se unió a tu equipo.`
                );
            }

            setEconomy(new Economy(newEconomyData));
            setActiveWildBattle(null);
            setShowBallSelect(false);
        } else {
            // Failed capture! Wild Pokémon attacks back.
            const activePokeIdx = team.findIndex((p: any) => p.hp > 0);
            if (activePokeIdx === -1) {
                setActiveWildBattle(null);
                setShowBallSelect(false);
                return;
            }

            const activePoke = team[activePokeIdx];
            const wildDmg = Math.floor(Math.random() * 11) + 8;
            const newPlayerHp = Math.max(0, activePoke.hp - wildDmg);

            const updatedTeam = [...team];
            updatedTeam[activePokeIdx] = { ...activePoke, hp: newPlayerHp };
            setTeam(updatedTeam);

            if (newPlayerHp <= 0) {
                const nextActiveIdx = updatedTeam.findIndex((p: any) => p.hp > 0);
                if (nextActiveIdx === -1) {
                    showNotification(
                        "Derrota",
                        `¡La Pokeball falló! El Pikachu salvaje contraatacó con ${wildDmg} de daño. ¡Tu equipo se debilitó por completo y fuiste llevado al Centro Pokémon!`
                    );
                    
                    playerRef.current.x = 144;
                    playerRef.current.y = 224;
                    playerRef.current.targetX = 144;
                    playerRef.current.targetY = 224;
                    playerRef.current.isMoving = false;
                    setCurrentMapPath('/assets/maps/pokecenter/main.json');
                    
                    const fullyHealedTeam = updatedTeam.map((p: any) => ({ ...p, hp: p.maxHp }));
                    setTeam(fullyHealedTeam);
                    saveLocalEconomy(fullyHealedTeam);
                    setActiveWildBattle(null);
                    setShowBallSelect(false);
                    return;
                } else {
                    setBattleMessage(
                        `¡La Pokeball falló! El Pikachu salvaje escapó y contraatacó con ${wildDmg} de daño, debilitando a tu ${activePoke.id}. ¡Adelante, ${updatedTeam[nextActiveIdx].id}!`
                    );
                }
            } else {
                setBattleMessage(
                    `¡Oh no! El ${activeWildBattle.name} salvaje se escapó de la Pokeball. ¡Te atacó e infligió ${wildDmg} de daño!`
                );
            }

            saveLocalEconomy(updatedTeam);
            setShowBallSelect(false);
        }
    };

    const handleBattleRun = () => {
        if (!activeWildBattle) return;

        const success = Math.random() < 0.70;

        if (success) {
            showNotification("Huir", "Escapaste a salvo de la batalla.");
            setActiveWildBattle(null);
        } else {
            const activePokeIdx = team.findIndex((p: any) => p.hp > 0);
            if (activePokeIdx === -1) {
                setActiveWildBattle(null);
                return;
            }

            const activePoke = team[activePokeIdx];
            const wildDmg = Math.floor(Math.random() * 11) + 8;
            const newPlayerHp = Math.max(0, activePoke.hp - wildDmg);

            const updatedTeam = [...team];
            updatedTeam[activePokeIdx] = { ...activePoke, hp: newPlayerHp };
            setTeam(updatedTeam);

            if (newPlayerHp <= 0) {
                const nextActiveIdx = updatedTeam.findIndex((p: any) => p.hp > 0);
                if (nextActiveIdx === -1) {
                    showNotification(
                        "Derrota",
                        `¡No pudiste escapar! El ${activeWildBattle.name} salvaje te atacó e infligió ${wildDmg} de daño, debilitando a todo tu equipo. Fuiste llevado al Centro Pokémon.`
                    );
                    
                    playerRef.current.x = 144;
                    playerRef.current.y = 224;
                    playerRef.current.targetX = 144;
                    playerRef.current.targetY = 224;
                    playerRef.current.isMoving = false;
                    setCurrentMapPath('/assets/maps/pokecenter/main.json');
                    
                    const fullyHealedTeam = updatedTeam.map((p: any) => ({ ...p, hp: p.maxHp }));
                    setTeam(fullyHealedTeam);
                    saveLocalEconomy(fullyHealedTeam);
                    setActiveWildBattle(null);
                    return;
                } else {
                    setBattleMessage(
                        `¡No pudiste escapar! El ${activeWildBattle.name} salvaje te atacó e infligió ${wildDmg} de daño, debilitando a tu ${activePoke.id}. ¡Adelante, ${updatedTeam[nextActiveIdx].id}!`
                    );
                }
            } else {
                setBattleMessage(
                    `¡No pudiste escapar! El ${activeWildBattle.name} salvaje bloqueó tu huida y te atacó causando ${wildDmg} de daño.`
                );
            }

            saveLocalEconomy(updatedTeam);
        }
    };

    const handleConvertPusdt = () => {
        const earned = economyRef.current.convertToPusdt(10000);
        if (earned > 0) {
            showNotification("Conversión Exitosa", `¡Has convertido con éxito 10,000 Coins a ${earned} PUSDT!`);
            saveLocalEconomy();
            setEconomy(new Economy(economyRef.current.toSaveData()));
        } else {
            showNotification("Fondos Insuficientes", "¡No tienes suficientes Coins! (Necesitas al menos 10,000 Coins).");
        }
    };

    const handleNurseHeal = () => {
        if (!economyRef.current.canFreeHeal()) {
            showNotification("Centro Pokémon", "Joy: Ya has curado gratis a tu equipo 2 veces hoy. Vuelve mañana o usa la opción de revivir.");
            return;
        }

        const success = economyRef.current.executeFreeHeal();
        if (success) {
            const healedTeam = teamRef.current.map(p => ({ ...p, hp: p.maxHp }));
            setTeam(healedTeam);
            saveLocalEconomy(healedTeam);
            setEconomy(new Economy(economyRef.current.toSaveData()));
            showNotification("Centro Pokémon", "Joy: He curado a tus Pokémon al 100%. ¡Que tengas un buen día!");
            setShowNurseJoyModal(false);
            setActiveDialog(null);
        }
    };

    const handleNurseRevive = () => {
        const cost = economyRef.current.getReviveCost();
        if (economyRef.current.coins < cost) {
            showNotification("Fondos Insuficientes", `Joy: No tienes suficientes monedas. (Costo: ${cost} Coins, Tienes: ${economyRef.current.coins})`);
            return;
        }

        const success = economyRef.current.executePaidRevive();
        if (success) {
            const revivedTeam = teamRef.current.map(p => ({ ...p, hp: p.maxHp }));
            setTeam(revivedTeam);
            saveLocalEconomy(revivedTeam);
            setEconomy(new Economy(economyRef.current.toSaveData()));
            showNotification("Centro Pokémon", `Joy: He revivido y curado a tu equipo por completo. Se han descontado ${cost} Coins.`);
            setShowNurseJoyModal(false);
            setActiveDialog(null);
        }
    };

    const renderTeamHpList = () => {
        return (
            <div className="pokemon-team-list">
                {team.map((p, idx) => {
                    const pct = Math.round((p.hp / p.maxHp) * 100);
                    let hpClass = "pokemon-hp-fill";
                    if (pct < 20) hpClass += " low";
                    else if (pct < 50) hpClass += " medium";

                    return (
                        <div key={idx} className="pokemon-team-item">
                            <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                                {p.id} (Nvl. {economy.level * 5})
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{p.hp}/{p.maxHp} HP</span>
                                <div className="pokemon-hp-bar">
                                    <div className={hpClass} style={{ width: `${pct}%` }}></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="game-container">
            {/* Visual game Canvas wrapper */}
            <div className="canvas-wrapper" ref={wrapperRef}>
                <canvas 
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                />

                {/* Floating Menu Button */}
                <button onClick={() => setShowMenuModal(true)} className="floating-menu-btn">
                    ☰ MENU (Q)
                </button>

                {/* HUD Overlay */}
                <div 
                    className={`hud-panel ${isHudMinimized ? 'minimized' : ''}`}
                    onClick={() => {
                        if (isHudMinimized) {
                            setIsHudMinimized(false);
                        }
                    }}
                >
                    <div className="hud-header">
                        <span className="hud-title">
                            {isHudMinimized ? `💰 ${economy.getFormattedCoins()} | Lvl ${economy.level}` : '🏆 Trainer Stats'}
                        </span>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent card onClick trigger when clicking button
                                setIsHudMinimized(!isHudMinimized);
                            }}
                            className="hud-toggle-btn"
                            title={isHudMinimized ? "Expand HUD" : "Minimize HUD"}
                        >
                            {isHudMinimized ? '＋' : '－'}
                        </button>
                    </div>

                    {!isHudMinimized && (
                        <div className="hud-content">
                            <div className="hud-row coins">
                                <span>Coins:</span>
                                <span>{economy.getFormattedCoins()}</span>
                            </div>
                            <div className="hud-row pusdt">
                                <span>PUSDT:</span>
                                <span>{economy.getFormattedPusdt()}</span>
                            </div>
                            <div className="hud-row level" style={{ color: '#63b3ed' }}>
                                <span>Level:</span>
                                <span>{economy.level}</span>
                            </div>
                            <div className="hud-row bicycle">
                                <span>Bicycle:</span>
                                <span style={{ color: isBicycleActive ? '#a8e6cf' : '#ff8888' }}>
                                    {isBicycleActive ? 'ON' : 'OFF'}
                                </span>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleConvertPusdt();
                                }}
                                className="hud-button"
                            >
                                Convert 10k Coins → 1 PUSDT
                            </button>
                        </div>
                    )}
                </div>

                {/* Controls Info overlay */}
                <div className="controls-info">
                    Controls: WASD/Arrows to Move | Space/Enter to Talk
                </div>

                {/* Dialogue bubble */}
                {activeDialog && (
                    <div className="dialogue-box glass-panel fade-in">
                        <div className="dialogue-speaker">{dialogName}</div>
                        <div className="dialogue-text">{activeDialog}</div>
                        <div className="dialogue-footer">Press Space/Enter to close</div>
                    </div>
                )}
            </div>

            {/* --- Modals --- */}
            {showMenuModal && (
                <div className="modal-overlay">
                    <div className="modal-card pokemon-panel">
                        <div className="modal-header">
                            <h3 className="modal-title">Pixel Tamer Menu</h3>
                            <button onClick={() => setShowMenuModal(false)} className="modal-close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: '16px', fontWeight: 'bold' }}>
                                Entrenador Nivel: {economy.level}
                            </div>
                            
                            {/* Render Pokemon HP Bars inside Menu */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Tu Equipo:</div>
                                {renderTeamHpList()}
                            </div>

                            <button 
                                onClick={() => {
                                    setIsBicycleActive(prev => !prev);
                                    setShowMenuModal(false);
                                }}
                                className="pokemon-button success"
                            >
                                🚲 Montar Bicicleta: {isBicycleActive ? 'OFF' : 'ON'}
                            </button>

                            <button 
                                onClick={() => {
                                    setShowPassiveModal(true);
                                    setShowMenuModal(false);
                                }}
                                className="pokemon-button"
                            >
                                Claim Passive Income
                            </button>

                            <button 
                                onClick={() => {
                                    setShowShop(true);
                                    setShowMenuModal(false);
                                }}
                                className="pokemon-button"
                            >
                                🛒 PokeMart Store
                            </button>

                            <button 
                                onClick={() => {
                                    const result = economy.checkLoginStreak();
                                    if (result.reward_coins > 0) {
                                        showNotification("Recompensa Diaria", `¡Recompensa del Día ${result.streak}: Recibiste ${result.reward_coins} Coins!`);
                                        saveLocalEconomy();
                                    } else {
                                        showNotification("Racha Diaria", `Día de racha ${result.streak} verificado. ¡Ya reclamaste tu recompensa de hoy!`);
                                    }
                                    setShowDaily(true);
                                    setShowMenuModal(false);
                                }}
                                className="pokemon-button"
                            >
                                🔥 Login Streak
                            </button>

                            <button 
                                onClick={() => {
                                    setShowMissions(true);
                                    setShowMenuModal(false);
                                }}
                                className="pokemon-button"
                            >
                                🏆 Daily Missions
                            </button>

                            <button 
                                onClick={() => {
                                    setShowInventoryModal(true);
                                    setShowMenuModal(false);
                                }}
                                className="pokemon-button"
                            >
                                🎒 Mochila (Items)
                            </button>

                            <button 
                                onClick={() => {
                                    setShowPcModal(true);
                                    setShowMenuModal(false);
                                }}
                                className="pokemon-button"
                            >
                                💻 Almacenamiento PC
                            </button>

                            {/* Cheat/Level Up Button for Testing Cost Scaling! */}
                            <button 
                                onClick={() => {
                                    economy.level += 1;
                                    setEconomy(new Economy(economy.toSaveData()));
                                    saveLocalEconomy();
                                }}
                                className="pokemon-button"
                                style={{ background: '#e0f7fa' }}
                            >
                                ⚡ Level Up (Test Cost Scaling)
                            </button>

                            <button 
                                onClick={() => {
                                    saveLocalEconomy();
                                    onBackToMenu();
                                }}
                                className="pokemon-button danger"
                            >
                                Cerrar Sesión (Log Out)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showNurseJoyModal && (
                <div className="modal-overlay">
                    <div className="modal-card pokemon-panel">
                        <div className="modal-header">
                            <h3 className="modal-title">Centro Pokémon - Joy</h3>
                            <button onClick={() => {
                                setShowNurseJoyModal(false);
                                setActiveDialog(null);
                            }} className="modal-close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '16px' }}>
                                Joy: "¡Hola! ¿Qué te gustaría hacer hoy?"
                            </p>
                            
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>Estado de tu Equipo:</div>
                                {renderTeamHpList()}
                            </div>

                            <button 
                                onClick={handleNurseHeal}
                                className="pokemon-button success"
                            >
                                💚 Curar Equipo (Gratis, {2 - economy.heals_today}/2 Hoy)
                            </button>

                            <button 
                                onClick={handleNurseRevive}
                                className="pokemon-button"
                                style={{ background: '#ffe082' }}
                            >
                                ⚡ Revivir y Curar (Costo: {economy.getReviveCost()} Coins)
                            </button>

                            <button 
                                onClick={() => {
                                    setShowNurseJoyModal(false);
                                    setActiveDialog(null);
                                }}
                                className="pokemon-button danger"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showShop && (
                <div className="modal-overlay">
                    <div className="modal-card pokemon-panel">
                        <div className="modal-header">
                            <h3 className="modal-title">PokeMart Store</h3>
                            <button onClick={() => setShowShop(false)} className="modal-close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="shop-item-row">
                                <div className="shop-item-info">
                                    <div className="shop-item-name">Pokeball</div>
                                    <div className="shop-item-desc">Basic capturing ball (30% rate)</div>
                                </div>
                                <button 
                                    onClick={() => {
                                        if (economy.spendCoins(200)) {
                                            inventory.addItem('pokeball');
                                            economy.updateMissionProgress('spend', 200);
                                            saveLocalEconomy();
                                            showNotification("Compra Exitosa", "¡Compraste 1 Pokeball con éxito!");
                                            setEconomy(new Economy(economy.toSaveData()));
                                        } else {
                                            showNotification("Fondos Insuficientes", "¡No tienes suficientes Coins para comprar esta Pokeball!");
                                        }
                                    }}
                                    className="shop-buy-btn"
                                >
                                    200 Coins
                                </button>
                            </div>
                            <div className="shop-item-row">
                                <div className="shop-item-info">
                                    <div className="shop-item-name">Potion</div>
                                    <div className="shop-item-desc">Heals 20 HP</div>
                                </div>
                                <button 
                                    onClick={() => {
                                        if (economy.spendCoins(300)) {
                                            inventory.addItem('potion');
                                            economy.updateMissionProgress('spend', 300);
                                            saveLocalEconomy();
                                            showNotification("Compra Exitosa", "¡Compraste 1 Poción con éxito!");
                                            setEconomy(new Economy(economy.toSaveData()));
                                        } else {
                                            showNotification("Fondos Insuficientes", "¡No tienes suficientes Coins para comprar esta Poción!");
                                        }
                                    }}
                                    className="shop-buy-btn"
                                >
                                    300 Coins
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}               {showDaily && (
                <div className="modal-overlay">
                    <div className="modal-card pokemon-panel">
                        <div className="modal-header">
                            <h3 className="modal-title">Daily Login Streak</h3>
                            <button onClick={() => setShowDaily(false)} className="modal-close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="daily-streak-card" style={{ background: 'rgba(255, 255, 255, 0.45)', border: '1px dashed #3e2723' }}>
                                <div className="daily-streak-val">{economy.login_streak} Days</div>
                                <div className="daily-streak-label">Consecutive logins streak</div>
                            </div>
                            <p className="daily-streak-desc">
                                Log in daily to scale your rewards up to 15,000 Coins and Master Balls! Miss a day and it resets.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {showMissions && (
                <div className="modal-overlay">
                    <div className="modal-card pokemon-panel">
                        <div className="modal-header">
                            <h3 className="modal-title">Daily Missions</h3>
                            <button onClick={() => setShowMissions(false)} className="modal-close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            {dailyMissions.missions.map((m: any) => {
                                const prog = economy.daily_missions_progress[m.id] ?? 0;
                                const pct = Math.min(100, (prog / m.target) * 100);
                                return (
                                    <div key={m.id} className="mission-item-row">
                                        <div className="mission-header">
                                            <span>{m.description}</span>
                                            <span className="mission-progress-lbl">{prog}/{m.target}</span>
                                        </div>
                                        <div className="progress-bar-container">
                                            <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                                        </div>
                                        <div className="mission-reward">Reward: {m.reward_coins} Coins</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {showInventoryModal && (
                <div className="modal-overlay">
                    <div className="modal-card pokemon-panel">
                        <div className="modal-header">
                            <h3 className="modal-title">Mochila (Items)</h3>
                            <button onClick={() => setShowInventoryModal(false)} className="modal-close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            {inventory.getAllItems().length === 0 ? (
                                <div className="inventory-empty">Tu mochila está vacía.</div>
                            ) : (
                                inventory.getAllItems().map((item: any) => (
                                    <div key={item.id} className="shop-item-row">
                                        <div className="shop-item-info">
                                            <div className="shop-item-name">{item.name || item.id}</div>
                                            <div className="shop-item-desc">{item.description}</div>
                                        </div>
                                        <div className="inventory-item-qty">
                                            x{item.quantity}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showPcModal && (
                <div className="modal-overlay">
                    <div className="modal-card pokemon-panel">
                        <div className="modal-header">
                            <h3 className="modal-title">Almacenamiento PC</h3>
                            <button onClick={() => setShowPcModal(false)} className="modal-close-btn">&times;</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <h4 style={{ fontWeight: 'bold', fontSize: '13px', margin: '0 0 8px 0', borderBottom: '1px solid #3e2723', paddingBottom: '4px' }}>
                                    Tu Equipo ({team.length}/6)
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {team.map((p: any, idx: number) => {
                                        const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === p.id.toLowerCase());
                                        const sprite = species ? species.sprite : '';
                                        const hourlyRate = species ? species.gold_per_hour : 5;
                                        const dailyIncome = p.is_evolved ? Math.floor(hourlyRate * 24 * 1.25) : (hourlyRate * 24);

                                        return (
                                            <div key={idx} className="shop-item-row" style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', gap: '8px', margin: 0 }}>
                                                {sprite && <img src={sprite} alt={p.id} style={{ width: '36px', height: '36px', imageRendering: 'pixelated' }} />}
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ textTransform: 'capitalize', fontWeight: 'bold', fontSize: '12px' }}>{p.id}</span>
                                                    <span style={{ fontSize: '10px', color: '#5d4037' }}>
                                                        +{dailyIncome} Coins/Día
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleMoveToPc(idx)}
                                                    disabled={team.length <= 1}
                                                    className="shop-buy-btn"
                                                    style={{ padding: '4px 8px', fontSize: '10px', opacity: team.length <= 1 ? 0.5 : 1, cursor: team.length <= 1 ? 'not-allowed' : 'pointer' }}
                                                >
                                                    Mover a PC
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <h4 style={{ fontWeight: 'bold', fontSize: '13px', margin: '0 0 8px 0', borderBottom: '1px solid #3e2723', paddingBottom: '4px' }}>
                                    Almacenamiento PC ({pcPokemon.length})
                                </h4>
                                {pcPokemon.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: '#5d4037', fontStyle: 'italic' }}>
                                        No tienes Pokémon en la PC.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                                        {pcPokemon.map((p: any, idx: number) => {
                                            const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === p.id.toLowerCase());
                                            const sprite = species ? species.sprite : '';
                                            const hourlyRate = species ? species.gold_per_hour : 5;
                                            const dailyIncome = p.is_evolved ? Math.floor(hourlyRate * 24 * 1.25) : (hourlyRate * 24);

                                            return (
                                                <div key={idx} className="shop-item-row" style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', gap: '8px', margin: 0 }}>
                                                    {sprite && <img src={sprite} alt={p.id} style={{ width: '36px', height: '36px', imageRendering: 'pixelated' }} />}
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ textTransform: 'capitalize', fontWeight: 'bold', fontSize: '12px' }}>{p.id}</span>
                                                        <span style={{ fontSize: '10px', color: '#5d4037' }}>
                                                            +{dailyIncome} Coins/Día
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleMoveToTeam(idx)}
                                                        disabled={team.length >= 6}
                                                        className="shop-buy-btn"
                                                        style={{ padding: '4px 8px', fontSize: '10px', opacity: team.length >= 6 ? 0.5 : 1, cursor: team.length >= 6 ? 'not-allowed' : 'pointer' }}
                                                    >
                                                        Mover a Equipo
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => setShowPcModal(false)}
                                className="pokemon-button danger"
                                style={{ width: '100%', marginTop: '8px' }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Passive Generation Detailed Modal --- */}
            {showPassiveModal && (
                <div className="modal-overlay">
                    <div className="modal-card pokemon-panel">
                        <div className="modal-header">
                            <h3 className="modal-title">Generación Pasiva</h3>
                            <button onClick={() => setShowPassiveModal(false)} className="modal-close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '12px' }}>
                                Tus Pokémon generan monedas pasivas automáticamente cada 24 horas:
                            </p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                {team.slice(0, 6).map((p: any, idx: number) => {
                                    const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === p.id.toLowerCase());
                                    const rarity = p.rarity || (species ? species.rarity.toLowerCase() : 'common');
                                    const hourlyRate = species ? species.gold_per_hour : 5;
                                    const base = hourlyRate * 24;
                                    const finalRate = p.is_evolved ? Math.floor(base * 1.25) : base;

                                    return (
                                        <div key={idx} className="pokemon-team-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', background: 'rgba(255, 255, 255, 0.45)', border: '1px dashed #3e2723', padding: '8px 12px', borderRadius: '4px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontWeight: 'bold' }}>
                                                <span style={{ textTransform: 'capitalize' }}>{p.id}</span>
                                                <span style={{ 
                                                    fontSize: '10px', 
                                                    textTransform: 'uppercase', 
                                                    color: rarity === 'common' || rarity === 'common' ? '#71717a' : 
                                                           rarity === 'uncommon' || rarity === 'uncommon' ? '#2e7d32' : 
                                                           rarity === 'rare' || rarity === 'rare' ? '#1976d2' : 
                                                           rarity === 'epic' || rarity === 'ultra_rare' ? '#7b1fa2' : 
                                                           rarity === 'legendary' || rarity === 'legendary' ? '#f57c00' : '#d32f2f' 
                                                }}>
                                                    {rarity}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '11px', color: '#5d4037' }}>
                                                <span>Base: {base} Coins/Día ({hourlyRate}/hora)</span>
                                                {p.is_evolved && <span style={{ color: '#2e7d32' }}>Evolved (+25%)</span>}
                                                <span style={{ fontWeight: 'bold' }}>+{finalRate} Coins/Día</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ borderTop: '2px solid #3e2723', paddingTop: '12px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
                                    <span>Total Diario:</span>
                                    <span>{economy.calculatePassiveIncome(team).toLocaleString()} Coins</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#5d4037', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Estado del reclamo:</span>
                                    <span style={{ fontWeight: 'bold', color: economy.getPassiveTimeRemaining() <= 0 ? '#2e7d32' : '#d32f2f' }}>
                                        {economy.getPassiveTimeRemaining() <= 0 ? '¡Disponible!' : `Reclamado (Espera: ${formatTimeRemaining(economy.getPassiveTimeRemaining())})`}
                                    </span>
                                </div>
                            </div>

                            <button 
                                onClick={handleExecuteClaim}
                                className={`pokemon-button ${economy.getPassiveTimeRemaining() <= 0 ? 'success' : ''}`}
                                disabled={economy.getPassiveTimeRemaining() > 0}
                                style={{ opacity: economy.getPassiveTimeRemaining() > 0 ? 0.6 : 1, cursor: economy.getPassiveTimeRemaining() > 0 ? 'not-allowed' : 'pointer' }}
                            >
                                💰 Reclamar Coins
                            </button>

                            <button 
                                onClick={() => setShowPassiveModal(false)}
                                className="pokemon-button danger"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Wild Battle Modal */}
            {activeWildBattle && !activeDialog && (
                <div className="modal-overlay" style={{ zIndex: 200 }}>
                    <div className="modal-card pokemon-panel" style={{ maxWidth: '420px', width: '90%' }}>
                        <div className="modal-header" style={{ justifyContent: 'center' }}>
                            <h3 className="modal-title">¡Batalla Pokémon!</h3>
                        </div>
                        <div className="modal-body" style={{ padding: '8px 12px' }}>
                            {/* Wild Pokemon Info */}
                            <div className="battle-pokemon-card wild" style={{ background: 'rgba(255, 235, 235, 0.45)', border: '1px dashed #d32f2f', padding: '10px', borderRadius: '4px', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                    <span style={{ color: '#d32f2f' }}>💥 Wild {activeWildBattle.name}</span>
                                    <span>Nvl. {activeWildBattle.level}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                    <span style={{ fontSize: '11px' }}>HP: {activeWildBattle.hp}/{activeWildBattle.maxHp}</span>
                                    <div className="pokemon-hp-bar" style={{ flex: 1, height: '8px' }}>
                                        <div 
                                            className="pokemon-hp-fill" 
                                            style={{ 
                                                width: `${Math.round((activeWildBattle.hp / activeWildBattle.maxHp) * 100)}%`,
                                                background: activeWildBattle.hp / activeWildBattle.maxHp < 0.3 ? '#f44336' : (activeWildBattle.hp / activeWildBattle.maxHp < 0.6 ? '#ffeb3b' : '#4caf50')
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Active Player Pokemon Info */}
                            {(() => {
                                const activePoke = team.find((p: any) => p.hp > 0);
                                if (!activePoke) return <div style={{ color: '#d32f2f', fontWeight: 'bold', textAlign: 'center' }}>¡No tienes Pokémon activos!</div>;
                                const pct = Math.round((activePoke.hp / activePoke.maxHp) * 100);

                                return (
                                    <div className="battle-pokemon-card player" style={{ background: 'rgba(235, 255, 235, 0.45)', border: '1px dashed #2e7d32', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                            <span style={{ color: '#2e7d32', textTransform: 'capitalize' }}>🟢 Tu {activePoke.id}</span>
                                            <span>Nvl. {economy.level * 5}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                            <span style={{ fontSize: '11px' }}>HP: {activePoke.hp}/{activePoke.maxHp}</span>
                                            <div className="pokemon-hp-bar" style={{ flex: 1, height: '8px' }}>
                                                <div 
                                                    className="pokemon-hp-fill" 
                                                    style={{ 
                                                        width: `${pct}%`,
                                                        background: pct < 20 ? '#f44336' : (pct < 50 ? '#ffeb3b' : '#4caf50')
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Battle Log Message */}
                            <div className="battle-log" style={{ background: '#f5f0e1', border: '2px solid #3e2723', padding: '10px', borderRadius: '4px', minHeight: '50px', fontSize: '12px', color: '#3e2723', fontWeight: 'bold', marginBottom: '16px', lineHeight: '1.4' }}>
                                {battleMessage}
                            </div>

                            {/* Battle Options */}
                            {!showBallSelect ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <button 
                                        onClick={handleBattleAttack}
                                        className="pokemon-button success"
                                        style={{ background: '#d32f2f', color: '#fff' }}
                                        disabled={!team.some((p: any) => p.hp > 0)}
                                    >
                                        ⚔️ Luchar (Atacar)
                                    </button>
                                    <button 
                                        onClick={() => setShowBallSelect(true)}
                                        className="pokemon-button"
                                        style={{ background: '#ffe082' }}
                                    >
                                        🎒 Capturar (Usar Pokeball)
                                    </button>
                                    <button 
                                        onClick={handleBattleRun}
                                        className="pokemon-button danger"
                                    >
                                        🏃 Huir
                                    </button>
                                </div>
                            ) : (
                                /* Ball Selection Option */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#3e2723', marginBottom: '4px' }}>Selecciona una Pokeball:</div>
                                    {['pokeball', 'great_ball', 'ultra_ball', 'master_ball'].map((ballId) => {
                                        const qty = inventory.getQuantity(ballId);
                                        const info = inventory.getItemInfo(ballId);
                                        const label = info.name || ballId;

                                        return (
                                            <button 
                                                key={ballId}
                                                onClick={() => handleBattleCatch(ballId)}
                                                className="pokemon-button"
                                                style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', opacity: qty > 0 ? 1 : 0.6 }}
                                                disabled={qty <= 0}
                                            >
                                                <span>🔴 {label} (Tasa: {Math.round((info.capture_rate || 0.3) * 100)}%)</span>
                                                <span style={{ fontWeight: 'bold' }}>x{qty}</span>
                                            </button>
                                        );
                                    })}
                                    <button 
                                        onClick={() => setShowBallSelect(false)}
                                        className="pokemon-button danger"
                                        style={{ marginTop: '4px' }}
                                    >
                                        Atrás
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Modal Notification Dialog */}
            {notification && (
                <div className="modal-overlay" style={{ zIndex: 300 }}>
                    <div className="modal-card pokemon-panel" style={{ maxWidth: '360px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{notification.title}</h3>
                            <button onClick={() => setNotification(null)} className="modal-close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5', color: '#3e2723' }}>
                                {notification.message}
                            </p>
                            <button 
                                onClick={() => setNotification(null)}
                                className="pokemon-button success"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

