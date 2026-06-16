import economyConfig from '../../public/assets/economy/config.json';
import trainerRewards from '../../public/assets/economy/trainer_rewards.json';
import gymRewards from '../../public/assets/economy/gym_rewards.json';
import passiveRates from '../../public/assets/economy/passive_rates.json';
import loginRewards from '../../public/assets/economy/login_rewards.json';
import dailyMissions from '../../public/assets/economy/daily_missions.json';
import weeklyMissions from '../../public/assets/economy/weekly_missions.json';
import pokemonSpeciesList from '../../public/assets/economy/pokemon_species.json';

export interface EconomySaveData {
    coins?: number;
    pusdt?: number;
    medals?: string[];
    login_streak?: number;
    last_login_date?: string;
    last_passive_claim?: string;
    defeated_gyms?: Record<string, number>;
    trainer_cooldowns?: Record<string, number>;
    gym_cooldowns?: Record<string, number>;
    daily_missions_progress?: Record<string, number>;
    total_coins_earned?: number;
    achievements_unlocked?: string[];
    level?: number;
    xp?: number;
    heals_today?: number;
    last_heal_date?: string;
    pvp_wins?: number;
    pvp_losses?: number;
    ads_viewed_today?: number;
    last_ad_date?: string;
    last_pvp_loss_time?: number;
    pvp_cooldown_duration?: number;
    equipped_medals?: string[];
    medal_levels?: Record<string, number>;
    tournament_medals?: string[];
    in_pvp_battle?: boolean;
    transaction_history?: CoinTransaction[];
    claimed_missions?: Record<string, boolean>;
    weekly_missions_progress?: Record<string, number>;
    claimed_weekly_missions?: Record<string, boolean>;
    last_weekly_reset_date?: string;
    gold_incense_expires?: number;
    repel_expires?: number;
}

export interface CoinTransaction {
    type: 'income' | 'expense';
    amount: number;
    source: string;
    details?: string;
    timestamp: number;
}

export class Economy {
    public coins: number = 500;
    public pusdt: number = 0.0;
    public medals: string[] = [];
    public login_streak: number = 0;
    public last_login_date: string = '';
    public last_passive_claim: string = '';
    public defeated_gyms: Record<string, number> = {};
    public trainer_cooldowns: Record<string, number> = {};
    public gym_cooldowns: Record<string, number> = {};
    public daily_missions_progress: Record<string, number> = {};
    public total_coins_earned: number = 0;
    public achievements_unlocked: string[] = [];
    public level: number = 1;
    public xp: number = 0;
    public heals_today: number = 0;
    public last_heal_date: string = '';
    public pvp_wins: number = 0;
    public pvp_losses: number = 0;
    public ads_viewed_today: number = 0;
    public last_ad_date: string = '';
    public last_pvp_loss_time: number = 0;
    public pvp_cooldown_duration: number = 0;
    public equipped_medals: string[] = [];
    public medal_levels: Record<string, number> = {};
    public tournament_medals: string[] = [];
    public in_pvp_battle: boolean = false;
    public transaction_history: CoinTransaction[] = [];
    public claimed_missions: Record<string, boolean> = {};
    public weekly_missions_progress: Record<string, number> = {};
    public claimed_weekly_missions: Record<string, boolean> = {};
    public last_weekly_reset_date: string = '';
    public gold_incense_expires: number = 0;
    public repel_expires: number = 0;

    constructor(saveData?: EconomySaveData) {
        if (saveData) {
            this.loadFromSave(saveData);
        } else {
            this.initializeDefaults();
        }
    }

    private initializeDefaults(): void {
        this.coins = economyConfig.starting_coins ?? 500;
        this.pusdt = 0.0;
        this.medals = [];
        this.login_streak = 0;
        this.last_login_date = '';
        this.last_passive_claim = '';
        this.defeated_gyms = {};
        this.trainer_cooldowns = {};
        this.gym_cooldowns = {};
        this.daily_missions_progress = {};
        this.total_coins_earned = 0;
        this.achievements_unlocked = [];
        this.level = 1;
        this.xp = 0;
        this.heals_today = 0;
        this.last_heal_date = '';
        this.pvp_wins = 0;
        this.pvp_losses = 0;
        this.ads_viewed_today = 0;
        this.last_ad_date = '';
        this.last_pvp_loss_time = 0;
        this.pvp_cooldown_duration = 0;
        this.equipped_medals = [];
        this.medal_levels = {};
        this.tournament_medals = [];
        this.in_pvp_battle = false;
        this.weekly_missions_progress = {};
        this.claimed_weekly_missions = {};
        this.last_weekly_reset_date = '';
        this.gold_incense_expires = 0;
        this.repel_expires = 0;
    }

