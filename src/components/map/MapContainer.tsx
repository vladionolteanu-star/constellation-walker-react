import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '../config/supabase';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoidmxhZHN0YXIiLCJhIjoiY21lcXVrZWRkMDR2MDJrczczYTFvYTBvMiJ9.H36WPQ21h1CTjbEb32AT1g';

interface User {
  id: string;
  lat: number;
  lng: number;
  name: string;
  isBot?: boolean;
  isCurrentUser?: boolean;
}

const MapContainer: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  const markers = useRef<Record<string, mapboxgl.Marker>>({});
  const userId = useRef(`user-${Date.now()}-${Math.random()}`);

  // Bot de test - poziție fixă București
  const TEST_BOT: User = {
    id: 'bot-nebula-001',
    lat: 44.4268,
    lng: 26.1025,
    name: 'Nebula Bot',
    isBot: true
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/vladstar/cmetspgr7003g01sc2aeub7yg',
      center: [26.1025, 44.4268],
      zoom: 13,
      pitch: 45
    });

    map.current.on('load', () => {
      setupMapLayers();
      addBot();
      startTracking();
      setupRealtime();
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  const setupMapLayers = () => {
    if (!map.current) return;

    // Source pentru linii
    map.current.addSource('connections', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Glow layer
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

    // Main line layer
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

  const addBot = () => {
    addUserToMap(TEST_BOT);
    setUsers(prev => ({ ...prev, [TEST_BOT.id]: TEST_BOT }));
  };

  const startTracking = () => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const user: User = {
            id: userId.current,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: 'You',
            isCurrentUser: true
          };
          
          addUserToMap(user);
          setUsers(prev => ({ ...prev, [user.id]: user }));
          broadcastPosition(user);
        },
        (error) => {
          console.error('GPS Error:', error);
          // Fallback - poziție random în București
          const user: User = {
            id: userId.current,
            lat: 44.4268 + (Math.random() - 0.5) * 0.05,
            lng: 26.1025 + (Math.random() - 0.5) * 0.05,
            name: 'You',
            isCurrentUser: true
          };
          
          addUserToMap(user);
          setUsers(prev => ({ ...prev, [user.id]: user }));
          broadcastPosition(user);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );
    }
  };

  const broadcastPosition = async (user: User) => {
    try {
      await supabase.channel('presence').send({
        type: 'broadcast',
        event: 'location_update',
        payload: user
      });
    } catch (error) {
      console.error('Broadcast error:', error);
    }
  };

  const setupRealtime = () => {
    supabase
      .channel('presence')
      .on('broadcast', { event: 'location_update' }, ({ payload }) => {
        if (payload.id !== userId.current) {
          addUserToMap(payload);
          setUsers(prev => ({ ...prev, [payload.id]: payload }));
        }
      })
      .subscribe();
  };

  const addUserToMap = (user: User) => {
    if (!map.current) return;

    // Remove existing marker if exists
    if (markers.current[user.id]) {
      markers.current[user.id].remove();
    }

    // Create marker element
    const el = document.createElement('div');
    el.className = 'user-marker';
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid #fff';
    el.style.cursor = 'pointer';
    
    if (user.isCurrentUser) {
      el.style.background = '#00ff00';
      el.style.boxShadow = '0 0 30px #00ff00';
    } else if (user.isBot) {
      el.style.background = '#ff00ff';
      el.style.boxShadow = '0 0 30px #ff00ff';
    } else {
      el.style.background = '#00ffff';
      el.style.boxShadow = '0 0 30px #00ffff';
    }

    // Create marker
    const marker = new mapboxgl.Marker(el)
      .setLngLat([user.lng, user.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div style="background: black; color: #00ffff; padding: 5px; font-family: monospace;">
          ${user.name}
        </div>
      `))
      .addTo(map.current);

    markers.current[user.id] = marker;
  };

  // Update connections when users change
  useEffect(() => {
    if (!map.current) return;
    
    const userList = Object.values(users);
    if (userList.length < 2) return;

    const features = [];
    
    // Create connections between all users
    for (let i = 0; i < userList.length; i++) {
      for (let j = i + 1; j < userList.length; j++) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [userList[i].lng, userList[i].lat],
              [userList[j].lng, userList[j].lat]
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
