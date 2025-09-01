import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface MapState {
  viewport: {
    longitude: number
    latitude: number
    zoom: number
    pitch: number
    bearing: number
  }
  markers: any[]
  
  setViewport: (viewport: any) => void
  addMarker: (marker: any) => void
  removeMarker: (markerId: string) => void
  updateMarker: (markerId: string, data: any) => void
}

export const useMapStore = create<MapState>()(
  devtools(
    (set, get) => ({
      viewport: {
        longitude: 26.1246, // Bucharest coordinates
        latitude: 44.4808,
        zoom: 15,
        pitch: 45,
        bearing: -17.6
      },
      markers: [],

      setViewport: (viewport) => {
        set({ viewport })
      },

      addMarker: (marker) => {
        set((state) => ({
          markers: [...state.markers.filter(m => m.id !== marker.id), marker]
        }))
      },

      removeMarker: (markerId) => {
        set((state) => ({
          markers: state.markers.filter(m => m.id !== markerId)
        }))
      },

      updateMarker: (markerId, data) => {
        set((state) => ({
          markers: state.markers.map(marker =>
            marker.id === markerId ? { ...marker, ...data } : marker
          )
        }))
      }
    }),
    { name: 'MapStore' }
  )
)