    private loadFromSave(data: EconomySaveData): void {
        this.coins = data.coins ?? economyConfig.starting_coins ?? 500;
        this.pusdt = data.pusdt ?? 0.0;
        this.medals = data.medals ?? [];
        this.login_streak = data.login_streak ?? 0;
        this.last_login_date = data.last_login_date ?? '';
        this.last_passive_claim = data.last_passive_claim ?? '';
        this.defeated_gyms = data.defeated_gyms ?? {};
        this.trainer_cooldowns = data.trainer_cooldowns ?? {};
        this.gym_cooldowns = data.gym_cooldowns ?? {};
        this.daily_missions_progress = data.daily_missions_progress ?? {};
        this.total_coins_earned = data.total_coins_earned ?? 0;
        this.achievements_unlocked = data.achievements_unlocked ?? [];
        this.level = data.level ?? 1;
        this.xp = data.xp ?? 0;
        this.heals_today = data.heals_today ?? 0;
        this.last_heal_date = data.last_heal_date ?? '';
        this.pvp_wins = data.pvp_wins ?? 0;
        this.pvp_losses = data.pvp_losses ?? 0;
        this.ads_viewed_today = data.ads_viewed_today ?? 0;
        this.last_ad_date = data.last_ad_date ?? '';
        this.last_pvp_loss_time = data.last_pvp_loss_time ?? 0;
        this.pvp_cooldown_duration = data.pvp_cooldown_duration ?? 0;
        this.equipped_medals = data.equipped_medals ?? [];
        this.medal_levels = data.medal_levels ?? {};
        this.tournament_medals = data.tournament_medals ?? [];
        this.in_pvp_battle = data.in_pvp_battle ?? false;
        this.transaction_history = data.transaction_history ?? [];
        this.claimed_missions = data.claimed_missions ?? {};
        this.weekly_missions_progress = data.weekly_missions_progress ?? {};
        this.claimed_weekly_missions = data.claimed_weekly_missions ?? {};
        this.last_weekly_reset_date = data.last_weekly_reset_date ?? '';
        this.gold_incense_expires = data.gold_incense_expires ?? 0;
        this.repel_expires = data.repel_expires ?? 0;
        for (const medal of this.medals) {
            if (!this.medal_levels[medal]) {
                this.medal_levels[medal] = 1;
            }
        }
    }

    public toSaveData(): EconomySaveData {
        return {
            coins: this.coins,
            pusdt: this.pusdt,
            medals: this.medals,
            login_streak: this.login_streak,
            last_login_date: this.last_login_date,
            last_passive_claim: this.last_passive_claim,
            defeated_gyms: this.defeated_gyms,
            trainer_cooldowns: this.trainer_cooldowns,
            gym_cooldowns: this.gym_cooldowns,
            daily_missions_progress: this.daily_missions_progress,
            total_coins_earned: this.total_coins_earned,
            achievements_unlocked: this.achievements_unlocked,
            level: this.level,
            xp: this.xp,
            heals_today: this.heals_today,
            last_heal_date: this.last_heal_date,
            pvp_wins: this.pvp_wins,
            pvp_losses: this.pvp_losses,
            ads_viewed_today: this.ads_viewed_today,
            last_ad_date: this.last_ad_date,
            last_pvp_loss_time: this.last_pvp_loss_time,
            pvp_cooldown_duration: this.pvp_cooldown_duration,
            equipped_medals: this.equipped_medals,
            medal_levels: this.medal_levels,
            tournament_medals: this.tournament_medals,
            in_pvp_battle: this.in_pvp_battle,
            transaction_history: this.transaction_history,
            claimed_missions: this.claimed_missions,
            weekly_missions_progress: this.weekly_missions_progress,
            claimed_weekly_missions: this.claimed_weekly_missions,
            last_weekly_reset_date: this.last_weekly_reset_date,
            gold_incense_expires: this.gold_incense_expires,
            repel_expires: this.repel_expires
        };
    }

