import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '../../services/supabase';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoidmxhZHN0YXIiLCJhIjoiY21lcXVrZWRkMDR2MDJrczczYTFvYTBvMiJ9.H36WPQ21h1CTjbEb32AT1g';

const ROMANIA_BOUNDS: [number, number, number, number] = [20.2201, 43.6884, 29.7151, 48.2653];

interface User {
  user_id: string;
  color: string;
  position: {
    lat: number;
    lng: number;
  };
}

const MapContainer: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  const markers = useRef<Record<string, mapboxgl.Marker>>({});
  const userId = useRef(`user-${Date.now()}`);
  const channel = useRef<any>(null);
  
  // 🚀 CRITICAL PERFORMANCE REFS
  const connectionUpdateTimeout = useRef<NodeJS.Timeout>();
  const lastConnectionsHash = useRef<string>('');
  const isUpdatingConnections = useRef<boolean>(false);
  const lastPositionUpdate = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  // 🎯 Memoized static bots - compute once
  const staticBots = useMemo(() => ([
    {
      user_id: 'bot-alpha',
      color: '#ff00ff',
      position: { lat: 44.4268, lng: 26.1025 }
    },
    {
      user_id: 'bot-beta',
      color: '#ff00ff', 
      position: { lat: 44.425, lng: 26.105 }
    },
    {
      user_id: 'bot-gamma',
      color: '#ff00ff',
      position: { lat: 44.429, lng: 26.103 }
    },
    {
      user_id: 'bot-delta',
      color: '#ff00ff',
      position: { lat: 44.435, lng: 26.095 }
    },
    {
      user_id: 'bot-epsilon',
      color: '#ff00ff',
      position: { lat: 44.420, lng: 26.115 }
    }
  ]), []);

  // 🔧 Optimized map setup with minimal settings
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/vladstar/cmetspgr7003g01sc2aeub7yg',
      center: [26.1025, 44.4268],
      zoom: 14,
      pitch: 45,
      
      // 🚀 EXTREME PERFORMANCE OPTIMIZATIONS
      maxBounds: ROMANIA_BOUNDS,
      maxZoom: 17,
      minZoom: 10,
      renderWorldCopies: false,
      trackResize: false,
      preserveDrawingBuffer: false,
      antialias: false,
      optimizeForTerrain: false,
      fadeDuration: 0,
      crossSourceCollisions: false,
      collectResourceTiming: false,
      refreshExpiredTiles: false,
      maxTileCacheSize: 50, // Reduce memory
      transformRequest: undefined, // Disable transforms
    });

    map.current.on('load', initializeMap);

    return cleanup;
  }, []);

  // 🎯 Single initialization function
  const initializeMap = useCallback(() => {
    if (!map.current) return;
    
    setupMapLayers();
    addStaticBots();
    setupRealtime();
    getCurrentLocation();
  }, []);

  // 🎨 Optimized layers - minimal complexity
  const setupMapLayers = useCallback(() => {
    if (!map.current) return;

    map.current.addSource('connections', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      buffer: 0,
      maxzoom: 15,
      tolerance: 1, // Increased for performance
      lineMetrics: false
    });

    // Single layer instead of 3 - HUGE performance boost
    map.current.addLayer({
      id: 'connections',
      type: 'line',
      source: 'connections',
      paint: {
        'line-color': '#00ffff',
        'line-width': 2,
        'line-opacity': 0.6
      }
    });
  }, []);

  // ⚡ Add static bots once
  const addStaticBots = useCallback(() => {
    const initialUsers: Record<string, User> = {};
    
    staticBots.forEach(bot => {
      addUserToMap(bot);
      initialUsers[bot.user_id] = bot;
    });
    
    setUsers(initialUsers);
  }, [staticBots]);

  // 🔗 Optimized realtime setup
  const setupRealtime = useCallback(() => {
    channel.current = supabase.channel(`constellation-${userId.current}`, {
      config: {
        presence: { key: userId.current },
        broadcast: { self: false }
      }
    });
    
    // Debounced sync handler
    let syncTimeout: NodeJS.Timeout;
    
    channel.current
      .on('presence', { event: 'sync' }, () => {
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
          const state = channel.current.presenceState();
          
          Object.entries(state).forEach(([key, presences]) => {
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
        }, 500); // Increased debounce
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.user_id !== userId.current && 
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
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          if (presence.user_id !== userId.current && 
              !presence.user_id.includes('bot')) {
            removeUserFromMap(presence.user_id);
          }
        });
      })
      .subscribe();
  }, []);

  // 🗑️ Clean user removal
  const removeUserFromMap = useCallback((userId: string) => {
    if (markers.current[userId]) {
      markers.current[userId].remove();
      delete markers.current[userId];
    }
    setUsers(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  }, []);

  // 🎯 Hyper-optimized marker creation
  const addUserToMap = useCallback((user: User) => {
    if (!map.current) return;
    
    // Remove existing
    if (markers.current[user.user_id]) {
      markers.current[user.user_id].remove();
    }

    // Minimal DOM manipulation
    const el = document.createElement('div');
    el.className = 'marker'; // Use CSS class instead of inline styles
    
    // Set color via CSS custom property for better performance
    if (user.user_id === userId.current) {
      el.style.setProperty('--marker-color', '#00ff00');
    } else if (user.user_id.includes('bot')) {
      el.style.setProperty('--marker-color', '#ff00ff');
    } else {
      el.style.setProperty('--marker-color', '#00ffff');
    }

    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([user.position.lng, user.position.lat])
      .addTo(map.current);

    markers.current[user.user_id] = marker;
  }, []);

  // 📍 Simplified location getter
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;

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
        
        // Track once
        channel.current?.track({
          user_id: myUser.user_id,
          color: myUser.color,
          position: myUser.position,
          online_at: new Date().toISOString()
        });

        map.current?.jumpTo({ center: [longitude, latitude], zoom: 15 });
      },
      () => {
        // Fallback
        const fallbackUser: User = {
          user_id: userId.current,
          color: '#00ff00',
          position: { lat: 44.427, lng: 26.107 }
        };
        
        addUserToMap(fallbackUser);
        setUsers(prev => ({ ...prev, [fallbackUser.user_id]: fallbackUser }));
        
        channel.current?.track({
          user_id: fallbackUser.user_id,
          color: fallbackUser.color,
          position: fallbackUser.position,
          online_at: new Date().toISOString()
        });
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  }, [addUserToMap]);

  // 🧹 Cleanup function
  const cleanup = useCallback(() => {
    // Clear all timeouts
    if (connectionUpdateTimeout.current) {
      clearTimeout(connectionUpdateTimeout.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Clean realtime
    if (channel.current) {
      channel.current.untrack();
      channel.current.unsubscribe();
      channel.current = null;
    }
    
    // Clean markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};
    
    // Clean map
    map.current?.remove();
  }, []);

  // 🚀 ULTRA OPTIMIZED CONNECTION UPDATES
  const updateConnections = useCallback((userList: User[]) => {
    if (!map.current || isUpdatingConnections.current || userList.length < 2) return;
    
    // Create hash for change detection
    const positionsHash = userList
      .map(u => `${u.user_id}:${u.position.lat.toFixed(4)},${u.position.lng.toFixed(4)}`)
      .sort()
      .join('|');
    
    // Skip if no changes
    if (positionsHash === lastConnectionsHash.current) return;
    
    isUpdatingConnections.current = true;
    lastConnectionsHash.current = positionsHash;
    
    // Use requestAnimationFrame for smooth updates
    animationFrameRef.current = requestAnimationFrame(() => {
      const features = [];
      
      // Create connections
      for (let i = 0; i < userList.length; i++) {
        for (let j = i + 1; j < userList.length; j++) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [userList[i].position.lng, userList[i].position.lat],
                [userList[j].position.lng, userList[j].position.lat]
              ]
            }
          });
        }
      }

      const source = map.current?.getSource('connections') as mapboxgl.GeoJSONSource;
      source?.setData({ type: 'FeatureCollection', features });
      
      isUpdatingConnections.current = false;
    });
  }, []);

  // 📊 Throttled connection updates
  useEffect(() => {
    const userList = Object.values(users);
    
    // Clear existing timeout
    if (connectionUpdateTimeout.current) {
      clearTimeout(connectionUpdateTimeout.current);
    }
    
    // Throttle updates to every 2 seconds
    connectionUpdateTimeout.current = setTimeout(() => {
      updateConnections(userList);
    }, 2000);
    
    return () => {
      if (connectionUpdateTimeout.current) {
        clearTimeout(connectionUpdateTimeout.current);
      }
    };
  }, [users, updateConnections]);

  // 📍 Optimized position tracking
  useEffect(() => {
    if (!channel.current) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastPositionUpdate.current < 15000) return; // 15 second throttle
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            
            if (latitude >= ROMANIA_BOUNDS[1] && latitude <= ROMANIA_BOUNDS[3] &&
                longitude >= ROMANIA_BOUNDS[0] && longitude <= ROMANIA_BOUNDS[2]) {
              
              lastPositionUpdate.current = now;
              
              const updatedPosition = { lat: latitude, lng: longitude };

              // Update presence (throttled)
              channel.current.track({
                user_id: userId.current,
                color: '#00ff00',
                position: updatedPosition,
                online_at: new Date().toISOString()
              });

              // Update local state
              setUsers(prev => ({
                ...prev,
                [userId.current]: {
                  ...prev[userId.current],
                  position: updatedPosition
                }
              }));

              // Update marker
              markers.current[userId.current]?.setLngLat([longitude, latitude]);
            }
          },
          null,
          { maximumAge: 30000, timeout: 10000, enableHighAccuracy: false }
        );
      }
    }, 20000); // Very slow updates - 20 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div ref={mapContainer} className="w-full h-screen bg-black" />
      <style jsx>{`
        .marker {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid white;
          background-color: var(--marker-color);
          box-shadow: 0 0 15px var(--marker-color);
          cursor: pointer;
        }
      `}</style>
    </>
  );
};

export default MapContainer;
