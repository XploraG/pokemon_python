import { Inventory } from './Inventory';
import { Economy } from './Economy';
import pokemonSpeciesList from '../../public/assets/economy/pokemon_species.json';

export interface IngredientRequirement {
    id: string;
    quantity: number;
}

export interface CraftingRecipe {
    id: string;
    name: string;
    tier: 2 | 3;
    emoji: string;
    cost: number;
    ingredients: IngredientRequirement[];
    description: string;
    yieldsId?: string; // Optional: specify if it crafts a different item ID (e.g. for alternative recipes)
}

export const CRAFTING_RECIPES: Record<string, CraftingRecipe> = {
    // ---- TIER 2 RECIPES (BASIC UTILITIES & INTERMEDIATES) ----
    "apricorn_paste": {
        "id": "apricorn_paste",
        "name": "Pasta de Bonguri",
        "tier": 2,
        "emoji": "🥣",
        "cost": 100,
        "ingredients": [
            { "id": "apricorn_red", "quantity": 1 },
            { "id": "apricorn_blue", "quantity": 1 }
        ],
        "description": "Pasta de Bonguris usada como aglutinante para esferas avanzadas."
    },
    "fossil_dna_helix": {
        "id": "fossil_dna_helix",
        "name": "ADN de Fósil (Hélix)",
        "tier": 2,
        "emoji": "🧬",
        "cost": 500,
        "ingredients": [
            { "id": "fossil_helix", "quantity": 1 },
            { "id": "magic_dust", "quantity": 5 }
        ],
        "description": "Extrae ADN de Fósil Hélix.",
        "yieldsId": "fossil_dna"
    },
    "fossil_dna_dome": {
        "id": "fossil_dna_dome",
        "name": "ADN de Fósil (Domo)",
        "tier": 2,
        "emoji": "🧬",
        "cost": 500,
        "ingredients": [
            { "id": "fossil_dome", "quantity": 1 },
            { "id": "magic_dust", "quantity": 5 }
        ],
        "description": "Extrae ADN de Fósil Domo.",
        "yieldsId": "fossil_dna"
    },
    "super_potion": {
        "id": "super_potion",
        "name": "Super Poción",
        "tier": 2,
        "emoji": "🥤",
        "cost": 100,
        "ingredients": [
            { "id": "potion", "quantity": 2 },
            { "id": "magic_dust", "quantity": 3 }
        ],
        "description": "Restaura 50 HP de un Pokémon."
    },
    "stardust_potion": {
        "id": "stardust_potion",
        "name": "Poción Estelar",
        "tier": 2,
        "emoji": "🧪",
        "cost": 250,
        "ingredients": [
            { "id": "potion", "quantity": 2 },
            { "id": "stardust", "quantity": 3 }
        ],
        "description": "Medicina infundida con Polvo Estelar. Restaura 80 HP."
    },
    "super_ball": {
        "id": "super_ball",
        "name": "Super Ball",
        "tier": 2,
        "emoji": "🔵",
        "cost": 200,
        "ingredients": [
            { "id": "tamer_ball", "quantity": 2 },
            { "id": "iron_ore", "quantity": 3 }
        ],
        "description": "Esfera mejorada con 50% de probabilidad de captura."
    },
    "heavy_ball": {
        "id": "heavy_ball",
        "name": "Peso Ball",
        "tier": 2,
        "emoji": "🔘",
        "cost": 150,
        "ingredients": [
            { "id": "tamer_ball", "quantity": 2 },
            { "id": "apricorn_black", "quantity": 2 }
        ],
        "description": "Esfera pesada con 60% de captura para criaturas densas."
    },
    "lure_ball": {
        "id": "lure_ball",
        "name": "Cebo Ball",
        "tier": 2,
        "emoji": "🌊",
        "cost": 150,
        "ingredients": [
            { "id": "tamer_ball", "quantity": 2 },
            { "id": "apricorn_blue", "quantity": 2 }
        ],
        "description": "Esfera cebo con 60% de captura para criaturas de agua/húmedas."
    },
    "evolution_stone": {
        "id": "evolution_stone",
        "name": "Piedra Evolución",
        "tier": 2,
        "emoji": "🪨",
        "cost": 500,
        "ingredients": [
            { "id": "magic_dust", "quantity": 5 },
            { "id": "iron_ore", "quantity": 3 }
        ],
        "description": "Piedra evolutiva base para transformaciones de Pokémon."
    },
    "fire_stone": {
        "id": "fire_stone",
        "name": "Piedra Fuego",
        "tier": 2,
        "emoji": "🔥",
        "cost": 300,
        "ingredients": [
            { "id": "evolution_stone", "quantity": 1 },
            { "id": "fire_essence", "quantity": 3 }
        ],
        "description": "Evoluciona a Pokémon de tipo Fuego (ej. Eevee -> Flareon)."
    },
    "water_stone": {
        "id": "water_stone",
        "name": "Piedra Agua",
        "tier": 2,
        "emoji": "💧",
        "cost": 300,
        "ingredients": [
            { "id": "evolution_stone", "quantity": 1 },
            { "id": "water_essence", "quantity": 3 }
        ],
        "description": "Evoluciona a Pokémon de tipo Agua (ej. Eevee -> Vaporeon)."
    },
    "thunder_stone": {
        "id": "thunder_stone",
        "name": "Piedra Trueno",
        "tier": 2,
        "emoji": "⚡",
        "cost": 300,
        "ingredients": [
            { "id": "evolution_stone", "quantity": 1 },
            { "id": "thunder_essence", "quantity": 3 }
        ],
        "description": "Evoluciona a Pokémon de tipo Eléctrico (ej. Pikachu -> Raichu)."
    },
    "leaf_stone": {
        "id": "leaf_stone",
        "name": "Piedra Hoja",
        "tier": 2,
        "emoji": "🍃",
        "cost": 300,
        "ingredients": [
            { "id": "evolution_stone", "quantity": 1 },
            { "id": "leaf_essence", "quantity": 3 }
        ],
        "description": "Evoluciona a Pokémon de tipo Planta (ej. Gloom -> Vileplume)."
    },
    "moon_stone": {
        "id": "moon_stone",
        "name": "Piedra Lunar",
        "tier": 2,
        "emoji": "🌙",
        "cost": 300,
        "ingredients": [
            { "id": "evolution_stone", "quantity": 1 },
            { "id": "moon_essence", "quantity": 3 }
        ],
        "description": "Evoluciona a Pokémon tipo Lunar/Hada (ej. Clefairy -> Clefable)."
    },
    "revive": {
        "id": "revive",
        "name": "Revivir",
        "tier": 2,
        "emoji": "✨",
        "cost": 400,
        "ingredients": [
            { "id": "super_potion", "quantity": 2 },
            { "id": "magic_dust", "quantity": 4 }
        ],
        "description": "Revive a un Pokémon debilitado con 50% de HP."
    },
    "repel": {
        "id": "repel",
        "name": "Repelente",
        "tier": 2,
        "emoji": "💨",
        "cost": 100,
        "ingredients": [
            { "id": "magic_dust", "quantity": 5 },
            { "id": "iron_ore", "quantity": 2 }
        ],
        "description": "Evita encuentros salvajes por 5 minutos."
    },

    // ---- TIER 3 RECIPES (MASTERPIECES MADE FROM TIER 2) ----
    "ultra_ball": {
        "id": "ultra_ball",
        "name": "Ultra Ball",
        "tier": 3,
        "emoji": "🟡",
        "cost": 800,
        "ingredients": [
            { "id": "super_ball", "quantity": 3 },
            { "id": "apricorn_paste", "quantity": 2 },
            { "id": "tamer_seal", "quantity": 3 }
        ],
        "description": "Esfera avanzada con 75% de probabilidad de captura."
    },
    "hyper_potion": {
        "id": "hyper_potion",
        "name": "Hiper Poción",
        "tier": 3,
        "emoji": "🥤",
        "cost": 500,
        "ingredients": [
            { "id": "super_potion", "quantity": 2 },
            { "id": "stardust_potion", "quantity": 1 },
            { "id": "magic_dust", "quantity": 5 }
        ],
        "description": "Restaura 120 HP de un Pokémon."
    },
    "max_revive": {
        "id": "max_revive",
        "name": "Max Revivir",
        "tier": 3,
        "emoji": "🌟",
        "cost": 2000,
        "ingredients": [
            { "id": "revive", "quantity": 2 },
            { "id": "stardust_potion", "quantity": 1 },
            { "id": "magic_dust", "quantity": 10 }
        ],
        "description": "Revive a un Pokémon con 100% de HP."
    },
    "master_ball": {
        "id": "master_ball",
        "name": "Master Ball",
        "tier": 3,
        "emoji": "🔮",
        "cost": 5000,
        "ingredients": [
            { "id": "heavy_ball", "quantity": 3 },
            { "id": "ultra_ball", "quantity": 2 },
            { "id": "ancient_amber", "quantity": 1 }
        ],
        "description": "Captura 100% garantizada de cualquier Pokémon."
    },
    "gold_incense": {
        "id": "gold_incense",
        "name": "Incienso de Oro",
        "tier": 3,
        "emoji": "🏺",
        "cost": 3000,
        "ingredients": [
            { "id": "repel", "quantity": 2 },
            { "id": "golden_shard", "quantity": 2 },
            { "id": "stardust", "quantity": 10 }
        ],
        "description": "x2 monedas en batallas durante 1 hora."
    },
    "lucky_egg": {
        "id": "lucky_egg",
        "name": "Huevo Suerte",
        "tier": 3,
        "emoji": "🥚",
        "cost": 4000,
        "ingredients": [
            { "id": "evolution_stone", "quantity": 2 },
            { "id": "golden_shard", "quantity": 2 },
            { "id": "magic_dust", "quantity": 10 }
        ],
        "description": "x2 XP de Entrenador durante 1 hora."
    },
    "shiny_charm": {
        "id": "shiny_charm",
        "name": "Amuleto Iris (Shiny)",
        "tier": 3,
        "emoji": "🧿",
        "cost": 8000,
        "ingredients": [
            { "id": "lucky_egg", "quantity": 1 },
            { "id": "evolution_stone", "quantity": 1 },
            { "id": "golden_shard", "quantity": 3 },
            { "id": "ancient_amber", "quantity": 1 }
        ],
        "description": "¡Multiplica x3 las probabilidades de encontrar Pokémon Variocolor (Shiny)!"
    },
    "gold_ticket": {
        "id": "gold_ticket",
        "name": "Tique de Oro (RMT)",
        "tier": 3,
        "emoji": "🎫",
        "cost": 5000,
        "ingredients": [
            { "id": "fossil_dna", "quantity": 2 },
            { "id": "golden_shard", "quantity": 3 }
        ],
        "description": "Cupón de RMT. ¡Canjéalo en el taller por 1 pUSDT!"
    },
    "elixir_attack": {
        "id": "elixir_attack",
        "name": "Elíxir de Furia",
        "tier": 3,
        "emoji": "🧪",
        "cost": 2500,
        "ingredients": [
            { "id": "fire_essence", "quantity": 3 },
            { "id": "magic_dust", "quantity": 10 },
            { "id": "stardust", "quantity": 5 }
        ],
        "description": "+30% de Ataque durante 1 hora."
    },
    "elixir_defense": {
        "id": "elixir_defense",
        "name": "Elíxir de Coraza",
        "tier": 3,
        "emoji": "🛡️",
        "cost": 2500,
        "ingredients": [
            { "id": "water_essence", "quantity": 3 },
            { "id": "magic_dust", "quantity": 10 },
            { "id": "stardust", "quantity": 5 }
        ],
        "description": "+30% de Defensa durante 1 hora."
    },
    "elixir_hp": {
        "id": "elixir_hp",
        "name": "Elíxir de Vitalidad",
        "tier": 3,
        "emoji": "💖",
        "cost": 2500,
        "ingredients": [
            { "id": "leaf_essence", "quantity": 3 },
            { "id": "magic_dust", "quantity": 10 },
            { "id": "stardust", "quantity": 5 }
        ],
        "description": "+30% de PS Máximos durante 1 hora."
    }
};

