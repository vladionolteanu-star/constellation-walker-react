import React, { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { supabase } from "../../services/supabase";
import { getStaticBots, syncUserToSupabase } from "../../utils/botSystem";
import type { User } from "../../utils/botSystem";
import type { RealtimeChannel } from "@supabase/supabase-js";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoidmxhZHN0YXIiLCJhIjoiY21lcXVrZWRkMDR2MDJrczczYTFvYTBvMiJ9.H36WPQ21h1CTjbEb32AT1g";

// Configurație artistică
const ARTISTIC_CONFIG = {
  colors: {
    self: {
      primary: "#a8ff78",
      glow: "rgba(168, 255, 120, 0.6)",
      pulse: "rgba(168, 255, 120, 0.3)"
    },
    bot: {
      primary: "#ff6b9d",
      glow: "rgba(255, 107, 157, 0.5)",
      pulse: "rgba(255, 107, 157, 0.2)"
    },
    user: {
      primary: "#66d9ef",
      glow: "rgba(102, 217, 239, 0.6)",
      pulse: "rgba(102, 217, 239, 0.3)"
    },
    connection: {
      gradient: ["#a8ff78", "#78ffd6", "#66d9ef", "#ff6b9d"],
      opacity: 0.4
    }
  },
  animation: {
    pulseDuration: 3000,
    breathDuration: 4000,
    connectionFlow: 6000
  }
};

// Funcție debounce simplă
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

const MapContainer: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const users = useRef<Map<string, User>>(new Map());
  const userId = useRef<string>(`user-${Date.now()}`);
  const channel = useRef<RealtimeChannel | null>(null);

  // Creare element marker artistic
  const createMarkerElement = useCallback((user: User) => {
    const el = document.createElement("div");
    const isBot = user.user_id.includes("bot");
    const isSelf = user.user_id === userId.current;
    
    const config = isSelf 
      ? ARTISTIC_CONFIG.colors.self 
      : isBot 
        ? ARTISTIC_CONFIG.colors.bot 
        : ARTISTIC_CONFIG.colors.user;

    // Container principal
    el.className = "marker-container";
    el.style.cssText = `
      width: 32px;
      height: 32px;
      position: relative;
    `;

    // Nucleu central
    const core = document.createElement("div");
    core.style.cssText = `
      position: absolute;
      width: 12px;
      height: 12px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle at 40% 40%, 
        white 0%, 
        ${config.primary} 30%, 
        transparent 70%);
      border-radius: 50%;
      filter: blur(0.5px);
    `;

    // Aură interioară
    const innerGlow = document.createElement("div");
    innerGlow.style.cssText = `
      position: absolute;
      width: 20px;
      height: 20px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, 
        ${config.glow} 0%, 
        transparent 60%);
      border-radius: 50%;
      opacity: 0.8;
    `;

    // Aură exterioară pentru user și boti
    if (isSelf || isBot) {
      const outerGlow = document.createElement("div");
      outerGlow.style.cssText = `
        position: absolute;
        width: 32px;
        height: 32px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: radial-gradient(circle, 
          ${config.pulse} 0%, 
          transparent 70%);
        border-radius: 50%;
        opacity: 0.6;
      `;
      el.appendChild(outerGlow);
    }

    el.appendChild(innerGlow);
    el.appendChild(core);

    return el;
  }, []);

  // Actualizare marker
  const upsertMarker = useCallback(
    (user: User) => {
      if (!map.current || !user?.position?.lat || !user?.position?.lng) return;

      const existingMarker = markers.current.get(user.user_id);
      
      if (existingMarker) {
        existingMarker.setLngLat([user.position.lng, user.position.lat]);
      } else {
        const el = createMarkerElement(user);
        el.style.opacity = "0";
        
        const marker = new mapboxgl.Marker({ 
          element: el, 
          anchor: "center"
        })
          .setLngLat([user.position.lng, user.position.lat])
          .addTo(map.current);
        
        markers.current.set(user.user_id, marker);
        
        // Fade-in
        requestAnimationFrame(() => {
          el.style.transition = "opacity 1s ease-in";
          el.style.opacity = "1";
        });
      }

      users.current.set(user.user_id, user);
    },
    [createMarkerElement]
  );

  // Actualizare conexiuni cu debounce
  const updateConnectionsRaw = useCallback(() => {
    if (!map.current) return;

    const source = map.current.getSource("connections") as mapboxgl.GeoJSONSource;
    if (!source) return;

    const userList = Array.from(users.current.values());
    
    if (userList.length < 2) {
      source.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const features: any[] = [];
    const processedPairs = new Set<string>();

    userList.forEach((userA, i) => {
      userList.slice(i + 1).forEach((userB) => {
        const pairId = [userA.user_id, userB.user_id].sort().join("-");
        
        if (!processedPairs.has(pairId) && userA.position && userB.position) {
          processedPairs.add(pairId);
          
          const distance = Math.sqrt(
            Math.pow(userA.position.lat - userB.position.lat, 2) +
            Math.pow(userA.position.lng - userB.position.lng, 2)
          );
          
          features.push({
            type: "Feature",
            properties: {
              distance: distance,
              isBot: userA.user_id.includes("bot") || userB.user_id.includes("bot"),
              isSelf: userA.user_id === userId.current || userB.user_id === userId.current
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [userA.position.lng, userA.position.lat],
                [userB.position.lng, userB.position.lat]
              ]
            }
          });
        }
      });
    });

    source.setData({ type: "FeatureCollection", features: features });
  }, []);

  // Versiune debounced
  const updateConnections = useCallback(
    debounce(updateConnectionsRaw, 150),
    [updateConnectionsRaw]
  );

  // Setup layers hartă
  const setupMapLayers = useCallback(() => {
    if (!map.current) return;

    if (!map.current.getSource("connections")) {
      map.current.addSource("connections", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      });

      map.current.addLayer({
        id: "connections",
        type: "line",
        source: "connections",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": [
            "interpolate",
            ["linear"],
            ["get", "distance"],
            0, ARTISTIC_CONFIG.colors.connection.gradient[0],
            0.01, ARTISTIC_CONFIG.colors.connection.gradient[1],
            0.02, ARTISTIC_CONFIG.colors.connection.gradient[2],
            0.05, ARTISTIC_CONFIG.colors.connection.gradient[3]
          ],
          "line-width": [
            "interpolate",
            ["exponential", 1.5],
            ["zoom"],
            10, 1,
            15, 2.5,
            18, 4
          ],
          "line-opacity": [
            "interpolate",
            ["linear"],
            ["get", "distance"],
            0, ARTISTIC_CONFIG.colors.connection.opacity,
            0.05, ARTISTIC_CONFIG.colors.connection.opacity * 0.3
          ],
          "line-blur": 1
        }
      });

      // Glow layer
      map.current.addLayer({
        id: "connections-glow",
        type: "line",
        source: "connections",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#ffffff",
          "line-width": [
            "interpolate",
            ["exponential", 1.5],
            ["zoom"],
            10, 0.5,
            15, 1,
            18, 2
          ],
          "line-opacity": 0.2,
          "line-blur": 3
        }
      }, "connections");
    }
  }, []);

  // Setup realtime
  const setupRealtime = useCallback(() => {
    if (channel.current) {
      channel.current.unsubscribe();
      channel.current = null;
    }

    setTimeout(() => {
      channel.current = supabase
        .channel("user-tracking")
        .on("presence", { event: "join" }, ({ newPresences }) => {
          if (Array.isArray(newPresences)) {
            newPresences.forEach((presence: any) => {
              const user = presence as User;
              if (user.user_id !== userId.current && !user.user_id.includes("bot")) {
                upsertMarker(user);
                updateConnections();
              }
            });
          }
        })
        .on("presence", { event: "leave" }, ({ leftPresences }) => {
          if (Array.isArray(leftPresences)) {
            leftPresences.forEach((presence: any) => {
              const user = presence as User;
              const marker = markers.current.get(user.user_id);
              if (marker) {
                marker.remove();
                markers.current.delete(user.user_id);
                users.current.delete(user.user_id);
                updateConnections();
              }
            });
          }
        })
        .subscribe((status) => {
          console.log("Supabase status:", status);
        });
    }, 500);
  }, [upsertMarker, updateConnections]);

  // Zona pentru ECHO
  const prepareEchoSystem = useCallback(() => {
    console.log("Echo system ready");
  }, []);

  // Inițializare hartă
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/vladstar/cmetspgr7003g01sc2aeub7yg",
      center: [26.1025, 44.4268],
      zoom: 14,
      pitch: 45,
      bearing: -17,
      antialias: true,
      maxZoom: 18,
      minZoom: 11
    });

    map.current.on("load", () => {
      setupMapLayers();
      prepareEchoSystem();

      // Inițializare useri statici
      const staticBots = getStaticBots();
      const currentUserData: User = {
        user_id: userId.current,
        color: ARTISTIC_CONFIG.colors.self.primary,
        position: { lat: 44.427, lng: 26.107 }
      };

      // Adaugă user curent
      upsertMarker(currentUserData);
      users.current.set(userId.current, currentUserData);
      syncUserToSupabase(currentUserData, channel.current);

      // Adaugă boti
      Object.values(staticBots).forEach((bot) => {
        upsertMarker(bot);
        users.current.set(bot.user_id, bot);
        syncUserToSupabase(bot, channel.current);
      });

      updateConnections();
      setupRealtime();

      // Geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const updatedUser: User = {
              user_id: userId.current,
              color: ARTISTIC_CONFIG.colors.self.primary,
              position: {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              }
            };
            
            upsertMarker(updatedUser);
            updateConnections();
            
            if (channel.current) {
              syncUserToSupabase(updatedUser, channel.current);
            }
            
            map.current?.flyTo({
              center: [pos.coords.longitude, pos.coords.latitude],
              zoom: 15,
              duration: 2000
            });
          },
          (err) => {
            console.warn("Location error:", err);
          },
          { 
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 60000
          }
        );
      }
    });

    // Cleanup
    return () => {
      if (channel.current) {
        channel.current.unsubscribe();
        channel.current = null;
      }
      markers.current.forEach((marker) => marker.remove());
      markers.current.clear();
      users.current.clear();
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-screen bg-black"
      style={{
        background: "radial-gradient(circle at center, #0a0a0a 0%, #000000 100%)"
      }}
    />
  );
};

export default MapContainer;
