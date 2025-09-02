import { supabase } from '../services/supabase'
import { STAR_COLORS } from './constants'

class Bot {
  id: string
  color: string
  position: { lat: number; lng: number }
  interval: number
  channel: any
  
  constructor() {
    this.id = `bot-${crypto.randomUUID()}`
    this.color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]
    this.position = {
      lat: 44.4268 + (Math.random() - 0.5) * 0.01,
      lng: 26.1025 + (Math.random() - 0.5) * 0.01
    }
    this.interval = 0
    this.channel = supabase.channel('online-users')
  }

  async start() {
    // Connect to presence channel
    await this.channel
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await this.updatePresence()
          this.startMoving()
        }
      })
  }

  private async updatePresence() {
    await this.channel.track({
      user_id: this.id,
      color: this.color,
      position: this.position
    })
  }

  private startMoving() {
    this.interval = window.setInterval(async () => {
      // Random walk
      this.position.lat += (Math.random() - 0.5) * 0.0001
      this.position.lng += (Math.random() - 0.5) * 0.0001

      await this.updatePresence()
    }, 2000)
  }

  stop() {
    clearInterval(this.interval)
    this.channel.untrack()
    this.channel.unsubscribe()
  }
}

class BotSystem {
  private bots: Bot[] = []

  createBots(count: number) {
    for (let i = 0; i < count; i++) {
      const bot = new Bot()
      this.bots.push(bot)
      bot.start()
    }
  }

  cleanup() {
    this.bots.forEach(bot => bot.stop())
    this.bots = []
  }
}

export const botSystem = new BotSystem()
