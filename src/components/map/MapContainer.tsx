import React, { useEffect, useRef, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import { supabase } from "../services/supabase";
import { getStaticBots, User, syncUserToSupabase } from "../utils/botSystem";
import { RealtimeChannel } from "@supabase/supabase-js";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoidmxhZHN0YXIiLCJhIjoiY21lcXVrZWRkMDR2MDJrczczYTFvYTBvMiJ9.H36WPQ21h1CTjbEb32AT1g";

// Configurație artistică
const ARTISTIC_CONFIG = {
  colors: {
    self: {
      primary: "#a8ff78", // verde luminos organic
      glow: "rgba(168, 255, 120, 0.6)",
      pulse: "rgba(168, 255, 120, 0.3)"
    },
    bot: {
      primary: "#ff6b9d", // roz poetic
      glow: "rgba(255, 107, 157, 0.5)",
      pulse: "rgba(255, 107, 157, 0.2)"
    },
    user: {
      primary: "#66d9ef", // cyan senin
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

const MapContainer: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const users = useRef<Map<string, User>>(new Map());
  const userId = useRef(`user-${Date.now()}`);
  const channel = useRef<RealtimeChannel | null>(null);
  const animationFrame = useRef<number | null>(null);
  const connectionUpdateTimer = useRef<NodeJS.Timeout | null>(null);

  // Funcție pentru a crea element marker mai artistic
  const createMarkerElement = useCallback((user: User) => {
    const el = document.createElement("div");
    const isBot = user.user_id.includes("bot");
    const isSelf = user.user_id === userId.current;
    
    const config = isSelf 
      ? ARTISTIC_CONFIG.colors.self 
      : isBot 
        ? ARTISTIC_CONFIG.colors.bot 
        : ARTISTIC_CONFIG.colors.user;

    // Container principal cu animație de respirație
    el.className = "marker-container";
    el.style.cssText = `
      width: 32px;
      height: 32px;
      position: relative;
      animation: breathe ${ARTISTIC_CONFIG.animation.breathDuration}ms ease-in-out infinite;
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
      animation: pulse ${ARTISTIC_CONFIG.animation.pulseDuration}ms ease-in-out infinite;
    `;

    // Aură exterioară (doar pentru utilizatorul curent și boți)
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
        animation: pulse-slow ${ARTISTIC_CONFIG.animation.pulseDuration * 1.5}ms ease-in-out infinite;
      `;
      el.appendChild(outerGlow);
    }

    el.appendChild(innerGlow);
    el.appendChild(core);

    // Adaugă stiluri CSS pentru animații
    if (!document.querySelector("#marker-animations")) {
      const style = document.createElement("style");
      style.id = "marker-animations";
      style.textContent = `
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.8;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 0.4;
          }
        }
        @keyframes pulse-slow {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0.2;
          }
        }
      `;
      document.head.appendChild(style);
    }

    return el;
  }, []);

  // Actualizare marker optimizată cu tranziție smooth
  const upsertMarker = useCallback(
    (user: User) => {
      if (!map.current || !user?.position?.lat || !user?.position?.lng) return;

      const existingMarker = markers.current.get(user.user_id);
      
      if (existingMarker) {
        // Actualizare smooth a poziției
        existingMarker.setLngLat([user.position.lng, user.position.lat]);
      } else {
        // Creare marker nou cu efect de fade-in
        const el = createMarkerElement(user);
        el.style.opacity = "0";
        
        const marker = new mapboxgl.Marker({ 
          element: el, 
          anchor: "center",
          rotationAlignment: "viewport",
          pitchAlignment: "viewport"
        })
          .setLngLat([user.position.lng, user.position.lat])
          .addTo(map.current);
        
        markers.current.set(user.user_id, marker);
        
        // Animație fade-in
        requestAnimationFrame(() => {
          el.style.transition = "opacity 1s ease-in";
          el.style.opacity = "1";
        });
      }

      users.current.set(user.user_id, user);
    },
    [createMarkerElement]
  );

  // Actualizare conexiuni optimizată și artistică
  const updateConnections = useCallback(() => {
    if (!map.current) return;

    // Debounce pentru performanță
    if (connectionUpdateTimer.current) {
      clearTimeout(connectionUpdateTimer.current);
    }

    connectionUpdateTimer.current = setTimeout(() => {
      const source = map.current?.getSource("connections") as mapboxgl.GeoJSONSource;
      if (!source) return;

      const userList = Array.from(users.current.values());
      if (userList.length < 2) {
        source.setData({ type: "FeatureCollection", features: [] });
        return;
      }

      const features: any[] = [];
      const processedPairs = new Set<string>();

      // Creare conexiuni cu metadata pentru styling
      userList.forEach((userA, i) => {
        userList.slice(i + 1).forEach((userB) => {
          const pairId = [userA.user_id, userB.user_id].sort().join("-");
          
          if (!processedPairs.has(pairId) && userA.position && userB.position) {
            processedPairs.add(pairId);
            
            // Calculare distanță pentru opacity gradient
            const distance = Math.sqrt(
              Math.pow(userA.position.lat - userB.position.lat, 2) +
              Math.pow(userA.position.lng - userB.position.lng, 2)
            );
            
            features.push({
              type: "Feature",
              properties: {
                distance,
                isBot: userA.user_id.includes("bot") || userB.user_id.includes("bot"),
                isSelf: userA.user_id === userId.current || userB.user_id === userId.current
              },
              geometry: {
                type: "LineString",
                coordinates: [
                  [userA.position.lng, userA.position.lat],
                  [userB.position.lng, userB.position.lat],
                ],
              },
            });
          }
        });
      });

      source.setData({ type: "FeatureCollection", features });
    }, 100);
  }, []);

  // Setup straturi hartă cu stil artistic
  const setupMapLayers = useCallback(() => {
    if (!map.current) return;

    // Adaugă sursă pentru conexiuni
    if (!map.current.getSource("connections")) {
      map.current.addSource("connections", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // Layer pentru conexiuni cu gradient artistic
      map.current.addLayer({
        id: "connections",
        type: "line",
        source: "connections",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": [
            "interpolate",
            ["linear"],
            ["get", "distance"],
            0, ARTISTIC_CONFIG.colors.connection.gradient[0],
            0.01, ARTISTIC_CONFIG.colors.connection.gradient[1],
            0.02, ARTISTIC_CONFIG.colors.connection.gradient[2],
            0.05, ARTISTIC_CONFIG.colors.connection.gradient[3],
          ],
          "line-width": [
            "interpolate",
            ["exponential", 1.5],
            ["zoom"],
            10, 1,
            15, 2.5,
            18, 4,
          ],
          "line-opacity": [
            "interpolate",
            ["linear"],
            ["get", "distance"],
            0, ARTISTIC_CONFIG.colors.connection.opacity,
            0.05, ARTISTIC_CONFIG.colors.connection.opacity * 0.3,
          ],
          "line-blur": 1,
        },
      });

      // Layer pentru glow effect
      map.current.addLayer({
        id: "connections-glow",
        type: "line",
        source: "connections",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#ffffff",
          "line-width": [
            "interpolate",
            ["exponential", 1.5],
            ["zoom"],
            10, 0.5,
            15, 1,
            18, 2,
          ],
          "line-opacity": 0.2,
          "line-blur": 3,
        },
      }, "connections");
    }
  }, []);

  // Setup realtime optimizat
  const setupRealtime = useCallback(() => {
    if (channel.current) {
      channel.current.unsubscribe();
      channel.current = null;
    }

    // Delay pentru stabilitate
    setTimeout(() => {
      channel.current = supabase
        .channel("user-tracking")
        .on("presence", { event: "join" }, ({ newPresences }) => {
          newPresences.forEach((user: User) => {
            if (user.user_id !== userId.current && !user.user_id.includes("bot")) {
              upsertMarker(user);
              updateConnections();
            }
          });
        })
        .on("presence", { event: "leave" }, ({ leftPresences }) => {
          leftPresences.forEach((user: User) => {
            const marker = markers.current.get(user.user_id);
            if (marker) {
              marker.remove();
              markers.current.delete(user.user_id);
              users.current.delete(user.user_id);
              updateConnections();
            }
          });
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("✨ Connected to emotional network");
          }
        });
    }, 500);
  }, [upsertMarker, updateConnections]);

  // ZONĂ PREGĂTITĂ PENTRU FUNCȚIA ECHO
  // ====================================
  // Aici vom adăuga funcționalitatea de echo
  // când utilizatorii lasă emoții/mesaje în locații
  const prepareEchoSystem = useCallback(() => {
    // TODO: Sistem de echo pentru emoții
    // - Salvare emoții în locații
    // - Afișare ecouri ale altor utilizatori
    // - Animații pentru ecouri noi
    console.log("🎭 Echo system ready for implementation");
  }, []);
  // ====================================

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
      minZoom: 11,
      fadeDuration: 300,
    });

    map.current.on("load", () => {
      // Configurări pentru performanță
      map.current!.setRenderWorldCopies(false);
      
      setupMapLayers();
      prepareEchoSystem();

      // Inițializare utilizatori și boți
      const staticUsers = {
        ...getStaticBots(),
        [userId.current]: {
          user_id: userId.current,
          color: ARTISTIC_CONFIG.colors.self.primary,
          position: { lat: 44.427, lng: 26.107 },
        },
      };

      Object.values(staticUsers).forEach((user) => {
        upsertMarker(user);
        syncUserToSupabase(user, channel.current);
      });
      
      staticUsers && Object.entries(staticUsers).forEach(([id, user]) => {
        users.current.set(id, user);
      });

      updateConnections();
      setupRealtime();

      // Geolocation cu fallback elegant
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const updatedUser: User = {
              user_id: userId.current,
              color: ARTISTIC_CONFIG.colors.self.primary,
              position: {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              },
            };
            upsertMarker(updatedUser);
            updateConnections();
            
            if (channel.current) {
              syncUserToSupabase(updatedUser, channel.current);
            }
            
            // Pan smooth către locația utilizatorului
            map.current?.flyTo({
              center: [pos.coords.longitude, pos.coords.latitude],
              zoom: 15,
              duration: 2000,
              essential: true,
            });
          },
          (err) => {
            console.warn("📍 Using default location");
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
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (connectionUpdateTimer.current) {
        clearTimeout(connectionUpdateTimer.current);
      }
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
  }, [setupMapLayers, upsertMarker, setupRealtime, updateConnections, prepareEchoSystem]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-screen bg-black"
      style={{
        background: "radial-gradient(circle at center, #0a0a0a 0%, #000000 100%)",
      }}
    />
  );
};

export default MapContainer;
