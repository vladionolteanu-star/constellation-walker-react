import { supabase } from '../services/supabase'
import { generateStarColor } from './constants'

export async function createTestUsers(count: number = 5) {
  console.log(`🚀 Creating ${count} test users...`)
  
  const centerLat = 44.4268 // București centru
  const centerLng = 26.1025
  
  for (let i = 0; i < count; i++) {
    const testUserId = `test-user-${Date.now()}-${i}`
    const color = generateStarColor()
    
    // Poziție random în jurul centrului (rază ~1km)
    const lat = centerLat + (Math.random() - 0.5) * 0.01
    const lng = centerLng + (Math.random() - 0.5) * 0.01
    
    // Creează user
    await supabase.from('users').upsert({
      id: testUserId,
      color_hash: color,
      created_at: new Date().toISOString(),
      last_seen: new Date().toISOString()
    })
    
    // Setează poziție
    await supabase.from('active_positions').upsert({
      user_id: testUserId,
      lat: lat,
      lng: lng,
      updated_at: new Date().toISOString()
    })
    
    console.log(`✅ Created test user ${i + 1}/${count}`)
  }
  
  console.log('🎉 All test users created!')
}

// Expune funcția global pentru testare
if (typeof window !== 'undefined') {
  (window as any).createTestUsers = createTestUsers
}
