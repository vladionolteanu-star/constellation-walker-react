export interface Echo {
  id: string
  user_id: string
  lat: number
  lng: number
  content_type: 'audio' | 'video' | 'photo' | 'text' | 'mood'
  content_url?: string
  mood_color?: string
  decay_date: string
  created_at: string
  interaction_count: number
}

export interface EchoStore {
  echoes: Echo[]
  isRecording: boolean
  mediaType: string | null
  
  addEcho: (echo: Echo) => void
  removeEcho: (echoId: string) => void
  startRecording: (type: string) => void
  stopRecording: () => void
}
