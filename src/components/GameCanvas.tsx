"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Economy, EconomySaveData } from '../lib/Economy';
import { Inventory, InventorySaveData } from '../lib/Inventory';
import dailyMissions from '../../public/assets/economy/daily_missions.json';
import passiveRates from '../../public/assets/economy/passive_rates.json';
import pokemonSpeciesList from '../../public/assets/economy/pokemon_species.json';
import economyConfig from '../../public/assets/economy/config.json';
import { supabase } from '../lib/supabase';
import AdManager from '../lib/AdManager';
import AdsterraBanner from './AdsterraBanner';
import PokemonCenterBanner from './PokemonCenterBanner';

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
    isSolid?: boolean;
}

interface MapEntity {
    location: string;
    x: number;
    y: number;
    w: number;
    h: number;
    name: string;
    dialog?: string;
    dialogs?: string[];
    imgElement?: HTMLCanvasElement | HTMLImageElement;
    scale: number;
    frame?: { x: number; y: number; w: number; h: number };
}

interface LearnsetEntry {
    moveId: string;
    level: number;
}

const getPokemonLearnset = (speciesName: string, primaryType: string): LearnsetEntry[] => {
    const name = speciesName.toLowerCase();
    if (name === 'charmander') {
        return [
            { moveId: 'scratch', level: 1 },
            { moveId: 'growl', level: 1 },
            { moveId: 'ember', level: 8 },
            { moveId: 'flamethrower', level: 15 }
        ];
    }
    if (name === 'charmeleon') {
        return [
            { moveId: 'scratch', level: 1 },
            { moveId: 'growl', level: 1 },
            { moveId: 'ember', level: 1 },
            { moveId: 'flamethrower', level: 18 },
            { moveId: 'fire_blast', level: 30 }
        ];
    }
    if (name === 'charizard') {
        return [
            { moveId: 'wing_attack', level: 1 },
            { moveId: 'ember', level: 1 },
            { moveId: 'flamethrower', level: 1 },
            { moveId: 'fire_blast', level: 1 }
        ];
    }
    if (name === 'bulbasaur') {
        return [
            { moveId: 'tackle', level: 1 },
            { moveId: 'growl', level: 1 },
            { moveId: 'vine_whip', level: 8 },
            { moveId: 'mega_drain', level: 15 }
        ];
    }
    if (name === 'ivysaur') {
        return [
            { moveId: 'tackle', level: 1 },
            { moveId: 'growl', level: 1 },
            { moveId: 'vine_whip', level: 1 },
            { moveId: 'mega_drain', level: 18 },
            { moveId: 'solar_beam', level: 30 }
        ];
    }
    if (name === 'venusaur') {
        return [
            { moveId: 'tackle', level: 1 },
            { moveId: 'vine_whip', level: 1 },
            { moveId: 'mega_drain', level: 1 },
            { moveId: 'solar_beam', level: 1 }
        ];
    }
    if (name === 'squirtle') {
        return [
            { moveId: 'tackle', level: 1 },
            { moveId: 'tail_whip', level: 1 },
            { moveId: 'water_gun', level: 8 },
            { moveId: 'bubble', level: 15 }
        ];
    }
    if (name === 'wartortle') {
        return [
            { moveId: 'tackle', level: 1 },
            { moveId: 'tail_whip', level: 1 },
            { moveId: 'water_gun', level: 1 },
            { moveId: 'bubble', level: 18 },
            { moveId: 'hydro_pump', level: 30 }
        ];
    }
    if (name === 'blastoise') {
        return [
            { moveId: 'tackle', level: 1 },
            { moveId: 'water_gun', level: 1 },
            { moveId: 'surf', level: 1 },
            { moveId: 'hydro_pump', level: 1 }
        ];
    }
    if (name === 'pikachu') {
        return [
            { moveId: 'tackle', level: 1 },
            { moveId: 'growl', level: 1 },
            { moveId: 'thunder_shock', level: 6 },
            { moveId: 'quick_attack', level: 12 },
            { moveId: 'thunderbolt', level: 20 }
        ];
    }
    if (name === 'raichu') {
        return [
            { moveId: 'quick_attack', level: 1 },
            { moveId: 'thunder_shock', level: 1 },
            { moveId: 'thunderbolt', level: 1 },
            { moveId: 'thunder', level: 1 }
        ];
    }
    if (name === 'onix' || name.includes('onix')) {
        return [
            { moveId: 'tackle', level: 1 },
            { moveId: 'rock_throw', level: 1 },
            { moveId: 'mud_slap', level: 1 },
            { moveId: 'earthquake', level: 1 }
        ];
    }

    // Fallbacks based on primaryType
    const list = [{ moveId: 'tackle', level: 1 }];
    const type = primaryType.toLowerCase();
    if (type === 'fire') {
        list.push({ moveId: 'ember', level: 1 });
        list.push({ moveId: 'flamethrower', level: 15 });
    } else if (type === 'water') {
        list.push({ moveId: 'water_gun', level: 1 });
        list.push({ moveId: 'surf', level: 15 });
    } else if (type === 'grass') {
        list.push({ moveId: 'vine_whip', level: 1 });
        list.push({ moveId: 'mega_drain', level: 15 });
    } else if (type === 'electric') {
        list.push({ moveId: 'thunder_shock', level: 1 });
        list.push({ moveId: 'thunderbolt', level: 15 });
    } else if (type === 'flying') {
        list.push({ moveId: 'gust', level: 1 });
        list.push({ moveId: 'wing_attack', level: 15 });
    } else if (type === 'ground' || type === 'rock') {
        list.push({ moveId: 'mud_slap', level: 1 });
        list.push({ moveId: 'rock_throw', level: 15 });
    } else if (type === 'psychic') {
        list.push({ moveId: 'confusion', level: 1 });
        list.push({ moveId: 'psychic', level: 15 });
    } else {
        list.push({ moveId: 'quick_attack', level: 1 });
        list.push({ moveId: 'body_slam', level: 15 });
    }
    return list;
};

interface WildBattle {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    captureRate: number;
}

const MOVES_DATABASE: Record<string, { name: string; type: string; power: number; accuracy: number }> = {
    tackle: { name: "Placaje", type: "normal", power: 40, accuracy: 100 },
    scratch: { name: "Arañazo", type: "normal", power: 40, accuracy: 100 },
    growl: { name: "Gruñido", type: "normal", power: 0, accuracy: 100 },
    tail_whip: { name: "Látigo", type: "normal", power: 0, accuracy: 100 },
    quick_attack: { name: "Ataque Rápido", type: "normal", power: 40, accuracy: 100 },
    double_slap: { name: "Doble Bofetón", type: "normal", power: 15, accuracy: 85 },
    body_slam: { name: "Golpe Cuerpo", type: "normal", power: 85, accuracy: 100 },
    hyper_beam: { name: "Híper Rayo", type: "normal", power: 150, accuracy: 90 },
    ember: { name: "Ascuas", type: "fire", power: 40, accuracy: 100 },
    flamethrower: { name: "Lanzallamas", type: "fire", power: 90, accuracy: 100 },
    fire_blast: { name: "Llamarada", type: "fire", power: 110, accuracy: 85 },
    water_gun: { name: "Pistola Agua", type: "water", power: 40, accuracy: 100 },
    bubble: { name: "Burbuja", type: "water", power: 40, accuracy: 100 },
    surf: { name: "Surf", type: "water", power: 90, accuracy: 100 },
    hydro_pump: { name: "Hidrobomba", type: "water", power: 110, accuracy: 80 },
    vine_whip: { name: "Látigo Cepa", type: "grass", power: 45, accuracy: 100 },
    mega_drain: { name: "Megaagotar", type: "grass", power: 40, accuracy: 100 },
    solar_beam: { name: "Rayo Solar", type: "grass", power: 120, accuracy: 100 },
    thunder_shock: { name: "Impactrueno", type: "electric", power: 40, accuracy: 100 },
    thunderbolt: { name: "Rayo", type: "electric", power: 90, accuracy: 100 },
    thunder: { name: "Trueno", type: "electric", power: 110, accuracy: 70 },
    spark: { name: "Chispa", type: "electric", power: 65, accuracy: 100 },
    rock_throw: { name: "Lanzarrocas", type: "rock", power: 50, accuracy: 90 },
    earthquake: { name: "Terremoto", type: "ground", power: 100, accuracy: 100 },
    mud_slap: { name: "Bofetón Lodo", type: "ground", power: 20, accuracy: 100 },
    poison_sting: { name: "Picotazo Venenoso", type: "poison", power: 15, accuracy: 100 },
    gust: { name: "Tornado", type: "flying", power: 40, accuracy: 100 },
    wing_attack: { name: "Ataque Ala", type: "flying", power: 60, accuracy: 100 },
    psychic: { name: "Psíquico", type: "psychic", power: 90, accuracy: 100 },
    confusion: { name: "Confusión", type: "psychic", power: 50, accuracy: 100 },
    // Premium TMs
    thunder_wave: { name: "Onda Trueno", type: "electric", power: 0, accuracy: 100 },
    sleep_powder: { name: "Somnífero", type: "grass", power: 0, accuracy: 75 },
    toxic: { name: "Tóxico", type: "poison", power: 0, accuracy: 90 },
    confuse_ray: { name: "Rayo Confuso", type: "ghost", power: 0, accuracy: 100 },
    will_o_wisp: { name: "Fuego Fatuo", type: "fire", power: 0, accuracy: 85 },
    leech_seed: { name: "Drenadoras", type: "grass", power: 0, accuracy: 90 },
    recover: { name: "Recuperación", type: "normal", power: 0, accuracy: 100 },
    reflect: { name: "Reflejo", type: "psychic", power: 0, accuracy: 100 }
};

// Lore compatibility dictionary for the 8 TMs
const TM_COMPATIBILITY: Record<string, string[]> = {
    thunder_wave: ['pikachu', 'raichu', 'magnemite', 'magneton', 'electabuzz', 'jolteon', 'zapdos', 'mew', 'mewtwo', 'abra', 'kadabra', 'alakazam'],
    sleep_powder: ['bulbasaur', 'ivysaur', 'venusaur', 'butterfree', 'oddish', 'gloom', 'vileplume', 'bellsprout', 'weepinbell', 'victreebel', 'exeggcute', 'exeggutor', 'tangela', 'mew'],
    toxic: [], // Empty means universal (any Pokemon can learn it, matching Gen 1 TM lore!)
    confuse_ray: ['gastly', 'haunter', 'gengar', 'vulpix', 'ninetales', 'lapras', 'mew'],
    will_o_wisp: ['charmander', 'charmeleon', 'charizard', 'vulpix', 'ninetales', 'growlithe', 'arcanine', 'ponyta', 'rapidash', 'magmar', 'flareon', 'gastly', 'haunter', 'gengar', 'mew'],
    leech_seed: ['bulbasaur', 'ivysaur', 'venusaur', 'oddish', 'gloom', 'vileplume', 'bellsprout', 'weepinbell', 'victreebel', 'exeggcute', 'exeggutor', 'tangela', 'mew'],
    recover: ['abra', 'kadabra', 'alakazam', 'porygon', 'mew', 'mewtwo', 'slowpoke', 'slowbro'],
    reflect: ['bulbasaur', 'ivysaur', 'venusaur', 'charmander', 'charmeleon', 'charizard', 'squirtle', 'wartortle', 'blastoise', 'pikachu', 'raichu', 'clefairy', 'clefable', 'jigglypuff', 'wigglytuff', 'abra', 'kadabra', 'alakazam', 'mr-mime', 'mr_mime', 'mew', 'mewtwo', 'eevee', 'vaporeon', 'jolteon', 'flareon']
};

const isTmCompatible = (pokemonId: string, tmId: string): boolean => {
    const poke = pokemonId.toLowerCase();
    const tm = tmId.toLowerCase();
    if (!TM_COMPATIBILITY[tm]) return false;
    // Toxic is universal
    if (tm === 'toxic') return true;
    return TM_COMPATIBILITY[tm].includes(poke);
};

const TAMERBALLS_SHOP = [
    { id: 'tamer_ball', name: 'Tamer Ball', desc: 'Esfera básica de captura (30% éxito)', coins: 300, icon: '🔴' },
    { id: 'super_ball', name: 'Super Ball', desc: 'Mayor ratio de captura (50% éxito)', coins: 500, icon: '🔵' },
    { id: 'ultra_ball', name: 'Ultra Ball', desc: 'Ratio de captura muy alto (75% éxito)', pusdt: 1.00, icon: '🟡' },
    { id: 'master_ball', name: 'Master Ball', desc: 'Captura garantizada (100% éxito)', pusdt: 3.00, icon: '🟣' }
];

const ITEMS_SHOP = [
    { id: 'potion', name: 'Poción', desc: 'Restaura 20 PS', coins: 150, pusdt: 0.20, icon: '🧪' },
    { id: 'super_potion', name: 'Superpoción', desc: 'Restaura 50 PS', coins: 250, pusdt: 0.50, icon: '🧪' },
    { id: 'hyper_potion', name: 'Hiperpoción', desc: 'Restaura 120 PS', coins: 600, pusdt: 1.00, icon: '🧪' },
    { id: 'revive', name: 'Revivir', desc: 'Revive a un Pokémon con 50% PS', coins: 1000, pusdt: 0.70, icon: '✨' },
    { id: 'full_heal', name: 'Cura Total', desc: 'Cura todos los estados alterados', coins: 600, pusdt: 0.50, icon: '💊' },
    { id: 'evolution_stone', name: 'Piedra Evolución', desc: 'Evoluciona de forma genérica (Eevee al azar)', coins: 2000, pusdt: 1.50, icon: '🪨' },
    { id: 'thunder_stone', name: 'Piedra Trueno', desc: 'Evolución exacta Eléctrico (Pikachu, Eevee->Jolteon)', coins: 2000, pusdt: 1.50, icon: '⚡' },
    { id: 'water_stone', name: 'Piedra Agua', desc: 'Evolución exacta Agua (Poliwhirl, Eevee->Vaporeon)', coins: 2000, pusdt: 1.50, icon: '💧' },
    { id: 'fire_stone', name: 'Piedra Fuego', desc: 'Evolución exacta Fuego (Growlithe, Eevee->Flareon)', coins: 2000, pusdt: 1.50, icon: '🔥' },
    { id: 'leaf_stone', name: 'Piedra Hoja', desc: 'Evolución exacta Planta (Gloom, Weepinbell)', coins: 2000, pusdt: 1.50, icon: '🍃' },
    { id: 'moon_stone', name: 'Piedra Lunar', desc: 'Evolución exacta Hada/Luna (Clefairy, Jigglypuff)', coins: 2000, pusdt: 1.50, icon: '🌙' }
];

const TMS_SHOP = [
    { id: 'thunder_wave', name: 'TM01 Onda Trueno', desc: 'Paraliza al rival (reduce velocidad/prob. ataque)', pusdt: 5.00, rarity: 'Rara', type: 'electric' },
    { id: 'sleep_powder', name: 'TM02 Somnífero', desc: 'Pone a dormir al rival (lo inhabilita por turnos)', pusdt: 7.00, rarity: 'Rara', type: 'grass' },
    { id: 'toxic', name: 'TM03 Tóxico', desc: 'Envenena gravemente (daño creciente cada turno)', pusdt: 15.00, rarity: 'Épica', type: 'poison' },
    { id: 'confuse_ray', name: 'TM04 Rayo Confuso', desc: 'Confunde al rival (50% prob. de autodaño)', pusdt: 8.00, rarity: 'Rara', type: 'ghost' },
    { id: 'will_o_wisp', name: 'TM05 Fuego Fatuo', desc: 'Quema al rival (daño pasivo + reduce 50% ataque físico)', pusdt: 10.00, rarity: 'Rara', type: 'fire' },
    { id: 'leech_seed', name: 'TM06 Drenadoras', desc: 'Roba vida al oponente y te cura cada turno', pusdt: 10.00, rarity: 'Épica', type: 'grass' },
    { id: 'recover', name: 'TM07 Recuperación', desc: 'Recupera instantáneamente el 50% de PS máximos', pusdt: 10.00, rarity: 'Legendaria', type: 'normal' },
    { id: 'reflect', name: 'TM08 Reflejo', desc: 'Escudo físico (reduce 50% daño físico por 3 turnos)', pusdt: 5.00, rarity: 'Rara', type: 'psychic' }
];

const getPokemonAllMovesInfo = (speciesName: string): { moveId: string; levelReq: number }[] => {
    const name = speciesName.toLowerCase();
    if (name === 'charmander') {
        return [
            { moveId: 'scratch', levelReq: 1 },
            { moveId: 'growl', levelReq: 1 },
            { moveId: 'ember', levelReq: 8 },
            { moveId: 'flamethrower', levelReq: 15 }
        ];
    }
    if (name === 'charmeleon') {
        return [
            { moveId: 'scratch', levelReq: 1 },
            { moveId: 'growl', levelReq: 1 },
            { moveId: 'ember', levelReq: 1 },
            { moveId: 'flamethrower', levelReq: 18 },
            { moveId: 'fire_blast', levelReq: 30 }
        ];
    }
    if (name === 'charizard') {
        return [
            { moveId: 'wing_attack', levelReq: 1 },
            { moveId: 'ember', levelReq: 1 },
            { moveId: 'flamethrower', levelReq: 1 },
            { moveId: 'fire_blast', levelReq: 1 }
        ];
    }
    if (name === 'bulbasaur') {
        return [
            { moveId: 'tackle', levelReq: 1 },
            { moveId: 'growl', levelReq: 1 },
            { moveId: 'vine_whip', levelReq: 8 },
            { moveId: 'mega_drain', levelReq: 15 }
        ];
    }
    if (name === 'ivysaur') {
        return [
            { moveId: 'tackle', levelReq: 1 },
            { moveId: 'growl', levelReq: 1 },
            { moveId: 'vine_whip', levelReq: 1 },
            { moveId: 'mega_drain', levelReq: 18 },
            { moveId: 'solar_beam', levelReq: 30 }
        ];
    }
    if (name === 'venusaur') {
        return [
            { moveId: 'tackle', levelReq: 1 },
            { moveId: 'vine_whip', levelReq: 1 },
            { moveId: 'mega_drain', levelReq: 1 },
            { moveId: 'solar_beam', levelReq: 1 }
        ];
    }
    if (name === 'squirtle') {
        return [
            { moveId: 'tackle', levelReq: 1 },
            { moveId: 'tail_whip', levelReq: 1 },
            { moveId: 'water_gun', levelReq: 8 },
            { moveId: 'bubble', levelReq: 15 }
        ];
    }
    if (name === 'wartortle') {
        return [
            { moveId: 'tackle', levelReq: 1 },
            { moveId: 'tail_whip', levelReq: 1 },
            { moveId: 'water_gun', levelReq: 1 },
            { moveId: 'bubble', levelReq: 18 },
            { moveId: 'hydro_pump', levelReq: 30 }
        ];
    }
    if (name === 'blastoise') {
        return [
            { moveId: 'tackle', levelReq: 1 },
            { moveId: 'water_gun', levelReq: 1 },
            { moveId: 'surf', levelReq: 1 },
            { moveId: 'hydro_pump', levelReq: 1 }
        ];
    }
    if (name === 'pikachu') {
        return [
            { moveId: 'tackle', levelReq: 1 },
            { moveId: 'growl', levelReq: 1 },
            { moveId: 'thunder_shock', levelReq: 6 },
            { moveId: 'quick_attack', levelReq: 12 },
            { moveId: 'thunderbolt', levelReq: 20 }
        ];
    }
    if (name === 'raichu') {
        return [
            { moveId: 'quick_attack', levelReq: 1 },
            { moveId: 'thunder_shock', levelReq: 1 },
            { moveId: 'thunderbolt', levelReq: 1 },
            { moveId: 'thunder', levelReq: 1 }
        ];
    }
    if (name === 'onix' || name.includes('onix')) {
        return [
            { moveId: 'tackle', levelReq: 1 },
            { moveId: 'rock_throw', levelReq: 1 },
            { moveId: 'mud_slap', levelReq: 1 },
            { moveId: 'earthquake', levelReq: 1 }
        ];
    }
    // General fallback based on type
    const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === name);
    const primaryType = species?.types?.[0] || 'normal';
    const moves = [{ moveId: 'tackle', levelReq: 1 }];
    if (primaryType === 'fire') {
        moves.push({ moveId: 'ember', levelReq: 1 });
        moves.push({ moveId: 'flamethrower', levelReq: 15 });
    } else if (primaryType === 'water') {
        moves.push({ moveId: 'water_gun', levelReq: 1 });
        moves.push({ moveId: 'surf', levelReq: 15 });
    } else if (primaryType === 'grass') {
        moves.push({ moveId: 'vine_whip', levelReq: 1 });
        moves.push({ moveId: 'mega_drain', levelReq: 15 });
    } else if (primaryType === 'electric') {
        moves.push({ moveId: 'thunder_shock', levelReq: 1 });
        moves.push({ moveId: 'thunderbolt', levelReq: 15 });
    } else if (primaryType === 'flying') {
        moves.push({ moveId: 'gust', levelReq: 1 });
        moves.push({ moveId: 'wing_attack', levelReq: 15 });
    } else if (primaryType === 'ground' || primaryType === 'rock') {
        moves.push({ moveId: 'mud_slap', levelReq: 1 });
        moves.push({ moveId: 'rock_throw', levelReq: 15 });
    } else if (primaryType === 'psychic') {
        moves.push({ moveId: 'confusion', levelReq: 1 });
        moves.push({ moveId: 'psychic', levelReq: 15 });
    } else {
        moves.push({ moveId: 'quick_attack', levelReq: 1 });
        moves.push({ moveId: 'body_slam', levelReq: 15 });
    }
    return moves;
};

const EVOLUTION_DATABASE: Record<string, { method: 'level' | 'stone'; target: string; level?: number }> = {
    // Level-up evolutions
    bulbasaur: { method: 'level', target: 'ivysaur', level: 16 },
    ivysaur: { method: 'level', target: 'venusaur', level: 32 },
    charmander: { method: 'level', target: 'charmeleon', level: 16 },
    charmeleon: { method: 'level', target: 'charizard', level: 36 },
    squirtle: { method: 'level', target: 'wartortle', level: 16 },
    wartortle: { method: 'level', target: 'blastoise', level: 36 },
    caterpie: { method: 'level', target: 'metapod', level: 7 },
    metapod: { method: 'level', target: 'butterfree', level: 10 },
    weedle: { method: 'level', target: 'kakuna', level: 7 },
    kakuna: { method: 'level', target: 'beedrill', level: 10 },
    pidgey: { method: 'level', target: 'pidgeotto', level: 18 },
    pidgeotto: { method: 'level', target: 'pidgeot', level: 36 },
    rattata: { method: 'level', target: 'raticate', level: 20 },
    spearow: { method: 'level', target: 'fearow', level: 20 },
    "nidoran-f": { method: 'level', target: 'nidorina', level: 16 },
    "nidoran-m": { method: 'level', target: 'nidorino', level: 16 },
    ekans: { method: 'level', target: 'arbok', level: 22 },
    sandshrew: { method: 'level', target: 'sandslash', level: 22 },
    zubat: { method: 'level', target: 'golbat', level: 22 },
    paras: { method: 'level', target: 'parasect', level: 24 },
    venonat: { method: 'level', target: 'venomoth', level: 31 },
    diglett: { method: 'level', target: 'dugtrio', level: 26 },
    meowth: { method: 'level', target: 'persian', level: 28 },
    psyduck: { method: 'level', target: 'golduck', level: 33 },
    mankey: { method: 'level', target: 'primeape', level: 28 },
    poliwag: { method: 'level', target: 'poliwhirl', level: 25 },
    abra: { method: 'level', target: 'kadabra', level: 16 },
    kadabra: { method: 'level', target: 'alakazam', level: 36 },
    machop: { method: 'level', target: 'machoke', level: 28 },
    machoke: { method: 'level', target: 'machamp', level: 40 },
    bellsprout: { method: 'level', target: 'weepinbell', level: 21 },
    oddish: { method: 'level', target: 'gloom', level: 21 },
    tentacool: { method: 'level', target: 'tentacruel', level: 30 },
    geodude: { method: 'level', target: 'graveler', level: 25 },
    graveler: { method: 'level', target: 'golem', level: 40 },
    ponyta: { method: 'level', target: 'rapidash', level: 40 },
    slowpoke: { method: 'level', target: 'slowbro', level: 37 },
    magnemite: { method: 'level', target: 'magneton', level: 30 },
    doduo: { method: 'level', target: 'dodrio', level: 31 },
    seel: { method: 'level', target: 'dewgong', level: 34 },
    grimer: { method: 'level', target: 'muk', level: 38 },
    gastly: { method: 'level', target: 'haunter', level: 25 },
    haunter: { method: 'level', target: 'gengar', level: 40 },
    drowzee: { method: 'level', target: 'hypno', level: 26 },
    krabby: { method: 'level', target: 'kingler', level: 28 },
    voltorb: { method: 'level', target: 'electrode', level: 30 },
    cubone: { method: 'level', target: 'marowak', level: 28 },
    koffing: { method: 'level', target: 'weezing', level: 35 },
    rhyhorn: { method: 'level', target: 'rhydon', level: 42 },
    horsea: { method: 'level', target: 'seadra', level: 32 },
    goldeen: { method: 'level', target: 'seaking', level: 33 },
    magikarp: { method: 'level', target: 'gyarados', level: 20 },
    omanyte: { method: 'level', target: 'omastar', level: 40 },
    kabuto: { method: 'level', target: 'kabutops', level: 40 },
    dratini: { method: 'level', target: 'dragonair', level: 30 },
    dragonair: { method: 'level', target: 'dragonite', level: 55 },

    // Stone evolutions
    pikachu: { method: 'stone', target: 'raichu' },
    clefairy: { method: 'stone', target: 'clefable' },
    vulpix: { method: 'stone', target: 'ninetales' },
    jigglypuff: { method: 'stone', target: 'wigglytuff' },
    nidorina: { method: 'stone', target: 'nidoqueen' },
    nidorino: { method: 'stone', target: 'nidoking' },
    gloom: { method: 'stone', target: 'vileplume' },
    growlithe: { method: 'stone', target: 'arcanine' },
    poliwhirl: { method: 'stone', target: 'poliwrath' },
    weepinbell: { method: 'stone', target: 'victreebel' },
    shellder: { method: 'stone', target: 'cloyster' },
    exeggcute: { method: 'stone', target: 'exeggutor' },
    staryu: { method: 'stone', target: 'starmie' },
    eevee: { method: 'stone', target: 'vaporeon' }
};

const getPokemonEvolutionInfo = (speciesName: string): string => {
    const name = speciesName.toLowerCase();
    const evo = EVOLUTION_DATABASE[name];
    if (!evo) return 'Sin evoluciones disponibles';
    
    if (name === 'eevee') {
        return 'Evoluciona a Vaporeon, Jolteon o Flareon usando Piedra Evolución';
    }
    
    const targetCap = evo.target.charAt(0).toUpperCase() + evo.target.slice(1);
    if (evo.method === 'level') {
        return `Evoluciona a ${targetCap} al Nvl. ${evo.level}`;
    } else {
        return `Evoluciona a ${targetCap} usando Piedra Evolución`;
    }
};

const getPokemonMoves = (speciesName: string, level: number): string[] => {
    const name = speciesName.toLowerCase();
    if (name === 'charmander') {
        const moves = ['scratch', 'growl'];
        if (level >= 8) moves.push('ember');
        if (level >= 15) moves.push('flamethrower');
        return moves;
    }
    if (name === 'charmeleon') {
        const moves = ['scratch', 'growl', 'ember'];
        if (level >= 18) moves.push('flamethrower');
        if (level >= 30) moves.push('fire_blast');
        return moves;
    }
    if (name === 'charizard') {
        return ['wing_attack', 'ember', 'flamethrower', 'fire_blast'];
    }
    if (name === 'bulbasaur') {
        const moves = ['tackle', 'growl'];
        if (level >= 8) moves.push('vine_whip');
        if (level >= 15) moves.push('mega_drain');
        return moves;
    }
    if (name === 'ivysaur') {
        const moves = ['tackle', 'growl', 'vine_whip'];
        if (level >= 18) moves.push('mega_drain');
        if (level >= 30) moves.push('solar_beam');
        return moves;
    }
    if (name === 'venusaur') {
        return ['tackle', 'vine_whip', 'mega_drain', 'solar_beam'];
    }
    if (name === 'squirtle') {
        const moves = ['tackle', 'tail_whip'];
        if (level >= 8) moves.push('water_gun');
        if (level >= 15) moves.push('bubble');
        return moves;
    }
    if (name === 'wartortle') {
        const moves = ['tackle', 'tail_whip', 'water_gun'];
        if (level >= 18) moves.push('bubble');
        if (level >= 30) moves.push('hydro_pump');
        return moves;
    }
    if (name === 'blastoise') {
        return ['tackle', 'water_gun', 'surf', 'hydro_pump'];
    }
    if (name === 'pikachu') {
        const moves = ['tackle', 'growl'];
        if (level >= 6) moves.push('thunder_shock');
        if (level >= 12) moves.push('quick_attack');
        if (level >= 20) moves.push('thunderbolt');
        return moves;
    }
    if (name === 'raichu') {
        return ['quick_attack', 'thunder_shock', 'thunderbolt', 'thunder'];
    }
    if (name === 'onix' || name.includes('onix')) {
        return ['tackle', 'rock_throw', 'mud_slap', 'earthquake'];
    }
    const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === name);
    const primaryType = species?.types?.[0] || 'normal';
    const fallback = ['tackle'];
    if (primaryType === 'fire') {
        fallback.push('ember');
        if (level >= 15) fallback.push('flamethrower');
    } else if (primaryType === 'water') {
        fallback.push('water_gun');
        if (level >= 15) fallback.push('surf');
    } else if (primaryType === 'grass') {
        fallback.push('vine_whip');
        if (level >= 15) fallback.push('mega_drain');
    } else if (primaryType === 'electric') {
        fallback.push('thunder_shock');
        if (level >= 15) fallback.push('thunderbolt');
    } else if (primaryType === 'flying') {
        fallback.push('gust');
        if (level >= 15) fallback.push('wing_attack');
    } else if (primaryType === 'ground' || primaryType === 'rock') {
        fallback.push('mud_slap');
        if (level >= 15) fallback.push('rock_throw');
    } else if (primaryType === 'psychic') {
        fallback.push('confusion');
        if (level >= 15) fallback.push('psychic');
    } else {
        fallback.push('quick_attack');
        if (level >= 15) fallback.push('body_slam');
    }
    return fallback;
};

const getPokemonStats = (speciesName: string, level: number) => {
    const nameLower = speciesName.toLowerCase();
    const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === nameLower) || {
        hp: 40, attack: 45, defense: 40, speed: 50
    };
    const maxHp = (species.hp ?? 40) + (level * 3);
    const attack = (species.attack ?? 45) + (level * 2);
    const defense = (species.defense ?? 40) + (level * 2);
    const speed = (species.speed ?? 50) + (level * 2);
    return { maxHp, attack, defense, speed };
};

const getTypeMultiplier = (moveType: string, opponentTypes: string[]): number => {
    let mult = 1.0;
    for (const targetType of opponentTypes) {
        const target = targetType.toLowerCase();
        if (moveType === 'fire') {
            if (['grass', 'bug', 'ice'].includes(target)) mult *= 2.0;
            if (['water', 'fire', 'rock', 'dragon'].includes(target)) mult *= 0.5;
        } else if (moveType === 'water') {
            if (['fire', 'ground', 'rock'].includes(target)) mult *= 2.0;
            if (['water', 'grass', 'dragon'].includes(target)) mult *= 0.5;
        } else if (moveType === 'grass') {
            if (['water', 'ground', 'rock'].includes(target)) mult *= 2.0;
            if (['fire', 'grass', 'poison', 'flying', 'bug', 'dragon'].includes(target)) mult *= 0.5;
        } else if (moveType === 'electric') {
            if (['water', 'flying'].includes(target)) mult *= 2.0;
            if (['grass', 'electric', 'dragon'].includes(target)) mult *= 0.5;
            if (target === 'ground') mult *= 0.0;
        } else if (moveType === 'ground') {
            if (['fire', 'electric', 'poison', 'rock'].includes(target)) mult *= 2.0;
            if (['grass', 'bug'].includes(target)) mult *= 0.5;
            if (target === 'flying') mult *= 0.0;
        } else if (moveType === 'rock') {
            if (['fire', 'ice', 'flying', 'bug'].includes(target)) mult *= 2.0;
            if (['ground', 'steel'].includes(target)) mult *= 0.5;
        }
    }
    return mult;
};

const getTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
        case 'fire': return '#f44336';
        case 'water': return '#2196f3';
        case 'grass': return '#4caf50';
        case 'electric': return '#ffbc00';
        case 'ground': return '#795548';
        case 'rock': return '#9e9e9e';
        case 'flying': return '#00bcd4';
        case 'poison': return '#9c27b0';
        case 'psychic': return '#e91e63';
        case 'bug': return '#8bc34a';
        default: return '#78909c';
    }
};

// Helper function to remove background key color dynamically in canvas
const transparentImageCache: Record<string, HTMLCanvasElement | HTMLImageElement> = {};

const makeColorTransparent = (imgElement: HTMLImageElement, colorHex: string) => {
    if (typeof window === 'undefined') return imgElement;
    
    const cacheKey = imgElement.src + '_' + colorHex;
    if (transparentImageCache[cacheKey]) {
        return transparentImageCache[cacheKey];
    }

    try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imgElement.width;
        tempCanvas.height = imgElement.height;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        if (!tempCtx) return imgElement;

        tempCtx.drawImage(imgElement, 0, 0);
        const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imgData.data;

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
        transparentImageCache[cacheKey] = tempCanvas;
        return tempCanvas;
    } catch (e) {
        console.warn("Could not make color transparent:", e);
        return imgElement;
    }
};

const assetCache: Record<string, any> = {};
const globalComponentCache: Record<string, HTMLImageElement> = {};
async function cachedFetchJson(url: string) {
    if (assetCache[url]) return assetCache[url];
    try {
        const res = await fetch(url).then(r => r.json());
        assetCache[url] = res;
        return res;
    } catch (err) {
        console.error("Failed to fetch JSON:", url, err);
        throw err;
    }
}
async function cachedFetchText(url: string) {
    if (assetCache[url]) return assetCache[url];
    try {
        const res = await fetch(url).then(r => r.text());
        assetCache[url] = res;
        return res;
    } catch (err) {
        console.error("Failed to fetch Text:", url, err);
        throw err;
    }
}
interface MedalSynergyInfo {
    name: string;
    auraColor1: string;
    auraColor2: string;
    description: string;
    combatEffect: string;
}

const getMedalSynergy = (equipped: string[] | undefined): MedalSynergyInfo | null => {
    if (!equipped || equipped.length !== 2) return null;
    const sorted = [...equipped].sort();
    
    if (sorted.includes("Medalla Roca") && sorted.includes("Medalla Volcan")) {
        return {
            name: "Magma Volcánico",
            auraColor1: "rgba(255, 69, 0, 0.8)",
            auraColor2: "rgba(255, 140, 0, 0.0)",
            description: "Aura incandescente de fuego y roca fundida.",
            combatEffect: "+10% daño infligido en PvP"
        };
    }
    
    if (sorted.includes("Medalla Cascada") && sorted.includes("Medalla Trueno")) {
        return {
            name: "Tempestad Eléctrica",
            auraColor1: "rgba(0, 191, 255, 0.8)",
            auraColor2: "rgba(255, 215, 0, 0.0)",
            description: "Aura chispeante que combina electricidad y agua.",
            combatEffect: "+10% probabilidad de crítico en PvP"
        };
    }
    
    if (sorted.includes("Medalla Arcoiris") && sorted.includes("Medalla Alma")) {
        return {
            name: "Pantano Tóxico",
            auraColor1: "rgba(50, 205, 50, 0.8)",
            auraColor2: "rgba(148, 0, 211, 0.0)",
            description: "Aura brumosa de toxinas y naturaleza salvaje.",
            combatEffect: "+10% daño en ataques de estado (flat 8 en PvP)"
        };
    }
    
    if (sorted.includes("Medalla Pantano") && sorted.includes("Medalla Tierra")) {
        return {
            name: "Fuerza Mística",
            auraColor1: "rgba(0, 255, 255, 0.8)",
            auraColor2: "rgba(255, 215, 0, 0.0)",
            description: "Aura sagrada que protege al entrenador.",
            combatEffect: "-10% daño recibido en PvP"
        };
    }
    
    return {
        name: "Duo Versátil",
        auraColor1: "rgba(135, 206, 235, 0.8)",
        auraColor2: "rgba(70, 130, 180, 0.0)",
        description: "Aura equilibrada de dos disciplinas combinadas.",
        combatEffect: "+5% HP máximo en combates PvP"
    };
};

const synergyAuras: Record<string, { color1: string; color2: string }> = {
    "Magma Volcánico": { color1: "rgba(255, 69, 0, 0.8)", color2: "rgba(255, 140, 0, 0.0)" },
    "Tempestad Eléctrica": { color1: "rgba(0, 191, 255, 0.8)", color2: "rgba(255, 215, 0, 0.0)" },
    "Pantano Tóxico": { color1: "rgba(50, 205, 50, 0.8)", color2: "rgba(148, 0, 211, 0.0)" },
    "Fuerza Mística": { color1: "rgba(0, 255, 255, 0.8)", color2: "rgba(255, 215, 0, 0.0)" },
    "Duo Versátil": { color1: "rgba(135, 206, 235, 0.8)", color2: "rgba(70, 130, 180, 0.0)" }
};

const getSpecialMedals = (econ: any) => {
    const specials: string[] = [];
    if ((econ.pvpWins || econ.pvp_wins || 0) >= 10) {
        specials.push("Medalla Campeón PvP (S1)");
    }
    if ((econ.loginStreak || econ.login_streak || 0) >= 7) {
        specials.push("Medalla Tamer Pionero");
    }
    return specials;
};

const getMapDisplayName = (mapPath: string): string => {
    const path = mapPath.toLowerCase();
    if (path.includes('tutorial')) {
        return 'Pueblo Tutorial';
    }
    if (path.includes('pokecenter')) {
        return 'Centro Pokémon';
    }
    if (path.includes('pokemart')) {
        return 'Tienda Pokémon';
    }
    if (path.includes('gym')) {
        return 'Gimnasio Pokémon';
    }
    if (path.includes('redhouse')) {
        return 'Casa del Entrenador';
    }
    if (path.includes('route1')) {
        return 'Ruta 01';
    }
    if (path.includes('route2')) {
        return 'Ruta 02';
    }
    if (path.includes('route3')) {
        return 'Ruta 03';
    }
    if (path.includes('route4')) {
        return 'Ruta 04';
    }
    if (path.startsWith('procedural://')) {
        const parts = path.replace('procedural://', '').split('_');
        const type = parts[0];
        const index = parts[1] || '1';
        if (type === 'route') {
            return `Ruta de Exploración ${index}`;
        }
        if (type === 'settlement') {
            return `Pueblo Semilla ${index}`;
        }
        if (type === 'cave') {
            return `Cueva Misteriosa ${index}`;
        }
    }
    return 'Zona Desconocida';
};

const getClosestPokeCenter = (currentPath: string): { map: string; coords: [number, number] } => {
    const path = currentPath.toLowerCase();

    if (path.startsWith('procedural://')) {
        const parts = path.replace('procedural://', '').split('_');
        const index = parseInt(parts[1] || '1', 10);
        return {
            map: `procedural://settlement_${index}`,
            coords: [400, 276]
        };
    }

    if (path.includes('city1') || path.includes('/cave')) {
        return {
            map: '/assets/maps/city1/main.json',
            coords: [280, 916]
        };
    }

    // Default to tutorial pokecenter
    return {
        map: '/assets/maps/tutorial/main.json',
        coords: [600, 748]
    };
};

const EvolutionScreen = ({ 
    pokemonId, 
    targetId, 
    level, 
    onComplete 
}: { 
    pokemonId: string; 
    targetId: string; 
    level: number; 
    onComplete: () => void; 
}) => {
    const [stage, setStage] = useState<'intro' | 'morphing' | 'success'>('intro');
    const [displayId, setDisplayId] = useState(pokemonId);
    const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);
    
    const prevSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === pokemonId.toLowerCase());
    const nextSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === targetId.toLowerCase());
    
    const prevSprite = prevSpecies?.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${prevSpecies?.id || 1}.png`;
    const nextSprite = nextSpecies?.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${nextSpecies?.id || 2}.png`;

    useEffect(() => {
        if (stage === 'intro') {
            const timer = setTimeout(() => {
                setStage('morphing');
            }, 2500);
            return () => clearTimeout(timer);
        } else if (stage === 'morphing') {
            let count = 0;
            let currentDelay = 400; // ms
            let timerId: any;
            
            const tick = () => {
                setDisplayId(prev => (prev === pokemonId ? targetId : pokemonId));
                count++;
                
                if (currentDelay > 60) {
                    currentDelay = Math.max(60, currentDelay - 40);
                }
                
                if (count < 22) {
                    timerId = setTimeout(tick, currentDelay);
                } else {
                    setStage('success');
                    setDisplayId(targetId);
                }
            };
            
            timerId = setTimeout(tick, currentDelay);
            return () => clearTimeout(timerId);
        } else if (stage === 'success') {
            const newSparkles = Array.from({ length: 35 }).map((_, i) => ({
                id: i,
                x: Math.random() * 160 - 80,
                y: Math.random() * 160 - 80,
                size: Math.random() * 6 + 4,
                delay: Math.random() * 1.5
            }));
            setSparkles(newSparkles);
        }
    }, [stage, pokemonId, targetId]);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#0a051d',
            backgroundImage: 'radial-gradient(circle at center, #1b1437 0%, #080314 100%)',
            zIndex: 11000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxSizing: 'border-box',
            padding: '24px 16px',
            fontFamily: 'monospace',
            overflow: 'hidden'
        }}>
            <style>{`
                @keyframes sparkles-rise {
                    0% { transform: translateY(20px) scale(0); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(-80px) scale(1.2); opacity: 0; }
                }
                @keyframes circle-glow {
                    0%, 100% { transform: scale(1); opacity: 0.4; filter: blur(8px); }
                    50% { transform: scale(1.15); opacity: 0.7; filter: blur(12px); }
                }
                @keyframes screen-flash {
                    0% { opacity: 0; }
                    10% { opacity: 1; background: #ffffff; }
                    100% { opacity: 0; background: #ffffff; }
                }
                @keyframes float-poke {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
                .sparkle-particle {
                    position: absolute;
                    background: radial-gradient(circle, #fff 20%, #4fc3f7 70%, transparent 100%);
                    border-radius: 50%;
                    animation: sparkles-rise 1.5s ease-out infinite;
                }
                .silhouette-effect {
                    filter: brightness(0) invert(1);
                }
                .morphing-glow {
                    filter: drop-shadow(0 0 15px rgba(255,255,255,0.8));
                }
            `}</style>

            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                opacity: 0.15, pointerEvents: 'none',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}></div>

            <div style={{
                color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '13px',
                fontWeight: 'bold', background: 'rgba(255,255,255,0.05)', padding: '6px 16px',
                borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '10px',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
            }}>
                {stage === 'intro' && "✨ ¿Qué está pasando? ✨"}
                {stage === 'morphing' && "⚡ Evolucionando... ⚡"}
                {stage === 'success' && "🎉 ¡Evolución Completada! 🎉"}
            </div>

            <div style={{ position: 'relative', width: '220px', height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{
                    position: 'absolute', bottom: '15px', width: '140px', height: '40px',
                    borderRadius: '50%', background: stage === 'success' ? '#00e5ff' : '#ffffff',
                    opacity: 0.5, filter: 'blur(10px)',
                    animation: 'circle-glow 2.5s ease-in-out infinite',
                    boxShadow: stage === 'success' ? '0 0 30px #00e5ff' : '0 0 20px #ffffff'
                }}></div>
                <div style={{
                    position: 'absolute', bottom: '22px', width: '120px', height: '26px',
                    borderRadius: '50%', border: stage === 'success' ? '3px solid #00b0ff' : '3px solid #e0e0e0',
                    background: 'transparent', opacity: 0.8
                }}></div>

                {stage === 'success' && sparkles.map((sp) => (
                    <div
                        key={sp.id}
                        className="sparkle-particle"
                        style={{
                            width: `${sp.size}px`,
                            height: `${sp.size}px`,
                            left: `calc(50% + ${sp.x}px)`,
                            bottom: `calc(50% + ${sp.y}px)`,
                            animationDelay: `${sp.delay}s`
                        }}
                    />
                ))}

                <img
                    src={displayId === pokemonId ? prevSprite : nextSprite}
                    alt="evolving"
                    className={`${stage === 'morphing' ? 'silhouette-effect morphing-glow' : ''}`}
                    style={{
                        width: '160px',
                        height: '160px',
                        objectFit: 'contain',
                        zIndex: 10,
                        animation: stage === 'morphing' ? 'none' : 'float-poke 3s ease-in-out infinite',
                        transform: stage === 'morphing' ? 'scale(1.15)' : 'none',
                        transition: stage === 'morphing' ? 'transform 0.1s ease-in-out' : 'transform 0.3s ease-in-out'
                    }}
                />
            </div>

            <div style={{
                width: '100%',
                background: 'linear-gradient(to bottom, #111827 0%, #1f2937 100%)',
                border: '4px double rgba(255,255,255,0.4)',
                borderRadius: '12px',
                padding: '16px',
                boxSizing: 'border-box',
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                zIndex: 20
            }}>
                <div style={{
                    color: '#fff', fontSize: '13px', lineHeight: '1.6', fontFamily: 'monospace',
                    textShadow: '1px 1px 2px #000', whiteSpace: 'pre-line'
                }}>
                    {stage === 'intro' && `¿Uh? ¡Tu ${prevSpecies?.name?.toUpperCase() || pokemonId.toUpperCase()} está empezando a evolucionar!`}
                    {stage === 'morphing' && `Evolucionando...`}
                    {stage === 'success' && `¡Felicidades! ¡Tu ${prevSpecies?.name?.toUpperCase() || pokemonId.toUpperCase()} ha evolucionado en ${nextSpecies?.name?.toUpperCase() || targetId.toUpperCase()}!`}
                </div>

                {stage === 'success' && (
                    <button
                        onClick={onComplete}
                        style={{
                            alignSelf: 'flex-end',
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 16px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                            transition: 'all 0.1s',
                            marginTop: '8px'
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        Continuar
                    </button>
                )}
            </div>

            {stage === 'success' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    zIndex: 100, pointerEvents: 'none',
                    animation: 'screen-flash 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
                }} />
            )}
        </div>
    );
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
    const [inventory, setInventory] = useState<Inventory>(() => {
        // Migrate legacy ball IDs: pokeball→tamer_ball, great_ball→super_ball
        const migratedData = inventoryData ? JSON.parse(JSON.stringify(inventoryData)) : undefined;
        if (migratedData?.items) {
            if (migratedData.items['pokeball'] !== undefined) {
                migratedData.items['tamer_ball'] = (migratedData.items['tamer_ball'] ?? 0) + migratedData.items['pokeball'];
                delete migratedData.items['pokeball'];
            }
            if (migratedData.items['great_ball'] !== undefined) {
                migratedData.items['super_ball'] = (migratedData.items['super_ball'] ?? 0) + migratedData.items['great_ball'];
                delete migratedData.items['great_ball'];
            }
        }
        return new Inventory(migratedData);
    });

    const [team, setTeam] = useState<any[]>(() => {
        return teamData.map((p: any) => {
            const lvl = p.level !== undefined ? p.level : 1;
            const xp = p.xp !== undefined ? p.xp : 0;
            const stats = getPokemonStats(p.id, lvl);
            return {
                ...p,
                level: lvl,
                xp: xp,
                hp: p.hp !== undefined ? Math.min(p.hp, stats.maxHp) : stats.maxHp,
                maxHp: stats.maxHp,
                moves: p.moves || getPokemonMoves(p.id, lvl)
            };
        });
    });
    const [pcPokemon, setPcPokemon] = useState<any[]>(() => {
        return pcPokemonData.map((p: any) => {
            const lvl = p.level !== undefined ? p.level : 1;
            const xp = p.xp !== undefined ? p.xp : 0;
            const stats = getPokemonStats(p.id, lvl);
            return {
                ...p,
                level: lvl,
                xp: xp,
                hp: p.hp !== undefined ? Math.min(p.hp, stats.maxHp) : stats.maxHp,
                maxHp: stats.maxHp,
                moves: p.moves || getPokemonMoves(p.id, lvl)
            };
        });
    });
    const [currentMapPath, setCurrentMapPath] = useState(initialMapPath);
    const [pendingWarp, setPendingWarp] = useState<{ path: string, x: number, y: number, name: string } | null>(null);
    
    // Player nickname / alias states
    const [playerName, setPlayerName] = useState(saveName);
    const [nicknameInput, setNicknameInput] = useState(saveName);
    const [showEditNicknameModal, setShowEditNicknameModal] = useState(false);
    const playerNameRef = useRef(playerName);
    playerNameRef.current = playerName;

    // Helper to dynamically calculate remaining free heals per day at UTC 00
    const getRemainingFreeHeals = () => {
        const today = new Date().toISOString().split('T')[0];
        if (economy.last_heal_date !== today) {
            return 2;
        }
        return Math.max(0, 2 - economy.heals_today);
    };

    // Ad-related states
    const [adHealsViewed, setAdHealsViewed] = useState(0);
    const [adHealSelectMode, setAdHealSelectMode] = useState(false);
    const [doubleRewardCoins, setDoubleRewardCoins] = useState<number>(0);
    const [doubleRewardType, setDoubleRewardType] = useState<'gym' | 'wild' | 'trainer' | null>(null);
    const [isGymBattle, setIsGymBattle] = useState<boolean>(false);
    const [gymLeaderName, setGymLeaderName] = useState<string | null>(null);
    const [isTrainerBattle, setIsTrainerBattle] = useState<boolean>(false);
    const [currentDialogList, setCurrentDialogList] = useState<string[]>([]);
    const [currentDialogIndex, setCurrentDialogIndex] = useState<number>(0);

    useEffect(() => {
        setPlayerName(saveName);
        setNicknameInput(saveName);
    }, [saveName]);

    // Real-time Multiplayer states & refs
    const [otherPlayers, setOtherPlayers] = useState<Record<string, any>>({});
    const otherPlayersRef = useRef<Record<string, any>>({});
    const channelRef = useRef<any>(null);
    const lastBroadcastRef = useRef({ x: 0, y: 0, dir: '', animFrame: 0, map: '', aura: null as string | null });

    useEffect(() => {
        otherPlayersRef.current = otherPlayers;
    }, [otherPlayers]);
    
    // Profile / Medals inspect states
    const [viewingProfile, setViewingProfile] = useState<any | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    
    // HUD and Modal States
    const [activeDialog, setActiveDialog] = useState<string | null>(null);
    const [dialogName, setDialogName] = useState<string>('');
    const [showShop, setShowShop] = useState(false);
    const [shopTab, setShopTab] = useState<'balls' | 'items' | 'tms'>('balls');
    const [showTutorModal, setShowTutorModal] = useState(false);
    const [tutorMoveToLearn, setTutorMoveToLearn] = useState<string | null>(null);
    const [selectedTutorPokeIdx, setSelectedTutorPokeIdx] = useState<number | null>(null);
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
    const [wildBattleLog, setWildBattleLog] = useState<string[]>([]);
    const wildBattleLogRef = useRef<HTMLDivElement | null>(null);
    const [showBallSelect, setShowBallSelect] = useState<boolean>(false);
    const [showBagSelect, setShowBagSelect] = useState<boolean>(false);
    const [showSwitchSelect, setShowSwitchSelect] = useState<boolean>(false);
    const [showMoveSelect, setShowMoveSelect] = useState<boolean>(false);
    const [catchBallState, setCatchBallState] = useState<'throw' | 'shake' | 'success' | 'fail' | null>(null);
    const [usingItem, setUsingItem] = useState<any | null>(null);
    const [selectedInfoPoke, setSelectedInfoPoke] = useState<any | null>(null);
    const [activeEvolution, setActiveEvolution] = useState<{
        pokemonId: string;
        targetId: string;
        level: number;
        onComplete: () => void;
    } | null>(null);
    const activeEvolutionRef = useRef(activeEvolution);
    useEffect(() => { activeEvolutionRef.current = activeEvolution; }, [activeEvolution]);

    // Battle stats modifier stages (Growl lowers attack, Tail Whip lowers defense)
    const [playerAtkStage, setPlayerAtkStage] = useState<number>(0);
    const [playerDefStage, setPlayerDefStage] = useState<number>(0);
    const [opponentAtkStage, setOpponentAtkStage] = useState<number>(0);
    const [opponentDefStage, setOpponentDefStage] = useState<number>(0);

    // Battle animation states
    const [isBattleAnimating, setIsBattleAnimating] = useState<boolean>(false);
    const [playerSpriteEffect, setPlayerSpriteEffect] = useState<'none' | 'shake' | 'flash' | 'hurt' | 'bounce'>('none');
    const [opponentSpriteEffect, setOpponentSpriteEffect] = useState<'none' | 'shake' | 'flash' | 'hurt' | 'bounce'>('none');
    const [floatingDamage, setFloatingDamage] = useState<{ value: number | string; target: 'player' | 'opponent' } | null>(null);

    // PvP States
    const [playerContextMenu, setPlayerContextMenu] = useState<{ address: string; name: string; x: number; y: number } | null>(null);
    const [hoveredPlayer, setHoveredPlayer] = useState<{ address: string; name: string; x: number; y: number } | null>(null);
    const [pendingPvPInvite, setPendingPvPInvite] = useState<string | null>(null);
    const pendingPvPInviteRef = useRef<string | null>(null);
    useEffect(() => { pendingPvPInviteRef.current = pendingPvPInvite; }, [pendingPvPInvite]);
    const [pvpTurnTimer, setPvpTurnTimer] = useState<number>(45);
    const [incomingPvPInvite, setIncomingPvPInvite] = useState<{ from: string; fromName: string } | null>(null);
    const incomingPvPInviteRef = useRef<{ from: string; fromName: string } | null>(null);
    useEffect(() => { incomingPvPInviteRef.current = incomingPvPInvite; }, [incomingPvPInvite]);
    const [activePvPBattle, setActivePvPBattle] = useState<any | null>(null);
    const activePvPBattleRef = useRef<any | null>(null);
    useEffect(() => {
        activePvPBattleRef.current = activePvPBattle;
    }, [activePvPBattle]);
    const [pvpBattleLog, setPvpBattleLog] = useState<string[]>([]);
    const [pvpItemsUsed, setPvpItemsUsed] = useState<number>(0);
    const pvpItemsUsedRef = useRef<number>(0);
    useEffect(() => { pvpItemsUsedRef.current = pvpItemsUsed; }, [pvpItemsUsed]);
    const [showPvpBackpack, setShowPvpBackpack] = useState<boolean>(false);
    const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
    const [pvpLeaderboard, setPvpLeaderboard] = useState<any[] | null>(null);

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

    const handleViewOpponentProfile = async (address: string) => {
        setIsLoadingProfile(true);
        try {
            const { data, error } = await supabase
                .from('player_saves')
                .select('save_data')
                .eq('wallet_address', address)
                .single();
                
            if (data && data.save_data) {
                const saveData = data.save_data;
                const econData = saveData.economy_data || {};
                
                setViewingProfile({
                    isLocal: false,
                    address: address,
                    name: saveData.name || "Entrenador",
                    level: econData.level || 1,
                    xp: econData.xp || 0,
                    pvpWins: econData.pvp_wins || 0,
                    pvpLosses: econData.pvp_losses || 0,
                    loginStreak: econData.login_streak || 0,
                    medals: econData.medals || [],
                    medalLevels: econData.medal_levels || {},
                    equippedMedals: econData.equipped_medals || [],
                    tournamentMedals: econData.tournament_medals || [],
                    team: saveData.team_data || []
                });
            } else {
                showNotification("Perfil de Entrenador", "No se pudo cargar el perfil del oponente.");
            }
        } catch (err) {
            console.error("Error loading opponent profile:", err);
            showNotification("Perfil de Entrenador", "Error al cargar el perfil.");
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const handleViewLocalProfile = () => {
        setViewingProfile({
            isLocal: true,
            address: walletAddress || "local",
            name: playerName || "Tamer",
            level: economy.level,
            xp: economy.xp,
            pvpWins: economy.pvp_wins,
            pvpLosses: economy.pvp_losses,
            loginStreak: economy.login_streak,
            medals: economy.medals,
            medalLevels: economy.medal_levels,
            equippedMedals: economy.equipped_medals,
            tournamentMedals: economy.tournament_medals,
            team: team
        });
    };

    const handleUpdateNickname = async (newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) {
            showNotification("Error", "El nickname no puede estar vacío.");
            return;
        }
        if (trimmed.length > 15) {
            showNotification("Error", "El nickname es demasiado largo (máximo 15 caracteres).");
            return;
        }
        setPlayerName(trimmed);
        playerNameRef.current = trimmed;
        
        // Save nickname update to database
        await saveLocalEconomy(undefined, undefined, trimmed);
        
        // Update presence tracking
        if (channelRef.current) {
            await channelRef.current.track({
                online_at: new Date().toISOString(),
                name: trimmed
            });
        }
        
        // Send a direct move broadcast to update other players immediately
        if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'player_move',
                payload: {
                    address: walletAddress,
                    name: trimmed,
                    x: playerRef.current.x,
                    y: playerRef.current.y,
                    dir: playerRef.current.moveDirection,
                    animFrame: playerRef.current.animFrame,
                    map: currentMapPathRef.current,
                    aura: getMedalSynergy(economyRef.current.equipped_medals)?.name || null
                }
            });
        }
        
        showNotification("Nickname Actualizado", `Tu alias ahora es "${trimmed}".`);
    };

    const handleWatchFreeCoinsAd = async () => {
        const today = new Date().toISOString().split('T')[0];
        if (economyRef.current.last_ad_date !== today) {
            economyRef.current.last_ad_date = today;
            economyRef.current.ads_viewed_today = 0;
        }

        if ((economyRef.current.ads_viewed_today || 0) >= 20) {
            showNotification("Límite Diario", "Ya has alcanzado el límite máximo de 20 anuncios por hoy.");
            return;
        }

        const adManager = AdManager.getInstance();
        const res = await adManager.showRewardedAd({
            telegramBlockId: "34910",
            adsterraUrl: process.env.NEXT_PUBLIC_ADSTERRA_DIRECT_LINK || "YOUR_ADSTERRA_DIRECT_LINK"
        });

        if (res.success) {
            economyRef.current.addCoins(20);
            economyRef.current.ads_viewed_today = (economyRef.current.ads_viewed_today || 0) + 1;
            saveLocalEconomy();
            setEconomy(new Economy(economyRef.current.toSaveData()));
            showNotification("Recompensa", `¡Has recibido 20 Coins por ver el anuncio! (${economyRef.current.ads_viewed_today}/20 hoy)`);
        } else {
            showNotification("Anuncio Cancelado", `No se pudo obtener la recompensa. Detalle: ${res.error || 'Anuncio cancelado o no disponible'}`);
        }
    };

    const handleWatchHealAd = async () => {
        const adManager = AdManager.getInstance();
        const res = await adManager.showRewardedAd({
            telegramBlockId: "34911",
            adsterraUrl: process.env.NEXT_PUBLIC_ADSTERRA_DIRECT_LINK || "YOUR_ADSTERRA_DIRECT_LINK"
        });

        if (res.success) {
            const nextCount = adHealsViewed + 1;
            if (nextCount >= 2) {
                setAdHealsViewed(0);
                setAdHealSelectMode(true);
                showNotification("¡Anuncios Completados!", "Selecciona un Pokémon de tu equipo para restaurarlo al 100% HP.");
            } else {
                setAdHealsViewed(nextCount);
                showNotification("Anuncio Visto", `Anuncios vistos: ${nextCount}/2. ¡Ve un anuncio más para curar un Pokémon!`);
            }
        } else {
            showNotification("Anuncio Cancelado", `No se completó el anuncio. Detalle: ${res.error || 'Anuncio cancelado o no disponible'}`);
        }
    };

    const handleSelectPokemonToHeal = (index: number) => {
        const updatedTeam = [...team];
        const p = updatedTeam[index];
        if (p.hp >= p.maxHp) {
            showNotification("Centro Pokémon", `${p.id} ya está al 100% de HP.`);
            return;
        }
        updatedTeam[index] = { ...p, hp: p.maxHp };
        setTeam(updatedTeam);
        saveLocalEconomy(updatedTeam);
        setAdHealSelectMode(false);
        showNotification("Pokémon Curado", `¡Tu ${p.id} ha sido curado al 100% de HP!`);
    };

    const handleDoubleBattleReward = async () => {
        const coinsToDouble = doubleRewardCoins;

        const adManager = AdManager.getInstance();
        const res = await adManager.showRewardedAd({
            telegramBlockId: "34912",
            adsterraUrl: process.env.NEXT_PUBLIC_ADSTERRA_DIRECT_LINK || "YOUR_ADSTERRA_DIRECT_LINK"
        });

        if (res.success) {
            setDoubleRewardCoins(0);
            setDoubleRewardType(null);
            setNotification(null);
            economyRef.current.addCoins(coinsToDouble);
            saveLocalEconomy();
            setEconomy(new Economy(economyRef.current.toSaveData()));
            showNotification("¡Duplicado!", `¡Has recibido otras ${coinsToDouble} Coins por ver el anuncio!`);
        } else {
            showNotification("Anuncio no disponible", `No se pudo reproducir el anuncio. Detalle: ${res.error || 'Anuncio cancelado o no disponible'}`);
        }
    };

    const handleDoubleBattleRewardFromDialog = async () => {
        const coinsToDouble = doubleRewardCoins;

        const adManager = AdManager.getInstance();
        const res = await adManager.showRewardedAd({
            telegramBlockId: "34912",
            adsterraUrl: process.env.NEXT_PUBLIC_ADSTERRA_DIRECT_LINK || "YOUR_ADSTERRA_DIRECT_LINK"
        });

        if (res.success) {
            setDoubleRewardCoins(0);
            setDoubleRewardType(null);
            setActiveDialog(null);
            economyRef.current.addCoins(coinsToDouble);
            saveLocalEconomy();
            setEconomy(new Economy(economyRef.current.toSaveData()));
            showNotification("¡Duplicado!", `¡Has recibido otras ${coinsToDouble} Coins por ver el anuncio!`);
        } else {
            showNotification("Anuncio no disponible", `No se pudo reproducir el anuncio. Detalle: ${res.error || 'Anuncio cancelado o no disponible'}`);
        }
    };
    
    // Engine loading flags
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Loading assets...');
    const [mapNamePopup, setMapNamePopup] = useState<string | null>(null);
    const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
    const [joystickActive, setJoystickActive] = useState(false);
    const joystickRef = useRef<HTMLDivElement | null>(null);

    // Refs to keep state variables fresh inside async loop and listeners
    const currentMapPathRef = useRef(currentMapPath);
    const activeDialogRef = useRef(activeDialog);
    const economyRef = useRef(economy);
    const inventoryRef = useRef(inventory);
    const teamRef = useRef(team);
    const pcPokemonRef = useRef(pcPokemon);
    const activeWildBattleRef = useRef(activeWildBattle);
    const gymLeaderTeamRef = useRef<any[]>([]);
    const gymLeaderCurrentPokeIndexRef = useRef<number>(0);

    useEffect(() => { currentMapPathRef.current = currentMapPath; }, [currentMapPath]);
    useEffect(() => { activeWildBattleRef.current = activeWildBattle; }, [activeWildBattle]);
    useEffect(() => { activeDialogRef.current = activeDialog; }, [activeDialog]);
    useEffect(() => { economyRef.current = economy; }, [economy]);
    useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
    useEffect(() => { teamRef.current = team; }, [team]);
    useEffect(() => { pcPokemonRef.current = pcPokemon; }, [pcPokemon]);

    useEffect(() => {
        if (loading) {
            setMapNamePopup(null);
            return;
        }
        const displayName = getMapDisplayName(currentMapPath);
        setMapNamePopup(displayName);

        const timer = setTimeout(() => {
            setMapNamePopup(null);
        }, 15000);

        return () => {
            clearTimeout(timer);
        };
    }, [currentMapPath, loading]);

    useEffect(() => {
        if (activeWildBattle) {
            setWildBattleLog(prev => {
                if (prev.length === 0) {
                    return [battleMessage];
                }
                if (prev[prev.length - 1] === battleMessage) return prev;
                return [...prev, battleMessage];
            });
        } else {
            setWildBattleLog([]);
        }
    }, [battleMessage, activeWildBattle]);

    useEffect(() => {
        if (wildBattleLogRef.current) {
            wildBattleLogRef.current.scrollTop = wildBattleLogRef.current.scrollHeight;
        }
    }, [wildBattleLog]);

    // Anti-cheat Check: check if player left/disconnected during active PvP battle
    useEffect(() => {
        if (!loading && economy && economy.in_pvp_battle) {
            // Apply penalty: add loss and start 5 min cooldown
            economy.pvp_losses = (economy.pvp_losses || 0) + 1;
            economy.last_pvp_loss_time = Date.now();
            economy.pvp_cooldown_duration = 300;
            economy.in_pvp_battle = false;
            
            // Save state immediately
            const saveState = {
                name: playerNameRef.current,
                time: 0,
                player_coordinates: [playerRef.current.x, playerRef.current.y],
                map: currentMapPathRef.current,
                economy_data: economy.toSaveData(),
                inventory_data: inventoryRef.current.toSaveData(),
                team_data: teamRef.current,
                pc_pokemon: pcPokemonRef.current
            };
            
            // Local save
            const fullSaves = JSON.parse(localStorage.getItem('pixel_tamer_saves') || '{}');
            fullSaves[walletAddress || saveName] = saveState;
            localStorage.setItem('pixel_tamer_saves', JSON.stringify(fullSaves));
            
            // Cloud save
            if (walletAddress) {
                supabase
                    .from('player_saves')
                    .upsert({
                        wallet_address: walletAddress,
                        save_data: saveState,
                        updated_at: new Date().toISOString()
                    })
                    .then(({ error }) => {
                        if (error) console.error("Anti-cheat sync error:", error);
                    });
            }
            
            setEconomy(new Economy(economy.toSaveData()));
            showNotification("Penalización por Abandono", "Detectamos que saliste de tu último combate PvP de forma abrupta. Se ha registrado como una derrota por abandono.");
        }
    }, [loading, walletAddress]);

    // Supabase Real-time connection for Multiplayer
    useEffect(() => {
        if (loading || !walletAddress) return;

        const channel = supabase.channel('global_lobby', {
            config: {
                presence: {
                    key: walletAddress,
                },
            },
        });

        channelRef.current = channel;

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                setOtherPlayers((prev) => {
                    const next = { ...prev };
                    const onlineAddresses = Object.keys(state);
                    for (const addr of Object.keys(next)) {
                        if (!onlineAddresses.includes(addr)) {
                            delete next[addr];
                        }
                    }
                    return next;
                });
            })
            .on('presence', { event: 'leave' }, ({ key }) => {
                setOtherPlayers((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                });
                if (activePvPBattleRef.current && 
                    (activePvPBattleRef.current.status === 'battle' || activePvPBattleRef.current.status === 'syncing') &&
                    activePvPBattleRef.current.opponentAddress === key) {
                    
                    setActivePvPBattle((prev: any) => prev ? { ...prev, status: 'win' } : prev);
                    setNotification({ title: "Oponente Desconectado", message: "Tu oponente ha abandonado la partida. ¡Has ganado por abandono!" });
                }
            })
            .on('broadcast', { event: 'player_move' }, ({ payload }) => {
                if (payload.address === walletAddress) return;
                setOtherPlayers((prev) => ({
                    ...prev,
                    [payload.address]: {
                        name: payload.name,
                        x: payload.x,
                        y: payload.y,
                        dir: payload.dir,
                        animFrame: payload.animFrame,
                        map: payload.map,
                        aura: payload.aura
                    }
                }));
            })
            .on('broadcast', { event: 'pvp_invite' }, ({ payload }) => {
                if (payload.to === walletAddress && !activePvPBattle && !activeWildBattleRef.current) {
                    const lastLoss = economyRef.current.last_pvp_loss_time || 0;
                    const cooldownDuration = economyRef.current.pvp_cooldown_duration || 0;
                    const elapsed = (Date.now() - lastLoss) / 1000;
                    if (elapsed < cooldownDuration) {
                        const remaining = Math.max(0, Math.ceil(cooldownDuration - elapsed));
                        channel.send({
                            type: 'broadcast',
                            event: 'pvp_in_cooldown',
                            payload: {
                                from: walletAddress,
                                fromName: playerNameRef.current || "Tamer",
                                to: payload.from,
                                remaining
                            }
                        });
                        return;
                    }
                    setIncomingPvPInvite({
                        from: payload.from,
                        fromName: payload.fromName
                    });
                }
            })
            .on('broadcast', { event: 'pvp_in_cooldown' }, ({ payload }) => {
                if (payload.to === walletAddress && pendingPvPInviteRef.current === payload.from) {
                    setPendingPvPInvite(null);
                    pendingPvPInviteRef.current = null;
                    const mins = Math.floor(payload.remaining / 60);
                    const secs = payload.remaining % 60;
                    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                    setNotification({
                        title: "Oponente en Cooldown",
                        message: `El jugador ${payload.fromName || 'Tamer'} está en cooldown tras perder recientemente. Podrás desafiarlo en ${timeStr}.`
                    });
                }
            })
            .on('broadcast', { event: 'pvp_use_item' }, ({ payload }) => {
                if (payload.to === walletAddress) {
                    setPvpBattleLog(prev => [
                        ...prev,
                        `🧪 El oponente usó un objeto curativo en su ${activePvPBattleRef.current?.opponentPokemon?.id.toUpperCase() || 'Pokémon'}.`
                    ]);
                    setActivePvPBattle((prev: any) => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            opponentHp: payload.new_hp,
                            opponentStatus: payload.new_status !== undefined ? payload.new_status : prev.opponentStatus,
                            turn: walletAddress
                        };
                    });
                    setFloatingDamage({ value: "+HP", target: 'opponent' });
                    setTimeout(() => setFloatingDamage(null), 1000);
                    setNotification({
                        title: "Turno del oponente",
                        message: `El oponente usó ${payload.item_name} en su Pokémon. HP actual: ${payload.new_hp}. ¡Es tu turno!`
                    });
                }
            })
            .on('broadcast', { event: 'pvp_flee' }, ({ payload }) => {
                if (payload.to === walletAddress) {
                    setActivePvPBattle((prev: any) => {
                        if (!prev) return prev;
                        return { ...prev, status: 'opponent_flee' };
                    });
                    setNotification({
                        title: "Combate Cancelado",
                        message: `El oponente huyó de la batalla. El combate ha terminado y se reembolsó tu apuesta.`
                    });
                }
            })
            .on('broadcast', { event: 'pvp_accept' }, ({ payload }) => {
                if (payload.to === walletAddress && pendingPvPInviteRef.current === payload.from) {
                    setPendingPvPInvite(null);
                    pendingPvPInviteRef.current = null;
                    
                    // Deduct the 100 coin bet
                    economyRef.current.spendCoins(100);
                    economyRef.current.in_pvp_battle = true;
                    setEconomy(new Economy(economyRef.current.toSaveData()));
                    saveLocalEconomy();
 
                    const activePoke = teamRef.current.find((p: any) => p.hp > 0);
                    const synergy = getMedalSynergy(economyRef.current.equipped_medals);
                    const hpMult = synergy?.name === "Duo Versátil" ? 1.05 : 1.0;

                    // Start battle as challenger
                    setActivePvPBattle({
                        opponentAddress: payload.from,
                        opponentName: payload.fromName,
                        opponentPokemon: null,
                        myHp: Math.floor((activePoke?.hp || 100) * hpMult),
                        opponentHp: 100,
                        opponentMaxHp: 100,
                        status: 'syncing',
                        turn: walletAddress
                    });
                    
                    setPvpBattleLog([
                        "¡Comienza el duelo PvP!",
                        `¡Duelo contra ${payload.fromName}!`,
                        "Sincronizando..."
                    ]);
                    
                    // Reset PvP items used counter
                    setPvpItemsUsed(0);
                    
                    if (activePoke) {
                        channel.send({
                            type: 'broadcast',
                            event: 'pvp_sync_pokemon',
                            payload: {
                                from: walletAddress,
                                security: payload.from,
                                to: payload.from,
                                pokemon: { 
                                    id: activePoke.id, 
                                    level: activePoke.level, 
                                    hp: Math.floor((activePoke.hp || 100) * hpMult), 
                                    maxHp: Math.floor((activePoke.maxHp || 100) * hpMult) 
                                }
                            }
                        });
                    }
                }
            })
            .on('broadcast', { event: 'pvp_reject' }, ({ payload }) => {
                if (payload.to === walletAddress && pendingPvPInviteRef.current === payload.from) {
                    setPendingPvPInvite(null);
                    pendingPvPInviteRef.current = null;
                    setNotification({ title: "Desafío Rechazado", message: `El jugador ${payload.fromName || 'Tamer'} rechazó tu duelo.` });
                }
            })
            .on('broadcast', { event: 'pvp_sync_pokemon' }, ({ payload }) => {
                if (payload.to === walletAddress) {
                    const activePoke = teamRef.current.find((p: any) => p.hp > 0);
                    setPvpBattleLog(prev => [
                        ...prev,
                        "¡Equipos sincronizados!",
                        `Tu ${activePoke?.id.toUpperCase()} vs ${payload.pokemon.id.toUpperCase()} (Nvl ${payload.pokemon.level})`
                    ]);
                    setActivePvPBattle((prev: any) => {
                        if (!prev) return prev;
                        if (prev.status === 'battle') {
                            const activePoke = teamRef.current.find((p: any) => p.hp > 0);
                            if (activePoke) {
                                const synergy = getMedalSynergy(economyRef.current.equipped_medals);
                                const hpMult = synergy?.name === "Duo Versátil" ? 1.05 : 1.0;
                                channel.send({
                                    type: 'broadcast',
                                    event: 'pvp_sync_pokemon',
                                    payload: {
                                        from: walletAddress,
                                        to: payload.from,
                                        pokemon: { 
                                            id: activePoke.id, 
                                            level: activePoke.level, 
                                            hp: Math.floor((activePoke.hp || 100) * hpMult), 
                                            maxHp: Math.floor((activePoke.maxHp || 100) * hpMult) 
                                        }
                                    }
                                });
                            }
                        }
                        return { ...prev, opponentPokemon: payload.pokemon, opponentHp: payload.pokemon.hp, opponentMaxHp: payload.pokemon.maxHp, status: 'battle' };
                    });
                }
            })
            .on('broadcast', { event: 'pvp_damage' }, ({ payload }) => {
                if (payload.to === walletAddress) {
                    let finalDamage = payload.damage;
                    const synergy = getMedalSynergy(economyRef.current.equipped_medals);
                    let synergyMsg = "";
                    if (synergy?.name === "Fuerza Mística") {
                        finalDamage = Math.max(1, Math.floor(finalDamage * 0.90));
                        synergyMsg = " (¡Fuerza Mística redujo el daño!)";
                    }

                    const activePoke = teamRef.current.find((p: any) => p.hp > 0);
                    const newHp = Math.max(0, (activePvPBattleRef.current?.myHp || 100) - finalDamage);
                    setPvpBattleLog(prev => {
                        const logs = [
                            ...prev,
                            `💥 ${activePvPBattleRef.current?.opponentPokemon?.id.toUpperCase() || 'El oponente'} causó ${finalDamage} de daño a tu ${activePoke?.id.toUpperCase()}${synergyMsg}.`
                        ];
                        if (newHp <= 0 && activePoke) {
                            logs.push(`💀 ¡Tu ${activePoke.id.toUpperCase()} se debilitó!`);
                        }
                        return logs;
                    });

                    setActivePvPBattle((prev: any) => {
                        if (!prev) return prev;
                        
                        const newHpVal = Math.max(0, prev.myHp - finalDamage);
                        
                        setFloatingDamage({ value: finalDamage, target: 'player' });
                        setPlayerSpriteEffect('shake');
                        setTimeout(() => { setPlayerSpriteEffect('none'); setFloatingDamage(null); }, 800);
 
                        if (newHpVal <= 0) {
                            channel.send({
                                type: 'broadcast',
                                event: 'pvp_result',
                                payload: { from: walletAddress, to: payload.from, result: 'win' }
                            });
                            
                            // 5 minutes normal loss cooldown
                            economyRef.current.last_pvp_loss_time = Date.now();
                            economyRef.current.pvp_cooldown_duration = 300;
                            saveLocalEconomy();
                            setEconomy(new Economy(economyRef.current.toSaveData()));
                            
                            return { ...prev, myHp: newHp, status: 'loss' };
                        }
                        return { ...prev, myHp: newHp, turn: walletAddress };
                    });
                }
            })
            .on('broadcast', { event: 'pvp_result' }, ({ payload }) => {
                if (payload.to === walletAddress) {
                    setActivePvPBattle((prev: any) => {
                        if (!prev) return prev;
                        return { ...prev, status: payload.result };
                    });
                }
            })
            .on('broadcast', { event: 'pvp_abandon' }, ({ payload }) => {
                if (payload.to === walletAddress) {
                    setActivePvPBattle((prev: any) => {
                        if (!prev) return prev;
                        if (prev.status === 'battle' || prev.status === 'syncing') {
                            setNotification({ title: "Victoria por Abandono", message: "Tu oponente ha abandonado el combate de forma abrupta. ¡Has ganado por abandono!" });
                            return { ...prev, status: 'win' };
                        }
                        return prev;
                    });
                }
            });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    online_at: new Date().toISOString(),
                    name: playerNameRef.current
                });
            }
        });

        return () => {
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [loading, walletAddress]);

    // Auto-Save Loop (Every 15 seconds)
    useEffect(() => {
        const autoSaveTimer = setInterval(() => {
            // No auto-save during battles to avoid saving inconsistent states
            if (!activeWildBattleRef.current && !activePvPBattleRef.current && !isGymBattle) {
                saveLocalEconomy();
            }
        }, 15000);
        return () => clearInterval(autoSaveTimer);
    }, [isGymBattle]);

    // Save on beforeunload
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (activePvPBattleRef.current && (activePvPBattleRef.current.status === 'battle' || activePvPBattleRef.current.status === 'syncing')) {
                // Cheating / abandoning during battle!
                economyRef.current.pvp_losses = (economyRef.current.pvp_losses || 0) + 1;
                economyRef.current.last_pvp_loss_time = Date.now();
                economyRef.current.pvp_cooldown_duration = 300;
                economyRef.current.in_pvp_battle = false;
                
                const saveState = {
                    name: playerNameRef.current,
                    time: 0,
                    player_coordinates: [playerRef.current.x, playerRef.current.y],
                    map: currentMapPathRef.current,
                    economy_data: economyRef.current.toSaveData(),
                    inventory_data: inventoryRef.current.toSaveData(),
                    team_data: teamRef.current,
                    pc_pokemon: pcPokemonRef.current
                };

                const fullSaves = JSON.parse(localStorage.getItem('pixel_tamer_saves') || '{}');
                fullSaves[walletAddress || saveName] = saveState;
                localStorage.setItem('pixel_tamer_saves', JSON.stringify(fullSaves));

                // Send abandon broadcast to opponent
                if (channelRef.current) {
                    channelRef.current.send({
                        type: 'broadcast',
                        event: 'pvp_abandon',
                        payload: {
                            from: walletAddress,
                            to: activePvPBattleRef.current.opponentAddress
                        }
                    });
                }
            } else if (!activeWildBattleRef.current && !activePvPBattleRef.current && !isGymBattle) {
                const fullSaves = JSON.parse(localStorage.getItem('pixel_tamer_saves') || '{}');
                fullSaves[walletAddress || saveName] = {
                    name: playerNameRef.current,
                    time: 0,
                    player_coordinates: [playerRef.current.x, playerRef.current.y],
                    map: currentMapPathRef.current,
                    economy_data: economyRef.current.toSaveData(),
                    inventory_data: inventoryRef.current.toSaveData(),
                    team_data: teamRef.current,
                    pc_pokemon: pcPokemonRef.current
                };
                localStorage.setItem('pixel_tamer_saves', JSON.stringify(fullSaves));
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [walletAddress, saveName, isGymBattle]);

    // Timer: Sender Waiting for Accept (30s)
    useEffect(() => {
        if (pendingPvPInvite) {
            const timer = setTimeout(() => {
                if (pendingPvPInviteRef.current === pendingPvPInvite) {
                    setPendingPvPInvite(null);
                    pendingPvPInviteRef.current = null;
                    showNotification("Aviso", "El tiempo de desafío expiró sin respuesta.");
                }
            }, 30000);
            return () => clearTimeout(timer);
        }
    }, [pendingPvPInvite]);

    // Timer: Receiver Waiting to Accept (30s auto-reject)
    useEffect(() => {
        if (incomingPvPInvite) {
            const timer = setTimeout(() => {
                // Auto reject (penalty applied in handleRejectPvP)
                handleRejectPvP();
            }, 30000);
            return () => clearTimeout(timer);
        }
    }, [incomingPvPInvite]);

    // Resend sync packets periodically if stuck in syncing state
    useEffect(() => {
        let syncInterval: any;
        if (activePvPBattle && activePvPBattle.status === 'syncing' && channelRef.current) {
            syncInterval = setInterval(() => {
                const activePoke = teamRef.current.find((p: any) => p.hp > 0);
                if (activePoke && activePvPBattle.opponentAddress) {
                    channelRef.current.send({
                        type: 'broadcast',
                        event: 'pvp_sync_pokemon',
                        payload: {
                            from: walletAddress,
                            to: activePvPBattle.opponentAddress,
                            pokemon: { id: activePoke.id, level: activePoke.level, hp: activePoke.hp, maxHp: activePoke.maxHp }
                        }
                    });
                }
            }, 1000); // every 1 second
        }
        return () => clearInterval(syncInterval);
    }, [activePvPBattle, walletAddress]);

    // Timer: PvP Turn logic (45s)
    useEffect(() => {
        if (activePvPBattle && activePvPBattle.status === 'battle') {
            const timer = setInterval(() => {
                setPvpTurnTimer(prev => {
                    if (prev <= 1) {
                        // Time's up! If it's my turn, auto attack.
                        if (activePvPBattle.turn === walletAddress) {
                            const activePoke = team.find(p => p.hp > 0);
                            if (activePoke) {
                                const moves = typeof window !== 'undefined' && (window as any).POKEMON_MOVESET ? (window as any).POKEMON_MOVESET[activePoke.id] || [] : [];
                                if (moves.length > 0) {
                                    handleExecutePvPMove(moves[0].id || moves[0]);
                                }
                            }
                        }
                        return 45; // Reset timer for the next turn
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => {
                clearInterval(timer);
                setPvpTurnTimer(45);
            };
        } else {
            setPvpTurnTimer(45);
        }
    }, [activePvPBattle?.status, activePvPBattle?.turn]);

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
    const returnMapRef = useRef<string>('/assets/maps/tutorial/main.json');

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
    const lastCloudSaveTimeRef = useRef<number>(0);

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
        keysPressed.current = {};

        async function loadGameAssets() {
            try {
                setLoadingMessage('Cargando configuración...');

                if (currentMapPath.startsWith('procedural://')) {
                    prepareProceduralMap(currentMapPath);
                }
                
                const playerImg = new Image();
                playerImg.crossOrigin = "anonymous";
                playerImg.src = '/assets/entities/player/sprites.png';
                const playerImgPromise = new Promise((res) => {
                    playerImg.onload = res;
                    playerImg.onerror = res;
                });

                // Load player config, player sprites, and map JSON in parallel
                const [playerConfig, _, mapJson] = await Promise.all([
                    cachedFetchJson('/assets/entities/player/main.json'),
                    playerImgPromise,
                    cachedFetchJson(currentMapPath)
                ]);

                const playerColorKey = playerConfig.color_to_be_erased ?? '#C8BFE7';
                playerSpriteRef.current = makeColorTransparent(playerImg, playerColorKey);

                setLoadingMessage('Preparando el entorno...');

                const gridPath = mapJson.map.replace('src/assets/', '/assets/');
                const tileSize = mapJson.tile_size ?? 32;

                // Prepare tile components preloading
                const tileComponents: Record<string, TileComponent> = {};
                const componentPromises = mapJson.components.map(async (comp: any) => {
                    const cleanPath = comp.image.startsWith('data:') ? comp.image : comp.image.replace('src/assets/', '/assets/');
                    
                    let img = globalComponentCache[cleanPath];
                    if (!img) {
                        img = new Image();
                        if (!comp.image.startsWith('data:')) {
                            img.crossOrigin = "anonymous";
                        }
                        img.src = cleanPath;
                        await new Promise((res) => {
                            img.onload = res;
                            img.onerror = res;
                        });
                        globalComponentCache[cleanPath] = img;
                    }

                    tileComponents[comp.type] = {
                        type: comp.type,
                        size: comp.size,
                        image: cleanPath,
                        imgElement: img,
                        isSolid: comp.isSolid ?? false
                    };
                });

                // Prepare entity config & sprite preloading
                const entityDataPromises = mapJson.entities.map(async (ent: any) => {
                    const cleanLoc = ent.location.replace('src/assets/', '/assets/');
                    const entMeta = await cachedFetchJson(cleanLoc);

                    const cleanImgPath = entMeta.img.replace('src/assets/', '/assets/');
                    
                    let entImg = globalComponentCache[cleanImgPath];
                    if (!entImg) {
                        entImg = new Image();
                        entImg.crossOrigin = "anonymous";
                        entImg.src = cleanImgPath;
                        await new Promise((res) => {
                            entImg.onload = res;
                            entImg.onerror = res;
                        });
                        globalComponentCache[cleanImgPath] = entImg;
                    }

                    return { ent, entMeta, entImg };
                });

                // Fetch grid text, preload tiles, and preload entities all in parallel!
                const [gridText, _tileComponentResults, entityDatas] = await Promise.all([
                    cachedFetchText(gridPath),
                    Promise.all(componentPromises),
                    Promise.all(entityDataPromises)
                ]);

                // Synchronous processing begins
                const grid = gridText.trim().split('\n').map((line: string) => line.trim().split(/[\s,]+/));
                const height = grid.length * tileSize;
                const width = grid[0] ? grid[0].length * tileSize : 0;

                const preloadedEntities: MapEntity[] = [];
                const colliders: typeof mapDataRef.current.colliders = [];

                // Add automatic colliders for solid grid tiles (walls W1, counters C1, statues S1)
                for (let r = 0; r < grid.length; r++) {
                    for (let c = 0; c < grid[r].length; c++) {
                        const tileType = grid[r][c];
                        // Check explicit component isSolid property or fallback to hardcoded list
                        const componentDef = tileComponents[tileType];
                        const isSolid = componentDef?.isSolid || tileType === 'W1' || tileType === 'C1' || tileType === 'S1' || tileType === 'CW' || tileType === 'W';
                        
                        if (isSolid) {
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
                            dialogs: ent.dialogs,
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
                    const isOutdoor = currentMapPath.includes('tutorial') || currentMapPath.includes('route') || currentMapPath.includes('city');
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

        // Reset key pressed states when loading completes to prevent automatic movement/drifting
        keysPressed.current = {};

        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                return;
            }
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
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                return;
            }
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

            const player = playerRef.current;
            const mapData = mapDataRef.current;

            // 1. Process movement animation & inputs
            processMovement();

            // Broadcast movement changes if connected
            const currentAura = getMedalSynergy(economyRef.current.equipped_medals)?.name || null;
            if (
                channelRef.current &&
                (player.x !== lastBroadcastRef.current.x ||
                 player.y !== lastBroadcastRef.current.y ||
                 player.moveDirection !== lastBroadcastRef.current.dir ||
                 player.animFrame !== lastBroadcastRef.current.animFrame ||
                 currentMapPathRef.current !== lastBroadcastRef.current.map ||
                 currentAura !== lastBroadcastRef.current.aura)
            ) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'player_move',
                    payload: {
                        address: walletAddress,
                        name: playerNameRef.current,
                        x: player.x,
                        y: player.y,
                        dir: player.moveDirection,
                        animFrame: player.animFrame,
                        map: currentMapPathRef.current,
                        aura: currentAura
                    }
                });
                lastBroadcastRef.current = {
                    x: player.x,
                    y: player.y,
                    dir: player.moveDirection,
                    animFrame: player.animFrame,
                    map: currentMapPathRef.current,
                    aura: currentAura
                };
            }

            // 2. Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 3. Camera centering
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
                        // Draw local player aura
                        const synergy = getMedalSynergy(economyRef.current.equipped_medals);
                        const activeAura = synergy ? synergy.name : null;
                        if (activeAura && synergyAuras[activeAura]) {
                            const colors = synergyAuras[activeAura];
                            const radiusX = 16;
                            const radiusY = 6;
                            const grad = c.createRadialGradient(
                                player.x - camX + offsetX,
                                player.y - camY - 2 + offsetY,
                                2,
                                player.x - camX + offsetX,
                                player.y - camY - 2 + offsetY,
                                radiusX
                            );
                            grad.addColorStop(0, colors.color1);
                            grad.addColorStop(1, colors.color2);
                            
                            c.save();
                            c.beginPath();
                            if (c.ellipse) {
                                c.ellipse(
                                    player.x - camX + offsetX,
                                    player.y - camY - 2 + offsetY,
                                    radiusX,
                                    radiusY,
                                    0,
                                    0,
                                    2 * Math.PI
                                );
                            } else {
                                c.arc(
                                    player.x - camX + offsetX,
                                    player.y - camY - 2 + offsetY,
                                    radiusX,
                                    0,
                                    2 * Math.PI
                                );
                            }
                            c.fillStyle = grad;
                            c.fill();
                            c.restore();
                        }

                        let dirOffset = 0;
                        if (player.moveDirection === 'left') dirOffset = 48;
                        else if (player.moveDirection === 'up') dirOffset = 96;
                        else if (player.moveDirection === 'right') dirOffset = 144;

                        const frameWidth = 15;
                        const frameHeight = 20;
                        const scale = 2.5;

                        c.drawImage(
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

                        // Draw name tag above local player's head
                        c.font = "bold 8px monospace";
                        const nameTag = playerNameRef.current || "Tamer";
                        const textWidth = c.measureText(nameTag).width;
                        
                        c.fillStyle = "rgba(0, 0, 0, 0.5)";
                        c.fillRect(
                            player.x - camX - textWidth / 2 - 3 + offsetX,
                            player.y - camY - frameHeight * scale - 14 + offsetY,
                            textWidth + 6,
                            11
                        );
                        
                        c.fillStyle = "#ffe082"; // Light yellow for local player to easily distinguish themselves
                        c.fillText(
                            nameTag,
                            player.x - camX - textWidth / 2 + offsetX,
                            player.y - camY - frameHeight * scale - 6 + offsetY
                        );
                    }
                }
            });

            // Add Other Players
            Object.values(otherPlayersRef.current).forEach((otherPlayer: any) => {
                if (otherPlayer.map === currentMapPathRef.current) {
                    drawables.push({
                        ySort: otherPlayer.y,
                        draw: (c) => {
                            const sprite = playerSpriteRef.current;
                            if (sprite) {
                                // Draw Aura under remote player
                                const auraName = otherPlayer.aura;
                                if (auraName && synergyAuras[auraName]) {
                                    const colors = synergyAuras[auraName];
                                    const radiusX = 16;
                                    const radiusY = 6;
                                    const grad = c.createRadialGradient(
                                        otherPlayer.x - camX + offsetX,
                                        otherPlayer.y - camY - 2 + offsetY,
                                        2,
                                        otherPlayer.x - camX + offsetX,
                                        otherPlayer.y - camY - 2 + offsetY,
                                        radiusX
                                    );
                                    grad.addColorStop(0, colors.color1);
                                    grad.addColorStop(1, colors.color2);
                                    
                                    c.save();
                                    c.beginPath();
                                    if (c.ellipse) {
                                        c.ellipse(
                                            otherPlayer.x - camX + offsetX,
                                            otherPlayer.y - camY - 2 + offsetY,
                                            radiusX,
                                            radiusY,
                                            0,
                                            0,
                                            2 * Math.PI
                                        );
                                    } else {
                                        c.arc(
                                            otherPlayer.x - camX + offsetX,
                                            otherPlayer.y - camY - 2 + offsetY,
                                            radiusX,
                                            0,
                                            2 * Math.PI
                                        );
                                    }
                                    c.fillStyle = grad;
                                    c.fill();
                                    c.restore();
                                }

                                let dirOffset = 0;
                                if (otherPlayer.dir === 'left') dirOffset = 48;
                                else if (otherPlayer.dir === 'up') dirOffset = 96;
                                else if (otherPlayer.dir === 'right') dirOffset = 144;

                                const frameWidth = 15;
                                const frameHeight = 20;
                                const scale = 2.5;

                                c.drawImage(
                                    sprite,
                                    dirOffset + (otherPlayer.animFrame ?? 0) * 16, // source x
                                    12, // source y
                                    frameWidth,
                                    frameHeight,
                                    otherPlayer.x - camX - (frameWidth * scale) / 2 + offsetX,
                                    otherPlayer.y - camY - frameHeight * scale + offsetY,
                                    frameWidth * scale,
                                    frameHeight * scale
                                );

                                // Draw name tags
                                c.font = "bold 8px monospace";
                                const nameTag = otherPlayer.name || "Tamer";
                                const textWidth = c.measureText(nameTag).width;
                                
                                c.fillStyle = "rgba(0, 0, 0, 0.5)";
                                c.fillRect(
                                    otherPlayer.x - camX - textWidth / 2 - 3 + offsetX,
                                    otherPlayer.y - camY - frameHeight * scale - 14 + offsetY,
                                    textWidth + 6,
                                    11
                                );
                                
                                c.fillStyle = "#ffffff";
                                c.fillText(
                                    nameTag,
                                    otherPlayer.x - camX - textWidth / 2 + offsetX,
                                    otherPlayer.y - camY - frameHeight * scale - 6 + offsetY
                                );
                            }
                        }
                    });
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
                    // Check for wild encounter in tall grass (G2) or caves (CF)
                    const currentMapPathStr = currentMapPathRef.current;
                    const isWildArea = currentMapPathStr.includes('route') || currentMapPathStr.includes('cave') || currentMapPathStr.includes('procedural');
                    const col = Math.floor(player.x / mapData.tileSize);
                    const row = Math.floor((player.y - 1) / mapData.tileSize);
                    const tileType = mapData.grid[row]?.[col];
                    // W tile = water encounter (only in procedural lake routes)
                    const isWaterTile = tileType === 'W';
                    const isEncounterTile = (tileType === 'G2') || (currentMapPathStr.includes('cave') && tileType === 'CF') || isWaterTile;

                    if (isWildArea && isEncounterTile) {
                        const hasActivePoke = teamRef.current.some((p: any) => p.hp > 0);
                        // Lower encounter rate in caves since players walk on floor CF constantly
                        const encounterRate = currentMapPathStr.includes('cave') ? 0.08 : 0.15;
                        if (hasActivePoke && Math.random() < encounterRate) {
                            // Stop player movement
                            keysPressed.current = {};
                            player.isMoving = false;
                            player.animFrame = 0;

                            const playerLevel = economyRef.current.level;
                            const isWater = tileType === 'W';
                            const wild = generateWildPokemon(currentMapPathStr, playerLevel, isWater);

                            // Reset battle stages and animations
                            setPlayerAtkStage(0);
                            setPlayerDefStage(0);
                            setOpponentAtkStage(0);
                            setOpponentDefStage(0);
                            setIsBattleAnimating(false);
                            setPlayerSpriteEffect('none' as any);
                            setOpponentSpriteEffect('none' as any);
                            setFloatingDamage(null);

                            setDialogName("Hierba Alta");
                            setActiveDialog(`¡Un ${wild.name} salvaje de Nvl. ${wild.level} apareció!`);
                            
                            setBattleMessage("¿Qué hará tu Pokémon?");
                            setShowBallSelect(false);
                            setShowBagSelect(false);
                            setShowSwitchSelect(false);
                            setActiveWildBattle({
                                name: wild.name,
                                level: wild.level,
                                hp: wild.hp,
                                maxHp: wild.maxHp,
                                captureRate: 0.35
                            });
                        }
                    }
                }
                saveLocalEconomy(undefined, undefined, undefined, false);
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
            // Block input and movement if any modal is active, dialog is open, or in PvP interactions
            if (
                showMenuModal || 
                showNurseJoyModal || 
                showShop || 
                showDaily || 
                showMissions || 
                showInventoryModal || 
                activeWildBattleRef.current !== null ||
                activeDialogRef.current !== null ||
                activePvPBattleRef.current !== null ||
                pendingPvPInviteRef.current !== null ||
                incomingPvPInviteRef.current !== null ||
                activeEvolutionRef.current !== null
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
                const isOutOfBounds = nextX < 0 || nextX >= mapData.width || nextY < 0 || nextY >= mapData.height;
                if (isOutOfBounds) {
                    const transitioned = handleMapTransition(currentMapPathRef.current, nextX, nextY, dir);
                    if (transitioned) return;
                }

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

    const handleMapTransition = (currentPath: string, nextX: number, nextY: number, dir: string): boolean => {
        const path = currentPath.toLowerCase();

        // Helper to get spawn Y coordinate from dynamic maps
        const getDynamicSpawnY = (mapPath: string): number => {
            const gridText = assetCache[`${mapPath.replace('.json', '')}.txt`] || '';
            const rowsCount = gridText.trim().split('\n').length;
            return Math.max(0, (rowsCount - 2) * 32);
        };

        // 1. Tutorial map transitions (Pueblo Tutorial)
        if (path.includes('tutorial')) {
            if (nextY >= mapDataRef.current.height && dir === 'down') {
                transitionToMap('/assets/maps/route1/main.json', 480, 32);
                return true;
            }
        }

        // 2. Route 1 map transitions
        if (path.includes('route1')) {
            if (nextY < 0 && dir === 'up') {
                transitionToMap('/assets/maps/tutorial/main.json', 480, 1056);
                return true;
            }
            if (nextY >= mapDataRef.current.height && dir === 'down') {
                // Route 1 conecta directamente con la zona procedural infinita
                prepareProceduralMap('procedural://route_1');
                transitionToMap('procedural://route_1', 480, 32);
                return true;
            }
        }

        // 3. Cave map transitions (static cave in route1)
        if (path.includes('/cave')) {
            if (nextY < 0 && dir === 'up') {
                // Salida norte de cueva → vuelve a Ciudad Nueva (city1)
                transitionToMap('/assets/maps/city1/main.json', 1184, 1248);
                return true;
            }
            if (nextY >= mapDataRef.current.height && dir === 'down') {
                // Salida sur de cueva → vuelve a Ruta 01 (entrada cueva)
                transitionToMap('/assets/maps/route1/main.json', 1088, 384);
                return true;
            }
        }

        // 4. Infinite Procedural map transitions (Progresses Southwards)
        if (path.startsWith('procedural://')) {
            const parts = path.replace('procedural://', '').split('_');
            const type = parts[0];
            const index = parseInt(parts[1] || '1', 10);

            if (type === 'route') {
                if (dir === 'up') {
                    if (index === 1) {
                        // Procedural Ruta 1 regresa a Ruta 01 estática
                        transitionToMap('/assets/maps/route1/main.json', 800, 1248);
                    } else {
                        const nextMap = `procedural://cave_${index - 1}`;
                        prepareProceduralMap(nextMap);
                        const spawnY = getDynamicSpawnY(nextMap);
                        transitionToMap(nextMap, 512, spawnY);
                    }
                    return true;
                }
                if (dir === 'down') {
                    const nextMap = `procedural://settlement_${index}`;
                    prepareProceduralMap(nextMap);
                    transitionToMap(nextMap, 640, 32); // Spawn at settlement top entry
                    return true;
                }
            } else if (type === 'settlement') {
                if (dir === 'up') {
                    const nextMap = `procedural://route_${index}`;
                    prepareProceduralMap(nextMap);
                    const spawnY = getDynamicSpawnY(nextMap);
                    transitionToMap(nextMap, 480, spawnY); // Spawn at route bottom entry
                    return true;
                }
                if (dir === 'down') {
                    const nextMap = `procedural://cave_${index}`;
                    prepareProceduralMap(nextMap);
                    transitionToMap(nextMap, 512, 32); // Spawn at cave top entry
                    return true;
                }
            } else if (type === 'cave') {
                if (dir === 'up') {
                    const nextMap = `procedural://settlement_${index}`;
                    prepareProceduralMap(nextMap);
                    const spawnY = getDynamicSpawnY(nextMap);
                    transitionToMap(nextMap, 640, spawnY); // Spawn at settlement bottom entry
                    return true;
                }
                if (dir === 'down') {
                    if (index >= 13) {
                        setActiveDialog("La cueva se derrumba por el sur. ¡Has llegado al límite de la exploración! No puedes ir más allá.");
                        return false;
                    }
                    const nextMap = `procedural://route_${index + 1}`;
                    prepareProceduralMap(nextMap);
                    transitionToMap(nextMap, 480, 32); // Spawn at next route top entry
                    return true;
                }
            }
        }

        return false;
    };

    const transitionToMap = (path: string, spawnX: number, spawnY: number) => {
        setDialogName("Exploración");
        setActiveDialog("Cargando nueva zona...");
        playerRef.current.x = spawnX;
        playerRef.current.y = spawnY;
        playerRef.current.targetX = spawnX;
        playerRef.current.targetY = spawnY;
        playerRef.current.isMoving = false;
        playerRef.current.animFrame = 0;
        
        setCurrentMapPath(path);
        
        setTimeout(() => {
            setActiveDialog(null);
        }, 100);

        // Force cloud save immediately upon map change
        saveLocalEconomy(undefined, undefined, undefined, true);
    };

    // Generate themed wild pokemon based on location
    const generateWildPokemon = (mapPath: string, playerLevel: number, isWater?: boolean) => {
        const path = mapPath.toLowerCase();
        // Water Pokémon pool for lake encounters
        if (isWater) {
            const waterPool = ['poliwag', 'psyduck', 'slowpoke', 'magikarp', 'tentacool', 'shellder', 'horsea'];
            const waterName = waterPool[Math.floor(Math.random() * waterPool.length)];
            const waterSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === waterName) || { name: waterName, hp: 30, types: ['water'] };
            const wildLvl = Math.max(1, playerLevel * 2 + Math.floor(Math.random() * 3) - 1);
            const wildHp = (waterSpecies.hp || 30) + wildLvl * 5;
            const displayName = waterSpecies.name.charAt(0).toUpperCase() + waterSpecies.name.slice(1);
            return { id: `wild_${waterSpecies.name}`, name: displayName, level: wildLvl, hp: wildHp, maxHp: wildHp, type: 'Water' };
        }
        let pool = ['rattata', 'pidgey', 'caterpie', 'weedle', 'pikachu']; // default route1 pool

        if (path.includes('cave')) {
            pool = ['zubat', 'geodude', 'onix', 'gastly', 'sandshrew', 'diglett', 'machop'];
        } else if (path.includes('route2')) {
            pool = ['spearow', 'ekans', 'sandshrew', 'jigglypuff', 'rattata', 'spearow'];
        } else if (path.includes('route3')) {
            pool = ['mankey', 'growlithe', 'abra', 'machop', 'bellsprout', 'oddish'];
        } else if (path.includes('route4')) {
            pool = ['meowth', 'psyduck', 'poliwag', 'slowpoke', 'doduo', 'rattata'];
        } else if (path.includes('procedural')) {
            pool = ['caterpie', 'weedle', 'pidgey', 'rattata', 'zubat', 'geodude', 'pikachu', 'oddish', 'bellsprout', 'mankey', 'meowth', 'psyduck'];
        }

        const randomName = pool[Math.floor(Math.random() * pool.length)];
        const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === randomName) || {
            name: "pikachu",
            hp: 35,
            types: ["electric"]
        };

        const wildLvl = Math.max(1, playerLevel * 2 + Math.floor(Math.random() * 3) - 1);
        const wildHp = (species.hp || 35) + wildLvl * 5;
        const displayName = species.name.charAt(0).toUpperCase() + species.name.slice(1);
        const displayType = species.types && species.types[0] ? (species.types[0].charAt(0).toUpperCase() + species.types[0].slice(1)) : 'Normal';

        return {
            id: `wild_${species.name}`,
            name: displayName,
            level: wildLvl,
            hp: wildHp,
            maxHp: wildHp,
            type: displayType
        };
    };


    // ═══════════════════════════════════════════════════════════════
    // WORLD LAYOUT — 25 zonas fijas en orden
    // Tipos: 'city' | 'route' | 'cave' | 'legendary'
    // ═══════════════════════════════════════════════════════════════
    const WORLD_LAYOUT: Array<{
        type: 'city' | 'route' | 'cave' | 'legendary';
        name: string;
        hasGym: boolean;
        hasLake: boolean;
        hasTrainers: boolean;
        caveIndex?: number;
        legendaryPokemon?: string[];
    }> = [
        // Zone 1-8: Ciudades normales con rutas entre ellas
        { type: 'city',      name: 'Ciudad Aurora',    hasGym: true,  hasLake: false, hasTrainers: false },
        { type: 'route',     name: 'Ruta Esmeralda',   hasGym: false, hasLake: false, hasTrainers: true  },
        { type: 'city',      name: 'Ciudad Bruma',      hasGym: true,  hasLake: false, hasTrainers: false },
        { type: 'route',     name: 'Ruta del Lago',    hasGym: false, hasLake: true,  hasTrainers: false },
        { type: 'city',      name: 'Ciudad Coral',     hasGym: true,  hasLake: false, hasTrainers: false },
        { type: 'cave',      name: 'Cueva Sombría',    hasGym: false, hasLake: false, hasTrainers: false, caveIndex: 1 },
        { type: 'city',      name: 'Ciudad Volcán',    hasGym: true,  hasLake: false, hasTrainers: false },
        { type: 'route',     name: 'Ruta Tormenta',    hasGym: false, hasLake: false, hasTrainers: true  },
        { type: 'city',      name: 'Ciudad Pétalo',    hasGym: true,  hasLake: false, hasTrainers: false },
        { type: 'route',     name: 'Ruta del Mar',     hasGym: false, hasLake: true,  hasTrainers: false },
        { type: 'city',      name: 'Ciudad Glaciar',   hasGym: true,  hasLake: false, hasTrainers: false },
        { type: 'cave',      name: 'Cueva Cristal',    hasGym: false, hasLake: false, hasTrainers: false, caveIndex: 2 },
        { type: 'city',      name: 'Ciudad Prisma',    hasGym: true,  hasLake: false, hasTrainers: false },
        { type: 'route',     name: 'Ruta Celestial',   hasGym: false, hasLake: false, hasTrainers: true  },
        { type: 'cave',      name: 'Cueva Infinita',   hasGym: false, hasLake: false, hasTrainers: false, caveIndex: 3 },
        { type: 'city',      name: 'Ciudad Cumbre',    hasGym: true,  hasLake: false, hasTrainers: false },
        // Zone 17-21: 5 Ciudades Legendarias
        { type: 'legendary', name: 'Santuario Articulado', hasGym: false, hasLake: true, hasTrainers: false, legendaryPokemon: ['articuno'] },
        { type: 'legendary', name: 'Santuario Eléctrico',  hasGym: false, hasLake: false, hasTrainers: false, legendaryPokemon: ['zapdos'] },
        { type: 'legendary', name: 'Santuario Fuego',      hasGym: false, hasLake: false, hasTrainers: false, legendaryPokemon: ['moltres'] },
        { type: 'legendary', name: 'Santuario Psíquico',   hasGym: false, hasLake: false, hasTrainers: false, legendaryPokemon: ['mewtwo'] },
        { type: 'legendary', name: 'Santuario Divino',     hasGym: false, hasLake: true,  hasTrainers: false, legendaryPokemon: ['mew'] },
    ];

    // Seeded Random Number Generator
    const createRandom = (seedStr: string) => {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < seedStr.length; i++) {
            h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
        }
        h = h >>> 0;
        return () => {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            h = (h ^ (h >>> 16)) >>> 0;
            return h / 4294967296;
        };
    };

    // ═══════════════════════════════════════════════════════════════
    // PROCEDURAL MAP GENERATOR — usa WORLD_LAYOUT para zonas fijas
    // ═══════════════════════════════════════════════════════════════
    const prepareProceduralMap = (mapId: string) => {
        if (assetCache[mapId]) return;

        const parts = mapId.replace('procedural://', '').split('_');
        const type = parts[0]; // 'route' | 'settlement' | 'cave'
        const index = parseInt(parts[1] || '1', 10);
        const rand = createRandom(mapId);

        // Map procedural IDs to WORLD_LAYOUT
        // route_1 → index 1 (layout[1]), route_2 → layout[3], etc.
        // settlement_N → city zones
        // cave_N → cave zones
        const zoneInfo = (() => {
            if (type === 'route') {
                // Route indices: 1,2,3 map to layout indices 1,3,7,9,13
                const routeLayouts = WORLD_LAYOUT.filter(z => z.type === 'route');
                return routeLayouts[(index - 1) % routeLayouts.length] || routeLayouts[0];
            } else if (type === 'settlement') {
                const cityLayouts = WORLD_LAYOUT.filter(z => z.type === 'city' || z.type === 'legendary');
                return cityLayouts[(index - 1) % cityLayouts.length] || cityLayouts[0];
            } else if (type === 'cave') {
                const caveLayouts = WORLD_LAYOUT.filter(z => z.type === 'cave');
                return caveLayouts[(index - 1) % caveLayouts.length] || caveLayouts[0];
            }
            return WORLD_LAYOUT[0];
        })();

        let mapJson: any = {};
        let gridText = "";

        if (type === 'route') {
            const hasLake = zoneInfo.hasLake;
            const hasTrainers = zoneInfo.hasTrainers;
            const zoneName = zoneInfo.name;

            // Random map size: 28-50 cols, 40-70 rows
            const cols = 28 + Math.floor(rand() * 23); // 28 to 50
            const rows = 40 + Math.floor(rand() * 31); // 40 to 70
            const grid: string[][] = Array.from({ length: rows }, () => Array(cols).fill('G1'));

            // ── Path generation with smooth alignment (spawns on col 15) ──
            const pathCenters = new Array(rows);
            // Bottom 5 rows: pathCenter is 15
            for (let r = rows - 1; r >= rows - 5; r--) {
                pathCenters[r] = 15;
            }
            // Drift rows from rows - 6 down to 10
            const pathStyle = Math.floor(rand() * 3); // 0=sinuous, 1=zigzag, 2=straight
            let currentCenter = 15;
            for (let r = rows - 6; r >= 10; r--) {
                if (pathStyle === 0) {
                    // Sinuous: slow drift
                    if (rand() < 0.3) currentCenter += rand() < 0.5 ? -1 : 1;
                } else if (pathStyle === 1) {
                    // Zigzag: sharper turns every 8 rows
                    if (r % 8 === 0) currentCenter += rand() < 0.5 ? -3 : 3;
                }
                currentCenter = Math.max(5, Math.min(cols - 6, currentCenter));
                pathCenters[r] = currentCenter;
            }
            // Interpolation rows 9 down to 5: smoothly transition back to 15
            for (let r = 9; r >= 5; r--) {
                const t = (r - 4) / 6; // 10 - 4 = 6. At r = 10, t = 1; at r = 4, t = 0
                pathCenters[r] = Math.round(15 + t * (pathCenters[10] - 15));
            }
            // Top 5 rows: pathCenter is 15
            for (let r = 4; r >= 0; r--) {
                pathCenters[r] = 15;
            }

            for (let r = rows - 1; r >= 0; r--) {
                const pc = pathCenters[r];
                grid[r][pc - 1] = 'p4';
                grid[r][pc]     = 'p5';
                grid[r][pc + 1] = 'p6';
            }

            // ── Borders: cliff walls + tree rows ────────────────────
            for (let r = 0; r < rows; r++) {
                grid[r][0] = 'CW';
                grid[r][1] = 'T';
                grid[r][2] = 'T';
                grid[r][cols - 3] = 'T';
                grid[r][cols - 2] = 'T';
                grid[r][cols - 1] = 'CW';
            }

            // ── Scattered interior trees ─────────────────────────────
            for (let r = 5; r < rows - 5; r++) {
                for (let c = 3; c < cols - 3; c++) {
                    if (grid[r][c] === 'G1' && rand() < 0.04) {
                        grid[r][c] = 'T';
                    }
                }
            }

            // ── Tall grass G2 patches ────────────────────────────────
            const grassPatchCount = 4 + Math.floor(rand() * 5); // 4-8 patches
            for (let p = 0; p < grassPatchCount; p++) {
                const pRow = 5 + Math.floor(rand() * (rows - 10));
                const pSize = 3 + Math.floor(rand() * 4); // 3-6 tiles wide/tall
                const pSide = rand() < 0.5 ? 3 : cols - 3 - pSize; // left or right of path
                for (let gr = pRow; gr < pRow + pSize && gr < rows - 3; gr++) {
                    for (let gc = pSide; gc < pSide + pSize && gc < cols - 3; gc++) {
                        if (grid[gr][gc] === 'G1') grid[gr][gc] = 'G2';
                    }
                }
            }

            // ── Lake zone (W tiles + bridge) ─────────────────────────
            if (hasLake) {
                const lakeRow = Math.floor(rows * 0.35);
                const lakeRows = 6 + Math.floor(rand() * 4); // 6-9 rows tall
                const lakeCols = 8 + Math.floor(rand() * 6); // 8-13 wide
                const lakeStartCol = 3 + Math.floor(rand() * (cols - lakeCols - 6));

                for (let r = lakeRow; r < lakeRow + lakeRows && r < rows - 3; r++) {
                    for (let c = lakeStartCol; c < lakeStartCol + lakeCols && c < cols - 3; c++) {
                        // Don't place water on path tiles
                        if (grid[r][c] !== 'p4' && grid[r][c] !== 'p5' && grid[r][c] !== 'p6') {
                            grid[r][c] = 'W';
                        }
                    }
                }

                // Bridge over lake (replace W tiles on path with bridge tiles)
                for (let r = lakeRow; r < lakeRow + lakeRows && r < rows - 3; r++) {
                    const pc = pathCenters[r];
                    grid[r][pc - 1] = 'BR';
                    grid[r][pc]     = 'BR';
                    grid[r][pc + 1] = 'BR';
                }
            }

            gridText = grid.map(line => line.join(' ')).join('\n');

            // ── Entities: sign + optional trainer NPCs ───────────────
            const signRow = Math.floor(rows * 0.6);
            const pcAtSign = pathCenters[signRow];
            const entities: any[] = [
                {
                    location: "src/assets/entities/structures/sign/main.json",
                    coordinates: { x: (pcAtSign + 2) * 32, y: signRow * 32 },
                    dialogs: [
                        `${zoneName}\n^ Explorar al Norte\nv Regresar al Sur`
                    ]
                }
            ];

            // Trainer NPCs (2-3 in trainer routes)
            if (hasTrainers) {
                const trainerSprites = [
                    "src/assets/entities/npcs/persons/grandmarose/main.json",
                    "src/assets/entities/npcs/persons/grandmarose/main.json"
                ];
                const trainerCount = 2 + Math.floor(rand() * 2); // 2-3 trainers
                const trainerLevels = [index + 1, index + 2, index + 3];

                for (let t = 0; t < trainerCount; t++) {
                    const trainerRow = Math.floor(rows * (0.25 + t * 0.2));
                    const pc = pathCenters[trainerRow];
                    const trainerCol = rand() < 0.5
                        ? pc - 4 - Math.floor(rand() * 3)
                        : pc + 4 + Math.floor(rand() * 3);
                    const safeCol = Math.max(3, Math.min(cols - 4, trainerCol));
                    const trainerLvl = trainerLevels[t % trainerLevels.length];
                    const trainerPoke = ['pikachu', 'rattata', 'pidgey', 'mankey', 'geodude', 'abra'][Math.floor(rand() * 6)];

                    entities.push({
                        location: trainerSprites[t % trainerSprites.length],
                        coordinates: { x: safeCol * 32, y: trainerRow * 32 },
                        dialogs: [
                            `ENTRENADOR: ¡Alto! ¡Tú, Tamer!`,
                            `¡Voy a retarte con mi ${trainerPoke.charAt(0).toUpperCase() + trainerPoke.slice(1)} de Nvl. ${trainerLvl}!`,
                            `TRAINER_BATTLE:${trainerPoke}:${trainerLvl}`
                        ]
                    });
                }
            }

            mapJson = {
                map: `${mapId.replace('.json', '')}.txt`,
                tile_size: 32,
                components: [
                    { type: "G1",  size: [32, 32], image: "src/assets/maps/tutorial/imgs/grass1.png" },
                    { type: "G2",  size: [32, 32], image: "src/assets/maps/tutorial/imgs/grass2.png" },
                    { type: "p4",  size: [32, 32], image: "src/assets/maps/tutorial/imgs/path/path4.png" },
                    { type: "p5",  size: [32, 32], image: "src/assets/maps/tutorial/imgs/path/path5.png" },
                    { type: "p6",  size: [32, 32], image: "src/assets/maps/tutorial/imgs/path/path6.png" },
                    { type: "T",   size: [32, 32], image: "src/assets/entities/structures/tree/tree.png", isSolid: true },
                    { type: "CW",  size: [32, 32], image: "src/assets/maps/tutorial/imgs/cave_wall.png", isSolid: true },
                    { type: "W",   size: [32, 32], image: "src/assets/maps/tutorial/imgs/water.png", isSolid: true },
                    { type: "BR",  size: [32, 32], image: "src/assets/maps/tutorial/imgs/path/path5.png" }
                ],
                entities
            };

        } else if (type === 'settlement') {
            const isLegendary = zoneInfo?.type === 'legendary';
            const zoneName = zoneInfo?.name || `Pueblo Semilla ${index}`;
            const hasGym = zoneInfo?.hasGym ?? (index <= 8);
            const hasLake = zoneInfo?.hasLake ?? false;
            const legendaryPokemon = (zoneInfo as any)?.legendaryPokemon || [];

            const cols = isLegendary ? 50 : 40;
            const rows = isLegendary ? 50 : 40;
            const grid: string[][] = Array.from({ length: rows }, () => Array(cols).fill('G1'));
            const roadC = 20; // Force vertical road at column 20 to match spawn coordinates

            // Central plaza
            const plazaSize = isLegendary ? 14 : 10;
            const plazaStartR = Math.floor(rows / 2) - Math.floor(plazaSize / 2);
            const plazaStartC = roadC - Math.floor(plazaSize / 2);
            for (let r = plazaStartR; r < plazaStartR + plazaSize; r++) {
                for (let c = plazaStartC; c < plazaStartC + plazaSize; c++) {
                    grid[r][c] = 'p5';
                }
            }

            // Main road (vertical)
            for (let r = 0; r < rows; r++) {
                grid[r][roadC - 1] = 'p5';
                grid[r][roadC]     = 'p5';
                grid[r][roadC + 1] = 'p5';
            }

            // Tree borders
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const isRoad = c >= roadC - 1 && c <= roadC + 1;
                    const isBorder = r < 3 || r > rows - 4 || c < 3 || c > cols - 4;
                    if (isBorder && !isRoad) grid[r][c] = 'T';
                }
            }

            // Lake in legendary cities
            if (hasLake) {
                for (let r = 8; r < 18; r++) {
                    for (let c = 5; c < 18; c++) {
                        const isRoad = c >= roadC - 1 && c <= roadC + 1;
                        if (!isRoad && grid[r][c] === 'G1') grid[r][c] = 'W';
                    }
                }
            }

            gridText = grid.map(line => line.join(' ')).join('\n');
            const entities: any[] = [
                {
                    location: "src/assets/entities/structures/pokemoncenter/main.json",
                    coordinates: { x: (roadC - 10) * 32, y: 5 * 32 }
                },
                {
                    location: "src/assets/entities/structures/pokemonmarket/main.json",
                    coordinates: { x: (roadC + 5) * 32, y: 5 * 32 }
                },
                {
                    location: "src/assets/entities/npcs/persons/grandmarose/main.json",
                    coordinates: { x: roadC * 32, y: Math.floor(rows / 2) * 32 },
                    dialogs: isLegendary
                        ? [
                            `¡Bienvenido al ${zoneName}!`,
                            "Este lugar sagrado alberga pokémon de leyenda.",
                            "Solo los Tamers más poderosos pueden encontrarlos aquí.",
                            ...(legendaryPokemon.length > 0
                                ? [`Se dice que ${legendaryPokemon[0].charAt(0).toUpperCase() + legendaryPokemon[0].slice(1)} acecha por estas tierras...`]
                                : [])
                          ]
                        : [
                            `¡Bienvenido a ${zoneName}!`,
                            "Un refugio en medio de la exploración.",
                            "Si sigues al norte encontrarás nuevos desafíos."
                          ]
                },
                {
                    location: "src/assets/entities/structures/sign/main.json",
                    coordinates: { x: (roadC + 2) * 32, y: (Math.floor(rows / 2) + 4) * 32 },
                    dialogs: [
                        `${zoneName}\n^ Norte: Próxima Zona\nv Sur: Zona Anterior`
                    ]
                }
            ];

            // Add gym for normal cities
            if (hasGym) {
                entities.push({
                    location: "src/assets/entities/structures/gym/main.json",
                    coordinates: { x: (roadC - 3) * 32, y: Math.floor(rows * 0.4) * 32 }
                });
            }

            // Add 2 houses
            entities.push(
                { location: "src/assets/entities/structures/redhouse/main.json", coordinates: { x: (roadC - 9) * 32, y: Math.floor(rows * 0.55) * 32 } },
                { location: "src/assets/entities/structures/redhouse/main.json", coordinates: { x: (roadC + 5) * 32, y: Math.floor(rows * 0.55) * 32 } }
            );

            // Legendary grass patches around the lake (G2 = encounters)
            if (isLegendary) {
                for (let r = 5; r < rows - 5; r += 5) {
                    for (let c = 5; c < cols - 5; c += 5) {
                        const isRoad = c >= roadC - 1 && c <= roadC + 1;
                        if (!isRoad && grid[r][c] === 'G1' && rand() < 0.4) {
                            for (let dr = 0; dr < 2; dr++) for (let dc = 0; dc < 2; dc++) {
                                if (grid[r + dr]?.[c + dc] === 'G1') grid[r + dr][c + dc] = 'G2';
                            }
                        }
                    }
                }
                gridText = grid.map(line => line.join(' ')).join('\n');
            }

            mapJson = {
                map: `${mapId.replace('.json', '')}.txt`,
                tile_size: 32,
                components: [
                    { type: "G1", size: [32, 32], image: "src/assets/maps/tutorial/imgs/grass1.png" },
                    { type: "G2", size: [32, 32], image: "src/assets/maps/tutorial/imgs/grass2.png" },
                    { type: "p5", size: [32, 32], image: "src/assets/maps/tutorial/imgs/path/path5.png" },
                    { type: "T",  size: [32, 32], image: "src/assets/entities/structures/tree/tree.png", isSolid: true },
                    { type: "W",  size: [32, 32], image: "src/assets/maps/tutorial/imgs/water.png", isSolid: true }
                ],
                entities
            };

        } else if (type === 'cave') {
            const caveIdx = (zoneInfo as any)?.caveIndex ?? index;
            const zoneName = zoneInfo?.name || `Cueva ${caveIdx}`;

            const cols = 30 + Math.floor(rand() * 10); // 30-39
            const rows = 35 + Math.floor(rand() * 15); // 35-49
            const grid: string[][] = Array.from({ length: rows }, () => Array(cols).fill('CW'));

            const carveCircle = (cx: number, cy: number, r: number) => {
                for (let y = cy - r; y <= cy + r; y++) {
                    for (let x = cx - r; x <= cx + r; x++) {
                        if (x >= 2 && x < cols - 2 && y >= 2 && y < rows - 2) {
                            const dx = x - cx; const dy = y - cy;
                            if (dx * dx + dy * dy <= r * r) grid[y][x] = 'CF';
                        }
                    }
                }
            };

            // 2-4 chambers based on cave index
            const chamberCount = 2 + (caveIdx % 3);
            for (let ch = 0; ch < chamberCount; ch++) {
                const cx = 5 + Math.floor(rand() * (cols - 10));
                const cy = 5 + Math.floor(rand() * (rows - 10));
                const radius = 4 + Math.floor(rand() * 4);
                carveCircle(cx, cy, radius);
            }

            // Vertical corridor connecting chambers
            const corridorC = 16; // Force vertical corridor at column 16 to match spawn coordinates
            for (let r = 2; r < rows - 2; r++) {
                grid[r][corridorC - 1] = 'CF';
                grid[r][corridorC]     = 'CF';
                grid[r][corridorC + 1] = 'CF';
            }

            // Rare ore patches (visual variety)
            for (let r = 3; r < rows - 3; r++) {
                for (let c = 3; c < cols - 3; c++) {
                    if (grid[r][c] === 'CW' && rand() < 0.03) grid[r][c] = 'CO';
                }
            }

            gridText = grid.map(line => line.join(' ')).join('\n');

            mapJson = {
                map: `${mapId.replace('.json', '')}.txt`,
                tile_size: 32,
                components: [
                    { type: "CF", size: [32, 32], image: "src/assets/maps/tutorial/imgs/cave_floor.png" },
                    { type: "CW", size: [32, 32], image: "src/assets/maps/tutorial/imgs/cave_wall.png", isSolid: true },
                    { type: "CO", size: [32, 32], image: "src/assets/maps/tutorial/imgs/cave_wall.png", isSolid: true }
                ],
                entities: [
                    {
                        location: "src/assets/entities/structures/sign/main.json",
                        coordinates: { x: (corridorC + 2) * 32, y: Math.floor(rows * 0.5) * 32 },
                        dialogs: [
                            `${zoneName}\n^ Norte: Siguiente Zona\nv Sur: Regresar`
                        ]
                    }
                ]
            };
        }

        assetCache[mapId] = mapJson;
        assetCache[`${mapId.replace('.json', '')}.txt`] = gridText;
    };


    // Check if player is standing on a door tile and automatically enter/interact
    const checkAutoDoorEntry = (x: number, y: number) => {
        const currentPath = currentMapPathRef.current;
        const isInterior = currentPath.includes('pokecenter')
            || currentPath.includes('pokemart')
            || currentPath.includes('gym')
            || currentPath.includes('redhouse');

        // ── INTERIOR EXIT ─────────────────────────────────────────────────────
        if (isInterior) {
            const mapData = mapDataRef.current;
            if (!mapData) return false;
            const tileSize = mapData.tileSize || 32;
            const col = Math.floor(x / tileSize);
            const row = Math.floor((y - 1) / tileSize);
            const tileType = mapData.grid?.[row]?.[col];
            if (tileType === 'CP') {
                setDialogName("Exit");
                setActiveDialog("Exiting building...");
                playerRef.current.x = returnCoordsRef.current[0];
                playerRef.current.y = returnCoordsRef.current[1];
                playerRef.current.targetX = returnCoordsRef.current[0];
                playerRef.current.targetY = returnCoordsRef.current[1];
                playerRef.current.isMoving = false;
                setCurrentMapPath(returnMapRef.current);
                setActiveDialog(null);
                playerRef.current.isMoving = false;
                return true;
            }
        }

        // ── CAVE ENTRANCE WARP ────────────────────────────────────────────────
        if (!isInterior) {
            const mapData = mapDataRef.current;
            if (mapData) {
                const tileSize = mapData.tileSize || 32;
                const col = Math.floor(x / tileSize);
                const row = Math.floor((y - 1) / tileSize);
                const directRow = Math.floor(y / tileSize);
                const tileType = mapData.grid?.[row]?.[col] || mapData.grid?.[directRow]?.[col];
                if (tileType === 'CE') {
                    if (currentPath.includes('route1')) {
                        // Enter cave from the south (bottom) entrance
                        transitionToMap('/assets/maps/cave/main.json', 256, 1536);
                        return true;
                    } else if (currentPath.includes('city1')) {
                        // Enter cave from the north (top) entrance
                        transitionToMap('/assets/maps/cave/main.json', 992, 32);
                        return true;
                    }
                }
            }
        }

        // ── PARENT MAP ENTRY ──────────────────────────────────────────────────
        const mapData = mapDataRef.current;
        if (!mapData || !mapData.entities) return false;

        const isNearDoor = (px: number, py: number, ent: any) => {
            const doorX = ent.x + ent.w / 2;
            const doorY = ent.y + ent.h;
            const xTolerance = ent.w >= 180 ? 24 : 20;
            return Math.abs(px - doorX) <= xTolerance && py >= doorY - 20 && py <= doorY + 8;
        };

        for (const ent of mapData.entities) {
            const lowerLoc = ent.location.toLowerCase();
            
            const isCenter = lowerLoc.includes('pokemoncenter');
            const isMart = lowerLoc.includes('pokemonmarket') || lowerLoc.includes('pokemart');
            const isGym = lowerLoc.includes('gym');
            const isHouse = lowerLoc.includes('redhouse') || lowerLoc.includes('casa') || (lowerLoc.includes('house') && !lowerLoc.includes('greenhouse'));

            if (isCenter || isMart || isGym || isHouse) {
                if (isNearDoor(x, y, ent)) {
                    let destMap = '';
                    let dialogTitle = '';
                    let dialogMsg = '';
                    
                    if (isCenter) {
                        destMap = '/assets/maps/pokecenter/main.json';
                        dialogTitle = "Centro Pokemon";
                        dialogMsg = "Entering the Pokémon Center...";
                    } else if (isMart) {
                        destMap = '/assets/maps/pokemart/main.json';
                        dialogTitle = "Comercio Pokemon";
                        dialogMsg = "Entering the PokeMart Store...";
                    } else if (isGym) {
                        let gymIndex = 1;
                        const curMap = currentPath.toLowerCase();
                        if (curMap.includes('procedural://settlement_')) {
                            const parts = curMap.replace('procedural://settlement_', '').split('_');
                            gymIndex = parseInt(parts[0] || '1', 10) + 1;
                        }

                        if (gymIndex > 1) {
                            const GYM_MEDALS = [
                                "", // Gym 0 (unused)
                                "Medalla Roca",
                                "Medalla Cascada",
                                "Medalla Trueno",
                                "Medalla Arcoiris",
                                "Medalla Alma",
                                "Medalla Pantano",
                                "Medalla Volcan",
                                "Medalla Tierra"
                            ];

                            if (gymIndex <= 9) {
                                const requiredMedal = GYM_MEDALS[gymIndex - 1];
                                if (!economyRef.current.medals.includes(requiredMedal)) {
                                    showNotification(
                                        "Gimnasio Bloqueado",
                                        `Necesitas la ${requiredMedal} del gimnasio anterior para entrar a desafiar a este líder.`
                                    );
                                    return false;
                                }
                            } else {
                                const prevGymDefeated = (economyRef.current.defeated_gyms[String(gymIndex - 1)] || 0) > 0;
                                if (!prevGymDefeated) {
                                    showNotification(
                                        "Gimnasio Bloqueado",
                                        `Necesitas derrotar al líder del gimnasio anterior (Gimnasio ${gymIndex - 1}) para poder ingresar a este.`
                                    );
                                    return false;
                                }
                            }
                        }

                        const finalGymIndex = Math.min(Math.max(gymIndex, 1), 8);
                        destMap = `/assets/maps/gym/gym_${finalGymIndex}.json`;
                        dialogTitle = "Gimnasio";
                        dialogMsg = "Entering the Gym...";
                    } else {
                        destMap = '/assets/maps/redhouse/main.json';
                        dialogTitle = "Casa";
                        dialogMsg = "Entering house...";
                    }

                    // Save return details
                    returnMapRef.current = currentPath;
                    const doorX = ent.x + ent.w / 2;
                    const doorY = ent.y + ent.h;
                    returnCoordsRef.current = [Math.round(doorX), Math.round(doorY + 16)];

                    setDialogName(dialogTitle);
                    setActiveDialog(dialogMsg);
                    
                    playerRef.current.x = 144;
                    playerRef.current.y = 224;
                    playerRef.current.targetX = 144;
                    playerRef.current.targetY = 224;
                    playerRef.current.isMoving = false;
                    
                    setCurrentMapPath(destMap);
                    setActiveDialog(null);
                    return true;
                }
            }
        }

        return false;
    };

    // PvP Handlers
    const handlePvPInvite = (targetAddress: string) => {
        if (!channelRef.current) return;
        
        if ((economyRef.current.coins || 0) < 100) {
            showNotification("Fondos Insuficientes", "Necesitas al menos 100 Coins para apostar en un duelo PvP.");
            return;
        }

        channelRef.current.send({
            type: 'broadcast',
            event: 'pvp_invite',
            payload: {
                from: walletAddress,
                fromName: playerNameRef.current || "Tamer",
                to: targetAddress
            }
        });
        setPendingPvPInvite(targetAddress);
        setPlayerContextMenu(null);
        showNotification("Desafío", "Invitación enviada. Esperando respuesta...");
    };

    const handleRejectPvP = () => {
        if (!incomingPvPInvite || !channelRef.current) return;
        
        // Penalty of 5 coins
        let msg = "Rechazaste el duelo.";
        const success = economyRef.current.spendCoins(5);
        if (success) {
            setEconomy(new Economy(economyRef.current.toSaveData()));
            saveLocalEconomy();
            msg = "Rechazaste el duelo y perdiste 5 Coins como penalidad.";
        }
        showNotification("Desafío Rechazado", msg);
        
        channelRef.current.send({
            type: 'broadcast',
            event: 'pvp_reject',
            payload: {
                from: walletAddress,
                fromName: playerNameRef.current || "Tamer",
                to: incomingPvPInvite.from
            }
        });
        
        setIncomingPvPInvite(null);
    };

    const handleAcceptPvP = () => {
        if (!incomingPvPInvite || !channelRef.current) return;
        
        if ((economyRef.current.coins || 0) < 100) {
            showNotification("Fondos Insuficientes", "Necesitas al menos 100 Coins para apostar en este duelo.");
            // Force reject
            handleRejectPvP();
            return;
        }

        // Pay the bet
        economyRef.current.spendCoins(100);
        economyRef.current.in_pvp_battle = true;
        setEconomy(new Economy(economyRef.current.toSaveData()));
        saveLocalEconomy();

        channelRef.current.send({
            type: 'broadcast',
            event: 'pvp_accept',
            payload: {
                from: walletAddress,
                fromName: playerNameRef.current || "Tamer",
                to: incomingPvPInvite.from
            }
        });
        
        const activePoke = teamRef.current.find((p: any) => p.hp > 0);
        const synergy = getMedalSynergy(economyRef.current.equipped_medals);
        const hpMult = synergy?.name === "Duo Versátil" ? 1.05 : 1.0;

        setActivePvPBattle({
            opponentAddress: incomingPvPInvite.from,
            opponentName: incomingPvPInvite.fromName,
            opponentPokemon: null,
            myHp: Math.floor((activePoke?.hp || 100) * hpMult),
            opponentHp: 100,
            opponentMaxHp: 100,
            status: 'syncing',
            turn: incomingPvPInvite.from
        });
        
        setPvpBattleLog([
            "¡Comienza el duelo PvP!",
            `¡Enfréntate a ${incomingPvPInvite.fromName}!`,
            "Sincronizando..."
        ]);
        
        setPvpItemsUsed(0);
        
        if (activePoke) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'pvp_sync_pokemon',
                payload: {
                    from: walletAddress,
                    to: incomingPvPInvite.from,
                    pokemon: { 
                        id: activePoke.id, 
                        level: activePoke.level, 
                        hp: Math.floor((activePoke.hp || 100) * hpMult), 
                        maxHp: Math.floor((activePoke.maxHp || 100) * hpMult) 
                    }
                }
            });
        }
        
        setIncomingPvPInvite(null);
    };

    const handleExecutePvPMove = async (moveId: string) => {
        if (!activePvPBattle || activePvPBattle.status !== 'battle' || isBattleAnimating) return;

        const activePokeIdx = team.findIndex((p: any) => p.hp > 0);
        if (activePokeIdx === -1) return;
        const activePoke = team[activePokeIdx];
        const move = MOVES_DATABASE[moveId] || MOVES_DATABASE.tackle;

        setIsBattleAnimating(true);
        setPlayerSpriteEffect('bounce');
        await new Promise(r => setTimeout(r, 500));
        setPlayerSpriteEffect('none');

        // Deterministic damage calculation (no randomness)
        const playerSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === activePoke.id.toLowerCase());
        const opponentSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === activePvPBattle.opponentPokemon?.id.toLowerCase());

        const playerAtk = playerSpecies?.attack || 50;
        const opponentDef = opponentSpecies?.defense || 50;
        const playerLevel = activePoke.level ?? 1;

        let baseDmg = (((2 * playerLevel / 5 + 2) * move.power * (playerAtk / opponentDef)) / 50) + 2;

        const opponentTypes = opponentSpecies?.types || ['normal'];
        const mult = getTypeMultiplier(move.type, opponentTypes);

        let playerDmg = Math.floor(baseDmg * mult);
        playerDmg = Math.max(1, playerDmg);

        if (move.power === 0) playerDmg = 5; // Status moves deal flat 5 in realtime PvP

        const synergy = getMedalSynergy(economyRef.current.equipped_medals);
        if (synergy?.name === "Magma Volcánico") {
            playerDmg = Math.floor(playerDmg * 1.10);
        } else if (synergy?.name === "Tempestad Eléctrica") {
            if (Math.random() < 0.10) {
                playerDmg = Math.floor(playerDmg * 1.5);
                showNotification("¡Golpe Crítico!", "¡Tu Sinergia Tempestad Eléctrica ha causado un golpe crítico!");
            }
        } else if (synergy?.name === "Pantano Tóxico" && move.power === 0) {
            playerDmg = 8;
        }

        const nextOpponentHp = Math.max(0, activePvPBattle.opponentHp - playerDmg);
        let synergyMsg = "";
        if (synergy?.name === "Magma Volcánico") {
            synergyMsg = " (¡Boost de Magma Volcánico!)";
        } else if (synergy?.name === "Pantano Tóxico" && move.power === 0) {
            synergyMsg = " (¡Boost de Pantano Tóxico!)";
        }

        setPvpBattleLog(prev => {
            const logs = [
                ...prev,
                `⚔️ Tu ${activePoke.id.toUpperCase()} usó ${move.name} e infligió ${playerDmg} de daño${synergyMsg}.`
            ];
            if (nextOpponentHp <= 0) {
                logs.push(`💀 ¡El ${activePvPBattle.opponentPokemon?.id.toUpperCase() || 'Pokémon oponente'} se debilitó!`);
            }
            return logs;
        });

        setOpponentSpriteEffect('shake');
        setFloatingDamage({ value: playerDmg, target: 'opponent' });
        
        setActivePvPBattle((prev: any) => ({ 
            ...prev, 
            opponentHp: nextOpponentHp,
            turn: prev.opponentAddress
        }));
        
        channelRef.current?.send({
            type: 'broadcast',
            event: 'pvp_damage',
            payload: {
                from: walletAddress,
                to: activePvPBattle.opponentAddress,
                damage: playerDmg
            }
        });

        await new Promise(r => setTimeout(r, 1000));
        setOpponentSpriteEffect('none');
        setFloatingDamage(null);
        setIsBattleAnimating(false);
    };

    const getPlayerUnderMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || activeWildBattle || activePvPBattle || showMenuModal) return null;
        const rect = canvasRef.current.getBoundingClientRect();
        
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const frameWidth = 15;
        const frameHeight = 20;
        const scale = 2.5;
        
        const mapData = mapDataRef.current;
        const camX = Math.max(0, Math.min(playerRef.current.x - canvasRef.current.width / 2, mapData.width - canvasRef.current.width));
        const camY = Math.max(0, Math.min(playerRef.current.y - canvasRef.current.height / 2, mapData.height - canvasRef.current.height));

        const offsetX = canvasRef.current.width > mapData.width ? Math.floor((canvasRef.current.width - mapData.width) / 2) : 0;
        const offsetY = canvasRef.current.height > mapData.height ? Math.floor((canvasRef.current.height - mapData.height) / 2) : 0;

        const padding = 20; // 20px padding for easier clicking

        for (const [address, otherPlayer] of Object.entries(otherPlayersRef.current)) {
            if (otherPlayer.map === currentMapPathRef.current) {
                const px = otherPlayer.x - camX - (frameWidth * scale) / 2 + offsetX;
                const py = otherPlayer.y - camY - frameHeight * scale + offsetY;
                const pw = frameWidth * scale;
                const ph = frameHeight * scale;

                if (clickX >= px - padding && clickX <= px + pw + padding && clickY >= py - padding && clickY <= py + ph + padding) {
                    return {
                        address,
                        name: otherPlayer.name || "Tamer",
                        x: e.clientX,
                        y: e.clientY
                    };
                }
            }
        }
        return null;
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const player = getPlayerUnderMouse(e);
        if (player) {
            // Only update state if it's a different player to avoid unnecessary re-renders
            if (!hoveredPlayer || hoveredPlayer.address !== player.address) {
                setHoveredPlayer(player);
            } else {
                // Update position
                setHoveredPlayer(player);
            }
        } else if (hoveredPlayer) {
            setHoveredPlayer(null);
        }
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const player = getPlayerUnderMouse(e);
        if (player) {
            setPlayerContextMenu({
                address: player.address,
                name: player.name,
                x: player.x,
                y: player.y
            });
        } else {
            setPlayerContextMenu(null);
        }
    };

    const fetchLeaderboard = async () => {
        const { data, error } = await supabase
            .from('player_saves')
            .select('wallet_address, save_data');
            
        if (data) {
            const ranks = data.map((row: any) => {
                const pvpWins = row.save_data?.economy_data?.pvp_wins || 0;
                const pvpLosses = row.save_data?.economy_data?.pvp_losses || 0;
                const pName = row.save_data?.name || "Entrenador";
                return {
                    address: row.wallet_address,
                    name: pName,
                    wins: pvpWins,
                    losses: pvpLosses
                };
            }).sort((a: any, b: any) => b.wins - a.wins).slice(0, 50);
            setPvpLeaderboard(ranks);
        }
    };

    // Interaction checks (facing building door or characters)
    const handleInteraction = () => {
        if (activeDialogRef.current !== null) {
            if (showNurseJoyModal) {
                return; // Don't close text bubble with Space while Joy's menu is open
            }
            
            // Advance through dialogs queue
            if (currentDialogList && currentDialogList.length > 0 && currentDialogIndex < currentDialogList.length - 1) {
                const nextIdx = currentDialogIndex + 1;
                const nextText = currentDialogList[nextIdx];
                setCurrentDialogIndex(nextIdx);
                
                if (nextText.startsWith('TRAINER_BATTLE:')) {
                    const parts = nextText.split(':');
                    const wildName = parts[1] || 'pikachu';
                    const wildLvl = parseInt(parts[2] || '5', 10);
                    
                    // Close dialogue
                    setActiveDialog(null);
                    setCurrentDialogList([]);
                    setCurrentDialogIndex(0);

                    // Reset battle stages and animations
                    setPlayerAtkStage(0);
                    setPlayerDefStage(0);
                    setOpponentAtkStage(0);
                    setOpponentDefStage(0);
                    setIsBattleAnimating(false);
                    setPlayerSpriteEffect('none' as any);
                    setOpponentSpriteEffect('none' as any);
                    setFloatingDamage(null);

                    // Start Trainer Battle
                    setIsTrainerBattle(true);
                    setBattleMessage(`¡El Entrenador te desafía con su ${wildName.toUpperCase()}!`);
                    setShowBallSelect(false);
                    setShowBagSelect(false);
                    setShowSwitchSelect(false);

                    const stats = getPokemonStats(wildName, wildLvl);
                    setActiveWildBattle({
                        name: wildName,
                        level: wildLvl,
                        hp: stats.maxHp,
                        maxHp: stats.maxHp,
                        captureRate: 0.0 // Can't capture Trainer's Pokémon!
                    });
                } else {
                    setActiveDialog(nextText);
                }
            } else {
                setActiveDialog(null);
                setCurrentDialogList([]);
                setCurrentDialogIndex(0);
            }
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
                else if (entity.name === "Gym Leader Brock" || (entity.name && entity.name.startsWith("Líder "))) {
                    // Extract procedural town index from returnMapRef.current
                    let gymIndex = 1;
                    const returnMap = returnMapRef.current.toLowerCase();
                    if (returnMap.includes('procedural://settlement_')) {
                        const parts = returnMap.replace('procedural://settlement_', '').split('_');
                        gymIndex = parseInt(parts[0] || '1', 10) + 1;
                    }

                    if (gymIndex > 13) {
                        setDialogName("Gimnasio");
                        setActiveDialog("Este gimnasio parece estar sellado. ¡No hay más líderes en esta región!");
                        return;
                    }

                    const gymBosses = [
                        { name: "Onix", level: 12, hp: 90, leader: "Brock" },
                        { name: "Starmie", level: 22, hp: 130, leader: "Misty" },
                        { name: "Raichu", level: 32, hp: 170, leader: "Lt. Surge" },
                        { name: "Vileplume", level: 42, hp: 210, leader: "Erika" },
                        { name: "Weezing", level: 52, hp: 250, leader: "Koga" },
                        { name: "Alakazam", level: 62, hp: 290, leader: "Sabrina" },
                        { name: "Arcanine", level: 72, hp: 330, leader: "Blaine" },
                        { name: "Dragonite", level: 82, hp: 370, leader: "Giovanni" }
                    ];

                    const boss = gymIndex <= 8 ? gymBosses[gymIndex - 1] : {
                        name: gymIndex === 9 ? "Mewtwo" : gymIndex === 10 ? "Mew" : gymIndex === 11 ? "Articuno" : gymIndex === 12 ? "Zapdos" : gymIndex === 13 ? "Moltres" : "Mewtwo",
                        level: gymIndex * 10,
                        hp: 300 + gymIndex * 20,
                        leader: gymIndex === 9 ? "Master Mewtwo" : gymIndex === 10 ? "Master Mew" : gymIndex === 11 ? "Master Articuno" : gymIndex === 12 ? "Master Zapdos" : gymIndex === 13 ? "Master Moltres" : `Master ${gymIndex}`
                    };

                    if (gymIndex > 1) {
                        const GYM_MEDALS = [
                            "", // Gym 0
                            "Medalla Roca",
                            "Medalla Cascada",
                            "Medalla Trueno",
                            "Medalla Arcoiris",
                            "Medalla Alma",
                            "Medalla Pantano",
                            "Medalla Volcan",
                            "Medalla Tierra"
                        ];

                        if (gymIndex <= 9) {
                            const requiredMedal = GYM_MEDALS[gymIndex - 1];
                            if (!economyRef.current.medals.includes(requiredMedal)) {
                                setDialogName(`Gym Leader ${boss.leader}`);
                                setActiveDialog(`No puedes desafiarme todavía. Necesitas la ${requiredMedal} del gimnasio anterior.`);
                                return;
                            }
                        } else {
                            const prevGymDefeated = (economyRef.current.defeated_gyms[String(gymIndex - 1)] || 0) > 0;
                            if (!prevGymDefeated) {
                                setDialogName(`Gym Leader ${boss.leader}`);
                                setActiveDialog(`No puedes desafiarme todavía. Debes derrotar al líder del gimnasio anterior primero.`);
                                return;
                            }
                        }
                    }

                    const cooldownRemaining = economyRef.current.getGymCooldownRemaining(gymIndex);
                    if (cooldownRemaining > 0) {
                        // Cooldown active: notify that they can fight for training (no rewards), but do not block the battle.
                        setDialogName(`Gym Leader ${boss.leader}`);
                        setActiveDialog(`¡Hola! Ya has recibido tus recompensas de hoy, pero podemos luchar para entrenar y acumular victorias. ¡Prepárate!`);
                    } else {
                        setDialogName(`Gym Leader ${boss.leader}`);
                        setActiveDialog(`Especializo en Pokémon poderosos. ¿Estás listo para enfrentar a mi equipo?`);
                    }

                    // Check if there is at least one active Pokemon
                    const activePokes = teamRef.current.filter(p => p.hp > 0);
                    if (activePokes.length === 0) {
                        setActiveDialog("¡Tus Pokémon están debilitados! Ve al Centro Pokémon para curarlos antes de retarme.");
                        return;
                    }

                    // Reset battle stages and animations
                    setPlayerAtkStage(0);
                    setPlayerDefStage(0);
                    setOpponentAtkStage(0);
                    setOpponentDefStage(0);
                    setIsBattleAnimating(false);
                    setPlayerSpriteEffect('none' as any);
                    setOpponentSpriteEffect('none' as any);
                    setFloatingDamage(null);

                    // Define leader team: 3 Pokémon for gyms 1-3, 6 Pokémon for gyms 4-13
                    let leaderTeam: any[] = [];
                    if (gymIndex === 1) {
                        leaderTeam = [
                            { name: "geodude", level: 10, hp: 60 },
                            { name: "graveler", level: 11, hp: 75 },
                            { name: "onix", level: 12, hp: 90 }
                        ];
                    } else if (gymIndex === 2) {
                        leaderTeam = [
                            { name: "psyduck", level: 18, hp: 80 },
                            { name: "staryu", level: 20, hp: 95 },
                            { name: "starmie", level: 22, hp: 130 }
                        ];
                    } else if (gymIndex === 3) {
                        leaderTeam = [
                            { name: "voltorb", level: 28, hp: 110 },
                            { name: "pikachu", level: 30, hp: 130 },
                            { name: "raichu", level: 32, hp: 170 }
                        ];
                    } else if (gymIndex === 4) {
                        leaderTeam = [
                            { name: "oddish", level: 38, hp: 140 },
                            { name: "gloom", level: 39, hp: 160 },
                            { name: "weepinbell", level: 40, hp: 170 },
                            { name: "tangela", level: 40, hp: 180 },
                            { name: "victreebel", level: 41, hp: 195 },
                            { name: "vileplume", level: 42, hp: 210 }
                        ];
                    } else if (gymIndex === 5) {
                        leaderTeam = [
                            { name: "koffing", level: 48, hp: 180 },
                            { name: "grimer", level: 49, hp: 190 },
                            { name: "arbok", level: 50, hp: 210 },
                            { name: "muk", level: 50, hp: 220 },
                            { name: "golbat", level: 51, hp: 230 },
                            { name: "weezing", level: 52, hp: 250 }
                        ];
                    } else if (gymIndex === 6) {
                        leaderTeam = [
                            { name: "abra", level: 58, hp: 210 },
                            { name: "drowzee", level: 59, hp: 225 },
                            { name: "kadabra", level: 60, hp: 240 },
                            { name: "mr-mime", level: 60, hp: 250 },
                            { name: "hypno", level: 61, hp: 270 },
                            { name: "alakazam", level: 62, hp: 290 }
                        ];
                    } else if (gymIndex === 7) {
                        leaderTeam = [
                            { name: "growlithe", level: 68, hp: 250 },
                            { name: "ponyta", level: 69, hp: 260 },
                            { name: "flareon", level: 70, hp: 280 },
                            { name: "rapidash", level: 70, hp: 295 },
                            { name: "ninetales", level: 71, hp: 310 },
                            { name: "arcanine", level: 72, hp: 330 }
                        ];
                    } else if (gymIndex === 8) {
                        leaderTeam = [
                            { name: "dugtrio", level: 78, hp: 280 },
                            { name: "rhydon", level: 79, hp: 300 },
                            { name: "nidoqueen", level: 80, hp: 320 },
                            { name: "nidoking", level: 80, hp: 335 },
                            { name: "golem", level: 81, hp: 350 },
                            { name: "dragonite", level: 82, hp: 370 }
                        ];
                    } else if (gymIndex === 9) {
                        leaderTeam = [
                            { name: "slowbro", level: 86, hp: 350 },
                            { name: "exeggutor", level: 87, hp: 360 },
                            { name: "gengar", level: 88, hp: 375 },
                            { name: "hypno", level: 88, hp: 390 },
                            { name: "alakazam", level: 89, hp: 410 },
                            { name: "mewtwo", level: 90, hp: 480 }
                        ];
                    } else if (gymIndex === 10) {
                        leaderTeam = [
                            { name: "clefable", level: 96, hp: 370 },
                            { name: "wigglytuff", level: 97, hp: 390 },
                            { name: "togetic", level: 98, hp: 410 },
                            { name: "chansey", level: 98, hp: 430 },
                            { name: "blissey", level: 99, hp: 450 },
                            { name: "mew", level: 100, hp: 500 }
                        ];
                    } else if (gymIndex === 11) {
                        leaderTeam = [
                            { name: "dewgong", level: 106, hp: 390 },
                            { name: "jynx", level: 107, hp: 405 },
                            { name: "cloyster", level: 108, hp: 420 },
                            { name: "lapras", level: 108, hp: 440 },
                            { name: "blastoise", level: 109, hp: 460 },
                            { name: "articuno", level: 110, hp: 520 }
                        ];
                    } else if (gymIndex === 12) {
                        leaderTeam = [
                            { name: "jolteon", level: 116, hp: 410 },
                            { name: "electabuzz", level: 117, hp: 430 },
                            { name: "magneton", level: 118, hp: 445 },
                            { name: "ampharos", level: 118, hp: 460 },
                            { name: "raichu", level: 119, hp: 480 },
                            { name: "zapdos", level: 120, hp: 540 }
                        ];
                    } else if (gymIndex === 13) {
                        leaderTeam = [
                            { name: "ninetales", level: 126, hp: 430 },
                            { name: "flareon", level: 127, hp: 450 },
                            { name: "rapidash", level: 128, hp: 465 },
                            { name: "magmar", level: 128, hp: 480 },
                            { name: "charizard", level: 129, hp: 500 },
                            { name: "moltres", level: 130, hp: 560 }
                        ];
                    }

                    gymLeaderTeamRef.current = leaderTeam;
                    gymLeaderCurrentPokeIndexRef.current = 0;

                    // Start actual Gym Battle
                    setIsGymBattle(true);
                    setGymLeaderName(boss.leader);
                    setBattleMessage(`¡El Líder de Gimnasio ${boss.leader} te desafía con su equipo!`);
                    setShowBallSelect(false);
                    setShowBagSelect(false);
                    setShowSwitchSelect(false);

                    const firstPoke = leaderTeam[0] || boss;
                    setActiveWildBattle({
                        name: firstPoke.name,
                        level: firstPoke.level,
                        hp: firstPoke.hp,
                        maxHp: firstPoke.hp,
                        captureRate: 0.0 // Can't capture Gym Leader's Pokémon!
                    });
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
                // Trainer / Multi-dialog NPCs
                else if (entity.dialogs && entity.dialogs.length > 0) {
                    setDialogName(entity.name);
                    setCurrentDialogList(entity.dialogs);
                    setCurrentDialogIndex(0);
                    setActiveDialog(entity.dialogs[0]);
                }
                // Other general dialog NPCs
                else if (entity.dialog) {
                    setDialogName(entity.name);
                    setCurrentDialogList([]);
                    setCurrentDialogIndex(0);
                    setActiveDialog(entity.dialog);
                }
                break;
            }
        }
    };

    const saveLocalEconomy = async (updatedTeam?: any[], updatedPcPokemon?: any[], nameOverride?: string, forceCloud: boolean = true, updatedInventory?: any) => {
        const economyData = economyRef.current.toSaveData();
        const inventoryData = updatedInventory !== undefined ? updatedInventory.toSaveData() : inventoryRef.current.toSaveData();
        const teamToSave = updatedTeam !== undefined ? updatedTeam : teamRef.current;
        const pcPokemonToSave = updatedPcPokemon !== undefined ? updatedPcPokemon : pcPokemonRef.current;
        const activeName = nameOverride !== undefined ? nameOverride : playerNameRef.current;
        
        const saveState = {
            name: activeName,
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
        fullSaves[walletAddress || saveName] = saveState;
        localStorage.setItem('pixel_tamer_saves', JSON.stringify(fullSaves));

        // 2. Cloud sync to Supabase
        if (walletAddress) {
            const now = Date.now();
            if (forceCloud || now - lastCloudSaveTimeRef.current >= 10000) {
                lastCloudSaveTimeRef.current = now;
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
        setShowMoveSelect(true);
    };

    const handleExecuteMove = async (moveId: string) => {
        if (!activeWildBattle || isBattleAnimating) return;

        // Find active player pokemon (first with HP > 0)
        const activePokeIdx = team.findIndex((p: any) => p.hp > 0);
        if (activePokeIdx === -1) {
            showNotification("Centro Pokémon", "¡Todos tus Pokémon están debilitados!");
            setActiveWildBattle(null);
            setShowMoveSelect(false);
            return;
        }

        setIsBattleAnimating(true);
        setShowMoveSelect(false); // Hide move selection during animation

        const activePoke = team[activePokeIdx];
        const move = MOVES_DATABASE[moveId] || MOVES_DATABASE.tackle;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        
        const getStageMultiplier = (stage: number): number => {
            if (stage >= 0) return (2 + stage) / 2;
            return 2 / (2 - stage);
        };

        // ================= PLAYER'S TURN =================
        setBattleMessage(`¡Tu ${activePoke.id} usó ${move.name}!`);
        
        // 1. Attack animation: Bounce player sprite
        setPlayerSpriteEffect('bounce');
        await delay(500);
        setPlayerSpriteEffect('none');

        const opponentSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === activeWildBattle.name.toLowerCase());
        const opponentTypes = opponentSpecies?.types || ['normal'];
        const mult = getTypeMultiplier(move.type, opponentTypes);
        
        // Check accuracy
        const hit = Math.random() * 100 <= move.accuracy;
        let playerDmg = 0;
        let pMsg = "";

        if (!hit) {
            pMsg = `¡Tu ${activePoke.id} usó ${move.name} y falló!`;
            setBattleMessage(pMsg);
            await delay(1500);
        } else {
            if (move.power === 0) {
                // Status moves (buffs/debuffs)
                if (moveId === 'growl') {
                    const newStage = Math.max(-6, opponentAtkStage - 1);
                    setOpponentAtkStage(newStage);
                    pMsg = `¡Tu ${activePoke.id} usó ${move.name}! El ataque del ${activeWildBattle.name} salvaje bajó.`;
                } else if (moveId === 'tail_whip') {
                    const newStage = Math.max(-6, opponentDefStage - 1);
                    setOpponentDefStage(newStage);
                    pMsg = `¡Tu ${activePoke.id} usó ${move.name}! La defensa del ${activeWildBattle.name} salvaje bajó.`;
                } else {
                    pMsg = `¡Tu ${activePoke.id} usó ${move.name}! No tuvo efecto.`;
                }
                
                // Show flash on opponent to denote status applied
                setOpponentSpriteEffect('flash');
                await delay(300);
                setOpponentSpriteEffect('none');
                setBattleMessage(pMsg);
                await delay(1500);
            } else {
                // Damage-dealing move
                const playerAtkMult = getStageMultiplier(playerAtkStage);
                const opponentDefMult = getStageMultiplier(opponentDefStage);

                const playerSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === activePoke.id.toLowerCase());
                const opponentSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === activeWildBattle.name.toLowerCase());

                const playerAtk = (playerSpecies?.attack || 50) * playerAtkMult;
                const opponentDef = (opponentSpecies?.defense || 50) * opponentDefMult;
                const playerLevel = activePoke.level ?? 1;

                // Classic Damage Formula
                let baseDmg = (((2 * playerLevel / 5 + 2) * move.power * (playerAtk / opponentDef)) / 50) + 2;
                
                // Add random variance (0.85 to 1.0)
                baseDmg = baseDmg * (Math.random() * 0.15 + 0.85);

                playerDmg = Math.max(1, Math.floor(baseDmg * mult)); // Minimum 1 damage on hit
                
                pMsg = `¡Tu ${activePoke.id} usó ${move.name} e infligió ${playerDmg} de daño!`;
                if (mult > 1.5) pMsg += " ¡Es súper efectivo!";
                else if (mult < 0.6 && mult > 0.0) pMsg += " No es muy efectivo...";
                else if (mult === 0.0) pMsg += " ¡No tiene ningún efecto!";

                // Trigger shake and damage float
                setOpponentSpriteEffect('shake');
                setFloatingDamage({ value: playerDmg, target: 'opponent' });
                
                await delay(1000);
                
                setOpponentSpriteEffect('none');
                setFloatingDamage(null);

                // Deduct HP from opponent
                const newWildHp = Math.max(0, activeWildBattle.hp - playerDmg);
                const updatedWild = { ...activeWildBattle, hp: newWildHp };
                setActiveWildBattle(updatedWild);
                
                setBattleMessage(pMsg);
                await delay(1500);

                if (newWildHp <= 0) {
                    if (isGymBattle && gymLeaderTeamRef.current && gymLeaderCurrentPokeIndexRef.current < gymLeaderTeamRef.current.length - 1) {
                        // --- MID-BATTLE XP PROCESS ---
                        const xpGained = Math.floor(activeWildBattle.level * 25 * (Math.random() * 0.2 + 0.9));
                        let currentLvl = activePoke.level ?? 1;
                        let currentXp = (activePoke.xp ?? 0) + xpGained;
                        let nextLvlXp = currentLvl * 100;
                        let leveledUp = false;
                        let msg = `¡Tu ${activePoke.id} ganó ${xpGained} XP!`;

                        while (currentXp >= nextLvlXp) {
                            currentXp -= nextLvlXp;
                            currentLvl += 1;
                            nextLvlXp = currentLvl * 100;
                            leveledUp = true;
                        }

                        let evolved = false;
                        let evolvedName = activePoke.id;
                        const currentMoves = activePoke.moves || getPokemonMoves(activePoke.id, activePoke.level ?? 1);
                        let finalMoves = [...currentMoves];

                        if (leveledUp) {
                            msg += ` ¡Subió al nivel ${currentLvl}!`;
                            const evo = EVOLUTION_DATABASE[activePoke.id.toLowerCase()];
                            if (evo && evo.method === 'level' && currentLvl >= (evo.level ?? 99)) {
                                evolvedName = evo.target;
                                evolved = true;
                            }
                            
                            if (evolved) {
                                msg += ` ¡Increíble! Ha evolucionado en ${evolvedName.toUpperCase()}!`;
                            }

                            const learnableMoves = getPokemonMoves(evolvedName, currentLvl);
                            for (const mId of learnableMoves) {
                                if (!finalMoves.includes(mId)) {
                                    finalMoves.push(mId);
                                    const moveName = MOVES_DATABASE[mId]?.name || mId;
                                    msg += ` \n🎉 ¡Aprendió ${moveName.toUpperCase()}!`;
                                }
                            }
                        }

                        const updatedTeam = [...team];
                        const stats = getPokemonStats(evolvedName, currentLvl);
                        updatedTeam[activePokeIdx] = {
                            ...activePoke,
                            id: evolvedName,
                            level: currentLvl,
                            xp: currentXp,
                            moves: finalMoves,
                            is_evolved: evolved ? true : activePoke.is_evolved,
                            maxHp: stats.maxHp,
                            hp: leveledUp ? stats.maxHp : Math.min(activePoke.hp, stats.maxHp)
                        };

                        setTeam(updatedTeam);
                        teamRef.current = updatedTeam;
                        saveLocalEconomy(updatedTeam);

                        const nextIndex = gymLeaderCurrentPokeIndexRef.current + 1;
                        gymLeaderCurrentPokeIndexRef.current = nextIndex;
                        const nextPoke = gymLeaderTeamRef.current[nextIndex];
                        
                        const setupNextGymOpponent = async () => {
                            setBattleMessage(`¡Derrotaste al ${activeWildBattle.name.toUpperCase()} del Líder! ${msg}\nSaca a su siguiente Pokémon: ${nextPoke.name.toUpperCase()} (Nvl. ${nextPoke.level}).`);
                            
                            // Reset opponent stages (buffs/debuffs) when they switch to a new Pokemon
                            setOpponentAtkStage(0);
                            setOpponentDefStage(0);

                            setActiveWildBattle({
                                name: nextPoke.name,
                                level: nextPoke.level,
                                hp: nextPoke.hp,
                                maxHp: nextPoke.hp,
                                captureRate: 0.0
                            });
                            
                            await delay(3500);
                            setIsBattleAnimating(false);
                            setBattleMessage(`¿Qué debería hacer tu ${evolvedName.toUpperCase()}?`);
                        };

                        if (evolved) {
                            setActiveEvolution({
                                pokemonId: activePoke.id,
                                targetId: evolvedName,
                                level: currentLvl,
                                onComplete: () => {
                                    setupNextGymOpponent();
                                    setActiveEvolution(null);
                                }
                            });
                        } else {
                            await setupNextGymOpponent();
                        }
                        return;
                    }

                    // --- VICTORY PROCESS ---
                    // Compute XP earned
                    const xpGained = Math.floor(activeWildBattle.level * 25 * (Math.random() * 0.2 + 0.9));
                    
                    let currentLvl = activePoke.level ?? 1;
                    let currentXp = (activePoke.xp ?? 0) + xpGained;
                    let nextLvlXp = currentLvl * 100;
                    let leveledUp = false;
                    let msg = `¡Tu ${activePoke.id} ganó ${xpGained} XP!`;
                    
                    while (currentXp >= nextLvlXp) {
                        currentXp -= nextLvlXp;
                        currentLvl += 1;
                        nextLvlXp = currentLvl * 100;
                        leveledUp = true;
                    }
                    
                    let evolved = false;
                    let evolvedName = activePoke.id;
                    let oldName = activePoke.id;

                    const currentMoves = activePoke.moves || getPokemonMoves(activePoke.id, activePoke.level ?? 1);
                    let finalMoves = [...currentMoves];

                    if (leveledUp) {
                        msg += ` ¡Subió al nivel ${currentLvl}!`;
                        const evo = EVOLUTION_DATABASE[activePoke.id.toLowerCase()];
                        if (evo && evo.method === 'level' && currentLvl >= (evo.level ?? 99)) {
                            evolvedName = evo.target;
                            evolved = true;
                        }
                        
                        if (evolved) {
                            msg += ` ¡Increíble! Ha evolucionado en ${evolvedName.toUpperCase()}!`;
                        }

                        // Check for new learnable moves based on the evolved (or original) species at the new level
                        const learnableMoves = getPokemonMoves(evolvedName, currentLvl);
                        for (const mId of learnableMoves) {
                            if (!finalMoves.includes(mId)) {
                                finalMoves.push(mId);
                                const moveName = MOVES_DATABASE[mId]?.name || mId;
                                msg += ` \n🎉 ¡Aprendió ${moveName.toUpperCase()}!`;
                            }
                        }
                    }
                    
                    const updatedTeam = [...team];
                    const stats = getPokemonStats(evolvedName, currentLvl);
                    updatedTeam[activePokeIdx] = {
                        ...activePoke,
                        id: evolvedName,
                        level: currentLvl,
                        xp: currentXp,
                        moves: finalMoves,
                        is_evolved: evolved ? true : activePoke.is_evolved,
                        maxHp: stats.maxHp,
                        hp: leveledUp ? stats.maxHp : Math.min(activePoke.hp, stats.maxHp)
                    };
                    
                    setTeam(updatedTeam);

                    if (isTrainerBattle) {
                        const baseCoins = Math.floor(Math.random() * (40 - 25 + 1)) + 25;
                        const levelScale = 1.0 + ((activeWildBattle.level ?? 1) - 1) * 0.12;
                        const coinsEarned = Math.floor(baseCoins * levelScale * 1.5);
                        
                        economyRef.current.addCoins(coinsEarned);
                        economyRef.current.updateMissionProgress('battle');
                        
                        const trainerXpEarned = (activeWildBattle.level ?? 1) * 15;
                        const xpResult = economyRef.current.addTrainerXp(trainerXpEarned);
                        let trainerMsg = `\nGanaste ${trainerXpEarned} XP de Entrenador.`;
                        if (xpResult.leveledUp) {
                            trainerMsg += ` \n🎉 ¡Tu Nivel de Entrenador subió al Nivel ${xpResult.newLevel}!`;
                        }
                        
                        setDoubleRewardCoins(coinsEarned);
                        setDoubleRewardType('trainer');

                        const finishBattle = () => {
                            setIsTrainerBattle(false);
                            setIsGymBattle(false);
                            setGymLeaderName(null);
                            setActiveWildBattle(null);
                            saveLocalEconomy(updatedTeam);
                            setEconomy(new Economy(economyRef.current.toSaveData()));
                            setIsBattleAnimating(false);
                            showNotification(
                                "¡Victoria contra Entrenador!", 
                                `¡Tu ${oldName} derrotó al Pokémon del Entrenador! Ganaste ${coinsEarned} Coins. ${trainerMsg}\n${msg}`
                            );
                        };

                        if (evolved) {
                            setActiveEvolution({
                                pokemonId: activePoke.id,
                                targetId: evolvedName,
                                level: currentLvl,
                                onComplete: () => {
                                    finishBattle();
                                    setActiveEvolution(null);
                                }
                            });
                        } else {
                            finishBattle();
                        }
                        return;
                    }
                    
                    if (isGymBattle) {
                        // Extract procedural town index from returnMapRef.current
                        let gymIndex = 1;
                        const returnMap = returnMapRef.current.toLowerCase();
                        if (returnMap.includes('procedural://settlement_')) {
                            const parts = returnMap.replace('procedural://settlement_', '').split('_');
                            gymIndex = parseInt(parts[0] || '1', 10) + 1;
                        }

                        const gymBosses = [
                            { name: "Onix", level: 12, hp: 90, leader: "Brock" },
                            { name: "Starmie", level: 22, hp: 130, leader: "Misty" },
                            { name: "Raichu", level: 32, hp: 170, leader: "Lt. Surge" },
                            { name: "Vileplume", level: 42, hp: 210, leader: "Erika" },
                            { name: "Weezing", level: 52, hp: 250, leader: "Koga" },
                            { name: "Alakazam", level: 62, hp: 290, leader: "Sabrina" },
                            { name: "Arcanine", level: 72, hp: 330, leader: "Blaine" },
                            { name: "Dragonite", level: 82, hp: 370, leader: "Giovanni" }
                        ];

                        const boss = gymIndex <= 8 ? gymBosses[gymIndex - 1] : {
                            name: gymIndex === 9 ? "Mewtwo" : gymIndex === 10 ? "Mew" : gymIndex === 11 ? "Articuno" : gymIndex === 12 ? "Zapdos" : gymIndex === 13 ? "Moltres" : "Mewtwo",
                            level: gymIndex * 10,
                            hp: 300 + gymIndex * 20,
                            leader: gymIndex === 9 ? "Master Mewtwo" : gymIndex === 10 ? "Master Mew" : gymIndex === 11 ? "Master Articuno" : gymIndex === 12 ? "Master Zapdos" : gymIndex === 13 ? "Master Moltres" : `Master ${gymIndex}`
                        };

                        const maxTeamLevel = Math.max(...updatedTeam.map((p: any) => p.level), 1);
                        const result = economyRef.current.getGymReward(gymIndex, maxTeamLevel);

                        let notificationTitle = "¡Victoria de Gimnasio!";
                        let notificationMsg = "";

                        if (result.isOverleveled) {
                            let overleveledMsg = `⚠️ Tu nivel de Pokémon es superior al nivel del Líder por más de 5 niveles. No recibes monedas ni XP para evitar el multifarmeo.`;
                            if (result.medal) {
                                overleveledMsg = `🎉 ¡Ganaste la ${result.medal}! \n` + overleveledMsg;
                            }
                            notificationTitle = "¡Victoria de Gimnasio!";
                            notificationMsg = `¡Derrotaste al ${boss.name.toUpperCase()} de ${boss.leader}! Buen combate.\n${overleveledMsg}\n${msg}`;
                        } else if (result.coins > 0) {
                            economyRef.current.updateMissionProgress('battle');
                            setDoubleRewardCoins(result.coins);
                            setDoubleRewardType('gym');
                            
                            let gymTrainerMsg = `\nGanaste ${result.xpGained} XP de Entrenador.`;
                            if (result.leveledUp) {
                                gymTrainerMsg += ` \n🎉 ¡Tu Nivel de Entrenador subió al Nivel ${result.newLevel}!`;
                            }

                            let rewardDetailMsg = "";
                            if (result.medal) {
                                rewardDetailMsg = `Ganaste la ${result.medal}, ${result.coins} Coins y ${result.xpGained} XP.`;
                            } else {
                                rewardDetailMsg = `Ganaste ${result.coins} Coins y ${result.xpGained} XP.`;
                            }

                            notificationTitle = "¡Victoria de Gimnasio!";
                            notificationMsg = `¡Derrotaste al ${boss.name.toUpperCase()} de ${boss.leader}! ${rewardDetailMsg} ${gymTrainerMsg}\n${msg}`;
                        } else {
                            notificationTitle = "Victoria";
                            notificationMsg = `¡Derrotaste al ${boss.name.toUpperCase()} de ${boss.leader}! Buen combate. \n${msg}`;
                        }

                        const finishBattle = () => {
                            setIsGymBattle(false);
                            setGymLeaderName(null);
                            setActiveWildBattle(null);
                            saveLocalEconomy(updatedTeam);
                            setEconomy(new Economy(economyRef.current.toSaveData()));
                            setIsBattleAnimating(false);
                            showNotification(notificationTitle, notificationMsg);
                        };

                        if (evolved) {
                            setActiveEvolution({
                                pokemonId: activePoke.id,
                                targetId: evolvedName,
                                level: currentLvl,
                                onComplete: () => {
                                    finishBattle();
                                    setActiveEvolution(null);
                                }
                            });
                        } else {
                            finishBattle();
                        }
                        return;
                    }

                    // Wild Pokémon defeated!
                    setIsGymBattle(false);
                    setGymLeaderName(null);
                    setIsTrainerBattle(false);
                    const wildSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === activeWildBattle.name.toLowerCase());
                    const rarity = wildSpecies?.rarity || "COMMON";
                    let rarityMult = 1.0;
                    if (rarity === "RARE") rarityMult = 1.5;
                    else if (rarity === "ULTRA_RARE") rarityMult = 2.0;
                    else if (rarity === "LEGENDARY") rarityMult = 3.0;

                    const baseCoins = Math.floor(Math.random() * (30 - 15 + 1)) + 15;
                    const levelScale = 1.0 + ((activeWildBattle.level ?? 1) - 1) * 0.10;
                    const coinsEarned = Math.floor((baseCoins * rarityMult) * levelScale);

                    economyRef.current.addCoins(coinsEarned);
                    economyRef.current.updateMissionProgress('battle');
                    
                    const wildTrainerXp = (activeWildBattle.level ?? 1) * 10;
                    const xpResult = economyRef.current.addTrainerXp(wildTrainerXp);
                    let trainerMsg = `\nGanaste ${wildTrainerXp} XP de Entrenador.`;
                    if (xpResult.leveledUp) {
                        trainerMsg += ` \n🎉 ¡Tu Nivel de Entrenador subió al Nivel ${xpResult.newLevel}!`;
                    }

                    setDoubleRewardCoins(coinsEarned);
                    setDoubleRewardType('wild');

                    const finishBattle = () => {
                        setActiveWildBattle(null);
                        saveLocalEconomy(updatedTeam);
                        setEconomy(new Economy(economyRef.current.toSaveData()));
                        setIsBattleAnimating(false);
                        showNotification(
                            "¡Victoria!", 
                            `¡Tu ${oldName} derrotó al ${activeWildBattle.name} salvaje! Ganaste ${coinsEarned} Coins. ${trainerMsg}\n${msg}`
                        );
                    };

                    if (evolved) {
                        setActiveEvolution({
                            pokemonId: activePoke.id,
                            targetId: evolvedName,
                            level: currentLvl,
                            onComplete: () => {
                                finishBattle();
                                setActiveEvolution(null);
                            }
                        });
                    } else {
                        finishBattle();
                    }
                    return;
                }
            }
        }

        // ================= OPPONENT'S TURN =================
        const opponentMoves = getPokemonMoves(activeWildBattle.name, activeWildBattle.level);
        const wildMoveId = opponentMoves[Math.floor(Math.random() * opponentMoves.length)];
        const wildMove = MOVES_DATABASE[wildMoveId] || MOVES_DATABASE.tackle;
        
        setBattleMessage(`El ${activeWildBattle.name} salvaje usó ${wildMove.name}.`);
        
        // 1. Attack animation: Bounce opponent sprite
        setOpponentSpriteEffect('bounce');
        await delay(500);
        setOpponentSpriteEffect('none');

        const wildHit = Math.random() * 100 <= wildMove.accuracy;
        let wildDmg = 0;
        let wMsg = `El ${activeWildBattle.name} salvaje usó ${wildMove.name}.`;

        if (!wildHit) {
            wMsg = `El ${activeWildBattle.name} salvaje usó ${wildMove.name} y falló.`;
            setBattleMessage(wMsg);
            await delay(1500);
        } else {
            if (wildMove.power === 0) {
                // Status moves (buffs/debuffs)
                if (wildMoveId === 'growl') {
                    const newStage = Math.max(-6, playerAtkStage - 1);
                    setPlayerAtkStage(newStage);
                    wMsg = `El ${activeWildBattle.name} salvaje usó ${wildMove.name}. ¡El ataque de tu ${activePoke.id} bajó!`;
                } else if (wildMoveId === 'tail_whip') {
                    const newStage = Math.max(-6, playerDefStage - 1);
                    setPlayerDefStage(newStage);
                    wMsg = `El ${activeWildBattle.name} salvaje usó ${wildMove.name}. ¡La defensa de tu ${activePoke.id} bajó!`;
                } else {
                    wMsg = `El ${activeWildBattle.name} salvaje usó ${wildMove.name}. No tuvo efecto.`;
                }

                // Show flash on player to denote status applied
                setPlayerSpriteEffect('flash');
                await delay(300);
                setPlayerSpriteEffect('none');
                setBattleMessage(wMsg);
                await delay(1500);
            } else {
                // Damage-dealing move
                const opponentAtkMult = getStageMultiplier(opponentAtkStage);
                const playerDefMult = getStageMultiplier(playerDefStage);

                const activePokeSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === activePoke.id.toLowerCase());
                const wildSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === activeWildBattle.name.toLowerCase());

                const wildAtk = (wildSpecies?.attack || 50) * opponentAtkMult;
                const playerDef = (activePokeSpecies?.defense || 50) * playerDefMult;
                const wildLevel = activeWildBattle.level;

                let baseDmg = (((2 * wildLevel / 5 + 2) * wildMove.power * (wildAtk / playerDef)) / 50) + 2;
                baseDmg = baseDmg * (Math.random() * 0.15 + 0.85);

                const activePokeTypes = activePokeSpecies?.types || ['normal'];
                const playerMult = getTypeMultiplier(wildMove.type, activePokeTypes);
                
                wildDmg = Math.max(1, Math.floor(baseDmg * playerMult)); // Minimum 1 damage on hit

                wMsg = `El ${activeWildBattle.name} salvaje usó ${wildMove.name} e infligió ${wildDmg} de daño.`;
                if (playerMult > 1.5) wMsg += " ¡Es súper efectivo!";
                else if (playerMult < 0.6 && playerMult > 0.0) wMsg += " No es muy efectivo...";
                else if (playerMult === 0.0) wMsg += " ¡No tiene ningún efecto!";

                // Trigger shake and damage float on player
                setPlayerSpriteEffect('shake');
                setFloatingDamage({ value: wildDmg, target: 'player' });

                await delay(1000);

                setPlayerSpriteEffect('none');
                setFloatingDamage(null);

                // Apply HP deduction to player
                const newPlayerHp = Math.max(0, activePoke.hp - wildDmg);
                const updatedTeam = [...team];
                updatedTeam[activePokeIdx] = { ...activePoke, hp: newPlayerHp };
                setTeam(updatedTeam);

                setBattleMessage(wMsg);
                await delay(1500);

                if (newPlayerHp <= 0) {
                    // --- FAINTED PROCESS ---
                    const nextActiveIdx = updatedTeam.findIndex((p: any) => p.hp > 0);
                    if (nextActiveIdx === -1) {
                        // Entire team fainted! Blackout!
                        showNotification(
                            "Derrota",
                            `¡Tu ${activePoke.id} se debilitó! Todo tu equipo ha sido debilitado. Fuiste llevado de urgencia al Centro Pokémon.`
                        );
                        
                        // Warp to nearest Pokemon Center
                        const closestCenter = getClosestPokeCenter(currentMapPathRef.current);
                        returnMapRef.current = closestCenter.map;
                        returnCoordsRef.current = closestCenter.coords;
                        playerRef.current.x = 144;
                        playerRef.current.y = 224;
                        playerRef.current.targetX = 144;
                        playerRef.current.targetY = 224;
                        playerRef.current.isMoving = false;
                        setCurrentMapPath('/assets/maps/pokecenter/main.json');
                        
                        // Do not heal automatically, just save their 0 HP state
                        setTeam(updatedTeam);
                        saveLocalEconomy(updatedTeam);
                        
                        setIsGymBattle(false);
                        setGymLeaderName(null);
                        setActiveWildBattle(null);
                        setIsBattleAnimating(false);
                        return;
                    } else {
                        // Force switch message
                        setBattleMessage(
                            `¡Tu ${activePoke.id} se debilitó! ¡Adelante, ${updatedTeam[nextActiveIdx].id}!`
                        );
                        setPlayerAtkStage(0);
                        setPlayerDefStage(0);
                        await delay(2000);
                    }
                }
            }
        }

        // Save economy state and unlock UI
        const currentActivePoke = team.find((p: any) => p.hp > 0);
        if (currentActivePoke) {
            setBattleMessage("¿Qué hará tu Pokémon?");
        }
        saveLocalEconomy(team);
        setIsBattleAnimating(false);
    };

    const handleApplyItemToPokemon = (p: any, idx: number) => {
        if (!usingItem) return;

        const updatedTeam = [...team];
        const target = updatedTeam[idx];
        const itemInfo = inventoryRef.current.getItemInfo(usingItem.id);
        
        if (usingItem.id.includes('stone')) {
            const idLower = target.id.toLowerCase();
            let evolvedId = '';
            
            const evo = EVOLUTION_DATABASE[idLower];
            const isStoneEvolution = evo && evo.method === 'stone';
            
            if (isStoneEvolution) {
                const stoneId = usingItem.id;
                
                if (idLower === 'eevee') {
                    if (stoneId === 'water_stone') {
                        evolvedId = 'vaporeon';
                    } else if (stoneId === 'thunder_stone') {
                        evolvedId = 'jolteon';
                    } else if (stoneId === 'fire_stone') {
                        evolvedId = 'flareon';
                    } else if (stoneId === 'evolution_stone') {
                        const evos = ['vaporeon', 'jolteon', 'flareon'];
                        evolvedId = evos[Math.floor(Math.random() * evos.length)];
                    }
                } else if (idLower === 'pikachu') {
                    if (stoneId === 'thunder_stone' || stoneId === 'evolution_stone') {
                        evolvedId = 'raichu';
                    }
                } else if (idLower === 'vulpix') {
                    if (stoneId === 'fire_stone' || stoneId === 'evolution_stone') {
                        evolvedId = 'ninetales';
                    }
                } else if (idLower === 'growlithe') {
                    if (stoneId === 'fire_stone' || stoneId === 'evolution_stone') {
                        evolvedId = 'arcanine';
                    }
                } else if (['poliwhirl', 'shellder', 'staryu'].includes(idLower)) {
                    if (stoneId === 'water_stone' || stoneId === 'evolution_stone') {
                        evolvedId = evo.target;
                    }
                } else if (['gloom', 'weepinbell', 'exeggcute'].includes(idLower)) {
                    if (stoneId === 'leaf_stone' || stoneId === 'evolution_stone') {
                        evolvedId = evo.target;
                    }
                } else if (['clefairy', 'jigglypuff', 'nidorina', 'nidorino'].includes(idLower)) {
                    if (stoneId === 'moon_stone' || stoneId === 'evolution_stone') {
                        evolvedId = evo.target;
                    }
                } else {
                    if (stoneId === 'evolution_stone') {
                        evolvedId = evo.target;
                    }
                }
            }
            
            if (evolvedId) {
                const stats = getPokemonStats(evolvedId, target.level ?? 5);
                updatedTeam[idx] = {
                    ...target,
                    id: evolvedId,
                    is_evolved: true,
                    hp: stats.maxHp,
                    maxHp: stats.maxHp
                };
                
                inventoryRef.current.removeItem(usingItem.id);
                setInventory(new Inventory(inventoryRef.current.toSaveData()));
                setTeam(updatedTeam);
                saveLocalEconomy(updatedTeam);
                setUsingItem(null);
                setShowInventoryModal(false);
                
                setActiveEvolution({
                    pokemonId: target.id,
                    targetId: evolvedId,
                    level: target.level ?? 5,
                    onComplete: () => {
                        showNotification("¡Evolución exitosa!", `¡Tu ${target.id.toUpperCase()} ha evolucionado en ${evolvedId.toUpperCase()} usando la ${itemInfo.name || 'Piedra'}!`);
                        setActiveEvolution(null);
                    }
                });
            } else {
                showNotification("Error de Piedra", `¡La ${itemInfo.name || 'Piedra'} no tiene efecto en ${target.id.toUpperCase()}!`);
            }
            return;
        }

        const isRevive = usingItem.id.includes('revive');
        const isFullHeal = usingItem.id === 'full_heal';
        
        if (isRevive) {
            if (target.hp > 0) {
                showNotification("Mochila", `¡${target.id} no está debilitado!`);
                return;
            }
            const pct = itemInfo.heal_percent ?? 0.5;
            target.hp = Math.floor(target.maxHp * pct);
            
            inventoryRef.current.removeItem(usingItem.id);
            setInventory(new Inventory(inventoryRef.current.toSaveData()));
            setTeam(updatedTeam);
            saveLocalEconomy(updatedTeam);
            setUsingItem(null);
            showNotification("Mochila", `¡Has revivido a ${target.id}!`);
        } else if (isFullHeal) {
            if (target.hp === 0) {
                showNotification("Mochila", `¡${target.id} está debilitado! Usa Revivir primero.`);
                return;
            }
            inventoryRef.current.removeItem(usingItem.id);
            setInventory(new Inventory(inventoryRef.current.toSaveData()));
            setTeam(updatedTeam);
            saveLocalEconomy(updatedTeam);
            setUsingItem(null);
            showNotification("Mochila", `¡Se han curado todos los problemas de estado de ${target.id}!`);
        } else {
            if (target.hp === 0) {
                showNotification("Mochila", `¡${target.id} está debilitado! Usa Revivir primero.`);
                return;
            }
            if (target.hp >= target.maxHp) {
                showNotification("Mochila", `¡${target.id} ya tiene los PS al máximo!`);
                return;
            }
            const heal = itemInfo.heal_amount ?? 20;
            target.hp = Math.min(target.maxHp, target.hp + heal);
            
            inventoryRef.current.removeItem(usingItem.id);
            setInventory(new Inventory(inventoryRef.current.toSaveData()));
            setTeam(updatedTeam);
            saveLocalEconomy(updatedTeam);
            setUsingItem(null);
            showNotification("Mochila", `¡Has curado a ${target.id}!`);
        }
    };

    const handleApplyItemToPokemonPvp = (p: any, idx: number) => {
        if (!usingItem || !activePvPBattle || activePvPBattle.turn !== walletAddress) return;

        const updatedTeam = [...team];
        const target = updatedTeam[idx];
        const itemInfo = inventoryRef.current.getItemInfo(usingItem.id);
        const isRevive = usingItem.id.includes('revive');
        const isFullHeal = usingItem.id === 'full_heal';

        if (isRevive) {
            if (target.hp > 0) {
                showNotification("Mochila PvP", `¡${target.id} no está debilitado!`);
                return;
            }
            const pct = itemInfo.heal_percent ?? 0.5;
            target.hp = Math.floor(target.maxHp * pct);
        } else if (isFullHeal) {
            if (target.hp === 0) {
                showNotification("Mochila PvP", `¡${target.id} está debilitado! Usa Revivir primero.`);
                return;
            }
        } else {
            if (target.hp === 0) {
                showNotification("Mochila PvP", `¡${target.id} está debilitado! Usa Revivir primero.`);
                return;
            }
            if (target.hp >= target.maxHp) {
                showNotification("Mochila PvP", `¡${target.id} ya tiene los PS al máximo!`);
                return;
            }
            const heal = itemInfo.heal_amount ?? 20;
            target.hp = Math.min(target.maxHp, target.hp + heal);
        }

        inventoryRef.current.removeItem(usingItem.id);
        setInventory(new Inventory(inventoryRef.current.toSaveData()));

        const activePokeIdxBefore = team.findIndex((poke: any) => poke.hp > 0);
        setTeam(updatedTeam);

        let finalHp = activePvPBattle.myHp;
        if (idx === activePokeIdxBefore) {
            finalHp = target.hp;
        }

        let finalStatus = activePvPBattle.myStatus;
        if (usingItem.id === 'full_heal' && idx === activePokeIdxBefore) {
            finalStatus = null;
        }

        const nextItemsUsed = pvpItemsUsed + 1;
        setPvpItemsUsed(nextItemsUsed);

        setPvpBattleLog(prev => [
            ...prev,
            `🧪 Usaste ${itemInfo.name || usingItem.id} en tu ${target.id.toUpperCase()}${usingItem.id === 'full_heal' && idx === activePokeIdxBefore ? ' (¡Cura de Estados!)' : ''}.`
        ]);

        setActivePvPBattle((prev: any) => ({
            ...prev,
            myHp: finalHp,
            myStatus: finalStatus,
            turn: prev.opponentAddress
        }));

        channelRef.current?.send({
            type: 'broadcast',
            event: 'pvp_use_item',
            payload: {
                from: walletAddress,
                to: activePvPBattle.opponentAddress,
                item_id: usingItem.id,
                item_name: itemInfo.name || usingItem.id,
                new_hp: finalHp,
                new_status: finalStatus,
                target_idx: idx
            }
        });

        saveLocalEconomy(updatedTeam);
        setEconomy(new Economy(economyRef.current.toSaveData()));
        setUsingItem(null);
        setShowPvpBackpack(false);
        showNotification("Mochila PvP", `¡Has usado ${itemInfo.name || usingItem.id} con éxito! Tu turno ha terminado.`);
    };

    const handlePvpFlee = () => {
        if (!activePvPBattle || isBattleAnimating) return;

        // Refund 100 coins bet, deduct 10 coins penalty (net cost = 10 coins)
        economyRef.current.addCoins(100);
        economyRef.current.spendCoins(10);
        
        economyRef.current.last_pvp_loss_time = Date.now();
        economyRef.current.pvp_cooldown_duration = 120; // 2 minutes cooldown
        
        // Do NOT increment pvp_losses stats since it was not a standard combat defeat

        saveLocalEconomy();
        setEconomy(new Economy(economyRef.current.toSaveData()));

        channelRef.current?.send({
            type: 'broadcast',
            event: 'pvp_flee',
            payload: {
                from: walletAddress,
                to: activePvPBattle.opponentAddress
            }
        });

        setShowPvpBackpack(false);
        setActivePvPBattle((prev: any) => prev ? { ...prev, status: 'flee' } : null);
        showNotification("Fuga de Batalla", "Huyiste del combate. Se te reembolsó tu apuesta de 100 Coins menos 10 Coins de penalidad (neto: -10 Coins). Tienes un cooldown de 2 minutos.");
    };

    const handleBattleCatch = (ballId: string) => {
        if (!activeWildBattle || isBattleAnimating) return;

        const info = inventoryRef.current.getItemInfo(ballId);

        if (!inventoryRef.current.hasItem(ballId)) {
            const ballInfo = inventoryRef.current.getItemInfo(ballId);
            showNotification("Mochila", `¡No tienes ${ballInfo.name || ballId}!`);
            return;
        }

        inventoryRef.current.removeItem(ballId);
        setInventory(new Inventory(inventoryRef.current.toSaveData()));
        
        setShowBallSelect(false);
        setShowBagSelect(false);
        setShowSwitchSelect(false);
        setIsBattleAnimating(true);
        setBattleMessage(`¡Lanzaste una ${info.name || ballId}!`);
        setCatchBallState('throw');

        let ballRate = 0.3;
        if (ballId === 'super_ball') ballRate = 0.5;
        else if (ballId === 'ultra_ball') ballRate = 0.75;
        else if (ballId === 'master_ball') ballRate = 1.0;

        const hpFactor = activeWildBattle.hp <= activeWildBattle.maxHp * 0.3 ? 1.5 : 1.0;
        const finalChance = ballRate * hpFactor;

        const success = Math.random() < finalChance;

        setTimeout(() => {
            setCatchBallState('shake');
            setOpponentSpriteEffect('catch-shake' as any);

            setTimeout(() => {
                if (success) {
                    setCatchBallState('success');
                    setOpponentSpriteEffect('catch-success' as any);
                    setBattleMessage(`1, 2, 3... ¡Atrapado!`);
                    setTimeout(() => {
                        const nameLower = activeWildBattle.name.toLowerCase();
                        const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === nameLower);
                        const rarity = species ? species.rarity.toLowerCase() : "uncommon";

                        const wildLvl = activeWildBattle.level ?? 5;
                        const stats = getPokemonStats(activeWildBattle.name.toLowerCase(), wildLvl);
                        const caughtMoves = getPokemonMoves(activeWildBattle.name.toLowerCase(), wildLvl);

                        const newPoke = {
                            id: activeWildBattle.name.toLowerCase(),
                            rarity: rarity,
                            is_evolved: false,
                            level: wildLvl,
                            xp: 0,
                            hp: stats.maxHp,
                            maxHp: stats.maxHp,
                            moves: caughtMoves
                        };

                        economyRef.current.updateMissionProgress('capture');
                        const newEconomyData = economyRef.current.toSaveData();

                        if (team.length >= 6) {
                            const updatedPc = [...pcPokemon, newPoke];
                            setPcPokemon(updatedPc);
                            saveLocalEconomy(team, updatedPc);
                            showNotification("¡Capturado!", `¡Capturaste a ${activeWildBattle.name}! Pero tu equipo está lleno. Fue enviado a tu PC.`);
                        } else {
                            const updatedTeam = [...team, newPoke];
                            setTeam(updatedTeam);
                            saveLocalEconomy(updatedTeam, pcPokemon);
                            showNotification("¡Capturado!", `¡Felicidades! Capturaste a ${activeWildBattle.name} y se unió a tu equipo.`);
                        }

                        setEconomy(new Economy(newEconomyData));
                        setActiveWildBattle(null);
                        setIsGymBattle(false);
                        setGymLeaderName(null);
                        setIsTrainerBattle(false);
                        setIsBattleAnimating(false);
                        setOpponentSpriteEffect('none' as any);
                        setCatchBallState(null);
                    }, 1000);
                } else {
                    setCatchBallState('fail');
                    setOpponentSpriteEffect('catch-fail' as any);
                    setBattleMessage(`¡Oh no! El Pokémon escapó de la Pokeball.`);
                    setTimeout(() => {
                        setOpponentSpriteEffect('none' as any);
                        setCatchBallState(null);
                        
                        const activePokeIdx = team.findIndex((p: any) => p.hp > 0);
                        if (activePokeIdx === -1) {
                            setActiveWildBattle(null);
                            setIsGymBattle(false);
                            setGymLeaderName(null);
                            setIsTrainerBattle(false);
                            setIsBattleAnimating(false);
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
                                showNotification("Derrota", `El ${activeWildBattle.name} salvaje contraatacó con ${wildDmg} de daño. ¡Tu equipo se debilitó por completo!`);
                                returnMapRef.current = '/assets/maps/tutorial/main.json';
                                returnCoordsRef.current = [600, 748];
                                playerRef.current.x = 144;
                                playerRef.current.y = 224;
                                playerRef.current.targetX = 144;
                                playerRef.current.targetY = 224;
                                playerRef.current.isMoving = false;
                                setCurrentMapPath('/assets/maps/pokecenter/main.json');
                                // Save their 0 HP state without healing
                                setTeam(updatedTeam);
                                saveLocalEconomy(updatedTeam);
                                setActiveWildBattle(null);
                                setIsGymBattle(false);
                                setGymLeaderName(null);
                                setIsTrainerBattle(false);
                            } else {
                                setBattleMessage(`El ${activeWildBattle.name} salvaje escapó y contraatacó con ${wildDmg} de daño, debilitando a tu ${activePoke.id}.`);
                                setPlayerAtkStage(0);
                                setPlayerDefStage(0);
                            }
                        } else {
                            setBattleMessage(`El ${activeWildBattle.name} salvaje se escapó y te atacó. ¡Infligió ${wildDmg} de daño!`);
                        }

                        saveLocalEconomy(updatedTeam);
                        setTimeout(() => { setIsBattleAnimating(false); }, 1500);
                    }, 1500);
                }
            }, 2000);
        }, 800);
    };

    // ── T4: Use item (potion) during wild battle — consumes opponent's turn ──
    const handleBattleUseItem = (itemId: string) => {
        if (!activeWildBattle || isBattleAnimating) return;
        const activePokeIdx = team.findIndex((p: any) => p.hp > 0);
        if (activePokeIdx === -1) return;
        const activePoke = team[activePokeIdx];
        const itemInfo = inventoryRef.current.getItemInfo(itemId);

        if (!inventoryRef.current.hasItem(itemId)) {
            showNotification("Mochila", `¡No tienes ${itemInfo.name || itemId}!`);
            return;
        }

        const healAmount: number = itemInfo.heal_amount ?? (itemId === 'super_potion' ? 50 : itemId === 'hyper_potion' ? 120 : 20);
        const oldHp: number = activePoke.hp;
        const newHp: number = Math.min(activePoke.maxHp || 100, oldHp + healAmount);

        if (newHp === oldHp) {
            showNotification("Mochila", `¡${activePoke.id} ya tiene la vida al máximo!`);
            return;
        }

        // Use the item
        inventoryRef.current.removeItem(itemId);
        setInventory(new Inventory(inventoryRef.current.toSaveData()));
        const updatedTeam = [...team];
        updatedTeam[activePokeIdx] = { ...activePoke, hp: newHp };
        setTeam(updatedTeam);
        setShowBagSelect(false);

        // Wild Pokémon counter-attacks (consuming the player's turn)
        setIsBattleAnimating(true);
        setBattleMessage(`¡Usaste ${itemInfo.name || itemId}! ${activePoke.id} recuperó ${newHp - oldHp} HP.`);

        setTimeout(() => {
            const opponentMoves = getPokemonMoves(activeWildBattle.name, activeWildBattle.level);
            const wildMove = MOVES_DATABASE[opponentMoves[Math.floor(Math.random() * opponentMoves.length)]] || { name: 'Placaje', type: 'normal', power: 35 };
            const wildSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === activeWildBattle.name.toLowerCase());
            const wildAtk = (wildSpecies?.attack || 50) * (1 + (activeWildBattle.level - 1) * 0.08);
            const playerDef = (wildSpecies?.defense || 40);
            const wildDmg = Math.max(1, Math.floor((wildAtk / playerDef) * (wildMove.power / 15) * (0.85 + Math.random() * 0.3)));

            const freshActivePoke = updatedTeam[activePokeIdx];
            const newPokeHp = Math.max(0, freshActivePoke.hp - wildDmg);
            const afterTeam = [...updatedTeam];
            afterTeam[activePokeIdx] = { ...freshActivePoke, hp: newPokeHp };
            setTeam(afterTeam);

            setBattleMessage(`El ${activeWildBattle.name} salvaje usó ${wildMove.name} e infligió ${wildDmg} de daño.`);
            setIsBattleAnimating(false);

            if (newPokeHp <= 0 && !afterTeam.some((p: any) => p.hp > 0)) {
                setTimeout(() => {
                    showNotification("Derrota", "¡Todos tus Pokémon se debilitaron! Fuiste llevado al Centro Pokémon.");
                    returnMapRef.current = '/assets/maps/tutorial/main.json';
                    returnCoordsRef.current = [600, 748];
                    playerRef.current.x = 144;
                    playerRef.current.y = 224;
                    playerRef.current.targetX = 144;
                    playerRef.current.targetY = 224;
                    playerRef.current.isMoving = false;
                    setCurrentMapPath('/assets/maps/pokecenter/main.json');
                    
                    setTeam(afterTeam);
                    saveLocalEconomy(afterTeam);
                    setActiveWildBattle(null);
                    setIsGymBattle(false);
                    setGymLeaderName(null);
                    setIsTrainerBattle(false);
                    setIsBattleAnimating(false);
                }, 500);
            }
        }, 1200);
    };

    // ── T5: Switch active Pokémon during wild battle — consumes opponent's turn ──
    const handleBattleSwitchPokemon = (newIdx: number) => {
        if (!activeWildBattle || isBattleAnimating) return;
        const switchTarget = team[newIdx];
        if (!switchTarget || switchTarget.hp <= 0) return;

        setShowSwitchSelect(false);
        setIsBattleAnimating(true);
        setBattleMessage(`¡Cambiaste a ${switchTarget.id}! El ${activeWildBattle.name} aprovechó para atacar.`);

        // Reset player's stat stages (buffs/debuffs) upon switching
        setPlayerAtkStage(0);
        setPlayerDefStage(0);

        // Reorder team so the new Pokémon is first (active)
        const newTeam = [...team];
        const [removed] = newTeam.splice(newIdx, 1);
        // Find current active index and put switch target before it
        const currentActiveIdx = newTeam.findIndex((p: any) => p.hp > 0);
        newTeam.splice(currentActiveIdx >= 0 ? currentActiveIdx : 0, 0, removed);
        setTeam(newTeam);

        // Wild Pokémon attacks the new lead
        setTimeout(() => {
            const opponentMoves = getPokemonMoves(activeWildBattle.name, activeWildBattle.level);
            const wildMove = MOVES_DATABASE[opponentMoves[Math.floor(Math.random() * opponentMoves.length)]] || { name: 'Placaje', type: 'normal', power: 35 };
            const wildSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === activeWildBattle.name.toLowerCase());
            const wildAtk = (wildSpecies?.attack || 50) * (1 + (activeWildBattle.level - 1) * 0.08);
            const newActivePoke = newTeam[newTeam.findIndex((p: any) => p.hp > 0)];
            const playerDef = (wildSpecies?.defense || 40);
            const wildDmg = Math.max(1, Math.floor((wildAtk / playerDef) * (wildMove.power / 15) * (0.85 + Math.random() * 0.3)));
            const newPokeHp = Math.max(0, newActivePoke.hp - wildDmg);

            const afterTeam = newTeam.map((p: any) =>
                p === newActivePoke ? { ...p, hp: newPokeHp } : p
            );
            setTeam(afterTeam);
            setBattleMessage(`El ${activeWildBattle.name} salvaje usó ${wildMove.name} sobre ${switchTarget.id} e infligió ${wildDmg} de daño.`);
            setIsBattleAnimating(false);

            if (newPokeHp <= 0 && !afterTeam.some((p: any) => p.hp > 0)) {
                setTimeout(() => {
                    showNotification("Derrota", "¡Todos tus Pokémon se debilitaron! Fuiste llevado al Centro Pokémon.");
                    returnMapRef.current = '/assets/maps/tutorial/main.json';
                    returnCoordsRef.current = [600, 748];
                    playerRef.current.x = 144;
                    playerRef.current.y = 224;
                    playerRef.current.targetX = 144;
                    playerRef.current.targetY = 224;
                    playerRef.current.isMoving = false;
                    setCurrentMapPath('/assets/maps/pokecenter/main.json');
                    
                    setTeam(afterTeam);
                    saveLocalEconomy(afterTeam);
                    setActiveWildBattle(null);
                    setIsGymBattle(false);
                    setGymLeaderName(null);
                    setIsTrainerBattle(false);
                    setIsBattleAnimating(false);
                }, 500);
            }
        }, 1200);
    };

    const handleBattleRun = () => {
        if (!activeWildBattle) return;

        if (isGymBattle || isTrainerBattle) {
            setBattleMessage("¡No puedes huir de una batalla contra un Entrenador!");
            return;
        }

        const success = Math.random() < 0.70;

        if (success) {
            showNotification("Huir", "Escapaste a salvo de la batalla.");
            setActiveWildBattle(null);
            setIsGymBattle(false);
            setGymLeaderName(null);
            setIsTrainerBattle(false);
        } else {
            const activePokeIdx = team.findIndex((p: any) => p.hp > 0);
            if (activePokeIdx === -1) {
                setActiveWildBattle(null);
                setIsGymBattle(false);
                setGymLeaderName(null);
                setIsTrainerBattle(false);
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
                    
                    returnMapRef.current = '/assets/maps/tutorial/main.json';
                    returnCoordsRef.current = [600, 748];
                    playerRef.current.x = 144;
                    playerRef.current.y = 224;
                    playerRef.current.targetX = 144;
                    playerRef.current.targetY = 224;
                    playerRef.current.isMoving = false;
                    setCurrentMapPath('/assets/maps/pokecenter/main.json');
                    
                    // Save their 0 HP state without healing
                    setTeam(updatedTeam);
                    saveLocalEconomy(updatedTeam);
                    setActiveWildBattle(null);
                    setIsGymBattle(false);
                    setGymLeaderName(null);
                    setIsTrainerBattle(false);
                    return;
                } else {
                    setBattleMessage(
                        `¡No pudiste escapar! El ${activeWildBattle.name} salvaje te atacó e infligió ${wildDmg} de daño, debilitando a tu ${activePoke.id}. ¡Adelante, ${updatedTeam[nextActiveIdx].id}!`
                    );
                    setPlayerAtkStage(0);
                    setPlayerDefStage(0);
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

    const handleNurseHeal = async () => {
        let trueDate = null;
        try {
            const res = await fetch('http://worldtimeapi.org/api/timezone/Etc/UTC');
            const data = await res.json();
            trueDate = data.datetime.split('T')[0];
        } catch (e) {
            console.warn("Could not fetch true date", e);
        }

        if (!economyRef.current.canFreeHeal(trueDate)) {
            showNotification("Centro Pokémon", "Joy: Ya has curado gratis a tu equipo 2 veces hoy. Vuelve mañana o usa la opción de revivir.");
            return;
        }

        const success = economyRef.current.executeFreeHeal(trueDate);
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
            <div className="pokemon-team-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' }}>
                {team.map((p, idx) => {
                    const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === p.id.toLowerCase());
                    const spriteUrl = species?.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png`;
                    const pct = Math.round((p.hp / p.maxHp) * 100);
                    let hpColor = "#4caf50";
                    if (pct < 20) hpColor = "#f44336";
                    else if (pct < 50) hpColor = "#ff9800";

                    return (
                        <div key={idx} className="pokemon-team-item" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'rgba(255, 255, 255, 0.85)',
                            border: '2px solid #3e2723',
                            borderRadius: '8px',
                            padding: '6px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            position: 'relative'
                        }}>
                            {/* Sprite Container */}
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: '#f5f0e1',
                                border: '1.5px solid #8d6e63',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '1px',
                                flexShrink: 0
                            }}>
                                <img 
                                    src={spriteUrl} 
                                    alt={p.id} 
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>

                            {/* Details Container */}
                            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <div style={{ fontWeight: 'bold', textTransform: 'capitalize', fontSize: '11px', color: '#3e2723', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {p.id}
                                    </div>
                                    <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#795548' }}>
                                        Nvl. {p.level ?? 1}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '9px', color: '#5d4037', fontWeight: 'bold', whiteSpace: 'nowrap', minWidth: '50px' }}>
                                        {p.hp}/{p.maxHp} HP
                                    </span>
                                    <div className="pokemon-hp-bar" style={{ flexGrow: 1, height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden', border: '1px solid #795548', margin: 0 }}>
                                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: hpColor, transition: 'width 0.3s ease' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInfoPoke(p);
                                }}
                                className="pokemon-button success"
                                style={{
                                    width: 'auto',
                                    padding: '2px 6px',
                                    fontSize: '9px',
                                    margin: 0,
                                    alignSelf: 'center',
                                    flexShrink: 0,
                                    height: 'fit-content'
                                }}
                            >
                                ℹ️ Info
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    const handleJoystickStart = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setJoystickActive(true);
        processJoystickTouch(e);
    };

    const handleJoystickMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!joystickActive) return;
        e.preventDefault();
        processJoystickTouch(e);
    };

    const handleJoystickEnd = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (err) {}
        setJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
        
        // Clear all keys
        keysPressed.current['w'] = false;
        keysPressed.current['a'] = false;
        keysPressed.current['s'] = false;
        keysPressed.current['d'] = false;
        keysPressed.current['arrowup'] = false;
        keysPressed.current['arrowleft'] = false;
        keysPressed.current['arrowdown'] = false;
        keysPressed.current['arrowright'] = false;
    };

    const processJoystickTouch = (e: React.PointerEvent<HTMLDivElement>) => {
        const rect = joystickRef.current?.getBoundingClientRect();
        if (!rect) return;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const touchX = e.clientX - rect.left;
        const touchY = e.clientY - rect.top;

        let dx = touchX - centerX;
        let dy = touchY - centerY;

        const maxRadius = 35; // max knob travel distance
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > maxRadius) {
            dx = (dx / distance) * maxRadius;
            dy = (dy / distance) * maxRadius;
        }

        setJoystickPos({ x: dx, y: dy });

        // Translate to keys
        const threshold = 10;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        // Reset movement keys first
        keysPressed.current['w'] = false;
        keysPressed.current['a'] = false;
        keysPressed.current['s'] = false;
        keysPressed.current['d'] = false;
        keysPressed.current['arrowup'] = false;
        keysPressed.current['arrowleft'] = false;
        keysPressed.current['arrowdown'] = false;
        keysPressed.current['arrowright'] = false;

        if (distance > threshold) {
            if (absX > absY) {
                if (dx > 0) {
                    keysPressed.current['d'] = true;
                } else {
                    keysPressed.current['a'] = true;
                }
            } else {
                if (dy > 0) {
                    keysPressed.current['s'] = true;
                } else {
                    keysPressed.current['w'] = true;
                }
            }
        }
    };

    return (
        <div className="game-container">
            {/* Visual game Canvas wrapper */}
            <div className="canvas-wrapper" ref={wrapperRef}>
                {/* Map Transition Popup */}
                {mapNamePopup && (
                    <div className="map-popup" key={currentMapPath}>
                        📍 {mapNamePopup}
                    </div>
                )}

                <canvas 
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onClick={handleCanvasClick}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseLeave={() => setHoveredPlayer(null)}
                    style={{ cursor: hoveredPlayer ? 'pointer' : 'default' }}
                />

                {/* Mobile Touch Controls Overlay */}
                {!loading && (
                    <div className="mobile-controls">
                        {/* Virtual Joystick */}
                        <div className="joystick-container">
                            <div 
                                ref={joystickRef}
                                className="joystick-base"
                                onPointerDown={handleJoystickStart}
                                onPointerMove={handleJoystickMove}
                                onPointerUp={handleJoystickEnd}
                                onPointerLeave={handleJoystickEnd}
                            >
                                <div 
                                    className="joystick-knob"
                                    style={{
                                        transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
                                    }}
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div 
                            className="action-btn action-btn-a"
                            onPointerDown={(e) => { e.preventDefault(); handleInteraction(); }}
                        >A</div>
                        <div 
                            className="action-btn action-btn-b"
                            onPointerDown={(e) => { e.preventDefault(); setIsBicycleActive(prev => !prev); }}
                        >B</div>
                        <div 
                            className="action-btn action-btn-menu"
                            onPointerDown={(e) => { e.preventDefault(); setShowMenuModal(prev => !prev); }}
                        >☰</div>
                    </div>
                )}

                {/* Floating Menu Button */}
                {!loading && (
                    <>
                        <button onClick={() => setShowMenuModal(true)} className="floating-menu-btn" style={{ zIndex: 100 }}>
                            ☰ MENU (Q)
                        </button>
                        <button 
                            onClick={() => { fetchLeaderboard(); setShowLeaderboard(true); }} 
                            className="floating-menu-btn" 
                            style={{ left: '120px', background: '#fbc02d', color: '#000', zIndex: 100 }}
                        >
                            🏆 RANKING
                        </button>
                    </>
                )}

                {/* HUD Overlay */}
                {!loading && (
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
                                <div className="hud-row level" style={{ color: '#63b3ed', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <span>Level:</span>
                                        <span>{economy.level}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                                        <span style={{ fontSize: '9px', color: '#a0aec0' }}>XP: {economy.xp ?? 0}/{economy.level * 1000}</span>
                                        <div style={{ flex: 1, height: '4px', background: '#4a5568', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.round(((economy.xp ?? 0) / (economy.level * 1000)) * 100)}%`, background: '#63b3ed', borderRadius: '2px' }}></div>
                                        </div>
                                    </div>
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
                )}

                {/* Controls Info overlay */}
                {!loading && (
                    <div className="controls-info">
                        Controls: WASD/Arrows to Move | Space/Enter to Talk
                    </div>
                )}

                {/* Pokémon Center Banner Overlay */}
                {!loading && currentMapPath.includes('pokecenter') && (
                    <div style={{
                        position: 'absolute',
                        bottom: '50px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10,
                        background: 'rgba(255, 255, 255, 0.9)',
                        padding: '6px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                        border: '2px dashed #ef5350',
                        width: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#c62828', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            🏥 Centro Pokémon - Banner de Ads
                        </div>
                        <PokemonCenterBanner />
                    </div>
                )}

                {/* Dialogue bubble */}
                {!loading && activeDialog && (
                    <div className="dialogue-box glass-panel fade-in">
                        <div className="dialogue-speaker">{dialogName}</div>
                        <div className="dialogue-text">{activeDialog}</div>
                        {doubleRewardCoins > 0 && doubleRewardType === 'gym' && (
                            <button
                                onClick={handleDoubleBattleRewardFromDialog}
                                className="pokemon-button"
                                style={{ margin: '8px auto 0 auto', width: 'auto', display: 'block', background: '#ffe082', border: '1px solid #ffca28', color: '#3e2723', padding: '4px 12px', fontSize: '10px' }}
                            >
                                🎁 Duplicar Recompensa (+{doubleRewardCoins} Coins)
                            </button>
                        )}
                        <div className="dialogue-footer">Press Space/Enter to close</div>
                    </div>
                )}

                {/* Loading Overlay */}
                {loading && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#0a0518', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', backdropFilter: 'blur(4px)' }}>
                        <div style={{ marginBottom: '16px', animation: 'spin 1s linear infinite', border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#ef5350', borderBottomColor: '#ffffff', borderRadius: '50%', width: '50px', height: '50px' }}></div>
                        <h2 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ef5350', fontSize: '18px', fontWeight: 'bold' }}>Cargando Zona...</h2>
                        <p style={{ margin: 0, color: '#aaa', fontSize: '14px', fontFamily: 'monospace' }}>{loadingMessage}</p>
                    </div>
                )}
            </div>

            {/* --- Modals --- */}
            {showMenuModal && (
                <div className="modal-overlay" style={{ zIndex: 300 }}>
                    <div style={{
                        background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                        border: '2px solid rgba(255,255,255,0.12)',
                        borderRadius: '16px',
                        width: '95%',
                        maxWidth: '400px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)',
                        fontFamily: "'Segoe UI', monospace",
                    }}>
                        {/* Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '16px 20px 12px',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '18px' }}>🎮</span>
                                <span style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>PIXEL TAMER</span>
                            </div>
                            <button onClick={() => setShowMenuModal(false)} style={{
                                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '8px', color: '#94a3b8', cursor: 'pointer',
                                width: '28px', height: '28px', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '16px', fontWeight: 'bold',
                            }}>&times;</button>
                        </div>

                        <div style={{ padding: '16px 16px 20px' }}>

                            {/* TOP CARDS — Perfil y Pokémon */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>

                                {/* Mi Perfil card */}
                                <button
                                    onClick={() => { handleViewLocalProfile(); setShowMenuModal(false); }}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.2) 100%)',
                                        border: '1px solid rgba(139,92,246,0.4)',
                                        borderRadius: '12px', padding: '14px 10px', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                                        textAlign: 'center', transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(139,92,246,0.35) 100%)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.2) 100%)')}
                                >
                                    <div style={{ fontSize: '28px', lineHeight: 1 }}>👤</div>
                                    <div style={{ color: '#c4b5fd', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mi Perfil</div>
                                    <div style={{ color: '#a78bfa', fontSize: '9px', background: 'rgba(139,92,246,0.2)', borderRadius: '4px', padding: '1px 6px', fontWeight: 'bold' }}>{playerName}</div>
                                    <div style={{ color: '#7c6fc9', fontSize: '9px' }}>Nv. {economy.level}</div>
                                </button>

                                {/* Mis Pokémons card */}
                                <button
                                    onClick={() => { setShowPcModal(true); setShowMenuModal(false); }}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.25) 100%)',
                                        border: '1px solid rgba(16,185,129,0.35)',
                                        borderRadius: '12px', padding: '14px 10px', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                                        textAlign: 'center', transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.4) 100%)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.25) 100%)')}
                                >
                                    <div style={{ fontSize: '28px', lineHeight: 1 }}>🎴</div>
                                    <div style={{ color: '#6ee7b7', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mis Pokémon</div>
                                    <div style={{ color: '#34d399', fontSize: '9px', background: 'rgba(16,185,129,0.2)', borderRadius: '4px', padding: '1px 6px', fontWeight: 'bold' }}>PC Storage</div>
                                    <div style={{ color: '#6ee7b7', fontSize: '9px' }}>{team.length} en equipo</div>
                                </button>
                            </div>

                            {/* SEPARATOR label */}
                            <div style={{ fontSize: '9px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                                ACCIONES
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                            </div>

                            {/* ACTION GRID */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>

                                {/* PokeMart */}
                                <button onClick={() => { setShowShop(true); setShowMenuModal(false); }} style={{
                                    background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
                                    borderRadius: '10px', padding: '12px 8px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', margin: 0,
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251,191,36,0.22)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(251,191,36,0.12)')}
                                >
                                    <span style={{ fontSize: '18px' }}>🛒</span>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '10px' }}>PokéMart</div>
                                        <div style={{ color: '#78716c', fontSize: '8px' }}>Tienda</div>
                                    </div>
                                </button>

                                {/* Mochila */}
                                <button onClick={() => { setShowInventoryModal(true); setShowMenuModal(false); }} style={{
                                    background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)',
                                    borderRadius: '10px', padding: '12px 8px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', margin: 0,
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.22)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.12)')}
                                >
                                    <span style={{ fontSize: '18px' }}>🎒</span>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ color: '#fb923c', fontWeight: 'bold', fontSize: '10px' }}>Mochila</div>
                                        <div style={{ color: '#78716c', fontSize: '8px' }}>Items</div>
                                    </div>
                                </button>

                                {/* Login Streak */}
                                <button onClick={() => {
                                    const result = economy.checkLoginStreak();
                                    if (result.reward_coins > 0) {
                                        showNotification("Recompensa Diaria", `¡Recompensa del Día ${result.streak}: Recibiste ${result.reward_coins} Coins!`);
                                        saveLocalEconomy();
                                    } else {
                                        showNotification("Racha Diaria", `Día de racha ${result.streak} verificado. ¡Ya reclamaste tu recompensa de hoy!`);
                                    }
                                    setShowDaily(true);
                                    setShowMenuModal(false);
                                }} style={{
                                    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                                    borderRadius: '10px', padding: '12px 8px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', margin: 0,
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.22)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
                                >
                                    <span style={{ fontSize: '18px' }}>🔥</span>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ color: '#f87171', fontWeight: 'bold', fontSize: '10px' }}>Login Streak</div>
                                        <div style={{ color: '#78716c', fontSize: '8px' }}>Día {economy.login_streak ?? 0}</div>
                                    </div>
                                </button>

                                {/* Misiones */}
                                <button onClick={() => { setShowMissions(true); setShowMenuModal(false); }} style={{
                                    background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)',
                                    borderRadius: '10px', padding: '12px 8px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', margin: 0,
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.22)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.12)')}
                                >
                                    <span style={{ fontSize: '18px' }}>🏆</span>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ color: '#c084fc', fontWeight: 'bold', fontSize: '10px' }}>Misiones</div>
                                        <div style={{ color: '#78716c', fontSize: '8px' }}>Daily</div>
                                    </div>
                                </button>

                                {/* Passive Income — full width */}
                                <button onClick={() => { setShowPassiveModal(true); setShowMenuModal(false); }} style={{
                                    background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.3)',
                                    borderRadius: '10px', padding: '12px 8px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
                                    gridColumn: 'span 2', margin: 0,
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(20,184,166,0.22)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(20,184,166,0.12)')}
                                >
                                    <span style={{ fontSize: '18px' }}>💰</span>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ color: '#2dd4bf', fontWeight: 'bold', fontSize: '10px' }}>Ingresos Pasivos</div>
                                        <div style={{ color: '#78716c', fontSize: '8px' }}>Reclamar Coins acumulados</div>
                                    </div>
                                </button>
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '12px' }} />

                            {/* LOGOUT */}
                            <button onClick={() => { saveLocalEconomy(); onBackToMenu(); }} style={{
                                width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                                borderRadius: '10px', padding: '10px 16px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                color: '#f87171', fontWeight: 'bold', fontSize: '11px',
                                textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.2s', margin: 0,
                            }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                            >
                                <span>🚪</span> Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {showNurseJoyModal && (
                <div className="modal-overlay">
                    <div style={{ background: 'linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', border: '2px solid rgba(255,255,255,0.12)', borderRadius: '16px', width: '95%', maxWidth: '440px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.1)', fontFamily: "'Segoe UI',monospace" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '18px' }}>💊</span>
                                <span style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Centro Pokémon</span>
                            </div>
                            <button onClick={() => {
                                setShowNurseJoyModal(false);
                                setActiveDialog(null);
                            }} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>&times;</button>
                        </div>
                        <div style={{ padding: '16px 16px 20px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <p style={{ fontWeight: 'bold', fontSize: '13px', margin: 0, color: '#94a3b8' }}>
                                Joy: "¡Hola! ¿Qué te gustaría hacer hoy?"
                            </p>
                            
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado de tu Equipo:</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {renderTeamHpList()}
                                </div>
                            </div>

                            <button 
                                onClick={handleNurseHeal}
                                style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', color: '#6ee7b7', cursor: 'pointer', padding: '9px 14px', fontSize: '12px', fontWeight: 'bold', width: '100%', margin: 0 }}
                            >
                                💚 Curar Equipo (Gratis, {getRemainingFreeHeals()}/2 Hoy)
                            </button>

                            {adHealSelectMode ? (
                                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px dashed rgba(52,211,153,0.4)', padding: '10px', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Selecciona un Pokémon para curar al 100%:
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {team.map((p: any, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSelectPokemonToHeal(idx)}
                                                style={{ margin: 0, padding: '6px 12px', fontSize: '11px', textTransform: 'capitalize', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', cursor: 'pointer', opacity: p.hp >= p.maxHp ? 0.5 : 1 }}
                                                disabled={p.hp >= p.maxHp}
                                            >
                                                <span>{p.id} (HP: {p.hp}/{p.maxHp})</span>
                                                <span style={{ fontWeight: 'bold', color: '#34d399' }}>{p.hp >= p.maxHp ? 'Lleno' : 'Curar'}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleWatchHealAd}
                                    style={{ margin: 0, padding: '9px 14px', fontSize: '12px', fontWeight: 'bold', width: '100%', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: '8px', color: '#60a5fa', cursor: 'pointer' }}
                                >
                                    💚 Curar 1 Pokémon (Ver Anuncio: {adHealsViewed}/2)
                                </button>
                            )}

                            <button 
                                onClick={handleNurseRevive}
                                style={{ margin: 0, padding: '9px 14px', fontSize: '12px', fontWeight: 'bold', width: '100%', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '8px', color: '#fbbf24', cursor: 'pointer' }}
                            >
                                ⚡ Revivir y Curar (Costo: {economy.getReviveCost()} Coins)
                            </button>

                            <PokemonCenterBanner />
                            <button 
                                onClick={() => {
                                    setShowNurseJoyModal(false);
                                    setActiveDialog(null);
                                }}
                                style={{ margin: 0, padding: '9px 14px', fontSize: '12px', fontWeight: 'bold', width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#f87171', cursor: 'pointer' }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showShop && (
                <div className="modal-overlay" style={{ zIndex: 350 }}>
                    {/* Style override block to apply dark theme to PokéMart classes locally */}
                    <style>{`
                        .dark-shop-card {
                            background: rgba(255, 255, 255, 0.03) !important;
                            border: 1px solid rgba(255, 255, 255, 0.08) !important;
                            box-shadow: inset 0 1px 0 rgba(255,255,255,0.05) !important;
                            border-radius: 12px !important;
                            color: #f1f5f9 !important;
                            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.15) !important;
                        }
                        .dark-shop-card:hover {
                            background: rgba(255, 255, 255, 0.06) !important;
                            border-color: rgba(255, 255, 255, 0.15) !important;
                            transform: translateY(-2px) !important;
                        }
                        .btn-dark-buy-coins {
                            background: rgba(251, 191, 36, 0.1) !important;
                            border: 1px solid rgba(251, 191, 36, 0.35) !important;
                            color: #fbbf24 !important;
                            box-shadow: none !important;
                            transition: all 0.2s !important;
                        }
                        .btn-dark-buy-coins:hover {
                            background: rgba(251, 191, 36, 0.2) !important;
                            border-color: rgba(251, 191, 36, 0.5) !important;
                        }
                        .btn-dark-buy-pusdt {
                            background: rgba(16, 185, 129, 0.1) !important;
                            border: 1px solid rgba(16, 185, 129, 0.35) !important;
                            color: #34d399 !important;
                            box-shadow: none !important;
                            transition: all 0.2s !important;
                        }
                        .btn-dark-buy-pusdt:hover {
                            background: rgba(16, 185, 129, 0.2) !important;
                            border-color: rgba(16, 185, 129, 0.5) !important;
                        }
                    `}</style>
                    <div style={{
                        background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                        border: '2px solid rgba(255,255,255,0.12)',
                        borderRadius: '16px',
                        width: '95%',
                        maxWidth: '480px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)',
                        fontFamily: "'Segoe UI', monospace",
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '16px 20px 12px',
                            borderBottom: '1px solid rgba(255,255,255,0.08)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button 
                                    onClick={() => {
                                        setShowShop(false);
                                        setShowMenuModal(true);
                                    }} 
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        borderRadius: '8px',
                                        color: '#94a3b8',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        padding: '4px 10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontFamily: "'Segoe UI', monospace"
                                    }}
                                >
                                    ⬅️ Menú
                                </button>
                                <span style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>🏪 PokéMart Store</span>
                            </div>
                            <button onClick={() => setShowShop(false)} style={{
                                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '8px', color: '#94a3b8', cursor: 'pointer',
                                width: '28px', height: '28px', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: '16px', fontWeight: 'bold',
                            }}>&times;</button>
                        </div>
                        <div style={{ padding: '16px 16px 20px', overflowY: 'auto' }}>
                            {/* Premium Balance Bar */}
                            <div className="premium-shop-header" style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                boxShadow: 'none',
                                color: '#e2e8f0'
                            }}>
                                <div className="shop-balance-pill coins" title="Tus Coins" style={{
                                    background: 'rgba(251,191,36,0.1)',
                                    border: '1px solid rgba(251,191,36,0.3)',
                                    color: '#fbbf24'
                                }}>
                                    🪙 {economy.getFormattedCoins()}
                                </div>
                                <div className="shop-balance-pill pusdt" title="Tu saldo PUSDT" style={{
                                    background: 'rgba(16,185,129,0.1)',
                                    border: '1px solid rgba(16,185,129,0.35)',
                                    color: '#34d399'
                                }}>
                                    💲 {economy.getFormattedPusdt()} PUSD
                                </div>
                            </div>

                            {/* Cofre Diario Row */}
                            <div className="free-coins-chest animate-hover" onClick={handleWatchFreeCoinsAd} style={{
                                cursor: 'pointer',
                                background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.15) 100%)',
                                border: '1px solid rgba(251,191,36,0.4)',
                                boxShadow: 'none',
                                color: '#fef08a'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span className="chest-icon-glowing">🎁</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#fef08a' }}>Cofre Diario Gratis</span>
                                        <span style={{ fontSize: '8px', color: '#fef08a', opacity: 0.8 }}>Consigue +20 Coins gratis viendo publicidad</span>
                                    </div>
                                </div>
                                <button 
                                    className="animate-hover" 
                                    style={{ margin: 0, padding: '4px 10px', fontSize: '9px', width: 'auto', background: 'rgba(251,191,36,0.25)', border: '1px solid rgba(251,191,36,0.5)', color: '#fbbf24', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Ver Anuncio
                                </button>
                            </div>

                            {/* Persistent Category Tabs */}
                            <div style={{
                                display: 'flex',
                                gap: '6px',
                                padding: '10px 0 8px 0',
                                borderBottom: '1px solid rgba(255,255,255,0.08)',
                                marginBottom: '14px'
                            }}>
                                {([
                                    { key: 'balls', label: '🔴 Balls', bg: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(220,38,38,0.25) 100%)', border: 'rgba(239,68,68,0.4)' },
                                    { key: 'items', label: '🧪 Objetos', bg: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.25) 100%)', border: 'rgba(16,185,129,0.35)' },
                                    { key: 'tms',   label: '💿 TMs',    bg: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.25) 100%)', border: 'rgba(59,130,246,0.4)' },
                                ] as const).map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setShopTab(tab.key)}
                                        style={{
                                            flex: 1,
                                            padding: '8px 4px',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            fontFamily: "'Segoe UI', monospace",
                                            border: '1px solid ' + (shopTab === tab.key ? tab.border : 'rgba(255,255,255,0.08)'),
                                            borderRadius: '8px',
                                            background: shopTab === tab.key ? tab.bg : 'rgba(255,255,255,0.03)',
                                            color: shopTab === tab.key ? '#fff' : '#94a3b8',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            margin: 0,
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Shop Content Grid */}
                            <div>
                                {shopTab === 'balls' && (
                                    <div className="shop-grid">
                                        {TAMERBALLS_SHOP.map(item => {
                                            const isPusdtOnly = item.pusdt !== undefined;
                                            const isCoinsOnly = item.coins !== undefined;
                                            
                                            // Assign rarity style
                                            let rarityClass = 'rarity-common';
                                            let badgeClass = 'common';
                                            let badgeText = 'Común';
                                            if (item.id === 'super_ball') {
                                                rarityClass = 'rarity-uncommon';
                                                badgeClass = 'uncommon';
                                                badgeText = 'Inusual';
                                            } else if (item.id === 'ultra_ball') {
                                                rarityClass = 'rarity-rare';
                                                badgeClass = 'rare';
                                                badgeText = 'Rara';
                                            } else if (item.id === 'master_ball') {
                                                rarityClass = 'rarity-legendary';
                                                badgeClass = 'legendary';
                                                badgeText = 'Leyenda';
                                            }

                                            return (
                                                <div key={item.id} className={`shop-card-premium dark-shop-card ${rarityClass}`}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '24px' }}>{item.icon}</span>
                                                        <span className={`shop-card-badge ${badgeClass}`}>{badgeText}</span>
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'left', marginBottom: '8px' }}>
                                                        <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#f1f5f9' }}>{item.name}</span>
                                                        <span style={{ fontSize: '8px', color: '#94a3b8', marginTop: '2px', lineHeight: '10px' }}>{item.desc}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        {isCoinsOnly && (
                                                            <button 
                                                                onClick={() => {
                                                                    const cost = item.coins!;
                                                                    if (economy.spendCoins(cost)) {
                                                                        const newInv = new Inventory(inventoryRef.current.toSaveData());
                                                                        newInv.addItem(item.id);
                                                                        setInventory(newInv);
                                                                        economy.updateMissionProgress('spend', cost);
                                                                        saveLocalEconomy(undefined, undefined, undefined, true, newInv);
                                                                        setEconomy(new Economy(economy.toSaveData()));
                                                                        showNotification("Compra Exitosa", `¡Compraste 1 ${item.name} con éxito!`);
                                                                    } else {
                                                                        showNotification("Fondos Insuficientes", "¡No tienes suficientes Coins!");
                                                                    }
                                                                }}
                                                                className="btn-premium-buy btn-dark-buy-coins"
                                                            >
                                                                🪙 {item.coins}
                                                            </button>
                                                        )}
                                                        {isPusdtOnly && (
                                                            <button 
                                                                onClick={() => {
                                                                    const cost = item.pusdt!;
                                                                    if (economy.spendPusdt(cost)) {
                                                                        const newInv = new Inventory(inventoryRef.current.toSaveData());
                                                                        newInv.addItem(item.id);
                                                                        setInventory(newInv);
                                                                        saveLocalEconomy(undefined, undefined, undefined, true, newInv);
                                                                        setEconomy(new Economy(economy.toSaveData()));
                                                                        showNotification("Compra Exitosa", `¡Compraste 1 ${item.name} con éxito!`);
                                                                    } else {
                                                                        showNotification("Fondos Insuficientes", "¡No tienes suficientes PUSDT!");
                                                                    }
                                                                }}
                                                                className="btn-premium-buy btn-dark-buy-pusdt"
                                                            >
                                                                💲 {item.pusdt!.toFixed(2)} PUSD
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {shopTab === 'items' && (
                                    <div className="shop-grid">
                                        {ITEMS_SHOP.map(item => {
                                            // Assign rarity style
                                            let rarityClass = 'rarity-common';
                                            let badgeClass = 'common';
                                            let badgeText = 'Común';
                                            
                                            if (item.id.includes('super_potion') || item.id === 'revive' || item.id === 'full_heal') {
                                                rarityClass = 'rarity-uncommon';
                                                badgeClass = 'uncommon';
                                                badgeText = 'Inusual';
                                            } else if (item.id.includes('hyper_potion')) {
                                                rarityClass = 'rarity-rare';
                                                badgeClass = 'rare';
                                                badgeText = 'Rara';
                                            } else if (item.id.includes('stone')) {
                                                rarityClass = 'rarity-epic';
                                                badgeClass = 'epic';
                                                badgeText = 'Épica';
                                            }

                                            return (
                                                <div key={item.id} className={`shop-card-premium dark-shop-card ${rarityClass}`}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '24px' }}>{item.icon}</span>
                                                        <span className={`shop-card-badge ${badgeClass}`}>{badgeText}</span>
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'left', marginBottom: '8px' }}>
                                                        <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#f1f5f9' }}>{item.name}</span>
                                                        <span style={{ fontSize: '8px', color: '#94a3b8', marginTop: '2px', lineHeight: '10px' }}>{item.desc}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <button 
                                                            onClick={() => {
                                                                const cost = item.coins;
                                                                if (economy.spendCoins(cost)) {
                                                                    const newInv = new Inventory(inventoryRef.current.toSaveData());
                                                                    newInv.addItem(item.id);
                                                                    setInventory(newInv);
                                                                    economy.updateMissionProgress('spend', cost);
                                                                    saveLocalEconomy(undefined, undefined, undefined, true, newInv);
                                                                    setEconomy(new Economy(economy.toSaveData()));
                                                                    showNotification("Compra Exitosa", `¡Compraste 1 ${item.name} con éxito!`);
                                                                } else {
                                                                    showNotification("Fondos Insuficientes", "¡No tienes suficientes Coins!");
                                                                }
                                                            }}
                                                            className="btn-premium-buy btn-dark-buy-coins"
                                                        >
                                                            🪙 {item.coins}
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                const cost = item.pusdt;
                                                                if (economy.spendPusdt(cost)) {
                                                                    const newInv = new Inventory(inventoryRef.current.toSaveData());
                                                                    newInv.addItem(item.id);
                                                                    setInventory(newInv);
                                                                    saveLocalEconomy(undefined, undefined, undefined, true, newInv);
                                                                    setEconomy(new Economy(economy.toSaveData()));
                                                                    showNotification("Compra Exitosa", `¡Compraste 1 ${item.name} con éxito!`);
                                                                } else {
                                                                    showNotification("Fondos Insuficientes", "¡No tienes suficientes PUSDT!");
                                                                }
                                                            }}
                                                            className="btn-premium-buy btn-dark-buy-pusdt"
                                                        >
                                                            💲 {item.pusdt.toFixed(2)} PUSD
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {shopTab === 'tms' && (
                                    <div className="shop-grid">
                                        {TMS_SHOP.map(item => {
                                            const rarityClass = item.rarity === 'Legendaria' ? 'rarity-legendary' : (item.rarity === 'Épica' ? 'rarity-epic' : 'rarity-rare');
                                            const badgeClass = item.rarity === 'Legendaria' ? 'legendary' : (item.rarity === 'Épica' ? 'epic' : 'rare');
                                            const tc = typeof window !== 'undefined' && (window as any).TYPE_COLORS ? (window as any).TYPE_COLORS : {};
                                            const typeBg = tc[item.type] || '#a8a878';
                                            
                                            return (
                                                <div key={item.id} className={`shop-card-premium dark-shop-card ${rarityClass}`}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '24px' }}>💿</span>
                                                        <span className="shop-card-type-tag" style={{ background: typeBg }}>{item.type}</span>
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'left', marginBottom: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                                            <span style={{ fontWeight: 'bold', fontSize: '9px', color: '#f1f5f9' }}>{item.name}</span>
                                                            <span className={`shop-card-badge ${badgeClass}`} style={{ fontSize: '6px', padding: '1px 3px' }}>{item.rarity}</span>
                                                        </div>
                                                        <span style={{ fontSize: '8px', color: '#94a3b8', marginTop: '2px', lineHeight: '10px' }}>{item.desc}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <button 
                                                            onClick={() => {
                                                                const cost = item.pusdt;
                                                                if (economy.spendPusdt(cost)) {
                                                                    saveLocalEconomy();
                                                                    setEconomy(new Economy(economy.toSaveData()));
                                                                    setTutorMoveToLearn(item.id);
                                                                    setShowTutorModal(true);
                                                                    setShowShop(false);
                                                                    showNotification("¡TM Adquirida!", `Has adquirido ${item.name}. Selecciona a quién enseñársela.`);
                                                                } else {
                                                                    showNotification("Fondos Insuficientes", "¡No tienes suficientes PUSDT para comprar este movimiento!");
                                                                }
                                                            }}
                                                            className="btn-premium-buy btn-dark-buy-pusdt"
                                                        >
                                                            💲 {item.pusdt.toFixed(2)} PUSD
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <AdsterraBanner />
                        </div>
                    </div>
                </div>
            )}

            {showTutorModal && tutorMoveToLearn && (
                <div className="modal-overlay" style={{ zIndex: 360 }}>
                    <div className="modal-card pokemon-panel" style={{ width: '95%', maxWidth: '440px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">💿 Tutor de Movimientos</h3>
                            <button 
                                onClick={() => {
                                    setShowTutorModal(false);
                                    setTutorMoveToLearn(null);
                                    setSelectedTutorPokeIdx(null);
                                    setShowShop(true);
                                }} 
                                className="modal-close-btn"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
                            {(() => {
                                const tm = TMS_SHOP.find(t => t.id === tutorMoveToLearn);
                                if (!tm) return <p>Movimiento no encontrado.</p>;
                                const tc = typeof window !== 'undefined' && (window as any).TYPE_COLORS ? (window as any).TYPE_COLORS : {};
                                const typeBg = tc[tm.type] || '#a8a878';
                                
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {/* Detalle TM */}
                                        <div style={{ padding: '8px', border: '1.5px solid #3e2723', borderRadius: '8px', background: '#fffdf9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '32px' }}>💿</span>
                                            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#3e2723' }}>{tm.name}</span>
                                                    <span style={{ fontSize: '7px', background: typeBg, color: '#fff', padding: '1px 4px', borderRadius: '3px', textTransform: 'uppercase', fontWeight: 'bold' }}>{tm.type}</span>
                                                </div>
                                                <span style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>{tm.desc}</span>
                                            </div>
                                        </div>

                                        {selectedTutorPokeIdx === null ? (
                                            <>
                                                <p style={{ fontSize: '10px', color: '#5d4037', margin: 0, fontWeight: 'bold', textAlign: 'left' }}>Selecciona el Pokémon que aprenderá el movimiento:</p>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {team.map((poke, index) => {
                                                        const isComp = isTmCompatible(poke.id, tutorMoveToLearn);
                                                        const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === poke.id.toLowerCase());
                                                        const sprite = species ? species.sprite : '';
                                                        
                                                        return (
                                                            <div 
                                                                key={index} 
                                                                onClick={() => {
                                                                    if (isComp) {
                                                                        setSelectedTutorPokeIdx(index);
                                                                    }
                                                                }}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    padding: '8px',
                                                                    border: '2px solid',
                                                                    borderColor: isComp ? '#3e2723' : '#efebe9',
                                                                    borderRadius: '8px',
                                                                    background: isComp ? '#fff' : '#f5f5f5',
                                                                    cursor: isComp ? 'pointer' : 'not-allowed',
                                                                    opacity: isComp ? 1 : 0.6,
                                                                    transition: 'all 0.1s ease'
                                                                }}
                                                                className={isComp ? "animate-hover" : ""}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    {sprite && <img src={sprite} alt={poke.id} style={{ width: '36px', height: '36px', imageRendering: 'pixelated' }} />}
                                                                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                                                        <span style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'capitalize', color: '#3e2723' }}>{poke.id}</span>
                                                                        <span style={{ fontSize: '8px', color: '#757575' }}>Nivel {poke.level} • HP {poke.hp}/{poke.maxHp}</span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    {isComp ? (
                                                                        <span style={{ fontSize: '8px', background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Compatible</span>
                                                                    ) : (
                                                                        <span style={{ fontSize: '8px', background: '#ffebee', color: '#c62828', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Incompatible</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {(() => {
                                                    const targetPoke = team[selectedTutorPokeIdx];
                                                    const currentMoves = targetPoke.moves || getPokemonMoves(targetPoke.id, targetPoke.level);
                                                    
                                                    // Handle direct learn if fewer than 4 moves
                                                    const learnDirectly = async () => {
                                                        const updatedTeam = [...team];
                                                        const pokeCopy = { ...updatedTeam[selectedTutorPokeIdx] };
                                                        pokeCopy.moves = [...currentMoves, tutorMoveToLearn];
                                                        updatedTeam[selectedTutorPokeIdx] = pokeCopy;
                                                        
                                                        setTeam(updatedTeam);
                                                        await saveLocalEconomy(updatedTeam);
                                                        
                                                        setShowTutorModal(false);
                                                        setTutorMoveToLearn(null);
                                                        setSelectedTutorPokeIdx(null);
                                                        showNotification("¡Movimiento Aprendido!", `¡Tu ${targetPoke.id.toUpperCase()} ha aprendido ${tm.name}!`);
                                                    };

                                                    const replaceMove = async (moveIdxToReplace: number) => {
                                                        const updatedTeam = [...team];
                                                        const pokeCopy = { ...updatedTeam[selectedTutorPokeIdx] };
                                                        const newMoves = [...currentMoves];
                                                        newMoves[moveIdxToReplace] = tutorMoveToLearn;
                                                        pokeCopy.moves = newMoves;
                                                        updatedTeam[selectedTutorPokeIdx] = pokeCopy;
                                                        
                                                        setTeam(updatedTeam);
                                                        await saveLocalEconomy(updatedTeam);
                                                        
                                                        setShowTutorModal(false);
                                                        setTutorMoveToLearn(null);
                                                        setSelectedTutorPokeIdx(null);
                                                        showNotification("¡Movimiento Aprendido!", `¡Tu ${targetPoke.id.toUpperCase()} ha aprendido ${tm.name} reemplazando ${MOVES_DATABASE[currentMoves[moveIdxToReplace]]?.name || currentMoves[moveIdxToReplace]}!`);
                                                    };

                                                    if (currentMoves.length < 4 && !currentMoves.includes(tutorMoveToLearn)) {
                                                        // Automatically learn directly
                                                        learnDirectly();
                                                        return <p>Aprendiendo movimiento...</p>;
                                                    }

                                                    if (currentMoves.includes(tutorMoveToLearn)) {
                                                        return (
                                                            <div style={{ textAlign: 'center', padding: '16px' }}>
                                                                <p style={{ fontSize: '11px', color: '#c62828', fontWeight: 'bold' }}>¡Tu {targetPoke.id.toUpperCase()} ya conoce este movimiento!</p>
                                                                <button onClick={() => setSelectedTutorPokeIdx(null)} className="pokemon-button" style={{ width: 'auto', padding: '6px 12px' }}>Atrás</button>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <p style={{ fontSize: '10px', color: '#5d4037', margin: 0, fontWeight: 'bold', textAlign: 'left' }}>
                                                                Tu {targetPoke.id.toUpperCase()} ya tiene 4 movimientos. Selecciona el movimiento que deseas olvidar para aprender <strong>{tm.name}</strong>:
                                                            </p>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                {currentMoves.map((mId: string, mIdx: number) => {
                                                                    const mInfo = MOVES_DATABASE[mId] || { name: mId, type: 'normal', power: 40 };
                                                                    return (
                                                                        <button 
                                                                            key={mIdx} 
                                                                            onClick={() => replaceMove(mIdx)}
                                                                            className="pokemon-button animate-hover"
                                                                            style={{
                                                                                margin: 0,
                                                                                padding: '10px',
                                                                                background: '#ffebee',
                                                                                border: '2px solid #c62828',
                                                                                color: '#c62828',
                                                                                fontWeight: 'bold',
                                                                                fontSize: '11px',
                                                                                textTransform: 'capitalize',
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center'
                                                                            }}
                                                                        >
                                                                            <span>❌ Olvidar: {mInfo.name}</span>
                                                                            <span style={{ fontSize: '8px', background: getTypeColor(mInfo.type), color: mInfo.type === 'electric' ? '#3e2723' : '#fff', padding: '1px 4px', borderRadius: '3px' }}>{mInfo.type}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            <button 
                                                                onClick={() => setSelectedTutorPokeIdx(null)} 
                                                                className="pokemon-button danger" 
                                                                style={{ marginTop: '8px' }}
                                                            >
                                                                Atrás
                                                            </button>
                                                        </div>
                                                    );
                                                })()}
                                            </>
                                        )}
                                        
                                        <button 
                                            onClick={() => {
                                                setShowTutorModal(false);
                                                setTutorMoveToLearn(null);
                                                setSelectedTutorPokeIdx(null);
                                                setShowShop(true);
                                            }} 
                                            className="pokemon-button secondary"
                                            style={{ marginTop: '8px' }}
                                        >
                                            ⬅️ Volver a la Tienda
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {isLoadingProfile && (
                <div className="modal-overlay" style={{ zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-card pokemon-panel" style={{ width: 'auto', padding: '20px', textAlign: 'center' }}>
                        <div style={{ marginBottom: '10px', animation: 'spin 1s linear infinite', border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#2196f3', borderRadius: '50%', width: '30px', height: '30px', margin: '0 auto' }}></div>
                        <div style={{ color: '#fff', fontSize: '12px' }}>Cargando Perfil...</div>
                    </div>
                </div>
            )}

            {viewingProfile && (
                <div className="modal-overlay" style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', border: '2px solid rgba(255,255,255,0.12)', borderRadius: '16px', width: '95%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.1)', fontFamily: "'Segoe UI',monospace", color: '#fff', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>🏆</span>
                                <span style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    {viewingProfile.isLocal ? 'Mi Perfil de Entrenador' : `Perfil: ${viewingProfile.name}`}
                                </span>
                            </div>
                            <button 
                                onClick={() => setViewingProfile(null)} 
                                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}
                            >
                                &times;
                            </button>
                        </div>

                        <div style={{ padding: '16px 20px 20px' }}>
                        {/* Layout Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>

                            
                            {/* Left Column: Stats & Team */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {/* Stats Card */}
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e040fb', marginBottom: '8px', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                                        📊 Estadísticas
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                                        <div><strong>Nivel:</strong> {viewingProfile.level}</div>
                                        <div><strong>XP:</strong> {viewingProfile.xp}</div>
                                        <div><strong>Victorias:</strong> {viewingProfile.pvpWins}</div>
                                        <div><strong>Derrotas:</strong> {viewingProfile.pvpLosses}</div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                                        Win Rate: {viewingProfile.pvpWins + viewingProfile.pvpLosses > 0 
                                            ? `${((viewingProfile.pvpWins / (viewingProfile.pvpWins + viewingProfile.pvpLosses)) * 100).toFixed(1)}%` 
                                            : '0%'}
                                    </div>
                                </div>

                                {/* Active Team */}
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', flexGrow: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2979ff', marginBottom: '8px', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                                        ⚔️ Equipo Pokémon
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                                        {viewingProfile.team && viewingProfile.team.length > 0 ? (
                                            viewingProfile.team.map((poke: any, idx: number) => {
                                                const nameLower = (poke.id || '').toLowerCase();
                                                const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === nameLower);
                                                const spriteUrl = species ? species.sprite : '';
                                                return (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                        {spriteUrl ? (
                                                            <img src={spriteUrl} alt={poke.id} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                                                        ) : (
                                                            <div style={{ width: '32px', height: '32px', background: '#333', borderRadius: '4px' }} />
                                                        )}
                                                        <div>
                                                            <div style={{ textTransform: 'capitalize', fontSize: '11px', fontWeight: 'bold' }}>{poke.id}</div>
                                                            <div style={{ fontSize: '9px', color: '#ccc' }}>Nvl: {poke.level} | HP: {poke.hp}/{poke.maxHp}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div style={{ fontSize: '11px', color: '#888', textAlign: 'center', padding: '10px' }}>Sin Pokémon activos</div>
                                        )}
                                    </div>
                                </div>
                            </div>
{/* Right Column: Gym Medals & Special Badges */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {(() => {
                                    const MEDAL_BADGE_MAP: Record<string, string> = {
                                        "Medalla Roca": "/assets/imgs/medals/badges/boulder.png",
                                        "Medalla Cascada": "/assets/imgs/medals/badges/cascade.png",
                                        "Medalla Trueno": "/assets/imgs/medals/badges/thunder.png",
                                        "Medalla Arcoiris": "/assets/imgs/medals/badges/rainbow.png",
                                        "Medalla Alma": "/assets/imgs/medals/badges/soul.png",
                                        "Medalla Pantano": "/assets/imgs/medals/badges/marsh.png",
                                        "Medalla Volcan": "/assets/imgs/medals/badges/volcano.png",
                                        "Medalla Tierra": "/assets/imgs/medals/badges/earth.png",
                                        "Medalla Campeón PvP (S1)": "/assets/imgs/medals/badges/pvp_champion.png",
                                        "Medalla Tamer Pionero": "/assets/imgs/medals/badges/pioneer_tamer.png"
                                    };
                                    return (
                                        <>
                                            {/* Gym Medals Upgrade/Equip */}
                                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
                                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00e676', marginBottom: '8px', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>🏅 Medallas de Gimnasio</span>
                                                    {viewingProfile.isLocal && <span style={{ fontSize: '9px', color: '#aaa' }}>(Equipadas: {viewingProfile.equippedMedals.length}/2)</span>}
                                                </div>
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingRight: '4px' }}>
                                                    {["Medalla Roca", "Medalla Cascada", "Medalla Trueno", "Medalla Arcoiris", "Medalla Alma", "Medalla Pantano", "Medalla Volcan", "Medalla Tierra"].map((medalName) => {
                                                        const hasMedal = viewingProfile.medals.includes(medalName);
                                                        const level = viewingProfile.medalLevels[medalName] || 1;
                                                        const levelText = level === 1 ? "🟤 Bronce" : level === 2 ? "⚪ Plata" : "🟡 Oro";
                                                        const isEquipped = viewingProfile.equippedMedals.includes(medalName);
                                                        
                                                        // Requirements check for local evolving
                                                        let evolveButton = null;
                                                        if (viewingProfile.isLocal && hasMedal && level < 3) {
                                                            const nextLvl = level + 1;
                                                            const defeatsReq = nextLvl === 2 ? 3 : 10;
                                                            const coinsReq = nextLvl === 2 ? 1000 : 3000;
                                                            
                                                            evolveButton = (
                                                                <button
                                                                    onClick={() => {
                                                                        const res = economyRef.current.evolveMedal(medalName, team);
                                                                        if (res.success) {
                                                                            saveLocalEconomy();
                                                                            showNotification("¡Medalla Evolucionada!", `Tu ${medalName} ahora es de nivel ${nextLvl === 2 ? "Plata" : "Oro"}.`);
                                                                            handleViewLocalProfile();
                                                                        } else {
                                                                            showNotification("Requisitos no cumplidos", res.reason || "No se puede evolucionar.");
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        fontSize: '8px',
                                                                        background: 'linear-gradient(135deg, #ff9800, #f57c00)',
                                                                        border: 'none',
                                                                        color: '#fff',
                                                                        borderRadius: '4px',
                                                                        padding: '3px 6px',
                                                                        cursor: 'pointer',
                                                                        fontWeight: 'bold',
                                                                        whiteSpace: 'nowrap',
                                                                        marginTop: '4px',
                                                                        width: '100%',
                                                                    }}
                                                                >
                                                                    ✨ Subir ({defeatsReq}⚔️/{coinsReq}🪙)
                                                                </button>
                                                            );
                                                        }

                                                        const DISPLAY_SIZE = 56; // display px
                                                        const tierBorderColor = !hasMedal ? 'rgba(255,255,255,0.1)' : isEquipped ? '#00e676' : level === 3 ? '#ffd700' : level === 2 ? '#b0bec5' : '#cd7f32';
                                                        const tierGlow = !hasMedal ? 'none' : isEquipped ? '0 0 10px rgba(0,230,118,0.7)' : level === 3 ? '0 0 12px rgba(255,215,0,0.6)' : level === 2 ? '0 0 8px rgba(176,190,197,0.5)' : '0 0 6px rgba(205,127,50,0.4)';
                                                        const cardBg = !hasMedal ? 'rgba(255,255,255,0.02)' : isEquipped ? 'rgba(0,230,118,0.1)' : level === 3 ? 'rgba(255,215,0,0.08)' : level === 2 ? 'rgba(176,190,197,0.08)' : 'rgba(205,127,50,0.08)';

                                                        return (
                                                            <div 
                                                                key={medalName} 
                                                                className={level === 3 && hasMedal ? 'medal-gold-card' : level === 2 && hasMedal ? 'medal-silver-card' : ''}
                                                                style={{ 
                                                                    display: 'flex', 
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center', 
                                                                    gap: '6px', 
                                                                    background: cardBg,
                                                                    padding: '10px 8px', 
                                                                    borderRadius: '10px', 
                                                                    border: '1px solid',
                                                                    borderColor: tierBorderColor,
                                                                    boxShadow: isEquipped ? tierGlow : (level === 1 ? tierGlow : undefined),
                                                                    opacity: hasMedal ? 1 : 0.45,
                                                                    transition: 'all 0.2s ease',
                                                                    position: 'relative',
                                                                }}
                                                            >
                                                                {/* Medal sprite */}
                                                                <img
                                                                    src={MEDAL_BADGE_MAP[medalName] || '/assets/imgs/medals/badges/boulder.png'}
                                                                    alt={medalName}
                                                                    className={level === 3 && hasMedal ? 'medal-gold-img' : level === 2 && hasMedal ? 'medal-silver-img' : ''}
                                                                    style={{
                                                                        width: `${DISPLAY_SIZE}px`,
                                                                        height: `${DISPLAY_SIZE}px`,
                                                                        objectFit: 'contain',
                                                                        filter: hasMedal ? 'none' : 'grayscale(100%) brightness(0.2)',
                                                                        borderRadius: '6px',
                                                                        imageRendering: 'auto',
                                                                    }}
                                                                />

                                                                {/* Medal name */}
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <div style={{ fontSize: '9px', fontWeight: isEquipped ? 'bold' : 'normal', color: isEquipped ? '#00e676' : hasMedal ? '#e2e8f0' : '#64748b', lineHeight: 1.2 }}>
                                                                        {medalName.replace('Medalla ', '')}
                                                                    </div>
                                                                    {hasMedal && (
                                                                        <div style={{ fontSize: '8px', color: level === 3 ? '#ffd700' : level === 2 ? '#e0e0e0' : '#cd7f32', marginTop: '2px' }}>
                                                                            {levelText}
                                                                        </div>
                                                                    )}
                                                                    {!hasMedal && (
                                                                        <div style={{ fontSize: '8px', color: '#475569', marginTop: '2px' }}>Sin obtener</div>
                                                                    )}
                                                                </div>

                                                                {/* Equip checkbox */}
                                                                {viewingProfile.isLocal && hasMedal && (
                                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '8px', color: isEquipped ? '#00e676' : '#94a3b8', cursor: 'pointer' }}>
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={isEquipped}
                                                                            onChange={(e) => {
                                                                                let newEquipped = [...viewingProfile.equippedMedals];
                                                                                if (e.target.checked) {
                                                                                    if (newEquipped.length >= 2) {
                                                                                        showNotification("Límite de Medallas", "Sólo puedes equipar hasta 2 medallas.");
                                                                                        return;
                                                                                    }
                                                                                    newEquipped.push(medalName);
                                                                                } else {
                                                                                    newEquipped = newEquipped.filter(m => m !== medalName);
                                                                                }
                                                                                economyRef.current.equipped_medals = newEquipped;
                                                                                saveLocalEconomy();
                                                                                handleViewLocalProfile();
                                                                            }}
                                                                            style={{ cursor: 'pointer', accentColor: '#00e676' }}
                                                                        />
                                                                        Equipar
                                                                    </label>
                                                                )}

                                                                {evolveButton}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Active Synergy */}
                                            {(() => {
                                                const synergy = getMedalSynergy(viewingProfile.equippedMedals);
                                                if (!synergy) return null;
                                                return (
                                                    <div style={{ background: 'rgba(98, 0, 234, 0.15)', border: '1px solid #6200ea', borderRadius: '8px', padding: '12px' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#b388ff', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                            ✨ Sinergia: {synergy.name}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#ccc', marginBottom: '4px' }}>{synergy.description}</div>
                                                        <div style={{ fontSize: '11px', color: '#69f0ae', fontWeight: 'bold' }}>Efecto: {synergy.combatEffect}</div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Special Tournaments / Streak Badges */}
                                            {(() => {
                                                const specialBadges = [
                                                    ...(viewingProfile.tournamentMedals || []),
                                                    ...getSpecialMedals(viewingProfile)
                                                ];
                                                if (specialBadges.length === 0) return null;
                                                const SPECIAL_SPRITE_MAP: Record<string, { glow: string; border: string }> = {
                                                    "Medalla Campeón PvP (S1)": { glow: '0 0 14px rgba(255,215,0,0.8)', border: '#ffd700' },
                                                    "Medalla Tamer Pionero":    { glow: '0 0 14px rgba(0,188,212,0.8)', border: '#00bcd4' },
                                                };
                                                const SPECIAL_SIZE = 48;
                                                return (
                                                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
                                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffd700', marginBottom: '10px', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                                                            🏆 Insignias de Torneos y Eventos
                                                        </div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                            {specialBadges.map((badge, idx) => {
                                                                const spr = SPECIAL_SPRITE_MAP[badge];
                                                                const badgePath = MEDAL_BADGE_MAP[badge];
                                                                if (badgePath && spr) {
                                                                    return (
                                                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                                            <img
                                                                                src={badgePath}
                                                                                alt={badge}
                                                                                style={{
                                                                                    width: `${SPECIAL_SIZE}px`,
                                                                                    height: `${SPECIAL_SIZE}px`,
                                                                                    objectFit: 'contain',
                                                                                    borderRadius: '50%',
                                                                                    boxShadow: spr.glow,
                                                                                    border: `2px solid ${spr.border}`,
                                                                                    imageRendering: 'auto',
                                                                                }}
                                                                            />
                                                                            <span style={{ fontSize: '9px', color: spr.border, fontWeight: 'bold', textAlign: 'center', maxWidth: '60px', lineHeight: 1.2 }}>{badge.replace('Medalla ', '')}</span>
                                                                        </div>
                                                                    );
                                                                }
                                                                return (
                                                                    <span key={idx} style={{ fontSize: '10px', background: 'rgba(255, 215, 0, 0.15)', border: '1px solid #ffd700', color: '#ffd700', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                                                        🎗️ {badge}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    );
                                })()}
                            </div>

                        </div>{/* end layout grid */}
                        </div>{/* end padding wrapper */}
                    </div>
                </div>
            )}

            {showDaily && (
                <div className="modal-overlay" style={{ zIndex: 400 }}>
                    <div style={{ background: 'linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', border: '2px solid rgba(255,255,255,0.12)', borderRadius: '16px', width: '95%', maxWidth: '440px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.1)', fontFamily: "'Segoe UI',monospace" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '18px' }}>🔥</span>
                                <span style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Login Streak</span>
                            </div>
                            <button onClick={() => setShowDaily(false)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>&times;</button>
                        </div>
                        <div style={{ padding: '16px 16px 20px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Current Streak Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.08) 100%)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 0 20px rgba(251,191,36,0.1)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '2px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🔥 Racha Actual</span>
                                    <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>{economy.login_streak} {economy.login_streak === 1 ? 'Día' : 'Días'}</span>
                                    <span style={{ fontSize: '9px', color: '#94a3b8' }}>Recompensa del día: <strong style={{ color: '#fbbf24' }}>🪙 {20 + (economy.login_streak - 1) * 10} Coins</strong></span>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '36px', lineHeight: 1 }}>🔥</div>
                                    <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>¡Sigue así!</div>
                                </div>
                            </div>

                            <p style={{ fontSize: '9px', color: '#94a3b8', margin: 0, textAlign: 'left', lineHeight: '1.4', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '8px 10px' }}>
                                💡 Las recompensas escalan <strong style={{ color: '#fb923c' }}>+10 Coins por día consecutivo</strong>. Empiezas con 🪙20 el Día 1 y ganas más cada día. <strong style={{ color: '#f87171' }}>Si fallas un día, la racha vuelve a 0.</strong>
                            </p>

                            {/* 7-Day Dynamic Calendar */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Próximos 7 días:</span>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                                    {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                                        const day = economy.login_streak + offset;
                                        const reward = 20 + (day - 1) * 10;
                                        const isPast = offset < 0;
                                        const isCurrent = offset === 0;
                                        const isFuture = offset > 0;

                                        return (
                                            <div key={offset} style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '7px 4px',
                                                borderRadius: '8px',
                                                border: '2px solid',
                                                fontSize: '8px',
                                                minHeight: '62px',
                                                background: isCurrent ? 'linear-gradient(135deg,rgba(251,191,36,0.25) 0%,rgba(245,158,11,0.1) 100%)' : (isPast ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)'),
                                                borderColor: isCurrent ? '#fbbf24' : (isPast ? '#34d399' : 'rgba(255,255,255,0.1)'),
                                                boxShadow: isCurrent ? '0 0 12px rgba(251,191,36,0.4)' : 'none',
                                            }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '7px', color: isCurrent ? '#fbbf24' : (isPast ? '#34d399' : '#64748b') }}>Día {day}</span>
                                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: isCurrent ? '#fff' : (isFuture ? '#94a3b8' : '#34d399') }}>🪙{reward}</span>
                                                <div>
                                                    {isPast ? (
                                                        <span style={{ color: '#34d399', fontSize: '10px' }}>✓</span>
                                                    ) : isCurrent ? (
                                                        <span style={{ color: '#fbbf24', fontSize: '10px' }}>🔥</span>
                                                    ) : (
                                                        <span style={{ color: '#475569', fontSize: '10px' }}>🔒</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {/* Infinity card */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '7px 4px', borderRadius: '8px', border: '2px dashed rgba(148,163,184,0.25)', background: 'rgba(255,255,255,0.02)', fontSize: '8px', minHeight: '62px', gap: '3px' }}>
                                        <span style={{ fontSize: '14px' }}>∞</span>
                                        <span style={{ color: '#64748b', textAlign: 'center', lineHeight: '1.2' }}>Sin<br/>límite</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showMissions && (
                <div className="modal-overlay">
                    <div style={{ background: 'linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', border: '2px solid rgba(255,255,255,0.12)', borderRadius: '16px', width: '95%', maxWidth: '440px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.1)', fontFamily: "'Segoe UI',monospace" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '18px' }}>🏆</span>
                                <span style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Misiones Diarias</span>
                            </div>
                            <button onClick={() => setShowMissions(false)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>&times;</button>
                        </div>
                        <div style={{ padding: '16px 16px 20px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {dailyMissions.missions.map((m: any) => {
                                const prog = economy.daily_missions_progress[m.id] ?? 0;
                                const pct = Math.min(100, (prog / m.target) * 100);
                                return (
                                    <div key={m.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 'bold' }}>{m.description}</span>
                                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>{prog}/{m.target}</span>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#fbbf24' }}>Reward: {m.reward_coins} Coins</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {showPvpBackpack && (
                <div className="modal-overlay" style={{ zIndex: 10000 }}>
                    <div className="modal-card pokemon-panel" style={{ maxWidth: '420px', width: '90%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">🎒 Mochila PvP</h3>
                            <button onClick={() => {
                                setShowPvpBackpack(false);
                                setUsingItem(null);
                            }} className="modal-close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            {pvpItemsUsed >= 3 ? (
                                <div style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '11px', textAlign: 'center', marginBottom: '10px' }}>
                                    ⚠️ Has alcanzado el límite máximo de 3 objetos por combate.
                                </div>
                            ) : null}
                            
                            {usingItem ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#3e2723', marginBottom: '8px', textAlign: 'center' }}>
                                        Usar {usingItem.name || usingItem.id} en:
                                    </div>
                                    {team.map((p: any, idx: number) => {
                                        const pct = Math.round((p.hp / p.maxHp) * 100);
                                        const isRevive = usingItem.id.includes('revive');
                                        const isValidTarget = isRevive ? p.hp === 0 : p.hp > 0;
                                        
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleApplyItemToPokemonPvp(p, idx)}
                                                className="pokemon-button"
                                                disabled={!isValidTarget || pvpItemsUsed >= 3}
                                                style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center', 
                                                    padding: '8px 12px',
                                                    background: isValidTarget ? '#efe5fd' : '#f5f5f5',
                                                    border: isValidTarget ? '1px solid #7c4dff' : '1px solid #ccc',
                                                    marginBottom: '4px',
                                                    opacity: isValidTarget ? 1 : 0.6
                                                }}
                                            >
                                                <div style={{ textAlign: 'left' }}>
                                                    <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: isValidTarget ? '#311b92' : '#666' }}>{p.id}</span>
                                                    <span style={{ fontSize: '10px', marginLeft: '6px', color: '#5e35b1' }}>Nvl. {p.level ?? 5}</span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: p.hp === 0 ? '#d32f2f' : '#2e7d32', fontWeight: 'bold' }}>
                                                    HP: {p.hp}/{p.maxHp} ({pct}%)
                                                </div>
                                            </button>
                                        );
                                    })}
                                    <button 
                                        onClick={() => setUsingItem(null)}
                                        className="pokemon-button danger"
                                        style={{ marginTop: '8px' }}
                                    >
                                        Atrás
                                    </button>
                                </div>
                            ) : (() => {
                                const usableItems = inventory.getAllItems().filter((item: any) => 
                                    item.id.includes('potion') || item.id.includes('revive') || item.id === 'full_heal'
                                );
                                
                                if (usableItems.length === 0) {
                                    return <div className="inventory-empty">No tienes objetos curativos en tu mochila.</div>;
                                }
                                
                                return usableItems.map((item: any) => (
                                    <div key={item.id} className="shop-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #efebe9' }}>
                                        <div className="shop-item-info" style={{ flex: 1 }}>
                                            <div className="shop-item-name" style={{ fontWeight: 'bold', fontSize: '12px' }}>
                                                {item.name || item.id} <span style={{ fontSize: '10px', color: '#757575', marginLeft: '4px' }}>x{item.quantity}</span>
                                            </div>
                                            <div className="shop-item-desc" style={{ fontSize: '10px', color: '#5d4037' }}>{item.description}</div>
                                        </div>
                                        <button
                                            onClick={() => setUsingItem(item)}
                                            disabled={pvpItemsUsed >= 3}
                                            className="pokemon-button success"
                                            style={{ width: 'auto', padding: '4px 10px', fontSize: '10px', marginLeft: '12px', opacity: pvpItemsUsed >= 3 ? 0.5 : 1 }}
                                        >
                                            Usar
                                        </button>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {showInventoryModal && (
                <div className="modal-overlay">
                    <div style={{ background: 'linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', border: '2px solid rgba(255,255,255,0.12)', borderRadius: '16px', width: '95%', maxWidth: '440px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.1)', fontFamily: "'Segoe UI',monospace" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '18px' }}>🎒</span>
                                <span style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Mochila</span>
                            </div>
                            <button onClick={() => {
                                setShowInventoryModal(false);
                                setUsingItem(null);
                            }} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>&times;</button>
                        </div>
                        <div style={{ padding: '16px 16px 20px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {usingItem ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px', textAlign: 'center' }}>
                                        Usar {usingItem.name || usingItem.id} en:
                                    </div>
                                    {team.map((p: any, idx: number) => {
                                        const pct = Math.round((p.hp / p.maxHp) * 100);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleApplyItemToPokemon(p, idx)}
                                                style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center', 
                                                    padding: '8px 12px',
                                                    background: 'rgba(192,132,252,0.1)',
                                                    border: '1px solid rgba(192,132,252,0.3)',
                                                    borderRadius: '8px',
                                                    color: '#e2e8f0',
                                                    cursor: 'pointer',
                                                    margin: 0
                                                }}
                                            >
                                                <div style={{ textAlign: 'left' }}>
                                                    <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: '#c084fc' }}>{p.id}</span>
                                                    <span style={{ fontSize: '10px', marginLeft: '6px', color: '#94a3b8' }}>Nvl. {p.level ?? 5}</span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: p.hp === 0 ? '#f87171' : '#34d399', fontWeight: 'bold' }}>
                                                    HP: {p.hp}/{p.maxHp} ({pct}%)
                                                </div>
                                            </button>
                                        );
                                    })}
                                    <button 
                                        onClick={() => setUsingItem(null)}
                                        style={{ margin: 0, marginTop: '4px', padding: '9px 14px', fontSize: '12px', fontWeight: 'bold', width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#f87171', cursor: 'pointer' }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            ) : inventory.getAllItems().length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontStyle: 'italic', fontSize: '12px' }}>Tu mochila está vacía.</div>
                            ) : (
                                inventory.getAllItems().map((item: any) => {
                                    const isUsable = item.id.includes('potion') || item.id.includes('revive') || item.id.includes('stone');
                                    return (
                                        <div key={item.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {item.name || item.id}
                                                    <span style={{ fontSize: '10px', color: '#fbbf24', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '4px', padding: '1px 5px' }}>x{item.quantity}</span>
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{item.description}</div>
                                            </div>
                                            {isUsable && (
                                                <button
                                                    onClick={() => setUsingItem(item)}
                                                    style={{ margin: 0, marginLeft: '12px', padding: '5px 12px', fontSize: '10px', fontWeight: 'bold', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', color: '#6ee7b7', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                >
                                                    Usar
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <AdsterraBanner />
                        </div>
                    </div>
                </div>
            )}

            {showPcModal && (
                <div className="modal-overlay">
                    <div style={{ background: 'linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', border: '2px solid rgba(255,255,255,0.12)', borderRadius: '16px', width: '95%', maxWidth: '440px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.1)', fontFamily: "'Segoe UI',monospace" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '18px' }}>💻</span>
                                <span style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>PC Storage</span>
                            </div>
                            <button onClick={() => setShowPcModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>&times;</button>
                        </div>
                        <div style={{ padding: '16px 16px 20px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Team Section */}
                            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                                <h4 style={{ fontWeight: 'bold', fontSize: '12px', margin: '0 0 10px 0', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                                    Tu Equipo ({team.length}/6)
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {team.map((p: any, idx: number) => {
                                        const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === p.id.toLowerCase());
                                        const sprite = species ? species.sprite : '';
                                        const hourlyRate = species ? species.gold_per_hour : 5;
                                        const dailyIncome = p.is_evolved ? Math.floor(hourlyRate * 24 * 1.25) : (hourlyRate * 24);

                                        return (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
                                                {sprite && <img src={sprite} alt={p.id} style={{ width: '36px', height: '36px', imageRendering: 'pixelated' }} />}
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ textTransform: 'capitalize', fontWeight: 'bold', fontSize: '12px', color: '#e2e8f0' }}>
                                                        {p.id} <span style={{ fontSize: '9px', color: '#c084fc', fontWeight: 'normal' }}>(Nvl. {p.level ?? 5})</span>
                                                    </span>
                                                    <span style={{ fontSize: '10px', color: '#34d399' }}>
                                                        +{dailyIncome} Coins/Día
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        onClick={() => setSelectedInfoPoke(p)}
                                                        style={{ padding: '4px 8px', fontSize: '10px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: '6px', color: '#60a5fa', cursor: 'pointer', margin: 0 }}
                                                    >
                                                        Info
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveToPc(idx)}
                                                        disabled={team.length <= 1}
                                                        style={{ padding: '4px 8px', fontSize: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#94a3b8', cursor: team.length <= 1 ? 'not-allowed' : 'pointer', opacity: team.length <= 1 ? 0.5 : 1, margin: 0 }}
                                                    >
                                                        Mover a PC
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* PC Section */}
                            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px' }}>
                                <h4 style={{ fontWeight: 'bold', fontSize: '12px', margin: '0 0 10px 0', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                                    Almacenamiento PC ({pcPokemon.length})
                                </h4>
                                {pcPokemon.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                                        No tienes Pokémon en la PC.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                                        {pcPokemon.map((p: any, idx: number) => {
                                            const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === p.id.toLowerCase());
                                            const sprite = species ? species.sprite : '';
                                            const hourlyRate = species ? species.gold_per_hour : 5;
                                            const dailyIncome = p.is_evolved ? Math.floor(hourlyRate * 24 * 1.25) : (hourlyRate * 24);

                                            return (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
                                                    {sprite && <img src={sprite} alt={p.id} style={{ width: '36px', height: '36px', imageRendering: 'pixelated' }} />}
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ textTransform: 'capitalize', fontWeight: 'bold', fontSize: '12px', color: '#e2e8f0' }}>
                                                            {p.id} <span style={{ fontSize: '9px', color: '#c084fc', fontWeight: 'normal' }}>(Nvl. {p.level ?? 5})</span>
                                                        </span>
                                                        <span style={{ fontSize: '10px', color: '#34d399' }}>
                                                            +{dailyIncome} Coins/Día
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button
                                                            onClick={() => setSelectedInfoPoke(p)}
                                                            style={{ padding: '4px 8px', fontSize: '10px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: '6px', color: '#60a5fa', cursor: 'pointer', margin: 0 }}
                                                        >
                                                            Info
                                                        </button>
                                                        <button
                                                            onClick={() => handleMoveToTeam(idx)}
                                                            disabled={team.length >= 6}
                                                            style={{ padding: '4px 8px', fontSize: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '6px', color: '#34d399', cursor: team.length >= 6 ? 'not-allowed' : 'pointer', opacity: team.length >= 6 ? 0.5 : 1, margin: 0 }}
                                                        >
                                                            Mover a Equipo
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <AdsterraBanner />
                            <button 
                                onClick={() => setShowPcModal(false)}
                                style={{ margin: 0, padding: '9px 14px', fontSize: '12px', fontWeight: 'bold', width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#f87171', cursor: 'pointer' }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedInfoPoke && (() => {
                const p = selectedInfoPoke;
                const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === p.id.toLowerCase());
                const sprite = species ? species.sprite : '';
                const baseStats = species ? { hp: species.hp, attack: species.attack, defense: species.defense, speed: species.speed } : { hp: 40, attack: 45, defense: 40, speed: 50 };
                
                // Calculate current stats using the same formulas as getPokemonStats
                const currentStats = getPokemonStats(p.id, p.level ?? 5);
                const allMoves = getPokemonAllMovesInfo(p.id);
                const currentMoves = p.moves || getPokemonMoves(p.id, p.level ?? 5);
                const evolutionMsg = getPokemonEvolutionInfo(p.id);
                const pct = Math.round((p.hp / p.maxHp) * 100);

                return (
                    <div className="modal-overlay" style={{ zIndex: 9999 }}>
                        <div className="modal-card pokemon-panel" style={{ maxWidth: '420px', width: '90%' }}>
                            <div className="modal-header">
                                <h3 className="modal-title" style={{ textTransform: 'capitalize' }}>ℹ️ Info: {p.id}</h3>
                                <button onClick={() => setSelectedInfoPoke(null)} className="modal-close-btn">&times;</button>
                            </div>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #efebe9', paddingBottom: '12px' }}>
                                    {sprite && (
                                        <img 
                                            src={sprite} 
                                            alt={p.id} 
                                            style={{ 
                                                width: '80px', 
                                                height: '80px', 
                                                imageRendering: 'pixelated',
                                                background: '#f5f5f5',
                                                borderRadius: '8px',
                                                border: '2px solid #efebe9'
                                            }} 
                                        />
                                    )}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'capitalize', color: '#3e2723' }}>
                                            {p.id}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#795548', fontWeight: 'bold' }}>
                                            Nivel {p.level ?? 5} (XP: {p.xp ?? 0}/{ (p.level ?? 5) * 100 })
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>HP: {p.hp}/{p.maxHp}</span>
                                            <div className="pokemon-hp-bar" style={{ flex: 1, height: '8px', margin: 0 }}>
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
                                </div>

                                <div style={{ borderBottom: '1px solid #efebe9', paddingBottom: '12px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#5d4037', marginBottom: '6px' }}>Estadísticas Actuales:</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#efe5fd', borderRadius: '4px' }}>
                                            <span style={{ color: '#5e35b1', fontWeight: 'bold' }}>PS Máx:</span>
                                            <span style={{ fontWeight: 'bold' }}>{currentStats.maxHp}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#ffebee', borderRadius: '4px' }}>
                                            <span style={{ color: '#c62828', fontWeight: 'bold' }}>Ataque:</span>
                                            <span style={{ fontWeight: 'bold' }}>{currentStats.attack}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#e8f5e9', borderRadius: '4px' }}>
                                            <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>Defensa:</span>
                                            <span style={{ fontWeight: 'bold' }}>{currentStats.defense}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#fff9c4', borderRadius: '4px' }}>
                                            <span style={{ color: '#f57f17', fontWeight: 'bold' }}>Velocidad:</span>
                                            <span style={{ fontWeight: 'bold' }}>{currentStats.speed}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ borderBottom: '1px solid #efebe9', paddingBottom: '12px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#5d4037', marginBottom: '6px' }}>Ataques Disponibles (por Nivel):</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                                        {allMoves.map((mInfo) => {
                                            const m = MOVES_DATABASE[mInfo.moveId] || { name: mInfo.moveId, type: 'normal', power: 40 };
                                            const isKnown = currentMoves.includes(mInfo.moveId);
                                            return (
                                                <div 
                                                    key={mInfo.moveId}
                                                    style={{ 
                                                        display: 'flex', 
                                                        justifyContent: 'space-between', 
                                                        alignItems: 'center', 
                                                        padding: '4px 8px',
                                                        background: isKnown ? '#e8f5e9' : '#fafafa',
                                                        border: isKnown ? '1px solid #a5d6a7' : '1px solid #e0e0e0',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        opacity: isKnown ? 1 : 0.6
                                                    }}
                                                >
                                                    <div>
                                                        <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{m.name}</span>
                                                        <span style={{ fontSize: '9px', marginLeft: '6px', color: getTypeColor(m.type), fontWeight: 'bold', textTransform: 'uppercase' }}>
                                                            {m.type}
                                                        </span>
                                                        <span style={{ fontSize: '9px', marginLeft: '6px', color: '#757575' }}>
                                                            Poder: {m.power}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontWeight: 'bold', color: isKnown ? '#2e7d32' : '#757575' }}>
                                                        {isKnown ? 'Conocido' : `Nvl. ${mInfo.levelReq}`}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ padding: '8px', background: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: '6px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#e65100', marginBottom: '2px' }}>Evolución:</div>
                                    <div style={{ fontSize: '11px', color: '#5d4037', fontWeight: 'bold' }}>
                                        ✨ {evolutionMsg}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setSelectedInfoPoke(null)}
                                    className="pokemon-button danger"
                                    style={{ marginTop: '8px' }}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}


            {/* --- Passive Generation Detailed Modal --- */}
            {showPassiveModal && (
                <div className="modal-overlay">
                    <div style={{ background: 'linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', border: '2px solid rgba(255,255,255,0.12)', borderRadius: '16px', width: '95%', maxWidth: '440px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.1)', fontFamily: "'Segoe UI',monospace" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>💰</span>
                                <div>
                                    <div style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Generación Pasiva</div>
                                    <div style={{ color: '#64748b', fontSize: '9px' }}>Coins automáticos cada 24 horas</div>
                                </div>
                            </div>
                            <button onClick={() => setShowPassiveModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>&times;</button>
                        </div>
                        <div style={{ padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, lineHeight: 1.5, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '8px 10px' }}>
                                🌟 Tus Pokémon generan Coins pasivos automáticamente cada 24 horas. Los Pokémon evolucionados generan <strong style={{ color: '#34d399' }}>+25% extra</strong>.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {team.slice(0, 6).map((p: any, idx: number) => {
                                    const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === p.id.toLowerCase());
                                    const rarity = p.rarity || (species ? species.rarity.toLowerCase() : 'common');
                                    const hourlyRate = species ? species.gold_per_hour : 5;
                                    const base = hourlyRate * 24;
                                    const finalRate = p.is_evolved ? Math.floor(base * 1.25) : base;
                                    const rarityColors: Record<string, string> = {
                                        common: '#94a3b8', uncommon: '#34d399', rare: '#60a5fa',
                                        epic: '#a78bfa', ultra_rare: '#a78bfa', legendary: '#fbbf24'
                                    };
                                    const rarityColor = rarityColors[rarity] || '#94a3b8';

                                    return (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 12px' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: '12px', textTransform: 'capitalize' }}>{p.id} {p.is_evolved && <span style={{ color: '#34d399', fontSize: '9px' }}>★ Evol.</span>}</div>
                                                <div style={{ fontSize: '8px', color: rarityColor, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>{rarity}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fbbf24' }}>🪙 +{finalRate}</div>
                                                <div style={{ fontSize: '8px', color: '#64748b' }}>{hourlyRate}/hora</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1.5px solid rgba(251,191,36,0.25)', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Diario</div>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fbbf24' }}>🪙 {economy.calculatePassiveIncome(team).toLocaleString()}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '2px' }}>Estado</div>
                                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: economy.getPassiveTimeRemaining() <= 0 ? '#34d399' : '#f87171' }}>
                                        {economy.getPassiveTimeRemaining() <= 0 ? '✅ ¡Disponible!' : `⏳ ${formatTimeRemaining(economy.getPassiveTimeRemaining())}`}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleExecuteClaim}
                                disabled={economy.getPassiveTimeRemaining() > 0}
                                style={{
                                    background: economy.getPassiveTimeRemaining() <= 0
                                        ? 'linear-gradient(135deg, #10b981, #059669)'
                                        : 'rgba(255,255,255,0.05)',
                                    border: economy.getPassiveTimeRemaining() <= 0
                                        ? '1px solid #34d399'
                                        : '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    color: economy.getPassiveTimeRemaining() <= 0 ? '#fff' : '#475569',
                                    fontWeight: 'bold',
                                    fontSize: '13px',
                                    padding: '12px',
                                    cursor: economy.getPassiveTimeRemaining() > 0 ? 'not-allowed' : 'pointer',
                                    width: '100%',
                                    transition: 'all 0.2s'
                                }}
                            >
                                💰 Reclamar Coins Pasivos
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {/* Wild Battle Modal */}
            {activeWildBattle && !activeDialog && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 200,
                    backgroundColor: '#f6ebd0',
                    backgroundImage: 'radial-gradient(#ebd9b3 1px, transparent 1px), radial-gradient(#ebd9b3 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 10px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    padding: '8px',
                    fontFamily: 'monospace',
                    overflow: 'hidden'
                }}>
                    <style>{`
                        @keyframes battle-shake {
                            0% { transform: translate(2px, 1px) rotate(0deg); }
                            10% { transform: translate(-1px, -2px) rotate(-1deg); }
                            20% { transform: translate(-3px, 0px) rotate(1deg); }
                            30% { transform: translate(0px, 2px) rotate(0deg); }
                            40% { transform: translate(1px, -1px) rotate(1deg); }
                            50% { transform: translate(-1px, 2px) rotate(-1deg); }
                            60% { transform: translate(-3px, 1px) rotate(0deg); }
                            70% { transform: translate(2px, 1px) rotate(-1deg); }
                            80% { transform: translate(-1px, -1px) rotate(1deg); }
                            90% { transform: translate(2px, 2px) rotate(0deg); }
                            100% { transform: translate(1px, -2px) rotate(0deg); }
                        }
                        @keyframes battle-flash {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0; }
                        }
                        @keyframes battle-bounce {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-8px); }
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        .battle-shake {
                            animation: battle-shake 0.3s linear infinite;
                        }
                        .battle-flash {
                            animation: battle-flash 0.15s linear 2;
                        }
                        .battle-bounce {
                            animation: battle-bounce 0.4s ease-in-out infinite;
                        }
                        .floating-damage-num {
                            position: absolute;
                            font-size: 20px;
                            font-weight: 900;
                            color: #d32f2f;
                            text-shadow: 2px 2px 0px #fff, -2px -2px 0px #fff, 2px -2px 0px #fff, -2px 2px 0px #fff;
                            animation: damage-float 1s ease-out forwards;
                            z-index: 10;
                        }
                        @keyframes damage-float {
                            0% { transform: translateY(0) scale(1); opacity: 1; }
                            50% { transform: translateY(-15px) scale(1.3); opacity: 1; }
                            100% { transform: translateY(-30px) scale(1); opacity: 0; }
                        }
                        @keyframes catch-shake {
                            0% { transform: rotate(0deg); filter: sepia(1) hue-rotate(-50deg) saturate(5); }
                            25% { transform: rotate(15deg); filter: sepia(1) hue-rotate(-50deg) saturate(5); }
                            50% { transform: rotate(0deg); filter: sepia(1) hue-rotate(-50deg) saturate(5); }
                            75% { transform: rotate(-15deg); filter: sepia(1) hue-rotate(-50deg) saturate(5); }
                            100% { transform: rotate(0deg); filter: sepia(1) hue-rotate(-50deg) saturate(5); }
                        }
                        @keyframes catch-success {
                            0% { transform: scale(1); filter: sepia(1) hue-rotate(-50deg) saturate(5); opacity: 1; }
                            100% { transform: scale(0); filter: sepia(1) hue-rotate(-50deg) saturate(5); opacity: 0; }
                        }
                        .catch-shake { animation: catch-shake 0.8s ease-in-out infinite; }
                        .catch-success { animation: catch-success 1s forwards; }
                        .catch-fail { animation: battle-bounce 0.5s; }
                        @keyframes pokeball-throw {
                            0% { transform: translate(-100px, 150px) scale(2) rotate(0deg); opacity: 0; }
                            20% { transform: translate(-50px, 50px) scale(1.5) rotate(180deg); opacity: 1; }
                            100% { transform: translate(0, 0) scale(1) rotate(360deg); opacity: 1; }
                        }
                        .pokeball-throw { animation: pokeball-throw 0.8s forwards ease-out; }
                        .battle-pokemon-sprite {
                            transition: transform 0.15s ease-in-out;
                        }
                    `}</style>

                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: '#3e2723',
                        border: '2px solid #5d4037',
                        borderRadius: '4px',
                        color: '#fff',
                        padding: '4px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        fontSize: '11px',
                        letterSpacing: '1px'
                    }}>
                        {isGymBattle ? `⚔️ Desafío Líder ${gymLeaderName} ⚔️` : "💥 Encuentro Pokémon Salvaje"}
                    </div>

                    {/* Main Arena */}
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between', padding: '0', position: 'relative' }}>
                        
                        {/* 1. Opponent Row */}
                        {(() => {
                            const opponentSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === activeWildBattle.name.toLowerCase());
                            let opponentClass = "battle-pokemon-sprite";
                            if (opponentSpriteEffect === 'shake') opponentClass += " battle-shake";
                            if (opponentSpriteEffect === 'flash') opponentClass += " battle-flash";
                            if (opponentSpriteEffect === 'bounce') opponentClass += " battle-bounce";
                            if (opponentSpriteEffect === 'catch-shake' as any) opponentClass += " catch-shake";
                            if (opponentSpriteEffect === 'catch-success' as any) opponentClass += " catch-success";
                            if (opponentSpriteEffect === 'catch-fail' as any) opponentClass += " catch-fail";

                            return (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 8px' }}>
                                    {/* Opponent Info Box (Left) */}
                                    <div className="pokemon-panel" style={{
                                        width: '50%',
                                        padding: '6px',
                                        background: '#fff',
                                        border: '2px solid #3e2723',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '3px',
                                        boxShadow: '2px 2px 0 rgba(0,0,0,0.1)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px', textTransform: 'capitalize', color: '#3e2723' }}>
                                            <span>{activeWildBattle.name}</span>
                                            <span>L:{activeWildBattle.level}</span>
                                        </div>
                                        <div className="pokemon-hp-bar" style={{ height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden', border: '1px solid #795548', margin: 0, width: '100%' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${Math.round((activeWildBattle.hp / activeWildBattle.maxHp) * 100)}%`,
                                                background: activeWildBattle.hp / activeWildBattle.maxHp < 0.2 ? '#f44336' : (activeWildBattle.hp / activeWildBattle.maxHp < 0.5 ? '#ffeb3b' : '#4caf50'),
                                                transition: 'width 0.3s ease'
                                            }}></div>
                                        </div>
                                        <div style={{ fontSize: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#5d4037' }}>
                                            <span style={{ display: 'flex', gap: '3px' }}>
                                                {opponentAtkStage !== 0 && (
                                                    <span style={{ fontSize: '7px', background: opponentAtkStage > 0 ? '#c8e6c9' : '#ffcdd2', padding: '0px 2px', borderRadius: '2px', color: '#333' }}>
                                                        A:{opponentAtkStage > 0 ? `+${opponentAtkStage}` : opponentAtkStage}
                                                    </span>
                                                )}
                                                {opponentDefStage !== 0 && (
                                                    <span style={{ fontSize: '7px', background: opponentDefStage > 0 ? '#c8e6c9' : '#ffcdd2', padding: '0px 2px', borderRadius: '2px', color: '#333' }}>
                                                        D:{opponentDefStage > 0 ? `+${opponentDefStage}` : opponentDefStage}
                                                    </span>
                                                )}
                                            </span>
                                            <span>HP: {activeWildBattle.hp}/{activeWildBattle.maxHp}</span>
                                        </div>
                                    </div>

                                    {/* Opponent Sprite (Right) */}
                                    <div style={{ width: '45%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '100px' }}>
                                        <img 
                                            src={opponentSpecies?.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${opponentSpecies?.id || 25}.png`} 
                                            alt={activeWildBattle.name} 
                                            className={opponentClass}
                                            style={{ width: '80px', height: '80px', objectFit: 'contain', opacity: catchBallState === 'shake' || catchBallState === 'success' ? 0 : 1, transition: 'opacity 0.2s' }}
                                        />
                                        {catchBallState && (
                                            <div className={`pokeball-item ${catchBallState === 'throw' ? 'pokeball-throw' : catchBallState === 'shake' ? 'catch-shake' : catchBallState === 'success' ? 'catch-success' : ''}`} style={{
                                                position: 'absolute',
                                                width: '24px', height: '24px',
                                                background: 'linear-gradient(to bottom, #f44336 45%, #333 45%, #333 55%, #fff 55%)',
                                                borderRadius: '50%',
                                                border: '2px solid #333',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                                                display: catchBallState === 'fail' ? 'none' : 'block'
                                            }}>
                                                <div style={{
                                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                                    width: '6px', height: '6px', background: '#fff', borderRadius: '50%', border: '2px solid #333'
                                                }}></div>
                                            </div>
                                        )}
                                        {floatingDamage && floatingDamage.target === 'opponent' && (
                                            <div className="floating-damage-num" style={{ top: '10px', left: '30%' }}>
                                                {floatingDamage.value}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Battle Dialog Log (Historial de Batalla) */}
                        <div 
                            ref={wildBattleLogRef}
                            style={{
                                background: '#f5f0e1',
                                border: '2px solid #3e2723',
                                borderRadius: '4px',
                                padding: '6px 10px',
                                minHeight: '72px',
                                maxHeight: '72px',
                                fontSize: '9px',
                                color: '#3e2723',
                                fontWeight: 'bold',
                                boxSizing: 'border-box',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                textAlign: 'left',
                                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                                margin: '4px 8px'
                            }}
                        >
                            {wildBattleLog.slice(-5).map((log, idx) => (
                                <div key={idx} style={{ 
                                    lineHeight: '1.2', 
                                    borderBottom: idx < wildBattleLog.slice(-5).length - 1 ? '1px dashed rgba(62, 39, 35, 0.15)' : 'none',
                                    paddingBottom: '2px',
                                    paddingTop: '2px'
                                }}>
                                    {log}
                                </div>
                            ))}
                            {wildBattleLog.length === 0 && (
                                <div style={{ color: '#8d6e63', fontStyle: 'italic', textAlign: 'center', marginTop: '10px' }}>
                                    Esperando acciones de combate...
                                </div>
                            )}
                        </div>

                        {/* 2. Player Row */}
                        {(() => {
                            const activePoke = team.find((p: any) => p.hp > 0);
                            if (!activePoke) return <div style={{ color: '#d32f2f', fontWeight: 'bold', textAlign: 'center' }}>¡No tienes Pokémon activos!</div>;
                            const pct = Math.round((activePoke.hp / activePoke.maxHp) * 100);
                            const activePokeSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === activePoke.id.toLowerCase());
                            
                            let playerClass = "battle-pokemon-sprite";
                            if (playerSpriteEffect === 'shake') playerClass += " battle-shake";
                            if (playerSpriteEffect === 'flash') playerClass += " battle-flash";
                            if (playerSpriteEffect === 'bounce') playerClass += " battle-bounce";

                            return (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 8px', marginTop: '4px' }}>
                                    {/* Player Sprite (Left) */}
                                    <div style={{ width: '45%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '100px' }}>
                                        <img 
                                            src={activePokeSpecies?.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${activePokeSpecies?.id || 1}.png`} 
                                            alt={activePoke.id} 
                                            className={playerClass}
                                            style={{ width: '80px', height: '80px', objectFit: 'contain', transform: 'scaleX(-1)' /* Face right! */ }}
                                        />
                                        {floatingDamage && floatingDamage.target === 'player' && (
                                            <div className="floating-damage-num" style={{ top: '10px', left: '30%' }}>
                                                {floatingDamage.value}
                                            </div>
                                        )}
                                    </div>

                                    {/* Player Info Box (Right) */}
                                    <div className="pokemon-panel" style={{
                                        width: '50%',
                                        padding: '6px',
                                        background: '#fff',
                                        border: '2px solid #3e2723',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '3px',
                                        boxShadow: '2px 2px 0 rgba(0,0,0,0.1)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px', textTransform: 'capitalize', color: '#3e2723' }}>
                                            <span>{activePoke.id}</span>
                                            <span>L:{activePoke.level ?? 1}</span>
                                        </div>
                                        <div className="pokemon-hp-bar" style={{ height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden', border: '1px solid #795548', margin: 0, width: '100%' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${pct}%`,
                                                background: pct < 20 ? '#f44336' : (pct < 50 ? '#ffeb3b' : '#4caf50'),
                                                transition: 'width 0.3s ease'
                                            }}></div>
                                        </div>
                                        <div style={{ fontSize: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#5d4037' }}>
                                            <span style={{ display: 'flex', gap: '3px' }}>
                                                {playerAtkStage !== 0 && (
                                                    <span style={{ fontSize: '7px', background: playerAtkStage > 0 ? '#c8e6c9' : '#ffcdd2', padding: '0px 2px', borderRadius: '2px', color: '#333' }}>
                                                        A:{playerAtkStage > 0 ? `+${playerAtkStage}` : playerAtkStage}
                                                    </span>
                                                )}
                                                {playerDefStage !== 0 && (
                                                    <span style={{ fontSize: '7px', background: playerDefStage > 0 ? '#c8e6c9' : '#ffcdd2', padding: '0px 2px', borderRadius: '2px', color: '#333' }}>
                                                        D:{playerDefStage > 0 ? `+${playerDefStage}` : playerDefStage}
                                                    </span>
                                                )}
                                            </span>
                                            <span>HP: {activePoke.hp}/{activePoke.maxHp}</span>
                                        </div>
                                        
                                        {/* XP bar */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                            <span style={{ fontSize: '7px', color: '#7e57c2', fontWeight: 'bold' }}>XP</span>
                                            <div className="pokemon-hp-bar" style={{ flex: 1, height: '3px', background: '#e0e0e0', borderRadius: '1.5px', border: 'none', margin: 0, width: '100%' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${Math.round(((activePoke.xp ?? 0) / ((activePoke.level ?? 1) * 100)) * 100)}%`,
                                                    background: '#7e57c2',
                                                    transition: 'width 0.3s ease'
                                                }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Options Panel */}
                    {isBattleAnimating ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            background: '#3e2723',
                            border: '2px solid #5d4037',
                            color: '#fff',
                            borderRadius: '4px',
                            height: '80px',
                            fontWeight: 'bold',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            <div className="spinner animate-spin" style={{ border: '2px solid rgba(255, 255, 255, 0.2)', width: '14px', height: '14px', borderRadius: '50%', borderLeftColor: '#fff', marginRight: '8px' }}></div>
                            Resolviendo Turno...
                        </div>
                    ) : showMoveSelect ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                {(() => {
                                    const activePoke = team.find((p: any) => p.hp > 0);
                                    if (!activePoke) return null;
                                    const activePokeMoves = activePoke.moves || getPokemonMoves(activePoke.id, activePoke.level ?? 1);
                                    return (activePokeMoves as string[]).map((moveId: string) => {
                                        const m = MOVES_DATABASE[moveId] || { name: moveId, type: 'normal', power: 40 };
                                        return (
                                            <button
                                                key={moveId}
                                                onClick={() => handleExecuteMove(moveId)}
                                                className="pokemon-button"
                                                style={{ 
                                                    background: getTypeColor(m.type), 
                                                    color: m.type === 'electric' ? '#3e2723' : '#fff', 
                                                    textTransform: 'capitalize',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    padding: '4px',
                                                    margin: 0,
                                                    height: '38px',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{m.name}</span>
                                                <span style={{ fontSize: '8px', opacity: 0.8 }}>Poder: {m.power} | {m.type}</span>
                                            </button>
                                        );
                                    });
                                })()}
                            </div>
                            <button 
                                onClick={() => setShowMoveSelect(false)}
                                className="pokemon-button danger"
                                style={{ margin: 0, padding: '6px' }}
                            >
                                Atrás
                            </button>
                        </div>
                    ) : showBagSelect ? (
                        /* ── Bag / Potion selection ── */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '10px', color: '#ffe082', fontWeight: 'bold', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                💊 Usar Objeto
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                {['potion', 'super_potion', 'hyper_potion', 'max_potion'].map((itemId) => {
                                    const qty = inventory.getQuantity(itemId);
                                    const info = inventory.getItemInfo(itemId);
                                    const label = info.name || itemId;
                                    if (qty <= 0) return null;
                                    return (
                                        <button
                                            key={itemId}
                                            onClick={() => handleBattleUseItem(itemId)}
                                            className="pokemon-button"
                                            style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', margin: 0, fontSize: '10px', alignItems: 'center', background: '#388e3c', color: '#fff' }}
                                        >
                                            <span>💊 {label}</span>
                                            <span style={{ fontWeight: 'bold' }}>x{qty}</span>
                                        </button>
                                    );
                                })}
                                {['potion', 'super_potion', 'hyper_potion', 'max_potion'].every(id => inventory.getQuantity(id) <= 0) && (
                                    <div style={{ gridColumn: 'span 2', color: '#ffcdd2', fontSize: '10px', textAlign: 'center', padding: '8px' }}>
                                        No tienes pociones disponibles
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setShowBagSelect(false)}
                                className="pokemon-button danger"
                                style={{ margin: 0, padding: '6px' }}
                            >
                                Atrás
                            </button>
                        </div>
                    ) : showSwitchSelect ? (
                        /* ── Pokémon switch selection ── */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '10px', color: '#80deea', fontWeight: 'bold', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                🔄 Cambiar Pokémon
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {team.map((poke: any, idx: number) => {
                                    const isActive = idx === team.findIndex((p: any) => p.hp > 0);
                                    const isDown = poke.hp <= 0;
                                    if (isActive || isDown) return null;
                                    const hpPct = Math.round((poke.hp / (poke.maxHp || 100)) * 100);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleBattleSwitchPokemon(idx)}
                                            className="pokemon-button"
                                            style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '6px 10px', margin: 0, fontSize: '10px',
                                                background: '#1565c0', color: '#fff'
                                            }}
                                        >
                                            <span style={{ textTransform: 'capitalize' }}>⬡ {poke.id} Nvl.{poke.level ?? 1}</span>
                                            <span style={{ color: hpPct > 50 ? '#a5d6a7' : hpPct > 20 ? '#ffe082' : '#ef9a9a' }}>
                                                HP {hpPct}%
                                            </span>
                                        </button>
                                    );
                                })}
                                {team.filter((_: any, idx: number) => {
                                    const isActive = idx === team.findIndex((p: any) => p.hp > 0);
                                    const isDown = team[idx].hp <= 0;
                                    return !isActive && !isDown;
                                }).length === 0 && (
                                    <div style={{ color: '#ffcdd2', fontSize: '10px', textAlign: 'center', padding: '8px' }}>
                                        No hay más Pokémon disponibles
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setShowSwitchSelect(false)}
                                className="pokemon-button danger"
                                style={{ margin: 0, padding: '6px' }}
                            >
                                Atrás
                            </button>
                        </div>
                    ) : !showBallSelect ? (
                        /* ── Main 4-button action grid ── */
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                            <button
                                onClick={handleBattleAttack}
                                className="pokemon-button success"
                                style={{ background: '#d32f2f', color: '#fff', margin: 0, padding: '10px', fontSize: '10px' }}
                                disabled={!team.some((p: any) => p.hp > 0)}
                            >
                                ⚔️ Luchar
                            </button>
                            <button
                                onClick={() => { setShowSwitchSelect(true); setShowBallSelect(false); setShowBagSelect(false); }}
                                className="pokemon-button"
                                style={{ background: '#1565c0', color: '#fff', margin: 0, padding: '10px', fontSize: '10px' }}
                                disabled={team.filter((p: any, i: number) => p.hp > 0 && i !== team.findIndex((x: any) => x.hp > 0)).length === 0}
                            >
                                🔄 Cambiar
                            </button>
                            <button
                                onClick={() => { setShowBallSelect(true); setShowSwitchSelect(false); setShowBagSelect(false); }}
                                className="pokemon-button"
                                style={{ background: '#e65100', color: '#fff', margin: 0, padding: '10px', fontSize: '10px', opacity: (isGymBattle || isTrainerBattle) ? 0.5 : 1 }}
                                disabled={isGymBattle || isTrainerBattle}
                            >
                                🎯 Capturar
                            </button>
                            <button
                                onClick={() => { setShowBagSelect(true); setShowSwitchSelect(false); setShowBallSelect(false); }}
                                className="pokemon-button"
                                style={{ background: '#388e3c', color: '#fff', margin: 0, padding: '10px', fontSize: '10px' }}
                            >
                                💊 Mochila
                            </button>
                            <button
                                onClick={handleBattleRun}
                                className="pokemon-button danger"
                                style={{ margin: 0, padding: '8px', fontSize: '10px', gridColumn: 'span 2', opacity: (isGymBattle || isTrainerBattle) ? 0.5 : 1 }}
                                disabled={isGymBattle || isTrainerBattle}
                            >
                                {(isGymBattle || isTrainerBattle) ? "🏃 No puedes Huir" : "🏃 Huir"}
                            </button>
                        </div>

                    ) : (
                        /* Ball Selection */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                {['tamer_ball', 'super_ball', 'ultra_ball', 'master_ball'].map((ballId) => {
                                    const qty = inventory.getQuantity(ballId);
                                    const info = inventory.getItemInfo(ballId);
                                    const label = info.name || ballId;

                                    return (
                                        <button 
                                            key={ballId}
                                            onClick={() => handleBattleCatch(ballId)}
                                            className="pokemon-button"
                                            style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', opacity: qty > 0 ? 1 : 0.6, margin: 0, fontSize: '10px', alignItems: 'center' }}
                                            disabled={qty <= 0}
                                        >
                                            <span>🔴 {label}</span>
                                            <span style={{ fontWeight: 'bold' }}>x{qty}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <button 
                                onClick={() => setShowBallSelect(false)}
                                className="pokemon-button danger"
                                style={{ margin: 0, padding: '6px' }}
                            >
                                Atrás
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Custom Modal Notification Dialog */}
            {notification && (
                <div className="modal-overlay" style={{ zIndex: 10000 }}>
                    <div className="modal-card pokemon-panel" style={{ maxWidth: '360px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{notification.title}</h3>
                            <button onClick={() => {
                                setNotification(null);
                                setDoubleRewardCoins(0);
                                setDoubleRewardType(null);
                            }} className="modal-close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5', color: '#3e2723' }}>
                                {notification.message}
                            </p>
                            {notification.title === "¡Victoria!" && doubleRewardCoins > 0 && (
                                <button 
                                    onClick={handleDoubleBattleReward}
                                    className="pokemon-button animate-hover"
                                    style={{ background: '#ffe082', border: '1px solid #ffca28', color: '#3e2723', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '12px' }}
                                >
                                    🎁 Duplicar Recompensa (+{doubleRewardCoins} Coins)
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    setNotification(null);
                                    setDoubleRewardCoins(0);
                                    setDoubleRewardType(null);
                                }}
                                className="pokemon-button success"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Nickname Modal */}
            {showEditNicknameModal && (
                <div className="modal-overlay" style={{ zIndex: 310 }}>
                    <div className="modal-card pokemon-panel" style={{ maxWidth: '360px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Editar Nickname</h3>
                            <button onClick={() => setShowEditNicknameModal(false)} className="modal-close-btn">&times;</button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleUpdateNickname(nicknameInput);
                            setShowEditNicknameModal(false);
                        }} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p style={{ fontSize: '11px', color: '#5d4037', margin: 0, textTransform: 'uppercase', fontWeight: 'bold' }}>
                                Elige un alias para mostrar sobre tu personaje:
                            </p>
                            <input 
                                type="text"
                                value={nicknameInput}
                                onChange={(e) => setNicknameInput(e.target.value)}
                                maxLength={15}
                                placeholder="Escribe tu Nickname..."
                                style={{
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '2px solid #3e2723',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    background: '#fdfbf7',
                                    color: '#3e2723',
                                    outline: 'none',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button 
                                    type="button"
                                    onClick={() => setShowEditNicknameModal(false)}
                                    className="pokemon-button danger"
                                    style={{ flex: 1, margin: 0 }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="pokemon-button success"
                                    style={{ flex: 2, margin: 0 }}
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PVP MODALS AND UI */}
            {hoveredPlayer && !playerContextMenu && (
                <div style={{ position: 'absolute', top: hoveredPlayer.y - 60, left: hoveredPlayer.x - 50, background: '#fff', border: '2px solid #000', borderRadius: '8px', zIndex: 200, padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', pointerEvents: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>{hoveredPlayer.name}</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>Click to Challenge (100 coins)</div>
                </div>
            )}

            {playerContextMenu && (
                <div 
                    style={{ position: 'absolute', top: playerContextMenu.y - 80, left: playerContextMenu.x - 60, background: '#fff', border: '2px solid #000', borderRadius: '8px', zIndex: 200, padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', pointerEvents: 'auto' }}
                >
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{playerContextMenu.name}</div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handlePvPInvite(playerContextMenu.address); setPlayerContextMenu(null); }}
                        className="btn-primary" 
                        style={{ padding: '8px 16px', fontSize: '12px', width: '100%' }}
                    >
                        ⚔️ Desafiar
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleViewOpponentProfile(playerContextMenu.address); setPlayerContextMenu(null); }}
                        className="pokemon-button animate-hover" 
                        style={{ padding: '6px 12px', fontSize: '11px', margin: '4px 0 0 0', width: '100%', background: '#e3f2fd', border: '1px solid #90caf9', color: '#1565c0', cursor: 'pointer' }}
                    >
                        🔎 Ver Perfil
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setPlayerContextMenu(null); }}
                        style={{ background: '#eee', color: '#333', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer', marginTop: '4px', width: '100%', textAlign: 'center' }}
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {incomingPvPInvite && (
                <div className="modal-overlay" style={{ zIndex: 10000 }}>
                    <div className="modal-content" style={{ textAlign: 'center' }}>
                        <h2>⚔️ ¡DESAFÍO RECIBIDO! ⚔️</h2>
                        <p>El jugador <strong>{incomingPvPInvite.fromName}</strong> te ha desafiado a una Batalla Pokémon.</p>
                        <p style={{ fontSize: '12px', color: '#d32f2f', fontWeight: 'bold' }}>Rechazar el desafío te costará 5 Coins.</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="pokemon-button danger" onClick={handleRejectPvP}>Huir (-5 Coins)</button>
                            <button className="pokemon-button success" onClick={handleAcceptPvP}>¡Aceptar!</button>
                        </div>
                    </div>
                </div>
            )}

            {pendingPvPInvite && (
                <div className="modal-overlay" style={{ zIndex: 10000 }}>
                    <div className="modal-content" style={{ textAlign: 'center' }}>
                        <div className="spinner animate-spin" style={{ border: '4px solid #f3f3f3', width: '40px', height: '40px', borderRadius: '50%', borderLeftColor: '#fbc02d', margin: '0 auto 15px auto' }}></div>
                        <h2>⏳ ESPERANDO OPONENTE ⏳</h2>
                        <p>Has enviado un desafío. Esperando a que el jugador acepte...</p>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>Si no responde en 30 segundos, el duelo se cancelará automáticamente.</p>
                    </div>
                </div>
            )}


            {showLeaderboard && (
                <div className="modal-overlay" style={{ zIndex: 300 }}>
                    <div style={{ background: 'linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', border: '2px solid rgba(255,255,255,0.12)', borderRadius: '16px', width: '95%', maxWidth: '420px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.1)', fontFamily: "'Segoe UI',monospace" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>🏆</span>
                                <div>
                                    <div style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Ranking Global PvP</div>
                                    <div style={{ color: '#64748b', fontSize: '9px' }}>Top jugadores por victorias</div>
                                </div>
                            </div>
                            <button onClick={() => setShowLeaderboard(false)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>&times;</button>
                        </div>
                        <div style={{ padding: '12px 16px 20px' }}>
                            {!pvpLeaderboard ? (
                                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px', fontSize: '12px' }}>
                                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                                    Cargando ranking...
                                </div>
                            ) : pvpLeaderboard.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#64748b', padding: '24px', fontSize: '11px' }}>
                                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎮</div>
                                    Aún no hay jugadores en el ranking. ¡Sé el primero!
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {/* Header Row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 48px 48px 52px', gap: '6px', padding: '6px 10px', fontSize: '8px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '2px' }}>
                                        <span>#</span>
                                        <span>Jugador</span>
                                        <span style={{ textAlign: 'center' }}>V</span>
                                        <span style={{ textAlign: 'center' }}>D</span>
                                        <span style={{ textAlign: 'center' }}>%Win</span>
                                    </div>
                                    {pvpLeaderboard.map((p, i) => {
                                        const isMe = p.address === walletAddress;
                                        const rankBadge = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
                                        const winRate = (p.wins + p.losses) > 0 ? Math.round((p.wins / (p.wins + p.losses)) * 100) : 0;
                                        const isTop3 = i < 3;

                                        return (
                                            <div key={p.address} style={{
                                                display: 'grid',
                                                gridTemplateColumns: '32px 1fr 48px 48px 52px',
                                                gap: '6px',
                                                padding: '8px 10px',
                                                borderRadius: '8px',
                                                border: '1px solid',
                                                background: isMe ? 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(79,70,229,0.1) 100%)' :
                                                    isTop3 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                                                borderColor: isMe ? 'rgba(99,102,241,0.4)' :
                                                    i === 0 ? 'rgba(251,191,36,0.3)' :
                                                    i === 1 ? 'rgba(148,163,184,0.3)' :
                                                    i === 2 ? 'rgba(180,83,9,0.3)' :
                                                    'rgba(255,255,255,0.06)',
                                                boxShadow: i === 0 ? '0 0 10px rgba(251,191,36,0.1)' : 'none',
                                                alignItems: 'center',
                                                fontSize: '11px',
                                            }}>
                                                <span style={{ fontSize: i < 3 ? '14px' : '9px', textAlign: 'center', fontWeight: 'bold', color: i < 3 ? undefined : '#64748b' }}>{rankBadge}</span>
                                                <div style={{ overflow: 'hidden' }}>
                                                    <div style={{ fontWeight: 'bold', color: isMe ? '#a5b4fc' : '#e2e8f0', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {isMe ? '⭐ ' : ''}{p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name}
                                                    </div>
                                                    {isMe && <div style={{ fontSize: '8px', color: '#818cf8' }}>Tú</div>}
                                                </div>
                                                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#34d399', fontSize: '12px' }}>{p.wins}</div>
                                                <div style={{ textAlign: 'center', color: '#f87171', fontSize: '11px' }}>{p.losses}</div>
                                                <div style={{ textAlign: 'center', fontSize: '9px', fontWeight: 'bold', color: winRate >= 60 ? '#34d399' : winRate >= 40 ? '#fbbf24' : '#f87171' }}>{winRate}%</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {activePvPBattle && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 400,
                    backgroundColor: '#f6ebd0',
                    backgroundImage: 'radial-gradient(#ebd9b3 1px, transparent 1px), radial-gradient(#ebd9b3 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 10px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    padding: '8px',
                    fontFamily: 'monospace',
                    overflow: 'hidden'
                }}>
                    
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: '#3e2723',
                        border: '2px solid #5d4037',
                        borderRadius: '4px',
                        color: '#fff',
                        padding: '4px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        fontSize: '11px',
                        letterSpacing: '1px'
                    }}>
                        <span>⚔️ PvP vs {activePvPBattle.opponentName}</span>
                        {activePvPBattle.status === 'win' && <span style={{ marginLeft: '10px', color: '#4caf50' }}>¡VICTORIA!</span>}
                        {activePvPBattle.status === 'loss' && <span style={{ marginLeft: '10px', color: '#f44336' }}>¡DERROTA!</span>}
                    </div>

                    {activePvPBattle.status === 'syncing' ? (
                        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#3e2723', fontSize: '16px', fontWeight: 'bold' }}>
                            <div className="spinner animate-spin" style={{ border: '4px solid rgba(0,0,0,0.1)', width: '30px', height: '30px', borderRadius: '50%', borderLeftColor: '#3e2723', marginBottom: '15px' }}></div>
                            Sincronizando batalla...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between', padding: '10px 0', position: 'relative' }}>
                            
                            {/* Opponent Row (Info on Left, Sprite on Right) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 8px' }}>
                                {/* Opponent Info Box (Left) */}
                                <div className="pokemon-panel" style={{
                                    width: '50%',
                                    padding: '6px',
                                    background: '#fff',
                                    border: '2px solid #3e2723',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '3px',
                                    boxShadow: '2px 2px 0 rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px', textTransform: 'capitalize', color: '#3e2723', alignItems: 'center' }}>
                                        <span style={{ display: 'flex', alignItems: 'center' }}>
                                            {activePvPBattle.opponentPokemon?.id || '?'}
                                            {activePvPBattle.opponentStatus && (
                                                <span style={{ 
                                                    marginLeft: '4px', 
                                                    padding: '1px 3px', 
                                                    fontSize: '7px', 
                                                    fontWeight: 'bold', 
                                                    borderRadius: '2px', 
                                                    color: '#fff',
                                                    background: activePvPBattle.opponentStatus === 'PAR' ? '#ffb300' :
                                                                activePvPBattle.opponentStatus === 'SLP' ? '#90a4ae' :
                                                                activePvPBattle.opponentStatus === 'PSN' ? '#ba68c8' :
                                                                activePvPBattle.opponentStatus === 'CON' ? '#4db6ac' : '#ff8a65'
                                                }}>
                                                    {activePvPBattle.opponentStatus}
                                                </span>
                                            )}
                                        </span>
                                        <span>L:{activePvPBattle.opponentPokemon?.level || '?'}</span>
                                    </div>
                                    <div className="pokemon-hp-bar" style={{ height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden', border: '1px solid #795548', margin: 0, width: '100%' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.round((activePvPBattle.opponentHp / (activePvPBattle.opponentMaxHp || 1)) * 100)}%`,
                                            background: (activePvPBattle.opponentHp / (activePvPBattle.opponentMaxHp || 1)) < 0.2 ? '#f44336' : ((activePvPBattle.opponentHp / (activePvPBattle.opponentMaxHp || 1)) < 0.5 ? '#ffeb3b' : '#4caf50'),
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                    <div style={{ fontSize: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#5d4037' }}>
                                        <span>HP: {activePvPBattle.opponentHp}/{activePvPBattle.opponentMaxHp}</span>
                                    </div>
                                </div>

                                {/* Opponent Sprite (Right) */}
                                <div style={{ width: '45%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '130px' }}>
                                    <img 
                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonSpeciesList.find((s:any)=>s.name.toLowerCase() === activePvPBattle.opponentPokemon?.id?.toLowerCase())?.id || 25}.png`} 
                                        alt="Opponent" 
                                        className={opponentSpriteEffect === 'shake' ? 'battle-shake' : opponentSpriteEffect === 'flash' ? 'battle-flash' : ''}
                                        style={{ width: '110px', height: '110px', objectFit: 'contain' }}
                                    />
                                    {floatingDamage && floatingDamage.target === 'opponent' && (
                                        <div className="floating-damage-num" style={{ top: '10px', left: '30%' }}>{floatingDamage.value}</div>
                                    )}
                                </div>
                            </div>

                            {/* Combat Log History (Middle space) */}
                            {activePvPBattle.status !== 'syncing' && (
                                <div style={{
                                    background: '#faf6eb',
                                    border: '1px solid #795548',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    margin: '6px 8px',
                                    minHeight: '72px',
                                    maxHeight: '72px',
                                    boxSizing: 'border-box',
                                    overflowY: 'auto',
                                    fontSize: '9px',
                                    color: '#5d4037',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px',
                                    textAlign: 'left',
                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                                }}>
                                    {pvpBattleLog.slice(-5).map((log, idx) => (
                                        <div key={idx} style={{ 
                                            lineHeight: '1.2', 
                                            borderBottom: idx < pvpBattleLog.slice(-5).length - 1 ? '1px dashed rgba(121, 85, 72, 0.15)' : 'none',
                                            paddingBottom: '2px',
                                            paddingTop: '2px'
                                        }}>
                                            {log}
                                        </div>
                                    ))}
                                    {pvpBattleLog.length === 0 && (
                                        <div style={{ color: '#8d6e63', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                                            Esperando acciones de combate...
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Player Row (Sprite on Left, Info on Right) */}
                            {(() => {
                                const activePoke = team.find((p: any) => p.hp > 0);
                                if (!activePoke) return <div style={{ color: '#d32f2f', fontWeight: 'bold', textAlign: 'center' }}>¡No tienes Pokémon activos!</div>;
                                const pct = Math.round((activePvPBattle.myHp / (activePoke.maxHp || 1)) * 100);
                                const activePokeSpecies = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === activePoke.id.toLowerCase());
                                
                                return (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 8px', marginTop: '4px' }}>
                                        {/* Player Sprite (Left) */}
                                        <div style={{ width: '45%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '130px' }}>
                                            <img 
                                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${pokemonSpeciesList.find((s:any)=>s.name.toLowerCase() === activePoke.id.toLowerCase())?.id || 25}.png`} 
                                                alt={activePoke.id} 
                                                className={playerSpriteEffect === 'bounce' ? 'battle-bounce' : playerSpriteEffect === 'shake' ? 'battle-shake' : ''}
                                                style={{ width: '110px', height: '110px', objectFit: 'contain' }}
                                            />
                                            {floatingDamage && floatingDamage.target === 'player' && (
                                                <div className="floating-damage-num" style={{ top: '10px', left: '30%' }}>{floatingDamage.value}</div>
                                            )}
                                        </div>

                                        {/* Player Info Box (Right) */}
                                        <div className="pokemon-panel" style={{
                                            width: '50%',
                                            padding: '6px',
                                            background: '#fff',
                                            border: '2px solid #3e2723',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '3px',
                                            boxShadow: '2px 2px 0 rgba(0,0,0,0.1)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '10px', textTransform: 'capitalize', color: '#3e2723', alignItems: 'center' }}>
                                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                                    {activePoke.id}
                                                    {activePvPBattle.myStatus && (
                                                        <span style={{ 
                                                            marginLeft: '4px', 
                                                            padding: '1px 3px', 
                                                            fontSize: '7px', 
                                                            fontWeight: 'bold', 
                                                            borderRadius: '2px', 
                                                            color: '#fff',
                                                            background: activePvPBattle.myStatus === 'PAR' ? '#ffb300' :
                                                                        activePvPBattle.myStatus === 'SLP' ? '#90a4ae' :
                                                                        activePvPBattle.myStatus === 'PSN' ? '#ba68c8' :
                                                                        activePvPBattle.myStatus === 'CON' ? '#4db6ac' : '#ff8a65'
                                                        }}>
                                                            {activePvPBattle.myStatus}
                                                        </span>
                                                    )}
                                                </span>
                                                <span>L:{activePoke.level ?? 1}</span>
                                            </div>
                                            <div className="pokemon-hp-bar" style={{ height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden', border: '1px solid #795548', margin: 0, width: '100%' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${pct}%`,
                                                    background: pct < 20 ? '#f44336' : (pct < 50 ? '#ffeb3b' : '#4caf50'),
                                                    transition: 'width 0.3s ease'
                                                }}></div>
                                            </div>
                                            <div style={{ fontSize: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#5d4037' }}>
                                                <span>HP: {activePvPBattle.myHp}/{activePoke.maxHp}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Battle Dialog Log */}
                    {activePvPBattle.status !== 'syncing' && (
                        <div style={{
                            background: '#f5f0e1',
                            border: '2px solid #3e2723',
                            borderRadius: '4px',
                            padding: '8px',
                            minHeight: '44px',
                            maxHeight: '44px',
                            fontSize: '11px',
                            color: '#3e2723',
                            fontWeight: 'bold',
                            boxSizing: 'border-box',
                            overflowY: 'auto',
                            lineHeight: '1.3',
                            marginBottom: '4px'
                        }}>
                            {activePvPBattle.status === 'battle' ? (
                                activePvPBattle.turn === walletAddress ? "¡Es tu turno! Selecciona un movimiento." : `Esperando que ${activePvPBattle.opponentName} juegue...`
                            ) : activePvPBattle.status === 'win' ? (
                                "¡Felicidades! Has ganado la batalla PvP."
                            ) : activePvPBattle.status === 'loss' ? (
                                "Tu equipo ha sido derrotado. Has perdido la batalla PvP."
                            ) : activePvPBattle.status === 'flee' ? (
                                "Huyiste de la batalla."
                            ) : activePvPBattle.status === 'opponent_flee' ? (
                                "El oponente huyó de la batalla."
                            ) : (
                                "¡Duelo PvP finalizado!"
                            )}
                        </div>
                    )}

                    {/* Options/Controls Panel */}
                    {activePvPBattle.status !== 'syncing' && (
                        <div style={{
                            background: '#fff',
                            border: '2px solid #3e2723',
                            borderRadius: '4px',
                            padding: '8px',
                            minHeight: '135px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            alignItems: 'stretch'
                        }}>
                            {activePvPBattle.status === 'battle' ? (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', width: '100%', marginBottom: '6px' }}>
                                        {(() => {
                                            const activePoke = team.find(p => p.hp > 0);
                                            if (!activePoke) return null;
                                            const activePokeMoves = activePoke.moves || getPokemonMoves(activePoke.id, activePoke.level ?? 1);
                                            return (activePokeMoves as string[]).map((moveId: string) => {
                                                const m = MOVES_DATABASE[moveId] || { name: moveId, type: 'normal', power: 40 };
                                                return (
                                                    <button 
                                                        key={moveId}
                                                        className="pokemon-button animate-hover"
                                                        onClick={() => handleExecutePvPMove(moveId)}
                                                        disabled={activePvPBattle.turn !== walletAddress}
                                                        style={{ 
                                                            background: getTypeColor(m.type),
                                                            color: m.type === 'electric' ? '#3e2723' : '#fff',
                                                            height: '38px', padding: '4px', margin: 0, fontSize: '10px', fontWeight: 'bold',
                                                            opacity: activePvPBattle.turn !== walletAddress ? 0.5 : 1,
                                                            border: '1px solid #333',
                                                            borderRadius: '4px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            textTransform: 'capitalize'
                                                        }}
                                                    >
                                                        <span style={{ fontWeight: 'bold', fontSize: '11px' }}>{m.name}</span>
                                                        <span style={{ fontSize: '8px', opacity: 0.8 }}>Poder: {m.power} | {m.type}</span>
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', width: '100%', marginBottom: '6px' }}>
                                        <button
                                            className="pokemon-button"
                                            onClick={() => {
                                                setUsingItem(null);
                                                setShowPvpBackpack(true);
                                            }}
                                            disabled={activePvPBattle.turn !== walletAddress || isBattleAnimating}
                                            style={{
                                                background: '#ffe082', color: '#3e2723', border: '1px solid #ffca28', margin: 0, padding: '8px', fontSize: '11px', fontWeight: 'bold',
                                                opacity: activePvPBattle.turn !== walletAddress ? 0.5 : 1,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                            }}
                                        >
                                            🎒 Mochila ({pvpItemsUsed}/3)
                                        </button>
                                        <button
                                            className="pokemon-button danger"
                                            onClick={handlePvpFlee}
                                            disabled={isBattleAnimating}
                                            style={{ margin: 0, padding: '8px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                        >
                                            🏃 Huir
                                        </button>
                                    </div>
                                    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', color: activePvPBattle.turn === walletAddress ? '#2e7d32' : '#c62828', paddingBottom: '4px' }}>
                                        {activePvPBattle.turn === walletAddress ? `⏳ Tu turno (${pvpTurnTimer}s)` : `⏳ Turno del oponente (${pvpTurnTimer}s)`}
                                    </div>
                                </>
                            ) : (
                                <button 
                                    className="pokemon-button success"
                                    onClick={() => {
                                        if (activePvPBattle.status === 'win') {
                                            economyRef.current.pvp_wins = (economyRef.current.pvp_wins || 0) + 1;
                                            economyRef.current.addCoins(180);
                                            showNotification("¡Ganaste!", "GANASTE EL DUELO TE LLEVAS 180 COINS.");
                                        } else if (activePvPBattle.status === 'loss') {
                                            economyRef.current.pvp_losses = (economyRef.current.pvp_losses || 0) + 1;
                                            showNotification("Derrota", "Perdiste el duelo y tu apuesta de 100 Coins.");
                                        } else if (activePvPBattle.status === 'flee') {
                                            showNotification("Combate Finalizado", "Huyiste del combate. Perdiste 10 Coins.");
                                        } else if (activePvPBattle.status === 'opponent_flee') {
                                            economyRef.current.addCoins(100);
                                            showNotification("Combate Cancelado", "El oponente huyó de la batalla. Se te han devuelto tus 100 Coins.");
                                        }
                                        economyRef.current.in_pvp_battle = false;
                                        setEconomy(new Economy(economyRef.current.toSaveData()));
                                        saveLocalEconomy();
                                        setActivePvPBattle(null);
                                    }}
                                    style={{ height: '40px', fontSize: '14px', fontWeight: 'bold' }}
                                >
                                    Finalizar Duelo
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
            {activeEvolution && (
                <EvolutionScreen
                    pokemonId={activeEvolution.pokemonId}
                    targetId={activeEvolution.targetId}
                    level={activeEvolution.level}
                    onComplete={activeEvolution.onComplete}
                />
            )}
        </div>
    );
}

