// src/utils/botSystem.ts
import { supabase } from "../services/supabase"

export interface User {
  user_id: string
  color: string
  position: {
    lat: number
    lng: number
  }
}

// 🔹 Creează boți statici (poziții fixe)
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
  }
}

// 🔹 Generează un bot nou dinamic
export function generateBot(id: string, lat: number, lng: number): User {
  return {
    user_id: id,
    color: "#ff00ff",
    position: { lat, lng },
  }
}

// 🔹 Actualizează poziția unui bot random (ex: simulare mișcare)
export function moveBotRandom(bot: User): User {
  const latOffset = (Math.random() - 0.5) * 0.001
  const lngOffset = (Math.random() - 0.5) * 0.001
  return {
    ...bot,
    position: {
      lat: bot.position.lat + latOffset,
      lng: bot.position.lng + lngOffset,
    },
  }
}

// 🔹 Trimite update la Supabase
export async function syncUserToSupabase(user: User) {
  try {
    const channel = supabase.channel("user-tracking")
    await channel.track(user)
  } catch (err) {
    console.error("Supabase sync error:", err)
  }
}
