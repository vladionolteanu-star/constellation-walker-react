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
  const userId = useRef(`user-${Date.now()}-${Math.random()}`);
  const channel = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/vladstar/cmetspgr7003g01sc2aeub7yg',
      center: [26.1025, 44.4268],
      zoom: 14,
      pitch: 45,
      maxBounds: [
        [25.8, 44.2],
        [26.4, 44.6]
      ]
    });

    map.current.on('load', () => {
      console.log('Map loaded');
      setupMapLayers();
      startTracking();
      setupRealtime();
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

    map.current.addLayer({
      id: 'connection-glow',
      type: 'line',
      source: 'connections',
      paint: {
        'line-color': '#00ffff',
        'line-width': 12,
        'line-opacity': 0.2,
        'line-blur': 12
      }
    });

    map.current.addLayer({
      id: 'connection-lines',
      type: 'line',
      source: 'connections',
      paint: {
        'line-color': '#00ffff',
        'line-width': 2,
        'line-opacity': 0.8
      }
    });
  };

  const startTracking = () => {
    console.log('Starting GPS tracking...');
    
    const testPosition = {
      lat: 44.4268 + (Math.random() - 0.5) * 0.01,
      lng: 26.1025 + (Math.random() - 0.5) * 0.01
    };
    
    if (channel.current) {
      channel.current.track({
        user_id: userId.current,
        color: '#00ff00',
        position: testPosition
      }).then(() => {
        console.log('User tracked:', userId.current);
      });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('GPS position:', position.coords);
          const userPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          if (channel.current) {
            await channel.current.track({
              user_id: userId.current,
              color: '#00ff00',
              position: userPosition
            });
          }
        },
        (error) => {
          console.error('GPS Error:', error);
        }
      );
    }
  };

  const setupRealtime = () => {
    console.log('Setting up realtime...');
    
    const testBot = {
      user_id: 'bot-test-static',
      color: '#ff00ff',
      position: {
        lat: 44.4268,
        lng: 26.1025
      }
    };
    addUserToMap(testBot);
    setUsers(prev => ({ ...prev, [testBot.user_id]: testBot }));
    
    const myPosition = {
      user_id: userId.current,
      color: '#00ff00',
      position: {
        lat: 44.4268 + 0.005,
        lng: 26.1025 + 0.005
      }
    };
    addUserToMap(myPosition);
    setUsers(prev => ({ ...prev, [myPosition.user_id]: myPosition }));
    
    channel.current = supabase.channel('online-users');
    
    channel.current
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence sync');
        const state = channel.current.presenceState();
        console.log('Presence state:', state);
        const allUsers = {};
        Object.entries(state).forEach(([key, presences]) => {
          presences.forEach((presence: User) => {
            allUsers[presence.user_id] = presence;
          });
        });
        setUsers(allUsers);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
        newPresences.forEach((presence: User) => {
          addUserToMap(presence);
          setUsers(prev => ({ ...prev, [presence.user_id]: presence }));
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
        leftPresences.forEach((presence: User) => {
          if (markers.current[presence.user_id]) {
            markers.current[presence.user_id].remove();
            delete markers.current[presence.user_id];
          }
          setUsers(prev => {
            const newUsers = { ...prev };
            delete newUsers[presence.user_id];
            return newUsers;
          });
        });
      })
      .subscribe(async (status) => {
        console.log('Channel status:', status);
        if (status === 'SUBSCRIBED') {
          const testPosition = {
            lat: 44.4268 + (Math.random() - 0.5) * 0.01,
            lng: 26.1025 + (Math.random() - 0.5) * 0.01
          };
          
          await channel.current.track({
            user_id: userId.current,
            color: '#00ff00',
            position: testPosition
          });
        }
      });
  };

  const addUserToMap = (user: User) => {
    if (!map.current) return;
    console.log('Adding user to map:', user);

    if (markers.current[user.user_id]) {
      markers.current[user.user_id].remove();
    }

    const el = document.createElement('div');
    el.className = 'user-marker';
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid #fff';
    el.style.cursor = 'pointer';
    
    if (user.user_id === userId.current) {
      el.style.background = '#00ff00';
      el.style.boxShadow = '0 0 30px #00ff00';
    }
    else if (user.user_id.startsWith('bot-')) {
      el.style.background = '#ff00ff';
      el.style.boxShadow = '0 0 30px #ff00ff';
    }
    else {
      el.style.background = user.color || '#00ffff';
      el.style.boxShadow = `0 0 30px ${user.color || '#00ffff'}`;
    }

    const marker = new mapboxgl.Marker(el)
      .setLngLat([user.position.lng, user.position.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div style="background: black; color: #00ffff; padding: 5px; font-family: monospace;">
          ${user.user_id.startsWith('bot-') ? 'Bot' : user.user_id === userId.current ? 'You' : 'User'}
        </div>
      `))
      .addTo(map.current);

    markers.current[user.user_id] = marker;
  };

  useEffect(() => {
    if (!map.current) return;
    
    const userList = Object.values(users);
    console.log('Updating connections for users:', userList.length);
    
    if (userList.length < 2) return;

    const features = [];
    
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
    <div 
      ref={mapContainer} 
      className="w-full h-screen bg-black"
    />
  );
};

export default MapContainer;
