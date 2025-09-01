import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Echo } from '../types/echo.types'

interface EchoState {
  echoes: Echo[]
  isRecording: boolean
  mediaType: string | null
  
  addEcho: (echo: Echo) => void
  removeEcho: (echoId: string) => void
  startRecording: (type: string) => void
  stopRecording: () => void
  loadEchoes: (echoes: Echo[]) => void
}

export const useEchoStore = create<EchoState>()(
  devtools(
    (set, get) => ({
      echoes: [],
      isRecording: false,
      mediaType: null,

      addEcho: (echo) => {
        set((state) => ({
          echoes: [...state.echoes, echo]
        }))
      },

      removeEcho: (echoId) => {
        set((state) => ({
          echoes: state.echoes.filter(echo => echo.id !== echoId)
        }))
      },

      startRecording: (type) => {
        set({
          isRecording: true,
          mediaType: type
        })
      },

      stopRecording: () => {
        set({
          isRecording: false,
          mediaType: null
        })
      },

      loadEchoes: (echoes) => {
        set({ echoes })
      }
    }),
    { name: 'EchoStore' }
  )
)