export interface RolledDrop {
    id: string;
    name: string;
    quantity: number;
}

export class CraftingManager {
    public static canCraft(inventory: Inventory, coins: number, recipeId: string): { allowed: boolean; reason?: string } {
        const recipe = CRAFTING_RECIPES[recipeId];
        if (!recipe) {
            return { allowed: false, reason: "Receta no encontrada." };
        }

        if (coins < recipe.cost) {
            return { allowed: false, reason: `Monedas insuficientes (necesitas ${recipe.cost} Coins).` };
        }

        for (const req of recipe.ingredients) {
            if (!inventory.hasItem(req.id, req.quantity)) {
                const info = inventory.getItemInfo(req.id);
                const itemName = info.name || req.id;
                const owned = inventory.getQuantity(req.id);
                return { 
                    allowed: false, 
                    reason: `Faltan ingredientes para ${recipe.name}: necesitas ${req.quantity}x ${itemName} (tienes ${owned}x).` 
                };
            }
        }

        return { allowed: true };
    }

    public static craft(inventory: Inventory, economy: Economy, recipeId: string): { success: boolean; error?: string } {
        const check = this.canCraft(inventory, economy.coins, recipeId);
        if (!check.allowed) {
            return { success: false, error: check.reason };
        }

        const recipe = CRAFTING_RECIPES[recipeId];

        // Deduct Coins
        economy.spendCoins(recipe.cost, 'crafting', `Crafted ${recipe.name}`);

        // Deduct Ingredients
        for (const req of recipe.ingredients) {
            inventory.removeItem(req.id, req.quantity);
        }

        // Add crafted item (check if yields a different ID, e.g. yields fossil_dna from helix or dome fossil)
        const targetItemId = recipe.yieldsId || recipeId;
        inventory.addItem(targetItemId, 1);

        return { success: true };
    }

