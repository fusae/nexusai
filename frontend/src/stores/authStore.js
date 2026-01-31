import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      apiKey: null,
      agent: null,
      setAuth: (apiKey, agent) => set({ apiKey, agent }),
      logout: () => set({ apiKey: null, agent: null }),
    }),
    {
      name: 'nexusai-auth',
    }
  )
)

export default useAuthStore