    // ---- COIN OPERATIONS ----

    public addCoins(amount: number, source: string = 'unknown', details?: string): number {
        let finalAmount = amount;
        if (['trainer_victory', 'wild_victory', 'pvp_victory'].includes(source)) {
            if (this.gold_incense_expires && Date.now() < this.gold_incense_expires) {
                finalAmount = amount * 2;
                details = details ? `${details} (x2 Incienso de Oro)` : ' (x2 Incienso de Oro)';
            }
        }
        this.coins += finalAmount;
        this.total_coins_earned += finalAmount;
        this.logTransaction('income', finalAmount, source, details);
        return this.coins;
    }

    public spendCoins(amount: number, source: string = 'unknown', details?: string): boolean {
        if (this.coins >= amount) {
            this.coins -= amount;
            this.logTransaction('expense', amount, source, details);
            return true;
        }
        return false;
    }

    private logTransaction(type: 'income' | 'expense', amount: number, source: string, details?: string): void {
        if (!this.transaction_history) {
            this.transaction_history = [];
        }
        this.transaction_history.push({
            type,
            amount,
            source,
            details,
            timestamp: Date.now()
        });

        // Limit transaction log history length to avoid bloated files
        if (this.transaction_history.length > 200) {
            this.transaction_history.shift();
        }
    }

    public spendPusdt(amount: number): boolean {
        if (this.pusdt >= amount) {
            this.pusdt -= amount;
            return true;
        }
        return false;
    }

    public convertToPusdt(coinAmount: number): number {
        const rate = economyConfig.coins_to_pusdt_rate ?? 10000;
        if (coinAmount < rate || this.coins < coinAmount) {
            return 0.0;
        }
        // Only convert full units
        const units = Math.floor(coinAmount / rate);
        const actualCost = units * rate;
        if (this.spendCoins(actualCost, 'convertToPusdt', `Converted to ${units} pUSDT`)) {
            const pusdtEarned = units;
            this.pusdt += pusdtEarned;
            return pusdtEarned;
        }
        return 0.0;
    }

    // ---- TRAINER XP & LEVEL SYSTEM ----

    public addTrainerXp(amount: number): { leveledUp: boolean; oldLevel: number; newLevel: number; xpGained: number } {
        const oldLevel = this.level;
        this.xp += amount;
        
        let leveledUp = false;
        let nextLevelXp = this.level * 1000;
        
        while (this.xp >= nextLevelXp) {
            this.xp -= nextLevelXp;
            this.level += 1;
            leveledUp = true;
            nextLevelXp = this.level * 1000;
        }
        
        return {
            leveledUp,
            oldLevel,
            newLevel: this.level,
            xpGained: amount
        };
    }

    // ---- BATTLE REWARDS ----

    public getTrainerReward(difficulty: string, trainerId: string = ''): { coins: number; xpGained: number; leveledUp: boolean; newLevel: number } {
        // Check cooldown
        if (trainerId && this.trainer_cooldowns[trainerId]) {
            const cooldownHours = economyConfig.trainer_rebattle_cooldown_hours ?? 6;
            const lastTime = this.trainer_cooldowns[trainerId];
            if (Date.now() / 1000 - lastTime < cooldownHours * 3600) {
                return { coins: 0, xpGained: 0, leveledUp: false, newLevel: this.level };
            }
        }

        // Get reward range
        const rewardConfig = (trainerRewards as any)[difficulty] || {};
        const minCoins = rewardConfig.min_coins ?? 10;
        const maxCoins = rewardConfig.max_coins ?? 20;
        const coins = Math.floor(Math.random() * (maxCoins - minCoins + 1)) + minCoins;

        // Award coins and update cooldown
        this.addCoins(coins, 'trainer_victory', `Defeated trainer: ${trainerId}`);
        if (trainerId) {
            this.trainer_cooldowns[trainerId] = Date.now() / 1000;
        }

        // Award Trainer XP based on trainer difficulty
        let xpGained = 50;
        if (difficulty === 'pre_intermediate') xpGained = 100;
        else if (difficulty === 'intermediate') xpGained = 150;
        else if (difficulty === 'hard') xpGained = 250;

        const xpResult = this.addTrainerXp(xpGained);

        return {
            coins,
            xpGained,
            leveledUp: xpResult.leveledUp,
            newLevel: xpResult.newLevel
        };
    }

