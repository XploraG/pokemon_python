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
    confusion: { name: "Confusión", type: "psychic", power: 50, accuracy: 100 }
};

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
        return teamData.map((p: any) => {
            const lvl = p.level !== undefined ? p.level : 1;
            const xp = p.xp !== undefined ? p.xp : 0;
            const stats = getPokemonStats(p.id, lvl);
            return {
                ...p,
                level: lvl,
                xp: xp,
                hp: p.hp !== undefined ? Math.min(p.hp, stats.maxHp) : stats.maxHp,
                maxHp: stats.maxHp
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
                maxHp: stats.maxHp
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

    // Ad-related states
    const [adHealsViewed, setAdHealsViewed] = useState(0);
    const [adHealSelectMode, setAdHealSelectMode] = useState(false);
    const [doubleRewardCoins, setDoubleRewardCoins] = useState<number>(0);
    const [doubleRewardType, setDoubleRewardType] = useState<'gym' | 'wild' | 'trainer' | null>(null);
    const [isGymBattle, setIsGymBattle] = useState<boolean>(false);
    const [gymLeaderName, setGymLeaderName] = useState<string | null>(null);

    useEffect(() => {
        setPlayerName(saveName);
        setNicknameInput(saveName);
    }, [saveName]);

    // Real-time Multiplayer states & refs
    const [otherPlayers, setOtherPlayers] = useState<Record<string, any>>({});
    const otherPlayersRef = useRef<Record<string, any>>({});
    const channelRef = useRef<any>(null);
    const lastBroadcastRef = useRef({ x: 0, y: 0, dir: '', animFrame: 0, map: '' });

    useEffect(() => {
        otherPlayersRef.current = otherPlayers;
    }, [otherPlayers]);
    
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
    const [showMoveSelect, setShowMoveSelect] = useState<boolean>(false);
    const [catchBallState, setCatchBallState] = useState<'throw' | 'shake' | 'success' | 'fail' | null>(null);
    const [usingItem, setUsingItem] = useState<any | null>(null);
    const [selectedInfoPoke, setSelectedInfoPoke] = useState<any | null>(null);

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
                    map: currentMapPathRef.current
                }
            });
        }
        
        showNotification("Nickname Actualizado", `Tu alias ahora es "${trimmed}".`);
    };

    const handleWatchFreeCoinsAd = async () => {
        const adManager = AdManager.getInstance();
        const success = await adManager.showRewardedAd({
            telegramBlockId: "34910",
            adsterraUrl: process.env.NEXT_PUBLIC_ADSTERRA_DIRECT_LINK || "YOUR_ADSTERRA_DIRECT_LINK"
        });

        if (success) {
            economyRef.current.addCoins(20);
            saveLocalEconomy();
            setEconomy(new Economy(economyRef.current.toSaveData()));
            showNotification("Recompensa", "¡Has recibido 20 Coins por ver el anuncio!");
        } else {
            showNotification("Anuncio Cancelado", "No se pudo obtener la recompensa.");
        }
    };

    const handleWatchHealAd = async () => {
        const adManager = AdManager.getInstance();
        const success = await adManager.showRewardedAd({
            telegramBlockId: "34911",
            adsterraUrl: process.env.NEXT_PUBLIC_ADSTERRA_DIRECT_LINK || "YOUR_ADSTERRA_DIRECT_LINK"
        });

        if (success) {
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
            showNotification("Anuncio Cancelado", "No se completó el anuncio.");
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
        setDoubleRewardCoins(0);
        setDoubleRewardType(null);
        setNotification(null);

        const adManager = AdManager.getInstance();
        const success = await adManager.showRewardedAd({
            telegramBlockId: "34912",
            adsterraUrl: process.env.NEXT_PUBLIC_ADSTERRA_DIRECT_LINK || "YOUR_ADSTERRA_DIRECT_LINK"
        });

        if (success) {
            economyRef.current.addCoins(coinsToDouble);
            saveLocalEconomy();
            setEconomy(new Economy(economyRef.current.toSaveData()));
            showNotification("¡Duplicado!", `¡Has recibido otras ${coinsToDouble} Coins por ver el anuncio!`);
        } else {
            showNotification("Anuncio Cancelado", "No se pudo duplicar la recompensa.");
        }
    };

    const handleDoubleBattleRewardFromDialog = async () => {
        const coinsToDouble = doubleRewardCoins;
        setDoubleRewardCoins(0);
        setDoubleRewardType(null);
        setActiveDialog(null);

        const adManager = AdManager.getInstance();
        const success = await adManager.showRewardedAd({
            telegramBlockId: "34912",
            adsterraUrl: process.env.NEXT_PUBLIC_ADSTERRA_DIRECT_LINK || "YOUR_ADSTERRA_DIRECT_LINK"
        });

        if (success) {
            economyRef.current.addCoins(coinsToDouble);
            saveLocalEconomy();
            setEconomy(new Economy(economyRef.current.toSaveData()));
            showNotification("¡Duplicado!", `¡Has recibido otras ${coinsToDouble} Coins por ver el anuncio!`);
        } else {
            showNotification("Anuncio Cancelado", "No se pudo duplicar la recompensa.");
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
                        map: payload.map
                    }
                }));
            })
            .on('broadcast', { event: 'pvp_invite' }, ({ payload }) => {
                if (payload.to === walletAddress && !activePvPBattle && !activeWildBattleRef.current) {
                    setIncomingPvPInvite({
                        from: payload.from,
                        fromName: payload.fromName
                    });
                }
            })
            .on('broadcast', { event: 'pvp_accept' }, ({ payload }) => {
                if (payload.to === walletAddress && pendingPvPInviteRef.current === payload.from) {
                    setPendingPvPInvite(null);
                    pendingPvPInviteRef.current = null;
                    
                    // Deduct the 100 coin bet
                    economyRef.current.spendCoins(100);
                    setEconomy(new Economy(economyRef.current.toSaveData()));
                    saveLocalEconomy();

                    // Start battle as challenger
                    setActivePvPBattle({
                        opponentAddress: payload.from,
                        opponentName: payload.fromName,
                        opponentPokemon: null,
                        myHp: teamRef.current.find((p: any) => p.hp > 0)?.hp || 100,
                        opponentHp: 100,
                        opponentMaxHp: 100,
                        status: 'syncing',
                        turn: walletAddress
                    });
                    
                    const activePoke = teamRef.current.find((p: any) => p.hp > 0);
                    if (activePoke) {
                        channel.send({
                            type: 'broadcast',
                            event: 'pvp_sync_pokemon',
                            payload: {
                                from: walletAddress,
                                to: payload.from,
                                pokemon: { id: activePoke.id, level: activePoke.level, hp: activePoke.hp, maxHp: activePoke.maxHp }
                            }
                        });
                    }
                }
            })
            .on('broadcast', { event: 'pvp_reject' }, ({ payload }) => {
                if (payload.to === walletAddress && pendingPvPInviteRef.current === payload.from) {
                    setPendingPvPInvite(null);
                    pendingPvPInviteRef.current = null;
                    // Cannot use showNotification easily here without ref, so we use direct setNotification
                    setNotification({ title: "Desafío Rechazado", message: `El jugador ${payload.fromName || 'Tamer'} rechazó tu duelo.` });
                }
            })
            .on('broadcast', { event: 'pvp_sync_pokemon' }, ({ payload }) => {
                if (payload.to === walletAddress) {
                    setActivePvPBattle((prev: any) => {
                        if (!prev) return prev;
                        // If we are already in battle and receive a sync packet, it means the opponent missed our sync packet.
                        // We must resend it so they can enter the battle state.
                        if (prev.status === 'battle') {
                            const activePoke = teamRef.current.find((p: any) => p.hp > 0);
                            if (activePoke) {
                                channel.send({
                                    type: 'broadcast',
                                    event: 'pvp_sync_pokemon',
                                    payload: {
                                        from: walletAddress,
                                        to: payload.from,
                                        pokemon: { id: activePoke.id, level: activePoke.level, hp: activePoke.hp, maxHp: activePoke.maxHp }
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
                    setActivePvPBattle((prev: any) => {
                        if (!prev) return prev;
                        const newHp = Math.max(0, prev.myHp - payload.damage);
                        
                        // Show floating damage
                        setFloatingDamage({ value: payload.damage, target: 'player' });
                        setPlayerSpriteEffect('shake');
                        setTimeout(() => { setPlayerSpriteEffect('none'); setFloatingDamage(null); }, 800);

                        if (newHp <= 0) {
                            // We lost
                            channel.send({
                                type: 'broadcast',
                                event: 'pvp_result',
                                payload: { from: walletAddress, to: payload.from, result: 'win' }
                            });
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
                        return { ...prev, status: payload.result }; // 'win'
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
            if (!activeWildBattleRef.current && !activePvPBattleRef.current && !isGymBattle) {
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
                        imgElement: img
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

            const player = playerRef.current;
            const mapData = mapDataRef.current;

            // 1. Process movement animation & inputs
            processMovement();

            // Broadcast movement changes if connected
            if (
                channelRef.current &&
                (player.x !== lastBroadcastRef.current.x ||
                 player.y !== lastBroadcastRef.current.y ||
                 player.moveDirection !== lastBroadcastRef.current.dir ||
                 player.animFrame !== lastBroadcastRef.current.animFrame ||
                 currentMapPathRef.current !== lastBroadcastRef.current.map)
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
                        map: currentMapPathRef.current
                    }
                });
                lastBroadcastRef.current = {
                    x: player.x,
                    y: player.y,
                    dir: player.moveDirection,
                    animFrame: player.animFrame,
                    map: currentMapPathRef.current
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
                incomingPvPInviteRef.current !== null
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
                returnMapRef.current = '/assets/maps/tutorial/main.json';
                returnCoordsRef.current = [600, 748]; // Spawn below door when returning
                playerRef.current.x = 144;
                playerRef.current.y = 224;
                playerRef.current.targetX = 144;
                playerRef.current.targetY = 224;
                playerRef.current.isMoving = false;
                setCurrentMapPath('/assets/maps/pokecenter/main.json');
                setActiveDialog(null);
                playerRef.current.isMoving = false;
                return true;
            }

            // 2. PokeMart door check
            if (x >= 560 && x <= 600 && y >= 1000 && y <= 1022) {
                setDialogName("Comercio Pokemon");
                setActiveDialog("Entering the PokeMart Store...");
                returnMapRef.current = '/assets/maps/tutorial/main.json';
                returnCoordsRef.current = [580, 1040]; // Spawn below door when returning
                playerRef.current.x = 144;
                playerRef.current.y = 224;
                playerRef.current.targetX = 144;
                playerRef.current.targetY = 224;
                playerRef.current.isMoving = false;
                setCurrentMapPath('/assets/maps/pokemart/main.json');
                setActiveDialog(null);
                playerRef.current.isMoving = false;
                return true;
            }

            // 3. Gym door check
            if (x >= 370 && x <= 410 && y >= 180 && y <= 204) {
                setDialogName("Gimnasio");
                setActiveDialog("Entering the Gym...");
                returnCoordsRef.current = [396, 228];
                playerRef.current.x = 176;
                playerRef.current.y = 288;
                playerRef.current.targetX = 176;
                playerRef.current.targetY = 288;
                playerRef.current.isMoving = false;
                setCurrentMapPath('/assets/maps/gym/main.json');
                setActiveDialog(null);
                playerRef.current.isMoving = false;
                return true;
            }

            // 4. House 1 door check
            if (x >= 140 && x <= 170 && y >= 700 && y <= 724) {
                setDialogName("Casa");
                setActiveDialog("Entering house...");
                returnCoordsRef.current = [154, 748];
                playerRef.current.x = 144;
                playerRef.current.y = 224;
                playerRef.current.targetX = 144;
                playerRef.current.targetY = 224;
                playerRef.current.isMoving = false;
                setCurrentMapPath('/assets/maps/redhouse/main.json');
                setActiveDialog(null);
                playerRef.current.isMoving = false;
                return true;
            }

            // 5. House 2 door check
            if (x >= 310 && x <= 340 && y >= 700 && y <= 724) {
                setDialogName("Casa");
                setActiveDialog("Entering house...");
                returnMapRef.current = '/assets/maps/tutorial/main.json';
                returnCoordsRef.current = [329, 748];
                playerRef.current.x = 144;
                playerRef.current.y = 224;
                playerRef.current.targetX = 144;
                playerRef.current.targetY = 224;
                playerRef.current.isMoving = false;
                setCurrentMapPath('/assets/maps/redhouse/main.json');
                setActiveDialog(null);
                playerRef.current.isMoving = false;
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
        
        setActivePvPBattle({
            opponentAddress: incomingPvPInvite.from,
            opponentName: incomingPvPInvite.fromName,
            opponentPokemon: null,
            myHp: teamRef.current.find((p: any) => p.hp > 0)?.hp || 100,
            opponentHp: 100,
            opponentMaxHp: 100,
            status: 'syncing',
            turn: incomingPvPInvite.from
        });
        
        const activePoke = teamRef.current.find((p: any) => p.hp > 0);
        if (activePoke) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'pvp_sync_pokemon',
                payload: {
                    from: walletAddress,
                    to: incomingPvPInvite.from,
                    pokemon: { id: activePoke.id, level: activePoke.level, hp: activePoke.hp, maxHp: activePoke.maxHp }
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

        setOpponentSpriteEffect('shake');
        setFloatingDamage({ value: playerDmg, target: 'opponent' });
        
        setActivePvPBattle((prev: any) => ({ 
            ...prev, 
            opponentHp: Math.max(0, prev.opponentHp - playerDmg),
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
                    if (activePokes.filter(p => p.hp > 0).length === 0) {
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

                    // Start actual Gym Battle
                    setIsGymBattle(true);
                    setGymLeaderName(entity.name.replace("Gym Leader ", ""));
                    setBattleMessage("¡El Líder de Gimnasio Brock te desafía!");
                    setShowBallSelect(false);
                    setActiveWildBattle({
                        name: "Onix",
                        level: 12,
                        hp: 90,
                        maxHp: 90,
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
                // Other general dialog NPCs
                else if (entity.dialog) {
                    setDialogName(entity.name);
                    setActiveDialog(entity.dialog);
                }
                break;
            }
        }
    };

    const saveLocalEconomy = async (updatedTeam?: any[], updatedPcPokemon?: any[], nameOverride?: string) => {
        const economyData = economyRef.current.toSaveData();
        const inventoryData = inventoryRef.current.toSaveData();
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
                    }
                    
                    const updatedTeam = [...team];
                    const stats = getPokemonStats(evolvedName, currentLvl);
                    updatedTeam[activePokeIdx] = {
                        ...activePoke,
                        id: evolvedName,
                        level: currentLvl,
                        xp: currentXp,
                        is_evolved: evolved ? true : activePoke.is_evolved,
                        maxHp: stats.maxHp,
                        hp: leveledUp ? stats.maxHp : Math.min(activePoke.hp, stats.maxHp)
                    };
                    
                    setTeam(updatedTeam);
                    
                    if (isGymBattle) {
                        const result = economyRef.current.getGymReward(1);
                        if (result.coins > 0) {
                            economyRef.current.updateMissionProgress('battle');
                            setDoubleRewardCoins(result.coins);
                            setDoubleRewardType('gym');
                            
                            let gymTrainerMsg = `\nGanaste ${result.xpGained} XP de Entrenador.`;
                            if (result.leveledUp) {
                                gymTrainerMsg += ` \n🎉 ¡Tu Nivel de Entrenador subió al Nivel ${result.newLevel}!`;
                            }

                            showNotification(
                                "¡Victoria de Gimnasio!", 
                                `¡Derrotaste al Onix de Brock! Ganaste la Medalla Roca, ${result.coins} Coins y ${result.xpGained} XP. ${gymTrainerMsg}\n${msg}`
                            );
                        } else {
                            showNotification(
                                "Victoria", 
                                `¡Derrotaste al Onix de Brock! Buen combate. \n${msg}`
                            );
                        }
                        
                        setIsGymBattle(false);
                        setGymLeaderName(null);
                        setActiveWildBattle(null);
                        saveLocalEconomy(updatedTeam);
                        setEconomy(new Economy(economyRef.current.toSaveData()));
                        setIsBattleAnimating(false);
                        return;
                    }

                    // Wild Pokémon defeated!
                    const minCoins = economyConfig.wild_battle_min_coins ?? 30;
                    const maxCoins = economyConfig.wild_battle_max_coins ?? 50;
                    const coinsEarned = Math.floor(Math.random() * (maxCoins - minCoins + 1)) + minCoins;
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

                    showNotification(
                        "¡Victoria!", 
                        `¡Tu ${oldName} derrotó al ${activeWildBattle.name} salvaje! Ganaste ${coinsEarned} Coins. ${trainerMsg}\n${msg}`
                    );
                    setActiveWildBattle(null);
                    saveLocalEconomy(updatedTeam);
                    setEconomy(new Economy(economyRef.current.toSaveData()));
                    setIsBattleAnimating(false);
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
                        
                        // Warp to Pokemon Center
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
        
        if (usingItem.id === 'evolution_stone') {
            const idLower = target.id.toLowerCase();
            let evolvedId = '';
            
            const evo = EVOLUTION_DATABASE[idLower];
            if (evo && evo.method === 'stone') {
                if (idLower === 'eevee') {
                    const evos = ['vaporeon', 'jolteon', 'flareon'];
                    evolvedId = evos[Math.floor(Math.random() * evos.length)];
                } else {
                    evolvedId = evo.target;
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
                
                showNotification("¡Evolución exitosa!", `¡Tu ${target.id} ha evolucionado en ${evolvedId.toUpperCase()} usando la Piedra Evolución!`);
            } else {
                showNotification("Error de Piedra", `¡La Piedra Evolución no tiene efecto en ${target.id}!`);
            }
            return;
        }

        const isRevive = usingItem.id.includes('revive');
        
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

    const handleBattleCatch = (ballId: string) => {
        if (!activeWildBattle || isBattleAnimating) return;

        const info = inventoryRef.current.getItemInfo(ballId);

        if (!inventoryRef.current.hasItem(ballId)) {
            showNotification("Mochila", "¡No tienes esa Pokeball!");
            return;
        }

        inventoryRef.current.removeItem(ballId);
        setInventory(new Inventory(inventoryRef.current.toSaveData()));
        
        setShowBallSelect(false);
        setIsBattleAnimating(true);
        setBattleMessage(`¡Lanzaste una ${info.name || ballId}!`);
        setCatchBallState('throw');

        let ballRate = 0.3;
        if (ballId === 'great_ball') ballRate = 0.5;
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
                            showNotification("¡Capturado!", `¡Capturaste a ${activeWildBattle.name}! Pero tu equipo está lleno. Fue enviado a tu PC.`);
                        } else {
                            const updatedTeam = [...team, newPoke];
                            setTeam(updatedTeam);
                            saveLocalEconomy(updatedTeam, pcPokemon);
                            showNotification("¡Capturado!", `¡Felicidades! Capturaste a ${activeWildBattle.name} y se unió a tu equipo.`);
                        }

                        setEconomy(new Economy(newEconomyData));
                        setActiveWildBattle(null);
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
                            } else {
                                setBattleMessage(`El ${activeWildBattle.name} salvaje escapó y contraatacó con ${wildDmg} de daño, debilitando a tu ${activePoke.id}.`);
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
                    
                    // Save their 0 HP state without healing
                    setTeam(updatedTeam);
                    saveLocalEconomy(updatedTeam);
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

    return (
        <div className="game-container">
            {/* Visual game Canvas wrapper */}
            <div className="canvas-wrapper" ref={wrapperRef}>
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
                        <div className="d-pad-container">
                            <div 
                                className="d-pad-btn d-pad-up"
                                onPointerDown={() => keysPressed.current['w'] = true}
                                onPointerUp={() => keysPressed.current['w'] = false}
                                onPointerLeave={() => keysPressed.current['w'] = false}
                            >▲</div>
                            <div 
                                className="d-pad-btn d-pad-left"
                                onPointerDown={() => keysPressed.current['a'] = true}
                                onPointerUp={() => keysPressed.current['a'] = false}
                                onPointerLeave={() => keysPressed.current['a'] = false}
                            >◀</div>
                            <div 
                                className="d-pad-btn d-pad-right"
                                onPointerDown={() => keysPressed.current['d'] = true}
                                onPointerUp={() => keysPressed.current['d'] = false}
                                onPointerLeave={() => keysPressed.current['d'] = false}
                            >▶</div>
                            <div 
                                className="d-pad-btn d-pad-down"
                                onPointerDown={() => keysPressed.current['s'] = true}
                                onPointerUp={() => keysPressed.current['s'] = false}
                                onPointerLeave={() => keysPressed.current['s'] = false}
                            >▼</div>
                            <div className="d-pad-btn d-pad-center"></div>
                        </div>

                        <div className="action-buttons-container">
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
                <div className="modal-overlay">
                    <div className="modal-card pokemon-panel">
                        <div className="modal-header">
                            <h3 className="modal-title">Pixel Tamer Menu</h3>
                            <button onClick={() => setShowMenuModal(false)} className="modal-close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.45)', border: '1px dashed #3e2723', padding: '8px 12px', borderRadius: '4px' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#3e2723' }}>
                                        Tamer: <span style={{ color: '#0288d1' }}>{playerName}</span>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#5d4037', marginTop: '2px' }}>
                                        Nivel: {economy.level}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setNicknameInput(playerName);
                                        setShowEditNicknameModal(true);
                                        setShowMenuModal(false);
                                    }}
                                    className="pokemon-button animate-hover"
                                    style={{ margin: 0, padding: '4px 8px', fontSize: '10px', width: 'auto', background: '#ffe082', border: '1px solid #ffca28', color: '#3e2723', cursor: 'pointer' }}
                                >
                                    ✏️ Editar Nick
                                </button>
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

                            {adHealSelectMode ? (
                                <div style={{ background: 'rgba(235, 255, 235, 0.5)', border: '1px dashed #2e7d32', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2e7d32', marginBottom: '8px', textTransform: 'uppercase' }}>
                                        Selecciona un Pokémon para curar al 100%:
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {team.map((p: any, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSelectPokemonToHeal(idx)}
                                                className="pokemon-button animate-hover"
                                                style={{ margin: 0, padding: '6px 12px', fontSize: '11px', textTransform: 'capitalize', display: 'flex', justifyContent: 'space-between', opacity: p.hp >= p.maxHp ? 0.6 : 1 }}
                                                disabled={p.hp >= p.maxHp}
                                            >
                                                <span>{p.id} (HP: {p.hp}/{p.maxHp})</span>
                                                <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>{p.hp >= p.maxHp ? 'Lleno' : 'Curar'}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleWatchHealAd}
                                    className="pokemon-button animate-hover"
                                    style={{ background: '#e1f5fe', border: '1px solid #0288d1', color: '#0288d1' }}
                                >
                                    💚 Curar 1 Pokémon (Ver Anuncio: {adHealsViewed}/2)
                                </button>
                            )}

                            <button 
                                onClick={handleNurseRevive}
                                className="pokemon-button"
                                style={{ background: '#ffe082' }}
                            >
                                ⚡ Revivir y Curar (Costo: {economy.getReviveCost()} Coins)
                            </button>

                            <PokemonCenterBanner />
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
                            {/* Coins Gratis Row */}
                            <div className="shop-item-row" style={{ background: '#ffe082', border: '1px solid #ffca28', borderRadius: '4px', marginBottom: '12px' }}>
                                <div className="shop-item-info">
                                    <div className="shop-item-name" style={{ color: '#3e2723', fontWeight: 'bold' }}>💎 Coins Gratis (+20 Coins)</div>
                                    <div className="shop-item-desc" style={{ color: '#5d4037', fontSize: '10px' }}>Ver un anuncio patrocinado</div>
                                </div>
                                <button 
                                    onClick={handleWatchFreeCoinsAd}
                                    className="pokemon-button animate-hover"
                                    style={{ margin: 0, padding: '6px 12px', fontSize: '10px', width: 'auto', background: '#ffca28', border: '1px solid #ff8f00', color: '#3e2723' }}
                                >
                                    Ver Ads
                                </button>
                            </div>

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
                            <AdsterraBanner />
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
                    <div className="modal-card pokemon-panel" style={{ maxWidth: '420px', width: '90%' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Mochila (Items)</h3>
                            <button onClick={() => {
                                setShowInventoryModal(false);
                                setUsingItem(null);
                            }} className="modal-close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            {usingItem ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#3e2723', marginBottom: '8px', textAlign: 'center' }}>
                                        Usar {usingItem.name || usingItem.id} en:
                                    </div>
                                    {team.map((p: any, idx: number) => {
                                        const pct = Math.round((p.hp / p.maxHp) * 100);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleApplyItemToPokemon(p, idx)}
                                                className="pokemon-button"
                                                style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center', 
                                                    padding: '8px 12px',
                                                    background: '#efe5fd',
                                                    border: '1px solid #7c4dff',
                                                    marginBottom: '4px'
                                                }}
                                            >
                                                <div style={{ textAlign: 'left' }}>
                                                    <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: '#311b92' }}>{p.id}</span>
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
                                        Cancelar
                                    </button>
                                </div>
                            ) : inventory.getAllItems().length === 0 ? (
                                <div className="inventory-empty">Tu mochila está vacía.</div>
                            ) : (
                                inventory.getAllItems().map((item: any) => {
                                    const isUsable = item.id.includes('potion') || item.id.includes('revive') || item.id === 'evolution_stone';
                                    return (
                                        <div key={item.id} className="shop-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #efebe9' }}>
                                            <div className="shop-item-info" style={{ flex: 1 }}>
                                                <div className="shop-item-name" style={{ fontWeight: 'bold', fontSize: '12px' }}>{item.name || item.id} <span style={{ fontSize: '10px', color: '#757575', marginLeft: '4px' }}>x{item.quantity}</span></div>
                                                <div className="shop-item-desc" style={{ fontSize: '10px', color: '#5d4037' }}>{item.description}</div>
                                            </div>
                                            {isUsable && (
                                                <button
                                                    onClick={() => setUsingItem(item)}
                                                    className="pokemon-button success"
                                                    style={{ width: 'auto', padding: '4px 10px', fontSize: '10px', marginLeft: '12px' }}
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
                                                    <span style={{ textTransform: 'capitalize', fontWeight: 'bold', fontSize: '12px' }}>
                                                        {p.id} <span style={{ fontSize: '9px', color: '#7e57c2', fontWeight: 'normal' }}>(Nvl. {p.level ?? 5})</span>
                                                    </span>
                                                    <span style={{ fontSize: '10px', color: '#5d4037' }}>
                                                        +{dailyIncome} Coins/Día
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        onClick={() => setSelectedInfoPoke(p)}
                                                        className="shop-buy-btn"
                                                        style={{ padding: '4px 8px', fontSize: '10px', background: '#bbdefb', color: '#0d47a1', border: '1px solid #90caf9' }}
                                                    >
                                                        Info
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveToPc(idx)}
                                                        disabled={team.length <= 1}
                                                        className="shop-buy-btn"
                                                        style={{ padding: '4px 8px', fontSize: '10px', opacity: team.length <= 1 ? 0.5 : 1, cursor: team.length <= 1 ? 'not-allowed' : 'pointer' }}
                                                    >
                                                        Mover a PC
                                                    </button>
                                                </div>
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
                                                        <span style={{ textTransform: 'capitalize', fontWeight: 'bold', fontSize: '12px' }}>
                                                            {p.id} <span style={{ fontSize: '9px', color: '#7e57c2', fontWeight: 'normal' }}>(Nvl. {p.level ?? 5})</span>
                                                        </span>
                                                        <span style={{ fontSize: '10px', color: '#5d4037' }}>
                                                            +{dailyIncome} Coins/Día
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button
                                                            onClick={() => setSelectedInfoPoke(p)}
                                                            className="shop-buy-btn"
                                                            style={{ padding: '4px 8px', fontSize: '10px', background: '#bbdefb', color: '#0d47a1', border: '1px solid #90caf9' }}
                                                        >
                                                            Info
                                                        </button>
                                                        <button
                                                            onClick={() => handleMoveToTeam(idx)}
                                                            disabled={team.length >= 6}
                                                            className="shop-buy-btn"
                                                            style={{ padding: '4px 8px', fontSize: '10px', opacity: team.length >= 6 ? 0.5 : 1, cursor: team.length >= 6 ? 'not-allowed' : 'pointer' }}
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
                                className="pokemon-button danger"
                                style={{ width: '100%', marginTop: '8px' }}
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
                const currentMoves = getPokemonMoves(p.id, p.level ?? 5);
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

                    {/* Battle Dialog Log */}
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
                        {battleMessage}
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
                                    const activePokeMoves = getPokemonMoves(activePoke.id, activePoke.level ?? 1);
                                    return activePokeMoves.map((moveId) => {
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
                    ) : !showBallSelect ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                            <button 
                                onClick={handleBattleAttack}
                                className="pokemon-button success"
                                style={{ background: '#d32f2f', color: '#fff', gridColumn: 'span 2', margin: 0, padding: '10px' }}
                                disabled={!team.some((p: any) => p.hp > 0)}
                            >
                                ⚔️ Luchar (Atacar)
                            </button>
                            <button 
                                onClick={() => setShowBallSelect(true)}
                                className="pokemon-button"
                                style={{ background: '#ffe082', margin: 0, padding: '8px', fontSize: '10px' }}
                            >
                                🎒 Capturar
                            </button>
                            <button 
                                onClick={handleBattleRun}
                                className="pokemon-button danger"
                                style={{ margin: 0, padding: '8px', fontSize: '10px' }}
                            >
                                🏃 Huir
                            </button>
                        </div>
                    ) : (
                        /* Ball Selection */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                {['pokeball', 'great_ball', 'ultra_ball', 'master_ball'].map((ballId) => {
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
                                            <span>🔴 {label.split(' ')[0]}</span>
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
                <div className="modal-overlay" style={{ zIndex: 300 }}>
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
                        style={{ padding: '8px 16px', fontSize: '12px' }}
                    >
                        ⚔️ Desafiar
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setPlayerContextMenu(null); }}
                        style={{ background: '#eee', color: '#333', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px', fontSize: '10px', cursor: 'pointer' }}
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {incomingPvPInvite && (
                <div className="modal-overlay" style={{ zIndex: 300 }}>
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
                <div className="modal-overlay" style={{ zIndex: 300 }}>
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
                    <div className="modal-content" style={{ width: '90%', maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>🏆 Ranking Global PvP 🏆</h2>
                            <button className="close-button" onClick={() => setShowLeaderboard(false)}>×</button>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '10px' }}>
                            {!pvpLeaderboard ? <p>Cargando...</p> : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ background: '#fbc02d', color: '#000' }}>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>#</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Nick</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>V</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>D</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pvpLeaderboard.map((p, i) => (
                                            <tr key={p.address} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9', color: '#333' }}>
                                                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{i + 1}</td>
                                                <td style={{ padding: '8px', border: '1px solid #ddd' }} title={p.name}>
                                                    {p.name.length > 10 ? p.name.slice(0, 10) + '...' : p.name}
                                                </td>
                                                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', color: '#2e7d32', fontWeight: 'bold' }}>{p.wins}</td>
                                                <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', color: '#c62828' }}>{p.losses}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activePvPBattle && (
                <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.9)', zIndex: 400 }}>
                    <div className="modal-content pokemon-battle-modal" style={{ height: '85vh', maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                        
                        <div className="modal-header" style={{ padding: '10px', background: '#3e2723', color: '#fff' }}>
                            <h2 style={{ margin: 0, fontSize: '16px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>⚔️ PvP vs {activePvPBattle.opponentName}</span>
                                {activePvPBattle.status === 'win' && <span style={{ color: '#4caf50' }}>¡VICTORIA!</span>}
                                {activePvPBattle.status === 'loss' && <span style={{ color: '#f44336' }}>¡DERROTA!</span>}
                            </h2>
                        </div>

                        {activePvPBattle.status === 'syncing' ? (
                            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px' }}>
                                Sincronizando batalla...
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between', padding: '0', position: 'relative' }}>
                                
                                {/* Opponent */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px', background: '#e0e0e0', borderBottom: '2px solid #ccc' }}>
                                    <div className="pokemon-panel" style={{ width: '50%' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'capitalize' }}>{activePvPBattle.opponentPokemon?.id || '?'}</div>
                                        <div style={{ fontSize: '10px' }}>Lvl {activePvPBattle.opponentPokemon?.level || '?'}</div>
                                        <div className="pokemon-hp-bar" style={{ width: '100%' }}>
                                            <div className="hp-fill" style={{ width: `${Math.round((activePvPBattle.opponentHp / (activePvPBattle.opponentMaxHp || 1)) * 100)}%` }}></div>
                                        </div>
                                    </div>
                                    <div style={{ width: '45%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '100px' }}>
                                        <img 
                                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonSpeciesList.find((s:any)=>s.name.toLowerCase() === activePvPBattle.opponentPokemon?.id)?.id || 25}.png`} 
                                            alt="Opponent" 
                                            className={opponentSpriteEffect === 'shake' ? 'battle-shake' : opponentSpriteEffect === 'flash' ? 'battle-flash' : ''}
                                            style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                                        />
                                        {floatingDamage && floatingDamage.target === 'opponent' && (
                                            <div className="floating-damage-num" style={{ top: '10px', left: '30%' }}>{floatingDamage.value}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Player */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '10px', background: '#f5f5f5', borderTop: '2px solid #ccc' }}>
                                    <div style={{ width: '45%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', height: '100px' }}>
                                        <img 
                                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${pokemonSpeciesList.find((s:any)=>s.name.toLowerCase() === team.find((p:any)=>p.hp>0)?.id)?.id || 25}.png`} 
                                            alt="Player" 
                                            className={playerSpriteEffect === 'bounce' ? 'battle-bounce' : playerSpriteEffect === 'shake' ? 'battle-shake' : ''}
                                            style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                                        />
                                        {floatingDamage && floatingDamage.target === 'player' && (
                                            <div className="floating-damage-num" style={{ top: '10px', left: '30%' }}>{floatingDamage.value}</div>
                                        )}
                                    </div>
                                    <div className="pokemon-panel" style={{ width: '50%' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'capitalize' }}>{team.find((p:any)=>p.hp>0)?.id}</div>
                                        <div style={{ fontSize: '10px' }}>Lvl {team.find((p:any)=>p.hp>0)?.level}</div>
                                        <div className="pokemon-hp-bar" style={{ width: '100%' }}>
                                            <div className="hp-fill" style={{ width: `${Math.round((activePvPBattle.myHp / (team.find((p:any)=>p.hp>0)?.maxHp || 1)) * 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div style={{ background: '#fff', padding: '10px', borderTop: '4px solid #333' }}>
                                    {activePvPBattle.status === 'battle' ? (
                                        <>
                                            <div style={{ textAlign: 'center', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: activePvPBattle.turn === walletAddress ? '#2e7d32' : '#c62828' }}>
                                                {activePvPBattle.turn === walletAddress ? `⏳ Tu turno (${pvpTurnTimer}s)` : `⏳ Turno del oponente (${pvpTurnTimer}s)`}
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
                                                {(() => {
                                                    const activePoke = team.find(p => p.hp > 0);
                                                    if (!activePoke) return null;
                                                    const moves = typeof window !== 'undefined' && (window as any).POKEMON_MOVESET ? (window as any).POKEMON_MOVESET[activePoke.id] || [] : [];
                                                    return moves.map((m: any, idx: number) => {
                                                        const tc = typeof window !== 'undefined' && (window as any).TYPE_COLORS ? (window as any).TYPE_COLORS : {};
                                                        return (
                                                            <button 
                                                                key={idx}
                                                                className="pokemon-button animate-hover"
                                                                onClick={() => handleExecutePvPMove(m.id)}
                                                                disabled={activePvPBattle.turn !== walletAddress}
                                                                style={{ 
                                                                    background: tc[m.type] || '#a8a878',
                                                                    color: m.type === 'electric' ? '#3e2723' : '#fff',
                                                                    height: '38px', padding: '4px', margin: 0, fontSize: '11px', fontWeight: 'bold',
                                                                    opacity: activePvPBattle.turn !== walletAddress ? 0.5 : 1
                                                                }}
                                                            >
                                                                {m.name}
                                                            </button>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </>
                                    ) : (
                                        <button 
                                            className="pokemon-button"
                                            onClick={() => {
                                                if (activePvPBattle.status === 'win') {
                                                    economyRef.current.pvp_wins = (economyRef.current.pvp_wins || 0) + 1;
                                                    economyRef.current.addCoins(200);
                                                    showNotification("¡Ganaste!", "¡Ganaste el duelo y te llevas 200 Coins!");
                                                } else if (activePvPBattle.status === 'loss') {
                                                    economyRef.current.pvp_losses = (economyRef.current.pvp_losses || 0) + 1;
                                                    showNotification("Derrota", "Perdiste el duelo y tu apuesta de 100 Coins.");
                                                }
                                                setEconomy(new Economy(economyRef.current.toSaveData()));
                                                saveLocalEconomy();
                                                setActivePvPBattle(null);
                                            }}
                                        >
                                            Finalizar
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