    /**
     * Map Pokémon species/types to elemental essences
     */
    private static getEssenceForTypes(types: string[]): string {
        const primary = (types[0] || '').toLowerCase();
        if (primary === 'fire') return 'fire_essence';
        if (primary === 'water' || primary === 'ice') return 'water_essence';
        if (primary === 'electric') return 'thunder_essence';
        if (primary === 'grass' || primary === 'bug') return 'leaf_essence';
        if (primary === 'psychic' || primary === 'ghost' || primary === 'fairy' || primary === 'dragon') return 'moon_essence';
        return 'magic_dust'; // Fallback to magic dust if no type match
    }

    /**
     * Roll drops after battle victories and update inventory
     */
    public static rollBattleDrops(
        battleType: 'wild' | 'trainer' | 'gym',
        opponentName: string,
        opponentLevel: number,
        gymIndex: number,
        inventory: Inventory
    ): RolledDrop[] {
        const drops: RolledDrop[] = [];

        const addDrop = (itemId: string, qty: number) => {
            if (qty <= 0) return;
            inventory.addItem(itemId, qty);
            const info = inventory.getItemInfo(itemId);
            drops.push({
                id: itemId,
                name: info.name || itemId,
                quantity: qty
            });
        };

        if (battleType === 'wild') {
            // Wild battle drops
            // 40% magic_dust (1-2x)
            if (Math.random() < 0.40) {
                const qty = Math.random() < 0.3 ? 2 : 1;
                addDrop('magic_dust', qty);
            }
            // 25% iron_ore (1x)
            if (Math.random() < 0.25) {
                addDrop('iron_ore', 1);
            }
            // 15% stardust (1x)
            if (Math.random() < 0.15) {
                addDrop('stardust', 1);
            }
            // 25% Apricorn (Red, Blue, or Black)
            if (Math.random() < 0.25) {
                const apricorns = ['apricorn_red', 'apricorn_blue', 'apricorn_black'];
                const selectedApricorn = apricorns[Math.floor(Math.random() * apricorns.length)];
                addDrop(selectedApricorn, 1);
            }
            // 15% elemental essence based on type
            const spec = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === opponentName.toLowerCase());
            const types = spec ? spec.types : [];
            if (types.length > 0 && Math.random() < 0.15) {
                const essence = this.getEssenceForTypes(types);
                addDrop(essence, 1);
            }
            // 1% golden_shard
            if (Math.random() < 0.01) {
                addDrop('golden_shard', 1);
            }
        } else if (battleType === 'trainer') {
            // Trainer battle drops
            // 100% magic_dust (1-3x)
            const dustQty = Math.floor(Math.random() * 3) + 1;
            addDrop('magic_dust', dustQty);

            // 50% iron_ore (1-2x)
            if (Math.random() < 0.50) {
                const ironQty = Math.random() < 0.3 ? 2 : 1;
                addDrop('iron_ore', ironQty);
            }
            // 30% stardust (1x)
            if (Math.random() < 0.30) {
                addDrop('stardust', 1);
            }
            // 20% tamer_seal
            if (Math.random() < 0.20) {
                addDrop('tamer_seal', 1);
            }
            // 3% golden_shard
            if (Math.random() < 0.03) {
                addDrop('golden_shard', 1);
            }
        } else if (battleType === 'gym') {
            // Gym battle drops
            // 100% ancient_amber (1x)
            addDrop('ancient_amber', 1);

            // 100% Fossil (50% Helix, 50% Dome)
            const fossilId = Math.random() < 0.5 ? 'fossil_helix' : 'fossil_dome';
            addDrop(fossilId, 1);

            // 100% tamer_seal (1-2x)
            const sealQty = Math.random() < 0.5 ? 2 : 1;
            addDrop('tamer_seal', sealQty);

            // 100% elemental essence (5x) based on leader's type
            let gymEssence = 'magic_dust';
            if (gymIndex === 1) gymEssence = 'iron_ore'; // Brock
            else if (gymIndex === 2) gymEssence = 'water_essence'; // Misty
            else if (gymIndex === 3) gymEssence = 'thunder_essence'; // Lt. Surge
            else if (gymIndex === 4) gymEssence = 'leaf_essence'; // Erika
            else if (gymIndex === 5) gymEssence = 'magic_dust'; // Koga
            else if (gymIndex === 6) gymEssence = 'moon_essence'; // Sabrina
            else if (gymIndex === 7) gymEssence = 'fire_essence'; // Blaine
            else if (gymIndex === 8) gymEssence = 'moon_essence'; // Giovanni
            else {
                const essences = ['fire_essence', 'water_essence', 'thunder_essence', 'leaf_essence', 'moon_essence'];
                gymEssence = essences[(gymIndex - 9) % essences.length];
            }
            addDrop(gymEssence, 5);

            // 20% golden_shard
            if (Math.random() < 0.20) {
                addDrop('golden_shard', 1);
            }
        }

        return drops;
    }
}