    public getGymCooldownRemaining(gymId: number): number {
        const gymIdStr = String(gymId);
        if (!this.gym_cooldowns[gymIdStr]) return 0;
        const cooldownHours = economyConfig.gym_rebattle_cooldown_hours ?? 24;
        const lastTime = this.gym_cooldowns[gymIdStr];
        const elapsed = Date.now() / 1000 - lastTime;
        const remaining = cooldownHours * 3600 - elapsed;
        return remaining > 0 ? remaining : 0;
    }

    public getGymReward(gymId: number, maxPlayerPokemonLevel?: number): { coins: number; medal: string | null; isFirst: boolean; xpGained: number; leveledUp: boolean; newLevel: number; isOverleveled: boolean } {
        const gymIdStr = String(gymId);

        // Determine leader level to check overleveling
        const gymLevels = [12, 22, 32, 42, 52, 62, 72, 82];
        const leaderLevel = gymId <= 8 ? gymLevels[gymId - 1] : gymId * 10;
        const isOverleveled = maxPlayerPokemonLevel !== undefined && (maxPlayerPokemonLevel - leaderLevel) >= 5;

        // Capped at 13 gyms total (8 standard + 5 legendary)
        if (gymId > 13) {
            return { coins: 0, medal: null, isFirst: false, xpGained: 0, leveledUp: false, newLevel: this.level, isOverleveled: false };
        }

        const timesDefeated = this.defeated_gyms[gymIdStr] ?? 0;
        const isFirst = timesDefeated === 0;

        if (isOverleveled) {
            let medal: string | null = null;
            if (isFirst) {
                // Find gym config to award medal on first victory even if overleveled
                let gymConfig: any = null;
                for (const gym of gymRewards.gyms) {
                    if (gym.id === gymId) {
                        gymConfig = gym;
                        break;
                    }
                }
                if (gymConfig && gymConfig.medal) {
                    const mName: string = gymConfig.medal;
                    medal = mName;
                    if (!this.medals.includes(mName)) {
                        this.medals.push(mName);
                        if (!this.medal_levels[mName]) {
                            this.medal_levels[mName] = 1;
                        }
                    }
                }
            }
            
            // Still track the defeat and cooldown so the game progresses
            this.defeated_gyms[gymIdStr] = timesDefeated + 1;
            this.gym_cooldowns[gymIdStr] = Date.now() / 1000;

            return {
                coins: 0,
                medal,
                isFirst,
                xpGained: 0,
                leveledUp: false,
                newLevel: this.level,
                isOverleveled: true
            };
        }

        // Check cooldown
        if (this.gym_cooldowns[gymIdStr]) {
            const cooldownHours = economyConfig.gym_rebattle_cooldown_hours ?? 24;
            const lastTime = this.gym_cooldowns[gymIdStr];
            if (Date.now() / 1000 - lastTime < cooldownHours * 3600) {
                // Rematch during cooldown: increment defeats but don't reset cooldown or give rewards
                this.defeated_gyms[gymIdStr] = timesDefeated + 1;
                return { coins: 0, medal: null, isFirst: false, xpGained: 0, leveledUp: false, newLevel: this.level, isOverleveled: false };
            }
        }

        // Find gym config
        let gymConfig: any = null;
        for (const gym of gymRewards.gyms) {
            if (gym.id === gymId) {
                gymConfig = gym;
                break;
            }
        }



        let coins = 0;
        let medal: string | null = null;
        let xpGained = 500;

        if (!gymConfig) {
            // Support for infinite post-game gyms (gymId 9 to 13)
            if (gymId > 8 && gymId <= 13) {
                if (isFirst) {
                    const minCoins = 500 + (gymId - 8) * 50;
                    const maxCoins = 550 + (gymId - 8) * 50;
                    coins = Math.floor(Math.random() * (maxCoins - minCoins + 1)) + minCoins + 200; // First victory bonus
                    xpGained = 500 + (gymId - 8) * 50;
                } else {
                    // Re-match: randomly 50 to 75 coins, scaled by 10% per gym level
                    const baseCoins = Math.floor(Math.random() * (75 - 50 + 1)) + 50;
                    coins = Math.floor(baseCoins * (1.0 + (gymId - 1) * 0.10));
                    xpGained = 100;
                }
            } else {
                return { coins: 0, medal: null, isFirst: false, xpGained: 0, leveledUp: false, newLevel: this.level, isOverleveled: false };
            }
        } else {
            if (isFirst) {
                const minCoins = gymConfig.min_coins;
                const maxCoins = gymConfig.max_coins;
                coins = Math.floor(Math.random() * (maxCoins - minCoins + 1)) + minCoins;
                coins += gymConfig.first_victory_bonus ?? 0;
                medal = gymConfig.medal ?? '';
                if (medal) {
                    this.medals.push(medal);
                    if (!this.medal_levels[medal]) {
                        this.medal_levels[medal] = 1;
                    }
                }
                xpGained = 500;
            } else {
                // Re-match: randomly 50 to 75 coins, scaled by 10% per gym level
                const baseCoins = Math.floor(Math.random() * (75 - 50 + 1)) + 50;
                coins = Math.floor(baseCoins * (1.0 + (gymId - 1) * 0.10));
                xpGained = 150;
            }
        }

        // Award and track
        this.addCoins(coins, 'gym_victory', `Defeated gym: ${gymIdStr}`);
        this.defeated_gyms[gymIdStr] = timesDefeated + 1;
        this.gym_cooldowns[gymIdStr] = Date.now() / 1000;

        const xpResult = this.addTrainerXp(xpGained);

        return {
            coins,
            medal,
            isFirst,
            xpGained,
            leveledUp: xpResult.leveledUp,
            newLevel: xpResult.newLevel,
            isOverleveled: false
        };
    }

