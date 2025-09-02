import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '../../services/supabase';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoidmxhZHN0YXIiLCJhIjoiY21lcXVrZWRkMDR2MDJrczczYTFvYTBvMiJ9.H36WPQ21h1CTjbEb32AT1g';

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

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/vladstar/cmetspgr7003g01sc2aeub7yg',
      center: [26.1025, 44.4268],
      zoom: 13,
      pitch: 45,
      antialias: false, // Performance
      preserveDrawingBuffer: false // Performance
    });

    map.current.on('load', () => {
      setupMapLayers();
      addStaticBot();
      initializeUser();
      setupRealtime();
    });

    return () => {
      channel.current?.unsubscribe();
      map.current?.remove();
    };
  }, []);

  const setupMapLayers = () => {
    if (!map.current) return;

    // Neural network style connections
    map.current.addSource('connections', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Multiple glow layers for neural effect
    map.current.addLayer({
      id: 'connection-outer-glow',
      type: 'line',
      source: 'connections',
      paint: {
        'line-color': '#00ffff',
        'line-width': 20,
        'line-opacity': 0.1,
        'line-blur': 20
      }
    });

    map.current.addLayer({
      id: 'connection-mid-glow',
      type: 'line',
      source: 'connections',
      paint: {
        'line-color': '#00ffff',
        'line-width': 8,
        'line-opacity': 0.3,
        'line-blur': 8
      }
    });

    map.current.addLayer({
      id: 'connection-core',
      type: 'line',
      source: 'connections',
      paint: {
        'line-color': '#ffffff',
        'line-width': 1,
        'line-opacity': 0.9
      }
    });
  };

  const addStaticBot = () => {
    const bot: User = {
      user_id: 'bot-nebula',
      color: '#ff00ff',
      position: { lat: 44.4268, lng: 26.1025 }
    };
    
    addUserToMap(bot);
    setUsers(prev => ({ ...prev, [bot.user_id]: bot }));
  };

  const initializeUser = () => {
    // Start with default position
    const defaultUser: User = {
      user_id: userId.current,
      color: '#00ff00',
      position: { lat: 44.428, lng: 26.104 }
    };
    
    addUserToMap(defaultUser);
    setUsers(prev => ({ ...prev, [defaultUser.user_id]: defaultUser }));

    // Try real GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const updatedUser: User = {
            user_id: userId.current,
            color: '#00ff00',
            position: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          };
          
          updateUserPosition(updatedUser);
          
          // Broadcast to others
          if (channel.current) {
            channel.current.track(updatedUser);
          }
        },
        (error) => {
          console.log('Using default position');
          // Broadcast default position
          if (channel.current) {
            channel.current.track(defaultUser);
          }
        }
      );
    }
  };

  const setupRealtime = () => {
    channel.current = supabase.channel('online-users');
    
    channel.current
      .on('presence', { event: 'sync' }, () => {
        const state = channel.current.presenceState();
        
        Object.keys(state).forEach(key => {
          const presences = state[key];
          if (presences?.[0] && presences[0].user_id !== userId.current) {
            const user = presences[0];
            addUserToMap(user);
            setUsers(prev => ({ ...prev, [user.user_id]: user }));
          }
        });
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((user: User) => {
          if (user.user_id !== userId.current) {
            addUserToMap(user);
            setUsers(prev => ({ ...prev, [user.user_id]: user }));
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((user: User) => {
          removeUserFromMap(user.user_id);
          setUsers(prev => {
            const newUsers = { ...prev };
            delete newUsers[user.user_id];
            return newUsers;
          });
        });
      })
      .subscribe();
  };

  const addUserToMap = (user: User) => {
    if (!map.current) return;
    
    if (markers.current[user.user_id]) {
      markers.current[user.user_id].remove();
    }

    const el = document.createElement('div');
    el.style.width = '25px';
    el.style.height = '25px';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid rgba(255,255,255,0.9)';
    el.style.position = 'relative';
    
    // Pulse animation
    el.style.animation = 'pulse 2s infinite';
    
    if (user.user_id === userId.current) {
      el.style.backgroundColor = '#00ff00';
      el.style.boxShadow = '0 0 30px #00ff00';
    } else if (user.user_id.includes('bot')) {
      el.style.backgroundColor = '#ff00ff';
      el.style.boxShadow = '0 0 30px #ff00ff';
    } else {
      el.style.backgroundColor = user.color || '#00ffff';
      el.style.boxShadow = `0 0 30px ${user.color || '#00ffff'}`;
    }

    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat([user.position.lng, user.position.lat])
      .addTo(map.current);

    markers.current[user.user_id] = marker;
  };

  const updateUserPosition = (user: User) => {
    if (markers.current[user.user_id]) {
      markers.current[user.user_id].setLngLat([user.position.lng, user.position.lat]);
    } else {
      addUserToMap(user);
    }
    setUsers(prev => ({ ...prev, [user.user_id]: user }));
  };

  const removeUserFromMap = (userId: string) => {
    if (markers.current[userId]) {
      markers.current[userId].remove();
      delete markers.current[userId];
    }
  };

  // Update neural connections
  useEffect(() => {
    if (!map.current) return;
    
    const userList = Object.values(users);
    if (userList.length < 2) return;

    const features = [];
    
    // Connect all users (triangle, square, etc)
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

    const source = map.current.getSource('connections') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features
      });
    }
  }, [users]);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      `}</style>
      <div ref={mapContainer} className="w-full h-screen bg-black" />
    </>
  );
};

export default MapContainer;
