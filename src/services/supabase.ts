import { createClient } from '@supabase/supabase-js'

// Direct values - no environment variables
const SUPABASE_URL = 'https://wajgxfgeumpztjyafyem.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhamd4ZmdldW1wenRqeWFmeWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0MDcxMDYsImV4cCI6MjA1MDk4MzEwNn0.qGu5u8ZqeEXYHwAYA4iARW0L0BB8XtwwZpxIKMp6Afc'

console.log('🔑 Initializing Supabase with URL:', SUPABASE_URL)

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Test connection
supabase.from('users').select('count').then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection failed:', error)
  } else {
    console.log('✅ Supabase connected successfully!')
  }
})

export const ensureUserExists = async (userId: string, colorHash: string) => {
  console.log('🔵 Creating/updating user:', userId)
  
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

    if (error) {
      console.error('User save error:', error)
      return { id: userId, color_hash: colorHash }
    }

    console.log('✅ User saved successfully')
    return data || { id: userId, color_hash: colorHash }
  } catch (error) {
    console.error('ensureUserExists error:', error)
    return { id: userId, color_hash: colorHash }
  }
}

export const updateUserPosition = async (userId: string, position: { lat: number; lng: number }) => {
  console.log('📍 Updating position:', userId, position)
  
  try {
    const { data, error } = await supabase
      .from('active_positions')
      .upsert({
        user_id: userId,
        lat: position.lat,
        lng: position.lng,
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Position update error:', error)
      return { error }
    }

    console.log('✅ Position updated')
    return { error: null, data }
  } catch (error) {
    console.error('updateUserPosition error:', error)
    return { error }
  }
}

export const getUsersInArea = async () => {
  try {
    const { data, error } = await supabase
      .from('active_positions')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
    
    if (error) {
      console.error('Error getting users:', error)
      return []
    }

    console.log(`Found ${data?.length || 0} active users`)
    return data || []
  } catch (error) {
    console.error('getUsersInArea error:', error)
    return []
  }
}