    // ---- PASSIVE GENERATION ----

    public calculatePassiveIncome(team: any[]): number {
        const maxTeam = economyConfig.max_team_size ?? 6;
        const teamToCalc = team.slice(0, maxTeam);

        let total = 0;
        for (const pokemon of teamToCalc) {
            const nameLower = (pokemon.id || '').toLowerCase();
            const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === nameLower);
            const goldPerHour = species ? species.gold_per_hour : 5;
            let baseCoins = goldPerHour * 24;

            if (pokemon.is_evolved) {
                baseCoins = Math.floor(baseCoins * 1.25);
            }

            const medalTypeMap: Record<string, string[]> = {
                "Medalla Roca": ["rock"],
                "Medalla Cascada": ["water"],
                "Medalla Trueno": ["electric"],
                "Medalla Arcoiris": ["grass"],
                "Medalla Alma": ["poison"],
                "Medalla Pantano": ["psychic"],
                "Medalla Volcan": ["fire"],
                "Medalla Tierra": ["ground", "dragon"]
            };

            let boostPercent = 0;
            const pokemonTypes: string[] = species ? species.types : [];
            for (const [medalName, types] of Object.entries(medalTypeMap)) {
                const medalLvl = this.medal_levels[medalName] || 1;
                if (medalLvl > 1 && this.medals.includes(medalName)) {
                    if (pokemonTypes.some(t => types.includes(t.toLowerCase()))) {
                        const medalBoost = medalLvl === 2 ? 0.10 : 0.25;
                        boostPercent = Math.max(boostPercent, medalBoost);
                    }
                }
            }
            if (boostPercent > 0) {
                baseCoins = Math.floor(baseCoins * (1 + boostPercent));
            }

            total += baseCoins;
        }

