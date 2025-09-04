import React from 'react'

export default function MapContainer() {
  console.log('🗺️ MapContainer is rendering!')
  
  return (
    <div className="absolute inset-0 bg-red-500 flex items-center justify-center">
      <div className="text-white text-2xl">
        MAP CONTAINER TEST
      </div>
    </div>
  )
}
