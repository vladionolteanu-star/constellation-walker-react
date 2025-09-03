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
      zoom: 14,
      pitch: 45
    });

    map.current.on('load', () => {
      setupMapLayers();
      
      // Add 3 static bots to everyone's view
      const staticBots: User[] = [
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
        }
      ];

      // Add bots to map and state
      const initialUsers: Record<string, User> = {};
      staticBots.forEach(bot => {
        addUserToMap(bot);
        initialUsers[bot.user_id] = bot;
      });

      setUsers(initialUsers);
      
      // Setup realtime BEFORE adding current user
      setupRealtime();
      
      // Get real GPS and add current user
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const myUser: User = {
              user_id: userId.current,
              color: '#00ff00',
              position: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }
            };
            
            // Add current user to map
            addUserToMap(myUser);
            setUsers(prev => ({ ...prev, [myUser.user_id]: myUser }));
            
            // Track current user position in presence
            if (channel.current) {
              channel.current.track({
                user_id: myUser.user_id,
                color: myUser.color,
                position: myUser.position,
                online_at: new Date().toISOString()
              });
            }
          },
          () => {
            // Fallback position if GPS fails
            const myUser: User = {
              user_id: userId.current,
              color: '#00ff00',
              position: { lat: 44.427, lng: 26.107 }
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
          }
        );
      }
    });

    return () => {
      channel.current?.untrack();
      channel.current?.unsubscribe();
      map.current?.remove();
    };
  }, []);

  const setupMapLayers = () => {
    if (!map.current) return;

    map.current.addSource('connections', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Neural network effect
    map.current.addLayer({
      id: 'connection-glow-1',
      type: 'line',
      source: 'connections',
      paint: {
        'line-color': '#00ffff',
        'line-width': 15,
        'line-opacity': 0.1,
        'line-blur': 15
      }
    });

    map.current.addLayer({
      id: 'connection-glow-2',
      type: 'line',
      source: 'connections',
      paint: {
        'line-color': '#00ffff',
        'line-width': 6,
        'line-opacity': 0.3,
        'line-blur': 6
      }
    });

    map.current.addLayer({
      id: 'connection-core',
      type: 'line',
      source: 'connections',
      paint: {
        'line-color': '#ffffff',
        'line-width': 1.5,
        'line-opacity': 0.8
      }
    });
  };

  const setupRealtime = () => {
    channel.current = supabase.channel('constellation-users', {
      config: {
        presence: {
          key: userId.current
        }
      }
    });
    
    channel.current
      .on('presence', { event: 'sync' }, () => {
        const state = channel.current.presenceState();
        console.log('🔄 Presence sync:', state);
        
        // Process all users in presence state
        Object.entries(state).forEach(([key, presences]) => {
          const presence = presences[0]; // Get first presence
          if (presence && presence.user_id && presence.user_id !== userId.current) {
            // Don't add bots from presence (they're already added statically)
            if (!presence.user_id.includes('bot')) {
              console.log('👤 Adding user from sync:', presence.user_id);
              const user: User = {
                user_id: presence.user_id,
                color: presence.color || '#00ffff',
                position: presence.position
              };
              addUserToMap(user);
              setUsers(prev => ({ ...prev, [user.user_id]: user }));
            }
          }
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 User joined:', key, newPresences);
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
        console.log('👋 User left:', key, leftPresences);
        leftPresences.forEach((presence: any) => {
          if (presence.user_id !== userId.current && !presence.user_id.includes('bot')) {
            // Remove user from map
            if (markers.current[presence.user_id]) {
              markers.current[presence.user_id].remove();
              delete markers.current[presence.user_id];
            }
            setUsers(prev => {
              const updated = { ...prev };
              delete updated[presence.user_id];
              return updated;
            });
          }
        });
      })
      .subscribe();
  };

  const addUserToMap = (user: User) => {
    if (!map.current) return;
    
    // Remove existing marker if any
    if (markers.current[user.user_id]) {
      markers.current[user.user_id].remove();
    }

    const el = document.createElement('div');
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid white';
    
    // Color coding
    if (user.user_id === userId.current) {
      el.style.backgroundColor = '#00ff00'; // Green for current user
      el.style.boxShadow = '0 0 40px #00ff00';
    } else if (user.user_id.includes('bot')) {
      el.style.backgroundColor = '#ff00ff'; // Magenta for bots
      el.style.boxShadow = '0 0 40px #ff00ff';
    } else {
      el.style.backgroundColor = '#00ffff'; // Cyan for other users
      el.style.boxShadow = '0 0 40px #00ffff';
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
    }
    setUsers(prev => ({ ...prev, [user.user_id]: user }));
  };

  // Update connections when users change
  useEffect(() => {
    if (!map.current) return;
    
    const userList = Object.values(users);
    if (userList.length < 2) return;

    const features = [];
    
    // Connect all users to each other
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

  // Track position updates
  useEffect(() => {
    if (!channel.current) return;

    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const updatedPosition = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

            // Update presence with new position
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
            if (markers.current[userId.current]) {
              markers.current[userId.current].setLngLat([updatedPosition.lng, updatedPosition.lat]);
            }
          }
        );
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={mapContainer} className="w-full h-screen bg-black" />
  );
};

export default MapContainer;
