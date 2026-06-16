const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rqorajspzwxvnchatcxt.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb3JhanNwend4dm5jaGF0Y3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTIwMzc2NiwiZXhwIjoyMDk2Nzc5NzY2fQ.ysimAqyjRmHEAwhCITUxDVFfGrswHrhnAz44wC-ica0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkPolicies() {
    console.log('Fetching database policies...');
    try {
        const { data, error } = await supabase
            .rpc('exec_sql', { sql_query: "SELECT tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public';" });
            
        if (error) {
            console.log('Error querying policies (no exec_sql RPC maybe):', error.message);
        } else {
            console.log('Policies list:', data);
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
}

checkPolicies();
