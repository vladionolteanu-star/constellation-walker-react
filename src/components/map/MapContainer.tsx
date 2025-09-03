import React, { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { supabase } from "../../services/supabase";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoidmxhZHN0YXIiLCJhIjoiY21lcXVrZWRkMDR2MDJrczczYTFvYTBvMiJ9.H36WPQ21h1CTjbEb32AT1g";

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
  const markers = useRef<Record<string, mapboxgl.Marker>>({});
  const users = useRef<Record<string, User>>({});
  const userId = useRef(`user-${Date.now()}`);
  const channel = useRef<any>(null);

  /** 🧩 Create premium glowing marker */
  const createMarkerElement = useCallback((user: User) => {
    const el = document.createElement("div");
    el.style.cssText = `
      width: 28px; 
      height: 28px; 
      border-radius: 50%; 
      border: 2px solid white;
      background: radial-gradient(circle at 30% 30%, ${
        user.user_id === userId.current
          ? "#00ff88"
          : user.user_id.includes("bot")
          ? "#ff00ff"
          : "#00e0ff"
      }, black 70%);
      box-shadow: 0 0 12px 4px ${
        user.user_id === userId.current
          ? "rgba(0,255,136,0.8)"
          : user.user_id.includes("bot")
          ? "rgba(255,0,255,0.8)"
          : "rgba(0,224,255,0.8)"
      };
    `;
    return el;
  }, []);

  /** 🧩 Add or update marker */
  const upsertMarker = useCallback(
    (user: User) => {
      if (!map.current) return;

      if (markers.current[user.user_id]) {
        markers.current[user.user_id].setLngLat([
          user.position.lng,
          user.position.lat,
        ]);
      } else {
        const el = createMarkerElement(user);
        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([user.position.lng, user.position.lat])
          .addTo(map.current);
        markers.current[user.user_id] = marker;
      }

      users.current[user.user_id] = user;
    },
    [createMarkerElement]
  );

  /** 🧩 Draw connections between users (debounced) */
  const updateConnections = useCallback(
    debounce((userList: User[]) => {
      if (!map.current || userList.length < 2) return;

      const features = [];
      for (let i = 0; i < userList.length; i++) {
        for (let j = i + 1; j < userList.length; j++) {
          features.push({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [userList[i].position.lng, userList[i].position.lat],
                [userList[j].position.lng, userList[j].position.lat],
              ],
            },
          });
        }
      }

      const source = map.current.getSource("connections") as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({ type: "FeatureCollection", features });
      }
    }, 150),
    []
  );

  /** 🧩 Setup layers */
  const setupMapLayers = useCallback(() => {
    if (!map.current) return;

    if (!map.current.getSource("connections")) {
      map.current.addSource("connections", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.current.addLayer({
        id: "connections",
        type: "line",
        source: "connections",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            "#00e0ff",
            18,
            "#ff00ff",
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            1.5,
            18,
            4,
          ],
          "line-opacity": 0.75,
        },
      });
    }
  }, []);

  /** 🧩 Setup realtime */
  const setupRealtime = useCallback(() => {
    if (channel.current) channel.current.unsubscribe();

    channel.current = supabase
      .channel("user-tracking")
      .on("presence", { event: "join" }, ({ newPresences }) => {
        newPresences.forEach((user: User) => {
          if (user.user_id !== userId.current && !user.user_id.includes("bot")) {
            upsertMarker(user);
            updateConnections(Object.values(users.current));
          }
        });
      })
      .subscribe();
  }, [upsertMarker, updateConnections]);

  /** 🧩 Init map */
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/vladstar/cmetspgr7003g01sc2aeub7yg",
      center: [26.1025, 44.4268],
      zoom: 14,
      pitch: 50,
      antialias: true,
      maxZoom: 18,
      minZoom: 10,
      preserveDrawingBuffer: false,
    });

    map.current.on("load", () => {
      setupMapLayers();

      // Static demo users
      const staticUsers: Record<string, User> = {
        "bot-alpha": {
          user_id: "bot-alpha",
          color: "#ff00ff",
          position: { lat: 44.4268, lng: 26.1025 },
        },
        "bot-beta": {
          user_id: "bot-beta",
          color: "#ff00ff",
          position: { lat: 44.425, lng: 26.105 },
        },
        "bot-gamma": {
          user_id: "bot-gamma",
          color: "#ff00ff",
          position: { lat: 44.429, lng: 26.103 },
        },
        [userId.current]: {
          user_id: userId.current,
          color: "#00ff88",
          position: { lat: 44.427, lng: 26.107 },
        },
      };

      Object.values(staticUsers).forEach(upsertMarker);
      users.current = staticUsers;

      updateConnections(Object.values(users.current));
      setupRealtime();

      // GPS update
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const updatedUser: User = {
              user_id: userId.current,
              color: "#00ff88",
              position: {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              },
            };
            upsertMarker(updatedUser);
            updateConnections(Object.values(users.current));
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
      if (channel.current) channel.current.unsubscribe();
      Object.values(markers.current).forEach((m) => m.remove());
      markers.current = {};
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [setupMapLayers, upsertMarker, setupRealtime, updateConnections]);

  return <div ref={mapContainer} className="w-full h-screen bg-black" />;
};

/** Utility: Debounce */
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export default MapContainer;
