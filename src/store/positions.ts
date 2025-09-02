// src/store/positions.ts
import { create } from 'zustand';
import { supabase } from '@/services/supabase';

export type Position = {
  user_id: string;
  lat: number;
  lng: number;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  updated_at: string; // ISO
};

type State = {
  positions: Record<string, Position>;
  ready: boolean;
  subscribeRealtime: () => Promise<() => void>;
  fetchInitial: (sinceMinutes?: number) => Promise<void>;
  upsertMyPosition: (p: Omit<Position, 'updated_at'>) => Promise<void>;
};

export const usePositions = create<State>((set, get) => ({
  positions: {},
  ready: false,

  fetchInitial: async (sinceMinutes = 5) => {
    const { data, error } = await supabase
      .from('active_positions')
      .select('*')
      .gte('updated_at', new Date(Date.now() - sinceMinutes * 60_000).toISOString());

    if (error) {
      console.error('[fetchInitial] ', error);
      return;
    }
    const map: Record<string, Position> = {};
    for (const row of data as any[]) {
      map[row.user_id] = row as Position;
    }
    set({ positions: map, ready: true });
  },

  subscribeRealtime: async () => {
    // IMPORTANT: un singur canal pentru toate evenimentele
    const channel = supabase
      .channel('realtime:active_positions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_positions' },
        (payload) => {
          const state = get();
          const positions = { ...state.positions };

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as any;
            positions[row.user_id] = {
              user_id: row.user_id,
              lat: Number(row.lat),
              lng: Number(row.lng),
              altitude: row.altitude,
              speed: row.speed,
              heading: row.heading,
              updated_at: row.updated_at,
            };
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            delete positions[oldRow.user_id];
          }

          set({ positions });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] status:', status);
      });

    // return unsubscribe
    return () => {
      supabase.removeChannel(channel);
    };
  },

  upsertMyPosition: async (p) => {
    const { error } = await supabase
      .from('active_positions')
      .upsert(
        {
          ...p,
          lat: p.lat,
          lng: p.lng,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    if (error) console.error('[upsertMyPosition] ', error);
  },
}));
