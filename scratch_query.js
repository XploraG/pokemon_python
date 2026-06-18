const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://rqorajspzwxvnchatcxt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb3JhanNwend4dm5jaGF0Y3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTIwMzc2NiwiZXhwIjoyMDk2Nzc5NzY2fQ.ysimAqyjRmHEAwhCITUxDVFfGrswHrhnAz44wC-ica0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function inspectRow() {
    const { data, error } = await supabase
        .from('player_saves')
        .select('*')
        .limit(1);
    if (error) {
        console.error("Error inspecting:", error.message);
    } else {
        console.log("Row Data:", JSON.stringify(data, null, 2));
    }
}

inspectRow();
