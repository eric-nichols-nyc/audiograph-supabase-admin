// scripts/calculate-similarities.ts
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin access
)

async function calculateSimilarities() {
  const args = process.argv.slice(2)
  const limit = args[0] ? parseInt(args[0]) : 10
  const specificArtistId = args[1] || null
  
  console.log(`Calculating similarities for ${specificArtistId || `${limit} artists`}...`)
  
  const { data, error } = await supabase
    .functions
    .invoke('calculate-artist-similarities', {
      body: { limit, specificArtistId }
    })
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('Result:', JSON.stringify(data, null, 2))
}

calculateSimilarities()