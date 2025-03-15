// scripts/invoke-function.js
require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function invokeFunction() {
  try {
    console.log('Invoking function with anon key...');
    const { data, error } = await supabase.functions.invoke('calculate-artist-similarities', {
      body: { limit: 1 }
    });
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Exception:', err);
  }
}

invokeFunction();
