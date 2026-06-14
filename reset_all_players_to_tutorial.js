// Script: reset_all_players_to_tutorial.js
// Resetea el mapa y coordenadas de TODOS los jugadores al Pueblo Tutorial
// Ejecutar con: node reset_all_players_to_tutorial.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rqorajspzwxvnchatcxt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb3JhanNwend4dm5jaGF0Y3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTIwMzc2NiwiZXhwIjoyMDk2Nzc5NzY2fQ.ysimAqyjRmHEAwhCITUxDVFfGrswHrhnAz44wC-ica0';

const TUTORIAL_MAP = '/assets/maps/tutorial/main.json';
const TUTORIAL_X = 632;
const TUTORIAL_Y = 428;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function resetAllPlayersToTutorial() {
    console.log('🔄 Leyendo todos los jugadores...');

    // Leer todos los saves
    const { data: rows, error: readErr } = await supabase
        .from('player_saves')
        .select('wallet_address, save_data');

    if (readErr) {
        console.error('❌ Error al leer jugadores:', readErr.message);
        process.exit(1);
    }

    console.log(`📋 Total de jugadores encontrados: ${rows.length}`);

    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
        const saveData = row.save_data;
        const currentMap = saveData?.map || '';

        // Sólo resetear si están en un mapa desconocido o en route2
        // Para "esta vez" reseteamos a TODOS sin excepción
        const newSaveData = {
            ...saveData,
            map: TUTORIAL_MAP,
            player_coordinates: [TUTORIAL_X, TUTORIAL_Y]
        };

        const { error: updateErr } = await supabase
            .from('player_saves')
            .update({ save_data: newSaveData })
            .eq('wallet_address', row.wallet_address);

        if (updateErr) {
            console.error(`  ❌ Error actualizando ${row.wallet_address}: ${updateErr.message}`);
            skipped++;
        } else {
            console.log(`  ✅ ${row.wallet_address.slice(0,10)}... | ${currentMap || 'sin mapa'} → Tutorial`);
            updated++;
        }
    }

    console.log('\n============================');
    console.log(`✅ Jugadores reseteados:  ${updated}`);
    console.log(`❌ Errores/Omitidos:      ${skipped}`);
    console.log('============================');
    console.log('🎉 Todos los jugadores ahora inician en el Pueblo Tutorial');
}

resetAllPlayersToTutorial();
