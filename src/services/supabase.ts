import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wajgxfgeumpztjyafyem.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhamd4ZmdldW1wenRqeWFmeWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0MDcxMDYsImV4cCI6MjA1MDk4MzEwNn0.qGu5u8ZqeEXYHwAYA4iARW0L0BB8XtwwZpxIKMp6Afc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!existingUser) {
    await supabase.from('users').insert({
      id: userId,
      color_hash: colorHash
    })
    return { id: userId, color_hash: colorHash }
  }

  return existingUser
}

export const updateUserPosition = async (userId: string, position: { lat: number; lng: number }) => {
  return await supabase.from('active_positions').upsert({
    user_id: userId,
    lat: position.lat,
    lng: position.lng,
    updated_at: new Date().toISOString()
  })
}

export const getUsersInArea = async () => {
  const { data } = await supabase
    .from('active_positions')
    .select(`
      user_id,
      lat,
      lng,
      updated_at,
      users!inner(color_hash)
    `)
    .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
  
  return data || []
}
