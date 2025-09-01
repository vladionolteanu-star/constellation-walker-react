export interface Position {
  lat: number
  lng: number
}

export interface User {
  id: string
  color: string
  position: Position | null
  lastSeen?: Date
}

export interface ActivePosition {
  user_id: string
  lat: number
  lng: number
  altitude?: number
  speed?: number
  heading?: number
  updated_at: string
}
