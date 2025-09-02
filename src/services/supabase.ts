import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wajgxfgeumpztjyafyem.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhamd4ZmdldW1wenRqeWFmeWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0MDcxMDYsImV4cCI6MjA1MDk4MzEwNn0.qGu5u8ZqeEXYHwAYA4iARW0L0BB8XtwwZpxIKMp6Afc'

console.log('🔑 Initializing Supabase...')

// Creează client cu headers explicit
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  global: {
    headers: {
      'apikey': SUPABASE_ANON_KEY
    }
  },
  db: {
    schema: 'public'
  }
})

// Test manual direct
fetch('https://wajgxfgeumpztjyafyem.supabase.co/rest/v1/users?select=id&limit=1', {
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
})
.then(r => r.json())
.then(data => console.log('✅ Manual test successful:', data))
.catch(err => console.error('❌ Manual test failed:', err))

// Test prin Supabase client
supabase.from('users').select('count').then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase client test failed:', error)
  } else {
    console.log('✅ Supabase client connected!', data)
  }
})

export const ensureUserExists = async (userId: string, colorHash: string) => {
  console.log('🔵 Creating user:', userId)
  
  try {
    // Test direct cu fetch mai întâi
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: userId,
        color_hash: colorHash,
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString()
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('User creation failed:', error)
      
      // Fallback - try with Supabase client
      const { data, error: clientError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          color_hash: colorHash,
          created_at: new Date().toISOString(),
          last_seen: new Date().toISOString()
        })
        .select()
        .single()

      if (clientError) {
        console.error('Supabase client also failed:', clientError)
        return { id: userId, color_hash: colorHash }
      }
      
      return data || { id: userId, color_hash: colorHash }
    }

    const data = await response.json()
    console.log('✅ User created via fetch:', data)
    return data[0] || { id: userId, color_hash: colorHash }
    
  } catch (error) {
    console.error('ensureUserExists error:', error)
    return { id: userId, color_hash: colorHash }
  }
}

export const updateUserPosition = async (userId: string, position: { lat: number; lng: number }) => {
  console.log('📍 Updating position:', position)
  
  try {
    // Direct fetch approach
    const response = await fetch(`${SUPABASE_URL}/rest/v1/active_positions`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        lat: position.lat,
        lng: position.lng,
        updated_at: new Date().toISOString()
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Position update failed:', error)
      return { error }
    }

    console.log('✅ Position updated')
    return { error: null }
    
  } catch (error) {
    console.error('updateUserPosition error:', error)
    return { error }
  }
}

export const getUsersInArea = async () => {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/active_positions?select=*&updated_at=gte.${new Date(Date.now() - 5 * 60 * 1000).toISOString()}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    )

    if (!response.ok) {
      console.error('Failed to get users:', await response.text())
      return []
    }

    const data = await response.json()
    console.log(`Found ${data?.length || 0} active users`)
    return data || []
    
  } catch (error) {
    console.error('getUsersInArea error:', error)
    return []
  }
}

// Funcție helper pentru test manual
export const testSupabase = async () => {
  console.log('🧪 Running Supabase tests...')
  
  // Test 1: Get users count
  const response1 = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY
    }
  })
  console.log('Test 1 - Get users:', response1.status, await response1.json())
  
  // Test 2: Get active positions
  const response2 = await fetch(`${SUPABASE_URL}/rest/v1/active_positions?select=*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY  
    }
  })
  console.log('Test 2 - Get positions:', response2.status, await response2.json())
}

// Export pentru debugging în console
if (typeof window !== 'undefined') {
  (window as any).testSupabase = testSupabase
}
"Force Supabase auth headers"
