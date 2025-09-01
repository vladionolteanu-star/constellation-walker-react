import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wajgxfgeumpztjyafyem.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhamd4ZmdldW1wenRqeWFmeWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0MDcxMDYsImV4cCI6MjA1MDk4MzEwNn0.qGu5u8ZqeEXYHwAYA4iARW0L0BB8XtwwZpxIKMp6Afc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database types
export interface DbUser {
  id: string
  color_hash: string
  created_at: string
  last_seen: string
}

export interface DbActivePosition {
  user_id: string
  lat: number
  lng: number
  altitude?: number
  speed?: number
  heading?: number
  updated_at: string
}

export interface DbEcho {
  id: string
  user_id: string
  lat: number
  lng: number
  content_type: 'audio' | 'video' | 'photo' | 'text' | 'mood'
  content_url?: string
  mood_color?: string
  decay_date: string
  created_at: string
  interaction_count: number
}

// Helper functions
export const ensureUserExists = async (userId: string, colorHash: string) => {
  try {
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking user:', selectError)
      throw selectError
    }

    if (!existingUser) {
      const { data, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          color_hash: colorHash,
          created_at: new Date().toISOString(),
          last_seen: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating user:', insertError)
        throw insertError
      }

      return data || { id: userId, color_hash: colorHash }
    }

    // Update last_seen
    await supabase
      .from('users')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', userId)

    return existingUser
  } catch (error) {
    console.error('ensureUserExists error:', error)
    return { id: userId, color_hash: colorHash }
  }
}

export const updateUserPosition = async (userId: string, position: { lat: number; lng: number }) => {
  try {
    const { error } = await supabase.from('active_positions').upsert({
      user_id: userId,
      lat: position.lat,
      lng: position.lng,
      updated_at: new Date().toISOString()
    })

    if (error) {
      console.error('Error updating position:', error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error('updateUserPosition error:', error)
    return { error }
  }
}

export const getUsersInArea = async () => {
  try {
    const { data, error } = await supabase
      .from('active_positions')
      .select(`
        user_id,
        lat,
        lng,
        updated_at,
        users (
          color_hash
        )
      `)
      .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
    
    if (error) {
      console.error('Error getting users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('getUsersInArea error:', error)
    return []
  }
}
