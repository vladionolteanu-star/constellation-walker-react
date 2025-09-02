export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoidmxhZHN0YXIiLCJhIjoiY21lcXVrZWRkMDR2MDJrczczYTFvYTBvMiJ9.H36WPQ21h1CTjbEb32AT1g'
export const MAPBOX_STYLE = import.meta.env.VITE_MAPBOX_STYLE || 'mapbox://styles/vladstar/cmetspgr7003g01sc2aeub7yg'

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

export const CONNECTION_DISTANCE = 500 // meters
export const MAX_CONNECTIONS = 7
export const POSITION_UPDATE_INTERVAL = 3000 // ms
export const STATIONARY_TIME = 5000 // ms before showing echo button

export const generateStarColor = () => {
  return STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]
}

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
