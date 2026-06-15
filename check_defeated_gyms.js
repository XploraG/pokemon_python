// Script: check_defeated_gyms.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rqorajspzwxvnchatcxt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb3JhanNwend4dm5jaGF0Y3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTIwMzc2NiwiZXhwIjoyMDk2Nzc5NzY2fQ.ysimAqyjRmHEAwhCITUxDVFfGrswHrhnAz44wC-ica0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkDefeatedGyms() {
    const { data: rows, error } = await supabase
        .from('player_saves')
        .select('wallet_address, save_data');

    if (error) {
        console.error('Error reading saves:', error);
        return;
    }

    console.log('--- DEFEATED GYMS REPORT ---');
    rows.forEach(row => {
        const econ = row.save_data?.economy_data || {};
        console.log(`Player: ${row.save_data?.name || row.wallet_address}`);
        console.log(`  Medals:`, econ.medals);
        console.log(`  Defeated Gyms:`, econ.defeated_gyms);
        console.log(`  Medal Levels:`, econ.medal_levels);
    });
}

checkDefeatedGyms();
