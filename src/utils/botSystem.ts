import { supabase } from "../services/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface User {
  user_id: string;
  color: string;
  position: {
    lat: number;
    lng: number;
  };
}

export function getStaticBots(): Record<string, User> {
  return {
    "bot-alpha": {
      user_id: "bot-alpha",
      color: "#ff00ff",
      position: { lat: 44.4268, lng: 26.1025 },
    },
    "bot-beta": {
      user_id: "bot-beta",
      color: "#ff00ff",
      position: { lat: 44.425, lng: 26.105 },
    },
  };
}

export function generateBot(id: string, lat: number, lng: number): User {
  return {
    user_id: id,
    color: "#ff00ff",
    position: { lat, lng },
  };
}

export function moveBotRandom(bot: User): User {
  const latOffset = (Math.random() - 0.5) * 0.001;
  const lngOffset = (Math.random() - 0.5) * 0.001;
  return {
    ...bot,
    position: {
      lat: bot.position.lat + latOffset,
      lng: bot.position.lng + lngOffset,
    },
  };
}

export async function syncUserToSupabase(user: User, channel?: RealtimeChannel | null) {
  try {
    if (!channel) {
      const tempChannel = supabase.channel("user-tracking");
      await tempChannel.track(user);
      tempChannel.subscribe();
      setTimeout(() => tempChannel.unsubscribe(), 1000);
    } else {
      await channel.track(user);
    }
  } catch (err) {
    console.error("Supabase sync error:", err);
  }
}

// Sistem de gestionare a botilor
class BotSystem {
  private bots: Map<string, User> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private channel: RealtimeChannel | null = null;

  constructor() {
    this.bots = new Map();
    this.intervals = new Map();
  }

  createBots(count: number = 1) {
    // Oprește botii existenți
    this.cleanup();

    // Crează canal pentru boti
    this.channel = supabase.channel("bot-tracking");
    
    // Generează boti noi
    for (let i = 0; i < count; i++) {
      const botId = `bot-${Date.now()}-${i}`;
      const lat = 44.4268 + (Math.random() - 0.5) * 0.01;
      const lng = 26.1025 + (Math.random() - 0.5) * 0.01;
      
      const bot = generateBot(botId, lat, lng);
      this.bots.set(botId, bot);
      
      // Sincronizare inițială
      syncUserToSupabase(bot, this.channel);
      
      // Mișcare aleatorie
      const interval = setInterval(() => {
        const currentBot = this.bots.get(botId);
        if (currentBot) {
          const movedBot = moveBotRandom(currentBot);
          this.bots.set(botId, movedBot);
          syncUserToSupabase(movedBot, this.channel);
        }
      }, 5000 + Math.random() * 5000); // Mișcare la 5-10 secunde
      
      this.intervals.set(botId, interval);
    }
    
    // Subscribe la canal
    if (this.channel) {
      this.channel.subscribe();
    }
    
    console.log(`🤖 Created ${count} bot(s)`);
  }

  cleanup() {
    // Oprește toate intervalele
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    
    // Curăță botii
    this.bots.clear();
    
    // Închide canalul
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    
    console.log("🧹 Bots cleaned up");
  }

  getBots(): User[] {
    return Array.from(this.bots.values());
  }
}

// Exportă instanța singleton
export const botSystem = new BotSystem();