        return total;
    }

    public evolveMedal(medalName: string, team: any[]): { success: boolean; reason?: string } {
        const medalGymMap: Record<string, { gymId: string; types: string[] }> = {
            "Medalla Roca": { gymId: "1", types: ["rock"] },
            "Medalla Cascada": { gymId: "2", types: ["water"] },
            "Medalla Trueno": { gymId: "3", types: ["electric"] },
            "Medalla Arcoiris": { gymId: "4", types: ["grass"] },
            "Medalla Alma": { gymId: "5", types: ["poison"] },
            "Medalla Pantano": { gymId: "6", types: ["psychic"] },
            "Medalla Volcan": { gymId: "7", types: ["fire"] },
            "Medalla Tierra": { gymId: "8", types: ["ground", "dragon"] }
        };

        const config = medalGymMap[medalName];
        if (!config) {
            return { success: false, reason: "Medalla no reconocida." };
        }

        if (!this.medals.includes(medalName)) {
            return { success: false, reason: "No posees esta medalla en nivel Bronce aún." };
        }

        const currentLvl = this.medal_levels[medalName] || 1;
        if (currentLvl >= 3) {
            return { success: false, reason: "La medalla ya está en su nivel máximo (Oro)." };
        }

        const nextLvl = currentLvl + 1;
        const cost = nextLvl === 2 ? 1000 : 3000;
        const requiredDefeats = nextLvl === 2 ? 3 : 10;
        const requiredTypeCount = nextLvl === 2 ? 1 : 2;

        // Verify defeats
        const defeats = this.defeated_gyms[config.gymId] || 0;
        if (defeats < requiredDefeats) {
            return { success: false, reason: `Requiere derrotar al líder ${requiredDefeats} veces (llevas ${defeats}).` };
        }

        // Verify team types
        let matchingCount = 0;
        for (const pokemon of team) {
            const nameLower = (pokemon.id || '').toLowerCase();
            const species = pokemonSpeciesList.find((s: any) => s.name.toLowerCase() === nameLower);
            const pokemonTypes: string[] = species ? species.types : [];
            if (pokemonTypes.some(t => config.types.includes(t.toLowerCase()))) {
                matchingCount++;
            }
        }

        if (matchingCount < requiredTypeCount) {
            return { 
                success: false, 
                reason: `Requiere al menos ${requiredTypeCount} Pokémon de tipo ${config.types.join('/')} en tu equipo activo (tienes ${matchingCount}).` 
            };
        }

        // Verify coins
        if (this.coins < cost) {
            return { success: false, reason: `No tienes suficientes coins (se requieren ${cost} coins).` };
        }

        // Deduct and upgrade
        this.spendCoins(cost);
        this.medal_levels[medalName] = nextLvl;

        return { success: true };
    }

    public claimPassiveIncome(team: any[]): number {
        const claimInterval = economyConfig.passive_claim_interval_hours ?? 24;

        if (this.last_passive_claim) {
            const elapsed = Date.now() / 1000 - parseFloat(this.last_passive_claim);
            if (elapsed < claimInterval * 3600) {
                return 0;
            }
        }

        const coins = this.calculatePassiveIncome(team);
        if (coins > 0) {
            this.addCoins(coins, 'passive_claim');
            this.last_passive_claim = String(Date.now() / 1000);
            
            // Award 50 Trainer XP for claiming passive income
            this.addTrainerXp(50);
        }
        return coins;
    }

    public getPassiveTimeRemaining(): number {
        if (!this.last_passive_claim) {
            return 0.0;
        }
        const claimInterval = economyConfig.passive_claim_interval_hours ?? 24;
        const elapsed = Date.now() / 1000 - parseFloat(this.last_passive_claim);
        const remaining = (claimInterval * 3600) - elapsed;
        return Math.max(0.0, remaining);
    }

    // ---- LOGIN STREAK ----

    public checkLoginStreak(): { streak: number; reward_coins: number; reward_items: any; streak_broken: boolean } {
        const today = new Date().toISOString().split('T')[0];

        if (today === this.last_login_date) {
            return { streak: this.login_streak, reward_coins: 0, reward_items: {}, streak_broken: false };
        }

        // New day! Reset daily missions progress and claimed status
        this.daily_missions_progress = {};
        this.claimed_missions = {};

        // Weekly Reset check
        const todayDate = new Date();
        const dayOfWeek = todayDate.getDay(); // 0 is Sunday, 1 is Monday...
        const diff = todayDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const currentMonday = new Date(todayDate.setDate(diff)).toISOString().split('T')[0];

        if (currentMonday !== this.last_weekly_reset_date) {
            this.weekly_missions_progress = {};
            this.claimed_weekly_missions = {};
            this.last_weekly_reset_date = currentMonday;
        }

        const yesterdayObj = new Date();
        yesterdayObj.setDate(yesterdayObj.getDate() - 1);
        const yesterday = yesterdayObj.toISOString().split('T')[0];
        let streakBroken = false;

        if (this.last_login_date === yesterday) {
            this.login_streak += 1;
        } else if (this.last_login_date === '') {
            this.login_streak = 1;
        } else {
            streakBroken = true;
            this.login_streak = 1;
        }

        this.last_login_date = today;

        // Dynamic reward: starts at 20 coins on day 1, +10 per consecutive day
        const rewardCoins = 20 + (this.login_streak - 1) * 10;
        const rewardItems: any = {};

        if (rewardCoins > 0) {
            this.addCoins(rewardCoins, 'login_bonus', `Streak day: ${this.login_streak}`);
            // Award 100 Trainer XP for new daily login reward
            this.addTrainerXp(100);
        }

        return {
            streak: this.login_streak,
            reward_coins: rewardCoins,
            reward_items: rewardItems,
            streak_broken: streakBroken
        };
    }

    // ---- DAILY MISSIONS ----

    public updateMissionProgress(missionType: string, amount: number = 1): void {
        // Daily
        for (const mission of dailyMissions.missions) {
            if (mission.type === missionType) {
                const mid = mission.id;
                const current = this.daily_missions_progress[mid] ?? 0;
                if (current < mission.target) {
                    this.daily_missions_progress[mid] = current + amount;
                }
            }
        }
        // Weekly
        for (const mission of weeklyMissions.missions) {
            if (mission.type === missionType) {
                const mid = mission.id;
                if (!this.weekly_missions_progress) {
                    this.weekly_missions_progress = {};
                }
                const current = this.weekly_missions_progress[mid] ?? 0;
                if (current < mission.target) {
                    this.weekly_missions_progress[mid] = current + amount;
                }
            }
        }
    }

    public claimMissionReward(missionId: string, isWeekly: boolean = false): boolean {
        if (isWeekly) {
            if (!this.claimed_weekly_missions) {
                this.claimed_weekly_missions = {};
            }
            const mission = weeklyMissions.missions.find((m: any) => m.id === missionId);
            if (!mission) return false;

            const prog = this.weekly_missions_progress[missionId] ?? 0;
            if (prog < mission.target) return false;

            if (this.claimed_weekly_missions[missionId]) return false;

            if (mission.reward_coins && mission.reward_coins > 0) {
                this.addCoins(mission.reward_coins, 'mission_reward', `Completed weekly: ${missionId}`);
            }
            this.addTrainerXp(500);
            this.claimed_weekly_missions[missionId] = true;

            return true;
        } else {
            if (!this.claimed_missions) {
                this.claimed_missions = {};
            }
            const mission = dailyMissions.missions.find((m: any) => m.id === missionId);
            if (!mission) return false;

            const prog = this.daily_missions_progress[missionId] ?? 0;
            if (prog < mission.target) return false;

            if (this.claimed_missions[missionId]) return false;

            if (mission.reward_coins && mission.reward_coins > 0) {
                this.addCoins(mission.reward_coins, 'mission_reward', `Completed daily: ${missionId}`);
            }
            this.addTrainerXp(200);
            this.claimed_missions[missionId] = true;

            return true;
        }
    }

    public activateBooster(itemId: string, durationMs: number): boolean {
        const now = Date.now();
        if (itemId === 'gold_incense') {
            const currentExpiry = this.gold_incense_expires && this.gold_incense_expires > now ? this.gold_incense_expires : now;
            this.gold_incense_expires = currentExpiry + durationMs;
            return true;
        }
        if (itemId === 'repel') {
            const currentExpiry = this.repel_expires && this.repel_expires > now ? this.repel_expires : now;
            this.repel_expires = currentExpiry + durationMs;
            return true;
        }
        return false;
    }

    // ---- HEALING AND REVIVING ----

    public getReviveCost(): number {
        return 100 + Math.floor(this.level / 10) * 200;
    }

    public canFreeHeal(trueDate: string | null = null): boolean {
        const today = trueDate || new Date().toISOString().split('T')[0];
        if (this.last_heal_date !== today) {
            return true;
        }
        return this.heals_today < 2;
    }

    public executeFreeHeal(trueDate: string | null = null): boolean {
        if (!this.canFreeHeal(trueDate)) return false;
        
        const today = trueDate || new Date().toISOString().split('T')[0];
        if (this.last_heal_date !== today) {
            this.heals_today = 0;
            this.last_heal_date = today;
        }
        this.heals_today += 1;
        return true;
    }

    public executePaidRevive(): boolean {
        const cost = this.getReviveCost();
        return this.spendCoins(cost, 'revive_heal');
    }

    public getFormattedCoins(): string {
        return this.coins.toLocaleString('en-US');
    }

    public getFormattedPusdt(): string {
        return this.pusdt.toFixed(2);
    }
}
