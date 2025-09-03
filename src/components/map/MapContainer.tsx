import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '../../services/supabase';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoidmxhZHN0YXIiLCJhIjoiY21lcXVrZWRkMDR2MDJrczczYTFvYTBvMiJ9.H36WPQ21h1CTjbEb32AT1g';

// Límite geografice România pentru optimizare
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
  const lastUpdate = useRef<number>(0);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/vladstar/cmetspgr7003g01sc2aeub7yg',
      center: [26.1025, 44.4268],
      zoom: 14,
      pitch: 45,
      maxBounds: ROMANIA_BOUNDS,
      maxZoom: 18,
      minZoom: 8,
      renderWorldCopies: false,
      trackResize: false,
      preserveDrawingBuffer: false,
      antialias: false,
      optimizeForTerrain: false,
      fadeDuration: 0,
      crossSourceCollisions: false
    });

    map.current.on('load', () => {
      setupMapLayers();
      addStaticBots();
      setupRealtime();
      getCurrentLocation();
    });

    return () => {
      cleanupRealtime();
      map.current?.remove();
    };
  }, []);

  const addStaticBots = () => {
    // 5 boti în locații diferite din România
    const staticBots: User[] = [
      {
        user_id: 'bot-alpha',
        color: '#ff00ff',
        position: { lat: 44.4268, lng: 26.1025 } // București Centru
      },
      {
        user_id: 'bot-beta',
        color: '#ff00ff', 
        position: { lat: 44.425, lng: 26.105 } // București Universitate
      },
      {
        user_id: 'bot-gamma',
        color: '#ff00ff',
        position: { lat: 44.429, lng: 26.103 } // București Nord
      },
      {
        user_id: 'bot-delta',
        color: '#ff00ff',
        position: { lat: 44.435, lng: 26.095 } // București Vest
      },
      {
        user_id: 'bot-epsilon',
        color: '#ff00ff',
        position: { lat: 44.420, lng: 26.115 } // București Est
      }
    ];

    const initialUsers: Record<string, User> = {};
    staticBots.forEach(bot => {
      addUserToMap(bot);
      initialUsers[bot.user_id] = bot;
    });

    setUsers(initialUsers);
  };

  const setupMapLayers = () => {
    if (!map.current) return;

    map.current.addSource('connections', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      buffer: 0,
      maxzoom: 16,
      tolerance: 0.375
    });

    // Layer-uri optimizate pentru conexiuni cyan
    map.current.addLayer({
      id: 'connection-glow-1',
      type: 'line',
      source: 'connections',
      paint: {
        'line-color': '#00ffff',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 12, 18, 20],
        'line-opacity': 0.15,
        'line-blur': ['interpolate', ['linear'], ['zoom'], 10, 10, 18, 20]
      }
    });

    map.current.addLayer({
      id: 'connection-glow-2',
      type: 'line',
      source: 'connections',
      paint: {
        'line-color': '#00ffff',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 6, 18, 10],
        'line-opacity': 0.4,
        'line-blur': ['interpolate', ['linear'], ['zoom'], 10, 4, 18, 8]
      }
    });

    map.current.addLayer({
      id: 'connection-core',
      type: 'line',
      source: 'connections',
      paint: {
        'line-color': '#ffffff',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 18, 2.5],
        'line-opacity': 0.9
      }
    });
  };

  const setupRealtime = () => {
    channel.current = supabase.channel('constellation-users-v2', {
      config: {
        presence: {
          key: userId.current
        },
        broadcast: { self: false },
        private: false
      }
    });
    
    let updateTimeout: NodeJS.Timeout;
    
    channel.current
      .on('presence', { event: 'sync' }, () => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          const state = channel.current.presenceState();
          console.log('🔄 Presence sync:', Object.keys(state).length, 'users');
          
          Object.entries(state).forEach(([key, presences]) => {
            const presence = presences[0];
            if (presence && presence.user_id && presence.user_id !== userId.current && !presence.user_id.includes('bot')) {
              const user: User = {
                user_id: presence.user_id,
                color: presence.color || '#00ffff',
                position: presence.position
              };
              addUserToMap(user);
              setUsers(prev => ({ ...prev, [user.user_id]: user }));
            }
          });
        }, 300);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 User joined:', key);
        newPresences.forEach((presence: any) => {
          if (presence.user_id !== userId.current && !presence.user_id.includes('bot')) {
            const user: User = {
              user_id: presence.user_id,
              color: presence.color || '#00ffff',
              position: presence.position
            };
            addUserToMap(user);
            setUsers(prev => ({ ...prev, [user.user_id]: user }));
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left:', key);
        leftPresences.forEach((presence: any) => {
          if (presence.user_id !== userId.current && !presence.user_id.includes('bot')) {
            removeUserFromMap(presence.user_id);
          }
        });
      })
      .subscribe();
  };

  const removeUserFromMap = (userId: string) => {
    if (markers.current[userId]) {
      markers.current[userId].remove();
      delete markers.current[userId];
    }
    setUsers(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  };

  const addUserToMap = (user: User) => {
    if (!map.current) return;
    
    if (markers.current[user.user_id]) {
      markers.current[user.user_id].remove();
    }

    const el = document.createElement('div');
    el.style.cssText = `
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      cursor: pointer;
      transition: transform 0.2s ease;
      z-index: 10;
    `;
    
    if (user.user_id === userId.current) {
      el.style.backgroundColor = '#00ff00';
      el.style.boxShadow = '0 0 30px #00ff00';
    } else if (user.user_id.includes('bot')) {
      el.style.backgroundColor = '#ff00ff';
      el.style.boxShadow = '0 0 30px #ff00ff';
    } else {
      el.style.backgroundColor = '#00ffff';
      el.style.boxShadow = '0 0 30px #00ffff';
    }

    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.3)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
    });

    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat([user.position.lng, user.position.lat])
      .addTo(map.current);

    markers.current[user.user_id] = marker;
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (latitude >= ROMANIA_BOUNDS[1] && latitude <= ROMANIA_BOUNDS[3] &&
            longitude >= ROMANIA_BOUNDS[0] && longitude <= ROMANIA_BOUNDS[2]) {
          
          const myUser: User = {
            user_id: userId.current,
            color: '#00ff00',
            position: { lat: latitude, lng: longitude }
          };
          
          addUserToMap(myUser);
          setUsers(prev => ({ ...prev, [myUser.user_id]: myUser }));
          
          if (channel.current) {
            channel.current.track({
              user_id: myUser.user_id,
              color: myUser.color,
              position: myUser.position,
              online_at: new Date().toISOString()
            });
          }

          map.current?.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            duration: 1000
          });
        }
      },
      () => {
        const fallbackUser: User = {
          user_id: userId.current,
          color: '#00ff00',
          position: { lat: 44.427, lng: 26.107 }
        };
        
        addUserToMap(fallbackUser);
        setUsers(prev => ({ ...prev, [fallbackUser.user_id]: fallbackUser }));
        
        if (channel.current) {
          channel.current.track({
            user_id: fallbackUser.user_id,
            color: fallbackUser.color,
            position: fallbackUser.position,
            online_at: new Date().toISOString()
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000
      }
    );
  };

  const cleanupRealtime = () => {
    if (channel.current) {
      channel.current.untrack();
      channel.current.unsubscribe();
      channel.current = null;
    }
  };

  // 🌟 REȚEA COMPLETĂ - Conexiuni între TOȚI userii (inclusiv boti)
  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdate.current < 800) return; // Throttle la 800ms
    lastUpdate.current = now;

    if (!map.current) return;
    
    const userList = Object.values(users);
    if (userList.length < 2) return;

    console.log(`🌐 Updating connections for ${userList.length} users/bots`);

    const features = [];
    
    // ✨ CONEXIUNI ÎNTRE TOȚI - fiecare cu fiecare (mesh network)
    for (let i = 0; i < userList.length; i++) {
      for (let j = i + 1; j < userList.length; j++) {
        const user1 = userList[i];
        const user2 = userList[j];
        
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [user1.position.lng, user1.position.lat],
              [user2.position.lng, user2.position.lat]
            ]
          },
          properties: {
            // Metadata pentru debugging
            from: user1.user_id,
            to: user2.user_id,
            from_type: user1.user_id.includes('bot') ? 'bot' : 'user',
            to_type: user2.user_id.includes('bot') ? 'bot' : 'user'
          }
        });
      }
    }

    console.log(`🔗 Created ${features.length} connections`);

    const source = map.current.getSource('connections') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features
      });
    }
  }, [users]);

  // Position tracking optimizat
  useEffect(() => {
    if (!channel.current) return;

    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            
            if (latitude >= ROMANIA_BOUNDS[1] && latitude <= ROMANIA_BOUNDS[3] &&
                longitude >= ROMANIA_BOUNDS[0] && longitude <= ROMANIA_BOUNDS[2]) {
              
              const updatedPosition = { lat: latitude, lng: longitude };

              const now = Date.now();
              if (now - lastUpdate.current > 3000) {
                channel.current.track({
                  user_id: userId.current,
                  color: '#00ff00',
                  position: updatedPosition,
                  online_at: new Date().toISOString()
                });
              }

              setUsers(prev => ({
                ...prev,
                [userId.current]: {
                  ...prev[userId.current],
                  position: updatedPosition
                }
              }));

              if (markers.current[userId.current]) {
                markers.current[userId.current].setLngLat([longitude, latitude]);
              }
            }
          },
          null,
          { maximumAge: 10000, timeout: 5000 }
        );
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={mapContainer} className="w-full h-screen bg-black" />
  );
};

export default MapContainer;
