import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '../../services/supabase';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoidmxhZHN0YXIiLCJhIjoiY21lcXVrZWRkMDR2MDJrczczYTFvYTBvMiJ9.H36WPQ21h1CTjbEb32AT1g';

interface User {
  user_id: string;
  color: string;
  position: { lat: number; lng: number };
}

// 🎯 PERFORMANȚĂ EXTREMĂ - Memory Pool pentru Markeri
class MarkerPool {
  private available: HTMLDivElement[] = [];
  private active: Map<string, HTMLDivElement> = new Map();

  getMarker(userId: string, color: string): HTMLDivElement {
    let el = this.available.pop();
    if (!el) {
      el = document.createElement('div');
      el.className = 'user-marker';
      el.style.cssText = `
        width: 20px; height: 20px; border-radius: 50%; 
        border: 2px solid white; cursor: pointer;
        transition: none; will-change: transform;
      `;
    }
    
    el.style.backgroundColor = color;
    el.style.boxShadow = `0 0 10px ${color}`;
    this.active.set(userId, el);
    return el;
  }

  releaseMarker(userId: string): void {
    const el = this.active.get(userId);
    if (el) {
      this.active.delete(userId);
      this.available.push(el);
    }
  }

  cleanup(): void {
    this.active.clear();
    this.available = [];
  }
}

// 🚀 CACHE SISTEM pentru Conexiuni
class ConnectionCache {
  private cache: string = '';
  private features: any[] = [];

  shouldUpdate(users: User[]): boolean {
    const newHash = users
      .map(u => `${u.user_id}:${u.position.lat.toFixed(3)},${u.position.lng.toFixed(3)}`)
      .sort()
      .join('|');
    
    if (newHash !== this.cache) {
      this.cache = newHash;
      return true;
    }
    return false;
  }

  generateFeatures(users: User[]): any[] {
    this.features = [];
    
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        this.features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [users[i].position.lng, users[i].position.lat],
              [users[j].position.lng, users[j].position.lat]
            ]
          }
        });
      }
    }
    
    return this.features;
  }
}

