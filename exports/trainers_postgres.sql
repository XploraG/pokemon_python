-- PostgreSQL Export for trainers
INSERT INTO trainers (
    telegram_id, username, level, experience, xp_needed_for_next_level, 
    gold, usd_balance, ton_balance, pokeballs, greatballs, ultraballs, masterballs, 
    backpack, tool, outfit, battle_energy, max_battle_energy, ads_watched_today, 
    last_reset_timestamp, status, coords_x, coords_y
) VALUES
(
    '12345678', 'Red_Trainer', 1, 0, 1000,
    500, 0, 0, 5, 0, 0, 0,
    NULL, NULL, NULL, 10, 10, 0,
    1780904114519, 'EN_RUTA', 7, 3
)
ON CONFLICT (telegram_id) DO UPDATE SET
    username = EXCLUDED.username,
    level = EXCLUDED.level,
    experience = EXCLUDED.experience,
    xp_needed_for_next_level = EXCLUDED.xp_needed_for_next_level,
    gold = EXCLUDED.gold,
    usd_balance = EXCLUDED.usd_balance,
    ton_balance = EXCLUDED.ton_balance,
    pokeballs = EXCLUDED.pokeballs,
    greatballs = EXCLUDED.greatballs,
    ultraballs = EXCLUDED.ultraballs,
    masterballs = EXCLUDED.masterballs,
    backpack = EXCLUDED.backpack,
    tool = EXCLUDED.tool,
    outfit = EXCLUDED.outfit,
    battle_energy = EXCLUDED.battle_energy,
    max_battle_energy = EXCLUDED.max_battle_energy,
    ads_watched_today = EXCLUDED.ads_watched_today,
    last_reset_timestamp = EXCLUDED.last_reset_timestamp,
    status = EXCLUDED.status,
    coords_x = EXCLUDED.coords_x,
    coords_y = EXCLUDED.coords_y;
