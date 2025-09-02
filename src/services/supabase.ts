import { createClient } from '@supabase/supabase-js'

// Folosește variabilele de mediu corect
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wajgxfgeumpztjyafyem.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhamd4ZmdldW1wenRqeWFmeWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0MDcxMDYsImV4cCI6MjA1MDk4MzEwNn0.qGu5u8ZqeEXYHwAYA4iARW0L0BB8XtwwZpxIKMp6Afc'


const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug log pentru verificare
console.log('🔑 Supabase URL:', SUPABASE_URL)
console.log('🔑 Key exists:', !!SUPABASE_ANON_KEY)

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

export const ensureUserExists = async (userId: string, colorHash: string) => {
  console.log('🔵 SAVING USER:', userId)
  
  try {
    // Direct insert - nu mai verificăm dacă există
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
      console.error('❌ USER SAVE ERROR:', error)
      // Întoarcem user oricum pentru a continua aplicația
      return { id: userId, color_hash: colorHash }
    }

    console.log('✅ USER SAVED:', data)
    return data
  } catch (err) {
    console.error('❌ CRITICAL ERROR:', err)
    return { id: userId, color_hash: colorHash }
  }
}

export const updateUserPosition = async (userId: string, position: { lat: number; lng: number }) => {
  console.log('🔵 UPDATING POSITION:', userId, position)
  
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
      console.error('❌ POSITION UPDATE ERROR:', error)
      return { error }
    }

    console.log('✅ POSITION UPDATED:', data)
    return { data }
  } catch (err) {
    console.error('❌ CRITICAL POSITION ERROR:', err)
    return { error: err }
  }
}

export const getUsersInArea = async () => {
  console.log('🔵 GETTING ALL USERS...')
  
  try {
    const { data, error } = await supabase
      .from('active_positions')
      .select('*')

    if (error) {
      console.error('❌ GET USERS ERROR:', error)
      return []
    }

    console.log('✅ FOUND USERS:', data?.length || 0)
    return data || []
  } catch (err) {
    console.error('❌ CRITICAL GET ERROR:', err)
    return []
  }
}
