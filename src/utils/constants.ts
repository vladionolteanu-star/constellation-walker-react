// Direct values - no environment variables
export const MAPBOX_TOKEN = 'pk.eyJ1IjoidmxhZHN0YXIiLCJhIjoiY21lcXVrZWRkMDR2MDJrczczYTFvYTBvMiJ9.H36WPQ21h1CTjbEb32AT1g'
export const MAPBOX_STYLE = 'mapbox://styles/vladstar/cmetspgr7003g01sc2aeub7yg'

export const STAR_COLORS = [
  '#00D4FF', // Cyan
  '#FF00EA', // Magenta
  '#FFD700', // Gold
  '#00FF88', // Mint
  '#FF6B6B', // Coral
  '#A78BFA', // Purple
  '#60A5FA', // Sky
  '#F472B6'  // Pink
]

// Removed distance limits
export const CONNECTION_DISTANCE = 1000000000 // effectively unlimited
export const MAX_CONNECTIONS = 100 // increased from 7
export const POSITION_UPDATE_INTERVAL = 2000 // decreased from 3000 for more frequent updates

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Map default viewport
export const DEFAULT_VIEWPORT = {
  latitude: 44.4268,
  longitude: 26.1025,
  zoom: 13,
  pitch: 60,
  bearing: 0
}

// Animation durations
export const ANIMATION_DURATION = {
  SHORT: 300,
  MEDIUM: 500,
  LONG: 1000,
  VERY_LONG: 2000
}

// Map bounds
export const MAP_BOUNDS = {
  maxLatitude: 85,
  minLatitude: -85,
  maxLongitude: 180,
  minLongitude: -180
}

// Map controls
export const MAP_CONTROLS = {
  maxZoom: 20,
  minZoom: 10,
  maxPitch: 85,
  minPitch: 0
}

// Visual effects
export const EFFECTS = {
  glowIntensity: 0.8,
  pulseSpeed: 2,
  trailLength: 0.5,
  connectionOpacity: 0.8,
  markerSize: {
    current: 8,
    other: 6
  }
}

export function generateStarColor() {
  return STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]
}

// ADD THIS MISSING FUNCTION
export function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
