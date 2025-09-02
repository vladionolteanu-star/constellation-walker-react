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
      
      // Add 3 static bots
      const bot1: User = {
        user_id: 'bot-alpha',
        color: '#ff00ff',
        position: { lat: 44.4268, lng: 26.1025 }
      };
      
      const bot2: User = {
        user_id: 'bot-beta',
        color: '#ff00ff',
        position: { lat: 44.425, lng: 26.105 }
      };
      
      const bot3: User = {
        user_id: 'bot-gamma',
        color: '#ff00ff',
        position: { lat: 44.429, lng: 26.103 }
      };
      
      // Add you
      const myUser: User = {
        user_id: userId.current,
        color: '#00ff00',
        position: { lat: 44.427, lng: 26.107 }
      };
      
      // Add all to map
      [bot1, bot2, bot3, myUser].forEach(user => {
        addUserToMap(user);
      });
      
      // Store all users
      setUsers({
        [bot1.user_id]: bot1,
        [bot2.user_id]: bot2,
        [bot3.user_id]: bot3,
        [myUser.user_id]: myUser
      });
      
      // Setup realtime for other users
      setupRealtime();
      
      // Get real GPS
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
            
            if (channel.current) {
              channel.current.track(updatedUser);
            }
          }
        );
      }
    });

    return () => {
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
    channel.current = supabase.channel('online-users');
    
    channel.current
      .on('presence', { event: 'sync' }, () => {
        const state = channel.current.presenceState();
        console.log('Sync:', state);
        
        Object.keys(state).forEach(key => {
          const presences = state[key];
          if (presences?.[0] && presences[0].user_id !== userId.current && !presences[0].user_id.includes('bot')) {
            const user = presences[0];
            addUserToMap(user);
            setUsers(prev => ({ ...prev, [user.user_id]: user }));
          }
        });
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('Join:', newPresences);
        newPresences.forEach((user: User) => {
          if (user.user_id !== userId.current && !user.user_id.includes('bot')) {
            addUserToMap(user);
            setUsers(prev => ({ ...prev, [user.user_id]: user }));
          }
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
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid white';
    
    if (user.user_id === userId.current) {
      el.style.backgroundColor = '#00ff00';
      el.style.boxShadow = '0 0 40px #00ff00';
    } else if (user.user_id.includes('bot')) {
      el.style.backgroundColor = '#ff00ff';
      el.style.boxShadow = '0 0 40px #ff00ff';
    } else {
      el.style.backgroundColor = '#00ffff';
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

  // Update connections
  useEffect(() => {
    if (!map.current) return;
    
    const userList = Object.values(users);
    if (userList.length < 2) return;

    const features = [];
    
    // Connect all users
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
    <div ref={mapContainer} className="w-full h-screen bg-black" />
  );
};

export default MapContainer;
