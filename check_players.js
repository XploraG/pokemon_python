const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://rqorajspzwxvnchatcxt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb3JhanNwend4dm5jaGF0Y3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTIwMzc2NiwiZXhwIjoyMDk2Nzc5NzY2fQ.ysimAqyjRmHEAwhCITUxDVFfGrswHrhnAz44wC-ica0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Root path to public assets
const PUBLIC_DIR = path.join(__dirname, 'public');

async function run() {
    console.log('🔄 Fetching all players from Supabase...');
    const { data: rows, error } = await supabase
        .from('player_saves')
        .select('wallet_address, save_data, updated_at');

    if (error) {
        console.error('❌ Error fetching player saves:', error.message);
        return;
    }

    console.log(`📋 Found ${rows.length} total players.`);
    console.log('--------------------------------------------------');

    const blockedPlayers = [];

    for (const row of rows) {
        const wallet = row.wallet_address;
        const saveData = row.save_data;
        if (!saveData) {
            console.log(`⚠️ Player ${wallet} has no save_data.`);
            blockedPlayers.push({ wallet, reason: 'No save_data' });
            continue;
        }

        const mapPath = saveData.map;
        if (!mapPath) {
            console.log(`⚠️ Player ${wallet} has no map defined in save_data.`);
            blockedPlayers.push({ wallet, reason: 'No map defined' });
            continue;
        }

        // Procedural maps are handled dynamically
        if (mapPath.startsWith('procedural://')) {
            continue;
        }

        // Check if the map file exists on disk
        const absoluteMapPath = path.join(PUBLIC_DIR, mapPath.replace(/^\//, ''));
        const fileExists = fs.existsSync(absoluteMapPath);

        if (!fileExists) {
            console.log(`❌ Player ${wallet} is blocked! Map path "${mapPath}" does not exist on disk.`);
            blockedPlayers.push({ wallet, map: mapPath, reason: `Map file does not exist: ${mapPath}` });
        } else {
            // Check if map file is valid JSON
            try {
                const mapContent = fs.readFileSync(absoluteMapPath, 'utf8');
                const mapJson = JSON.parse(mapContent);
                
                // Check if entities exist
                if (mapJson.entities) {
                    for (const ent of mapJson.entities) {
                        if (ent.location) {
                            const entPath = path.join(PUBLIC_DIR, ent.location.replace('src/assets/', 'assets/').replace(/^\//, ''));
                            if (!fs.existsSync(entPath)) {
                                console.log(`❌ Player ${wallet} is blocked! Entity file "${ent.location}" in map "${mapPath}" does not exist.`);
                                blockedPlayers.push({ wallet, map: mapPath, reason: `Entity file does not exist: ${ent.location}` });
                                break;
                            }
                        }
                    }
                }
            } catch (jsonErr) {
                console.log(`❌ Player ${wallet} is blocked! Map path "${mapPath}" has invalid JSON:`, jsonErr.message);
                blockedPlayers.push({ wallet, map: mapPath, reason: `Invalid JSON in map file: ${jsonErr.message}` });
            }
        }
    }

    console.log('--------------------------------------------------');
    console.log(`🚨 Total Blocked Players Found: ${blockedPlayers.length}`);
    console.log(JSON.stringify(blockedPlayers, null, 2));
}

run();
