import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wajgxfgeumpztjyafyem.supabase.co'
// CHEIA NOUĂ!!!
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhamd4ZmdldW1wenRqeWFmeWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMDgyNzEsImV4cCI6MjA3MTY4NDI3MX0.HIxqodWNGoKJP6Jw96e0Rgy1rd7tT7inG4_QQLlGdBQ'

console.log('🔑 Initializing Supabase with NEW key...')

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test connection
supabase.from('users').select('count').then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection failed:', error)
  } else {
    console.log('✅ SUPABASE CONNECTED!', data)
  }
})

export const ensureUserExists = async (userId: string, colorHash: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        color_hash: colorHash,
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    
    console.log('✅ User saved')
    return data || { id: userId, color_hash: colorHash }
  } catch (error) {
    console.error('User error:', error)
    return { id: userId, color_hash: colorHash }
  }
}

export const updateUserPosition = async (userId: string, position: { lat: number; lng: number }) => {
  try {
    const { error } = await supabase
      .from('active_positions')
      .upsert({
        user_id: userId,
        lat: position.lat,
        lng: position.lng,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
    
    console.log('📍 Position updated')
    return { error: null }
  } catch (error) {
    console.error('Position error:', error)
    return { error }
  }
}

export const getUsersInArea = async () => {
  try {
    const { data, error } = await supabase
      .from('active_positions')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
    
    if (error) throw error
    
    console.log(`👥 Found ${data?.length || 0} active users`)
    return data || []
  } catch (error) {
    console.error('Get users error:', error)
    return []
  }
}
