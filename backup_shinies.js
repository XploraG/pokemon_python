const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://rqorajspzwxvnchatcxt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb3JhanNwend4dm5jaGF0Y3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTIwMzc2NiwiZXhwIjoyMDk2Nzc5NzY2fQ.ysimAqyjRmHEAwhCITUxDVFfGrswHrhnAz44wC-ica0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
    console.log('🔄 Conectando a Supabase y descargando datos de los jugadores...');
    const { data: rows, error } = await supabase
        .from('player_saves')
        .select('wallet_address, save_data, updated_at');

    if (error) {
        console.error('❌ Error al obtener partidas de Supabase:', error.message);
        return;
    }

    console.log(`📋 Se encontraron ${rows.length} jugadores en la base de datos.`);
    console.log('--------------------------------------------------');

    const shinyBackups = [];
    let totalShiniesFound = 0;

    for (const row of rows) {
        const wallet = row.wallet_address;
        const saveData = row.save_data;
        if (!saveData) continue;

        const team = saveData.team_data || [];
        const pc = saveData.pc_pokemon || [];
        
        const shiniesInTeam = team.filter(p => p && p.is_shiny);
        const shiniesInPc = pc.filter(p => p && p.is_shiny);
        const allShinies = [...shiniesInTeam, ...shiniesInPc];

        if (allShinies.length > 0) {
            totalShiniesFound += allShinies.length;
            const playerName = saveData.name || wallet;
            
            console.log(`✨ Jugador: ${playerName} (${wallet})`);
            console.log(`   - Shinies en Equipo: ${shiniesInTeam.map(p => `${p.id} (Nvl. ${p.level || 1})`).join(', ') || 'Ninguno'}`);
            console.log(`   - Shinies en PC: ${shiniesInPc.map(p => `${p.id} (Nvl. ${p.level || 1})`).join(', ') || 'Ninguno'}`);
            
            shinyBackups.push({
                wallet_address: wallet,
                player_name: playerName,
                updated_at: row.updated_at,
                shinies_count: allShinies.length,
                shinies_list: allShinies.map(p => ({
                    id: p.id,
                    level: p.level || 1,
                    is_shiny: p.is_shiny,
                    location: shiniesInTeam.includes(p) ? 'team' : 'pc',
                    ivs: p.ivs || null,
                    nature: p.nature || null
                })),
                full_save_data: saveData
            });
        }
    }

    console.log('--------------------------------------------------');
    console.log(`✅ Escaneo completado.`);
    console.log(`🎮 Jugadores con Shinies: ${shinyBackups.length}`);
    console.log(`✨ Total de Pokémon Shinies encontrados: ${totalShiniesFound}`);

    const backupFilePath = path.join(__dirname, 'shiny_players_backup.json');
    fs.writeFileSync(backupFilePath, JSON.stringify(shinyBackups, null, 2), 'utf8');
    
    console.log(`💾 Respaldo guardado con éxito en: ${backupFilePath}`);
}

run();
