const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rqorajspzwxvnchatcxt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb3JhanNwend4dm5jaGF0Y3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTIwMzc2NiwiZXhwIjoyMDk2Nzc5NzY2fQ.ysimAqyjRmHEAwhCITUxDVFfGrswHrhnAz44wC-ica0';
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
    const wallet = '0xe8fb1fd2c7de8c8ec5c509fb966536e2475db38b';
    console.log("Fetching JJhos save data...");
    const { data, error } = await supabase
        .from('player_saves')
        .select('*')
        .eq('wallet_address', wallet)
        .single();
    
    if (error) {
        console.error("Error:", error.message);
        return;
    }

    const save = data.save_data;
    if (!save.inventory_data) save.inventory_data = {};
    if (!save.inventory_data.items) save.inventory_data.items = {};

    // Restore purchased items: 5x repel, 1x thunder_stone
    save.inventory_data.items.repel = (save.inventory_data.items.repel || 0) + 5;
    save.inventory_data.items.thunder_stone = (save.inventory_data.items.thunder_stone || 0) + 1;

    console.log("Updating JJhos save data on Supabase...");
    const { error: updateError } = await supabase
        .from('player_saves')
        .update({ save_data: save })
        .eq('wallet_address', wallet);

    if (updateError) {
        console.error("Update Error:", updateError.message);
    } else {
        console.log("Successfully restored items for JJhos!");
    }
}
run();