const MapContainer: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  
  // 🎯 Singletons pentru performanță
  const markerPool = useRef<MarkerPool>(new MarkerPool());
  const connectionCache = useRef<ConnectionCache>(new ConnectionCache());
  const markers = useRef<Record<string, mapboxgl.Marker>>({});
  const userId = useRef(`user-${Date.now()}`);
  const channel = useRef<any>(null);
  
  // 🔄 Batching și Throttling
  const updateScheduled = useRef<boolean>(false);
  const lastUpdate = useRef<number>(0);
  
  // 🏗️ INIT MAP - Ultra Minimalist
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/vladstar/cmetspgr7003g01sc2aeub7yg',
      center: [26.1025, 44.4268],
      zoom: 13,
      pitch: 0, // ❌ ELIMINAT pitch pentru performanță
      
      // 🚀 SETĂRI ULTRA-PERFORMANTE
      maxBounds: [20.2201, 43.6884, 29.7151, 48.2653],
      maxZoom: 16,
      minZoom: 10,
      renderWorldCopies: false,
      trackResize: false,
      preserveDrawingBuffer: false,
      antialias: false,
      fadeDuration: 0,
      crossSourceCollisions: false,
      collectResourceTiming: false,
      maxTileCacheSize: 20,
      transformRequest: undefined
    });

    map.current.once('load', initMap);
    return cleanup;
  }, []);

  // 🎯 INIT - O singură dată
  const initMap = useCallback(() => {
    if (!map.current) return;
    
    // Single layer - PERFORMANȚĂ MAXIMĂ
    map.current!.addSource('connections', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      buffer: 0,
      tolerance: 2,
      lineMetrics: false
    });

    map.current!.addLayer({
      id: 'connections',
      type: 'line',
      source: 'connections',
      paint: {
        'line-color': '#00ffff',
        'line-width': 1.5,
        'line-opacity': 0.7
      }
    });

    // Adaugă boti static
    const bots = [
      { user_id: 'bot-alpha', color: '#ff00ff', position: { lat: 44.4268, lng: 26.1025 }},
      { user_id: 'bot-beta', color: '#ff00ff', position: { lat: 44.425, lng: 26.105 }},
      { user_id: 'bot-gamma', color: '#ff00ff', position: { lat: 44.429, lng: 26.103 }},
      { user_id: 'bot-delta', color: '#ff00ff', position: { lat: 44.435, lng: 26.095 }},
      { user_id: 'bot-epsilon', color: '#ff00ff', position: { lat: 44.420, lng: 26.115 }}
    ];

    const initialUsers: Record<string, User> = {};
    bots.forEach(bot => {
      addUserToMap(bot);
      initialUsers[bot.user_id] = bot;
    });
    setUsers(initialUsers);
    
    setupRealtime();
    getCurrentLocation();
  }, []);

  // 🎯 MARKER MANAGEMENT - Memory Pool
  const addUserToMap = useCallback((user: User) => {
    if (!map.current) return;
    
    if (markers.current[user.user_id]) {
      markers.current[user.user_id].remove();
      markerPool.current.releaseMarker(user.user_id);
    }

    const el = markerPool.current.getMarker(user.user_id, user.color);
    
    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([user.position.lng, user.position.lat])
      .addTo(map.current!);

    markers.current[user.user_id] = marker;
  }, []);

  // 🔗 REALTIME - Throttling Agresiv
  const setupRealtime = useCallback(() => {
    channel.current = supabase.channel(`constellation-${userId.current}`, {
      config: { presence: { key: userId.current }}
    });
    
    let debounceTimer: NodeJS.Timeout;
    
    const handlePresenceUpdate = (state: any) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        Object.entries(state).forEach(([key, presences]: [string, any]) => {
          const presence = presences[0];
          if (presence?.user_id && 
              presence.user_id !== userId.current && 
              !presence.user_id.includes('bot')) {
            
            const user: User = {
              user_id: presence.user_id,
              color: '#00ffff',
              position: presence.position
            };
            
            addUserToMap(user);
            setUsers(prev => ({ ...prev, [user.user_id]: user }));
          }
        });
      }, 1000); // 1 secundă debounce
    };

    channel.current
      .on('presence', { event: 'sync' }, () => {
        handlePresenceUpdate(channel.current.presenceState());
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.user_id !== userId.current && !presence.user_id.includes('bot')) {
            const user: User = {
              user_id: presence.user_id,
              color: '#00ffff',
              position: presence.position
            };
            addUserToMap(user);
            setUsers(prev => ({ ...prev, [user.user_id]: user }));
          }
        });
      })
      .subscribe();
  }, [addUserToMap]);

  // 📍 GPS - Rate Limited
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    const options = {
      enableHighAccuracy: false, // ❌ Dezactivat pentru performanță
      timeout: 10000,
      maximumAge: 60000 // 1 minut cache
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const myUser: User = {
          user_id: userId.current,
          color: '#00ff00',
          position: { lat: latitude, lng: longitude }
        };
        
        addUserToMap(myUser);
        setUsers(prev => ({ ...prev, [myUser.user_id]: myUser }));
        
        channel.current?.track({
          user_id: myUser.user_id,
          color: myUser.color,
          position: myUser.position,
          online_at: new Date().toISOString()
        });

        map.current?.jumpTo({ center: [longitude, latitude], zoom: 14 });
      },
      () => {
        // Fallback silent
        const fallback: User = {
          user_id: userId.current,
          color: '#00ff00',
          position: { lat: 44.427, lng: 26.107 }
        };
        
        addUserToMap(fallback);
        setUsers(prev => ({ ...prev, [fallback.user_id]: fallback }));
        channel.current?.track({
          user_id: fallback.user_id,
          color: fallback.color,
          position: fallback.position,
          online_at: new Date().toISOString()
        });
      },
      options
    );
  }, [addUserToMap]);

  // 🎯 CONNECTION UPDATES - Batched & Cached
  const scheduleConnectionUpdate = useCallback(() => {
    if (updateScheduled.current) return;
    
    updateScheduled.current = true;
    
    requestAnimationFrame(() => {
      const now = Date.now();
      if (now - lastUpdate.current < 3000) { // 3 secunde minimum
        updateScheduled.current = false;
        return;
      }
      
      const userList = Object.values(users);
      
      if (userList.length >= 2 && connectionCache.current.shouldUpdate(userList)) {
        const features = connectionCache.current.generateFeatures(userList);
        const source = map.current?.getSource('connections') as mapboxgl.GeoJSONSource;
        source?.setData({ type: 'FeatureCollection', features });
        lastUpdate.current = now;
      }
      
      updateScheduled.current = false;
    });
  }, [users]);

  // 🔄 Effect pentru conexiuni
  useEffect(() => {
    scheduleConnectionUpdate();
  }, [users, scheduleConnectionUpdate]);

  // 📍 Position tracking - Foarte rar
  useEffect(() => {
    if (!channel.current) return;

    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const updatedPosition = { lat: latitude, lng: longitude };

            // Update foarte rar
            channel.current.track({
              user_id: userId.current,
              color: '#00ff00',
              position: updatedPosition,
              online_at: new Date().toISOString()
            });

            setUsers(prev => ({
              ...prev,
              [userId.current]: {
                ...prev[userId.current],
                position: updatedPosition
              }
            }));

            markers.current[userId.current]?.setLngLat([longitude, latitude]);
          },
          null,
          { maximumAge: 120000, timeout: 15000, enableHighAccuracy: false }
        );
      }
    }, 30000); // 30 secunde - foarte rar

    return () => clearInterval(interval);
  }, []);

  // 🧹 CLEANUP Total
  const cleanup = useCallback(() => {
    if (channel.current) {
      channel.current.untrack();
      channel.current.unsubscribe();
    }
    
    Object.values(markers.current).forEach(marker => marker.remove());
    markerPool.current.cleanup();
    
    map.current?.remove();
  }, []);

  return <div ref={mapContainer} className="w-full h-screen bg-black" />;
};

export default MapContainer;
