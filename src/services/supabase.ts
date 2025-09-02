import { createClient } from '@supabase/supabase-js'

// Folosește variabilele de mediu cu fallback
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wajgxfgeumpztjyafyem.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhamd4ZmdldW1wenRqeWFmeWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0MDcxMDYsImV4cCI6MjA1MDk4MzEwNn0.qGu5u8ZqeEXYHwAYA4iARW0L0BB8XtwwZpxIKMp6Afc'

// Debug log pentru verificare
console.log('🔑 Supabase URL:', SUPABASE_URL)
console.log('🔑 Key exists:', !!SUPABASE_ANON_KEY)
console.log('🔑 Key length:', SUPABASE_ANON_KEY?.length)

// Verifică că avem valori valide
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ CRITICAL: Supabase credentials missing!')
  console.error('URL:', SUPABASE_URL)
  console.error('Key:', SUPABASE_ANON_KEY)
}

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

// Test connection immediately
supabase.from('users').select('count').then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection error:', error)
  } else {
    console.log('✅ Supabase connected successfully')
  }
})

export const ensureUserExists = async (userId: string, colorHash: string) => {
  console.log('🔵 SAVING USER:', userId)
  
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
      console.error('❌ USER SAVE ERROR:', error)
      return { id: userId, color_hash: colorHash }
    }

    console.log('✅ User saved:', data)
    return data || { id: userId, color_hash: colorHash }
  } catch (error) {
    console.error('❌ ensureUserExists error:', error)
    return { id: userId, color_hash: colorHash }
  }
}

export const updateUserPosition = async (userId: string, position: { lat: number; lng: number }) => {
  console.log('📍 Updating position for user:', userId, position)
  
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
      console.error('❌ Error updating position:', error)
      return { error }
    }

    console.log('✅ Position updated:', data)
    return { error: null, data }
  } catch (error) {
    console.error('❌ updateUserPosition error:', error)
    return { error }
  }
}
