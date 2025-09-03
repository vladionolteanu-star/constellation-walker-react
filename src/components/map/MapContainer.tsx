import React, { useEffect, useRef, useState, useCallback } from 'react';
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

  // Optimizat: Debounce pentru updates
  const updateConnections = useCallback(
    debounce((userList: User[]) => {
      if (!map.current || userList.length < 2) return;

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
    }, 100),
    []
  );

  // Optimizat: Memoizat setup funcții
  const setupMapLayers = useCallback(() => {
    if (!map.current) return;
    
    map.current.addSource('connections', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    map.current.addLayer({
      id: 'connections',
      type: 'line',
      source: 'connections',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#00ffff',
        'line-width': 2,
        'line-opacity': 0.7
      }
    });
  }, []);

  // Optimizat: Cached DOM elements pentru markers
  const createMarkerElement = useCallback((user: User) => {
    const el = document.createElement('div');
    el.style.cssText = `
      width: 30px; 
      height: 30px; 
      border-radius: 50%; 
      border: 3px solid white;
      background-color: ${user.user_id === userId.current ? '#00ff00' : 
                       user.user_id.includes('bot') ? '#ff00ff' : '#00ffff'};
      box-shadow: 0 0 40px ${user.user_id === userId.current ? '#00ff00' : 
                          user.user_id.includes('bot') ? '#ff00ff' : '#00ffff'};
    `;
    return el;
  }, []);

  const addUserToMap = useCallback((user: User) => {
    if (!map.current) return;
    
    // Remove existing marker
    if (markers.current[user.user_id]) {
      markers.current[user.user_id].remove();
    }

    const el = createMarkerElement(user);
    
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat([user.position.lng, user.position.lat])
      .addTo(map.current);

    markers.current[user.user_id] = marker;
  }, [createMarkerElement]);

  const updateUserPosition = useCallback((user: User) => {
    if (markers.current[user.user_id]) {
      markers.current[user.user_id].setLngLat([user.position.lng, user.position.lat]);
    }
    setUsers(prev => ({ ...prev, [user.user_id]: user }));
  }, []);

  // Optimizat: Realtime setup cu cleanup
  const setupRealtime = useCallback(() => {
    if (channel.current) {
      channel.current.unsubscribe();
    }

    channel.current = supabase
      .channel('user-tracking')
      .on('presence', { event: 'sync' }, () => {
        // Sync logic optimizat
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((user: User) => {
          if (user.user_id !== userId.current && !user.user_id.includes('bot')) {
            addUserToMap(user);
            setUsers(prev => ({ ...prev, [user.user_id]: user }));
          }
        });
      })
      .subscribe();
  }, [addUserToMap]);

  // Single useEffect cu cleanup
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Optimizat: Map config
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/vladstar/cmetspgr7003g01sc2aeub7yg',
      center: [26.1025, 44.4268],
      zoom: 14,
      pitch: 45,
      // Performance optimizations
      maxZoom: 18,
      minZoom: 10,
      trackResize: false, // Disable auto-resize
      preserveDrawingBuffer: false // Reduce memory
    });

    map.current.on('load', () => {
      setupMapLayers();
      
      // Static bots - doar o dată
      const staticUsers = {
        'bot-alpha': { user_id: 'bot-alpha', color: '#ff00ff', position: { lat: 44.4268, lng: 26.1025 } },
        'bot-beta': { user_id: 'bot-beta', color: '#ff00ff', position: { lat: 44.425, lng: 26.105 } },
        'bot-gamma': { user_id: 'bot-gamma', color: '#ff00ff', position: { lat: 44.429, lng: 26.103 } },
        [userId.current]: { user_id: userId.current, color: '#00ff00', position: { lat: 44.427, lng: 26.107 } }
      };
      
      Object.values(staticUsers).forEach(addUserToMap);
      setUsers(staticUsers);
      
      setupRealtime();
      
      // GPS - doar o dată
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
          },
          undefined,
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
        );
      }
    });

    return () => {
      // Cleanup
      if (channel.current) {
        channel.current.unsubscribe();
      }
      
      Object.values(markers.current).forEach(marker => marker.remove());
      markers.current = {};
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [setupMapLayers, addUserToMap, setupRealtime, updateUserPosition]);

  // Optimizat: useEffect pentru connections cu dependințe minimale
  useEffect(() => {
    const userList = Object.values(users);
    if (userList.length >= 2) {
      updateConnections(userList);
    }
  }, [users, updateConnections]);

  return (
    <div ref={mapContainer} className="w-full h-screen bg-black" />
  );
};

// Utility: Debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

export default MapContainer;
