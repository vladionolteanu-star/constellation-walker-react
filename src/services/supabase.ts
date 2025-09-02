import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wajgxfgeumpztjyafyem.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhamd4ZmdldW1wenRqeWFmeWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0MDcxMDYsImV4cCI6MjA1MDk4MzEwNn0.qGu5u8ZqeEXYHwAYA4iARW0L0BB8XtwwZpxIKMp6Afc'

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

// Helper functions
export const ensureUserExists = async (userId: string, colorHash: string) => {
  try {
    console.log('🔍 Checking if user exists:', userId)
    
    // Check if user exists
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle() // Use maybeSingle instead of single

    if (selectError) {
      console.error('Error checking user:', selectError)
    }

    if (!existingUser) {
      console.log('📝 Creating new user:', userId)
      
      const newUser = {
        id: userId,
        color_hash: colorHash,
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString()
      }
      
      const { data, error: insertError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single()

      if (insertError) {
        console.error('❌ Error creating user:', insertError)
        // Return user anyway
        return newUser
      }

      console.log('✅ User created successfully:', data)
      return data || newUser
    } else {
      console.log('✅ User exists, updating last_seen')
      
      // Update last_seen
      await supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId)

      return existingUser
    }
  } catch (error) {
    console.error('❌ ensureUserExists error:', error)
    return { id: userId, color_hash: colorHash }
  }
}

export const updateUserPosition = async (userId: string, position: { lat: number; lng: number }) => {
  try {
    console.log('📍 Updating position for user:', userId, position)
    
    const positionData = {
      user_id: userId,
      lat: position.lat,
      lng: position.lng,
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('active_positions')
      .upsert(positionData)
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

export const getUsersInArea = async () => {
  try {
    console.log('🔍 Getting users in area...')
    
    const { data, error } = await supabase
      .from('active_positions')
      .select('*')
      .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
    
    if (error) {
      console.error('❌ Error getting users:', error)
      return []
    }

    console.log(`✅ Found ${data?.length || 0} users in area`)
    return data || []
  } catch (error) {
    console.error('❌ getUsersInArea error:', error)
    return []
  }
}

// Test connection
supabase.from('users').select('count').then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase connection error:', error)
  } else {
    console.log('✅ Supabase connected successfully')
  }
})
