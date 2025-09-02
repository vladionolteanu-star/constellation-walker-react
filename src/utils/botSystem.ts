import { supabase } from '../services/supabase'
import { generateStarColor } from './constants'

// Bucuresti bounding box
const BUCHAREST_BOUNDS = {
  minLat: 44.3500,
  maxLat: 44.5500,
  minLng: 25.9500,
  maxLng: 26.2500
}

// Zone populare din București pentru boți mai realiști
const BUCHAREST_HOTSPOTS = [
  { lat: 44.4268, lng: 26.1025, name: 'Centru Vechi' },
  { lat: 44.4378, lng: 26.0973, name: 'Universitate' },
  { lat: 44.4671, lng: 26.0852, name: 'Herăstrău' },
  { lat: 44.4363, lng: 26.1029, name: 'Piața Unirii' },
  { lat: 44.4460, lng: 26.0862, name: 'Piața Victoriei' },
  { lat: 44.4139, lng: 26.1236, name: 'Titan' },
  { lat: 44.4321, lng: 26.0488, name: 'Drumul Taberei' },
  { lat: 44.4798, lng: 26.1246, name: 'Pipera' },
  { lat: 44.4093, lng: 26.0907, name: 'Tineretului' },
  { lat: 44.4515, lng: 26.1333, name: 'Floreasca' }
]

export class BotSystem {
  private bots: Map<string, any> = new Map()
  private updateInterval: NodeJS.Timeout | null = null

  async createBots(count: number = 20) {
    console.log(`Creating ${count} bot users...`)
    
    for (let i = 0; i < count; i++) {
      const botId = `bot-${Date.now()}-${i}`
      const color = generateStarColor()
      
      // Alege o zonă random și adaugă variație
      const hotspot = BUCHAREST_HOTSPOTS[Math.floor(Math.random() * BUCHAREST_HOTSPOTS.length)]
      const position = {
        lat: hotspot.lat + (Math.random() - 0.5) * 0.01, // ~1km variație
        lng: hotspot.lng + (Math.random() - 0.5) * 0.01
      }

      // Creează bot user
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: botId,
          color_hash: color,
          created_at: new Date().toISOString(),
          last_seen: new Date().toISOString()
        })

      if (userError) {
        console.error(`Failed to create bot ${i}:`, userError)
        continue
      }

      // Adaugă poziția inițială
      const { error: posError } = await supabase
        .from('active_positions')
        .upsert({
          user_id: botId,
          lat: position.lat,
          lng: position.lng,
          updated_at: new Date().toISOString()
        })

      if (posError) {
        console.error(`Failed to set bot ${i} position:`, posError)
        continue
      }

      // Salvează bot în memorie pentru updates
      this.bots.set(botId, {
        id: botId,
        position,
        color,
        speed: 0.00001 + Math.random() * 0.00003, // Viteză variabilă
        direction: Math.random() * Math.PI * 2 // Direcție random
      })
    }

    console.log(`Created ${this.bots.size} bots successfully`)
    this.startMovement()
  }

  private startMovement() {
    // Update la fiecare 3 secunde
    this.updateInterval = setInterval(() => {
      this.updateBotPositions()
    }, 3000)
  }

  private async updateBotPositions() {
    for (const [botId, bot] of this.bots) {
      // Schimbă direcția ocazional
      if (Math.random() < 0.1) {
        bot.direction += (Math.random() - 0.5) * Math.PI / 2
      }

      // Calculează noua poziție
      const newLat = bot.position.lat + Math.cos(bot.direction) * bot.speed
      const newLng = bot.position.lng + Math.sin(bot.direction) * bot.speed

      // Verifică limitele și întoarce dacă e nevoie
      if (newLat < BUCHAREST_BOUNDS.minLat || newLat > BUCHAREST_BOUNDS.maxLat) {
        bot.direction = -bot.direction
      }
      if (newLng < BUCHAREST_BOUNDS.minLng || newLng > BUCHAREST_BOUNDS.maxLng) {
        bot.direction = Math.PI - bot.direction
      }

      // Update poziție
      bot.position.lat = Math.max(BUCHAREST_BOUNDS.minLat, Math.min(BUCHAREST_BOUNDS.maxLat, newLat))
      bot.position.lng = Math.max(BUCHAREST_BOUNDS.minLng, Math.min(BUCHAREST_BOUNDS.maxLng, newLng))

      // Update în database
      await supabase
        .from('active_positions')
        .upsert({
          user_id: botId,
          lat: bot.position.lat,
          lng: bot.position.lng,
          updated_at: new Date().toISOString()
        })
    }
  }

  async cleanup() {
    // Oprește updates
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    // Șterge boții din database
    for (const botId of this.bots.keys()) {
      await supabase.from('active_positions').delete().eq('user_id', botId)
      await supabase.from('users').delete().eq('id', botId)
    }

    this.bots.clear()
    console.log('Bots cleaned up')
  }
}

// Instanță globală
export const botSystem = new BotSystem()
