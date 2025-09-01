export interface MapViewport {
  longitude: number
  latitude: number
  zoom: number
  pitch: number
  bearing: number
}

export interface MapMarker {
  id: string
  type: 'user' | 'echo'
  position: {
    lat: number
    lng: number
  }
  data: any
}

export interface ConstellationLine {
  id: string
  from: {
    lat: number
    lng: number
  }
  to: {
    lat: number
    lng: number
  }
  distance: number
  opacity: number
}
