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

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/vladstar/cmetspgr7003g01sc2aeub7yg',
      center: [26.1025, 44.4268], // București centru
      zoom: 13,
      pitch: 45
    });

    map.current.on('load', () => {
      console.log('Map loaded');
      setupMapLayers();
      
      // Add test bot immediately
      const testBot: User = {
        user_id: 'bot-test',
        color: '#ff00ff',
        position: {
          lat: 44.4268,
          lng: 26.1025
        }
      };
      
      // Add you near the bot
      const myUser: User = {
        user_id: userId.current,
        color: '#00ff00',
        position: {
          lat: 44.4280,  // Slightly north
          lng: 26.1040   // Slightly east
        }
      };
      
      // Add both to map
      addUserToMap(testBot);
      addUserToMap(myUser);
      
      // Store in state
      setUsers({
        [testBot.user_id]: testBot,
        [myUser.user_id]: myUser
      });
      
      // Center map between both markers
      map.current?.flyTo({
        center: [26.1032, 44.4274],
        zoom: 15,
        duration: 2000
      });
      
      // Get real GPS position
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Got GPS:', position.coords);
            // Update your position
            const updatedUser: User = {
              user_id: userId.current,
              color: '#00ff00',
              position: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }
            };
            
            addUserToMap(updatedUser);
            setUsers(prev => ({
              ...prev,
              [updatedUser.user_id]: updatedUser
            }));
            
            // Center on your real position
            map.current?.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 15,
              duration: 2000
            });
          },
          (error) => {
            console.log('GPS error, using default position');
          }
        );
      }
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

  const addUserToMap = (user: User) => {
    if (!map.current) return;
    
    // Remove existing marker
    if (markers.current[user.user_id]) {
      markers.current[user.user_id].remove();
    }

    // Create visible marker element with fixed size
    const el = document.createElement('div');
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.borderRadius = '50%';
    el.style.border = '3px solid #ffffff';
    el.style.cursor = 'pointer';
    el.style.position = 'relative';
    
    // Colors based on user type
    if (user.user_id === userId.current) {
      // You - green
      el.style.backgroundColor = '#00ff00';
      el.style.boxShadow = '0 0 40px #00ff00, 0 0 60px #00ff00';
    } else if (user.user_id.includes('bot')) {
      // Bot - magenta
      el.style.backgroundColor = '#ff00ff';
      el.style.boxShadow = '0 0 40px #ff00ff, 0 0 60px #ff00ff';
    } else {
      // Other users - cyan
      el.style.backgroundColor = '#00ffff';
      el.style.boxShadow = '0 0 40px #00ffff, 0 0 60px #00ffff';
    }

    // Create marker
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat([user.position.lng, user.position.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="background: black; color: #00ffff; padding: 10px; font-family: monospace; border: 1px solid #00ffff;">
          ${user.user_id.includes('bot') ? '🤖 Bot' : user.user_id === userId.current ? '⭐ You' : '👤 User'}
        </div>
      `))
      .addTo(map.current);

    markers.current[user.user_id] = marker;
    console.log('Added marker for:', user.user_id, 'at', user.position);
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
