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

export async function syncUserToSupabase(user: User, channel?: RealtimeChannel) {
  try {
    const supabaseChannel = channel || supabase.channel("user-tracking");
    await supabaseChannel.track(user);
    if (!channel) supabaseChannel.subscribe();
  } catch (err) {
    console.error("Supabase sync error:", err);
  }
}
