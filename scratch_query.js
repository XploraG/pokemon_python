const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rqorajspzwxvnchatcxt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb3JhanNwend4dm5jaGF0Y3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTIwMzc2NiwiZXhwIjoyMDk2Nzc5NzY2fQ.ysimAqyjRmHEAwhCITUxDVFfGrswHrhnAz44wC-ica0';
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
    console.log("Testing purchase_marketplace_listing RPC...");
    const { data, error } = await supabase.rpc('purchase_marketplace_listing', {
        p_listing_id: '5c85843b-a0ef-4df6-b122-829e338a7c4d',
        p_buyer_address: '0xf29299c07fc682edb285785723751b5ffbbd0ef1',
        p_buyer_name: 'Test Buyer'
    });
    if (error) {
        console.error("RPC error details:", error);
    } else {
        console.log("RPC execution result:", data);
    }
}
run();
